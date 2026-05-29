/**
 * Scroll preservation debug against production.
 * Tests whether scrollTop survives admin sidebar navigation.
 */
const { chromium } = require('playwright');

const PROD  = 'https://project1-flame-phi.vercel.app';
const EMAIL = 'findcardsupport@gmail.com';
const PASS  = 'F123456c!';

async function login(page) {
  await page.goto(`${PROD}/admin/login`);
  await page.waitForSelector('input[type="password"]', { timeout: 10000 });
  await page.fill('input[type="email"], input[name="email"]', EMAIL);
  await page.fill('input[type="password"], input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 15000 });
  console.log('✓ Logged in');
}

async function getMainScrollTop(page) {
  return page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? main.scrollTop : -1;
  });
}

async function getMainScrollHeight(page) {
  return page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? { scrollHeight: main.scrollHeight, clientHeight: main.clientHeight } : null;
  });
}

async function scrollMainTo(page, px) {
  await page.evaluate((px) => {
    const main = document.querySelector('main');
    if (main) main.scrollTop = px;
  }, px);
  await page.waitForTimeout(500);
  return getMainScrollTop(page);
}

async function clickSidebarLinkDirect(page, href) {
  // Click using the actual sidebar link element
  const selector = `aside a[href="${href}"], nav a[href="${href}"]`;
  const link = page.locator(selector).first();
  const count = await link.count();
  if (count > 0) {
    console.log(`  ↪ clicking sidebar link: ${href}`);
    await link.click();
  } else {
    console.log(`  ↪ no sidebar link found for ${href}, navigating directly`);
    await page.goto(`${PROD}${href}`);
  }
}

async function waitForContentLoaded(page) {
  // Wait for loading skeletons to disappear and real content to appear
  await page.waitForTimeout(300);
  // Wait until scrollHeight > clientHeight (real content loaded, page is scrollable)
  let waited = 0;
  while (waited < 5000) {
    const dims = await getMainScrollHeight(page);
    if (dims && dims.scrollHeight > dims.clientHeight + 100) break;
    await page.waitForTimeout(200);
    waited += 200;
  }
  await page.waitForTimeout(200);
}

