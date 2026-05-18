"use client";

import { useState, useEffect, type KeyboardEvent } from "react";
import { FiX } from "react-icons/fi";
import { useTranslation } from "@/app/hooks/useTranslation";
import type {
  AdminStatItem,
  AdminCreateStatItemPayload,
  AdminUpdateStatItemPayload,
} from "@/app/types/website/admin.types";

///////////////////////////////////////////////////////////////////////
/////////////// AdminStatItemForm — modal for create/edit /////////////
///////////////////////////////////////////////////////////////////////

interface AdminStatItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: AdminCreateStatItemPayload | AdminUpdateStatItemPayload,
  ) => Promise<void>;
  initialData?: AdminStatItem;
  isSaving: boolean;
}

export default function AdminStatItemForm({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSaving,
}: AdminStatItemFormProps) {
  const adminT = useTranslation("admin");
  const statsSection = (adminT as Record<string, unknown>)?.statsSection as
    | Record<string, unknown>
    | undefined;
  const editor = (adminT as Record<string, unknown>)?.editor as
    | Record<string, string>
    | undefined;
  const fieldLabels = (statsSection?.fieldLabels as Record<string, string>) ?? {};
  const toasts = (statsSection?.toasts as Record<string, string>) ?? {};

  const isEditMode = !!initialData;

  const [icon, setIcon] = useState(initialData?.icon ?? "");
  const [target, setTarget] = useState(
    initialData?.target?.toString() ?? "",
  );
  const [suffix, setSuffix] = useState(initialData?.suffix ?? "");
  const [labelEn, setLabelEn] = useState(initialData?.label_en ?? "");
  const [labelAr, setLabelAr] = useState(initialData?.label_ar ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  /////////////////////////////////////////////////////////////////////
  ///////////// Sync state when modal opens or data changes ///////////
  /////////////////////////////////////////////////////////////////////

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setIcon(initialData?.icon ?? "");
      setTarget(initialData?.target?.toString() ?? "");
      setSuffix(initialData?.suffix ?? "");
      setLabelEn(initialData?.label_en ?? "");
      setLabelAr(initialData?.label_ar ?? "");
      setErrors({});
    }
  }, [isOpen, initialData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /////////////////////////////////////////////////////////////////////
  ///////////// Validation ////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (icon.length > 100) {
      newErrors.icon = "Icon must be 100 characters or less";
    }

    if (target && (isNaN(Number(target)) || Number(target) < 0)) {
      newErrors.target = "Target must be a positive number";
    }

    if (suffix.length > 20) {
      newErrors.suffix = "Suffix must be 20 characters or less";
    }

    if (labelEn.length > 200) {
      newErrors.labelEn = "Label (English) must be 200 characters or less";
    }

    if (labelAr.length > 200) {
      newErrors.labelAr = "Label (Arabic) must be 200 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Submit handler ////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: AdminCreateStatItemPayload | AdminUpdateStatItemPayload = {
      icon: icon || undefined,
      target: target ? parseInt(target, 10) : undefined,
      suffix: suffix || undefined,
      label_en: labelEn || undefined,
      label_ar: labelAr || undefined,
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
    e: KeyboardEvent<HTMLInputElement>,
  ) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  // Safe string accessors
  const formTitle = isEditMode
    ? typeof statsSection?.editItem === "string"
      ? statsSection.editItem
      : "Edit Stat Item"
    : typeof statsSection?.addItem === "string"
      ? statsSection.addItem
      : "Add Stat Item";
  const iconLabel = fieldLabels.icon ?? "Icon";
  const targetLabel = fieldLabels.target ?? "Target Number";
  const suffixLabel = fieldLabels.suffix ?? "Suffix";
  const labelEnLabel = fieldLabels.labelEn ?? "Label (English)";
  const labelArLabel = fieldLabels.labelAr ?? "Label (Arabic)";
  const cancelText = editor?.popupCancel ?? "Cancel";
  const savingText = editor?.popupSaving ?? "Saving...";
  const saveText = editor?.popupSave ?? "Save";

  const inputClasses =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none disabled:opacity-50";
  const errorInputClasses =
    "w-full rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none disabled:opacity-50";
  const errorTextClasses = "text-xs text-red-500 mt-1";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={formTitle}
      data-testid="stat-item-form"
      tabIndex={0}
    >
      <div
        className="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
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
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Icon */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              {iconLabel}
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              onKeyDown={handleInputKeyDown}
              maxLength={100}
              disabled={isSaving}
              placeholder="FiUsers"
              className={errors.icon ? errorInputClasses : inputClasses}
              dir="ltr"
              data-testid="stat-form-icon"
            />
            {errors.icon && (
              <p className={errorTextClasses}>{errors.icon}</p>
            )}
          </div>

          {/* Target */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              {targetLabel}
            </label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyDown={handleInputKeyDown}
              min={0}
              disabled={isSaving}
              placeholder="10000"
              className={errors.target ? errorInputClasses : inputClasses}
              dir="ltr"
              data-testid="stat-form-target"
            />
            {errors.target && (
              <p className={errorTextClasses}>{errors.target}</p>
            )}
          </div>

          {/* Suffix */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              {suffixLabel}
            </label>
            <input
              type="text"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              onKeyDown={handleInputKeyDown}
              maxLength={20}
              disabled={isSaving}
              placeholder="+"
              className={errors.suffix ? errorInputClasses : inputClasses}
              dir="ltr"
              data-testid="stat-form-suffix"
            />
            {errors.suffix && (
              <p className={errorTextClasses}>{errors.suffix}</p>
            )}
          </div>

          {/* Label EN */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 uppercase leading-4">
                EN
              </span>
              <label className="text-sm font-medium text-gray-700">
                {labelEnLabel}
              </label>
            </div>
            <input
              type="text"
              value={labelEn}
              onChange={(e) => setLabelEn(e.target.value)}
              onKeyDown={handleInputKeyDown}
              maxLength={200}
              disabled={isSaving}
              placeholder="Workers Recruited"
              className={errors.labelEn ? errorInputClasses : inputClasses}
              dir="ltr"
              data-testid="stat-form-label-en"
            />
            {errors.labelEn && (
              <p className={errorTextClasses}>{errors.labelEn}</p>
            )}
          </div>

          {/* Label AR */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 uppercase leading-4">
                AR
              </span>
              <label className="text-sm font-medium text-gray-700">
                {labelArLabel}
              </label>
            </div>
            <input
              type="text"
              value={labelAr}
              onChange={(e) => setLabelAr(e.target.value)}
              onKeyDown={handleInputKeyDown}
              maxLength={200}
              disabled={isSaving}
              placeholder="عامل تم استقدامهم"
              className={errors.labelAr ? errorInputClasses : inputClasses}
              dir="rtl"
              data-testid="stat-form-label-ar"
            />
            {errors.labelAr && (
              <p className={errorTextClasses}>{errors.labelAr}</p>
            )}
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
