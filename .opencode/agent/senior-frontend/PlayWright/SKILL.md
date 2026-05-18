# SKILL: Playwright — End-to-End Testing & Browser Automation

> **Purpose:** This skill gives an AI agent full, production-ready knowledge of Playwright (Node.js/TypeScript) so it can write, debug, and maintain E2E tests correctly on the first attempt.  
> **Stack Context:** Next.js (frontend) + Laravel or NestJS (backend API) + MySQL.

---

## 0. WHEN TO USE THIS SKILL

Trigger this skill whenever the user asks to:

- Write, fix, or review E2E / integration tests
- Set up Playwright in a Next.js or monorepo project
- Debug flaky tests or CI failures
- Automate browser interactions (scraping, automation, form submissions)
- Mock API responses or network requests
- Test authentication flows, dashboards, or complex UI
- Generate locators, Page Object Models, or test fixtures

---

## 1. INSTALLATION & SETUP

### 1.1 Install in an existing project

```bash
# Recommended: adds to existing package.json
npm init playwright@latest

# Choices during setup:
# - Language: TypeScript (always prefer)
# - Folder: tests/ or e2e/
# - Add GitHub Actions: yes
# - Install browsers: yes
```

### 1.2 Resulting scaffold

```
playwright.config.ts     ← central config (browsers, baseURL, retries, etc.)
tests/
  example.spec.ts        ← sample test
tests-examples/          ← more complete examples
```

### 1.3 Install browsers (or update)

```bash
npx playwright install --with-deps          # all browsers
npx playwright install chromium --with-deps # CI: only what you need
```

### 1.4 System requirements (as of 2025-2026)

- Node.js 20.x, 22.x, or 24.x
- Windows 11+, macOS 14+, Ubuntu 22.04/24.04

---

## 2. PLAYWRIGHT CONFIG — `playwright.config.ts`

This is the most important file. Always configure it fully.

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true, // run files in parallel
  forbidOnly: !!process.env.CI, // fail CI if test.only is committed
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry", // captures trace on failures
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000, // per-action timeout
  },

  projects: [
    {
      name: "setup", // auth setup project (see Section 7)
      testMatch: "**/auth.setup.ts",
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      dependencies: ["setup"],
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      dependencies: ["setup"],
    },
    // Mobile emulation:
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],

  // Spin up Next.js dev server before tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

---

## 3. WRITING TESTS — CORE PATTERNS

### 3.1 Basic test structure

```typescript
import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("shows recent orders table", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Order ID" }),
    ).toBeVisible();
  });

  test("can filter orders by status", async ({ page }) => {
    await page
      .getByRole("combobox", { name: "Status" })
      .selectOption("pending");
    await expect(page.getByRole("row")).toHaveCount(5); // auto-retries
  });
});
```

### 3.2 Hooks

```typescript
test.beforeAll(async ({ browser }) => {
  /* runs once per worker */
});
test.beforeEach(async ({ page }) => {
  /* runs before each test */
});
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({ path: `failure-${testInfo.title}.png` });
  }
});
test.afterAll(async () => {
  /* cleanup */
});
```

---

## 4. LOCATORS — THE RIGHT WAY

**Priority order (most resilient → least):**

| Priority | Method               | Use when                                     |
| -------- | -------------------- | -------------------------------------------- |
| 1        | `getByRole()`        | buttons, links, headings, inputs, checkboxes |
| 2        | `getByLabel()`       | form fields with `<label>`                   |
| 3        | `getByPlaceholder()` | inputs with placeholder text                 |
| 4        | `getByText()`        | any element by visible text                  |
| 5        | `getByAltText()`     | images                                       |
| 6        | `getByTitle()`       | elements with `title` attribute              |
| 7        | `getByTestId()`      | when you own the HTML (`data-testid`)        |
| 8        | `locator('css')`     | last resort                                  |
| ❌       | XPath                | avoid unless absolutely required             |

