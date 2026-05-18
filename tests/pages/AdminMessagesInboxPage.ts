import { type Page, type Locator, expect } from "@playwright/test";

/////////////////////////////////////////////////////////////////////
/////////// Page Object Model — Admin Messages Inbox Page ///////////
/////////////////////////////////////////////////////////////////////

export class AdminMessagesInboxPage {
  readonly page: Page;
  readonly inboxContainer: Locator;
  readonly inboxTitle: Locator;
  readonly statusFilters: Locator;
  readonly filterAll: Locator;
  readonly filterNew: Locator;
  readonly filterRead: Locator;
  readonly filterReplied: Locator;
  readonly filterArchived: Locator;
  readonly messageList: Locator;
  readonly loadingSkeleton: Locator;
  readonly emptyState: Locator;
  readonly errorState: Locator;
  readonly retryButton: Locator;
  readonly paginationControls: Locator;

  // Detail view locators
  readonly messageDetail: Locator;
  readonly backToInbox: Locator;
  readonly detailSenderName: Locator;
  readonly detailEmailLink: Locator;
  readonly detailPhoneLink: Locator;
  readonly detailMessageContent: Locator;
  readonly detailStatusActions: Locator;
  readonly deleteButton: Locator;
  readonly deleteConfirmation: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.inboxContainer = page.getByTestId("admin-messages-inbox");
    this.inboxTitle = page.getByTestId("messages-inbox-title");
    this.statusFilters = page.getByTestId("status-filters");
    this.filterAll = page.getByTestId("filter-all");
    this.filterNew = page.getByTestId("filter-new");
    this.filterRead = page.getByTestId("filter-read");
    this.filterReplied = page.getByTestId("filter-replied");
    this.filterArchived = page.getByTestId("filter-archived");
    this.messageList = page.getByTestId("message-list");
    this.loadingSkeleton = page.getByTestId("messages-loading-skeleton");
    this.emptyState = page.getByTestId("messages-empty-state");
    this.errorState = page.getByTestId("messages-error-state");
    this.retryButton = page.getByTestId("retry-fetch-messages");
    this.paginationControls = page.getByTestId("pagination-controls");

    // Detail view
    this.messageDetail = page.getByTestId("message-detail");
    this.backToInbox = page.getByTestId("back-to-inbox");
    this.detailSenderName = page.getByTestId("detail-sender-name");
    this.detailEmailLink = page.getByTestId("email-link");
    this.detailPhoneLink = page.getByTestId("phone-link");
    this.detailMessageContent = page.getByTestId("detail-message-content");
    this.detailStatusActions = page.getByTestId("detail-status-actions");
    this.deleteButton = page.getByTestId("delete-message-button");
    this.deleteConfirmation = page.getByTestId("delete-confirmation");
    this.confirmDeleteButton = page.getByTestId("confirm-delete");
    this.cancelDeleteButton = page.getByTestId("cancel-delete");
  }

  async goto(locale: string = "en") {
    await this.page.goto(`/${locale}/admin/contact-messages`);
  }

  getMessageRow(id: number): Locator {
    return this.page.getByTestId(`message-row-${id}`);
  }

  getDeleteButtonForRow(id: number): Locator {
    return this.page.getByTestId(`delete-message-${id}`);
  }

  getStatusAction(status: "new" | "read" | "replied" | "archived"): Locator {
    return this.page.getByTestId(`status-action-${status}`);
  }

  getPageButton(pageNum: number): Locator {
    return this.page.getByTestId(`pagination-page-${pageNum}`);
  }

  getPreviousButton(): Locator {
    return this.page.getByTestId("pagination-previous");
  }

  getNextButton(): Locator {
    return this.page.getByTestId("pagination-next");
  }

  async getMessagesCount(): Promise<number> {
    const rows = this.page.locator('[data-testid^="message-row-"]');
    return rows.count();
  }

  async filterByStatus(status: "all" | "new" | "read" | "replied" | "archived") {
    const filter =
      status === "all"
        ? this.filterAll
        : status === "new"
          ? this.filterNew
          : status === "read"
            ? this.filterRead
            : status === "replied"
              ? this.filterReplied
              : this.filterArchived;
    await filter.click();
  }

  async openMessage(id: number) {
    await this.getMessageRow(id).click();
    await expect(this.messageDetail).toBeVisible();
  }

  async goBackToList() {
    await this.backToInbox.click();
  }

  async updateStatusFromDetail(status: "new" | "read" | "replied" | "archived") {
    await this.getStatusAction(status).click();
  }

  async initiateDelete() {
    await this.deleteButton.click();
    await expect(this.deleteConfirmation).toBeVisible();
  }

  async confirmDelete() {
    await this.confirmDeleteButton.click();
  }

  async cancelDelete() {
    await this.cancelDeleteButton.click();
  }

  async expectPageVisible() {
    await expect(this.inboxContainer).toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async expectLoadingState() {
    await expect(this.loadingSkeleton).toBeVisible();
  }

  async expectErrorState() {
    await expect(this.errorState).toBeVisible();
  }

  async expectRowVisible(id: number) {
    await expect(this.getMessageRow(id)).toBeVisible();
  }

  async expectRowNotVisible(id: number) {
    await expect(this.getMessageRow(id)).not.toBeVisible();
  }

  async expectDetailVisible() {
    await expect(this.messageDetail).toBeVisible();
  }

  async expectDetailHidden() {
    await expect(this.messageDetail).not.toBeVisible();
  }

  async expectSuccessToast() {
    await expect(this.page.locator("[data-sonner-toast]")).toBeVisible({
      timeout: 5000,
    });
  }
}
