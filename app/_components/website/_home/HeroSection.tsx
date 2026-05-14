"use client";

import { useLocale } from "@/app/hooks/useLocale";
import { useTranslation } from "@/app/hooks/useTranslation";
import { FiStar, FiShield, FiMail } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import Button from "@/app/_components/website/Button";

export default function HeroSection() {
  const locale = useLocale();
  const t = useTranslation("home");
  const hero = t?.hero;

  if (!hero) return null;

  return (
    <section
      className="min-h-dvh flex items-center justify-center relative overflow-hidden pt-20"
      id="home"
    >
      <div className="absolute inset-0 scale-105 will-change-transform">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${locale === "ar" ? "/hero-image-RTL.webp" : "/Hero-image.webp"})`,
          }}
        />
        <div className="bg-[#1E1E1E]/50 absolute inset-0 w-full h-full" />
      </div>

      <div className="c-container min-h-dvh flex items-center max-xl:justify-center mx-auto xl:ltr:mr-auto xl:rtl:ml-auto relative z-10 max-md:py-16">
        <div className="hero-entrance xl:rtl:text-right xl:ltr:text-left text-center">
          <div className="inline-flex items-center gap-2 bg-gold/12 border border-gold/25 rounded-full px-4 md:px-6 py-2 text-sm font-semibold text-gold-light mb-6 md:mb-8">
            <FiStar className="w-4 h-4 fill-gold" />
            <span>{hero.badge?.[locale]}</span>
          </div>

          <h1
            className="text-[clamp(2rem,7vw,5rem)] font-black leading-[1.1] text-white mb-3 md:mb-4 tracking-[-0.02em] hero-heading"
            dangerouslySetInnerHTML={{ __html: hero.heading?.[locale] ?? "" }}
          />

          <p
            className="text-[clamp(0.95rem,1.5vw,1.2rem)] text-white/80 leading-relaxed mb-6 md:mb-8 max-w-160 mx-auto xl:mx-0 font-normal"
            dangerouslySetInnerHTML={{ __html: hero.description?.[locale] ?? "" }}
          />

          <div className="inline-flex items-center gap-2.5 md:gap-3.5 flex-wrap px-4 md:px-6 py-3 md:py-4 bg-white/8 rounded-xl md:rounded-2xl border border-gold/15 mb-8 md:mb-10 w-full md:w-auto justify-center">
            <FiShield className="w-5 h-5 fill-gold shrink-0" />
            <p className="text-sm m-0 text-white/82">
              {hero.license?.[locale]}
            </p>
          </div>

          <div className="flex gap-3 md:gap-4 flex-col sm:flex-row w-full sm:w-fit max-xl:mx-auto">
            <Button
              variant="primary"
              href="#contact"
              icon={<FiMail className="w-5 h-5" />}
            >
              {hero.ctaPrimary?.[locale]}
            </Button>
            <Button
              variant="whatsapp"
              href="https://wa.me/966XXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              icon={<FaWhatsapp className="w-5 h-5" />}
            >
              {hero.ctaWhatsapp?.[locale]}
            </Button>
          </div>
        </div>

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
    </section>
  );
}
