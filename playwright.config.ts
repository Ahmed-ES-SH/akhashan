import { defineConfig, devices } from "@playwright/test";

///////////////////////////////////////////////////////////////////////
///////////// Playwright Config — Admin Services E2E Tests ////////////
///////////////////////////////////////////////////////////////////////

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.FRONTEND_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  /////////////////////////////////////////////////////////////////////
  ///////////// Projects — chromium only //////////////////////////////
  /////////////////////////////////////////////////////////////////////

  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
      },
      dependencies: ["setup"],
    },
  ],

  /////////////////////////////////////////////////////////////////////
  ///////////// Web server — start Next.js dev server /////////////////
  /////////////////////////////////////////////////////////////////////

  webServer: {
    command: "pnpm dev",
    url: process.env.FRONTEND_URL ?? "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },
});
