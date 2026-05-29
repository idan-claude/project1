/**
 * Scroll preservation debug against production.
 * Directly injects admin cookie to skip login.
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
    }, (res) => {
      let token = '';
      (res.headers['set-cookie'] || []).forEach(c => {
        const m = c.match(/admin_token=([^;]+)/);
        if (m) token = m[1];
      });
      res.resume();
      token ? resolve(token) : reject(new Error('No admin_token in Set-Cookie'));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getMainScrollTop(page) {
  return page.evaluate(() => document.querySelector('main')?.scrollTop ?? -1);
}

async function scrollMainTo(page, px) {
  await page.evaluate((px) => {
    const el = document.querySelector('main');
    if (el) el.scrollTop = px;
  }, px);
  await page.waitForTimeout(400);
  return getMainScrollTop(page);
}

async function waitForRealContent(page, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const { sh, ch } = await page.evaluate(() => {
      const m = document.querySelector('main');
      return m ? { sh: m.scrollHeight, ch: m.clientHeight } : { sh: 0, ch: 0 };
    });
    if (sh > ch + 200) return { scrollHeight: sh, clientHeight: ch };
    await page.waitForTimeout(250);
  }
  const { sh, ch } = await page.evaluate(() => {
    const m = document.querySelector('main');
    return m ? { sh: m.scrollHeight, ch: m.clientHeight } : { sh: 0, ch: 0 };
  });
  return { scrollHeight: sh, clientHeight: ch };
}

async function main() {
  console.log('=== Admin Scroll Preservation — Production Test ===\n');

  // Get admin token via API
  console.log('Getting admin token...');
  const token = await getAdminToken();
  console.log('✓ Got admin_token:', token.slice(0, 20) + '...');

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Set admin cookie before any navigation
  await ctx.addCookies([{
    name: 'admin_token',
    value: token,
    domain: HOST,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  }]);

  const page = await ctx.newPage();
  page.on('console', m => {
    const t = m.type();
    if (t === 'error' || (t === 'log' && m.text().startsWith('[mw]'))) {
      console.log(`  [console.${t}]`, m.text());
    }
  });

  // Navigate to admin
  await page.goto(`${PROD}/admin/orders`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  console.log('✓ Navigated to /admin/orders');

  // ── DOM Structure ──────────────────────────────────────────────────────────
  const dom = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return 'NO MAIN';
    const kids = Array.from(main.children).map((c, i) => ({
      i, tag: c.tagName, class: c.className.slice(0, 60), sh: c.scrollHeight,
    }));
    return { mainClass: main.className, sh: main.scrollHeight, ch: main.clientHeight, kids };
  });
  console.log('\n── DOM Structure ──');
  console.log(JSON.stringify(dom, null, 2));

  // ── Wait for real content ──────────────────────────────────────────────────
  const dims = await waitForRealContent(page);
  console.log(`\nmain.scrollHeight=${dims.scrollHeight}  clientHeight=${dims.clientHeight}  overflow=${dims.scrollHeight - dims.clientHeight}px`);

  // ── Core scroll tests ──────────────────────────────────────────────────────
  console.log('\n── Scroll Preservation Tests ──');

  const pairs = [
    { from: '/admin/orders',    to: '/admin/security',            nav: 'aside a[href="/admin/security"]' },
    { from: '/admin/security',  to: '/admin/analytics',           nav: 'aside a[href="/admin/analytics"]' },
    { from: '/admin/analytics', to: '/admin/analytics/visitors',  nav: 'aside a[href="/admin/analytics/visitors"]' },
    { from: '/admin/analytics/visitors', to: '/admin/orders',     nav: 'aside a[href="/admin/orders"]' },
  ];

  let passed = 0, failed = 0;

  for (const { from, to, nav } of pairs) {
    console.log(`\n▶ ${from} → ${to}`);

    await page.goto(`${PROD}${from}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const d = await waitForRealContent(page);
    const maxScroll = Math.max(0, d.scrollHeight - d.clientHeight);
    const target = Math.min(600, maxScroll);

    console.log(`  scrollHeight=${d.scrollHeight} clientHeight=${d.clientHeight} maxScroll=${maxScroll} target=${target}`);

    if (target < 20) {
      console.log('  ⏭ SKIP — not enough content');
      continue;
    }

    const actual = await scrollMainTo(page, target);
    console.log(`  Scrolled to: ${actual}px`);

    // Log contentWrapRef state before click
    const beforeState = await page.evaluate(() => {
      const main = document.querySelector('main');
      const wrap = main?.children[1]; // second child = contentWrapRef
      return {
        mainScrollTop: main?.scrollTop,
        wrapMinHeight: wrap ? getComputedStyle(wrap).minHeight : 'N/A',
        wrapScrollHeight: wrap?.scrollHeight,
      };
    });
    console.log('  Before click:', JSON.stringify(beforeState));

    // Click sidebar link
    const link = page.locator(nav).first();
    if (await link.count() > 0) {
      await link.click();
    } else {
      console.log(`  ⚠ sidebar link "${nav}" not found, using goto`);
      await page.goto(`${PROD}${to}`, { waitUntil: 'domcontentloaded' });
    }

    // Sample scrollTop at multiple points during navigation
    const samples = [];
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(100);
      const st = await getMainScrollTop(page);
      samples.push(st);
    }
    console.log('  ScrollTop samples (every 100ms):', samples.join(', '));

    await page.waitForTimeout(500);
    const afterNav = await getMainScrollTop(page);

    // Log contentWrapRef state after nav
    const afterState = await page.evaluate(() => {
      const main = document.querySelector('main');
      const wrap = main?.children[1];
      return {
        mainScrollTop: main?.scrollTop,
        wrapMinHeight: wrap ? getComputedStyle(wrap).minHeight : 'N/A',
        wrapScrollHeight: wrap?.scrollHeight,
        path: window.location.pathname,
      };
    });
    console.log('  After nav:', JSON.stringify(afterState));

    if (afterNav < 5) {
      console.log(`  ❌ FAIL — jumped to top (afterNav=${afterNav})`);
      failed++;
    } else if (Math.abs(afterNav - actual) > 80) {
      console.log(`  ⚠ DRIFT — expected ~${actual}, got ${afterNav}`);
      failed++;
    } else {
      console.log(`  ✅ PASS — scroll preserved at ${afterNav}px`);
      passed++;
    }
  }

  // ── Final timing test: check minHeight is set ──────────────────────────────
  console.log('\n── MinHeight Timing Test ──');
  await page.goto(`${PROD}/admin/orders`, { waitUntil: 'domcontentloaded' });
  await waitForRealContent(page);
  await scrollMainTo(page, 400);

  let minHeightDuringNav = 'never set';
  // Inject a MutationObserver to track minHeight changes
  await page.evaluate(() => {
    window.__minHeightLog = [];
    const main = document.querySelector('main');
    const wrap = main?.children[1];
    if (!wrap) return;

    const orig = wrap.style.minHeight;
    Object.defineProperty(wrap.style, 'minHeight', {
      get() { return this._mh || ''; },
      set(v) {
        window.__minHeightLog.push({ time: Date.now(), value: v });
        this._mh = v;
      }
    });
  });

  // Click sidebar
  const secLink = page.locator('aside a[href="/admin/security"]').first();
  if (await secLink.count() > 0) {
    await secLink.click();
    await page.waitForTimeout(1500);
    const log = await page.evaluate(() => window.__minHeightLog || []);
    console.log('  minHeight changes during navigation:', JSON.stringify(log));
    const afterST = await getMainScrollTop(page);
    console.log(`  Final scrollTop: ${afterST}`);
  }

  await browser.close();
  console.log(`\n=== RESULT: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
