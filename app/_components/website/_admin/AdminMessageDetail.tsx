/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { useTranslation } from "@/app/hooks/useTranslation";

///////////////////////////////////////////////////////////////////////
/////////////// AdminMessageDetail — single message detail view ///////
///////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
///////////// Relative time formatter ///////////////////////////////
/////////////////////////////////////////////////////////////////////

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

interface AdminMessageDetailProps {
  message: any;
}

export default function AdminMessageDetail({
  message,
  onStatusChange,
  onDelete,
  onBack,
  isUpdating,
}: any) {
  const t = useTranslation("admin");
  const msgs = (t as Record<string, unknown>)?.contactMessages as
    | Record<string, unknown>
    | undefined;

  const backLabel = (msgs?.backToList as string) ?? "Back to Inbox";
  const senderLabel = (msgs?.sender as string) ?? "From";
  const emailLabel = (msgs?.email as string) ?? "Email";
  const phoneLabel = (msgs?.phone as string) ?? "Phone";
  const serviceLabel = (msgs?.service as string) ?? "Service";
  const countryLabel = (msgs?.country as string) ?? "Country";
  const messageLabel = (msgs?.message as string) ?? "Message";
  const receivedAtLabel = (msgs?.receivedAt as string) ?? "Received";
  const updatedAtLabel = (msgs?.updatedAt as string) ?? "Last Updated";
  const markAsReadLabel = (msgs?.markAsRead as string) ?? "Mark as Read";
  const markAsRepliedLabel =
    (msgs?.markAsReplied as string) ?? "Mark as Replied";
  const archiveLabel = (msgs?.archive as string) ?? "Archive";
  const reopenLabel = (msgs?.reopen as string) ?? "Reopen";
  const deleteLabel = (msgs?.deleteMessage as string) ?? "Delete Message";
  const confirmDeleteLabel =
    (msgs?.confirmDelete as string) ??
    "Are you sure you want to delete this message? This cannot be undone.";

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(message.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Status action buttons based on current status
  const getStatusActions = (): {
    label: string;
    status: "new" | "read" | "replied" | "archived";
    disabled?: boolean;
  }[] => {
    switch (message.status) {
      case "new":
      case "read":
        return [
          {
            label: markAsReadLabel,
            status: "read",
            disabled: message.status === "read",
          },
          { label: markAsRepliedLabel, status: "replied" },
          { label: archiveLabel, status: "archived" },
        ];
      case "replied":
        return [
          { label: archiveLabel, status: "archived" },
          { label: reopenLabel, status: "new" },
        ];
      case "archived":
        return [{ label: reopenLabel, status: "new" }];
      default:
        return [];
    }
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      data-testid="message-detail"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
          data-testid="back-to-inbox"
        >
          <FiArrowLeft className="w-4 h-4" />
          {backLabel}
        </button>
        <AdminStatusBadge status={message.status} />
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Sender info grid */}
        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {senderLabel}
            </label>
            <p
              className="mt-1 text-sm font-semibold text-gray-900"
              data-testid="detail-sender-name"
            >
              {message.name}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {emailLabel}
            </label>
            <a
              href={`mailto:${message.email}`}
              className="mt-1 text-sm text-green hover:underline block"
              data-testid="email-link"
            >
              {message.email}
            </a>
          </div>
          {message.phone && (
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {phoneLabel}
              </label>
              <a
                href={`tel:${message.phone}`}
                className="mt-1 text-sm text-green hover:underline block"
                data-testid="phone-link"
              >
                {message.phone}
              </a>
            </div>
          )}
          {message.service && (
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {serviceLabel}
              </label>
              <p
                className="mt-1 text-sm text-gray-700"
                data-testid="detail-service"
              >
                {message.service}
              </p>
            </div>
          )}
          {message.country && (
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {countryLabel}
              </label>
              <p
                className="mt-1 text-sm text-gray-700"
                data-testid="detail-country"
              >
                {message.country}
              </p>
            </div>
          )}
        </div>

        {/* Message content */}
        <div className="mb-6">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {messageLabel}
          </label>
          <div
            className="mt-2 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
            data-testid="detail-message-content"
          >
            {message.message || "No message content."}
          </div>
        </div>

        {/* Timestamps */}
        <div className="flex flex-wrap gap-6 text-xs text-gray-400 mb-6">
          <span
            title={new Date(message.createdAt).toLocaleString()}
            data-testid="detail-received-at"
          >
            {receivedAtLabel}: {formatRelativeTime(message.createdAt)}
          </span>
          <span
            title={new Date(message.updatedAt).toLocaleString()}
            data-testid="detail-updated-at"
          >
            {updatedAtLabel}: {formatRelativeTime(message.updatedAt)}
          </span>
        </div>

        {/* Action buttons */}
        <div
          className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100"
          data-testid="detail-status-actions"
        >
          {getStatusActions().map((action) => (
            <button
              key={action.status}
              onClick={() => onStatusChange(message.id, action.status)}
              disabled={isUpdating || action.disabled}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              data-testid={`status-action-${action.status}`}
            >
              {action.label}
            </button>
          ))}

          <div className="flex-1" />

          {/* Delete button */}
          {showDeleteConfirm ? (
            <div
              className="flex items-center gap-2"
              data-testid="delete-confirmation"
            >
              <span className="text-xs text-red-600">{confirmDeleteLabel}</span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition"
                data-testid="confirm-delete"
              >
                {isDeleting ? "Deleting..." : "Confirm"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                data-testid="cancel-delete"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition"
              data-testid="delete-message-button"
            >
              {deleteLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
