"use client";

import { useState, useEffect, useCallback, type KeyboardEvent } from "react";
import { FiX } from "react-icons/fi";
import type {
  AdminProcessStep,
  AdminCreateProcessStepPayload,
  AdminUpdateProcessStepPayload,
} from "@/app/types/website/admin.types";

/////////////////////////////////////////////////////////////////////
///////////// AdminProcessStepForm — create/edit modal //////////////
///////////// Bilingual fields with validation & counters ///////////
/////////////////////////////////////////////////////////////////////

interface AdminProcessStepFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: AdminCreateProcessStepPayload | AdminUpdateProcessStepPayload,
  ) => Promise<void>;
  initialData?: AdminProcessStep;
  isSaving: boolean;
}

const MAX_TITLE_LENGTH = 200;
const MAX_DESC_LENGTH = 2000;

export default function AdminProcessStepForm({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSaving,
}: AdminProcessStepFormProps) {
  const isEditMode = !!initialData;

  // Initialize form state from initialData — key prop on component resets on change
  const [stepNumber, setStepNumber] = useState(initialData?.step_number ?? 1);
  const [titleEn, setTitleEn] = useState(initialData?.title_en ?? "");
  const [titleAr, setTitleAr] = useState(initialData?.title_ar ?? "");
  const [descEn, setDescEn] = useState(initialData?.desc_en ?? "");
  const [descAr, setDescAr] = useState(initialData?.desc_ar ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  /////////////////////////////////////////////////////////////////////
  ///////////// Validate form fields //////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!stepNumber || stepNumber < 1) {
      newErrors.stepNumber = "Step number must be at least 1";
    }

    if (titleEn.length > MAX_TITLE_LENGTH) {
      newErrors.titleEn = `Title must be ${MAX_TITLE_LENGTH} characters or less`;
    }

    if (titleAr.length > MAX_TITLE_LENGTH) {
      newErrors.titleAr = `Title must be ${MAX_TITLE_LENGTH} characters or less`;
    }

    if (descEn.length > MAX_DESC_LENGTH) {
      newErrors.descEn = `Description must be ${MAX_DESC_LENGTH} characters or less`;
    }

    if (descAr.length > MAX_DESC_LENGTH) {
      newErrors.descAr = `Description must be ${MAX_DESC_LENGTH} characters or less`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [stepNumber, titleEn, titleAr, descEn, descAr]);

  /////////////////////////////////////////////////////////////////////
  ///////////// Handle save — validate then call parent /////////////
  /////////////////////////////////////////////////////////////////////

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    const payload: AdminCreateProcessStepPayload | AdminUpdateProcessStepPayload = {
      step_number: stepNumber,
      ...(titleEn && { title_en: titleEn }),
      ...(titleAr && { title_ar: titleAr }),
      ...(descEn && { desc_en: descEn }),
      ...(descAr && { desc_ar: descAr }),
    };

    await onSave(payload);
  }, [validate, stepNumber, titleEn, titleAr, descEn, descAr, onSave]);

  /////////////////////////////////////////////////////////////////////
  ///////////// Close on Escape / Ctrl+Enter to save //////////////////
  /////////////////////////////////////////////////////////////////////

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape" && !isSaving) {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    },
    [onClose, isSaving, handleSave],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Trap focus within modal ///////////////////////////////
  /////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const modal = document.getElementById("process-step-form");
      if (!modal) return;

      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  const inputClasses =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none disabled:opacity-50";
  const inputErrorClasses = inputClasses.replace(
    "border-gray-200",
    "border-red-300",
  );
  const textareaClasses = `${inputClasses} resize-y min-h-[100px]`;
  const textareaErrorClasses = textareaClasses.replace(
    "border-gray-200",
    "border-red-300",
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={isEditMode ? "Edit Process Step" : "Add Process Step"}
      data-testid="process-step-form-modal"
      tabIndex={0}
    >
      <div
        id="process-step-form"
        className="w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate pr-4">
            {isEditMode ? "Edit Process Step" : "Add Process Step"}
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

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* Step Number */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Step Number <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={stepNumber}
              onChange={(e) => setStepNumber(parseInt(e.target.value, 10) || 0)}
              disabled={isSaving}
              className={errors.stepNumber ? inputErrorClasses : inputClasses}
              dir="ltr"
              data-testid="form-step-number"
            />
            {errors.stepNumber && (
              <p className="text-xs text-red-500">{errors.stepNumber}</p>
            )}
          </div>

          {/* Title EN */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 uppercase leading-4">
                EN
              </span>
              <label className="text-sm font-medium text-gray-700">
                Title (English)
              </label>
            </div>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              maxLength={MAX_TITLE_LENGTH}
              disabled={isSaving}
              placeholder="e.g. Submit Application"
              className={errors.titleEn ? inputErrorClasses : inputClasses}
              dir="ltr"
              data-testid="form-title-en"
            />
            <div className="flex justify-between">
              {errors.titleEn && (
                <p className="text-xs text-red-500">{errors.titleEn}</p>
              )}
              <p className="text-xs text-gray-400 ml-auto">
                {titleEn.length}/{MAX_TITLE_LENGTH}
              </p>
            </div>
          </div>

          {/* Title AR */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 uppercase leading-4">
                AR
              </span>
              <label className="text-sm font-medium text-gray-700">
                Title (Arabic)
              </label>
            </div>
            <input
              type="text"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              maxLength={MAX_TITLE_LENGTH}
              disabled={isSaving}
              placeholder="مثال: تقديم الطلب"
              className={errors.titleAr ? inputErrorClasses : inputClasses}
              dir="rtl"
              data-testid="form-title-ar"
            />
            <div className="flex justify-between">
              {errors.titleAr && (
                <p className="text-xs text-red-500">{errors.titleAr}</p>
              )}
              <p className="text-xs text-gray-400 ml-auto">
                {titleAr.length}/{MAX_TITLE_LENGTH}
              </p>
            </div>
          </div>

          {/* Description EN */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 uppercase leading-4">
                EN
              </span>
              <label className="text-sm font-medium text-gray-700">
                Description (English)
              </label>
            </div>
            <textarea
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              maxLength={MAX_DESC_LENGTH}
              disabled={isSaving}
              placeholder="Describe this step..."
              rows={3}
              className={errors.descEn ? textareaErrorClasses : textareaClasses}
              dir="ltr"
              data-testid="form-desc-en"
            />
            <div className="flex justify-between">
              {errors.descEn && (
                <p className="text-xs text-red-500">{errors.descEn}</p>
              )}
              <p className="text-xs text-gray-400 ml-auto">
                {descEn.length}/{MAX_DESC_LENGTH}
              </p>
            </div>
          </div>

          {/* Description AR */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 uppercase leading-4">
                AR
              </span>
              <label className="text-sm font-medium text-gray-700">
                Description (Arabic)
              </label>
            </div>
            <textarea
              value={descAr}
              onChange={(e) => setDescAr(e.target.value)}
              maxLength={MAX_DESC_LENGTH}
              disabled={isSaving}
              placeholder="صف هذه الخطوة..."
              rows={3}
              className={errors.descAr ? textareaErrorClasses : textareaClasses}
              dir="rtl"
              data-testid="form-desc-ar"
            />
            <div className="flex justify-between">
              {errors.descAr && (
                <p className="text-xs text-red-500">{errors.descAr}</p>
              )}
              <p className="text-xs text-gray-400 ml-auto">
                {descAr.length}/{MAX_DESC_LENGTH}
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-deep disabled:opacity-50"
            data-testid="form-save-button"
          >
            {isSaving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
