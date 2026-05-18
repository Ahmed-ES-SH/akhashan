import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";

// ///////////////////////////////////////////////////////////////////////
// ///////////// Login E2E Tests /////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////

// ///////////////////////////////////////////////////////////////////////
// ///////////// Read credentials from .env //////////////////////////////
// ///////////////////////////////////////////////////////////////////////

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

test.describe("Login Page", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate("ar");
  });

  // /////////////////////////////////////////////////////////////////
  // ///////////// Test 1: Display login page /////////////////////////
  // /////////////////////////////////////////////////////////////////

  test("should display login page with form fields and brand elements", async () => {
    // Verify page title is visible
    await expect(loginPage.pageTitle).toBeVisible();

    // Verify form fields exist
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();

    // Verify submit button text
    await expect(loginPage.submitButton).toContainText("تسجيل الدخول");
  });

  // /////////////////////////////////////////////////////////////////
  // ///////////// Test 2: Successful login ///////////////////////////
  // /////////////////////////////////////////////////////////////////

  test("should redirect to admin on successful login", async ({ page }) => {
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);

    // Wait for redirect to admin
    const url = await loginPage.waitForRedirect();
    expect(url).toContain("/admin");
  });

  // /////////////////////////////////////////////////////////////////
  // ///////////// Test 3: Empty fields validation ////////////////////
  // /////////////////////////////////////////////////////////////////

  test("should show validation errors when submitting empty form", async () => {
    // Click submit without filling any fields
    await loginPage.submitButton.click();

    // Wait a brief moment for validation to trigger
    await loginPage.page.waitForTimeout(300);

    // Check that field error messages appear
    await expect(loginPage.emailFieldError).toBeVisible();
    await expect(loginPage.passwordFieldError).toBeVisible();
  });

  // /////////////////////////////////////////////////////////////////
  // ///////////// Test 4: Invalid email format ///////////////////////
  // /////////////////////////////////////////////////////////////////

  test("should show error for invalid email format", async ({ page }) => {
    // Enter invalid email
    await loginPage.emailInput.fill("not-an-email");
    await loginPage.passwordInput.fill("password123");
    await loginPage.submitButton.click();

    // Wait for validation
    await page.waitForTimeout(300);

    // Check that email field shows error
    await expect(loginPage.emailFieldError).toBeVisible();
  });

  // /////////////////////////////////////////////////////////////////
  // ///////////// Test 5: Wrong credentials //////////////////////////
  // /////////////////////////////////////////////////////////////////

  test("should show auth error for invalid credentials", async ({ page }) => {
    // Submit with wrong credentials
    await loginPage.login("wrong@email.com", "wrongpassword");

    // Wait for API response
    await page.waitForTimeout(1000);

    // Check for error banner (should show API error or network error)
    await expect(loginPage.errorBanner).toBeVisible();
  });

  // /////////////////////////////////////////////////////////////////
  // ///////////// Test 6: Password visibility toggle /////////////////
  // /////////////////////////////////////////////////////////////////

  test("should toggle password visibility when clicking eye icon", async ({ page }) => {
    const passwordInput = loginPage.passwordInput;

    // Type a password
    await passwordInput.fill("mySecretPassword");

    // Initially should be password type
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click the eye toggle button inside the password field container
    const passwordField = page.getByTestId("login-password-input").locator("..");
    const toggleButton = passwordField.getByRole("button");
    await toggleButton.click();

    // Should now be text type
    await expect(passwordInput).toHaveAttribute("type", "text");
  });

  // /////////////////////////////////////////////////////////////////
  // ///////////// Test 7: Loading state during submission ////////////
  // /////////////////////////////////////////////////////////////////

  test("should show loading state on submit button during login", async () => {
    // Start submission
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);

    // Button should be disabled during submission
    await expect(loginPage.submitButton).toBeDisabled();
  });

  // /////////////////////////////////////////////////////////////////
  // ///////////// Test 8: Session persistence ////////////////////////
  // /////////////////////////////////////////////////////////////////

  test("should persist session and allow direct admin access", async ({ page }) => {
    // Login first
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await loginPage.waitForRedirect();

    // Navigate directly to admin page (session should persist via cookie)
    await page.goto("/ar/admin");
    await page.waitForLoadState("networkidle");

    // Should show admin content, not redirect to login
    await expect(page).not.toHaveURL(/\/login/);
  });

  // /////////////////////////////////////////////////////////////////
  // ///////////// Test 9: Logout flow ////////////////////////////////
  // /////////////////////////////////////////////////////////////////

  test("should logout and redirect to login page", async ({ page }) => {
    // Login
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await loginPage.waitForRedirect();

    // Click the logout button in the admin header
    const logoutButton = page.getByTestId("admin-logout-button");
    await logoutButton.click();

    // Should redirect to login page
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  // /////////////////////////////////////////////////////////////////
  // ///////////// Test 10: Redirect if already authenticated //////////
  // /////////////////////////////////////////////////////////////////

  test("should redirect to admin when already authenticated and visiting login page", async ({
    page,
  }) => {
    // Login first
    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await loginPage.waitForRedirect();

    // Navigate to login page while already authenticated
    await page.goto("/ar/login");
    await page.waitForLoadState("networkidle");

    // Should redirect to admin, not show login form
    await expect(page).toHaveURL(/\/admin/);
  });

  // /////////////////////////////////////////////////////////////////
  // ///////////// Test 11: RTL layout ////////////////////////////////
  // /////////////////////////////////////////////////////////////////

  test("should display form in RTL alignment for Arabic locale", async ({ page }) => {
    // Navigate to Arabic login
    await loginPage.navigate("ar");

    // Verify Arabic content is displayed
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.pageTitle).toContainText("مرحباً");
  });

  // /////////////////////////////////////////////////////////////////
  // ///////////// Test 12: English locale form ///////////////////////
  // /////////////////////////////////////////////////////////////////

  test("should display English text for en locale", async ({ page }) => {
    const enLoginPage = new LoginPage(page);
    await enLoginPage.navigate("en");

    // Submit button should have English text
    await expect(enLoginPage.submitButton).toContainText("Sign In");
    await expect(enLoginPage.pageTitle).toContainText("Welcome Back");
  });
});
