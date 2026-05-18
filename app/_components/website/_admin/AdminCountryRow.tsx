"use client";

import { useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { useTranslation } from "@/app/hooks/useTranslation";
import type { AdminCountry } from "@/app/types/website/admin.types";

///////////////////////////////////////////////////////////////////////
///////////// AdminCountryRow — single country row ////////////////////
///////////////////////////////////////////////////////////////////////

interface AdminCountryRowProps {
  country: AdminCountry;
  locale: "en" | "ar";
  onEdit: (country: AdminCountry) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}

export default function AdminCountryRow({
  country,
  locale,
  onEdit,
  onDelete,
  onToggle,
}: AdminCountryRowProps) {
  const adminT = useTranslation("admin");
  const countriesSection = (adminT as Record<string, unknown>)?.countries as
    | Record<string, unknown>
    | undefined;
  const editor = (adminT as Record<string, unknown>)?.editor as
    | Record<string, string>
    | undefined;
  const common = (adminT as Record<string, unknown>)?.common as
    | Record<string, string>
    | undefined;
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const name = locale === "ar" ? country.name_ar : country.name_en;
  const specialty = country.specialty;

  // Region labels from translations
  const regionLabels =
    (countriesSection?.regionLabels as Record<string, string>) ?? {};
  const regionLabel = country.region
    ? (regionLabels[country.region] ?? country.region)
    : "—";

  // Safe string accessors
  const editLabel =
    typeof countriesSection?.editCountry === "string"
      ? countriesSection.editCountry
      : "Edit Country";
  const deleteLabel =
    typeof countriesSection?.deleteCountry === "string"
      ? countriesSection.deleteCountry
      : "Delete Country";
  const confirmDeleteText =
    typeof countriesSection?.confirmDelete === "string"
      ? countriesSection.confirmDelete
      : "Are you sure you want to delete this country?";
  const cancelText =
    typeof editor?.popupCancel === "string" ? editor.popupCancel : "Cancel";
  const statusActive =
    typeof common?.statusActive === "string" ? common.statusActive : "Active";
  const statusInactive =
    typeof common?.statusInactive === "string"
      ? common.statusInactive
      : "Inactive";

  const truncatedSpecialty =
    specialty && specialty.length > 60
      ? `${specialty.slice(0, 60)}...`
      : specialty ?? "—";

  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group"
        data-testid={`country-row-${country.id}`}
      >
        {/* Flag Emoji */}
        <td className="px-4 py-3">
          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-xl">
            {country.flag_emoji ? (
              <span>{country.flag_emoji}</span>
            ) : (
              <span className="text-xs text-gray-400">—</span>
            )}
          </div>
        </td>

        {/* Name */}
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900 text-sm truncate max-w-[200px]">
            {name ?? "—"}
          </div>
        </td>

        {/* Region */}
        <td className="px-4 py-3 hidden md:table-cell">
          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            {regionLabel}
          </span>
        </td>

        {/* Specialty */}
        <td className="px-4 py-3 hidden lg:table-cell">
          <div className="text-sm text-gray-500 truncate max-w-[250px]">
            {truncatedSpecialty}
          </div>
        </td>

        {/* Workers Label */}
        <td className="px-4 py-3 hidden sm:table-cell">
          <div className="text-xs font-semibold text-green">
            {country.workers_label ?? "—"}
          </div>
        </td>

        {/* Sort Order */}
        <td className="px-4 py-3 hidden sm:table-cell">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-sm font-medium text-gray-600">
            {country.sort_order}
          </span>
        </td>

        {/* Active Toggle */}
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => onToggle(country.id)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              country.is_active ? "bg-green" : "bg-gray-300"
            }`}
            aria-label={country.is_active ? statusActive : statusInactive}
            data-testid={`country-toggle-${country.id}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                country.is_active ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onEdit(country)}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
              aria-label={editLabel}
              data-testid={`edit-country-${country.id}`}
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label={deleteLabel}
              data-testid={`delete-country-${country.id}`}
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>

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
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(country.id);
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
