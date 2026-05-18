"use client";

import React from "react";
import { useScrollReveal } from "@/app/hooks/home/useScrollReveal";
import SectionLabel from "@/app/_components/website/SectionLabel";
import { getIcon } from "@/app/helpers/getIcon";
import type {
  LicensingSectionApiResponse,
  Locale,
} from "@/app/types/website/home.types";

interface LicensingSectionProps {
  licensing: LicensingSectionApiResponse;
  locale: Locale;
}

function BadgeCard({
  icon,
  title,
  desc,
  tag,
}: {
  icon?: string;
  title?: string;
  desc?: string;
  tag?: string;
}) {
  return (
    <div className="flex flex-col gap-4 bg-surface border border-border rounded-xl p-9 md:p-7 transition-all duration-400 relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-lg hover:shadow-black/6">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold to-gold-light opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
      {icon && (
        <div className="w-15 h-15 flex-shrink-0 rounded-2xl bg-gradient-to-br from-gold/12 to-gold/6 flex items-center justify-center">
          {React.createElement(getIcon(icon), { className: "w-[30px] h-[30px] text-gold" })}
        </div>
      )}
      {title && <h3 className="text-lg font-bold mb-1">{title}</h3>}
      {desc && (
        <p className="text-sm text-muted leading-relaxed flex-1">{desc}</p>
      )}
      {tag && tag.trim() !== "" && (
        <span className="inline-block self-start px-3 py-1 rounded-full text-[0.72rem] font-bold bg-gold/12 text-gold-dark">
          {tag}
        </span>
      )}
    </div>
  );
}

export default function LicensingSection({
  licensing,
  locale,
}: LicensingSectionProps) {
  const { ref: staggerRef, isVisible: staggerVisible } = useScrollReveal();

  if (!licensing) return null;

  // Hide entire section if no items
  if (!licensing.items || licensing.items.length === 0) return null;

  return (
    <section
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="py-[clamp(72px,10vw,140px)]"
      id="licensing"
    >
      <div className="w-[min(1200px,100%-48px)] mx-auto">
        {licensing.label && (
          <SectionLabel>{licensing.label}</SectionLabel>
        )}
        {licensing.heading && (
          <h2 className="text-[clamp(2rem,3.5vw,3.2rem)] font-extrabold leading-[1.12] mb-3 tracking-[-0.01em] text-charcoal">
            {licensing.heading}
          </h2>
        )}
        {licensing.description && (
          <p className="text-lg text-muted max-w-prose mb-12 leading-relaxed">
            {licensing.description}
          </p>
        )}

        <div
          ref={staggerRef}
          className={`reveal-stagger grid grid-cols-1 md:grid-cols-3 gap-5 ${staggerVisible ? "visible" : ""}`}
        >
          {licensing.items.map((item, index) => (
            <BadgeCard
              key={index}
              icon={item.icon}
              title={item.title}
              desc={item.desc}
              tag={item.tag}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
