"use client";

import { FiMail } from "react-icons/fi";
import AdminMessageRow from "./AdminMessageRow";
import AdminPagination from "./AdminPagination";
import { useTranslation } from "@/app/hooks/useTranslation";
import type { AdminContactMessage, AdminContactMessageMeta } from "@/app/types/website/admin.types";

/////////////////////////////////////////////////////////////////////
///////////// AdminMessageList — paginated message list /////////////
/////////////////////////////////////////////////////////////////////

interface AdminMessageListProps {
  messages: AdminContactMessage[];
  meta: AdminContactMessageMeta;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  statusFilter: string | null;
  onRowClick: (id: number) => void;
  onDelete: (id: number) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}

export default function AdminMessageList({
  messages,
  meta,
  isLoading,
  error,
  currentPage,
  statusFilter,
  onRowClick,
  onDelete,
  onPageChange,
  onRetry,
}: AdminMessageListProps) {
  const t = useTranslation("admin");
  const msgs = (t as Record<string, unknown>)?.contactMessages as
    | Record<string, unknown>
    | undefined;

  const noMessagesLabel = (msgs?.emptyState?.title as string) ?? (msgs?.noMessages as string) ?? "No messages yet.";
  const noMessagesDesc = (msgs?.emptyState?.description as string) ?? "Contact form submissions from visitors will appear here. You can filter, read, and manage inquiries.";
  const noMessagesFilteredLabel = (msgs?.emptyState?.titleFiltered as string) ?? (msgs?.noMessagesFiltered as string) ?? "No messages with this status.";
  const noMessagesFilteredDesc = (msgs?.emptyState?.descriptionFiltered as string) ?? "Try selecting a different filter above.";
  const fetchErrorLabel =
    ((msgs?.toasts as Record<string, string>)?.fetchError as string) ??
    "Failed to load messages";

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" data-testid="messages-loading-skeleton">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 animate-pulse"
          >
            <div className="w-12 h-5 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-48 rounded bg-gray-100" />
            </div>
            <div className="h-3 w-20 rounded bg-gray-100 hidden lg:block" />
            <div className="h-3 w-12 rounded bg-gray-100 hidden sm:block" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center" data-testid="messages-error-state">
        <div className="text-red-500 text-sm font-medium mb-3">
          {fetchErrorLabel}
        </div>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green text-white text-sm font-medium hover:bg-green/90 transition"
          data-testid="retry-fetch-messages"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center" data-testid="messages-empty-state">
        <FiMail className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-900 text-sm font-medium mb-1">
          {statusFilter ? noMessagesFilteredLabel : noMessagesLabel}
        </p>
        <p className="text-gray-500 text-xs max-w-sm mx-auto">
          {statusFilter ? noMessagesFilteredDesc : noMessagesDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Message rows */}
      <div data-testid="message-list">
        {messages.map((msg) => (
          <AdminMessageRow
            key={msg.id}
            message={msg}
            onClick={onRowClick}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Pagination */}
      <AdminPagination
        currentPage={currentPage}
        totalPages={meta.totalPages}
        total={meta.total}
        onPageChange={onPageChange}
      />
    </div>
  );
}
