"use client";

import { useState, useEffect, type KeyboardEvent } from "react";
import { FiX } from "react-icons/fi";
import { useTranslation } from "@/app/hooks/useTranslation";
import type {
  AdminCountry,
  CountryRegion,
  AdminCreateCountryPayload,
  AdminUpdateCountryPayload,
} from "@/app/types/website/admin.types";

///////////////////////////////////////////////////////////////////////
///////////// AdminCountryForm — modal for create/edit ////////////////
///////////////////////////////////////////////////////////////////////

interface AdminCountryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: AdminCreateCountryPayload | AdminUpdateCountryPayload,
  ) => Promise<void>;
  initialData?: AdminCountry;
  isSaving: boolean;
}

export default function AdminCountryForm({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSaving,
}: AdminCountryFormProps) {
  const adminT = useTranslation("admin");
  const countriesSection = (adminT as Record<string, unknown>)?.countries as
    | Record<string, unknown>
    | undefined;
  const editor = (adminT as Record<string, unknown>)?.editor as
    | Record<string, string>
    | undefined;
  const fieldLabels =
    (countriesSection?.fieldLabels as Record<string, string>) ?? {};
  const placeholders =
    (countriesSection?.placeholders as Record<string, string>) ?? {};
  const validation =
    (countriesSection?.validation as Record<string, string>) ?? {};
  const regionOptions =
    (countriesSection?.regionOptions as Record<string, string>) ?? {};

  const isEditMode = !!initialData;

  const [flagEmoji, setFlagEmoji] = useState(initialData?.flag_emoji ?? "");
  const [nameEn, setNameEn] = useState(initialData?.name_en ?? "");
  const [nameAr, setNameAr] = useState(initialData?.name_ar ?? "");
  const [specialty, setSpecialty] = useState(initialData?.specialty ?? "");
  const [region, setRegion] = useState<CountryRegion | "">((initialData?.region ?? "") as CountryRegion | "");
  const [workersLabel, setWorkersLabel] = useState(initialData?.workers_label ?? "");
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /////////////////////////////////////////////////////////////////////
  ///////////// Sync state when modal opens or data changes ///////////
  /////////////////////////////////////////////////////////////////////

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setFlagEmoji(initialData?.flag_emoji ?? "");
      setNameEn(initialData?.name_en ?? "");
      setNameAr(initialData?.name_ar ?? "");
      setSpecialty(initialData?.specialty ?? "");
      setRegion((initialData?.region ?? "") as CountryRegion | "");
      setWorkersLabel(initialData?.workers_label ?? "");
      setIsActive(initialData?.is_active ?? true);
      setErrors({});
    }
  }, [isOpen, initialData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /////////////////////////////////////////////////////////////////////
  ///////////// Validation ////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (flagEmoji.length > 10) {
      newErrors.flagEmoji =
        typeof validation.flagEmojiMax === "string"
          ? validation.flagEmojiMax
          : "Flag emoji must be 10 characters or less";
    }

    if (nameEn.length > 200) {
      newErrors.nameEn =
        typeof validation.nameMax === "string"
          ? validation.nameMax
          : "Name must be 200 characters or less";
    }

    if (nameAr.length > 200) {
      newErrors.nameAr =
        typeof validation.nameMax === "string"
          ? validation.nameMax
          : "Name must be 200 characters or less";
    }

    if (specialty.length > 500) {
      newErrors.specialty =
        typeof validation.specialtyMax === "string"
          ? validation.specialtyMax
          : "Specialty must be 500 characters or less";
    }

    if (region && region !== "asia" && region !== "africa") {
      newErrors.region =
        typeof validation.invalidRegion === "string"
          ? validation.invalidRegion
          : "Region must be 'asia' or 'africa'";
    }

    if (workersLabel.length > 200) {
      newErrors.workersLabel =
        typeof validation.workersLabelMax === "string"
          ? validation.workersLabelMax
          : "Workers label must be 200 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Submit handler ////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: AdminCreateCountryPayload | AdminUpdateCountryPayload = {
      flag_emoji: flagEmoji || undefined,
      name_en: nameEn || undefined,
      name_ar: nameAr || undefined,
      specialty: specialty || undefined,
      region: (region as CountryRegion) || undefined,
      workers_label: workersLabel || undefined,
      is_active: isActive,
    };

    await onSave(payload);
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Keyboard support — Escape to close, Ctrl+Enter save //
  /////////////////////////////////////////////////////////////////////

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && !isSaving) {
      onClose();
    }
  };

  const handleInputKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  // Safe string accessors
  const formTitle = isEditMode
    ? typeof countriesSection?.editCountry === "string"
      ? countriesSection.editCountry
      : "Edit Country"
    : typeof countriesSection?.addCountry === "string"
      ? countriesSection.addCountry
      : "Add Country";
  const cancelText = editor?.popupCancel ?? "Cancel";
  const savingText = editor?.popupSaving ?? "Saving...";
  const saveText = editor?.popupSave ?? "Save";

  // Status text for toggle
  const commonSection = (adminT as Record<string, unknown>)?.common as
    | Record<string, string>
    | undefined;
  const statusActiveText =
    typeof commonSection?.statusActive === "string"
      ? commonSection.statusActive
      : "Active";
  const statusInactiveText =
    typeof commonSection?.statusInactive === "string"
      ? commonSection.statusInactive
      : "Inactive";

  const inputClasses =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none disabled:opacity-50";
  const errorInputClasses =
    "w-full rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none disabled:opacity-50";
  const errorTextClasses = "text-xs text-red-500 mt-1";
  const selectClasses =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 transition focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none disabled:opacity-50";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={formTitle}
      data-testid="country-form"
      tabIndex={0}
    >
      <div
        className="w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 truncate pr-4">
            {formTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="shrink-0 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Flag Emoji */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              {fieldLabels.flagEmoji ?? "Flag Emoji"}
            </label>
            <input
              type="text"
              value={flagEmoji}
              onChange={(e) => setFlagEmoji(e.target.value)}
              onKeyDown={handleInputKeyDown}
              maxLength={10}
              disabled={isSaving}
              placeholder={placeholders.flagEmoji ?? "e.g. 🇸🇦"}
              className={errors.flagEmoji ? errorInputClasses : inputClasses}
              dir="ltr"
              data-testid="country-form-flag-emoji"
            />
            {errors.flagEmoji && (
              <p className={errorTextClasses}>{errors.flagEmoji}</p>
            )}
          </div>

          {/* Name EN */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 uppercase leading-4">
                EN
              </span>
              <label className="text-sm font-medium text-gray-700">
                {fieldLabels.nameEn ?? "Name (English)"}
              </label>
            </div>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              onKeyDown={handleInputKeyDown}
              maxLength={200}
              disabled={isSaving}
              placeholder={placeholders.nameEn ?? "e.g. Saudi Arabia"}
              className={errors.nameEn ? errorInputClasses : inputClasses}
              dir="ltr"
              data-testid="country-form-name-en"
            />
            {errors.nameEn && (
              <p className={errorTextClasses}>{errors.nameEn}</p>
            )}
          </div>

          {/* Name AR */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 uppercase leading-4">
                AR
              </span>
              <label className="text-sm font-medium text-gray-700">
                {fieldLabels.nameAr ?? "Name (Arabic)"}
              </label>
            </div>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              onKeyDown={handleInputKeyDown}
              maxLength={200}
              disabled={isSaving}
              placeholder={placeholders.nameAr ?? "e.g. المملكة العربية السعودية"}
              className={errors.nameAr ? errorInputClasses : inputClasses}
              dir="rtl"
              data-testid="country-form-name-ar"
            />
            {errors.nameAr && (
              <p className={errorTextClasses}>{errors.nameAr}</p>
            )}
          </div>

          {/* Specialty */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              {fieldLabels.specialty ?? "Specialty"}
            </label>
            <textarea
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              onKeyDown={handleInputKeyDown}
              maxLength={500}
              disabled={isSaving}
              rows={2}
              placeholder={placeholders.specialty ?? "e.g. Commercial licensing hub"}
              className={errors.specialty ? errorInputClasses : inputClasses}
              dir="ltr"
              data-testid="country-form-specialty"
            />
            {errors.specialty && (
              <p className={errorTextClasses}>{errors.specialty}</p>
            )}
            <div className="text-xs text-gray-400 text-right">
              {specialty.length}/500
            </div>
          </div>

          {/* Region + Workers Label row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Region */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                {fieldLabels.region ?? "Region"}
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as CountryRegion | "")}
                onKeyDown={handleInputKeyDown}
                disabled={isSaving}
                className={errors.region ? errorInputClasses : selectClasses}
                dir="ltr"
                data-testid="country-form-region"
              >
                <option value="">
                  {regionOptions.none ?? "None"}
                </option>
                <option value="asia">
                  {regionOptions.asia ?? "Asia"}
                </option>
                <option value="africa">
                  {regionOptions.africa ?? "Africa"}
                </option>
              </select>
              {errors.region && (
                <p className={errorTextClasses}>{errors.region}</p>
              )}
            </div>

            {/* Workers Label */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                {fieldLabels.workersLabel ?? "Workers Label"}
              </label>
              <input
                type="text"
                value={workersLabel}
                onChange={(e) => setWorkersLabel(e.target.value)}
                onKeyDown={handleInputKeyDown}
                maxLength={200}
                disabled={isSaving}
                placeholder={placeholders.workersLabel ?? "e.g. 500+ workers"}
                className={errors.workersLabel ? errorInputClasses : inputClasses}
                dir="ltr"
                data-testid="country-form-workers-label"
              />
              {errors.workersLabel && (
                <p className={errorTextClasses}>{errors.workersLabel}</p>
              )}
            </div>
          </div>

          {/* Active toggle */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              {fieldLabels.isActive ?? "Active"}
            </label>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                disabled={isSaving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? "bg-green" : "bg-gray-300"
                }`}
                data-testid="country-form-is-active"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600">
                {isActive ? statusActiveText : statusInactiveText}
              </span>
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-deep disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {savingText}
              </>
            ) : (
              saveText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
