import { type Page, type Locator, expect } from "@playwright/test";

///////////////////////////////////////////////////////////////////////
///////////// Page Object Model — Admin Login Page ////////////////////
///////////////////////////////////////////////////////////////////////

export class AdminLoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorAlert: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.signInButton = page.getByRole("button", { name: "Sign In" });
    this.errorAlert = page.locator(".bg-red-50");
    this.heading = page.getByRole("heading", { name: "Admin Login" });
  }

  async goto() {
    await this.page.goto("/en/admin");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async expectVisible() {
    await expect(this.heading).toBeVisible();
  }

  async expectError(message: string) {
    await expect(this.errorAlert).toContainText(message);
  }

  async expectSignedIn() {
    await this.page.waitForURL(/\/en\/admin/);
  }
}
