"use client";

import { useState, useRef, useEffect } from "react";
import { FiX, FiCalendar } from "react-icons/fi";

///////////////////////////////////////////////////////////////////////
/////////////// SubscriptionPopup — date picker for expiry ////////////
///////////////////////////////////////////////////////////////////////

interface SubscriptionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentExpiry: string | null;
  onSave: (newDate: string) => Promise<boolean>;
}

export default function SubscriptionPopup({
  isOpen,
  onClose,
  currentExpiry,
  onSave,
}: SubscriptionPopupProps) {
  const [dateValue, setDateValue] = useState(() =>
    currentExpiry
      ? currentExpiry.split("T")[0]
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
  );
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /////////////////////////////////////////////////////////////////////
  ///////////// Auto-focus and open date picker on mount ///////////////
  /////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (isOpen && inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  /////////////////////////////////////////////////////////////////////
  ///////////// Close on Escape ///////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!dateValue) return;
    setIsSaving(true);
    await onSave(dateValue);
    setIsSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Update subscription expiry"
    >
      <div
        className="mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <FiCalendar className="h-5 w-5 text-green" />
            <h2 className="text-lg font-semibold text-gray-900">
              Subscription Expiry
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────── */}
        <div className="px-6 py-6">
          <label
            htmlFor="expiry-date"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Expiration Date
          </label>
          <input
            ref={inputRef}
            id="expiry-date"
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            disabled={isSaving}
            min={new Date().toISOString().split("T")[0]}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 transition focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
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
            disabled={isSaving || !dateValue}
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
