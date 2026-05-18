import { Page, Locator } from "@playwright/test";

// ///////////////////////////////////////////////////////////////////////
// ///////////// Login Page Object Model — Page Object pattern ///////////
// ///////////////////////////////////////////////////////////////////////

export class LoginPage {
  readonly page: Page;

  // Form elements
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  // Error elements
  readonly errorBanner: Locator;
  readonly emailFieldError: Locator;
  readonly passwordFieldError: Locator;

  // Brand elements
  readonly pageTitle: Locator;
  readonly brandLogo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
    this.errorBanner = page.getByTestId("login-error");
    this.emailFieldError = page.getByTestId("login-email-error");
    this.passwordFieldError = page.getByTestId("login-password-error");
    this.pageTitle = page.getByTestId("login-page-title");
    this.brandLogo = page.getByTestId("login-brand-logo");
  }

  // /////////////////////////////////////////////////////////////////
  // ///////////// Navigate to login page /////////////////////////////
  // /////////////////////////////////////////////////////////////////

  async navigate(locale: string = "ar") {
    await this.page.goto(`/${locale}/login`);
    await this.page.waitForLoadState("networkidle");
  }

  // /////////////////////////////////////////////////////////////////
  // ///////////// Fill credentials and submit ////////////////////////
  // /////////////////////////////////////////////////////////////////

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  // /////////////////////////////////////////////////////////////////
  // ///////////// Wait for redirect to admin /////////////////////////
  // /////////////////////////////////////////////////////////////////

  async waitForRedirect(timeout: number = 10000): Promise<string> {
    await this.page.waitForURL(/\/admin/, { timeout });
    return this.page.url();
  }
}
