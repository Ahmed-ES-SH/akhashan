"use client";

import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from "react";
import { FiX } from "react-icons/fi";
import React from "react";
import IconPicker from "@/app/_components/IconPicker";
import { getIcon } from "@/app/helpers/getIcon";
import type {
  AdminLicensingItem,
  AdminCreateLicensingItemPayload,
  AdminUpdateLicensingItemPayload,
} from "@/app/types/website/admin.types";

///////////////////////////////////////////////////////////////////////
///////////// AdminLicensingItemForm — create/edit modal //////////////
///////////// Bilingual fields with validation & counters /////////////
///////////////////////////////////////////////////////////////////////

interface AdminLicensingItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: AdminCreateLicensingItemPayload | AdminUpdateLicensingItemPayload,
  ) => Promise<void>;
  initialData?: AdminLicensingItem;
  isSaving: boolean;
}

// Validation limits
const MAX_ICON = 100;
const MAX_TITLE = 200;
const MAX_DESC = 2000;
const MAX_TAG = 100;

export default function AdminLicensingItemForm({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSaving,
}: AdminLicensingItemFormProps) {
  const isEditMode = !!initialData;

  const [formData, setFormData] = useState({
    icon: initialData?.icon ?? "",
    titleEn: initialData?.title_en ?? "",
    titleAr: initialData?.title_ar ?? "",
    descEn: initialData?.desc_en ?? "",
    descAr: initialData?.desc_ar ?? "",
    tagEn: initialData?.tag_en ?? "",
    tagAr: initialData?.tag_ar ?? "",
  });

  const [showIconPicker, setShowIconPicker] = useState(false);

  // Field-level validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const titleEnRef = useRef<HTMLInputElement>(null);

  // Destructure for convenience
  const { icon, titleEn, titleAr, descEn, descAr, tagEn, tagAr } = formData;

  /////////////////////////////////////////////////////////////////////
  ///////////// Focus title EN input when modal opens /////////////////
  /////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (isOpen && titleEnRef.current) {
      requestAnimationFrame(() => {
        titleEnRef.current?.focus();
      });
    }
  }, [isOpen]);

  /////////////////////////////////////////////////////////////////////
  ///////////// Close on Escape ///////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape" && !isSaving) {
        onClose();
      }
    },
    [onClose, isSaving],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Validate all fields ///////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (icon.length > MAX_ICON) {
      newErrors.icon = `Icon must be ${MAX_ICON} characters or less`;
    }
    if (titleEn.length > MAX_TITLE) {
      newErrors.titleEn = `Title (English) must be ${MAX_TITLE} characters or less`;
    }
    if (titleAr.length > MAX_TITLE) {
      newErrors.titleAr = `Title (Arabic) must be ${MAX_TITLE} characters or less`;
    }
    if (descEn.length > MAX_DESC) {
      newErrors.descEn = `Description (English) must be ${MAX_DESC} characters or less`;
    }
    if (descAr.length > MAX_DESC) {
      newErrors.descAr = `Description (Arabic) must be ${MAX_DESC} characters or less`;
    }
    if (tagEn.length > MAX_TAG) {
      newErrors.tagEn = `Tag (English) must be ${MAX_TAG} characters or less`;
    }
    if (tagAr.length > MAX_TAG) {
      newErrors.tagAr = `Tag (Arabic) must be ${MAX_TAG} characters or less`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Submit handler ////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleSubmit = async () => {
    setErrors({});
    if (!validate()) return;

    const payload: AdminCreateLicensingItemPayload | AdminUpdateLicensingItemPayload =
      {
        icon: icon || undefined,
        title_en: titleEn || undefined,
        title_ar: titleAr || undefined,
        desc_en: descEn || undefined,
        desc_ar: descAr || undefined,
        tag_en: tagEn || undefined,
        tag_ar: tagAr || undefined,
      };

    await onSave(payload);
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Input key handler — Ctrl+Enter to save ////////////////
  /////////////////////////////////////////////////////////////////////

  const handleInputKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none disabled:opacity-50";
  const inputErrorClass = inputClass.replace("border-gray-200", "border-red-400");
  const textareaClass = `${inputClass} resize-y min-h-[100px]`;
  const textareaErrorClass = textareaClass.replace(
    "border-gray-200",
    "border-red-400",
  );
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const errorClass = "mt-1 text-xs text-red-500";
  const counterClass = "mt-1 text-xs text-gray-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={isEditMode ? "Edit Licensing Item" : "Add Licensing Item"}
      data-testid="licensing-item-form-modal"
    >
      <div
        className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditMode ? "Edit Licensing Item" : "Add Licensing Item"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="shrink-0 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────── */}
        <div className="space-y-5 px-6 py-5">
          {/* Icon — visual picker button */}
          <div className="space-y-1.5">
            <label className={labelClass}>Icon</label>
            <button
              type="button"
              onClick={() => setShowIconPicker(true)}
              disabled={isSaving}
              className="flex items-center gap-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:opacity-50"
              data-testid="licensing-form-icon"
            >
              {icon ? (
                <>
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                    {React.createElement(getIcon(icon), {
                      className: "w-5 h-5 text-gold",
                    })}
                  </div>
                  <span className="text-charcoal font-mono text-xs">
                    {icon}
                  </span>
                </>
              ) : (
                <span className="text-muted/70">
                  Choose an icon...
                </span>
              )}
            </button>
            {errors.icon && <span className={errorClass}>{errors.icon}</span>}
          </div>

          <IconPicker
            value={icon}
            onChange={(iconName: string) => {
              setFormData((prev) => ({ ...prev, icon: iconName }));
              setShowIconPicker(false);
            }}
            open={showIconPicker}
            onOpenChange={setShowIconPicker}
          />

          {/* Title EN / AR */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelClass}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-blue-700">
                    EN
                  </span>
                  Title (English)
                </span>
              </label>
              <input
                ref={titleEnRef}
                type="text"
                value={titleEn}
                onChange={(e) => setFormData((prev) => ({ ...prev, titleEn: e.target.value }))}
                onKeyDown={handleInputKeyDown}
                maxLength={MAX_TITLE}
                disabled={isSaving}
                placeholder="e.g. Commercial License"
                className={errors.titleEn ? inputErrorClass : inputClass}
                dir="ltr"
                data-testid="licensing-form-title-en"
              />
              <div className="flex justify-between">
                {errors.titleEn ? (
                  <span className={errorClass}>{errors.titleEn}</span>
                ) : (
                  <span />
                )}
                <span className={counterClass}>
                  {titleEn.length}/{MAX_TITLE}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-emerald-700">
                    AR
                  </span>
                  Title (Arabic)
                </span>
              </label>
              <input
                type="text"
                value={titleAr}
                onChange={(e) => setFormData((prev) => ({ ...prev, titleAr: e.target.value }))}
                onKeyDown={handleInputKeyDown}
                maxLength={MAX_TITLE}
                disabled={isSaving}
                placeholder="e.g. ترخيص تجاري"
                className={errors.titleAr ? inputErrorClass : inputClass}
                dir="rtl"
                data-testid="licensing-form-title-ar"
              />
              <div className="flex justify-between">
                {errors.titleAr ? (
                  <span className={errorClass}>{errors.titleAr}</span>
                ) : (
                  <span />
                )}
                <span className={counterClass}>
                  {titleAr.length}/{MAX_TITLE}
                </span>
              </div>
            </div>
          </div>

          {/* Description EN / AR */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelClass}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-blue-700">
                    EN
                  </span>
                  Description (English)
                </span>
              </label>
              <textarea
                value={descEn}
                onChange={(e) => setFormData((prev) => ({ ...prev, descEn: e.target.value }))}
                onKeyDown={handleInputKeyDown}
                maxLength={MAX_DESC}
                disabled={isSaving}
                placeholder="Describe this licensing service..."
                rows={4}
                className={errors.descEn ? textareaErrorClass : textareaClass}
                dir="ltr"
                data-testid="licensing-form-desc-en"
              />
              <div className="flex justify-between">
                {errors.descEn ? (
                  <span className={errorClass}>{errors.descEn}</span>
                ) : (
                  <span />
                )}
                <span className={counterClass}>
                  {descEn.length}/{MAX_DESC}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-emerald-700">
                    AR
                  </span>
                  Description (Arabic)
                </span>
              </label>
              <textarea
                value={descAr}
                onChange={(e) => setFormData((prev) => ({ ...prev, descAr: e.target.value }))}
                onKeyDown={handleInputKeyDown}
                maxLength={MAX_DESC}
                disabled={isSaving}
                placeholder="صف خدمة الترخيص هذه..."
                rows={4}
                className={errors.descAr ? textareaErrorClass : textareaClass}
                dir="rtl"
                data-testid="licensing-form-desc-ar"
              />
              <div className="flex justify-between">
                {errors.descAr ? (
                  <span className={errorClass}>{errors.descAr}</span>
                ) : (
                  <span />
                )}
                <span className={counterClass}>
                  {descAr.length}/{MAX_DESC}
                </span>
              </div>
            </div>
          </div>

          {/* Tag EN / AR (optional) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelClass}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-blue-700">
                    EN
                  </span>
                  Tag (English) — optional
                </span>
              </label>
              <input
                type="text"
                value={tagEn}
                onChange={(e) => setFormData((prev) => ({ ...prev, tagEn: e.target.value }))}
                onKeyDown={handleInputKeyDown}
                maxLength={MAX_TAG}
                disabled={isSaving}
                placeholder="e.g. Popular"
                className={errors.tagEn ? inputErrorClass : inputClass}
                dir="ltr"
                data-testid="licensing-form-tag-en"
              />
              <div className="flex justify-between">
                {errors.tagEn ? (
                  <span className={errorClass}>{errors.tagEn}</span>
                ) : (
                  <span />
                )}
                <span className={counterClass}>
                  {tagEn.length}/{MAX_TAG}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-emerald-700">
                    AR
                  </span>
                  Tag (Arabic) — optional
                </span>
              </label>
              <input
                type="text"
                value={tagAr}
                onChange={(e) => setFormData((prev) => ({ ...prev, tagAr: e.target.value }))}
                onKeyDown={handleInputKeyDown}
                maxLength={MAX_TAG}
                disabled={isSaving}
                placeholder="e.g. شائع"
                className={errors.tagAr ? inputErrorClass : inputClass}
                dir="rtl"
                data-testid="licensing-form-tag-ar"
              />
              <div className="flex justify-between">
                {errors.tagAr ? (
                  <span className={errorClass}>{errors.tagAr}</span>
                ) : (
                  <span />
                )}
                <span className={counterClass}>
                  {tagAr.length}/{MAX_TAG}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            data-testid="licensing-form-cancel"
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            data-testid="licensing-item-form-save"
            className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-deep disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </>
            ) : isEditMode ? (
              "Update Item"
            ) : (
              "Create Item"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
