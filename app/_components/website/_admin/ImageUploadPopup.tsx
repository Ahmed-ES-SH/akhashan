"use client";

import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { FiX, FiUpload, FiImage } from "react-icons/fi";
import { resolveImageUrl } from "@/app/helpers/api/apiClient";

///////////////////////////////////////////////////////////////////////
///////////// ImageUploadPopup — bilingual image upload ///////////////
///////////////////////////////////////////////////////////////////////

interface ImageUploadPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (fileEn?: File | null, fileAr?: File | null) => Promise<void>;
  currentImageUrlEn: string | null;
  currentImageUrlAr: string | null;
  label: string;
  isUploading?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ImageUploadPopup({
  isOpen,
  onClose,
  onUpload,
  currentImageUrlEn,
  currentImageUrlAr,
  label,
  isUploading = false,
}: ImageUploadPopupProps) {
  const [selectedFileEn, setSelectedFileEn] = useState<File | null>(null);
  const [selectedFileAr, setSelectedFileAr] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const enInputRef = useRef<HTMLInputElement>(null);
  const arInputRef = useRef<HTMLInputElement>(null);

  /////////////////////////////////////////////////////////////////////
  ///////////// Preview derived from state (no effect needed) /////////
  /////////////////////////////////////////////////////////////////////

  const previewEn = selectedFileEn
    ? URL.createObjectURL(selectedFileEn)
    : resolveImageUrl(currentImageUrlEn);
  const previewAr = selectedFileAr
    ? URL.createObjectURL(selectedFileAr)
    : resolveImageUrl(currentImageUrlAr);

  /////////////////////////////////////////////////////////////////////
  ///////////// Close on Escape ///////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape" && !isUploading) {
        onClose();
      }
    },
    [onClose, isUploading],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// File validation ///////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Only JPEG, PNG, and WebP images are allowed";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 5MB";
    }
    return null;
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// File selection handlers ///////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleFileSelect = (locale: "en" | "ar", file: File | null) => {
    setError("");
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (locale === "en") {
      setSelectedFileEn(file);
    } else {
      setSelectedFileAr(file);
    }
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Batch upload handler //////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleUpload = async () => {
    if (!selectedFileEn && !selectedFileAr) {
      setError("Please select at least one image");
      return;
    }

    try {
      await onUpload(selectedFileEn, selectedFileAr);
      setSelectedFileEn(null);
      setSelectedFileAr(null);
      onClose();
    } catch {
      setError("Upload failed. Please try again.");
    }
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Drag and drop handlers ////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleDrop = (e: React.DragEvent, locale: "en" | "ar") => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFileSelect(locale, file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (!isOpen) return null;

  const dropZoneClasses = (hasPreview: boolean) =>
    `relative w-full aspect-video rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 overflow-hidden ${
      hasPreview
        ? "border-gold/40 bg-gold/5"
        : "border-gray-200 bg-gray-50 hover:border-gold/60 hover:bg-gold/5"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      data-testid="image-upload-popup"
    >
      <div
        className="w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
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
            disabled={isUploading}
            className="shrink-0 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-6 overflow-y-auto">
          {/* English Image */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 uppercase leading-4">
                EN
              </span>
              <span className="text-xs text-gray-400">English Background</span>
            </div>
            <div
              className={dropZoneClasses(!!previewEn)}
              onDrop={(e) => handleDrop(e, "en")}
              onDragOver={handleDragOver}
            >
              {previewEn ? (
                <>
                  <img
                    src={previewEn}
                    alt="English background preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Click to change</span>
                  </div>
                </>
              ) : (
                <>
                  <FiImage className="w-8 h-8 text-gray-300" />
                  <span className="text-sm text-gray-400">Drop image or click to upload</span>
                </>
              )}
              <input
                ref={enInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => handleFileSelect("en", e.target.files?.[0] ?? null)}
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Arabic Image */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 uppercase leading-4">
                AR
              </span>
              <span className="text-xs text-gray-400">Arabic Background</span>
            </div>
            <div
              className={dropZoneClasses(!!previewAr)}
              onDrop={(e) => handleDrop(e, "ar")}
              onDragOver={handleDragOver}
            >
              {previewAr ? (
                <>
                  <img
                    src={previewAr}
                    alt="Arabic background preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Click to change</span>
                  </div>
                </>
              ) : (
                <>
                  <FiImage className="w-8 h-8 text-gray-300" />
                  <span className="text-sm text-gray-400">Drop image or click to upload</span>
                </>
              )}
              <input
                ref={arInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => handleFileSelect("ar", e.target.files?.[0] ?? null)}
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* File info */}
          {(selectedFileEn || selectedFileAr) && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 space-y-1">
              {selectedFileEn && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiUpload className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">EN:</span>
                  <span className="truncate">{selectedFileEn.name}</span>
                  <span className="text-gray-400">({(selectedFileEn.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
              {selectedFileAr && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiUpload className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium">AR:</span>
                  <span className="truncate">{selectedFileAr.name}</span>
                  <span className="text-gray-400">({(selectedFileAr.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || (!selectedFileEn && !selectedFileAr)}
            className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-deep disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Uploading...
              </>
            ) : (
              <>
                <FiUpload className="w-4 h-4" />
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
