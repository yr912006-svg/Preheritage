import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./browser-tests",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  outputDir: "test-results/browser",
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile-375", use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
    { name: "tablet-768", use: { viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true } },
    { name: "desktop-1440", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: "npm.cmd run dev -- --hostname 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
