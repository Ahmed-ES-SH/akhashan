import { test as base, expect } from "@playwright/test";
import { AdminDashboardPage, type StatItemFormData } from "../pages/admin-dashboard.page";

///////////////////////////////////////////////////////////////////////
/////////////// Stats Admin Fixture — reusable authenticated //////////
/////////////// session + dashboard POM ///////////////////////////////
///////////////////////////////////////////////////////////////////////

interface StatsAdminFixtures {
  adminPage: AdminDashboardPage;
}

// Default stat items for tests
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

export const test = base.extend<StatsAdminFixtures>({
  adminPage: async ({ browser }, use) => {
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

    // Default stat-items mock (tests can override via adminPage.overrideStatItemsMock)
    let statItemsMock = DEFAULT_STAT_ITEMS;
    let statItemsGetHandler: ((route: unknown) => Promise<void>) | null = null;

    // Set up default stat-items route
    const setupStatItemsRoute = () => {
      page.route("**/api/admin/stat-items", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(statItemsMock),
          });
        } else {
          await route.continue();
        }
      });
    };

    // Mock reorder endpoint
    await page.route("**/api/admin/stat-items/reorder", async (route) => {
      if (route.request().method() === "PATCH") {
        const ids = route.request().postDataJSON().ids as number[];
        const reordered = ids
          .map((id) => DEFAULT_STAT_ITEMS.find((i) => i.id === id))
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

    setupStatItemsRoute();

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

    // Create dashboard POM with mock override capability
    const adminPage = new AdminDashboardPage(page);
    (adminPage as unknown as Record<string, unknown>).setStatItemsMock = (
      items: unknown[],
    ) => {
      statItemsMock = items as typeof DEFAULT_STAT_ITEMS;
    };

    await use(adminPage);

    await context.close();
  },
});

export { expect } from "@playwright/test";
