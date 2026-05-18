"use client";

import React, { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { FiX } from "react-icons/fi";
import { useTranslation } from "@/app/hooks/useTranslation";
import IconPicker from "@/app/_components/IconPicker";
import { getIcon } from "@/app/helpers/getIcon";
import type {
  AdminService,
  AdminCreateServicePayload,
  AdminUpdateServicePayload,
} from "@/app/types/website/admin.types";

///////////////////////////////////////////////////////////////////////
/////////////// AdminServiceForm — modal for create/edit //////////////
///////////////////////////////////////////////////////////////////////

interface AdminServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: AdminCreateServicePayload | AdminUpdateServicePayload,
  ) => Promise<void>;
  initialData?: AdminService;
  isSaving: boolean;
}

export default function AdminServiceForm({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSaving,
}: AdminServiceFormProps) {
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
  const fieldLabels =
    (servicesSection?.fieldLabels as Record<string, string>) ?? {};
  const placeholders =
    (servicesSection?.placeholders as Record<string, string>) ?? {};
  const validation =
    (servicesSection?.validation as Record<string, string>) ?? {};

  const isEditMode = !!initialData;

  const [icon, setIcon] = useState(initialData?.icon ?? "");
  const [titleEn, setTitleEn] = useState(initialData?.title_en ?? "");
  const [titleAr, setTitleAr] = useState(initialData?.title_ar ?? "");
  const [descEn, setDescEn] = useState(initialData?.desc_en ?? "");
  const [descAr, setDescAr] = useState(initialData?.desc_ar ?? "");
  const [buttonLabelEn, setButtonLabelEn] = useState(
    initialData?.button_label_en ?? "",
  );
  const [buttonLabelAr, setButtonLabelAr] = useState(
    initialData?.button_label_ar ?? "",
  );
  const [metricValue, setMetricValue] = useState(
    initialData?.metric_value ?? "",
  );
  const [metricSuffix, setMetricSuffix] = useState(
    initialData?.metric_suffix ?? "",
  );
  const [metricLabelEn, setMetricLabelEn] = useState(
    initialData?.metric_label_en ?? "",
  );
  const [metricLabelAr, setMetricLabelAr] = useState(
    initialData?.metric_label_ar ?? "",
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  ///////////////////////////////////////////////////////////////////////
  ///////////// IconPicker state ////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////

  const [showIconPicker, setShowIconPicker] = useState(false);

  ///////////////////////////////////////////////////////////////////////
  ///////////// Focus management — track opener, restore on close ///////
  ///////////////////////////////////////////////////////////////////////

  const openButtonRef = useRef<HTMLButtonElement | null>(null);
  const firstInputRef = useRef<HTMLButtonElement | null>(null);

  // Track what was focused before modal opened, focus first input on mount
  useEffect(() => {
    if (isOpen) {
      openButtonRef.current = document.activeElement as HTMLButtonElement;
      // Focus the icon picker button (first interactive element)
      firstInputRef.current?.focus();
    }
  }, [isOpen]);

  // Return focus to opener when modal closes
  useEffect(() => {
    if (!isOpen && openButtonRef.current) {
      openButtonRef.current.focus();
    }
  }, [isOpen]);

  ///////////////////////////////////////////////////////////////////////
  ///////////// Sync state when modal opens or data changes /////////////
  ///////////////////////////////////////////////////////////////////////

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setIcon(initialData?.icon ?? "");
      setTitleEn(initialData?.title_en ?? "");
      setTitleAr(initialData?.title_ar ?? "");
      setDescEn(initialData?.desc_en ?? "");
      setDescAr(initialData?.desc_ar ?? "");
      setButtonLabelEn(initialData?.button_label_en ?? "");
      setButtonLabelAr(initialData?.button_label_ar ?? "");
      setMetricValue(initialData?.metric_value ?? "");
      setMetricSuffix(initialData?.metric_suffix ?? "");
      setMetricLabelEn(initialData?.metric_label_en ?? "");
      setMetricLabelAr(initialData?.metric_label_ar ?? "");
      setIsActive(initialData?.is_active ?? true);
      setErrors({});
    }
  }, [isOpen, initialData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  ///////////////////////////////////////////////////////////////////////
  ///////////// Validation //////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (icon.length > 100) {
      newErrors.icon =
        typeof validation.iconMax === "string"
          ? validation.iconMax
          : "Icon must be 100 characters or less";
    }

    if (titleEn.length > 200) {
      newErrors.titleEn =
        typeof validation.titleMax === "string"
          ? validation.titleMax
          : "Title must be 200 characters or less";
    }

    if (titleAr.length > 200) {
      newErrors.titleAr =
        typeof validation.titleMax === "string"
          ? validation.titleMax
          : "Title must be 200 characters or less";
    }

    if (descEn.length > 2000) {
      newErrors.descEn =
        typeof validation.descMax === "string"
          ? validation.descMax
          : "Description must be 2000 characters or less";
    }

    if (descAr.length > 2000) {
      newErrors.descAr =
        typeof validation.descMax === "string"
          ? validation.descMax
          : "Description must be 2000 characters or less";
    }

    if (buttonLabelEn.length > 100) {
      newErrors.buttonLabelEn =
        typeof validation.buttonLabelMax === "string"
          ? validation.buttonLabelMax
          : "Button label must be 100 characters or less";
    }

    if (buttonLabelAr.length > 100) {
      newErrors.buttonLabelAr =
        typeof validation.buttonLabelMax === "string"
          ? validation.buttonLabelMax
          : "Button label must be 100 characters or less";
    }

    if (metricValue.length > 100) {
      newErrors.metricValue =
        typeof validation.metricValueMax === "string"
          ? validation.metricValueMax
          : "Metric value must be 100 characters or less";
    }

    if (metricSuffix.length > 20) {
      newErrors.metricSuffix =
        typeof validation.metricSuffixMax === "string"
          ? validation.metricSuffixMax
          : "Metric suffix must be 20 characters or less";
    }

    if (metricLabelEn.length > 200) {
      newErrors.metricLabelEn =
        typeof validation.metricLabelMax === "string"
          ? validation.metricLabelMax
          : "Metric label must be 200 characters or less";
    }

    if (metricLabelAr.length > 200) {
      newErrors.metricLabelAr =
        typeof validation.metricLabelMax === "string"
          ? validation.metricLabelMax
          : "Metric label must be 200 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  ///////////////////////////////////////////////////////////////////////
  ///////////// Submit handler //////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: AdminCreateServicePayload | AdminUpdateServicePayload = {
      icon: icon || undefined,
      title_en: titleEn || undefined,
      title_ar: titleAr || undefined,
      desc_en: descEn || undefined,
      desc_ar: descAr || undefined,
      button_label_en: buttonLabelEn || undefined,
      button_label_ar: buttonLabelAr || undefined,
      metric_value: metricValue || undefined,
      metric_suffix: metricSuffix || undefined,
      metric_label_en: metricLabelEn || undefined,
      metric_label_ar: metricLabelAr || undefined,
      is_active: isActive,
    };

    await onSave(payload);
  };

  ///////////////////////////////////////////////////////////////////////
  ///////////// Keyboard support — Escape to close, Ctrl+Enter save ///
  ///////////////////////////////////////////////////////////////////////

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && !isSaving) {
      onClose();
    }
  };

  const handleInputKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  // Safe string accessors
  const formTitle = isEditMode
    ? typeof servicesSection?.editService === "string"
      ? servicesSection.editService
      : "Edit Service"
    : typeof servicesSection?.addService === "string"
      ? servicesSection.addService
      : "Add Service";
  const cancelText = editor?.popupCancel ?? "Cancel";
  const savingText = editor?.popupSaving ?? "Saving...";
  const saveText = editor?.popupSave ?? "Save";

  const inputClasses =
    "w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-charcoal transition placeholder:text-muted/70 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none disabled:opacity-50";
  const errorInputClasses =
    "w-full rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 transition placeholder:text-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none disabled:opacity-50";
  const errorTextClasses = "text-xs text-red-500 mt-1";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={formTitle}
      data-testid="service-form"
      tabIndex={0}
    >
      <div
        className="w-full max-w-2xl mx-4 bg-surface rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-lg font-semibold text-charcoal truncate pr-4">
            {formTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="shrink-0 rounded-full p-1.5 text-muted/70 transition hover:bg-gray-100 hover:text-muted focus:outline-none focus:ring-2 focus:ring-gold/40"
            aria-label={
              typeof servicesSection?.picker === "object" &&
              servicesSection.picker !== null &&
              "close" in servicesSection.picker
                ? (servicesSection.picker as Record<string, string>).close
                : "Close"
            }
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Icon — visual picker button */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-charcoal/80">
              {fieldLabels.icon ?? "Icon"}
            </label>
            <button
              type="button"
              onClick={() => setShowIconPicker(true)}
              disabled={isSaving}
              className="flex items-center gap-3 w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:opacity-50"
              data-testid="service-form-icon"
              ref={firstInputRef}
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
                  {placeholders.icon ?? "Choose an icon..."}
                </span>
              )}
            </button>
            {errors.icon && <p className={errorTextClasses}>{errors.icon}</p>}
          </div>

          <IconPicker
            value={icon}
            onChange={(iconName: string) => {
              setIcon(iconName);
              setShowIconPicker(false);
            }}
            open={showIconPicker}
            onOpenChange={setShowIconPicker}
          />

          {/* Title EN */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 uppercase leading-4">
                EN
              </span>
              <label className="text-sm font-medium text-charcoal/80">
                {fieldLabels.titleEn ?? "Title (English)"}
              </label>
            </div>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              onKeyDown={handleInputKeyDown}
              maxLength={200}
              disabled={isSaving}
              placeholder={placeholders.titleEn ?? "e.g. Commercial Licensing"}
              className={errors.titleEn ? errorInputClasses : inputClasses}
              dir="ltr"
              data-testid="service-form-title-en"
            />
            {errors.titleEn && (
              <p className={errorTextClasses}>{errors.titleEn}</p>
            )}
          </div>

          {/* Title AR */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 uppercase leading-4">
                AR
              </span>
              <label className="text-sm font-medium text-charcoal/80">
                {fieldLabels.titleAr ?? "Title (Arabic)"}
              </label>
            </div>
            <input
              type="text"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              onKeyDown={handleInputKeyDown}
              maxLength={200}
              disabled={isSaving}
              placeholder={placeholders.titleAr ?? "e.g. الترخيص التجاري"}
              className={errors.titleAr ? errorInputClasses : inputClasses}
              dir="rtl"
              data-testid="service-form-title-ar"
            />
            {errors.titleAr && (
              <p className={errorTextClasses}>{errors.titleAr}</p>
            )}
          </div>

          {/* Description EN */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 uppercase leading-4">
                EN
              </span>
              <label className="text-sm font-medium text-charcoal/80">
                {fieldLabels.descEn ?? "Description (English)"}
              </label>
              <span className="ml-auto text-xs text-muted/70">
                {descEn.length}/2000
              </span>
            </div>
            <textarea
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              onKeyDown={handleInputKeyDown}
              maxLength={2000}
              disabled={isSaving}
              rows={3}
              placeholder={
                placeholders.descEn ?? "Describe this service..."
              }
              className={errors.descEn ? errorInputClasses : inputClasses}
              dir="ltr"
              data-testid="service-form-desc-en"
            />
            {errors.descEn && (
              <p className={errorTextClasses}>{errors.descEn}</p>
            )}
          </div>

          {/* Description AR */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 uppercase leading-4">
                AR
              </span>
              <label className="text-sm font-medium text-charcoal/80">
                {fieldLabels.descAr ?? "Description (Arabic)"}
              </label>
              <span className="ml-auto text-xs text-muted/70">
                {descAr.length}/2000
              </span>
            </div>
            <textarea
              value={descAr}
              onChange={(e) => setDescAr(e.target.value)}
              onKeyDown={handleInputKeyDown}
              maxLength={2000}
              disabled={isSaving}
              rows={3}
              placeholder={placeholders.descAr ?? "صف هذه الخدمة..."}
              className={errors.descAr ? errorInputClasses : inputClasses}
              dir="rtl"
              data-testid="service-form-desc-ar"
            />
            {errors.descAr && (
              <p className={errorTextClasses}>{errors.descAr}</p>
            )}
          </div>

          {/* Button Label EN */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 uppercase leading-4">
                EN
              </span>
              <label className="text-sm font-medium text-charcoal/80">
                {fieldLabels.buttonLabelEn ?? "Button Label (English)"}
              </label>
            </div>
            <input
              type="text"
              value={buttonLabelEn}
              onChange={(e) => setButtonLabelEn(e.target.value)}
              onKeyDown={handleInputKeyDown}
              maxLength={100}
              disabled={isSaving}
              placeholder={placeholders.buttonLabelEn ?? "e.g. Learn More"}
              className={
                errors.buttonLabelEn ? errorInputClasses : inputClasses
              }
              dir="ltr"
              data-testid="service-form-button-label-en"
            />
            {errors.buttonLabelEn && (
              <p className={errorTextClasses}>{errors.buttonLabelEn}</p>
            )}
          </div>

          {/* Button Label AR */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 uppercase leading-4">
                AR
              </span>
              <label className="text-sm font-medium text-charcoal/80">
                {fieldLabels.buttonLabelAr ?? "Button Label (Arabic)"}
              </label>
            </div>
            <input
              type="text"
              value={buttonLabelAr}
              onChange={(e) => setButtonLabelAr(e.target.value)}
              onKeyDown={handleInputKeyDown}
              maxLength={100}
              disabled={isSaving}
              placeholder={placeholders.buttonLabelAr ?? "e.g. اعرف المزيد"}
              className={
                errors.buttonLabelAr ? errorInputClasses : inputClasses
              }
              dir="rtl"
              data-testid="service-form-button-label-ar"
            />
            {errors.buttonLabelAr && (
              <p className={errorTextClasses}>{errors.buttonLabelAr}</p>
            )}
          </div>

          {/* Metric fields row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric Value */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-charcoal/80">
                {fieldLabels.metricValue ?? "Metric Value"}
              </label>
              <input
                type="text"
                value={metricValue}
                onChange={(e) => setMetricValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                maxLength={100}
                disabled={isSaving}
                placeholder={placeholders.metricValue ?? "e.g. 500"}
                className={
                  errors.metricValue ? errorInputClasses : inputClasses
                }
                dir="ltr"
                data-testid="service-form-metric-value"
              />
              {errors.metricValue && (
                <p className={errorTextClasses}>{errors.metricValue}</p>
              )}
            </div>

            {/* Metric Suffix */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-charcoal/80">
                {fieldLabels.metricSuffix ?? "Metric Suffix"}
              </label>
              <input
                type="text"
                value={metricSuffix}
                onChange={(e) => setMetricSuffix(e.target.value)}
                onKeyDown={handleInputKeyDown}
                maxLength={20}
                disabled={isSaving}
                placeholder={placeholders.metricSuffix ?? "e.g. +"}
                className={
                  errors.metricSuffix ? errorInputClasses : inputClasses
                }
                dir="ltr"
                data-testid="service-form-metric-suffix"
              />
              {errors.metricSuffix && (
                <p className={errorTextClasses}>{errors.metricSuffix}</p>
              )}
            </div>

            {/* Active toggle */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-charcoal/80">
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
                  data-testid="service-form-is-active"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm text-muted">
                  {isActive
                    ? (common?.statusActive ?? "Active")
                    : (common?.statusInactive ?? "Inactive")}
                </span>
              </div>
            </div>
          </div>

          {/* Metric Label EN */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 uppercase leading-4">
                EN
              </span>
              <label className="text-sm font-medium text-charcoal/80">
                {fieldLabels.metricLabelEn ?? "Metric Label (English)"}
              </label>
            </div>
            <input
              type="text"
              value={metricLabelEn}
              onChange={(e) => setMetricLabelEn(e.target.value)}
              onKeyDown={handleInputKeyDown}
              maxLength={200}
              disabled={isSaving}
              placeholder={
                placeholders.metricLabelEn ?? "e.g. Projects Completed"
              }
              className={
                errors.metricLabelEn ? errorInputClasses : inputClasses
              }
              dir="ltr"
              data-testid="service-form-metric-label-en"
            />
            {errors.metricLabelEn && (
              <p className={errorTextClasses}>{errors.metricLabelEn}</p>
            )}
          </div>

          {/* Metric Label AR */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 uppercase leading-4">
                AR
              </span>
              <label className="text-sm font-medium text-charcoal/80">
                {fieldLabels.metricLabelAr ?? "Metric Label (Arabic)"}
              </label>
            </div>
            <input
              type="text"
              value={metricLabelAr}
              onChange={(e) => setMetricLabelAr(e.target.value)}
              onKeyDown={handleInputKeyDown}
              maxLength={200}
              disabled={isSaving}
              placeholder={
                placeholders.metricLabelAr ?? "e.g. مشروع مكتمل"
              }
              className={
                errors.metricLabelAr ? errorInputClasses : inputClasses
              }
              dir="rtl"
              data-testid="service-form-metric-label-ar"
            />
            {errors.metricLabelAr && (
              <p className={errorTextClasses}>{errors.metricLabelAr}</p>
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-bg/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-muted transition hover:bg-gray-100 disabled:opacity-50"
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
