import { test, expect, type Page } from "@playwright/test";
import { ProcessAdminPage, type ProcessStepFormData } from "../pages/process-admin.page";

///////////////////////////////////////////////////////////////////////
/////////// Process Section — Admin CRUD E2E Tests ////////////////////
///////////////////////////////////////////////////////////////////////

const DEFAULT_PROCESS_STEPS = [
  {
    id: 1,
    step_number: 1,
    title_en: "Submit Application",
    title_ar: "تقديم الطلب",
    desc_en: "Fill out and submit your application form",
    desc_ar: "املأ نموذج الطلب وقدمه",
    sort_order: 1,
    homePageContentId: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    step_number: 2,
    title_en: "Document Review",
    title_ar: "مراجعة المستندات",
    desc_en: "Our team reviews your submitted documents",
    desc_ar: "يقوم فريقنا بمراجعة المستندات المقدمة",
    sort_order: 2,
    homePageContentId: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

///////////////////////////////////////////////////////////////////////
/////////// Helper: Login with mocked auth ////////////////////////////
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
/////////// Test Suite ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

test.describe("Process Section — Admin CRUD", () => {
  let processAdminPage: ProcessAdminPage;

  test.beforeEach(async ({ page }) => {
    // Set up process-steps mock BEFORE login
    await page.route("**/api/admin/process-steps", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(DEFAULT_PROCESS_STEPS),
        });
      } else if (route.request().method() === "POST") {
        const postData = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 3,
            step_number: postData.step_number ?? 3,
            title_en: postData.title_en ?? null,
            title_ar: postData.title_ar ?? null,
            desc_en: postData.desc_en ?? null,
            desc_ar: postData.desc_ar ?? null,
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

    // Mock single step PUT/DELETE
    await page.route("**/api/admin/process-steps/:id", async (route) => {
      if (route.request().method() === "PUT") {
        const postData = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...DEFAULT_PROCESS_STEPS[0],
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
    await page.route("**/api/admin/process-steps/reorder", async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(DEFAULT_PROCESS_STEPS),
        });
      } else {
        await route.continue();
      }
    });

    // Mock single step reorder endpoint
    await page.route("**/api/admin/process-steps/*/reorder", async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(DEFAULT_PROCESS_STEPS[0]),
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

    processAdminPage = new ProcessAdminPage(page);
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 1: Displays process steps list ///////////////
  /////////////////////////////////////////////////////////////////

  test("displays process steps list when steps exist", async () => {
    await expect(processAdminPage.processSection).toBeVisible();
    await expect(processAdminPage.getStepCard(1)).toBeVisible();
    await expect(processAdminPage.getStepCard(2)).toBeVisible();
    await expect(processAdminPage.getStepCard(1)).toContainText("Submit Application");
    await expect(processAdminPage.getStepCard(2)).toContainText("Document Review");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 2: Shows empty state when no steps ///////////
  /////////////////////////////////////////////////////////////////

  test("shows empty state when no process steps", async ({ page }) => {
    await page.route("**/api/admin/process-steps", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/en/admin");
    await page.waitForLoadState("networkidle");

    const freshPage = new ProcessAdminPage(page);
    await expect(freshPage.emptyStateMessage).toBeVisible();
    await expect(freshPage.addProcessStepButton).toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 3: Creates a new process step ////////////////
  /////////////////////////////////////////////////////////////////

  test("creates a new process step", async ({ page }) => {
    let postPayload: Record<string, unknown> = {};

    await page.unroute("**/api/admin/process-steps");
    await page.route("**/api/admin/process-steps", async (route) => {
      if (route.request().method() === "POST") {
        postPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 3,
            step_number: postPayload.step_number ?? 3,
            title_en: postPayload.title_en ?? null,
            title_ar: postPayload.title_ar ?? null,
            desc_en: postPayload.desc_en ?? null,
            desc_ar: postPayload.desc_ar ?? null,
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
          body: JSON.stringify(DEFAULT_PROCESS_STEPS),
        });
      }
    });

    await processAdminPage.addProcessStep({
      stepNumber: "3",
      titleEn: "Final Approval",
      titleAr: "الموافقة النهائية",
      descEn: "Final review and approval of your application",
      descAr: "المراجعة النهائية والموافقة على طلبك",
    });

    expect(postPayload.step_number).toBe(3);
    expect(postPayload.title_en).toBe("Final Approval");
    expect(postPayload.title_ar).toBe("الموافقة النهائية");
    expect(postPayload.desc_en).toBe("Final review and approval of your application");
    expect(postPayload.desc_ar).toBe("المراجعة النهائية والموافقة على طلبك");

    await processAdminPage.waitForStepCard(3);
    await expect(processAdminPage.getStepCard(3)).toBeVisible();
    await expect(processAdminPage.getStepCard(3)).toContainText("Final Approval");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 4: Edits an existing process step ////////////
  /////////////////////////////////////////////////////////////////

  test("edits an existing process step", async ({ page }) => {
    let putPayload: Record<string, unknown> = {};
    await page.route("**/api/admin/process-steps/1", async (route) => {
      if (route.request().method() === "PUT") {
        putPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            step_number: 1,
            title_en: "Updated Application Submission",
            title_ar: "تحديث تقديم الطلب",
            desc_en: "Updated description for application submission",
            desc_ar: "وصف محدث لتقديم الطلب",
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

    await processAdminPage.editProcessStep(1, {
      stepNumber: "1",
      titleEn: "Updated Application Submission",
      titleAr: "تحديث تقديم الطلب",
      descEn: "Updated description for application submission",
      descAr: "وصف محدث لتقديم الطلب",
    });

    expect(putPayload.title_en).toBe("Updated Application Submission");
    expect(putPayload.title_ar).toBe("تحديث تقديم الطلب");
    expect(putPayload.desc_en).toBe("Updated description for application submission");
    expect(putPayload.desc_ar).toBe("وصف محدث لتقديم الطلب");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 5: Edits bilingual title and description ///
  /////////////////////////////////////////////////////////////////

  test("edits bilingual title and description (EN + AR)", async ({ page }) => {
    let putPayload: Record<string, unknown> = {};
    await page.route("**/api/admin/process-steps/1", async (route) => {
      if (route.request().method() === "PUT") {
        putPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            step_number: 1,
            title_en: "Updated EN Title",
            title_ar: "تحديث العنوان العربي",
            desc_en: "Updated EN Description",
            desc_ar: "تحديث الوصف العربي",
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

    await processAdminPage.getEditButton(1).click();
    await processAdminPage.processStepForm.waitFor({ state: "visible" });

    await processAdminPage.formTitleEnInput.fill("Updated EN Title");
    await processAdminPage.formTitleArInput.fill("تحديث العنوان العربي");
    await processAdminPage.formDescEnInput.fill("Updated EN Description");
    await processAdminPage.formDescArInput.fill("تحديث الوصف العربي");
    await processAdminPage.formSaveButton.click();

    expect(putPayload.title_en).toBe("Updated EN Title");
    expect(putPayload.title_ar).toBe("تحديث العنوان العربي");
    expect(putPayload.desc_en).toBe("Updated EN Description");
    expect(putPayload.desc_ar).toBe("تحديث الوصف العربي");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 6: Deletes a process step ////////////////////
  /////////////////////////////////////////////////////////////////

  test("deletes a process step with confirmation", async ({ page }) => {
    let deleteCalled = false;
    await page.route("**/api/admin/process-steps/1", async (route) => {
      if (route.request().method() === "DELETE") {
        deleteCalled = true;
        await route.fulfill({ status: 200 });
      } else {
        await route.continue();
      }
    });

    await processAdminPage.deleteProcessStep(1);

    expect(deleteCalled).toBe(true);
    await processAdminPage.waitForStepCardHidden(1);
    await expect(processAdminPage.getStepCard(1)).not.toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 7: Cancels delete of a process step /////////
  /////////////////////////////////////////////////////////////////

  test("cancels delete of a process step", async ({ page }) => {
    let deleteCalled = false;
    await page.route("**/api/admin/process-steps/1", async (route) => {
      if (route.request().method() === "DELETE") {
        deleteCalled = true;
        await route.fulfill({ status: 200 });
      } else {
        await route.continue();
      }
    });

    await processAdminPage.cancelDeleteProcessStep(1);

    expect(deleteCalled).toBe(false);
    await expect(processAdminPage.getStepCard(1)).toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 8: Reorders process steps via up/down ///////
  /////////////////////////////////////////////////////////////////

  test("reorders process steps via up/down buttons", async ({ page }) => {
    let reorderPayload: number[] = [];

    // Override the reorder route from beforeEach
    await page.unroute("**/api/admin/process-steps/reorder");
    await page.route("**/api/admin/process-steps/reorder", async (route) => {
      if (route.request().method() === "PATCH") {
        const body = route.request().postDataJSON();
        reorderPayload = body.ids ?? [];
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([DEFAULT_PROCESS_STEPS[1], DEFAULT_PROCESS_STEPS[0]]),
        });
      } else {
        await route.continue();
      }
    });

    // Move item 2 up (swap with item 1)
    await processAdminPage.getMoveUpButton(2).click();

    // Wait a moment for the API call to complete
    await page.waitForTimeout(500);

    expect(reorderPayload).toEqual([2, 1]);
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 9: Shows loading state during fetch /////////
  /////////////////////////////////////////////////////////////////

  test("shows loading state during fetch", async ({ page }) => {
    await page.unroute("**/api/admin/process-steps");
    await page.route("**/api/admin/process-steps", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(DEFAULT_PROCESS_STEPS),
      });
    });

    // Reload to trigger fresh fetch with new route
    await page.reload({ waitUntil: "commit" });

    const freshPage = new ProcessAdminPage(page);
    // Wait for skeleton to appear
    await expect(freshPage.loadingSkeleton.first()).toBeVisible({ timeout: 5000 });

    // Wait for data to load
    await expect(freshPage.getStepCard(1)).toBeVisible({ timeout: 10000 });
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 10: Shows error state on fetch failure /////
  /////////////////////////////////////////////////////////////////

  test("shows error state on fetch failure", async ({ page }) => {
    await page.unroute("**/api/admin/process-steps");
    await page.route("**/api/admin/process-steps", async (route) => {
      await route.fulfill({ status: 500, body: "Server Error" });
    });

    // Reload to trigger fresh fetch with new route
    await page.reload({ waitUntil: "commit" });

    const freshPage = new ProcessAdminPage(page);
    await expect(freshPage.retryButton).toBeVisible({ timeout: 10000 });
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 11: Form modal opens in create mode /////////
  /////////////////////////////////////////////////////////////////

  test("form modal opens in create mode with empty fields", async () => {
    await processAdminPage.addProcessStepButton.click();
    await processAdminPage.processStepForm.waitFor({ state: "visible" });

    await expect(processAdminPage.processStepFormTitle).toContainText(/Add|إضافة/);
    await expect(processAdminPage.formStepNumberInput).toHaveValue("1");
    await expect(processAdminPage.formTitleEnInput).toHaveValue("");
    await expect(processAdminPage.formTitleArInput).toHaveValue("");
    await expect(processAdminPage.formDescEnInput).toHaveValue("");
    await expect(processAdminPage.formDescArInput).toHaveValue("");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 12: Form modal opens in edit mode ///////////
  /////////////////////////////////////////////////////////////////

  test("form modal opens in edit mode with pre-filled data", async () => {
    await processAdminPage.getEditButton(1).click();
    await processAdminPage.processStepForm.waitFor({ state: "visible" });

    await expect(processAdminPage.processStepFormTitle).toContainText(/Edit|تعديل/);
    await expect(processAdminPage.formStepNumberInput).toHaveValue("1");
    await expect(processAdminPage.formTitleEnInput).toHaveValue("Submit Application");
    await expect(processAdminPage.formTitleArInput).toHaveValue("تقديم الطلب");
    await expect(processAdminPage.formDescEnInput).toHaveValue(
      "Fill out and submit your application form",
    );
    await expect(processAdminPage.formDescArInput).toHaveValue(
      "املأ نموذج الطلب وقدمه",
    );
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 13: Form closes on Cancel button ////////////
  /////////////////////////////////////////////////////////////////

  test("form modal closes when clicking Cancel", async () => {
    await processAdminPage.addProcessStepButton.click();
    await processAdminPage.processStepForm.waitFor({ state: "visible" });

    await processAdminPage.formCancelButton.click();
    await expect(processAdminPage.processStepForm).not.toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 14: Form closes on Escape key ///////////////
  /////////////////////////////////////////////////////////////////

  test("form modal closes when pressing Escape", async ({ page }) => {
    await processAdminPage.addProcessStepButton.click();
    await processAdminPage.processStepForm.waitFor({ state: "visible" });

    // Focus the modal container before pressing Escape
    await page.locator('[data-testid="process-step-form-modal"]').focus();
    await page.keyboard.press("Escape");
    await expect(processAdminPage.processStepForm).not.toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 15: Shows validation errors /////////////////
  /////////////////////////////////////////////////////////////////

  test("shows validation errors on create form", async ({ page }) => {
    await processAdminPage.addProcessStepButton.click();
    await processAdminPage.processStepForm.waitFor({ state: "visible" });

    // Clear step number to trigger validation
    await processAdminPage.formStepNumberInput.fill("0");

    // Click save to trigger validation
    await processAdminPage.formSaveButton.click();

    // Validation error should appear
    await expect(page.getByText(/Step number must be at least 1/)).toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 16: Character counter on description ////////
  /////////////////////////////////////////////////////////////////

  test("character counter on description fields", async () => {
    await processAdminPage.addProcessStepButton.click();
    await processAdminPage.processStepForm.waitFor({ state: "visible" });

    // Type in desc_en
    await processAdminPage.formDescEnInput.fill("Test description");

    // Counter should show "16/2000"
    const counterText = processAdminPage.processStepForm.locator('text=/[0-9]+\/2000/');
    await expect(counterText.first()).toContainText("16/2000");
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 17: Optional fields can be left empty //////
  /////////////////////////////////////////////////////////////////

  test("optional fields (title, desc) can be left empty", async ({ page }) => {
    let postPayload: Record<string, unknown> = {};

    await page.unroute("**/api/admin/process-steps");
    await page.route("**/api/admin/process-steps", async (route) => {
      if (route.request().method() === "POST") {
        postPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 3,
            step_number: postPayload.step_number ?? 3,
            title_en: postPayload.title_en ?? null,
            title_ar: postPayload.title_ar ?? null,
            desc_en: postPayload.desc_en ?? null,
            desc_ar: postPayload.desc_ar ?? null,
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
          body: JSON.stringify(DEFAULT_PROCESS_STEPS),
        });
      }
    });

    // Fill only step_number and title_en
    await processAdminPage.addProcessStep({
      stepNumber: "3",
      titleEn: "Minimal Step",
    });

    expect(postPayload.title_en).toBe("Minimal Step");
    expect(postPayload.title_ar).toBeUndefined();
    expect(postPayload.desc_en).toBeUndefined();
    expect(postPayload.desc_ar).toBeUndefined();

    await processAdminPage.waitForStepCard(3);
    await expect(processAdminPage.getStepCard(3)).toBeVisible();
  });

  /////////////////////////////////////////////////////////////////
  ///////////// Test 18: Handles 404 on update of deleted step ///
  /////////////////////////////////////////////////////////////////

  test("handles 404 on update of deleted step", async ({ page }) => {
    await page.route("**/api/admin/process-steps/1", async (route) => {
      if (route.request().method() === "PUT") {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ message: "Step no longer exists" }),
        });
      } else {
        await route.continue();
      }
    });

    await processAdminPage.getEditButton(1).click();
    await processAdminPage.processStepForm.waitFor({ state: "visible" });
    await processAdminPage.formTitleEnInput.fill("Updated Title");
    await processAdminPage.formSaveButton.click();

    // Form should still be visible after 404 error (user can retry)
    await expect(processAdminPage.processStepForm).toBeVisible();
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
  ///////////// Test 20: Bulk reorder with 4+ steps //////////////
  /////////////////////////////////////////////////////////////////

  test("bulk reorder with 4+ steps", async ({ page }) => {
    // Mock GET returning 4 steps
    const fourSteps = [
      ...DEFAULT_PROCESS_STEPS,
      {
        id: 3,
        step_number: 3,
        title_en: "Payment Processing",
        title_ar: "معالجة الدفع",
        desc_en: "Process your payment for the application",
        desc_ar: "معالجة الدفع للطلب",
        sort_order: 3,
        homePageContentId: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: 4,
        step_number: 4,
        title_en: "Certificate Issuance",
        title_ar: "إصدار الشهادة",
        desc_en: "Receive your official certificate",
        desc_ar: "استلام شهادتك الرسمية",
        sort_order: 4,
        homePageContentId: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    await page.unroute("**/api/admin/process-steps");
    await page.route("**/api/admin/process-steps", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(fourSteps),
        });
      } else {
        await route.continue();
      }
    });

    let reorderPayload: number[] = [];
    await page.unroute("**/api/admin/process-steps/reorder");
    await page.route("**/api/admin/process-steps/reorder", async (route) => {
      if (route.request().method() === "PATCH") {
        const body = route.request().postDataJSON();
        reorderPayload = body.ids ?? [];
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            fourSteps[2],
            fourSteps[0],
            fourSteps[3],
            fourSteps[1],
          ]),
        });
      } else {
        await route.continue();
      }
    });

    // Reload to get 4 steps
    await page.reload({ waitUntil: "commit" });
    await page.waitForLoadState("networkidle");

    const freshPage = new ProcessAdminPage(page);

    // Verify 4 cards are visible
    await expect(freshPage.getStepCard(3)).toBeVisible();
    await expect(freshPage.getStepCard(4)).toBeVisible();

    // Move step 3 up once (from position 3 to position 2)
    await freshPage.getMoveUpButton(3).click();
    await page.waitForTimeout(500);

    // Verify reorder was called with correct ids
    expect(reorderPayload.length).toBe(4);
    expect(reorderPayload).toContain(3);
  });
});
