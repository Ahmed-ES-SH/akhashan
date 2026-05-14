"use client";

import { useLocale } from "@/app/hooks/useLocale";
import { useTranslation } from "@/app/hooks/useTranslation";
import { useScrollReveal } from "@/app/hooks/home/useScrollReveal";
import SectionLabel from "@/app/_components/website/SectionLabel";
import Icon from "@/app/_components/website/Icon";

function BadgeCard({
  icon,
  title,
  desc,
  tag,
}: {
  icon: string;
  title: string;
  desc: string;
  tag: string;
}) {
  return (
    <div className="flex flex-col gap-4 bg-surface border border-border rounded-xl p-9 md:p-7 transition-all duration-400 relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-lg hover:shadow-black/6">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold to-gold-light opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
      <div className="w-15 h-15 flex-shrink-0 rounded-2xl bg-gradient-to-br from-gold/12 to-gold/6 flex items-center justify-center">
        <Icon name={icon} className="w-[30px] h-[30px] text-gold" />
      </div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted leading-relaxed flex-1">{desc}</p>
      <span className="inline-block self-start px-3 py-1 rounded-full text-[0.72rem] font-bold bg-gold/12 text-gold-dark">
        {tag}
      </span>
    </div>
  );
}

export default function LicensingSection() {
  const locale = useLocale();
  const t = useTranslation("home");
  const licensing = t?.licensing;
  const { ref: staggerRef, isVisible: staggerVisible } = useScrollReveal();

  if (!licensing) return null;

  return (
    <section className="py-[clamp(72px,10vw,140px)]" id="licensing">
      <div className="w-[min(1200px,100%-48px)] mx-auto">
        <SectionLabel>{licensing.label?.[locale]}</SectionLabel>
        <h2 className="text-[clamp(2rem,3.5vw,3.2rem)] font-extrabold leading-[1.12] mb-3 tracking-[-0.01em] text-charcoal">
          {licensing.heading?.[locale]}
        </h2>
        <p className="text-lg text-muted max-w-prose mb-12 leading-relaxed">
          {licensing.description?.[locale]}
        </p>

        <div ref={staggerRef} className={`reveal-stagger grid grid-cols-1 md:grid-cols-3 gap-5 ${staggerVisible ? "visible" : ""}`}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {licensing.items?.map((item: any) => (
            <BadgeCard
              key={item.icon}
              icon={item.icon}
              title={item.title[locale]}
              desc={item.desc[locale]}
              tag={item.tag[locale]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
