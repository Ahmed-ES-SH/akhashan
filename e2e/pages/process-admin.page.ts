import { Page, Locator } from "@playwright/test";

///////////////////////////////////////////////////////////////////////
/////////// Process Admin POM — Process Section focused ///////////////
///////////////////////////////////////////////////////////////////////

export interface ProcessStepFormData {
  stepNumber?: string;
  titleEn?: string;
  titleAr?: string;
  descEn?: string;
  descAr?: string;
}

export class ProcessAdminPage {
  readonly page: Page;

  // Section elements
  readonly processSection: Locator;
  readonly addProcessStepButton: Locator;
  readonly processStepForm: Locator;
  readonly processStepFormTitle: Locator;
  readonly emptyStateMessage: Locator;
  readonly retryButton: Locator;
  readonly loadingSkeleton: Locator;

  // Form fields
  readonly formStepNumberInput: Locator;
  readonly formTitleEnInput: Locator;
  readonly formTitleArInput: Locator;
  readonly formDescEnInput: Locator;
  readonly formDescArInput: Locator;
  readonly formSaveButton: Locator;
  readonly formCancelButton: Locator;

  // Delete confirmation
  readonly deleteConfirmationDialog: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.processSection = page.getByTestId("admin-process-section");
    this.addProcessStepButton = page.getByTestId("add-process-step");
    this.processStepForm = page.getByTestId("process-step-form-modal");
    this.processStepFormTitle = this.processStepForm.locator("h2");
    this.emptyStateMessage = page.getByText(/No process steps|لا توجد خطوات/);
    this.retryButton = page.getByTestId("retry-fetch-process");
    this.loadingSkeleton = page.locator(".animate-pulse");

    this.formStepNumberInput = this.processStepForm.getByTestId("form-step-number");
    this.formTitleEnInput = this.processStepForm.getByTestId("form-title-en");
    this.formTitleArInput = this.processStepForm.getByTestId("form-title-ar");
    this.formDescEnInput = this.processStepForm.getByTestId("form-desc-en");
    this.formDescArInput = this.processStepForm.getByTestId("form-desc-ar");
    this.formSaveButton = this.processStepForm.getByTestId("form-save-button");
    this.formCancelButton = this.processStepForm.getByRole("button", { name: /Cancel|إلغاء/ });

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
  ///////////// Get process step card by ID //////////////////////
  /////////////////////////////////////////////////////////////////

  getStepCard(id: number): Locator {
    return this.page.getByTestId(`process-step-card-${id}`);
  }

  getEditButton(id: number): Locator {
    return this.page.getByTestId(`edit-step-${id}`);
  }

  getDeleteButton(id: number): Locator {
    return this.page.getByTestId(`delete-step-${id}`);
  }

  getMoveUpButton(id: number): Locator {
    return this.page.getByTestId(`move-up-step-${id}`);
  }

  getMoveDownButton(id: number): Locator {
    return this.page.getByTestId(`move-down-step-${id}`);
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Count visible step cards /////////////////////////
  /////////////////////////////////////////////////////////////////

  async getStepCardsCount(): Promise<number> {
    return this.page.locator('[data-testid^="process-step-card-"]').count();
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Add a new process step ///////////////////////////
  /////////////////////////////////////////////////////////////////

  async addProcessStep(data: ProcessStepFormData) {
    await this.addProcessStepButton.click();
    await this.processStepForm.waitFor({ state: "visible" });

    if (data.stepNumber !== undefined) await this.formStepNumberInput.fill(data.stepNumber);
    if (data.titleEn !== undefined) await this.formTitleEnInput.fill(data.titleEn);
    if (data.titleAr !== undefined) await this.formTitleArInput.fill(data.titleAr);
    if (data.descEn !== undefined) await this.formDescEnInput.fill(data.descEn);
    if (data.descAr !== undefined) await this.formDescArInput.fill(data.descAr);

    await this.formSaveButton.click();
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Edit an existing process step ////////////////////
  /////////////////////////////////////////////////////////////////

  async editProcessStep(id: number, data: Partial<ProcessStepFormData>) {
    await this.getEditButton(id).click();
    await this.processStepForm.waitFor({ state: "visible" });

    if (data.stepNumber !== undefined) await this.formStepNumberInput.fill(data.stepNumber);
    if (data.titleEn !== undefined) await this.formTitleEnInput.fill(data.titleEn);
    if (data.titleAr !== undefined) await this.formTitleArInput.fill(data.titleAr);
    if (data.descEn !== undefined) await this.formDescEnInput.fill(data.descEn);
    if (data.descAr !== undefined) await this.formDescArInput.fill(data.descAr);

    await this.formSaveButton.click();
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Delete a process step with confirmation //////////
  /////////////////////////////////////////////////////////////////

  async deleteProcessStep(id: number) {
    await this.getDeleteButton(id).click();
    await this.deleteConfirmationDialog.waitFor({ state: "visible" });
    await this.confirmDeleteButton.click();
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Cancel delete of a process step //////////////////
  /////////////////////////////////////////////////////////////////

  async cancelDeleteProcessStep(id: number) {
    await this.getDeleteButton(id).click();
    await this.deleteConfirmationDialog.waitFor({ state: "visible" });
    await this.cancelDeleteButton.click();
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Wait for step card to appear /////////////////////
  /////////////////////////////////////////////////////////////////

  async waitForStepCard(id: number, timeout: number = 10000) {
    await this.getStepCard(id).waitFor({ state: "visible", timeout });
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Wait for step card to disappear //////////////////
  /////////////////////////////////////////////////////////////////

  async waitForStepCardHidden(id: number, timeout: number = 10000) {
    await this.getStepCard(id).waitFor({ state: "hidden", timeout });
  }

  /////////////////////////////////////////////////////////////////
  ///////////// Check if empty state is visible //////////////////
  /////////////////////////////////////////////////////////////////

  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyStateMessage.isVisible();
  }
}
