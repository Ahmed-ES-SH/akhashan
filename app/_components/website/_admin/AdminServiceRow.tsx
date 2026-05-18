"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { getIcon } from "@/app/helpers/getIcon";
import { useTranslation } from "@/app/hooks/useTranslation";
import type { AdminService } from "@/app/types/website/admin.types";

///////////////////////////////////////////////////////////////////////
/////////////// AdminServiceRow — single service row ////////////////
///////////////////////////////////////////////////////////////////////

interface AdminServiceRowProps {
  service: AdminService;
  locale: "en" | "ar";
  onEdit: (service: AdminService) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}

export default function AdminServiceRow({
  service,
  locale,
  onEdit,
  onDelete,
  onToggle,
}: AdminServiceRowProps) {
  const adminT = useTranslation("admin");
  const servicesSection = (adminT as Record<string, unknown>)?.services as
    | Record<string, unknown>
    | undefined;
  const editor = (adminT as Record<string, unknown>)?.editor as
    | Record<string, string>
    | undefined;
  const common = (adminT as Record<string, unknown>)?.common as
    | Record<string, string>
    | undefined;
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  ///////////////////////////////////////////////////////////////////////
  ///////////// Focus management for delete dialog //////////////////////
  ///////////////////////////////////////////////////////////////////////

  const deleteOpenButtonRef = useRef<HTMLButtonElement | null>(null);
  const deleteCancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (showConfirmDelete) {
      deleteOpenButtonRef.current = document.activeElement as HTMLButtonElement;
      deleteCancelButtonRef.current?.focus();
    }
  }, [showConfirmDelete]);

  useEffect(() => {
    if (!showConfirmDelete && deleteOpenButtonRef.current) {
      deleteOpenButtonRef.current.focus();
    }
  }, [showConfirmDelete]);

  const title = locale === "ar" ? service.title_ar : service.title_en;
  const desc = locale === "ar" ? service.desc_ar : service.desc_en;
  const metricLabel =
    locale === "ar" ? service.metric_label_ar : service.metric_label_en;

  // Safe string accessors
  const editLabel =
    typeof servicesSection?.editService === "string"
      ? servicesSection.editService
      : "Edit Service";
  const deleteLabel =
    typeof servicesSection?.deleteService === "string"
      ? servicesSection.deleteService
      : "Delete Service";
  const confirmDeleteText =
    typeof servicesSection?.confirmDelete === "string"
      ? servicesSection.confirmDelete
      : "Are you sure you want to delete this service?";
  const cancelText =
    typeof editor?.popupCancel === "string" ? editor.popupCancel : "Cancel";
  const statusActive =
    typeof common?.statusActive === "string" ? common.statusActive : "Active";
  const statusInactive =
    typeof common?.statusInactive === "string"
      ? common.statusInactive
      : "Inactive";
  const cannotBeUndoneText =
    typeof servicesSection?.dialogs === "object" &&
    servicesSection.dialogs !== null &&
    "cannotBeUndone" in servicesSection.dialogs
      ? (servicesSection.dialogs as Record<string, string>).cannotBeUndone
      : "This action cannot be undone.";

  const truncatedDesc =
    desc && desc.length > 80 ? `${desc.slice(0, 80)}...` : (desc ?? "—");

  ///////////////////////////////////////////////////////////////////////
  ///////////// Toggle active/inactive with loading state ///////////////
  ///////////////////////////////////////////////////////////////////////

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await onToggle(service.id);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <tr
        className="border-b border-border/50 hover:bg-bg/50 transition-colors"
        data-testid={`service-row-${service.id}`}
      >
        {/* Icon */}
        <td className="px-4 py-3">
          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
            {service.icon ? (
              React.createElement(getIcon(service.icon), {
                className: "w-5 h-5 text-gold",
              })
            ) : (
              <span className="text-xs text-muted/70">—</span>
            )}
          </div>
        </td>

        {/* Title */}
        <td className="px-4 py-3">
          <div className="font-medium text-charcoal text-sm truncate max-w-50">
            {title ?? "—"}
          </div>
        </td>

        {/* Description */}
        <td className="px-4 py-3 hidden lg:table-cell">
          <div className="text-sm text-muted truncate max-w-75">
            {truncatedDesc}
          </div>
        </td>

        {/* Metric */}
        <td className="px-4 py-3 hidden md:table-cell">
          {service.metric_value ? (
            <div className="text-sm font-semibold text-green">
              {service.metric_value}
              {service.metric_suffix ?? ""}
              {metricLabel ? (
                <span className="font-normal text-muted/70 ms-1">
                  {metricLabel}
                </span>
              ) : null}
            </div>
          ) : (
            <span className="text-sm text-muted/70">—</span>
          )}
        </td>

        {/* Sort Order */}
        <td className="px-4 py-3 hidden sm:table-cell">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-sm font-medium text-muted">
            {service.sort_order}
          </span>
        </td>

        {/* Active Toggle */}
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              service.is_active ? "bg-green" : "bg-gray-300"
            } ${isToggling ? "opacity-60 cursor-not-allowed" : ""}`}
            aria-label={service.is_active ? statusActive : statusInactive}
            aria-busy={isToggling}
            data-testid={`service-toggle-${service.id}`}
          >
            {isToggling ? (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </span>
            ) : (
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  service.is_active ? "translate-x-6" : "translate-x-1"
                }`}
              />
            )}
          </button>
        </td>

        {/* Actions — always visible */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(service)}
              className="rounded-lg p-1.5 text-muted/70 transition hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-gold/40"
              aria-label={editLabel}
              data-testid={`edit-service-${service.id}`}
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="rounded-lg p-1.5 text-muted/70 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-gold/40"
              aria-label={deleteLabel}
              data-testid={`delete-service-${service.id}`}
              ref={deleteOpenButtonRef}
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* ── Delete Confirmation Dialog ──────────────────────────── */}
      {showConfirmDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/50 backdrop-blur-sm"
          onClick={() => setShowConfirmDelete(false)}
          role="dialog"
          aria-modal="true"
          data-testid="delete-confirmation"
        >
          <div
            className="w-full max-w-sm mx-4 bg-surface rounded-2xl shadow-xl overflow-hidden p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-charcoal mb-2">
              {deleteLabel}
            </h3>
            <p className="text-sm text-muted mb-1">{confirmDeleteText}</p>
            <p className="text-xs text-muted/70 mb-6">{cannotBeUndoneText}</p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-muted transition hover:bg-gray-100"
                ref={deleteCancelButtonRef}
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(service.id);
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
