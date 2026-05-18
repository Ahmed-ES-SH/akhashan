"use client";

import { FiEdit2, FiTrash2, FiChevronUp, FiChevronDown } from "react-icons/fi";
import React from "react";
import { getIcon } from "@/app/helpers/getIcon";
import type { AdminLicensingItem } from "@/app/types/website/admin.types";
import { useLocale } from "@/app/hooks/useLocale";

///////////////////////////////////////////////////////////////////////
///////////// AdminLicensingItemCard — single item card ///////////////
///////////// Shows icon, title, desc preview, tag, actions ///////////
///////////////////////////////////////////////////////////////////////

interface AdminLicensingItemCardProps {
  item: AdminLicensingItem;
  index: number;
  totalItems: number;
  onEdit: (item: AdminLicensingItem) => void;
  onDelete: (id: number) => void;
  onMoveUp: (id: number) => void;
  onMoveDown: (id: number) => void;
}

export default function AdminLicensingItemCard({
  item,
  index,
  totalItems,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: AdminLicensingItemCardProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  // Use the locale-appropriate title and description
  const displayTitle = isRtl ? item.title_ar : item.title_en;
  const displayDesc = isRtl ? item.desc_ar : item.desc_en;
  const displayTag = isRtl ? item.tag_ar : item.tag_en;

  return (
    <div
      data-testid={`licensing-item-card-${item.id}`}
      className="group relative flex flex-col gap-4 bg-surface border border-border rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/6"
    >
      {/* Hover accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold to-gold-light opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* ── Header: icon + reorder buttons ──────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/12 to-gold/6">
          {React.createElement(getIcon(item.icon ?? "FaQuestionCircle"), { className: "h-[28px] w-[28px] text-gold" })}
        </div>

        {/* Reorder buttons */}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            data-testid={`move-up-${item.id}`}
            disabled={index === 0}
            onClick={() => onMoveUp(item.id)}
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
            aria-label="Move item up"
          >
            <FiChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            data-testid={`move-down-${item.id}`}
            disabled={index === totalItems - 1}
            onClick={() => onMoveDown(item.id)}
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
            aria-label="Move item down"
          >
            <FiChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Title ───────────────────────────────────────────────── */}
      <h3 className="text-lg font-bold text-charcoal">
        {displayTitle || (
          <span className="text-gray-400 italic">No title</span>
        )}
      </h3>

      {/* ── Description preview ─────────────────────────────────── */}
      <p className="text-sm leading-relaxed text-muted line-clamp-3 flex-1">
        {displayDesc || (
          <span className="text-gray-400 italic">No description</span>
        )}
      </p>

      {/* ── Tag badge (conditional) ─────────────────────────────── */}
      {displayTag && displayTag.trim() !== "" && (
        <span className="inline-block self-start rounded-full bg-gold/12 px-3 py-1 text-[0.72rem] font-bold text-gold-dark">
          {displayTag}
        </span>
      )}

      {/* ── Action buttons ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-t border-border pt-4">
        <button
          type="button"
          data-testid={`edit-item-${item.id}`}
          onClick={() => onEdit(item)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
        >
          <FiEdit2 className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          type="button"
          data-testid={`delete-item-${item.id}`}
          onClick={() => onDelete(item.id)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
        >
          <FiTrash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}