async function main() {
  console.log('=== Admin Scroll Preservation Test (Production) ===\n');

  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();

  page.on('console', m => {
    if (m.type() === 'error') console.log('  [JS ERROR]', m.text());
  });

  await login(page);

  // ── Phase 1: DOM structure inspection ──────────────────────────────────────
  console.log('\n=== Phase 1: DOM Structure ===');
  await page.goto(`${PROD}/admin/orders`);
  await waitForContentLoaded(page);

  const domInfo = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return 'NO MAIN ELEMENT';
    const children = Array.from(main.children).map(c => ({
      tag: c.tagName,
      class: c.className.slice(0, 80),
      scrollHeight: c.scrollHeight,
    }));
    return {
      mainClass: main.className,
      mainScrollHeight: main.scrollHeight,
      mainClientHeight: main.clientHeight,
      mainScrollTop: main.scrollTop,
      children,
    };
  });
  console.log(JSON.stringify(domInfo, null, 2));

  // ── Phase 2: Can we even scroll? ───────────────────────────────────────────
  console.log('\n=== Phase 2: Scroll feasibility ===');
  const dims = await getMainScrollHeight(page);
  console.log(`  main.scrollHeight=${dims?.scrollHeight}  main.clientHeight=${dims?.clientHeight}  overflow=${dims ? dims.scrollHeight - dims.clientHeight : 'N/A'}px`);

  const scrollTarget = Math.min(1000, (dims?.scrollHeight || 0) - (dims?.clientHeight || 0) - 50);
  if (scrollTarget <= 0) {
    console.log('  ⚠ Page is NOT scrollable — content fits in viewport. Testing with whatever is available.');
  }

  // ── Phase 3: Core scroll preservation test ─────────────────────────────────
  console.log('\n=== Phase 3: Scroll Preservation Tests ===');

  const pairs = [
    { from: '/admin/orders',    to: '/admin/security',  label: 'orders → security' },
    { from: '/admin/security',  to: '/admin/analytics', label: 'security → analytics' },
    { from: '/admin/analytics', to: '/admin/orders',    label: 'analytics → orders' },
  ];

  let passed = 0, failed = 0;

  for (const { from, to, label } of pairs) {
    console.log(`\n--- Test: ${label} ---`);

    await page.goto(`${PROD}${from}`);
    await waitForContentLoaded(page);

    const { scrollHeight, clientHeight } = await getMainScrollHeight(page) || { scrollHeight: 0, clientHeight: 0 };
    const maxScroll = Math.max(0, scrollHeight - clientHeight);
    const target = Math.min(500, maxScroll);
    console.log(`  Page: scrollHeight=${scrollHeight} clientHeight=${clientHeight} maxScroll=${maxScroll} scrollingTo=${target}`);

    if (target < 10) {
      console.log('  ⏭ SKIP — page too short to meaningfully scroll');
      continue;
    }

    const actualScrolled = await scrollMainTo(page, target);
    console.log(`  Scrolled to: ${actualScrolled}px`);

    // Click sidebar link
    await clickSidebarLinkDirect(page, to);
    await page.waitForTimeout(1500); // let navigation + content settle

    const afterNav = await getMainScrollTop(page);
    console.log(`  After nav scroll: ${afterNav}px`);

    const drift = afterNav;  // If it resets to top, afterNav ≈ 0
    if (drift < 5) {
      console.log(`  ❌ FAIL — scroll jumped to top (afterNav=${afterNav})`);
      failed++;

      // Deep diagnostics for the failure
      const diagInfo = await page.evaluate(() => {
        const main = document.querySelector('main');
        const wrap = main?.children[1]; // contentWrapRef (after mobile top bar)
        return {
          mainScrollTop: main?.scrollTop,
          mainScrollHeight: main?.scrollHeight,
          mainClientHeight: main?.clientHeight,
          wrapMinHeight: wrap ? getComputedStyle(wrap).minHeight : 'N/A',
          wrapScrollHeight: wrap?.scrollHeight,
          pathname: window.location.pathname,
        };
      });
      console.log('  DIAG:', JSON.stringify(diagInfo));
    } else if (Math.abs(afterNav - actualScrolled) > 80) {
      console.log(`  ⚠ PARTIAL — expected ~${actualScrolled}, got ${afterNav} (drift=${Math.abs(afterNav - actualScrolled)}px)`);
      failed++;
    } else {
      console.log(`  ✅ PASS — scroll preserved at ${afterNav}px`);
      passed++;
    }
  }

  // ── Phase 4: Check if Next.js router is overriding scroll ──────────────────
  console.log('\n=== Phase 4: Router Scroll Behavior Trace ===');
  await page.goto(`${PROD}/admin/orders`);
  await waitForContentLoaded(page);
  await scrollMainTo(page, 400);

  // Intercept what happens to scrollTop DURING navigation
  const scrollLog = await page.evaluate(() => {
    return new Promise(resolve => {
      const main = document.querySelector('main');
      if (!main) { resolve([]); return; }

      const log = [`init: scrollTop=${main.scrollTop}`];
      const observer = new MutationObserver(() => {
        log.push(`mutation: scrollTop=${main.scrollTop} scrollHeight=${main.scrollHeight}`);
      });
      observer.observe(main, { childList: true, subtree: true, attributes: false });

      // Also log scrollTop changes
      let lastST = main.scrollTop;
      const interval = setInterval(() => {
        if (main.scrollTop !== lastST) {
          log.push(`scrollChange: ${lastST} → ${main.scrollTop}`);
          lastST = main.scrollTop;
        }
      }, 50);

      // Resolve after 3 seconds
      setTimeout(() => {
        observer.disconnect();
        clearInterval(interval);
        resolve(log);
      }, 3000);
    });
  });

  // Now trigger a navigation WHILE the observer is running
  // Note: the evaluate promise already started, so we navigate from outside
  await page.waitForTimeout(200); // let observer start
  const sidebarLink = page.locator('aside a[href="/admin/security"]').first();
  if (await sidebarLink.count() > 0) {
    await sidebarLink.click();
  }
  await page.waitForTimeout(3000); // let the observer finish

  console.log('  Scroll timeline during navigation:');
  // scrollLog may not be populated since evaluate returned early; let's check what we got
  const lastLog = await page.evaluate(() => window.__scrollLog || []);
  console.log('  (window.__scrollLog not set — checking final state)');
  const finalState = await page.evaluate(() => {
    const main = document.querySelector('main');
    const wrap = main?.children[1];
    return {
      scrollTop: main?.scrollTop,
      scrollHeight: main?.scrollHeight,
      wrapMinHeight: wrap ? getComputedStyle(wrap).minHeight : 'N/A',
    };
  });
  console.log('  Final state after nav:', JSON.stringify(finalState));

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
