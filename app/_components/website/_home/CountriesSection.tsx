/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/app/hooks/useLocale";
import { useTranslation } from "@/app/hooks/useTranslation";
import { useScrollReveal } from "@/app/hooks/home/useScrollReveal";
import SectionLabel from "@/app/_components/website/SectionLabel";
import type { CountryItem } from "@/app/types/website/home.types";

const regionLabels: Record<string, { en: string; ar: string }> = {
  asia: { en: "Asia", ar: "آسيا" },
  africa: { en: "Africa", ar: "أفريقيا" },
};

function CountryCard({
  item,
  index,
  locale,
}: {
  item: CountryItem;
  index: number;
  locale: "en" | "ar";
}) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="group relative flex flex-col bg-white border border-border p-6 transition-all duration-400 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/8"
      style={{ borderRadius: "20px" }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-gold to-gold-light rounded-t-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 shrink-0 flex items-center justify-center text-[1.6rem]">
          <span className="leading-none">{item.flag}</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted/60">
          {regionLabels[item.region]?.[locale]}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="text-base font-bold text-charcoal mb-0.5">
          {item.name[locale]}
        </h3>
        <p className="text-xs text-muted/70 leading-relaxed mb-3">
          {item.specialty}
        </p>
      </div>

      <div className="pt-3 border-t border-border/50">
        <span className="text-[11px] font-semibold text-green tracking-[0.02em]">
          {item.workersLabel}
        </span>
      </div>
    </motion.div>
  );
}

export default function CountriesSection() {
  const locale = useLocale();
  const t = useTranslation("home");
  const countries = t?.countries;
  const { ref: staggerRef } = useScrollReveal();

  if (!countries) return null;

  return (
    <section className="py-[clamp(60px,8vw,120px)] bg-sand" id="countries">
      <div className="w-[min(1200px,100%-48px)] mx-auto">
        <SectionLabel>{countries.label?.[locale]}</SectionLabel>
        <h2 className="text-[clamp(2rem,3.5vw,3.2rem)] font-extrabold leading-[1.12] mb-3 tracking-[-0.01em] text-charcoal">
          {countries.heading?.[locale]}
        </h2>
        <p className="text-lg text-muted max-w-prose mb-12 leading-relaxed">
          {countries.description?.[locale]}
        </p>

        <div
          ref={staggerRef}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {countries.items?.map((item: any, index: number) => (
            <CountryCard
              key={item.flag}
              item={item}
              index={index}
              locale={locale as "en" | "ar"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
