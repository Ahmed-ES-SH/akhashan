"use client";

import { useLocale } from "@/app/hooks/useLocale";
import { useTranslation } from "@/app/hooks/useTranslation";
import { useScrollReveal } from "@/app/hooks/home/useScrollReveal";
import SectionLabel from "@/app/_components/website/SectionLabel";

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
      <h4 className="text-base font-bold mb-1.5 text-white">{title}</h4>
      <p className="text-sm text-white/60 leading-relaxed max-w-[220px] mx-auto">
        {desc}
      </p>
    </div>
  );
}

export default function ProcessSection() {
  const locale = useLocale();
  const t = useTranslation("home");
  const process = t?.process;
  const { ref: staggerRef, isVisible: staggerVisible } = useScrollReveal();

  if (!process) return null;

  return (
    <section className="py-[clamp(88px,12vw,160px)] bg-green-dark text-white" id="process">
      <div className="w-[min(1200px,100%-48px)] mx-auto">
        <SectionLabel>{process.label?.[locale]}</SectionLabel>
        <h2 className="text-[clamp(2rem,3.5vw,3.2rem)] font-extrabold leading-[1.12] mb-3 tracking-[-0.01em] text-white">
          {process.heading?.[locale]}
        </h2>
        <p className="text-lg text-white/65 max-w-prose mb-12 leading-relaxed">
          {process.description?.[locale]}
        </p>

        <div ref={staggerRef} className={`reveal-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${staggerVisible ? "visible" : ""}`}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {process.steps?.map((step: any, i: number) => (
            <ProcessStepCard
              key={step.num}
              num={step.num}
              title={step.title[locale]}
              desc={step.desc[locale]}
              isLast={i === (process.steps?.length ?? 1) - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
