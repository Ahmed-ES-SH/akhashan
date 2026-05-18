import { test as adminTest, expect as adminExpect } from "./fixtures";

/////////////////////////////////////////////////////////////////////
/////////// E2E Tests — Admin Contact Messages Inbox ///////////////
/////////////////////////////////////////////////////////////////////

adminTest.describe("Contact Messages — Admin Inbox", () => {
  // Note: Tests that need custom API mocks set up routes BEFORE calling goto() themselves.
  // Tests that use the real backend rely on the beforeEach.

  adminTest("displays messages list with pagination", async ({
    adminMessagesInboxPage,
    page,
  }) => {
    // Mock GET returning paginated messages — set up BEFORE navigation
    const apiResponsePromise = page.waitForResponse("**/api/admin/contact-messages**");

    await page.route("**/api/admin/contact-messages**", async (route) => {
      const url = new URL(route.request().url());
      const p = parseInt(url.searchParams.get("page") || "1");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
            phone: "+966501234567",
            service: "Service A",
            country: "Saudi Arabia",
            message: `Test message from user ${i + 1}`,
            status: i % 2 === 0 ? "new" : "read",
            createdAt: new Date(Date.now() - i * 3600000).toISOString(),
            updatedAt: new Date(Date.now() - i * 3600000).toISOString(),
          })),
          meta: {
            total: 25,
            page: p,
            limit: 20,
            totalPages: 2,
          },
        }),
      });
    });

    await adminMessagesInboxPage.goto();

    // Wait for the API response to be received
    await apiResponsePromise;

    // Assert list shows messages
    const count = await adminMessagesInboxPage.getMessagesCount();
    adminExpect(count).toBeGreaterThanOrEqual(1);

    // Assert pagination controls visible (totalPages > 1)
    await adminExpect(adminMessagesInboxPage.paginationControls).toBeVisible();
  });

  adminTest("shows empty state when no messages", async ({
    adminMessagesInboxPage,
    page,
  }) => {
    // Mock GET to return empty data — set up BEFORE navigation
    await page.route("**/api/admin/contact-messages**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [],
          meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
        }),
      });
    });

    await adminMessagesInboxPage.goto();

    // Assert empty state message visible
    await adminMessagesInboxPage.expectEmptyState();
  });

  adminTest("filters messages by status", async ({
    adminMessagesInboxPage,
    page,
  }) => {
    let lastStatus: string | null = null;

    // Mock GET that captures status filter — set up BEFORE navigation
    await page.route("**/api/admin/contact-messages**", async (route) => {
      const url = new URL(route.request().url());
      lastStatus = url.searchParams.get("status");

      const messages =
        lastStatus === "new"
          ? [
              {
                id: 1,
                name: "New User",
                email: "new@example.com",
                phone: null,
                service: null,
                country: null,
                message: "New message",
                status: "new",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ]
          : lastStatus === "archived"
            ? [
                {
                  id: 2,
                  name: "Archived User",
                  email: "archived@example.com",
                  phone: null,
                  service: null,
                  country: null,
                  message: "Archived message",
                  status: "archived",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ]
            : [];

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: messages,
          meta: { total: messages.length, page: 1, limit: 20, totalPages: 1 },
        }),
      });
    });

    await adminMessagesInboxPage.goto();

    // Click "New" filter tab
    await adminMessagesInboxPage.filterByStatus("new");
    await page.waitForTimeout(500);
    adminExpect(await adminMessagesInboxPage.getMessagesCount()).toBeGreaterThanOrEqual(1);

    // Click "Archived" filter tab
    await adminMessagesInboxPage.filterByStatus("archived");
    await page.waitForTimeout(500);
    adminExpect(await adminMessagesInboxPage.getMessagesCount()).toBeGreaterThanOrEqual(1);
  });

  adminTest("opens message detail view", async ({
    adminMessagesInboxPage,
    page,
  }) => {
    const mockMessage = {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: "+966501234567",
      service: "Web Development",
      country: "Saudi Arabia",
      message: "I need a website for my business.",
      status: "new",
      createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    };

    // Mock list — set up BEFORE navigation
    await page.route("**/api/admin/contact-messages**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [mockMessage],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        }),
      });
    });

    // Mock single message GET
    await page.route("**/api/admin/contact-messages/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockMessage),
      });
    });

    // Mock status update (auto-mark as read)
    await page.route(
      "**/api/admin/contact-messages/1/status",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...mockMessage, status: "read" }),
        });
      },
    );

    await adminMessagesInboxPage.goto();

    // Click on message row
    await adminMessagesInboxPage.openMessage(1);

    // Assert detail view opens with all fields displayed
    await adminMessagesInboxPage.expectDetailVisible();
    await adminExpect(adminMessagesInboxPage.detailSenderName).toContainText(
      "John Doe",
    );
    await adminExpect(adminMessagesInboxPage.detailEmailLink).toContainText(
      "john@example.com",
    );
    await adminExpect(adminMessagesInboxPage.detailMessageContent).toContainText(
      "I need a website for my business.",
    );
  });

  adminTest("updates message status from detail view", async ({
    adminMessagesInboxPage,
    page,
  }) => {
    const mockMessage = {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: null,
      service: null,
      country: null,
      message: "Test message",
      status: "read",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Mock list — set up BEFORE navigation
    await page.route("**/api/admin/contact-messages**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [mockMessage],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        }),
      });
    });

    // Mock single message GET
    await page.route("**/api/admin/contact-messages/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockMessage),
      });
    });

    // Track PATCH calls
    let patchStatus: string | null = null;
    await page.route(
      "**/api/admin/contact-messages/1/status",
      async (route) => {
        const body = JSON.parse(route.request().postData() || "{}");
        patchStatus = body.status;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...mockMessage, status: body.status }),
        });
      },
    );

    await adminMessagesInboxPage.goto();
    await adminMessagesInboxPage.openMessage(1);

    // Click "Mark as Replied"
    await adminMessagesInboxPage.updateStatusFromDetail("replied");

    // Assert PATCH called with "replied"
    adminExpect(patchStatus).toBe("replied");

    // Assert success toast
    await adminMessagesInboxPage.expectSuccessToast();
  });

  adminTest("deletes a message with confirmation", async ({
    adminMessagesInboxPage,
    page,
  }) => {
    const mockMessage = {
      id: 1,
      name: "User 1",
      email: "user1@example.com",
      phone: null,
      service: null,
      country: null,
      message: "Message 1",
      status: "new",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Mock list
    await page.route("**/api/admin/contact-messages**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [mockMessage],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        }),
      });
    });

    // Mock single message GET
    await page.route("**/api/admin/contact-messages/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockMessage),
      });
    });

    // Track DELETE calls
    let deleteCalled = false;
    await page.route("**/api/admin/contact-messages/1", async (route) => {
      if (route.request().method() === "DELETE") {
        deleteCalled = true;
        await route.fulfill({ status: 200 });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockMessage),
        });
      }
    });

    await adminMessagesInboxPage.goto();

    // Open message detail
    await adminMessagesInboxPage.openMessage(1);

    // Initiate delete from detail view (shows confirmation)
    await adminMessagesInboxPage.initiateDelete();

    // Assert confirmation dialog appears
    await adminExpect(adminMessagesInboxPage.deleteConfirmation).toBeVisible();

    // Confirm deletion
    await adminMessagesInboxPage.confirmDelete();

    // Assert DELETE was called
    adminExpect(deleteCalled).toBe(true);

    // Assert success toast
    await adminMessagesInboxPage.expectSuccessToast();
  });

  adminTest("cancels delete of a message", async ({
    adminMessagesInboxPage,
    page,
  }) => {
    const mockMessage = {
      id: 1,
      name: "User 1",
      email: "user1@example.com",
      phone: null,
      service: null,
      country: null,
      message: "Message 1",
      status: "new",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await page.route("**/api/admin/contact-messages**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [mockMessage],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        }),
      });
    });

    await page.route("**/api/admin/contact-messages/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockMessage),
      });
    });

    let deleteCalled = false;
    await page.route("**/api/admin/contact-messages/1", async (route) => {
      if (route.request().method() === "DELETE") {
        deleteCalled = true;
        await route.fulfill({ status: 200 });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockMessage),
        });
      }
    });

    await adminMessagesInboxPage.goto();

    // Open message detail
    await adminMessagesInboxPage.openMessage(1);

    // Click delete
    await adminMessagesInboxPage.initiateDelete();

    // Cancel
    await adminMessagesInboxPage.cancelDelete();

    // Assert DELETE was NOT called
    adminExpect(deleteCalled).toBe(false);

    // Assert detail view still visible
    await adminMessagesInboxPage.expectDetailVisible();
  });

  adminTest("paginates through messages", async ({
    adminMessagesInboxPage,
    page,
  }) => {
    let requestedPage = 1;

    await page.route("**/api/admin/contact-messages**", async (route) => {
      const url = new URL(route.request().url());
      requestedPage = parseInt(url.searchParams.get("page") || "1");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: Array.from({ length: 5 }, (_, i) => ({
            id: (requestedPage - 1) * 20 + i + 1,
            name: `User Page ${requestedPage} - ${i + 1}`,
            email: `user${(requestedPage - 1) * 20 + i + 1}@example.com`,
            phone: null,
            service: null,
            country: null,
            message: `Message from page ${requestedPage}`,
            status: "new",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
          meta: {
            total: 45,
            page: requestedPage,
            limit: 20,
            totalPages: 3,
          },
        }),
      });
    });

    await adminMessagesInboxPage.goto();

    // Click page 2
    await adminMessagesInboxPage.getPageButton(2).click();
    await page.waitForTimeout(500);

    // Assert page 2 was requested
    adminExpect(requestedPage).toBe(2);

    // Assert new messages displayed
    const count = await adminMessagesInboxPage.getMessagesCount();
    adminExpect(count).toBeGreaterThanOrEqual(1);
  });

  adminTest("shows loading state during fetch", async ({
    adminMessagesInboxPage,
    page,
  }) => {
    // Intercept GET with delayed response — set up BEFORE navigation
    await page.route("**/api/admin/contact-messages**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: 1,
              name: "User 1",
              email: "user1@example.com",
              phone: null,
              service: null,
              country: null,
              message: "Test message",
              status: "new",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        }),
      });
    });

    await adminMessagesInboxPage.goto();

    // Assert loading skeleton visible
    await adminMessagesInboxPage.expectLoadingState();

    // Wait for response
    await adminMessagesInboxPage.expectPageVisible();
  });

  adminTest("shows error state on fetch failure", async ({
    adminMessagesInboxPage,
    page,
  }) => {
    await page.route("**/api/admin/contact-messages**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Internal Server Error" }),
      });
    });

    await adminMessagesInboxPage.goto();

    // Assert error message visible
    await adminMessagesInboxPage.expectErrorState();

    // Assert retry button visible
    await adminExpect(adminMessagesInboxPage.retryButton).toBeVisible();
  });

  adminTest("handles 404 on deleted message detail", async ({
    adminMessagesInboxPage,
    page,
  }) => {
    // Mock list with 1 message — set up BEFORE navigation
    await page.route("**/api/admin/contact-messages**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: 999,
              name: "Deleted User",
              email: "deleted@example.com",
              phone: null,
              service: null,
              country: null,
              message: "This message was deleted",
              status: "new",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        }),
      });
    });

    // Mock single message GET to return 404
    await page.route("**/api/admin/contact-messages/999", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "Not found" }),
      });
    });

    await adminMessagesInboxPage.goto();

    // Click on message row
    await adminMessagesInboxPage.getMessageRow(999).click();

    // Wait a moment for the error toast
    await page.waitForTimeout(1000);

    // Assert toast appeared (Sonner toast) — use first() to avoid strict mode violation
    const toastLocator = page.locator("[data-sonner-toast]").first();
    await adminExpect(toastLocator).toBeVisible({ timeout: 5000 });
  });

  adminTest("email and phone are clickable links in detail view", async ({
    adminMessagesInboxPage,
    page,
  }) => {
    const mockMessage = {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: "+966501234567",
      service: null,
      country: null,
      message: "Test message",
      status: "read",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await page.route("**/api/admin/contact-messages**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [mockMessage],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        }),
      });
    });

    await page.route("**/api/admin/contact-messages/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockMessage),
      });
    });

    await adminMessagesInboxPage.goto();
    await adminMessagesInboxPage.openMessage(1);

    // Assert email is a mailto: link
    const emailLink = adminMessagesInboxPage.detailEmailLink;
    await adminExpect(emailLink).toHaveAttribute("href", /mailto:/);

    // Assert phone is a tel: link
    const phoneLink = adminMessagesInboxPage.detailPhoneLink;
    await adminExpect(phoneLink).toHaveAttribute("href", /tel:/);
  });

  adminTest("displays relative timestamps", async ({
    adminMessagesInboxPage,
    page,
  }) => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();

    const mockMessage = {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: null,
      service: null,
      country: null,
      message: "Test message",
      status: "read",
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo,
    };

    await page.route("**/api/admin/contact-messages**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [mockMessage],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        }),
      });
    });

    await page.route("**/api/admin/contact-messages/1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockMessage),
      });
    });

    await adminMessagesInboxPage.goto();
    await adminMessagesInboxPage.openMessage(1);

    // Assert relative time displayed (should contain "2h ago" or similar)
    const receivedAt = adminMessagesInboxPage.page.getByTestId(
      "detail-received-at",
    );
    await adminExpect(receivedAt).toBeVisible();
    const text = await receivedAt.textContent();
    adminExpect(text).toMatch(/2h ago|just now|\d+m ago/);
  });
});
