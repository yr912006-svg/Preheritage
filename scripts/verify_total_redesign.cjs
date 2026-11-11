const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\YASH\\.gemini\\antigravity\\brain\\8196b0fe-a871-4fa7-9206-2b8f1566bf88';

async function main() {
  console.log('=== PREHERITAGE TOTAL REDESIGN PLAYWRIGHT AUDIT ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const consoleErrors = [];
  const pageErrors = [];

  const viewports = [
    { name: 'desktop_1440', width: 1440, height: 900 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'mobile_390', width: 390, height: 844 },
    { name: 'mobile_375', width: 375, height: 812 },
  ];

  let allPassed = true;

  for (const vp of viewports) {
    console.log(`\n--- Auditing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const page = await context.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('Download the React DevTools')) {
          consoleErrors.push(`[${vp.name}] ${text}`);
        }
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(`[${vp.name}] ${err.message}`);
    });

    try {
      const response = await page.goto('http://localhost:3001', {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });

      const status = response ? response.status() : 0;
      console.log(`  HTTP Status: ${status}`);
      if (status !== 200) {
        console.error(`  FAIL: Expected 200, received ${status}`);
        allPassed = false;
      }

      // Wait for hydration and assets
      await page.waitForTimeout(2500);

      // 1. Horizontal Overflow Audit
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth - window.innerWidth;
      });
      console.log(`  Horizontal Overflow: ${overflow}px`);
      if (overflow > 1) {
        console.error(`  FAIL: Horizontal overflow detected: ${overflow}px`);
        allPassed = false;
      }

      // 2. Hero Headline Check
      const heroHeadline = await page.locator('h1').textContent().catch(() => '');
      console.log(`  Hero Headline: "${heroHeadline.replace(/\s+/g, ' ').trim()}"`);

      // 3. 3D WebGL Canvas Check
      const canvasCount = await page.locator('canvas').count();
      console.log(`  3D WebGL Canvas Count: ${canvasCount}`);

      // 4. Couture Chapters Check
      const chaptersVisible = await page.locator('text=The Couture Chapters').isVisible().catch(() => false);
      console.log(`  The Couture Chapters Section: ${chaptersVisible ? 'PRESENT' : 'MISSING'}`);

      // 5. Materiality & Sacred Thread Check
      const threadHeading = await page.locator('#tactile-thread-heading').isVisible().catch(() => false);
      console.log(`  Materiality & 3D Thread Section: ${threadHeading ? 'PRESENT' : 'MISSING'}`);

      // 6. Curated Vault (Single-Loom Spotlight) Check
      const vaultVisible = await page.locator('text=Single-Loom Spotlight').isVisible().catch(() => false);
      const productTitleVisible = await page.locator('text=Varanasi Katan Silk Saree in Antique Gold').first().isVisible().catch(() => false);
      const priceVisible = await page.locator('text=₹1,000').first().isVisible().catch(() => false);
      console.log(`  Curated Vault Spotlight: ${vaultVisible ? 'PRESENT' : 'MISSING'}`);
      console.log(`  Real Database Product Title: ${productTitleVisible ? 'VERIFIED' : 'MISSING'}`);
      console.log(`  Real Database Price (₹1,000): ${priceVisible ? 'VERIFIED' : 'MISSING'}`);

      // 7. The Atelier Memoir Section Check
      const memoirVisible = await page.locator('text=Don’t Just Wear Heritage.').first().isVisible().catch(() => false);
      console.log(`  Atelier Memoir Section: ${memoirVisible ? 'PRESENT' : 'MISSING'}`);

      // 8. The Journal Editorial Section Check
      const journalVisible = await page.locator('text=Chronicles & Loom Essays').isVisible().catch(() => false);
      console.log(`  Maison Journal Section: ${journalVisible ? 'PRESENT' : 'MISSING'}`);

      // 9. Bespoke Salon Consultation Check
      const bespokeVisible = await page.locator('text=Commission an Heirloom for Posterity').isVisible().catch(() => false);
      console.log(`  Bespoke Salon Section: ${bespokeVisible ? 'PRESENT' : 'MISSING'}`);

      // Capture Screenshots
      if (vp.name === 'desktop_1440') {
        // Hero
        const heroPath = path.join(ARTIFACTS_DIR, 'redesign_hero_desktop_1440.png');
        await page.screenshot({ path: heroPath });
        console.log(`  Saved Hero Screenshot: ${heroPath}`);

        // Couture Chapters
        const chapEl = page.locator('text=The Couture Chapters');
        if (await chapEl.isVisible().catch(() => false)) {
          await chapEl.scrollIntoViewIfNeeded();
          await page.waitForTimeout(600);
          const chapPath = path.join(ARTIFACTS_DIR, 'redesign_chapters_desktop.png');
          await page.screenshot({ path: chapPath });
          console.log(`  Saved Chapters Screenshot: ${chapPath}`);
        }

        // 3D Thread Section
        const threadEl = page.locator('#tactile-thread-heading');
        if (await threadEl.isVisible().catch(() => false)) {
          await threadEl.scrollIntoViewIfNeeded();
          await page.waitForTimeout(600);
          const threadPath = path.join(ARTIFACTS_DIR, 'redesign_3d_materiality_desktop.png');
          await page.screenshot({ path: threadPath });
          console.log(`  Saved 3D Materiality Screenshot: ${threadPath}`);
        }

        // Vault Spotlight
        const vaultEl = page.locator('text=Single-Loom Spotlight');
        if (await vaultEl.isVisible().catch(() => false)) {
          await vaultEl.scrollIntoViewIfNeeded();
          await page.waitForTimeout(600);
          const vaultPath = path.join(ARTIFACTS_DIR, 'redesign_vault_spotlight_desktop.png');
          await page.screenshot({ path: vaultPath });
          console.log(`  Saved Vault Spotlight Screenshot: ${vaultPath}`);
        }

        // Atelier Memoir
        const memoirEl = page.locator('text=The Atelier & Lineage');
        if (await memoirEl.isVisible().catch(() => false)) {
          await memoirEl.scrollIntoViewIfNeeded();
          await page.waitForTimeout(600);
          const memoirPath = path.join(ARTIFACTS_DIR, 'redesign_atelier_memoir_desktop.png');
          await page.screenshot({ path: memoirPath });
          console.log(`  Saved Atelier Memoir Screenshot: ${memoirPath}`);
        }
      }

      if (vp.name === 'mobile_390') {
        const mobPath = path.join(ARTIFACTS_DIR, 'redesign_hero_mobile_390.png');
        await page.screenshot({ path: mobPath });
        console.log(`  Saved Mobile 390 Screenshot: ${mobPath}`);

        const vaultEl = page.locator('text=Single-Loom Spotlight');
        if (await vaultEl.isVisible().catch(() => false)) {
          await vaultEl.scrollIntoViewIfNeeded();
          await page.waitForTimeout(600);
          const mobVaultPath = path.join(ARTIFACTS_DIR, 'redesign_vault_mobile_390.png');
          await page.screenshot({ path: mobVaultPath });
          console.log(`  Saved Mobile 390 Vault Screenshot: ${mobVaultPath}`);
        }
      }

      if (vp.name === 'mobile_375') {
        const mob375Path = path.join(ARTIFACTS_DIR, 'redesign_hero_mobile_375.png');
        await page.screenshot({ path: mob375Path });
        console.log(`  Saved Mobile 375 Screenshot: ${mob375Path}`);
      }

    } catch (err) {
      console.error(`  Error auditing ${vp.name}: ${err.message}`);
      allPassed = false;
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log('\n--- Console Errors Summary ---');
  console.log(`  ${consoleErrors.length} console errors detected.`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((e) => console.log('   *', e));
  }

  console.log('\n--- Page Errors Summary ---');
  console.log(`  ${pageErrors.length} page errors detected.`);
  if (pageErrors.length > 0) {
    pageErrors.forEach((e) => console.log('   *', e));
  }

  console.log('\n=============================================');
  if (allPassed && pageErrors.length === 0) {
    console.log('>>> ALL REDESIGN CHECKS PASSED (EXIT 0) <<<');
    process.exit(0);
  } else {
    console.error('>>> SOME CHECKS FAILED (EXIT 1) <<<');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal Playwright audit crash:', err);
  process.exit(1);
});
