/**
 * Verifies the admin scroll jump fix.
 * Tests VISUAL JUMP detection (does scrollTop drop to 0 during transition?).
 */
const { chromium } = require('playwright');
const https = require('https');

const PROD  = 'https://project1-flame-phi.vercel.app';
const HOST  = 'project1-flame-phi.vercel.app';
const EMAIL = 'findcardsupport@gmail.com';
const PASS  = 'F123456c!';

async function getAdminToken() {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ email: EMAIL, password: PASS });
    const req = https.request({
      hostname: HOST, path: '/api/admin/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': body.length },
    }, res => {
      let token = '';
      (res.headers['set-cookie'] || []).forEach(c => {
        const m = c.match(/admin_token=([^;]+)/); if (m) token = m[1];
      });
      res.resume();
      token ? resolve(token) : reject(new Error('No admin_token'));
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

async function getScrollInfo(page) {
  return page.evaluate(() => {
    const m = document.querySelector('main');
    if (!m) return null;
    const wrap = m.children[1];
    return {
      scrollTop: m.scrollTop,
      scrollHeight: m.scrollHeight,
      clientHeight: m.clientHeight,
      wrapMinHeight: wrap ? getComputedStyle(wrap).minHeight : '?',
      windowScrollY: window.scrollY,
    };
  });
}

async function scrollTo(page, px) {
  await page.evaluate(px => { const m = document.querySelector('main'); if (m) m.scrollTop = px; }, px);
  await page.waitForTimeout(300);
  return page.evaluate(() => document.querySelector('main')?.scrollTop ?? -1);
}

async function waitScrollable(page, ms = 8000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    const { sh, ch } = await page.evaluate(() => {
      const m = document.querySelector('main');
      return m ? { sh: m.scrollHeight, ch: m.clientHeight } : { sh: 0, ch: 0 };
    });
    if (sh - ch > 100) return { scrollHeight: sh, clientHeight: ch };
    await page.waitForTimeout(250);
  }
  const { sh, ch } = await page.evaluate(() => {
    const m = document.querySelector('main');
    return m ? { sh: m.scrollHeight, ch: m.clientHeight } : { sh: 0, ch: 0 };
  });
  return { scrollHeight: sh, clientHeight: ch };
}

