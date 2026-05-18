import { test, expect } from "@playwright/test";

/////////////////////////////////////////////////////////////////////
/////////// E2E Tests — Public Contact Form Submission /////////////
/////////////////////////////////////////////////////////////////////

test.describe("Contact Form — Public Submission", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
    // Scroll to contact section
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("contact-section")).toBeVisible();
  });

  test("submits a valid contact form successfully", async ({ page }) => {
    // Set up request listener BEFORE submitting
    const apiCallPromise = page.waitForRequest("**/api/contact");

    // Fill required fields
    await page.getByTestId("contact-form-name").fill("John Doe");
    await page.getByTestId("contact-form-email").fill("john@example.com");

    // Fill optional fields
    await page.getByTestId("contact-form-phone").fill("+966501234567");
    await page.getByTestId("contact-form-service").selectOption({ index: 1 });
    await page.getByTestId("contact-form-country").selectOption({ index: 1 });
    await page.getByTestId("contact-form-message").fill("Hello, I need your services.");

    // Submit
    await page.getByTestId("contact-form-submit").click();

    // Assert success message displayed
    await expect(page.getByTestId("contact-form-success")).toBeVisible({
      timeout: 10_000,
    });

    // Verify API was called
    const request = await apiCallPromise;
    expect(request.method()).toBe("POST");
  });

  test("shows validation errors for missing required fields", async ({ page }) => {
    // Submit empty form
    await page.getByTestId("contact-form-submit").click();

    // Wait for validation to run — errors appear as <p> elements below inputs
    const nameInput = page.getByTestId("contact-form-name");
    const emailInput = page.getByTestId("contact-form-email");

    // Name field should have error styling (red border)
    await expect(nameInput).toHaveClass(/border-red-400/);

    // Email field should have error styling (red border)
    await expect(emailInput).toHaveClass(/border-red-400/);
  });

  test("shows validation error for invalid email format", async ({ page }) => {
    // Fill name + invalid email
    await page.getByTestId("contact-form-name").fill("John Doe");
    await page.getByTestId("contact-form-email").fill("not-an-email");

    // Submit
    await page.getByTestId("contact-form-submit").click();

    // Email field should have error styling
    const emailInput = page.getByTestId("contact-form-email");
    await expect(emailInput).toHaveClass(/border-red-400/);
  });

  test("submits form with only required fields", async ({ page }) => {
    // Fill only name and email (optional fields left empty)
    await page.getByTestId("contact-form-name").fill("Jane Smith");
    await page.getByTestId("contact-form-email").fill("jane@example.com");

    // Submit
    await page.getByTestId("contact-form-submit").click();

    // Assert success message displayed
    await expect(page.getByTestId("contact-form-success")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows rate limit error after too many submissions", async ({ page }) => {
    // Mock POST to return 429 — set up before interaction
    // Must match the ApiErrorResponse format: { statusCode, message, error }
    await page.route("**/api/contact", async (route) => {
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          statusCode: 429,
          message: "Too many attempts",
          error: "Too Many Requests",
        }),
      });
    });

    // Navigate to contact section
    await page.goto("/en");
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("contact-section")).toBeVisible();

    // Fill form
    await page.getByTestId("contact-form-name").fill("Test User");
    await page.getByTestId("contact-form-email").fill("test@example.com");

    // Submit
    await page.getByTestId("contact-form-submit").click();

    // Assert rate limit message displayed
    await expect(page.getByTestId("contact-form-rate-limited")).toBeVisible({
      timeout: 10_000,
    });

    // Assert submit button is disabled
    await expect(page.getByTestId("contact-form-submit")).toBeDisabled();
  });

  test("disables submit button during submission", async ({ page }) => {
    // Mock POST with delayed response
    await page.route("**/api/contact", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: 1 }),
      });
    });

    // Fill form and submit
    await page.getByTestId("contact-form-name").fill("Test User");
    await page.getByTestId("contact-form-email").fill("test@example.com");
    await page.getByTestId("contact-form-submit").click();

    // Assert submit button disabled during loading
    await expect(page.getByTestId("contact-form-submit")).toBeDisabled();

    // Wait for response to complete
    await expect(page.getByTestId("contact-form-success")).toBeVisible({
      timeout: 10_000,
    });

    // Button should be re-enabled after success (but form is reset)
    await expect(page.getByTestId("contact-form-submit")).toBeEnabled();
  });

  test("clears form after successful submission", async ({ page }) => {
    // Fill all fields
    await page.getByTestId("contact-form-name").fill("Test User");
    await page.getByTestId("contact-form-email").fill("test@example.com");
    await page.getByTestId("contact-form-phone").fill("+966501234567");
    await page.getByTestId("contact-form-message").fill("Test message");

    // Submit
    await page.getByTestId("contact-form-submit").click();

    // Wait for success
    await expect(page.getByTestId("contact-form-success")).toBeVisible({
      timeout: 10_000,
    });

    // Assert all form fields are empty after success
    await expect(page.getByTestId("contact-form-name")).toHaveValue("");
    await expect(page.getByTestId("contact-form-email")).toHaveValue("");
    await expect(page.getByTestId("contact-form-phone")).toHaveValue("");
    await expect(page.getByTestId("contact-form-message")).toHaveValue("");
  });

  test("auto-resets success message after 5 seconds", async ({ page }) => {
    // Fill and submit
    await page.getByTestId("contact-form-name").fill("Test User");
    await page.getByTestId("contact-form-email").fill("test@example.com");
    await page.getByTestId("contact-form-submit").click();

    // Wait for success
    await expect(page.getByTestId("contact-form-success")).toBeVisible({
      timeout: 10_000,
    });

    // Wait for auto-reset (5s + buffer)
    await page.waitForTimeout(6000);

    // Success message should be gone
    await expect(page.getByTestId("contact-form-success")).not.toBeVisible();
  });

  test("clears error state when user types in a field", async ({ page }) => {
    // Submit empty form to trigger errors
    await page.getByTestId("contact-form-submit").click();

    // Verify error state
    const nameInput = page.getByTestId("contact-form-name");
    await expect(nameInput).toHaveClass(/border-red-400/);

    // Type in name field
    await nameInput.fill("John Doe");

    // Error styling should be removed
    await expect(nameInput).not.toHaveClass(/border-red-400/);
  });
});
