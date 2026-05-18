import { type Page, type Locator, expect } from "@playwright/test";

///////////////////////////////////////////////////////////////////////
///////////// Service Form Data Interface /////////////////////////////
///////////////////////////////////////////////////////////////////////

export interface ServiceFormData {
  icon?: string;
  title_en?: string;
  title_ar?: string;
  desc_en?: string;
  desc_ar?: string;
  button_label_en?: string;
  button_label_ar?: string;
  metric_value?: string;
  metric_suffix?: string;
  metric_label_en?: string;
  metric_label_ar?: string;
  is_active?: boolean;
}

///////////////////////////////////////////////////////////////////////
///////////// Page Object Model — Admin Services Page /////////////////
///////////////////////////////////////////////////////////////////////

export class AdminServicesPage {
  readonly page: Page;
  readonly addServiceButton: Locator;
  readonly emptyAddButton: Locator;
  readonly serviceForm: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly deleteConfirmation: Locator;
  readonly confirmDeleteButton: Locator;
  readonly retryButton: Locator;
  readonly loadingSkeleton: Locator;
  readonly errorState: Locator;

  // Filter tabs
  readonly filterAll: Locator;
  readonly filterActive: Locator;
  readonly filterInactive: Locator;

  // Form fields
  readonly formIcon: Locator;
  readonly formTitleEn: Locator;
  readonly formTitleAr: Locator;
  readonly formDescEn: Locator;
  readonly formDescAr: Locator;
  readonly formButtonLabelEn: Locator;
  readonly formButtonLabelAr: Locator;
  readonly formMetricValue: Locator;
  readonly formMetricSuffix: Locator;
  readonly formMetricLabelEn: Locator;
  readonly formMetricLabelAr: Locator;
  readonly formIsActive: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addServiceButton = page.getByTestId("add-service");
    this.emptyAddButton = page.getByTestId("add-service-empty");
    this.serviceForm = page.getByTestId("service-form");
    this.saveButton = this.serviceForm.getByRole("button", { name: /Save|حفظ/ });
    this.cancelButton = this.serviceForm.getByRole("button", { name: /Cancel/ });
    this.deleteConfirmation = page.getByTestId("delete-confirmation");
    this.confirmDeleteButton = page.getByTestId("confirm-delete");
    this.retryButton = page.getByTestId("retry-fetch-services");
    this.loadingSkeleton = page.getByTestId("admin-services-loading");
    this.errorState = page.getByTestId("admin-services-error");

    this.filterAll = page.getByTestId("filter-all");
    this.filterActive = page.getByTestId("filter-active");
    this.filterInactive = page.getByTestId("filter-inactive");

