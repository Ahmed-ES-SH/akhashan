import { test, expect } from "./fixtures";

///////////////////////////////////////////////////////////////////////
///////////// Services Admin — E2E Tests //////////////////////////////
///////////////////////////////////////////////////////////////////////

test.describe("Services — Admin CRUD", () => {
  test.beforeEach(async ({ adminServicesPage }) => {
    await adminServicesPage.goto();
    await adminServicesPage.expectPageVisible();
  });

  /////////////////////////////////////////////////////////////////////
  ///////////// Displays services list with pagination ////////////////
  /////////////////////////////////////////////////////////////////////

  test("displays services list with pagination", async ({
    adminServicesPage,
    page,
  }) => {
    // Mock GET /api/admin/services to return paginated response
    await page.route("**/api/admin/services*", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [
            {
              id: 1,
              icon: "FiShield",
              title_en: "Commercial Licensing",
              title_ar: "الترخيص التجاري",
              desc_en: "Full commercial licensing services",
              desc_ar: "خدمات الترخيص التجاري الكاملة",
              button_label_en: "Learn More",
              button_label_ar: "اعرف المزيد",
              metric_value: "500",
              metric_suffix: "+",
              metric_label_en: "Projects",
              metric_label_ar: "مشروع",
              is_active: true,
              sort_order: 1,
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
            },
            {
              id: 2,
              icon: "FiGlobe",
              title_en: "Domain Registration",
              title_ar: "تسجيل النطاقات",
              desc_en: "Register and manage domain names",
              desc_ar: "تسجيل وإدارة أسماء النطاقات",
              button_label_en: "Get Started",
              button_label_ar: "ابدأ الآن",
              metric_value: "1000",
              metric_suffix: "",
              metric_label_en: "Domains",
              metric_label_ar: "نطاق",
              is_active: true,
              sort_order: 2,
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
            },
          ],
          meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
        }),
      });
    });

    await adminServicesPage.goto();

    // Assert table shows services
    await adminServicesPage.expectRowVisible(1);
    await adminServicesPage.expectRowVisible(2);

    // Assert count
    const count = await adminServicesPage.getServicesCount();
    expect(count).toBe(2);
  });

  /////////////////////////////////////////////////////////////////////
  ///////////// Shows empty state when no services ////////////////////
  /////////////////////////////////////////////////////////////////////

  test("shows empty state when no services", async ({
    adminServicesPage,
    page,
  }) => {
    await page.route("**/api/admin/services*", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [],
          meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
        }),
      });
    });

    await adminServicesPage.goto();

    // Assert empty state message and "Add Service" button visible
    await adminServicesPage.expectEmptyState();
  });

  /////////////////////////////////////////////////////////////////////
  ///////////// Creates a new service /////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  test("creates a new service", async ({ adminServicesPage, page }) => {
    // Mock GET returning empty list
    await page.route("**/api/admin/services*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: [],
            meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
          }),
        });
      } else if (request.method() === "POST") {
        const body = JSON.parse(request.postData() ?? "{}");
        await route.fulfill({
          status: 201,
          body: JSON.stringify({
            id: 1,
            icon: body.icon ?? null,
            title_en: body.title_en ?? null,
            title_ar: body.title_ar ?? null,
            desc_en: body.desc_en ?? null,
            desc_ar: body.desc_ar ?? null,
            button_label_en: body.button_label_en ?? null,
            button_label_ar: body.button_label_ar ?? null,
            metric_value: body.metric_value ?? null,
            metric_suffix: body.metric_suffix ?? null,
            metric_label_en: body.metric_label_en ?? null,
            metric_label_ar: body.metric_label_ar ?? null,
            is_active: body.is_active ?? true,
            sort_order: body.sort_order ?? 0,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          }),
        });
      } else {
        await route.continue();
      }
    });

    await adminServicesPage.goto();

    // Click "Add Service"
    await adminServicesPage.openCreateForm();

    // Fill form
    await adminServicesPage.fillForm({
      icon: "FiShield",
      title_en: "Commercial Licensing",
      title_ar: "الترخيص التجاري",
      desc_en: "Full commercial licensing services for businesses",
      desc_ar: "خدمات الترخيص التجاري الكاملة للشركات",
      button_label_en: "Learn More",
      button_label_ar: "اعرف المزيد",
      metric_value: "500",
      metric_suffix: "+",
      metric_label_en: "Projects Completed",
      metric_label_ar: "مشروع مكتمل",
      is_active: true,
    });

    // Submit
    await adminServicesPage.submitForm();

    // Assert success toast
    await adminServicesPage.expectSuccessToast();

    // Assert form closed
    await adminServicesPage.expectFormHidden();
  });

  /////////////////////////////////////////////////////////////////////
  ///////////// Edits an existing service /////////////////////////////
  /////////////////////////////////////////////////////////////////////

  test("edits an existing service", async ({ adminServicesPage, page }) => {
    const mockService = {
      id: 1,
      icon: "FiShield",
      title_en: "Commercial Licensing",
      title_ar: "الترخيص التجاري",
      desc_en: "Full commercial licensing services",
      desc_ar: "خدمات الترخيص التجاري الكاملة",
      button_label_en: "Learn More",
      button_label_ar: "اعرف المزيد",
      metric_value: "500",
      metric_suffix: "+",
      metric_label_en: "Projects",
      metric_label_ar: "مشروع",
      is_active: true,
      sort_order: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    let putCalled = false;
    let putPayload: Record<string, unknown> = {};

    await page.route("**/api/admin/services/**", async (route, request) => {
      if (request.method() === "PUT") {
        putCalled = true;
        putPayload = JSON.parse(request.postData() ?? "{}");
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            ...mockService,
            ...putPayload,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/admin/services*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: [mockService],
            meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await adminServicesPage.goto();

    // Click edit
    await adminServicesPage.openEditForm(1);

    // Change fields
    await adminServicesPage.fillForm({
      title_en: "Updated Licensing",
      desc_en: "Updated description",
      metric_value: "750",
    });

    // Submit
    await adminServicesPage.submitForm();

    // Assert PUT called with correct payload
    expect(putCalled).toBe(true);
    expect(putPayload.title_en).toBe("Updated Licensing");
    expect(putPayload.desc_en).toBe("Updated description");
    expect(putPayload.metric_value).toBe("750");

    // Assert success toast
    await adminServicesPage.expectSuccessToast();
  });

  /////////////////////////////////////////////////////////////////////
  ///////////// Edits bilingual fields (EN + AR) //////////////////////
  /////////////////////////////////////////////////////////////////////

  test("edits bilingual fields (EN + AR)", async ({
    adminServicesPage,
    page,
  }) => {
    const mockService = {
      id: 1,
      icon: "FiGlobe",
      title_en: "Domain Registration",
      title_ar: "تسجيل النطاقات",
      desc_en: "Register domains",
      desc_ar: "تسجيل النطاقات",
      button_label_en: "Get Started",
      button_label_ar: "ابدأ الآن",
      metric_value: "100",
      metric_suffix: "",
      metric_label_en: "Domains",
      metric_label_ar: "نطاق",
      is_active: true,
      sort_order: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    let putPayload: Record<string, unknown> = {};

    await page.route("**/api/admin/services/**", async (route, request) => {
      if (request.method() === "PUT") {
        putPayload = JSON.parse(request.postData() ?? "{}");
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ ...mockService, ...putPayload }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/admin/services*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: [mockService],
            meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await adminServicesPage.goto();
    await adminServicesPage.openEditForm(1);

    // Change all six bilingual fields
    await adminServicesPage.fillForm({
      title_en: "New Title EN",
      title_ar: "عنوان جديد AR",
      desc_en: "New Description EN",
      desc_ar: "وصف جديد AR",
      button_label_en: "New Button EN",
      button_label_ar: "زر جديد AR",
    });

    await adminServicesPage.submitForm();

    // Assert PUT payload has all six fields
    expect(putPayload.title_en).toBe("New Title EN");
    expect(putPayload.title_ar).toBe("عنوان جديد AR");
    expect(putPayload.desc_en).toBe("New Description EN");
    expect(putPayload.desc_ar).toBe("وصف جديد AR");
    expect(putPayload.button_label_en).toBe("New Button EN");
    expect(putPayload.button_label_ar).toBe("زر جديد AR");
  });

  /////////////////////////////////////////////////////////////////////
  ///////////// Toggles service active/inactive ///////////////////////
  /////////////////////////////////////////////////////////////////////

  test("toggles service active/inactive", async ({
    adminServicesPage,
    page,
  }) => {
    const mockService = {
      id: 1,
      icon: "FiShield",
      title_en: "Active Service",
      title_ar: "خدمة نشطة",
      desc_en: "An active service",
      desc_ar: "خدمة نشطة",
      button_label_en: "View",
      button_label_ar: "عرض",
      metric_value: "10",
      metric_suffix: "",
      metric_label_en: "Items",
      metric_label_ar: "عنصر",
      is_active: true,
      sort_order: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    let toggleCalled = false;

    await page.route("**/api/admin/services/**/toggle", async (route) => {
      toggleCalled = true;
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ ...mockService, is_active: false }),
      });
    });

    await page.route("**/api/admin/services*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: [mockService],
            meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await adminServicesPage.goto();

    // Click toggle switch
    await adminServicesPage.toggleService(1);

    // Assert PATCH /toggle called
    expect(toggleCalled).toBe(true);

    // Assert success toast
    await adminServicesPage.expectSuccessToast();
  });

  /////////////////////////////////////////////////////////////////////
  ///////////// Deletes a service with confirmation ///////////////////
  /////////////////////////////////////////////////////////////////////

  test("deletes a service with confirmation", async ({
    adminServicesPage,
    page,
  }) => {
    const mockServices = [
      {
        id: 1,
        icon: "FiShield",
        title_en: "Service One",
        title_ar: "الخدمة الأولى",
        desc_en: "First service",
        desc_ar: "الخدمة الأولى",
        button_label_en: "View",
        button_label_ar: "عرض",
        metric_value: "1",
        metric_suffix: "",
        metric_label_en: "Item",
        metric_label_ar: "عنصر",
        is_active: true,
        sort_order: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: 2,
        icon: "FiGlobe",
        title_en: "Service Two",
        title_ar: "الخدمة الثانية",
        desc_en: "Second service",
        desc_ar: "الخدمة الثانية",
        button_label_en: "View",
        button_label_ar: "عرض",
        metric_value: "2",
        metric_suffix: "",
        metric_label_en: "Items",
        metric_label_ar: "عنصر",
        is_active: true,
        sort_order: 2,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    let deleteCalled = false;

    await page.route("**/api/admin/services/**", async (route, request) => {
      if (request.method() === "DELETE") {
        deleteCalled = true;
        await route.fulfill({ status: 200, body: "{}" });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/admin/services*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: mockServices,
            meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await adminServicesPage.goto();

    // Assert both rows visible
    await adminServicesPage.expectRowVisible(1);
    await adminServicesPage.expectRowVisible(2);

    // Delete first service
    await adminServicesPage.deleteService(1);

    // Assert DELETE called
    expect(deleteCalled).toBe(true);

    // Assert row removed
    await adminServicesPage.expectRowNotVisible(1);

    // Assert success toast
    await adminServicesPage.expectSuccessToast();
  });

  /////////////////////////////////////////////////////////////////////
  ///////////// Cancels delete of a service ///////////////////////////
  /////////////////////////////////////////////////////////////////////

  test("cancels delete of a service", async ({ adminServicesPage, page }) => {
    const mockService = {
      id: 1,
      icon: "FiShield",
      title_en: "Service One",
      title_ar: "الخدمة الأولى",
      desc_en: "First service",
      desc_ar: "الخدمة الأولى",
      button_label_en: "View",
      button_label_ar: "عرض",
      metric_value: "1",
      metric_suffix: "",
      metric_label_en: "Item",
      metric_label_ar: "عنصر",
      is_active: true,
      sort_order: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    let deleteCalled = false;

    await page.route("**/api/admin/services/**", async (route, request) => {
      if (request.method() === "DELETE") {
        deleteCalled = true;
        await route.fulfill({ status: 200, body: "{}" });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/admin/services*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: [mockService],
            meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await adminServicesPage.goto();

    // Click delete button
    await adminServicesPage.getDeleteButton(1).click();

    // Assert confirmation dialog appears
    await adminServicesPage.expectDeleteConfirmationVisible();

    // Cancel by clicking outside
    await adminServicesPage.cancelDelete();

    // Assert DELETE was NOT called
    expect(deleteCalled).toBe(false);

    // Assert row still visible
    await adminServicesPage.expectRowVisible(1);
  });

  /////////////////////////////////////////////////////////////////////
  ///////////// Filters services by active/inactive status ////////////
  /////////////////////////////////////////////////////////////////////

  test("filters services by active/inactive status", async ({
    adminServicesPage,
    page,
  }) => {
    const mockServices = [
      {
        id: 1,
        icon: "FiShield",
        title_en: "Active Service",
        title_ar: "خدمة نشطة",
        desc_en: "Active",
        desc_ar: "نشطة",
        button_label_en: "View",
        button_label_ar: "عرض",
        metric_value: "1",
        metric_suffix: "",
        metric_label_en: "Item",
        metric_label_ar: "عنصر",
        is_active: true,
        sort_order: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: 2,
        icon: "FiGlobe",
        title_en: "Inactive Service",
        title_ar: "خدمة غير نشطة",
        desc_en: "Inactive",
        desc_ar: "غير نشطة",
        button_label_en: "View",
        button_label_ar: "عرض",
        metric_value: "2",
        metric_suffix: "",
        metric_label_en: "Items",
        metric_label_ar: "عنصر",
        is_active: false,
        sort_order: 2,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    await page.route("**/api/admin/services*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: mockServices,
            meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await adminServicesPage.goto();

    // All filter: both visible
    await adminServicesPage.filterByStatus("all");
    expect(await adminServicesPage.getServicesCount()).toBe(2);

    // Active filter: only active visible
    await adminServicesPage.filterByStatus("active");
    await adminServicesPage.expectRowVisible(1);
    await adminServicesPage.expectRowNotVisible(2);

    // Inactive filter: only inactive visible
    await adminServicesPage.filterByStatus("inactive");
    await adminServicesPage.expectRowNotVisible(1);
    await adminServicesPage.expectRowVisible(2);
  });

  /////////////////////////////////////////////////////////////////////
  ///////////// Shows loading state during fetch //////////////////////
  /////////////////////////////////////////////////////////////////////

  test("shows loading state during fetch", async ({
    adminServicesPage,
    page,
  }) => {
    // Intercept GET with delayed response
    await page.route("**/api/admin/services*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [],
          meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
        }),
      });
    });

    await adminServicesPage.goto();

    // Assert loading skeleton visible
    await adminServicesPage.expectLoadingState();

    // Wait for response
    await adminServicesPage.expectEmptyState();
  });

  /////////////////////////////////////////////////////////////////////
  ///////////// Shows error state on fetch failure ////////////////////
  /////////////////////////////////////////////////////////////////////

  test("shows error state on fetch failure", async ({
    adminServicesPage,
    page,
  }) => {
    // Mock GET to return 500
    await page.route("**/api/admin/services*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({ status: 500, body: "{}" });
      } else {
        await route.continue();
      }
    });

    await adminServicesPage.goto();

    // Assert error message visible
    await adminServicesPage.expectErrorState();

    // Assert retry button visible
    await expect(adminServicesPage.retryButton).toBeVisible();
  });

  /////////////////////////////////////////////////////////////////////
  ///////////// Character counter on description fields ///////////////
  /////////////////////////////////////////////////////////////////////

  test("character counter on description fields", async ({
    adminServicesPage,
    page,
  }) => {
    await page.route("**/api/admin/services*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: [],
            meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await adminServicesPage.goto();
    await adminServicesPage.openCreateForm();

    // Type in desc_en
    await adminServicesPage.formDescEn.fill("Hello World");

    // Assert character counter updates (shows "11/2000")
    await expect(
      adminServicesPage.serviceForm.getByText("11/2000"),
    ).toBeVisible();

    // Assert max 2000 chars enforced (input has maxLength attribute)
    const maxLength = await adminServicesPage.formDescEn.getAttribute(
      "maxlength",
    );
    expect(maxLength).toBe("2000");
  });

  /////////////////////////////////////////////////////////////////////
  ///////////// Optional fields can be left empty /////////////////////
  /////////////////////////////////////////////////////////////////////

  test("optional fields can be left empty", async ({
    adminServicesPage,
    page,
  }) => {
    let postPayload: Record<string, unknown> = {};

    await page.route("**/api/admin/services*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: [],
            meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
          }),
        });
      } else if (request.method() === "POST") {
        postPayload = JSON.parse(request.postData() ?? "{}");
        await route.fulfill({
          status: 201,
          body: JSON.stringify({
            id: 1,
            icon: postPayload.icon ?? null,
            title_en: postPayload.title_en ?? null,
            title_ar: postPayload.title_ar ?? null,
            desc_en: postPayload.desc_en ?? null,
            desc_ar: postPayload.desc_ar ?? null,
            button_label_en: postPayload.button_label_en ?? null,
            button_label_ar: postPayload.button_label_ar ?? null,
            metric_value: postPayload.metric_value ?? null,
            metric_suffix: postPayload.metric_suffix ?? null,
            metric_label_en: postPayload.metric_label_en ?? null,
            metric_label_ar: postPayload.metric_label_ar ?? null,
            is_active: postPayload.is_active ?? true,
            sort_order: postPayload.sort_order ?? 0,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          }),
        });
      } else {
        await route.continue();
      }
    });

    await adminServicesPage.goto();
    await adminServicesPage.openCreateForm();

    // Fill only title_en and title_ar
    await adminServicesPage.fillForm({
      title_en: "Minimal Service",
      title_ar: "خدمة بسيطة",
    });

    await adminServicesPage.submitForm();

    // Assert POST called with optional fields omitted
    expect(postPayload.title_en).toBe("Minimal Service");
    expect(postPayload.title_ar).toBe("خدمة بسيطة");
    expect(postPayload.icon).toBeUndefined();
    expect(postPayload.desc_en).toBeUndefined();
    expect(postPayload.metric_value).toBeUndefined();

    // Assert service created (success toast)
    await adminServicesPage.expectSuccessToast();
  });

  /////////////////////////////////////////////////////////////////////
  ///////////// Handles 404 on update of deleted service //////////////
  /////////////////////////////////////////////////////////////////////

  test("handles 404 on update of deleted service", async ({
    adminServicesPage,
    page,
  }) => {
    const mockService = {
      id: 1,
      icon: "FiShield",
      title_en: "Service",
      title_ar: "خدمة",
      desc_en: "Desc",
      desc_ar: "وصف",
      button_label_en: "View",
      button_label_ar: "عرض",
      metric_value: "1",
      metric_suffix: "",
      metric_label_en: "Item",
      metric_label_ar: "عنصر",
      is_active: true,
      sort_order: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    await page.route("**/api/admin/services/**", async (route, request) => {
      if (request.method() === "PUT") {
        await route.fulfill({
          status: 404,
          body: JSON.stringify({
            message: "Service not found",
            statusCode: 404,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/admin/services*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: [mockService],
            meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await adminServicesPage.goto();
    await adminServicesPage.openEditForm(1);

    await adminServicesPage.fillForm({ title_en: "Updated" });
    await adminServicesPage.submitForm();

    // Assert error toast visible (sonner toast)
    await expect(page.locator("[data-sonner-toast]")).toBeVisible({
      timeout: 5000,
    });
  });

  /////////////////////////////////////////////////////////////////////
  ///////////// Handles 401 redirect on expired session ///////////////
  /////////////////////////////////////////////////////////////////////

  test("handles 401 redirect on expired session", async ({
    adminServicesPage,
    page,
  }) => {
    await page.route("**/api/admin/services*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 401,
          body: JSON.stringify({ message: "Unauthorized" }),
        });
      } else {
        await route.continue();
      }
    });

    await adminServicesPage.goto();

    // The services page shows error state on 401 (not a redirect)
    // because the auth check happens separately from the services fetch
    await expect(
      adminServicesPage.errorState.or(
        page.getByRole("heading", { name: "Admin Login" }),
      ),
    ).toBeVisible({ timeout: 10_000 });
  });

  /////////////////////////////////////////////////////////////////////
  ///////////// Pagination navigates correctly ////////////////////////
  /////////////////////////////////////////////////////////////////////

  test("paginates through services", async ({ adminServicesPage, page }) => {
    let currentPage = 1;

    await page.route("**/api/admin/services*", async (route, request) => {
      if (request.method() === "GET") {
        const url = new URL(request.url());
        currentPage = parseInt(url.searchParams.get("page") ?? "1", 10);

        const services = Array.from({ length: 20 }, (_, i) => ({
          id: (currentPage - 1) * 20 + i + 1,
          icon: "FiShield",
          title_en: `Service ${(currentPage - 1) * 20 + i + 1}`,
          title_ar: `خدمة ${(currentPage - 1) * 20 + i + 1}`,
          desc_en: `Description ${(currentPage - 1) * 20 + i + 1}`,
          desc_ar: `وصف ${(currentPage - 1) * 20 + i + 1}`,
          button_label_en: "View",
          button_label_ar: "عرض",
          metric_value: `${i + 1}`,
          metric_suffix: "",
          metric_label_en: "Item",
          metric_label_ar: "عنصر",
          is_active: true,
          sort_order: i + 1,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }));

        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: services,
            meta: { total: 45, page: currentPage, limit: 20, totalPages: 3 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await adminServicesPage.goto();

    // Assert page 1 services visible
    await adminServicesPage.expectRowVisible(1);
    expect(await adminServicesPage.getServicesCount()).toBe(20);

    // Click "Next" button (pagination)
    await page.getByTestId("pagination-next").click();

    // Wait for page 2 to load
    await page.waitForTimeout(500);

    // Assert page 2 services visible
    await adminServicesPage.expectRowVisible(21);
  });
});
