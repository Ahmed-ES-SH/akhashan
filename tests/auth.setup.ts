import { test as setup, expect } from "@playwright/test";
import path from "path";

///////////////////////////////////////////////////////////////////////
///////////// Auth Setup — login as admin and save state //////////////
///////////////////////////////////////////////////////////////////////

const authFile = path.join(__dirname, "../playwright/.auth/admin.json");

setup("authenticate as admin", async ({ page }) => {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";

  // Navigate to admin login page
  await page.goto("/en/admin");

  // Wait for login form to appear
  await expect(page.getByRole("heading", { name: "Admin Login" })).toBeVisible();

  // Fill credentials — use input[type=email] and input[type=password]
  // since labels are not associated via htmlFor
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);

  // Submit login
  await page.getByRole("button", { name: "Sign In" }).click();

  // Wait for navigation to admin dashboard
  // The login redirects to /en/admin after success
  await page.waitForURL(/\/en\/admin/);

  // Verify we are authenticated — check for Admin Dashboard heading
  await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible({
    timeout: 10_000,
  });

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});