    this.formIcon = page.getByTestId("service-form-icon");
    this.formTitleEn = page.getByTestId("service-form-title-en");
    this.formTitleAr = page.getByTestId("service-form-title-ar");
    this.formDescEn = page.getByTestId("service-form-desc-en");
    this.formDescAr = page.getByTestId("service-form-desc-ar");
    this.formButtonLabelEn = page.getByTestId("service-form-button-label-en");
    this.formButtonLabelAr = page.getByTestId("service-form-button-label-ar");
    this.formMetricValue = page.getByTestId("service-form-metric-value");
    this.formMetricSuffix = page.getByTestId("service-form-metric-suffix");
    this.formMetricLabelEn = page.getByTestId("service-form-metric-label-en");
    this.formMetricLabelAr = page.getByTestId("service-form-metric-label-ar");
    this.formIsActive = page.getByTestId("service-form-is-active");
  }

  async goto() {
    await this.page.goto("/en/admin/services");
  }

  getServiceRow(id: number): Locator {
    return this.page.getByTestId(`service-row-${id}`);
  }

  getToggleSwitch(id: number): Locator {
    return this.page.getByTestId(`service-toggle-${id}`);
  }

  getEditButton(id: number): Locator {
    return this.page.getByTestId(`edit-service-${id}`);
  }

  getDeleteButton(id: number): Locator {
    return this.page.getByTestId(`delete-service-${id}`);
  }

  async getServicesCount(): Promise<number> {
    const rows = this.page.locator('[data-testid^="service-row-"]');
    return rows.count();
  }

  async openCreateForm() {
    await this.addServiceButton.click();
    await expect(this.serviceForm).toBeVisible();
  }

  async openEditForm(id: number) {
    await this.getEditButton(id).click();
    await expect(this.serviceForm).toBeVisible();
  }

  async fillForm(data: Partial<ServiceFormData>) {
    if (data.icon !== undefined) await this.formIcon.fill(data.icon);
    if (data.title_en !== undefined) await this.formTitleEn.fill(data.title_en);
    if (data.title_ar !== undefined) await this.formTitleAr.fill(data.title_ar);
    if (data.desc_en !== undefined) await this.formDescEn.fill(data.desc_en);
    if (data.desc_ar !== undefined) await this.formDescAr.fill(data.desc_ar);
    if (data.button_label_en !== undefined)
      await this.formButtonLabelEn.fill(data.button_label_en);
    if (data.button_label_ar !== undefined)
      await this.formButtonLabelAr.fill(data.button_label_ar);
    if (data.metric_value !== undefined)
      await this.formMetricValue.fill(data.metric_value);
    if (data.metric_suffix !== undefined)
      await this.formMetricSuffix.fill(data.metric_suffix);
    if (data.metric_label_en !== undefined)
      await this.formMetricLabelEn.fill(data.metric_label_en);
    if (data.metric_label_ar !== undefined)
      await this.formMetricLabelAr.fill(data.metric_label_ar);
    if (data.is_active !== undefined) {
      const isActive = await this.formIsActive.getAttribute("aria-checked");
      const currentlyActive = isActive !== "false";
      if (currentlyActive !== data.is_active) {
        await this.formIsActive.click();
      }
    }
  }

  async submitForm() {
    await this.saveButton.click();
  }

  async closeForm() {
    await this.cancelButton.click();
  }

  async confirmDelete() {
    await this.confirmDeleteButton.click();
  }

  async cancelDelete() {
    // Click outside the confirmation dialog
    await this.deleteConfirmation.click({ position: { x: 10, y: 10 } });
  }

  async deleteService(id: number) {
    await this.getDeleteButton(id).click();
    await expect(this.deleteConfirmation).toBeVisible();
    await this.confirmDelete();
  }

  async toggleService(id: number) {
    await this.getToggleSwitch(id).click();
  }

  async filterByStatus(status: "all" | "active" | "inactive") {
    const filter =
      status === "all"
        ? this.filterAll
        : status === "active"
          ? this.filterActive
          : this.filterInactive;
    await filter.click();
  }

  async expectPageVisible() {
    await expect(this.page.getByTestId("admin-services-page")).toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.emptyAddButton).toBeVisible();
  }

  async expectLoadingState() {
    await expect(this.loadingSkeleton).toBeVisible();
  }

  async expectErrorState() {
    await expect(this.errorState).toBeVisible();
  }

  async expectRowVisible(id: number) {
    await expect(this.getServiceRow(id)).toBeVisible();
  }

  async expectRowNotVisible(id: number) {
    await expect(this.getServiceRow(id)).not.toBeVisible();
  }

  async expectFormVisible() {
    await expect(this.serviceForm).toBeVisible();
  }

  async expectFormHidden() {
    await expect(this.serviceForm).not.toBeVisible();
  }

  async expectDeleteConfirmationVisible() {
    await expect(this.deleteConfirmation).toBeVisible();
  }

  async expectDeleteConfirmationHidden() {
    await expect(this.deleteConfirmation).not.toBeVisible();
  }

  async expectSuccessToast() {
    // Sonner toasts appear in a toast container
    await expect(this.page.locator("[data-sonner-toast]")).toBeVisible({
      timeout: 5000,
    });
  }
}
