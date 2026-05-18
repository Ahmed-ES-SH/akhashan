"use client";

import { useEffect, useState, useCallback } from "react";
import { FiDownload, FiCheck, FiUpload } from "react-icons/fi";
import { toast } from "sonner";
import AdminMessageList from "./AdminMessageList";
import AdminMessageDetail from "./AdminMessageDetail";
import { useAdminContactMessages } from "@/app/hooks/admin/useAdminContactMessages";
import { useTranslation } from "@/app/hooks/useTranslation";
import type { AdminContactMessage } from "@/app/types/website/admin.types";

/////////////////////////////////////////////////////////////////////
///////////// AdminMessagesInbox — main admin inbox component ///////
/////////////////////////////////////////////////////////////////////

type StatusFilter = "new" | "read" | "replied" | "archived" | null;

export default function AdminMessagesInbox() {
  const t = useTranslation("admin");
  const msgs = (t as Record<string, unknown>)?.contactMessages as
    | Record<string, unknown>
    | undefined;

  const {
    messages,
    meta,
    isLoading,
    error,
    currentPage,
    statusFilter,
    setStatusFilter,
    fetchMessages,
    getMessage,
    updateStatus,
    deleteMessage,
  } = useAdminContactMessages();

  const [selectedMessage, setSelectedMessage] = useState<AdminContactMessage | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Translation labels
  const titleLabel = (msgs?.title as string) ?? "Messages Inbox";
  const filterAllLabel = (msgs?.filterAll as string) ?? "All";
  const filterNewLabel = (msgs?.filterNew as string) ?? "New";
  const filterReadLabel = (msgs?.filterRead as string) ?? "Read";
  const filterRepliedLabel = (msgs?.filterReplied as string) ?? "Replied";
  const filterArchivedLabel = (msgs?.filterArchived as string) ?? "Archived";
  const statusUpdatedLabel =
    ((msgs?.toasts as Record<string, string>)?.statusUpdated as string) ?? "Message status updated";
  const deletedLabel =
    ((msgs?.toasts as Record<string, string>)?.deleted as string) ?? "Message deleted successfully";
  const statusErrorLabel =
    ((msgs?.toasts as Record<string, string>)?.statusError as string) ?? "Failed to update message status";
  const deleteErrorLabel =
    ((msgs?.toasts as Record<string, string>)?.deleteError as string) ?? "Failed to delete message";
  const notFoundLabel =
    ((msgs?.toasts as Record<string, string>)?.notFound as string) ?? "Message no longer exists";

  // Fetch messages on mount
  useEffect(() => {
    fetchMessages(1, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      fetchMessages(page, statusFilter);
    },
    [fetchMessages, statusFilter],
  );

  // Handle filter change
  const handleFilterChange = useCallback(
    (filter: StatusFilter) => {
      setStatusFilter(filter);
      fetchMessages(1, filter);
    },
    [setStatusFilter, fetchMessages],
  );

  // Handle row click — open detail view
  const handleRowClick = useCallback(
    async (id: number) => {
      try {
        const msg = await getMessage(id);
        setSelectedMessage(msg);
        // Auto-mark as read
        if (msg.status === "new") {
          await updateStatus(id, "read");
          // Update the selected message locally
          setSelectedMessage((prev) =>
            prev && prev.id === id ? { ...prev, status: "read" } : prev,
          );
        }
      } catch {
        toast.error(notFoundLabel);
      }
    },
    [getMessage, updateStatus, notFoundLabel],
  );

  // Handle status change from detail view
  const handleStatusChange = useCallback(
    async (id: number, status: "new" | "read" | "replied" | "archived") => {
      setIsUpdating(true);
      try {
        const updated = await updateStatus(id, status);
        setSelectedMessage(updated);
        toast.success(statusUpdatedLabel);
      } catch {
        toast.error(statusErrorLabel);
      } finally {
        setIsUpdating(false);
      }
    },
    [updateStatus, statusUpdatedLabel, statusErrorLabel],
  );

  // Handle delete from detail view or list
  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteMessage(id);
        setSelectedMessage(null);
        toast.success(deletedLabel);
      } catch {
        toast.error(deleteErrorLabel);
      }
    },
    [deleteMessage, deletedLabel, deleteErrorLabel],
  );

  // Handle back to list
  const handleBack = useCallback(() => {
    setSelectedMessage(null);
    fetchMessages(currentPage, statusFilter);
  }, [fetchMessages, currentPage, statusFilter]);

  // Handle retry
  const handleRetry = useCallback(() => {
    fetchMessages(currentPage, statusFilter);
  }, [fetchMessages, currentPage, statusFilter]);

  const filters: { label: string; value: StatusFilter }[] = [
    { label: filterAllLabel, value: null },
    { label: filterNewLabel, value: "new" },
    { label: filterReadLabel, value: "read" },
    { label: filterRepliedLabel, value: "replied" },
    { label: filterArchivedLabel, value: "archived" },
  ];

  // Static summary stats (mock data for visual substance)
  const summaryStats = [
    { value: 47, label: msgs?.summaryStats?.total as string ?? "Total", desc: msgs?.summaryStats?.totalDesc as string ?? "messages", accent: false },
    { value: 8, label: msgs?.summaryStats?.new as string ?? "New", desc: msgs?.summaryStats?.newDesc as string ?? "unread", accent: true },
    { value: 23, label: msgs?.summaryStats?.replied as string ?? "Replied", desc: msgs?.summaryStats?.repliedDesc as string ?? "handled", accent: false },
    { value: 12, label: msgs?.summaryStats?.archived as string ?? "Archived", desc: msgs?.summaryStats?.archivedDesc as string ?? "stored", accent: false },
  ];

  const comingSoonLabel = (msgs?.quickActions?.comingSoon as string) ?? "Coming soon";

  const handleQuickAction = (_action: string) => {
    toast.info(comingSoonLabel);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" data-testid="admin-messages-inbox">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="messages-inbox-title">{titleLabel}</h1>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6" data-testid="status-filters">
        {filters.map((filter) => (
          <button
            key={filter.label}
            onClick={() => handleFilterChange(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === filter.value
                ? "bg-green text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
            data-testid={`filter-${filter.value ?? "all"}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {summaryStats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border px-4 py-3 ${
              stat.accent
                ? "border-green/20 bg-green/5"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className={`text-2xl font-bold ${stat.accent ? "text-green" : "text-charcoal"}`}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {stat.label}
            </div>
            <div className="text-xs text-gray-400">{stat.desc}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 mb-6">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          {msgs?.quickActions?.title as string ?? "Quick Actions"}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleQuickAction("export")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            <FiDownload className="w-4 h-4" />
            {msgs?.quickActions?.export as string ?? "Export CSV"}
          </button>
          <button
            type="button"
            onClick={() => handleQuickAction("markAllRead")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            <FiCheck className="w-4 h-4" />
            {msgs?.quickActions?.markAllRead as string ?? "Mark All as Read"}
          </button>
          <button
            type="button"
            onClick={() => handleQuickAction("import")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            <FiUpload className="w-4 h-4" />
            {msgs?.quickActions?.import as string ?? "Import"}
          </button>
        </div>
      </div>

      {/* Content: detail view or list view */}
      {selectedMessage ? (
        <AdminMessageDetail
          message={selectedMessage}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onBack={handleBack}
          isUpdating={isUpdating}
        />
      ) : (
        <AdminMessageList
          messages={messages}
          meta={meta}
          isLoading={isLoading}
          error={error}
          currentPage={currentPage}
          statusFilter={statusFilter}
          onRowClick={handleRowClick}
          onDelete={handleDelete}
          onPageChange={handlePageChange}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
