"use client";

import { useLocale } from "@/app/hooks/useLocale";
import { FaWhatsapp } from "react-icons/fa";

export default function FloatingWhatsApp() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  return (
    <a
      href="https://wa.me/966XXXXXXXXX"
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-7 z-99  size-12 xl:size-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/35 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-[#25D366]/45 ${
        isRtl ? "left-7 right-auto" : "right-7 left-auto"
      }`}
      aria-label="WhatsApp"
    >
      <FaWhatsapp className="w-7 h-7 text-white" />
    </a>
  );
}