```typescript
// ✅ Preferred
page.getByRole("button", { name: "Submit" });
page.getByLabel("Email address");
page.getByPlaceholder("Search orders...");
page.getByTestId("order-table");

// ✅ Chaining & filtering
page
  .getByRole("listitem")
  .filter({ hasText: "Order #123" })
  .getByRole("button", { name: "Cancel" });

// ❌ Avoid
page.locator(".btn.btn-primary.submit-action"); // breaks on style changes
page.locator('//button[@class="submit"]'); // brittle XPath
```

### 4.1 Useful locator techniques

```typescript
// Nth element
page.getByRole("row").nth(2);

// Has child element
page.getByRole("listitem").filter({ has: page.getByRole("img") });

// Regex match
page.getByRole("button", { name: /submit/i });

// Inside a frame
page.frameLocator("#my-iframe").getByRole("button", { name: "OK" });

// Shadow DOM
page.locator("my-component").getByRole("button");
```

---

## 5. ASSERTIONS — WEB-FIRST (ALWAYS USE THESE)

Playwright assertions automatically **retry** until the condition is met or timeout expires.

```typescript
// ✅ Web-first (retries automatically)
await expect(page.getByText("Payment successful")).toBeVisible();
await expect(page.getByRole("button", { name: "Save" })).toBeEnabled();
await expect(page.getByTestId("cart-count")).toHaveText("3");
await expect(page).toHaveURL("/checkout/complete");
await expect(page).toHaveTitle(/Order Confirmation/);

// ❌ Manual (does NOT retry — leads to flaky tests)
expect(await page.getByText("Payment successful").isVisible()).toBe(true);

// Page-level assertions
await expect(page).toHaveURL(/dashboard/);
await expect(page).toHaveTitle("Dashboard | MyApp");

// Element state
await expect(locator).toBeChecked();
await expect(locator).toBeDisabled();
await expect(locator).toBeEmpty();
await expect(locator).toBeHidden();
await expect(locator).toHaveAttribute("href", "/home");
await expect(locator).toHaveClass(/active/);
await expect(locator).toHaveCount(5);
await expect(locator).toHaveValue("john@example.com");
await expect(locator).toContainText("Welcome");

// Soft assertions (don't stop the test on failure)
await expect.soft(page.getByTestId("status")).toHaveText("Active");
await expect.soft(page.getByTestId("balance")).toHaveText("$100.00");
// Test continues, all failures reported at the end
```

---

## 6. ACTIONS — USER INTERACTIONS

```typescript
// Click
await page.getByRole("button", { name: "Login" }).click();
await page.getByRole("link", { name: "Products" }).click({ button: "right" }); // right-click
await page.getByRole("button").dblclick(); // double-click

// Keyboard
await page.getByLabel("Search").fill("laptop"); // clears then types
await page.getByLabel("Name").type("John", { delay: 50 }); // types char by char
await page.getByLabel("Search").press("Enter");
await page.keyboard.press("Control+A");

// Select
await page.getByLabel("Country").selectOption("EG");
await page.getByLabel("Permissions").selectOption(["read", "write"]); // multi

// Checkbox / Radio
await page.getByLabel("Agree to terms").check();
await page.getByLabel("Newsletter").uncheck();

// File upload
await page.getByLabel("Upload CSV").setInputFiles("./fixtures/data.csv");
await page.getByLabel("Upload CSV").setInputFiles([]); // clear

// Hover & focus
await page.getByRole("button", { name: "More" }).hover();
await page.getByLabel("Email").focus();

// Drag and drop
await page.getByTestId("card-1").dragTo(page.getByTestId("column-done"));

// Scroll
await page.getByRole("list").evaluate((el) => (el.scrollTop = el.scrollHeight));
await page.mouse.wheel(0, 500);

// Navigation
await page.goto("/login");
await page.goBack();
await page.goForward();
await page.reload();
```

---

## 7. AUTHENTICATION — REUSE SESSIONS

### 7.1 Setup file (`tests/auth.setup.ts`)

