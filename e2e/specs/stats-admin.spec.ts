import { test, expect, type Page } from "@playwright/test";
import { AdminDashboardPage } from "../pages/admin-dashboard.page";

///////////////////////////////////////////////////////////////////////
/////////////// Stats Section — Admin CRUD E2E Tests //////////////////
///////////////////////////////////////////////////////////////////////

const DEFAULT_STAT_ITEMS = [
  {
    id: 1,
    icon: "FiUsers",
    target: 5000,
    suffix: "+",
    label_en: "Workers Recruited",
    label_ar: "عامل تم استقدامهم",
    sort_order: 1,
  },
  {
    id: 2,
    icon: "FiBriefcase",
    target: 1200,
    suffix: "",
    label_en: "Active Contracts",
    label_ar: "عقود نشطة",
    sort_order: 2,
  },
];

///////////////////////////////////////////////////////////////////////
/////////////// Helper: Login with mocked auth ////////////////////////
///////////////////////////////////////////////////////////////////////

async function loginWithMockedAuth(page: Page) {
  let loggedIn = false;

  // Mock auth/current-user
  await page.route("**/auth/current-user", async (route) => {
    if (loggedIn) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          name: "Test Admin",
          email: "admin@example.com",
          role: "admin",
        }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unauthenticated" }),
      });
    }
  });

  // Mock auth/login
  await page.route("**/auth/login", async (route) => {
    loggedIn = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        user: { id: 1, name: "Test Admin", email: "admin@example.com", role: "admin" },
      }),
    });
  });

  // Navigate to login
  await page.goto("/en/login");
  await page.waitForLoadState("networkidle");
  await page.getByTestId("login-email-input").waitFor({ state: "visible" });

  // Perform login
  await page.getByTestId("login-email-input").fill("admin@example.com");
  await page.getByTestId("login-password-input").fill("admin123");
  await page.getByTestId("login-submit-button").click();

  // Wait for redirect
  await page.waitForURL(/\/admin/, { timeout: 10000 });
  await expect(page).not.toHaveURL(/\/login/);
}

///////////////////////////////////////////////////////////////////////
/////////////// Test Suite ////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

