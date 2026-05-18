"use client";

import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from "react";
import { FiX } from "react-icons/fi";

///////////////////////////////////////////////////////////////////////
/////////////// InlineEditPopup — global reusable edit popup //////////
/////////////// Shows EN/AR side by side for bilingual editing ///////
///////////////////////////////////////////////////////////////////////

interface InlineEditPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (valueEn: string, valueAr: string) => Promise<void>;
  currentValueEn: string;
  currentValueAr: string;
  label: string;
  fieldType?: "text" | "textarea" | "number";
  maxLength?: number;
  isSaving?: boolean;
  singleField?: boolean;
}

export default function InlineEditPopup({
  isOpen,
  onClose,
  onSave,
  currentValueEn,
  currentValueAr,
  label,
  fieldType = "text",
  maxLength,
  isSaving = false,
  singleField = false,
}: InlineEditPopupProps) {
  const [valueEn, setValueEn] = useState(currentValueEn);
  const [valueAr, setValueAr] = useState(currentValueAr);
  const enRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  /////////////////////////////////////////////////////////////////////
  ///////////// Sync state when popup opens or values change //////////
  /////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (isOpen) {
      setValueEn(currentValueEn);
      setValueAr(currentValueAr);
    }
  }, [isOpen, currentValueEn, currentValueAr]);

  /////////////////////////////////////////////////////////////////////
  ///////////// Focus EN input when popup opens ///////////////////////
  /////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (isOpen && enRef.current) {
      requestAnimationFrame(() => {
        enRef.current?.focus();
        if (enRef.current instanceof HTMLInputElement) {
          enRef.current.select();
        }
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
  ///////////// Submit handler — supports Ctrl+Enter //////////////////
  /////////////////////////////////////////////////////////////////////

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onSave(valueEn, valueAr);
      }
    },
    [onSave, valueEn, valueAr],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Trap focus within the modal ///////////////////////////
  /////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const modal = document.getElementById("inline-edit-popup");
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
  const textareaClasses = `${inputClasses} resize-y min-h-[100px]`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      data-testid="inline-edit-popup"
    >
      <div
        id="inline-edit-popup"
        className="w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 truncate pr-4">
            {label}
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

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-5">
          {singleField ? (
            /* ── Single Field (e.g. WhatsApp Number) ──────────────── */
            <div className="space-y-1.5">
              {fieldType === "textarea" ? (
                <textarea
                  ref={enRef as React.RefObject<HTMLTextAreaElement>}
                  value={valueEn}
                  onChange={(e) => setValueEn(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  maxLength={maxLength}
                  disabled={isSaving}
                  rows={4}
                  className={textareaClasses}
                  dir="ltr"
                />
              ) : fieldType === "number" ? (
                <input
                  ref={enRef as React.RefObject<HTMLInputElement>}
                  type="number"
                  value={valueEn}
                  onChange={(e) => setValueEn(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  disabled={isSaving}
                  className={inputClasses}
                  dir="ltr"
                />
              ) : (
                <input
                  ref={enRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={valueEn}
                  onChange={(e) => setValueEn(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  maxLength={maxLength}
                  disabled={isSaving}
                  className={inputClasses}
                  dir="ltr"
                />
              )}
            </div>
          ) : (
            /* ── Two Language Inputs ──────────────────────────────── */
            <>
              {/* English */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 uppercase leading-4">
                    EN
                  </span>
                  <span className="text-xs text-gray-400">English</span>
                </div>
                {fieldType === "textarea" ? (
                  <textarea
                    ref={enRef as React.RefObject<HTMLTextAreaElement>}
                    value={valueEn}
                    onChange={(e) => setValueEn(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    maxLength={maxLength}
                    disabled={isSaving}
                    rows={4}
                    className={textareaClasses}
                    dir="ltr"
                  />
                ) : fieldType === "number" ? (
                  <input
                    ref={enRef as React.RefObject<HTMLInputElement>}
                    type="number"
                    value={valueEn}
                    onChange={(e) => setValueEn(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    disabled={isSaving}
                    className={inputClasses}
                    dir="ltr"
                  />
                ) : (
                  <input
                    ref={enRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={valueEn}
                    onChange={(e) => setValueEn(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    maxLength={maxLength}
                    disabled={isSaving}
                    className={inputClasses}
                    dir="ltr"
                  />
                )}
              </div>

              {/* Arabic */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 uppercase leading-4">
                    AR
                  </span>
                  <span className="text-xs text-gray-400">العربية</span>
                </div>
                {fieldType === "textarea" ? (
                  <textarea
                    value={valueAr}
                    onChange={(e) => setValueAr(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    maxLength={maxLength}
                    disabled={isSaving}
                    rows={4}
                    className={textareaClasses}
                    dir="rtl"
                  />
                ) : fieldType === "number" ? (
                  <input
                    type="number"
                    value={valueAr}
                    onChange={(e) => setValueAr(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    disabled={isSaving}
                    className={inputClasses}
                    dir="ltr"
                  />
                ) : (
                  <input
                    type="text"
                    value={valueAr}
                    onChange={(e) => setValueAr(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    maxLength={maxLength}
                    disabled={isSaving}
                    className={inputClasses}
                    dir="rtl"
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
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
            onClick={async () => {
              await onSave(valueEn, valueAr);
            }}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-deep disabled:opacity-50"
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
