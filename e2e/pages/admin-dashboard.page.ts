import { Page, Locator } from "@playwright/test";

///////////////////////////////////////////////////////////////////////
/////////////// Admin Dashboard POM — Stats Section focused ///////////
///////////////////////////////////////////////////////////////////////

export interface StatItemFormData {
  icon: string;
  target: string;
  suffix: string;
  labelEn: string;
  labelAr: string;
}

export class AdminDashboardPage {
  readonly page: Page;

  // Stats section elements
  readonly statsSection: Locator;
  readonly addStatItemButton: Locator;
  readonly statItemForm: Locator;
  readonly statItemFormTitle: Locator;
  readonly emptyStateMessage: Locator;
  readonly retryButton: Locator;
  readonly loadingSkeleton: Locator;

  // Form fields
  readonly formIconInput: Locator;
  readonly formTargetInput: Locator;
  readonly formSuffixInput: Locator;
  readonly formLabelEnInput: Locator;
  readonly formLabelArInput: Locator;
  readonly formSaveButton: Locator;
  readonly formCancelButton: Locator;

  // Delete confirmation
  readonly deleteConfirmationDialog: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statsSection = page.getByTestId("admin-stats-section");
    this.addStatItemButton = page.getByTestId("add-stat-item");
    this.statItemForm = page.getByTestId("stat-item-form");
    this.statItemFormTitle = this.statItemForm.locator("h2");
    this.emptyStateMessage = page.getByText(/No statistics|لا توجد/);
    this.retryButton = page.getByTestId("retry-fetch-stats");
    this.loadingSkeleton = page.locator(".animate-pulse");

    this.formIconInput = this.statItemForm.getByTestId("stat-form-icon");
    this.formTargetInput = this.statItemForm.getByTestId("stat-form-target");
    this.formSuffixInput = this.statItemForm.getByTestId("stat-form-suffix");
    this.formLabelEnInput = this.statItemForm.getByTestId("stat-form-label-en");
    this.formLabelArInput = this.statItemForm.getByTestId("stat-form-label-ar");
    this.formSaveButton = this.statItemForm.getByRole("button", { name: /Save|حفظ|Saving/ });
    this.formCancelButton = this.statItemForm.getByRole("button", { name: /Cancel|إلغاء/ });

    this.deleteConfirmationDialog = page.getByTestId("delete-confirmation");
    this.confirmDeleteButton = page.getByTestId("confirm-delete");
    this.cancelDeleteButton = this.deleteConfirmationDialog.getByRole("button", {
      name: /Cancel|إلغاء/,
    });
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Navigate to admin dashboard //////////////////////
  /////////////////////////////////////////////////////////////////

  async navigate(locale: string = "en") {
    await this.page.goto(`/${locale}/admin`);
    await this.page.waitForLoadState("networkidle");
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Get stat card by ID ///////////////////////////////
  /////////////////////////////////////////////////////////////////

  getStatCard(id: number): Locator {
    return this.page.getByTestId(`stat-card-${id}`);
  }

  getEditButton(id: number): Locator {
    return this.page.getByTestId(`edit-stat-${id}`);
  }

  getDeleteButton(id: number): Locator {
    return this.page.getByTestId(`delete-stat-${id}`);
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Count visible stat cards //////////////////////////
  /////////////////////////////////////////////////////////////////

  async getStatCardsCount(): Promise<number> {
    return this.page.locator('[data-testid^="stat-card-"]').count();
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Add a new stat item ///////////////////////////////
  /////////////////////////////////////////////////////////////////

  async addStatItem(data: StatItemFormData) {
    await this.addStatItemButton.click();
    await this.statItemForm.waitFor({ state: "visible" });

    if (data.icon) await this.formIconInput.fill(data.icon);
    if (data.target) await this.formTargetInput.fill(data.target);
    if (data.suffix) await this.formSuffixInput.fill(data.suffix);
    if (data.labelEn) await this.formLabelEnInput.fill(data.labelEn);
    if (data.labelAr) await this.formLabelArInput.fill(data.labelAr);

    await this.formSaveButton.click();
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Edit an existing stat item ////////////////////////
  /////////////////////////////////////////////////////////////////

  async editStatItem(id: number, data: Partial<StatItemFormData>) {
    await this.getEditButton(id).click();
    await this.statItemForm.waitFor({ state: "visible" });

    if (data.icon !== undefined) await this.formIconInput.fill(data.icon);
    if (data.target !== undefined) await this.formTargetInput.fill(data.target);
    if (data.suffix !== undefined) await this.formSuffixInput.fill(data.suffix);
    if (data.labelEn !== undefined) await this.formLabelEnInput.fill(data.labelEn);
    if (data.labelAr !== undefined) await this.formLabelArInput.fill(data.labelAr);

    await this.formSaveButton.click();
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Delete a stat item with confirmation //////////////
  /////////////////////////////////////////////////////////////////

  async deleteStatItem(id: number) {
    await this.getDeleteButton(id).click();
    await this.deleteConfirmationDialog.waitFor({ state: "visible" });
    await this.confirmDeleteButton.click();
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Cancel delete of a stat item //////////////////////
  /////////////////////////////////////////////////////////////////

  async cancelDeleteStatItem(id: number) {
    await this.getDeleteButton(id).click();
    await this.deleteConfirmationDialog.waitFor({ state: "visible" });
    await this.cancelDeleteButton.click();
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Wait for stat card to appear //////////////////////
  /////////////////////////////////////////////////////////////////

  async waitForStatCard(id: number, timeout: number = 10000) {
    await this.getStatCard(id).waitFor({ state: "visible", timeout });
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Wait for stat card to disappear ///////////////////
  /////////////////////////////////////////////////////////////////

  async waitForStatCardHidden(id: number, timeout: number = 10000) {
    await this.getStatCard(id).waitFor({ state: "hidden", timeout });
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Check if empty state is visible ///////////////////
  /////////////////////////////////////////////////////////////////

  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyStateMessage.isVisible();
  }
}
