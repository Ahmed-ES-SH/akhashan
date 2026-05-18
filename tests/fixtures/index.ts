/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from "@playwright/test";
import { AdminLoginPage } from "../pages/AdminLoginPage";
import { AdminServicesPage } from "../pages/AdminServicesPage";
import { AdminMessagesInboxPage } from "../pages/AdminMessagesInboxPage";

/////////////////////////////////////////////////////////////////////
/////////// Custom Fixtures — authenticated page + POMs /////////////
/////////////////////////////////////////////////////////////////////

interface AdminFixtures {
  adminLoginPage: AdminLoginPage;
  adminServicesPage: AdminServicesPage;
  adminMessagesInboxPage: AdminMessagesInboxPage;
}

export const test = base.extend<AdminFixtures>({
  adminLoginPage: async ({ page }, use) => {
    const adminLoginPage = new AdminLoginPage(page);
    await use(adminLoginPage);
  },
  adminServicesPage: async ({ page }, use) => {
    const adminServicesPage = new AdminServicesPage(page);
    await use(adminServicesPage);
  },
  adminMessagesInboxPage: async ({ page }, use) => {
    const adminMessagesInboxPage = new AdminMessagesInboxPage(page);
    await use(adminMessagesInboxPage);
  },
});

export { expect } from "@playwright/test";
