const { chromium } = require('playwright');
const https = require('https');

const PROD  = 'https://project1-flame-phi.vercel.app';
const HOST  = 'project1-flame-phi.vercel.app';
const EMAIL = 'findcardsupport@gmail.com';
const PASS  = 'F123456c!';
const TOLERANCE = 80;

async function getAdminToken() {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ email: EMAIL, password: PASS });
    const req = https.request({
      hostname: HOST, path: '/api/admin/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': body.length },
    }, res => {
      let token = '';
      (res.headers['set-cookie'] || []).forEach(c => {
        const m = c.match(/admin_token=([^;]+)/);
        if (m) token = m[1];
      });
      res.resume();
      token ? resolve(token) : reject(new Error('No admin_token'));
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

async function scrollTop(page) {
  return page.evaluate(() => document.querySelector('main')?.scrollTop ?? -1);
}

async function dims(page) {
  return page.evaluate(() => {
    const m = document.querySelector('main');
    return m ? { sh: m.scrollHeight, ch: m.clientHeight } : null;
  });
}

async function scrollTo(page, px) {
  await page.evaluate(px => { const m = document.querySelector('main'); if (m) m.scrollTop = px; }, px);
  await page.waitForTimeout(300);
  return scrollTop(page);
}

async function waitContent(page, ms = 6000) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    const d = await dims(page);
    if (d && d.sh > d.ch + 50) return d;
    await page.waitForTimeout(200);
  }
  return dims(page);
}

async function main() {
  console.log('=== Admin Scroll Verification ===\n');

  const token = await getAdminToken();
  console.log('✓ Got admin token');

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([{
    name: 'admin_token', value: token, domain: HOST,
    path: '/', httpOnly: true, secure: true, sameSite: 'Lax',
  }]);

  const page = await ctx.newPage();
  let passed = 0, failed = 0;

  // ── Step 1: Verify main is now a real scroll container ──────────────────
  console.log('── Step 1: Is <main> now a constrained scroll container? ──');
  await page.goto(`${PROD}/admin/orders`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await waitContent(page);
  const d0 = await dims(page);
  console.log(`  main.clientHeight=${d0?.ch}  scrollHeight=${d0?.sh}  overflow=${d0 ? d0.sh - d0.ch : 'N/A'}px`);
  if (d0 && d0.ch <= 920 && d0.sh > d0.ch) {
    console.log('  ✅ main is constrained (clientHeight ≈ viewport, content overflows into scroll)');
  } else if (d0 && d0.ch > 920) {
    console.log('  ❌ main.clientHeight is too large — container is still NOT constrained');
  } else {
    console.log('  ⚠  page content fits in viewport — cannot test scroll preservation');
  }

  // ── Step 2: Core scroll-preservation tests ──────────────────────────────
  console.log('\n── Step 2: Scroll preservation after sidebar nav ──');

  const tests = [
    { from: '/admin/orders',    to: '/admin/security',           nav: 'aside a[href="/admin/security"]' },
    { from: '/admin/security',  to: '/admin/analytics',          nav: 'aside a[href="/admin/analytics"]' },
    { from: '/admin/analytics/visitors', to: '/admin/orders',    nav: 'aside a[href="/admin/orders"]' },
    { from: '/admin/analytics', to: '/admin/analytics/visitors', nav: 'aside a[href="/admin/analytics/visitors"]' },
    { from: '/admin/orders',    to: '/admin/products',           nav: 'aside a[href="/admin/products"]' },
    { from: '/admin/products',  to: '/admin/ai-insights',        nav: 'aside a[href="/admin/ai-insights"]' },
  ];

  for (const { from, to, nav } of tests) {
    process.stdout.write(`\n  ${from} → ${to.split('/').pop()}: `);
    await page.goto(`${PROD}${from}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const d = await waitContent(page);
    if (!d) { process.stdout.write('⏭ no content\n'); continue; }

    const maxScroll = Math.max(0, d.sh - d.ch);
    if (maxScroll < 20) { process.stdout.write(`⏭ not scrollable (overflow=${maxScroll}px)\n`); continue; }

    const target = Math.min(600, maxScroll);
    const actual = await scrollTo(page, target);
    process.stdout.write(`scrolled to ${actual}px → `);

    // Click sidebar link
    const link = page.locator(nav).first();
    if (await link.count() > 0) {
      await link.click();
    } else {
      await page.goto(`${PROD}${to}`, { waitUntil: 'domcontentloaded' });
    }
    await page.waitForTimeout(1200);

    const after = await scrollTop(page);
    const drift = Math.abs(after - actual);

    if (after < 5) {
      process.stdout.write(`❌ FAIL jumped to 0 (expected ~${actual})\n`);
      failed++;
    } else if (drift > TOLERANCE) {
      process.stdout.write(`⚠  DRIFT ${after}px (expected ~${actual}, drift=${drift})\n`);
      failed++;
    } else {
      process.stdout.write(`✅ PASS preserved at ${after}px (drift=${drift})\n`);
      passed++;
    }
  }

  // ── Step 3: Multiple navigations in sequence ─────────────────────────────
  console.log('\n── Step 3: Multiple sequential navigations ──');
  await page.goto(`${PROD}/admin/orders`, { waitUntil: 'domcontentloaded' });
  const d3 = await waitContent(page);
  if (d3 && d3.sh - d3.ch > 100) {
    const target3 = Math.min(500, d3.sh - d3.ch);
    await scrollTo(page, target3);
    console.log(`  Starting at ${await scrollTop(page)}px`);

    const navs = [
      'aside a[href="/admin/security"]',
      'aside a[href="/admin/analytics"]',
      'aside a[href="/admin/orders"]',
    ];
    for (const nav of navs) {
      const link = page.locator(nav).first();
      if (await link.count() > 0) await link.click();
      await page.waitForTimeout(1000);
      const st = await scrollTop(page);
      console.log(`  After nav to ${nav.match(/href="([^"]+)"/)?.[1]}: scrollTop=${st}`);
    }
  }

  await browser.close();

  console.log(`\n=== RESULT: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