test.describe("Stats Section — Admin CRUD", () => {
  let adminPage: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    // Set up stat-items mock BEFORE login (so it's ready when admin page loads)
    await page.route("**/api/admin/stat-items", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(DEFAULT_STAT_ITEMS),
        });
      } else {
        await route.continue();
      }
    });

    // Mock reorder endpoint
    await page.route("**/api/admin/stat-items/reorder", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(DEFAULT_STAT_ITEMS),
      });
    });

    // Mock home-page-content PUT
    await page.route("**/api/admin/home-page-content", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    // Login with mocked auth
    await loginWithMockedAuth(page);

    adminPage = new AdminDashboardPage(page);
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 1: Displays stat items list /////////////////
  /////////////////////////////////////////////////////////////////

  test("displays stat items list when items exist", async () => {
    await expect(adminPage.statsSection).toBeVisible();
    await expect(adminPage.getStatCard(1)).toBeVisible();
    await expect(adminPage.getStatCard(2)).toBeVisible();
    await expect(adminPage.getStatCard(1)).toContainText("5,000");
    await expect(adminPage.getStatCard(1)).toContainText("+");
    await expect(adminPage.getStatCard(2)).toContainText("1,200");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 2: Shows empty state when no items ///////////
  /////////////////////////////////////////////////////////////////

  test("shows empty state when no stat items", async ({ page }) => {
    await page.route("**/api/admin/stat-items", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/en/admin");
    await page.waitForLoadState("networkidle");

    const freshPage = new AdminDashboardPage(page);
    await expect(freshPage.emptyStateMessage).toBeVisible();
    await expect(freshPage.addStatItemButton).toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 3: Creates a new stat item /////////////////
  /////////////////////////////////////////////////////////////////

  test("creates a new stat item", async ({ page }) => {
    let postPayload: Record<string, unknown> = {};

    // Remove existing route and add new one with POST handling
    await page.unroute("**/api/admin/stat-items");
    await page.route("**/api/admin/stat-items", async (route) => {
      if (route.request().method() === "POST") {
        postPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 3,
            icon: postPayload.icon ?? "",
            target: postPayload.target ?? 0,
            suffix: postPayload.suffix ?? "",
            label_en: postPayload.label_en ?? "",
            label_ar: postPayload.label_ar ?? "",
            sort_order: 3,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(DEFAULT_STAT_ITEMS),
        });
      }
    });

    await adminPage.addStatItem({
      icon: "FiGlobe",
      target: "300",
      suffix: "K",
      labelEn: "Global Partners",
      labelAr: "شركاء عالميون",
    });

    expect(postPayload.icon).toBe("FiGlobe");
    expect(postPayload.target).toBe(300);
    expect(postPayload.suffix).toBe("K");
    expect(postPayload.label_en).toBe("Global Partners");
    expect(postPayload.label_ar).toBe("شركاء عالميون");

    await adminPage.waitForStatCard(3);
    await expect(adminPage.getStatCard(3)).toBeVisible();
    await expect(adminPage.getStatCard(3)).toContainText("300");
    await expect(adminPage.getStatCard(3)).toContainText("K");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 4: Edits an existing stat item ///////////////
  /////////////////////////////////////////////////////////////////

  test("edits an existing stat item", async ({ page }) => {
    let putPayload: Record<string, unknown> = {};
    await page.route("**/api/admin/stat-items/1", async (route) => {
      if (route.request().method() === "PUT") {
        putPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            icon: "FiUsers",
            target: 10000,
            suffix: "+",
            label_en: "Workers Hired",
            label_ar: "عامل تم توظيفهم",
            sort_order: 1,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await adminPage.editStatItem(1, {
      target: "10000",
      labelEn: "Workers Hired",
      labelAr: "عامل تم توظيفهم",
    });

    expect(putPayload.target).toBe(10000);
    expect(putPayload.label_en).toBe("Workers Hired");
    expect(putPayload.label_ar).toBe("عامل تم توظيفهم");

    await expect(adminPage.getStatCard(1)).toContainText("10,000");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 5: Edits bilingual label (EN + AR) /////////
  /////////////////////////////////////////////////////////////////

  test("edits bilingual label (EN + AR)", async ({ page }) => {
    let putPayload: Record<string, unknown> = {};
    await page.route("**/api/admin/stat-items/1", async (route) => {
      if (route.request().method() === "PUT") {
        putPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            icon: "FiUsers",
            target: 5000,
            suffix: "+",
            label_en: "Updated EN Label",
            label_ar: "تحديث العربية",
            sort_order: 1,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await adminPage.getEditButton(1).click();
    await adminPage.statItemForm.waitFor({ state: "visible" });

    await adminPage.formLabelEnInput.fill("Updated EN Label");
    await adminPage.formLabelArInput.fill("تحديث العربية");
    await adminPage.formSaveButton.click();

    expect(putPayload.label_en).toBe("Updated EN Label");
    expect(putPayload.label_ar).toBe("تحديث العربية");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 6: Deletes a stat item with confirmation ///
  /////////////////////////////////////////////////////////////////

  test("deletes a stat item with confirmation", async ({ page }) => {
    let deleteCalled = false;
    await page.route("**/api/admin/stat-items/1", async (route) => {
      if (route.request().method() === "DELETE") {
        deleteCalled = true;
        await route.fulfill({ status: 200 });
      } else {
        await route.continue();
      }
    });

    await adminPage.deleteStatItem(1);

    expect(deleteCalled).toBe(true);
    await adminPage.waitForStatCardHidden(1);
    await expect(adminPage.getStatCard(1)).not.toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 7: Cancels delete of a stat item /////////////
  /////////////////////////////////////////////////////////////////

  test("cancels delete of a stat item", async ({ page }) => {
    let deleteCalled = false;
    await page.route("**/api/admin/stat-items/1", async (route) => {
      if (route.request().method() === "DELETE") {
        deleteCalled = true;
        await route.fulfill({ status: 200 });
      } else {
        await route.continue();
      }
    });

    await adminPage.cancelDeleteStatItem(1);

    expect(deleteCalled).toBe(false);
    await expect(adminPage.getStatCard(1)).toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 8: Shows loading state during fetch ////////
  /////////////////////////////////////////////////////////////////

  test("shows loading state during fetch", async ({ page }) => {
    await page.unroute("**/api/admin/stat-items");
    await page.route("**/api/admin/stat-items", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(DEFAULT_STAT_ITEMS),
      });
    });

    // Reload to trigger fresh fetch with new route
    await page.reload({ waitUntil: "commit" });

    const freshPage = new AdminDashboardPage(page);
    // Wait for skeleton to appear (it shows immediately before API response)
    await expect(freshPage.loadingSkeleton.first()).toBeVisible({ timeout: 5000 });

    // Wait for data to load
    await expect(freshPage.getStatCard(1)).toBeVisible({ timeout: 10000 });
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 9: Shows error state on fetch failure /////
  /////////////////////////////////////////////////////////////////

  test("shows error state on fetch failure", async ({ page }) => {
    await page.unroute("**/api/admin/stat-items");
    await page.route("**/api/admin/stat-items", async (route) => {
      await route.fulfill({ status: 500, body: "Server Error" });
    });

    // Reload to trigger fresh fetch with new route
    await page.reload({ waitUntil: "commit" });

    const freshPage = new AdminDashboardPage(page);
    // The error state shows a retry button
    await expect(freshPage.retryButton).toBeVisible({ timeout: 10000 });
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 10: Form modal opens in create mode ////////
  /////////////////////////////////////////////////////////////////

  test("form modal opens in create mode with empty fields", async () => {
    await adminPage.addStatItemButton.click();
    await adminPage.statItemForm.waitFor({ state: "visible" });

    await expect(adminPage.statItemFormTitle).toContainText(/Add|إضافة/);
    await expect(adminPage.formIconInput).toHaveValue("");
    await expect(adminPage.formTargetInput).toHaveValue("");
    await expect(adminPage.formSuffixInput).toHaveValue("");
    await expect(adminPage.formLabelEnInput).toHaveValue("");
    await expect(adminPage.formLabelArInput).toHaveValue("");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 11: Form modal opens in edit mode ///////////
  /////////////////////////////////////////////////////////////////

  test("form modal opens in edit mode with pre-filled data", async () => {
    await adminPage.getEditButton(1).click();
    await adminPage.statItemForm.waitFor({ state: "visible" });

    await expect(adminPage.statItemFormTitle).toContainText(/Edit|تعديل/);
    await expect(adminPage.formIconInput).toHaveValue("FiUsers");
    await expect(adminPage.formTargetInput).toHaveValue("5000");
    await expect(adminPage.formSuffixInput).toHaveValue("+");
    await expect(adminPage.formLabelEnInput).toHaveValue("Workers Recruited");
    await expect(adminPage.formLabelArInput).toHaveValue("عامل تم استقدامهم");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 12: Form closes on Cancel button ////////////
  /////////////////////////////////////////////////////////////////

  test("form modal closes when clicking Cancel", async () => {
    await adminPage.addStatItemButton.click();
    await adminPage.statItemForm.waitFor({ state: "visible" });

    await adminPage.formCancelButton.click();
    await expect(adminPage.statItemForm).not.toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 13: Form closes on Escape key ///////////////
  /////////////////////////////////////////////////////////////////

  test("form modal closes when pressing Escape", async ({ page }) => {
    await adminPage.addStatItemButton.click();
    await adminPage.statItemForm.waitFor({ state: "visible" });

    // Focus the modal container before pressing Escape
    await page.locator('[data-testid="stat-item-form"]').focus();
    await page.keyboard.press("Escape");
    await expect(adminPage.statItemForm).not.toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 14: Handles 401 redirect on expired session /
  /////////////////////////////////////////////////////////////////

  test("handles 401 redirect on expired session", async ({ page }) => {
    // Remove existing auth routes and add 401 mock
    await page.unroute("**/auth/current-user");
    await page.route("**/auth/current-user", async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ message: "Unauthorized" }),
      });
    });

    // Reload to trigger fresh auth check
    await page.reload({ waitUntil: "commit" });

    // Admin page shows inline login form when not authenticated
    // Check for the "Admin Login" heading which indicates the login form is displayed
    await expect(page.getByText("Admin Login")).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder("admin@example.com")).toBeVisible();
  });
});
