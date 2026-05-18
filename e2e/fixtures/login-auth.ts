import { test as base, expect, type Page } from "@playwright/test";

// ///////////////////////////////////////////////////////////////////////
// ///////////// Login Auth Fixture — reusable auth setup ////////////////
// ///////////////////////////////////////////////////////////////////////

interface LoginAuthFixtures {
  authenticatedPage: Page;
}

export const test = base.extend<LoginAuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    // Create a new authenticated context
    const context = await browser.newContext();
    const page = await context.newPage();

    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

    // Perform login
    await page.goto("/ar/login");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("login-email-input").fill(adminEmail);
    await page.getByTestId("login-password-input").fill(adminPassword);
    await page.getByTestId("login-submit-button").click();

    // Wait for redirect to admin dashboard
    await page.waitForURL(/\/admin/, { timeout: 10000 });

    // Verify authentication succeeded
    await expect(page).not.toHaveURL(/\/login/);

    await use(page);

    // Cleanup
    await context.close();
  },
});

export { expect } from "@playwright/test";