```typescript
import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel("Password").fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/dashboard");

  // Save the signed-in state to a file (cookies + localStorage)
  await page.context().storageState({ path: authFile });
});
```

### 7.2 Use saved auth in tests

```typescript
// playwright.config.ts — add storageState to the project
{
  name: 'chromium',
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'playwright/.auth/user.json',
  },
  dependencies: ['setup'],
},
```

### 7.3 Multiple roles (admin, user, guest)

```typescript
// tests/admin.setup.ts
const adminFile = 'playwright/.auth/admin.json';
setup('authenticate as admin', async ({ page }) => { /* ... */ });

// playwright.config.ts
{ name: 'admin tests', use: { storageState: 'playwright/.auth/admin.json' } }
{ name: 'user tests',  use: { storageState: 'playwright/.auth/user.json' } }
```

---

## 8. API MOCKING & NETWORK INTERCEPTION

Ideal for testing without hitting real backends (Laravel/NestJS).

```typescript
// Intercept and mock a specific API route
await page.route("**/api/orders", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([
      { id: 1, status: "pending", total: 120.0 },
      { id: 2, status: "shipped", total: 85.5 },
    ]),
  });
});

// Abort requests (e.g. block image loads in CI)
await page.route("**/*.{png,jpg,jpeg,gif,svg}", (route) => route.abort());

// Modify a real response
await page.route("**/api/user/me", async (route) => {
  const response = await route.fetch(); // let the real request go through
  const body = await response.json();
  body.role = "admin"; // modify
  await route.fulfill({ response, body: JSON.stringify(body) });
});

// Wait for a specific API call to complete
const responsePromise = page.waitForResponse("**/api/orders");
await page.getByRole("button", { name: "Refresh" }).click();
const response = await responsePromise;
expect(response.status()).toBe(200);

// Simulate network failure
await page.route("**/api/payments", (route) => route.abort("failed"));
```

---

## 9. API TESTING (WITHOUT BROWSER)

Playwright can test REST APIs directly — great for backend endpoint validation.

```typescript
import { test, expect } from "@playwright/test";

test("POST /api/orders creates an order", async ({ request }) => {
  const response = await request.post("http://localhost:8000/api/orders", {
    headers: {
      Authorization: `Bearer ${process.env.TEST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    data: {
      product_id: 42,
      quantity: 2,
    },
  });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body).toHaveProperty("id");
  expect(body.status).toBe("pending");
});

test("GET /api/products returns paginated list", async ({ request }) => {
  const response = await request.get("/api/products?page=1&per_page=10");
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.data).toHaveLength(10);
  expect(data).toHaveProperty("total");
});
```

---

## 10. PAGE OBJECT MODEL (POM)

Avoid duplicating selectors. Always use POM for complex pages.

```typescript
// tests/pages/LoginPage.ts
import { Page, Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Password");
    this.submitButton = page.getByRole("button", { name: "Sign in" });
    this.errorMessage = page.getByTestId("auth-error");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toHaveText(message);
  }
}

// tests/login.spec.ts
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test("shows error for invalid credentials", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("bad@example.com", "wrongpass");
  await loginPage.expectError("Invalid credentials");
});
```

---

## 11. FIXTURES — SHARED SETUP

```typescript
// tests/fixtures.ts
import { test as base, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";

type MyFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
};

export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});

export { expect };

// Use in tests
import { test, expect } from "./fixtures";

test("dashboard loads", async ({ dashboardPage }) => {
  await dashboardPage.goto();
  await dashboardPage.expectWelcomeMessage("John");
});
```

---

## 12. HANDLING DIALOGS, POPUPS & FRAMES

```typescript
// Alert / Confirm / Prompt
page.on("dialog", async (dialog) => {
  console.log(dialog.message());
  await dialog.accept(); // or dialog.dismiss()
});

