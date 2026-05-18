"use client";

import { useState } from "react";
import { FiEdit2, FiTrash2, FiMenu } from "react-icons/fi";
import Icon from "@/app/_components/website/Icon";
import { useTranslation } from "@/app/hooks/useTranslation";
import type { AdminStatItem } from "@/app/types/website/admin.types";

///////////////////////////////////////////////////////////////////////
/////////////// AdminStatCard — single stat card with actions /////////
///////////////////////////////////////////////////////////////////////

interface AdminStatCardProps {
  item: AdminStatItem;
  locale: "en" | "ar";
  onEdit: (item: AdminStatItem) => void;
  onDelete: (id: number) => void;
}

export default function AdminStatCard({
  item,
  locale,
  onEdit,
  onDelete,
}: AdminStatCardProps) {
  const adminT = useTranslation("admin");
  const statsSection = (adminT as Record<string, unknown>)?.statsSection as
    | Record<string, unknown>
    | undefined;
  const editor = (adminT as Record<string, unknown>)?.editor as
    | Record<string, string>
    | undefined;
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const label = locale === "ar" ? item.label_ar : item.label_en;

  // Safe string accessors for translations
  const editLabel =
    typeof statsSection?.editItem === "string"
      ? statsSection.editItem
      : "Edit Stat Item";
  const deleteLabel =
    typeof statsSection?.deleteItem === "string"
      ? statsSection.deleteItem
      : "Delete Item";
  const confirmDeleteText =
    typeof statsSection?.confirmDelete === "string"
      ? statsSection.confirmDelete
      : "Are you sure you want to delete this stat item?";
  const cancelLabel =
    typeof editor?.popupCancel === "string" ? editor.popupCancel : "Cancel";

  return (
    <>
      <div
        className="bg-surface border border-border rounded-xl p-9 text-center transition-all duration-400 relative overflow-hidden group hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/8"
        data-testid={`stat-card-${item.id}`}
      >
        {/* ── Top gradient bar ──────────────────────────────────── */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold to-gold-light opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

        {/* ── Drag handle ───────────────────────────────────────── */}
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-gray-400 hover:text-gray-600">
          <FiMenu className="w-4 h-4" />
        </div>

        {/* ── Action buttons ────────────────────────────────────── */}
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
            aria-label={editLabel}
            data-testid={`edit-stat-${item.id}`}
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
            aria-label={deleteLabel}
            data-testid={`delete-stat-${item.id}`}
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>

        {/* ── Icon ──────────────────────────────────────────────── */}
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gold/10 flex items-center justify-center">
          <Icon name={item.icon} className="w-6 h-6 text-gold" />
        </div>

        {/* ── Target + Suffix ───────────────────────────────────── */}
        <div className="text-[clamp(2.8rem,4.5vw,3.8rem)] font-black text-green leading-none mb-1.5 tabular-nums">
          <span className="text-gold">
            {item.target.toLocaleString("en-US")}
          </span>
          <span className="text-charcoal">{item.suffix}</span>
        </div>

        {/* ── Label ─────────────────────────────────────────────── */}
        <div className="text-sm text-muted font-medium">{label}</div>
      </div>

      {/* ── Delete Confirmation Dialog ──────────────────────────── */}
      {showConfirmDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowConfirmDelete(false)}
          role="dialog"
          aria-modal="true"
          data-testid="delete-confirmation"
        >
          <div
            className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {deleteLabel}
            </h3>
            <p className="text-sm text-gray-600 mb-6">{confirmDeleteText}</p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(item.id);
                  setShowConfirmDelete(false);
                }}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-red-500 transition hover:bg-red-600"
                data-testid="confirm-delete"
              >
                {deleteLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
