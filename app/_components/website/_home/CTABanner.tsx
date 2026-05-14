"use client";

import { useLocale } from "@/app/hooks/useLocale";
import { useTranslation } from "@/app/hooks/useTranslation";
import { useScrollReveal } from "@/app/hooks/home/useScrollReveal";
import { FiMail } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import Button from "@/app/_components/website/Button";

export default function CTABanner() {
  const locale = useLocale();
  const t = useTranslation("home");
  const cta = t?.cta;

  const { ref, isVisible } = useScrollReveal();

  if (!cta) return null;

  return (
    <section className="py-[clamp(72px,10vw,140px)]">
      <div className="w-[min(1200px,100%-48px)] mx-auto">
        <div
          ref={ref}
          className={`bg-gradient-to-br from-green-dark to-green-deep rounded-2xl md:rounded-3xl p-12 md:p-16 text-center relative overflow-hidden reveal ${isVisible ? "visible" : ""}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(200,169,107,0.08)_0%,transparent_60%),radial-gradient(ellipse_at_80%_50%,rgba(255,255,255,0.03)_0%,transparent_50%)]" />
          <div className="relative z-10">
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-extrabold text-white mb-3">
              {cta.heading?.[locale]}
            </h2>
            <p className="text-white/70 max-w-[500px] mx-auto mb-8 text-base">
              {cta.description?.[locale]}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                variant="primary"
                href="#contact"
                icon={<FiMail className="w-5 h-5" />}
              >
                Contact Us
              </Button>
              <Button
                variant="whatsapp"
                href="https://wa.me/966XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                icon={<FaWhatsapp className="w-5 h-5" />}
              >
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