// New tab / popup
const [popup] = await Promise.all([
  page.waitForEvent("popup"),
  page.getByRole("link", { name: "Open in new tab" }).click(),
]);
await popup.waitForLoadState();
await expect(popup).toHaveURL(/\/receipt/);

// iFrames
const frame = page.frameLocator("#payment-iframe");
await frame.getByLabel("Card number").fill("4111111111111111");
await frame.getByRole("button", { name: "Pay" }).click();

// File download
const downloadPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "Export CSV" }).click();
const download = await downloadPromise;
await download.saveAs("./tmp/" + download.suggestedFilename());
```

---

## 13. SCREENSHOTS & VISUAL TESTING

```typescript
// Full page screenshot
await page.screenshot({ path: "screenshots/home.png", fullPage: true });

// Element screenshot
await page
  .getByTestId("order-summary")
  .screenshot({ path: "screenshots/summary.png" });

// Visual comparison (snapshot testing)
await expect(page).toHaveScreenshot("dashboard.png", {
  maxDiffPixels: 50,
  threshold: 0.2,
});

// Update snapshots: npx playwright test --update-snapshots
```

---

## 14. PARALLELISM, SHARDING & CI

### 14.1 Parallel config

```typescript
// playwright.config.ts
export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? 2 : "50%", // 50% of CPU cores locally
});

// Or per-file:
test.describe.configure({ mode: "parallel" });
```

### 14.2 Sharding for CI (split test suite across machines)

```bash
npx playwright test --shard=1/3
npx playwright test --shard=2/3
npx playwright test --shard=3/3
```

### 14.3 GitHub Actions CI example

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install chromium --with-deps
      - run: npx playwright test --project=chromium
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

---

## 15. DEBUGGING

### 15.1 Interactive debugging

```bash
npx playwright test --debug                          # opens Playwright Inspector
npx playwright test example.spec.ts:25 --debug       # debug specific line
npx playwright test --ui                             # UI Mode (time-travel debugging)
npx playwright test --headed                         # run with visible browser
PWDEBUG=1 npx playwright test                        # env-based debug
```

### 15.2 Trace Viewer (best for CI failures)

```bash
npx playwright test --trace on             # record traces
npx playwright show-report                 # open HTML report with traces
npx playwright show-trace trace.zip        # open specific trace
```

### 15.3 Codegen (auto-generate tests by recording interactions)

```bash
npx playwright codegen http://localhost:3000
npx playwright codegen --save-storage=auth.json http://localhost:3000/login
```

### 15.4 Slow motion (for debugging timing issues)

```typescript
// playwright.config.ts
use: {
  launchOptions: {
    slowMo: 500;
  }
}
```

---

## 16. ENVIRONMENT VARIABLES & SECRETS

```typescript
// .env.test
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=secret123
NEXT_PUBLIC_API_URL=http://localhost:8000

// playwright.config.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

export default defineConfig({
  use: { baseURL: process.env.NEXT_PUBLIC_API_URL },
});
```

---

## 17. EMULATION — MOBILE, TIMEZONE, LOCALE

```typescript
// playwright.config.ts — project config
{
  name: 'Mobile Arabic',
  use: {
    ...devices['Galaxy S9+'],
    locale: 'ar-EG',
    timezoneId: 'Africa/Cairo',
    geolocation: { latitude: 30.0444, longitude: 31.2357 }, // Cairo
    permissions: ['geolocation'],
  },
},

