"use client";

import { motion } from "framer-motion";
import { useScrollReveal } from "@/app/hooks/home/useScrollReveal";
import { useCountries } from "@/app/hooks/home/useCountries";
import { useTranslation } from "@/app/hooks/useTranslation";
import SectionLabel from "@/app/_components/website/SectionLabel";
import type { SectionHeaderApiResponse, Locale } from "@/app/types/website/home.types";

///////////////////////////////////////////////////////////////////////
///////////// Region labels from translations /////////////////////////
///////////////////////////////////////////////////////////////////////

const regionLabels: Record<string, { en: string; ar: string }> = {
  asia: { en: "Asia", ar: "آسيا" },
  africa: { en: "Africa", ar: "أفريقيا" },
};

///////////////////////////////////////////////////////////////////////
///////////// CountryCard — single country card ///////////////////////
///////////////////////////////////////////////////////////////////////

function CountryCard({
  item,
  index,
  locale,
}: {
  item: {
    id: number;
    flag_emoji?: string;
    name?: string;
    specialty?: string;
    region?: string;
    workers_label?: string;
  };
  index: number;
  locale: Locale;
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
        {/* Flag emoji — hidden if null/undefined */}
        {item.flag_emoji && (
          <div className="w-12 h-12 shrink-0 flex items-center justify-center text-[1.6rem]">
            <span className="leading-none">{item.flag_emoji}</span>
          </div>
        )}
        {/* Region label — hidden if null/undefined */}
        {item.region && (
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted/60">
            {regionLabels[item.region]?.[locale] ?? ""}
          </span>
        )}
      </div>

      <div className="flex-1">
        {/* Name — hidden if null/undefined */}
        {item.name && (
          <h3 className="text-base font-bold text-charcoal mb-0.5">
            {item.name}
          </h3>
        )}
        {/* Specialty — hidden if null/undefined */}
        {item.specialty && (
          <p className="text-xs text-muted/70 leading-relaxed mb-3">
            {item.specialty}
          </p>
        )}
      </div>

      {/* Workers label — hidden if null/undefined */}
      {item.workers_label && (
        <div className="pt-3 border-t border-border/50">
          <span className="text-[11px] font-semibold text-green tracking-[0.02em]">
            {item.workers_label}
          </span>
        </div>
      )}
    </motion.div>
  );
}

///////////////////////////////////////////////////////////////////////
///////////// Loading skeleton ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

function CountryCardSkeleton() {
  return (
    <div
      className="flex flex-col bg-white border border-border p-6 animate-pulse"
      style={{ borderRadius: "20px" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-gray-200" />
        <div className="w-12 h-3 rounded bg-gray-200" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
      </div>
      <div className="pt-3 border-t border-border/50 mt-3">
        <div className="h-3 w-1/2 rounded bg-gray-200" />
      </div>
    </div>
  );
}

///////////////////////////////////////////////////////////////////////
///////////// CountriesSection — main component ///////////////////////
///////////////////////////////////////////////////////////////////////

interface CountriesSectionProps {
  countriesHeader: SectionHeaderApiResponse;
  locale: Locale;
}

export default function CountriesSection({
  countriesHeader,
  locale,
}: CountriesSectionProps) {
  const { countries, isLoading, error, refetch } = useCountries(locale);
  const { ref: staggerRef } = useScrollReveal();

  if (!countriesHeader) return null;

  // Error state
  if (error) {
    return (
      <section className="py-[clamp(60px,8vw,120px)] bg-sand" id="countries">
        <div className="w-[min(1200px,100%-48px)] mx-auto text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-deep"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-[clamp(60px,8vw,120px)] bg-sand" id="countries">
      <div className="w-[min(1200px,100%-48px)] mx-auto">
        <SectionLabel>{countriesHeader.label}</SectionLabel>
        <h2 className="text-[clamp(2rem,3.5vw,3.2rem)] font-extrabold leading-[1.12] mb-3 tracking-[-0.01em] text-charcoal">
          {countriesHeader.heading}
        </h2>
        <p className="text-lg text-muted max-w-prose mb-12 leading-relaxed">
          {countriesHeader.description}
        </p>

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <CountryCardSkeleton key={i} />
            ))}
          </div>
        ) : countries.length === 0 ? (
          /* Empty state — hide section entirely when no countries */
          null
        ) : (
          <div
            ref={staggerRef}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {countries.map((item, index) => (
              <CountryCard
                key={item.id}
                item={item}
                index={index}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
