import { test as base, expect } from "@playwright/test";
import { LicensingAdminPage, type LicensingItemFormData } from "../pages/licensing-admin.page";

///////////////////////////////////////////////////////////////////////
///////////// Licensing Admin Fixture — reusable authenticated ////////
///////////// session + licensing admin POM ///////////////////////////
///////////////////////////////////////////////////////////////////////

interface LicensingAdminFixtures {
  licensingAdminPage: LicensingAdminPage;
}

// Default licensing items for tests
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

export const test = base.extend<LicensingAdminFixtures>({
  licensingAdminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

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

    await page.route("**/auth/logout", async (route) => {
      loggedIn = false;
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    // Default licensing-items mock
    let licensingItemsMock = DEFAULT_LICENSING_ITEMS;

    // Set up default licensing-items route
    await page.route("**/api/admin/licensing-items", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(licensingItemsMock),
        });
      } else if (route.request().method() === "POST") {
        const postData = route.request().postDataJSON();
        const newItem = {
          id: 3,
          icon: postData.icon ?? null,
          title_en: postData.title_en ?? null,
          title_ar: postData.title_ar ?? null,
          desc_en: postData.desc_en ?? null,
          desc_ar: postData.desc_ar ?? null,
          tag_en: postData.tag_en ?? null,
          tag_ar: postData.tag_ar ?? null,
          sort_order: licensingItemsMock.length + 1,
          homePageContentId: 1,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        };
        licensingItemsMock = [...licensingItemsMock, newItem];
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(newItem),
        });
      } else {
        await route.continue();
      }
    });

    // Mock single item PUT/DELETE
    await page.route("**/api/admin/licensing-items/:id", async (route) => {
      if (route.request().method() === "PUT") {
        const postData = route.request().postDataJSON();
        const id = parseInt(route.request().url().split("/").pop() ?? "0", 10);
        const existing = licensingItemsMock.find((i) => i.id === id);
        if (existing) {
          const updated = {
            ...existing,
            ...postData,
            updatedAt: "2026-01-01T00:00:00.000Z",
          };
          licensingItemsMock = licensingItemsMock.map((i) => (i.id === id ? updated : i));
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(updated),
          });
        } else {
          await route.fulfill({ status: 404, body: JSON.stringify({ message: "Not found" }) });
        }
      } else if (route.request().method() === "DELETE") {
        const id = parseInt(route.request().url().split("/").pop() ?? "0", 10);
        licensingItemsMock = licensingItemsMock.filter((i) => i.id !== id);
        await route.fulfill({ status: 200 });
      } else {
        await route.continue();
      }
    });

    // Mock reorder endpoint
    await page.route("**/api/admin/licensing-items/reorder", async (route) => {
      if (route.request().method() === "PATCH") {
        const ids = route.request().postDataJSON().ids as number[];
        const reordered = ids
          .map((id) => licensingItemsMock.find((i) => i.id === id))
          .filter(Boolean);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(reordered),
        });
      } else {
        await route.continue();
      }
    });

    // Mock home-page-content PUT
    await page.route("**/api/admin/home-page-content", async (route) => {
      if (route.request().method() === "PUT") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to login
    await page.goto("/en/login");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("login-email-input").waitFor({ state: "visible" });

    // Perform login
    await page.getByTestId("login-email-input").fill("admin@example.com");
    await page.getByTestId("login-password-input").fill("admin123");
    await page.getByTestId("login-submit-button").click();

    // Wait for redirect to admin
    await page.waitForURL(/\/admin/, { timeout: 10000 });
    await expect(page).not.toHaveURL(/\/login/);

    // Create POM
    const licensingAdminPage = new LicensingAdminPage(page);

    await use(licensingAdminPage);

    await context.close();
  },
});

export { expect } from "@playwright/test";