// In a single test
test('RTL layout renders correctly', async ({ browser }) => {
  const context = await browser.newContext({
    locale: 'ar-EG',
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});
```

---

## 18. CLOCK & DATE MOCKING

```typescript
test('shows "Expires today" banner', async ({ page }) => {
  // Freeze time to a specific date
  await page.clock.setFixedTime(new Date("2025-12-31T23:00:00"));
  await page.goto("/account");
  await expect(page.getByText("Subscription expires today")).toBeVisible();
});
```

---

## 19. NEXT.JS INTEGRATION CHECKLIST

```typescript
// playwright.config.ts for Next.js
export default defineConfig({
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },
  use: {
    baseURL: "http://localhost:3000",
  },
});
```

```html
<!-- Add data-testid to components for stable selectors -->
<button data-testid="checkout-btn" onClick="{handleCheckout}">Checkout</button>
```

```typescript
// Test Next.js API routes directly
const res = await request.post("/api/auth/login", {
  data: { email, password },
});
```

---

## 20. ANTI-PATTERNS TO AVOID

| ❌ Anti-pattern                                        | ✅ Correct approach                               |
| ------------------------------------------------------ | ------------------------------------------------- |
| `page.waitForTimeout(3000)`                            | Use web-first assertions that auto-wait           |
| `expect(await locator.isVisible()).toBe(true)`         | `await expect(locator).toBeVisible()`             |
| CSS class selectors like `.btn-primary`                | `getByRole('button', { name: '...' })`            |
| Hardcoded `page.locator('div > ul > li:nth-child(3)')` | `getByTestId()` or `getByRole()`                  |
| Sharing state between tests                            | Each test must be fully isolated                  |
| Sleeping for animations                                | Use `toBeVisible()` / `toBeHidden()` with timeout |
| Ignoring `await` on Playwright calls                   | Always `await` — missing awaits cause silent bugs |
| Giant test files                                       | Split into focused spec files + use POM           |
| Committing `test.only`                                 | `forbidOnly: true` in CI config                   |

---

## 21. QUICK REFERENCE — COMMON COMMANDS

```bash
npx playwright test                          # run all tests
npx playwright test --project=chromium       # one browser
npx playwright test login                    # match by filename
npx playwright test --grep "checkout"        # match by test name
npx playwright test --headed                 # visible browser
npx playwright test --debug                  # step-by-step debug
npx playwright test --ui                     # UI Mode
npx playwright test --trace on               # record traces
npx playwright show-report                   # open HTML report
npx playwright codegen http://localhost:3000 # record & generate tests
npx playwright install                       # install/update browsers
npx playwright --version                     # check version
npm install -D @playwright/test@latest       # update Playwright
```

---

## 22. SECURITY & PERFORMANCE NOTES

- **Never commit credentials** — always use `.env` files and CI secrets.
- **storageState files** (auth JSON) must be in `.gitignore`.
- **Test data isolation** — use a dedicated test database or seed/teardown fixtures.
- **Block analytics/tracking** in tests to avoid noise:
  ```typescript
  await page.route("**/(analytics|gtm|hotjar|sentry)/**", (r) => r.abort());
  ```
- **Parallelize wisely** — database mutation tests may conflict; use serial mode or isolated DB per worker.
- **Use `workers: 1` on CI** for database-mutating tests to avoid race conditions.
- **Run only Chromium on CI** unless cross-browser is mandatory — saves 3× time/cost.

---

## 23. FOLDER STRUCTURE (RECOMMENDED)

```
project-root/
├── tests/
│   ├── auth.setup.ts         ← authentication setup
│   ├── login.spec.ts
│   ├── dashboard.spec.ts
│   ├── orders.spec.ts
│   ├── api/
│   │   └── orders.api.spec.ts  ← API-only tests
│   ├── pages/                  ← Page Object Models
│   │   ├── LoginPage.ts
│   │   ├── DashboardPage.ts
│   │   └── OrdersPage.ts
│   └── fixtures/
│       ├── index.ts            ← custom test fixtures
│       └── data/               ← test data files
├── playwright/.auth/           ← gitignored auth state files
│   ├── user.json
│   └── admin.json
├── playwright-report/          ← gitignored HTML reports
├── playwright.config.ts
└── .env.test                   ← gitignored
```

`.gitignore` additions:

```
playwright/.auth/
playwright-report/
test-results/
.env.test
```

---

_Sources: https://playwright.dev/docs — Installation, Writing Tests, Locators, Assertions, Auth, Best Practices, API Testing, POM, Fixtures, Network, Configuration (verified May 2026)_