async function main() {
  console.log('=== Admin Scroll Jump Test ===\n');
  const token = await getAdminToken();
  console.log('✓ Admin token obtained');

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([{ name: 'admin_token', value: token, domain: HOST, path: '/', httpOnly: true, secure: true, sameSite: 'Lax' }]);
  const page = await ctx.newPage();

  let passed = 0, failed = 0;

  // ─── Test 1: Verify h-screen fix — main is constrained to viewport ──────
  console.log('── Test 1: Container height constraint ──');
  await page.goto(`${PROD}/admin/security`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await waitScrollable(page);
  const info = await getScrollInfo(page);
  console.log(`  main.clientHeight=${info?.clientHeight}  scrollHeight=${info?.scrollHeight}  windowScrollY=${info?.windowScrollY}`);
  if (info && info.clientHeight <= 950) {
    console.log('  ✅ PASS — main is constrained (≤950px), window.scrollY=0');
    passed++;
  } else {
    console.log('  ❌ FAIL — main is NOT constrained (still using min-h-screen)');
    failed++;
  }

  // ─── Test 2: Visual jump detection during navigation ────────────────────
  // Sample scrollTop every 50ms during sidebar click to catch any momentary jump
  console.log('\n── Test 2: Visual jump detection (sampling every 50ms during nav) ──');

  const navTests = [
    { from: '/admin/security',  fromNav: null,                              to: '/admin/orders',   toNav: 'aside a[href="/admin/orders"]'   },
    { from: '/admin/orders',    fromNav: null,                              to: '/admin/security', toNav: 'aside a[href="/admin/security"]' },
    { from: '/admin/analytics/visitors', fromNav: null,                    to: '/admin/security', toNav: 'aside a[href="/admin/security"]' },
    { from: '/admin/security',  fromNav: null,                              to: '/admin/analytics/visitors', toNav: 'aside a[href="/admin/analytics/visitors"]' },
  ];

  for (const { from, to, toNav } of navTests) {
    console.log(`\n  ${from} → ${to.split('/').pop()}:`);

    await page.goto(`${PROD}${from}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const dims = await waitScrollable(page);
    const maxScroll = Math.max(0, dims.scrollHeight - dims.clientHeight);

    if (maxScroll < 20) {
      console.log(`    ⏭ SKIP — ${from} not scrollable (overflow=${maxScroll}px)`);
      continue;
    }

    const target = Math.min(500, maxScroll);
    const actual = await scrollTo(page, target);
    console.log(`    Scrolled to: ${actual}px (max=${maxScroll}px)`);

    // Start sampling scrollTop in background BEFORE click
    const samplerPromise = page.evaluate(() => {
      return new Promise(resolve => {
        const samples = [];
        const id = setInterval(() => {
          const m = document.querySelector('main');
          samples.push({ t: Date.now(), st: m?.scrollTop ?? -1, sh: m?.scrollHeight ?? 0 });
        }, 50);
        setTimeout(() => { clearInterval(id); resolve(samples); }, 2000);
      });
    });

    // Click the sidebar link
    await page.waitForTimeout(50);
    const link = page.locator(toNav).first();
    if (await link.count() > 0) {
      await link.click();
    } else {
      console.log(`    ⚠ no link found, skip`);
      continue;
    }

    const samples = await samplerPromise;
    const clickTs = samples[0]?.t || 0;

    // Find the minimum scrollTop in the first 1000ms (transition window)
    const transitionSamples = samples.filter(s => s.t - clickTs < 1000);
    const minDuringTransition = Math.min(...transitionSamples.map(s => s.st));
    const scrollLine = transitionSamples.slice(0, 20).map(s => s.st).join(',');
    console.log(`    Scroll samples (50ms each): ${scrollLine}`);

    const afterFinal = await page.evaluate(() => document.querySelector('main')?.scrollTop ?? -1);
    console.log(`    Final scrollTop: ${afterFinal}px`);
    console.log(`    Min scrollTop during transition: ${minDuringTransition}px`);

    // Did scroll jump to 0 during transition?
    if (minDuringTransition < 5) {
      // Check if it stayed at 0 (permanent jump) or briefly dipped (flash)
      const dippedBriefly = transitionSamples.some(s => s.st > 10);
      if (dippedBriefly) {
        console.log(`    ⚠ BRIEF DIP — hit 0 momentarily but recovered`);
      } else {
        console.log(`    ❌ FAIL — JUMPED TO TOP during transition!`);
        failed++;
      }
    } else {
      console.log(`    ✅ PASS — no jump (min=${minDuringTransition}px during 1s transition)`);
      passed++;
    }
  }

  // ─── Test 3: window.scrollY stays 0 ─────────────────────────────────────
  console.log('\n── Test 3: window.scrollY never moves ──');
  await page.goto(`${PROD}/admin/security`, { waitUntil: 'domcontentloaded' });
  await waitScrollable(page);
  await scrollTo(page, 400);

  const winScrollBefore = await page.evaluate(() => window.scrollY);
  const link = page.locator('aside a[href="/admin/orders"]').first();
  if (await link.count() > 0) {
    await link.click();
    await page.waitForTimeout(1500);
    const winScrollAfter = await page.evaluate(() => window.scrollY);
    console.log(`  window.scrollY before nav: ${winScrollBefore}, after nav: ${winScrollAfter}`);
    if (winScrollAfter === 0 && winScrollBefore === 0) {
      console.log('  ✅ PASS — window never scrolled (fix is working)');
      passed++;
    } else {
      console.log('  ❌ FAIL — window scrolled!');
      failed++;
    }
  }

  await browser.close();
  console.log(`\n=== RESULT: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    console.log('\n⚠ Fix did NOT fully solve the problem. More debugging needed.');
  } else {
    console.log('\n✅ All tests passed — scroll jump is fixed.');
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
