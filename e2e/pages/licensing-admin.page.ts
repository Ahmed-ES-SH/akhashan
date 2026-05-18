import { Page, Locator } from "@playwright/test";

///////////////////////////////////////////////////////////////////////
///////////// Licensing Admin POM — Licensing Section focused /////////
///////////////////////////////////////////////////////////////////////

export interface LicensingItemFormData {
  icon?: string;
  titleEn?: string;
  titleAr?: string;
  descEn?: string;
  descAr?: string;
  tagEn?: string;
  tagAr?: string;
}

export class LicensingAdminPage {
  readonly page: Page;

  // Section elements
  readonly licensingSection: Locator;
  readonly addLicensingItemButton: Locator;
  readonly licensingItemForm: Locator;
  readonly licensingItemFormTitle: Locator;
  readonly emptyStateMessage: Locator;
  readonly retryButton: Locator;
  readonly loadingSkeleton: Locator;

  // Form fields
  readonly formIconInput: Locator;
  readonly formTitleEnInput: Locator;
  readonly formTitleArInput: Locator;
  readonly formDescEnInput: Locator;
  readonly formDescArInput: Locator;
  readonly formTagEnInput: Locator;
  readonly formTagArInput: Locator;
  readonly formSaveButton: Locator;
  readonly formCancelButton: Locator;

  // Delete confirmation
  readonly deleteConfirmationDialog: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.licensingSection = page.getByTestId("admin-licensing-section");
    this.addLicensingItemButton = page.getByTestId("add-licensing-item");
    this.licensingItemForm = page.getByTestId("licensing-item-form-modal");
    this.licensingItemFormTitle = this.licensingItemForm.locator("h2");
    this.emptyStateMessage = page.getByText(/No licensing items|لا توجد تراخيص/);
    this.retryButton = page.getByTestId("retry-fetch-licensing");
    this.loadingSkeleton = page.locator(".animate-pulse");

    this.formIconInput = this.licensingItemForm.getByTestId("licensing-form-icon");
    this.formTitleEnInput = this.licensingItemForm.getByTestId("licensing-form-title-en");
    this.formTitleArInput = this.licensingItemForm.getByTestId("licensing-form-title-ar");
    this.formDescEnInput = this.licensingItemForm.getByTestId("licensing-form-desc-en");
    this.formDescArInput = this.licensingItemForm.getByTestId("licensing-form-desc-ar");
    this.formTagEnInput = this.licensingItemForm.getByTestId("licensing-form-tag-en");
    this.formTagArInput = this.licensingItemForm.getByTestId("licensing-form-tag-ar");
    this.formSaveButton = this.licensingItemForm.getByRole("button", { name: /Create|Update|Save|حفظ|Saving/ });
    this.formCancelButton = this.licensingItemForm.getByTestId("licensing-form-cancel");

    this.deleteConfirmationDialog = page.getByTestId("delete-confirm-dialog");
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
  ///////////// Get licensing item card by ID ////////////////////
  /////////////////////////////////////////////////////////////////

  getLicensingCard(id: number): Locator {
    return this.page.getByTestId(`licensing-item-card-${id}`);
  }

  getEditButton(id: number): Locator {
    return this.page.getByTestId(`edit-item-${id}`);
  }

  getDeleteButton(id: number): Locator {
    return this.page.getByTestId(`delete-item-${id}`);
  }

  getMoveUpButton(id: number): Locator {
    return this.page.getByTestId(`move-up-${id}`);
  }

  getMoveDownButton(id: number): Locator {
    return this.page.getByTestId(`move-down-${id}`);
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Count visible licensing cards ////////////////////
  /////////////////////////////////////////////////////////////////

  async getLicensingCardsCount(): Promise<number> {
    return this.page.locator('[data-testid^="licensing-item-card-"]').count();
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Add a new licensing item /////////////////////////
  /////////////////////////////////////////////////////////////////

  async addLicensingItem(data: LicensingItemFormData) {
    await this.addLicensingItemButton.click();
    await this.licensingItemForm.waitFor({ state: "visible" });

    if (data.icon !== undefined) await this.formIconInput.fill(data.icon);
    if (data.titleEn !== undefined) await this.formTitleEnInput.fill(data.titleEn);
    if (data.titleAr !== undefined) await this.formTitleArInput.fill(data.titleAr);
    if (data.descEn !== undefined) await this.formDescEnInput.fill(data.descEn);
    if (data.descAr !== undefined) await this.formDescArInput.fill(data.descAr);
    if (data.tagEn !== undefined) await this.formTagEnInput.fill(data.tagEn);
    if (data.tagAr !== undefined) await this.formTagArInput.fill(data.tagAr);

    await this.formSaveButton.click();
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Edit an existing licensing item //////////////////
  /////////////////////////////////////////////////////////////////

  async editLicensingItem(id: number, data: Partial<LicensingItemFormData>) {
    await this.getEditButton(id).click();
    await this.licensingItemForm.waitFor({ state: "visible" });

    if (data.icon !== undefined) await this.formIconInput.fill(data.icon);
    if (data.titleEn !== undefined) await this.formTitleEnInput.fill(data.titleEn);
    if (data.titleAr !== undefined) await this.formTitleArInput.fill(data.titleAr);
    if (data.descEn !== undefined) await this.formDescEnInput.fill(data.descEn);
    if (data.descAr !== undefined) await this.formDescArInput.fill(data.descAr);
    if (data.tagEn !== undefined) await this.formTagEnInput.fill(data.tagEn);
    if (data.tagAr !== undefined) await this.formTagArInput.fill(data.tagAr);

    await this.formSaveButton.click();
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Delete a licensing item with confirmation ////////
  /////////////////////////////////////////////////////////////////

  async deleteLicensingItem(id: number) {
    await this.getDeleteButton(id).click();
    await this.deleteConfirmationDialog.waitFor({ state: "visible" });
    await this.confirmDeleteButton.click();
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Cancel delete of a licensing item ////////////////
  /////////////////////////////////////////////////////////////////

  async cancelDeleteLicensingItem(id: number) {
    await this.getDeleteButton(id).click();
    await this.deleteConfirmationDialog.waitFor({ state: "visible" });
    await this.cancelDeleteButton.click();
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Wait for licensing card to appear ////////////////
  /////////////////////////////////////////////////////////////////

  async waitForLicensingCard(id: number, timeout: number = 10000) {
    await this.getLicensingCard(id).waitFor({ state: "visible", timeout });
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Wait for licensing card to disappear /////////////
  /////////////////////////////////////////////////////////////////

  async waitForLicensingCardHidden(id: number, timeout: number = 10000) {
    await this.getLicensingCard(id).waitFor({ state: "hidden", timeout });
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Check if empty state is visible //////////////////
  /////////////////////////////////////////////////////////////////

  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyStateMessage.isVisible();
  }
}
