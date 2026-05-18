"use client";

import { useScrollReveal } from "@/app/hooks/home/useScrollReveal";
import SectionLabel from "@/app/_components/website/SectionLabel";
import type { ProcessSectionApiResponse } from "@/app/types/website/home.types";

/////////////////////////////////////////////////////////////////////
///////////// ProcessSection — public display ///////////////////////
///////////// Handles empty state, null fields, RTL /////////////////
/////////////////////////////////////////////////////////////////////

interface ProcessSectionProps {
  process: ProcessSectionApiResponse;
}

function ProcessStepCard({
  num,
  title,
  desc,
  isLast,
}: {
  num: number;
  title: string;
  desc: string;
  isLast: boolean;
}) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mx-auto mb-5 text-xl font-black text-green-dark relative">
        {num}
        {!isLast && (
          <div className="absolute top-1/2 left-[calc(100%+12px)] w-[calc(100%-80px)] h-px bg-gold/25 max-md:hidden" />
        )}
      </div>
      {title && (
        <h4 className="text-base font-bold mb-1.5 text-white">{title}</h4>
      )}
      {desc && (
        <p className="text-sm text-white/60 leading-relaxed max-w-[220px] mx-auto">
          {desc}
        </p>
      )}
    </div>
  );
}

export default function ProcessSection({ process }: ProcessSectionProps) {
  const { ref: staggerRef, isVisible: staggerVisible } = useScrollReveal();

  ///////////////////////////////////////////////////////////////////////
  ///////////// Hide section if no data or no items /////////////////////
  ///////////////////////////////////////////////////////////////////////

  if (!process || !process.items || process.items.length === 0) {
    return null;
  }

  ///////////////////////////////////////////////////////////////////////
  ///////////// Hide section if header fields are all empty /////////////
  ///////////////////////////////////////////////////////////////////////

  const hasHeader = process.label || process.heading || process.description;
  const hasItems = process.items.some(
    (item) => item.title || item.desc || item.step_number,
  );

  if (!hasHeader && !hasItems) {
    return null;
  }

  return (
    <section
      className="py-[clamp(88px,12vw,160px)] bg-green-dark text-white"
      id="process"
    >
      <div className="w-[min(1200px,100%-48px)] mx-auto">
        {/* ── Section header (only render if content exists) ─────── */}
        {(process.label || process.heading || process.description) && (
          <>
            {process.label && <SectionLabel>{process.label}</SectionLabel>}
            {process.heading && (
              <h2 className="text-[clamp(2rem,3.5vw,3.2rem)] font-extrabold leading-[1.12] mb-3 tracking-[-0.01em] text-white">
                {process.heading}
              </h2>
            )}
            {process.description && (
              <p className="text-lg text-white/65 max-w-prose mb-12 leading-relaxed">
                {process.description}
              </p>
            )}
          </>
        )}

        {/* ── Process steps ──────────────────────────────────────── */}
        {hasItems && (
          <div
            ref={staggerRef}
            className={`reveal-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${staggerVisible ? "visible" : ""}`}
          >
            {process.items
              .filter((step) => step.title || step.desc || step.step_number)
              .map((step, i) => {
                const filteredItems = process.items.filter(
                  (s) => s.title || s.desc || s.step_number,
                );
                return (
                  <ProcessStepCard
                    key={step.step_number ?? i}
                    num={step.step_number ?? 0}
                    title={step.title ?? ""}
                    desc={step.desc ?? ""}
                    isLast={i === filteredItems.length - 1}
                  />
                );
              })}
          </div>
        )}
      </div>
    </section>
  );
}
