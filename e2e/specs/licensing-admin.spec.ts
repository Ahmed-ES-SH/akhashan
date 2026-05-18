import { test, expect, type Page } from "@playwright/test";
import { LicensingAdminPage, type LicensingItemFormData } from "../pages/licensing-admin.page";

///////////////////////////////////////////////////////////////////////
///////////// Licensing Section — Admin CRUD E2E Tests ////////////////
///////////////////////////////////////////////////////////////////////

const DEFAULT_LICENSING_ITEMS = [
  {
    id: 1,
    icon: "FiShield",
    title_en: "Commercial License",
    title_ar: "ترخيص تجاري",
    desc_en: "Full commercial licensing for businesses",
    desc_ar: "ترخيص تجاري كامل للشركات",
    tag_en: "Popular",
    tag_ar: "شائع",
    sort_order: 1,
    homePageContentId: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    icon: "FiFileText",
    title_en: "Private License",
    title_ar: "ترخيص خاص",
    desc_en: "Private licensing for individuals",
    desc_ar: "ترخيص خاص للأفراد",
    tag_en: null,
    tag_ar: null,
    sort_order: 2,
    homePageContentId: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

///////////////////////////////////////////////////////////////////////
///////////// Helper: Login with mocked auth //////////////////////////
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
///////////// Test Suite //////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

test.describe("Licensing Section — Admin CRUD", () => {
  let licensingAdminPage: LicensingAdminPage;

  test.beforeEach(async ({ page }) => {
    // Set up licensing-items mock BEFORE login
    await page.route("**/api/admin/licensing-items", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(DEFAULT_LICENSING_ITEMS),
        });
      } else if (route.request().method() === "POST") {
        const postData = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 3,
            icon: postData.icon ?? null,
            title_en: postData.title_en ?? null,
            title_ar: postData.title_ar ?? null,
            desc_en: postData.desc_en ?? null,
            desc_ar: postData.desc_ar ?? null,
            tag_en: postData.tag_en ?? null,
            tag_ar: postData.tag_ar ?? null,
            sort_order: 3,
            homePageContentId: 1,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock single item PUT/DELETE
    await page.route("**/api/admin/licensing-items/:id", async (route) => {
      if (route.request().method() === "PUT") {
        const postData = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...DEFAULT_LICENSING_ITEMS[0],
            ...postData,
          }),
        });
      } else if (route.request().method() === "DELETE") {
        await route.fulfill({ status: 200 });
      } else {
        await route.continue();
      }
    });

    // Mock reorder endpoint
    await page.route("**/api/admin/licensing-items/reorder", async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(DEFAULT_LICENSING_ITEMS),
        });
      } else {
        await route.continue();
      }
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

    licensingAdminPage = new LicensingAdminPage(page);
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 1: Displays licensing items list /////////////
  /////////////////////////////////////////////////////////////////

  test("displays licensing items list when items exist", async () => {
    await expect(licensingAdminPage.licensingSection).toBeVisible();
    await expect(licensingAdminPage.getLicensingCard(1)).toBeVisible();
    await expect(licensingAdminPage.getLicensingCard(2)).toBeVisible();
    await expect(licensingAdminPage.getLicensingCard(1)).toContainText("Commercial License");
    await expect(licensingAdminPage.getLicensingCard(2)).toContainText("Private License");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 2: Shows empty state when no items ///////////
  /////////////////////////////////////////////////////////////////

  test("shows empty state when no licensing items", async ({ page }) => {
    await page.route("**/api/admin/licensing-items", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/en/admin");
    await page.waitForLoadState("networkidle");

    const freshPage = new LicensingAdminPage(page);
    await expect(freshPage.emptyStateMessage).toBeVisible();
    await expect(freshPage.addLicensingItemButton).toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 3: Creates a new licensing item /////////////
  /////////////////////////////////////////////////////////////////

  test("creates a new licensing item", async ({ page }) => {
    let postPayload: Record<string, unknown> = {};

    await page.unroute("**/api/admin/licensing-items");
    await page.route("**/api/admin/licensing-items", async (route) => {
      if (route.request().method() === "POST") {
        postPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 3,
            icon: postPayload.icon ?? null,
            title_en: postPayload.title_en ?? null,
            title_ar: postPayload.title_ar ?? null,
            desc_en: postPayload.desc_en ?? null,
            desc_ar: postPayload.desc_ar ?? null,
            tag_en: postPayload.tag_en ?? null,
            tag_ar: postPayload.tag_ar ?? null,
            sort_order: 3,
            homePageContentId: 1,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(DEFAULT_LICENSING_ITEMS),
        });
      }
    });

    await licensingAdminPage.addLicensingItem({
      icon: "FiGlobe",
      titleEn: "International License",
      titleAr: "ترخيص دولي",
      descEn: "License for international operations",
      descAr: "ترخيص للعمليات الدولية",
      tagEn: "New",
      tagAr: "جديد",
    });

    expect(postPayload.icon).toBe("FiGlobe");
    expect(postPayload.title_en).toBe("International License");
    expect(postPayload.title_ar).toBe("ترخيص دولي");
    expect(postPayload.desc_en).toBe("License for international operations");
    expect(postPayload.desc_ar).toBe("ترخيص للعمليات الدولية");
    expect(postPayload.tag_en).toBe("New");
    expect(postPayload.tag_ar).toBe("جديد");

    await licensingAdminPage.waitForLicensingCard(3);
    await expect(licensingAdminPage.getLicensingCard(3)).toBeVisible();
    await expect(licensingAdminPage.getLicensingCard(3)).toContainText("International License");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 4: Edits an existing licensing item /////////
  /////////////////////////////////////////////////////////////////

  test("edits an existing licensing item", async ({ page }) => {
    let putPayload: Record<string, unknown> = {};
    await page.route("**/api/admin/licensing-items/1", async (route) => {
      if (route.request().method() === "PUT") {
        putPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            icon: "FiShield",
            title_en: "Updated Commercial License",
            title_ar: "ترخيص تجاري محدث",
            desc_en: "Updated commercial licensing for businesses",
            desc_ar: "ترخيص تجاري محدث للشركات",
            tag_en: "Updated",
            tag_ar: "محدث",
            sort_order: 1,
            homePageContentId: 1,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          }),
        });
      } else {
        await route.continue();
      }
    });

    await licensingAdminPage.editLicensingItem(1, {
      icon: "FiShield",
      titleEn: "Updated Commercial License",
      titleAr: "ترخيص تجاري محدث",
      descEn: "Updated commercial licensing for businesses",
      descAr: "ترخيص تجاري محدث للشركات",
      tagEn: "Updated",
      tagAr: "محدث",
    });

    expect(putPayload.title_en).toBe("Updated Commercial License");
    expect(putPayload.title_ar).toBe("ترخيص تجاري محدث");
    expect(putPayload.desc_en).toBe("Updated commercial licensing for businesses");
    expect(putPayload.desc_ar).toBe("ترخيص تجاري محدث للشركات");
    expect(putPayload.tag_en).toBe("Updated");
    expect(putPayload.tag_ar).toBe("محدث");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 5: Edits bilingual fields (EN + AR) /////////
  /////////////////////////////////////////////////////////////////

  test("edits bilingual title, description, and tag (EN + AR)", async ({ page }) => {
    let putPayload: Record<string, unknown> = {};
    await page.route("**/api/admin/licensing-items/1", async (route) => {
      if (route.request().method() === "PUT") {
        putPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            icon: "FiShield",
            title_en: "Updated EN Title",
            title_ar: "تحديث العنوان العربي",
            desc_en: "Updated EN Description",
            desc_ar: "تحديث الوصف العربي",
            tag_en: "Updated EN Tag",
            tag_ar: "تحديث الوسم العربي",
            sort_order: 1,
            homePageContentId: 1,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          }),
        });
      } else {
        await route.continue();
      }
    });

    await licensingAdminPage.getEditButton(1).click();
    await licensingAdminPage.licensingItemForm.waitFor({ state: "visible" });

    await licensingAdminPage.formTitleEnInput.fill("Updated EN Title");
    await licensingAdminPage.formTitleArInput.fill("تحديث العنوان العربي");
    await licensingAdminPage.formDescEnInput.fill("Updated EN Description");
    await licensingAdminPage.formDescArInput.fill("تحديث الوصف العربي");
    await licensingAdminPage.formTagEnInput.fill("Updated EN Tag");
    await licensingAdminPage.formTagArInput.fill("تحديث الوسم العربي");
    await licensingAdminPage.formSaveButton.click();

    expect(putPayload.title_en).toBe("Updated EN Title");
    expect(putPayload.title_ar).toBe("تحديث العنوان العربي");
    expect(putPayload.desc_en).toBe("Updated EN Description");
    expect(putPayload.desc_ar).toBe("تحديث الوصف العربي");
    expect(putPayload.tag_en).toBe("Updated EN Tag");
    expect(putPayload.tag_ar).toBe("تحديث الوسم العربي");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 6: Deletes a licensing item /////////////////
  /////////////////////////////////////////////////////////////////

  test("deletes a licensing item with confirmation", async ({ page }) => {
    let deleteCalled = false;
    await page.route("**/api/admin/licensing-items/1", async (route) => {
      if (route.request().method() === "DELETE") {
        deleteCalled = true;
        await route.fulfill({ status: 200 });
      } else {
        await route.continue();
      }
    });

    await licensingAdminPage.deleteLicensingItem(1);

    expect(deleteCalled).toBe(true);
    await licensingAdminPage.waitForLicensingCardHidden(1);
    await expect(licensingAdminPage.getLicensingCard(1)).not.toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 7: Cancels delete of a licensing item ///////
  /////////////////////////////////////////////////////////////////

  test("cancels delete of a licensing item", async ({ page }) => {
    let deleteCalled = false;
    await page.route("**/api/admin/licensing-items/1", async (route) => {
      if (route.request().method() === "DELETE") {
        deleteCalled = true;
        await route.fulfill({ status: 200 });
      } else {
        await route.continue();
      }
    });

    await licensingAdminPage.cancelDeleteLicensingItem(1);

    expect(deleteCalled).toBe(false);
    await expect(licensingAdminPage.getLicensingCard(1)).toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 8: Reorders licensing items /////////////////
  /////////////////////////////////////////////////////////////////

  test("reorders licensing items via up/down buttons", async ({ page }) => {
    let reorderPayload: number[] = [];

    // Override the reorder route from beforeEach
    await page.unroute("**/api/admin/licensing-items/reorder");
    await page.route("**/api/admin/licensing-items/reorder", async (route) => {
      if (route.request().method() === "PATCH") {
        const body = route.request().postDataJSON();
        reorderPayload = body.ids ?? [];
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([DEFAULT_LICENSING_ITEMS[1], DEFAULT_LICENSING_ITEMS[0]]),
        });
      } else {
        await route.continue();
      }
    });

    // Move item 2 up (swap with item 1)
    await licensingAdminPage.getMoveUpButton(2).click();

    // Wait a moment for the API call to complete
    await page.waitForTimeout(500);

    expect(reorderPayload).toEqual([2, 1]);
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 9: Shows loading state during fetch /////////
  /////////////////////////////////////////////////////////////////

  test("shows loading state during fetch", async ({ page }) => {
    await page.unroute("**/api/admin/licensing-items");
    await page.route("**/api/admin/licensing-items", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(DEFAULT_LICENSING_ITEMS),
      });
    });

    // Reload to trigger fresh fetch with new route
    await page.reload({ waitUntil: "commit" });

    const freshPage = new LicensingAdminPage(page);
    // Wait for skeleton to appear
    await expect(freshPage.loadingSkeleton.first()).toBeVisible({ timeout: 5000 });

    // Wait for data to load
    await expect(freshPage.getLicensingCard(1)).toBeVisible({ timeout: 10000 });
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 10: Shows error state on fetch failure /////
  /////////////////////////////////////////////////////////////////

  test("shows error state on fetch failure", async ({ page }) => {
    await page.unroute("**/api/admin/licensing-items");
    await page.route("**/api/admin/licensing-items", async (route) => {
      await route.fulfill({ status: 500, body: "Server Error" });
    });

    // Reload to trigger fresh fetch with new route
    await page.reload({ waitUntil: "commit" });

    const freshPage = new LicensingAdminPage(page);
    await expect(freshPage.retryButton).toBeVisible({ timeout: 10000 });
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 11: Form modal opens in create mode /////////
  /////////////////////////////////////////////////////////////////

  test("form modal opens in create mode with empty fields", async () => {
    await licensingAdminPage.addLicensingItemButton.click();
    await licensingAdminPage.licensingItemForm.waitFor({ state: "visible" });

    await expect(licensingAdminPage.licensingItemFormTitle).toContainText(/Add|إضافة/);
    await expect(licensingAdminPage.formIconInput).toHaveValue("");
    await expect(licensingAdminPage.formTitleEnInput).toHaveValue("");
    await expect(licensingAdminPage.formTitleArInput).toHaveValue("");
    await expect(licensingAdminPage.formDescEnInput).toHaveValue("");
    await expect(licensingAdminPage.formDescArInput).toHaveValue("");
    await expect(licensingAdminPage.formTagEnInput).toHaveValue("");
    await expect(licensingAdminPage.formTagArInput).toHaveValue("");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 12: Form modal opens in edit mode ///////////
  /////////////////////////////////////////////////////////////////

  test("form modal opens in edit mode with pre-filled data", async () => {
    await licensingAdminPage.getEditButton(1).click();
    await licensingAdminPage.licensingItemForm.waitFor({ state: "visible" });

    await expect(licensingAdminPage.licensingItemFormTitle).toContainText(/Edit|تعديل/);
    await expect(licensingAdminPage.formIconInput).toHaveValue("FiShield");
    await expect(licensingAdminPage.formTitleEnInput).toHaveValue("Commercial License");
    await expect(licensingAdminPage.formTitleArInput).toHaveValue("ترخيص تجاري");
    await expect(licensingAdminPage.formDescEnInput).toHaveValue(
      "Full commercial licensing for businesses",
    );
    await expect(licensingAdminPage.formDescArInput).toHaveValue(
      "ترخيص تجاري كامل للشركات",
    );
    await expect(licensingAdminPage.formTagEnInput).toHaveValue("Popular");
    await expect(licensingAdminPage.formTagArInput).toHaveValue("شائع");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 13: Form closes on Cancel button ////////////
  /////////////////////////////////////////////////////////////////

  test("form modal closes when clicking Cancel", async () => {
    await licensingAdminPage.addLicensingItemButton.click();
    await licensingAdminPage.licensingItemForm.waitFor({ state: "visible" });

    await licensingAdminPage.formCancelButton.click();
    await expect(licensingAdminPage.licensingItemForm).not.toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 14: Form closes on Escape key ///////////////
  /////////////////////////////////////////////////////////////////

  test("form modal closes when pressing Escape", async ({ page }) => {
    await licensingAdminPage.addLicensingItemButton.click();
    await licensingAdminPage.licensingItemForm.waitFor({ state: "visible" });

    // Focus the modal container before pressing Escape
    await page.locator('[data-testid="licensing-item-form-modal"]').focus();
    await page.keyboard.press("Escape");
    await expect(licensingAdminPage.licensingItemForm).not.toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 15: Shows validation errors /////////////////
  /////////////////////////////////////////////////////////////////

  test("shows validation errors on create form", async () => {
    await licensingAdminPage.addLicensingItemButton.click();
    await licensingAdminPage.licensingItemForm.waitFor({ state: "visible" });

    // Type 101 chars in icon field (max is 100)
    const longIcon = "a".repeat(101);
    await licensingAdminPage.formIconInput.fill(longIcon);

    // The maxLength attribute should prevent typing beyond 100
    await expect(licensingAdminPage.formIconInput).toHaveValue("a".repeat(100));
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 16: Character counter on description ////////
  /////////////////////////////////////////////////////////////////

  test("character counter on description fields", async () => {
    await licensingAdminPage.addLicensingItemButton.click();
    await licensingAdminPage.licensingItemForm.waitFor({ state: "visible" });

    // Type in desc_en
    await licensingAdminPage.formDescEnInput.fill("Test description");

    // Counter should show "16/2000"
    const counterText = await licensingAdminPage.licensingItemForm.locator(
      'text=/[0-9]+\/2000/',
    );
    await expect(counterText.first()).toContainText("16/2000");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 17: Optional fields can be left empty //////
  /////////////////////////////////////////////////////////////////

  test("optional fields (icon, tag) can be left empty", async ({ page }) => {
    let postPayload: Record<string, unknown> = {};

    await page.unroute("**/api/admin/licensing-items");
    await page.route("**/api/admin/licensing-items", async (route) => {
      if (route.request().method() === "POST") {
        postPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 3,
            icon: postPayload.icon ?? null,
            title_en: postPayload.title_en ?? null,
            title_ar: postPayload.title_ar ?? null,
            desc_en: postPayload.desc_en ?? null,
            desc_ar: postPayload.desc_ar ?? null,
            tag_en: postPayload.tag_en ?? null,
            tag_ar: postPayload.tag_ar ?? null,
            sort_order: 3,
            homePageContentId: 1,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(DEFAULT_LICENSING_ITEMS),
        });
      }
    });

    // Fill only title_en and title_ar
    await licensingAdminPage.addLicensingItem({
      titleEn: "Minimal License",
      titleAr: "ترخيص بسيط",
    });

    expect(postPayload.icon).toBeUndefined();
    expect(postPayload.tag_en).toBeUndefined();
    expect(postPayload.tag_ar).toBeUndefined();
    expect(postPayload.title_en).toBe("Minimal License");
    expect(postPayload.title_ar).toBe("ترخيص بسيط");

    await licensingAdminPage.waitForLicensingCard(3);
    await expect(licensingAdminPage.getLicensingCard(3)).toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 18: Handles 404 on update of deleted item ///
  /////////////////////////////////////////////////////////////////

  test("handles 404 on update of deleted item", async ({ page }) => {
    await page.route("**/api/admin/licensing-items/1", async (route) => {
      if (route.request().method() === "PUT") {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ message: "Item no longer exists" }),
        });
      } else {
        await route.continue();
      }
    });

    await licensingAdminPage.getEditButton(1).click();
    await licensingAdminPage.licensingItemForm.waitFor({ state: "visible" });
    await licensingAdminPage.formTitleEnInput.fill("Updated Title");
    await licensingAdminPage.formSaveButton.click();

    // Form should still be visible after 404 error (user can retry)
    await expect(licensingAdminPage.licensingItemForm).toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 19: Handles 401 redirect on expired session /
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
    await expect(page.getByText("Admin Login")).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder("admin@example.com")).toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 20: Bulk reorder with 4+ items //////////////
  /////////////////////////////////////////////////////////////////

  test("bulk reorder with 4+ items", async ({ page }) => {
    // Mock GET returning 4 items
    const fourItems = [
      ...DEFAULT_LICENSING_ITEMS,
      {
        id: 3,
        icon: "FiGlobe",
        title_en: "International License",
        title_ar: "ترخيص دولي",
        desc_en: "License for international operations",
        desc_ar: "ترخيص للعمليات الدولية",
        tag_en: "Global",
        tag_ar: "عالمي",
        sort_order: 3,
        homePageContentId: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: 4,
        icon: "FiStar",
        title_en: "Premium License",
        title_ar: "ترخيص مميز",
        desc_en: "Premium licensing package",
        desc_ar: "حزمة ترخيص مميزة",
        tag_en: "Premium",
        tag_ar: "مميز",
        sort_order: 4,
        homePageContentId: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    await page.unroute("**/api/admin/licensing-items");
    await page.route("**/api/admin/licensing-items", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(fourItems),
        });
      } else {
        await route.continue();
      }
    });

    let reorderPayload: number[] = [];
    await page.unroute("**/api/admin/licensing-items/reorder");
    await page.route("**/api/admin/licensing-items/reorder", async (route) => {
      if (route.request().method() === "PATCH") {
        const body = route.request().postDataJSON();
        reorderPayload = body.ids ?? [];
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            fourItems[2],
            fourItems[0],
            fourItems[3],
            fourItems[1],
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Reload to get 4 items
    await page.reload({ waitUntil: "commit" });
    await page.waitForLoadState("networkidle");

    const freshPage = new LicensingAdminPage(page);

    // Verify 4 cards are visible
    await expect(freshPage.getLicensingCard(3)).toBeVisible();
    await expect(freshPage.getLicensingCard(4)).toBeVisible();

    // Move item 3 up once (from position 3 to position 2)
    await freshPage.getMoveUpButton(3).click();
    await page.waitForTimeout(500);

    // Verify reorder was called with correct ids
    expect(reorderPayload.length).toBe(4);
    expect(reorderPayload).toContain(3);
  });
});
