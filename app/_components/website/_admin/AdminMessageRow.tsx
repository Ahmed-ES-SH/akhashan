"use client";

import { FiTrash2 } from "react-icons/fi";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { formatRelativeTime } from "@/app/helpers/formatRelativeTime";
import type { AdminContactMessage } from "@/app/types/website/admin.types";

///////////////////////////////////////////////////////////////////////
/////////////// AdminMessageRow — single message row in list //////////
///////////////////////////////////////////////////////////////////////

interface AdminMessageRowProps {
  message: AdminContactMessage;
  onClick: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function AdminMessageRow({
  message,
  onClick,
  onDelete,
}: AdminMessageRowProps) {
  const preview = message.message
    ? message.message.substring(0, 60) + (message.message.length > 60 ? "..." : "")
    : "No message content";

  return (
    <div
      className="group flex items-center gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition"
      onClick={() => onClick(message.id)}
      data-testid={`message-row-${message.id}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(message.id);
        }
      }}
    >
      {/* Status badge */}
      <AdminStatusBadge status={message.status} />

      {/* Sender info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 truncate">
            {message.name}
          </span>
          {message.status === "new" && (
            <span className="w-2 h-2 rounded-full bg-green shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{message.email}</p>
      </div>

      {/* Service / Country preview */}
      <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 shrink-0">
        {message.service && (
          <span className="px-2 py-0.5 rounded bg-gray-100">{message.service}</span>
        )}
        {message.country && (
          <span className="px-2 py-0.5 rounded bg-gray-100">{message.country}</span>
        )}
      </div>

      {/* Message preview */}
      <p className="hidden lg:block flex-1 text-xs text-gray-500 truncate max-w-xs">
        {preview}
      </p>

      {/* Relative time */}
      <span
        className="text-xs text-gray-400 shrink-0 hidden sm:block"
        title={new Date(message.createdAt).toLocaleString()}
      >
        {formatRelativeTime(message.createdAt)}
      </span>

      {/* Delete button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(message.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
        aria-label={`Delete message from ${message.name}`}
        data-testid={`delete-message-${message.id}`}
      >
        <FiTrash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
