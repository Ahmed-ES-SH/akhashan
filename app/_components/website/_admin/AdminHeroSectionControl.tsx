"use client";

import { useState } from "react";
import { FiStar, FiShield, FiMail, FiCamera } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useAdminEditor } from "@/app/contexts/AdminEditorContext";
import { HERO_FIELD_API_MAP } from "@/app/types/website/admin.types";
import { adminUploadHeroImages } from "@/app/helpers/api/adminApi";
import { resolveImageUrl } from "@/app/helpers/api/apiClient";
import EditableText from "./EditableText";
import ImageUploadPopup from "./ImageUploadPopup";
import type { Locale } from "@/app/types/website/home.types";
import { directionMap } from "@/constants/global";
import Image from "next/image";

///////////////////////////////////////////////////////////////////////
///////////// Admin Hero Section Control //////////////////////////////
///////////////////////////////////////////////////////////////////////

interface AdminHeroSectionControlProps {
  locale: Locale;
}

export default function AdminHeroSectionControl({
  locale,
}: AdminHeroSectionControlProps) {
  const { getFieldValue, getBilingualValue, openEditor, setBilingualField } =
    useAdminEditor();
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  /////////////////////////////////////////////////////////////////////
  ///////////// Resolve background image for current locale ///////////
  /////////////////////////////////////////////////////////////////////

  const bgPath = getFieldValue("background_image");
  const backgroundImage = bgPath
    ? resolveImageUrl(bgPath)
    : locale === "ar"
      ? "/hero-image-RTL.webp"
      : "/Hero-image.webp";

  // resolved backgroundImage is used below for the inline style

  /////////////////////////////////////////////////////////////////////
  ///////////// Batch image upload handler ////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleImageUpload = async (
    fileEn?: File | null,
    fileAr?: File | null,
  ) => {
    setIsUploading(true);
    try {
      const response = await adminUploadHeroImages(fileEn, fileAr);
      const current = getBilingualValue("background_image");

      setBilingualField(
        "background_image",
        response.imageUrl_en ?? current.en,
        response.imageUrl_ar ?? current.ar,
      );
    } finally {
      setIsUploading(false);
    }
  };

  console.log(backgroundImage);

  return (
    <section
      dir={directionMap[locale]}
      className="min-h-dvh flex items-center justify-center relative overflow-hidden pt-20"
      id="home"
    >
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />

      {/* Background image edit button — always visible in admin mode */}
      <button
        type="button"
        onClick={() => setImageUploadOpen(true)}
        className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-sm text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:bg-black/80 flex items-center gap-2"
        aria-label="Change background image"
      >
        <FiCamera className="w-4 h-4" />
        Change Background
      </button>

      <div className="c-container min-h-dvh flex items-center max-xl:justify-center mx-auto xl:ltr:mr-auto xl:rtl:ml-auto relative z-10 max-md:py-16">
        <div className="hero-entrance xl:rtl:text-right xl:ltr:text-left text-center">
          {/* ── Badge ─────────────────────────────────────────── */}
          <EditableText
            value={getFieldValue("badge")}
            fieldKey="badge"
            onEdit={(key) => openEditor(key, HERO_FIELD_API_MAP)}
            as="div"
            className="inline-flex items-center gap-2 bg-gold/12 border border-gold/25 rounded-full px-4 md:px-6 py-2 text-sm font-semibold text-gold-light mb-6 md:mb-8"
          >
            <FiStar className="w-4 h-4 fill-gold" />
            <span>{getFieldValue("badge")}</span>
          </EditableText>

          {/* ── Heading + Highlight (siblings, not nested) ─────── */}
          <h1 className="text-[clamp(2rem,7vw,5rem)] font-black leading-[1.1] text-white mb-3 md:mb-4 tracking-[-0.02em] hero-heading">
            <EditableText
              value={getFieldValue("heading")}
              fieldKey="heading"
              onEdit={(key) => openEditor(key, HERO_FIELD_API_MAP)}
              as="span"
              dangerouslySetInnerHTML={{
                __html: getFieldValue("heading"),
              }}
            />
            {getFieldValue("highlight_text") && (
              <>
                {" "}
                <EditableText
                  value={getFieldValue("highlight_text")}
                  fieldKey="highlight_text"
                  onEdit={(key) => openEditor(key, HERO_FIELD_API_MAP)}
                  as="span"
                  className="highlight"
                />
              </>
            )}
          </h1>

          {/* ── Description ────────────────────────────────────── */}
          <EditableText
            value={getFieldValue("description")}
            fieldKey="description"
            onEdit={(key) => openEditor(key, HERO_FIELD_API_MAP)}
            as="p"
            className="text-[clamp(0.95rem,1.5vw,1.2rem)] text-white/80 leading-relaxed mb-6 md:mb-8 max-w-160 mx-auto xl:mx-0 font-normal"
            dangerouslySetInnerHTML={{
              __html: getFieldValue("description"),
            }}
          />

          {/* ── License ────────────────────────────────────────── */}
          <div className="inline-flex items-center gap-2.5 md:gap-3.5 flex-wrap px-4 md:px-6 py-3 md:py-4 bg-white/8 rounded-xl md:rounded-2xl border border-gold/15 mb-8 md:mb-10 w-full md:w-fit justify-center">
            <FiShield className="w-5 h-5 fill-gold shrink-0" />
            <EditableText
              value={getFieldValue("license")}
              fieldKey="license"
              onEdit={(key) => openEditor(key, HERO_FIELD_API_MAP)}
              as="p"
              className="text-sm m-0 text-white/82"
            />
          </div>

          {/* ── CTA Buttons ────────────────────────────────────── */}
          <div className="flex gap-3 md:gap-4 flex-col sm:flex-row w-full sm:w-fit max-xl:mx-auto">
            {/* Primary CTA — not editable */}
            <span
              className="inline-flex items-center justify-center gap-3 px-9 py-4 rounded-full text-base font-bold transition-all duration-300 active:scale-[0.98] bg-green text-white shadow-lg shadow-green/25 hover:bg-green-deep hover:-translate-y-1 hover:shadow-xl hover:shadow-green/30 cursor-pointer"
            >
              <FiMail className="w-5 h-5" />
              <span className="inline-block rounded px-0.5">
                {getFieldValue("cta_primary")}
              </span>
            </span>

            {/* WhatsApp CTA — editable number */}
            <span
              role="button"
              tabIndex={0}
              onClick={() => openEditor("whatsapp_number", HERO_FIELD_API_MAP)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openEditor("whatsapp_number", HERO_FIELD_API_MAP);
                }
              }}
              className="inline-flex items-center justify-center gap-3 px-9 py-4 rounded-full text-base font-bold transition-all duration-300 active:scale-[0.98] bg-[#25D366] text-white shadow-lg shadow-[#25D366]/25 hover:bg-[#20BD5A] hover:-translate-y-1 hover:shadow-xl hover:shadow-[#25D366]/35 cursor-pointer"
            >
              <FaWhatsapp className="w-5 h-5" />
              <span className="edit-effect inline-block rounded px-0.5">
                {getFieldValue("whatsapp_number")}
              </span>
            </span>
          </div>
        </div>

        {/* Decorative SVG */}
        <div className="hidden xl:flex items-end justify-center opacity-50">
          <svg
            viewBox="0 0 400 500"
            className="w-full max-w-sm"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="200"
              cy="250"
              r="180"
              stroke="rgba(200,169,107,0.15)"
              strokeWidth="1"
            />
            <circle
              cx="200"
              cy="250"
              r="120"
              stroke="rgba(200,169,107,0.12)"
              strokeWidth="1"
            />
            <circle
              cx="200"
              cy="250"
              r="60"
              stroke="rgba(200,169,107,0.1)"
              strokeWidth="1"
            />
            <path
              d="M200 70 L240 130 L310 130 L260 180 L280 250 L200 210 L120 250 L140 180 L90 130 L160 130 Z"
              fill="rgba(200,169,107,0.06)"
              stroke="rgba(200,169,107,0.2)"
              strokeWidth="0.5"
            />
          </svg>
        </div>
      </div>

      {/* Image upload popup */}
      <ImageUploadPopup
        isOpen={imageUploadOpen}
        onClose={() => setImageUploadOpen(false)}
        onUpload={handleImageUpload}
        currentImageUrlEn={getBilingualValue("background_image").en || null}
        currentImageUrlAr={getBilingualValue("background_image").ar || null}
        label="Hero Background Image"
        isUploading={isUploading}
      />
    </section>
  );
}
