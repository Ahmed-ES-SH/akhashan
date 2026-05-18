"use client";

import { useCounterAnimation } from "@/app/hooks/home/useCounterAnimation";
import { useScrollReveal } from "@/app/hooks/home/useScrollReveal";
import Icon from "@/app/_components/website/Icon";
import type { StatsSectionApiResponse } from "@/app/types/website/home.types";

interface StatsSectionProps {
  stats: StatsSectionApiResponse;
}

function StatCard({
  icon,
  target,
  suffix,
  label,
}: {
  icon: string;
  target: number;
  suffix: string;
  label: string;
}) {
  const { ref, current } = useCounterAnimation({ target });

  return (
    <div
      ref={ref}
      className="bg-surface border border-border rounded-xl p-9 text-center transition-all duration-400 relative overflow-hidden group hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/8"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold to-gold-light opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gold/10 flex items-center justify-center">
        <Icon name={icon} className="w-6 h-6 text-gold" />
      </div>
      <div className="text-[clamp(2.8rem,4.5vw,3.8rem)] font-black text-green leading-none mb-1.5 tabular-nums">
        <span className="text-gold">
          {typeof current === "number" ? current.toLocaleString("en-US") : "0"}
        </span>
        {suffix}
      </div>
      <div className="text-sm text-muted font-medium">{label}</div>
    </div>
  );
}

export default function StatsSection({ stats }: StatsSectionProps) {
  const { ref: staggerRef, isVisible: staggerVisible } = useScrollReveal();

  if (!stats) return null;

  return (
    <section className="py-[clamp(60px,8vw,120px)] bg-sand" id="about">
      <div className="w-[min(1200px,100%-48px)] mx-auto">
        <span className="inline-block text-xs font-bold uppercase tracking-[0.12em] text-gold mb-3">
          {stats.label}
        </span>
        <h2 className="text-[clamp(2rem,3.5vw,3.2rem)] font-extrabold leading-[1.12] mb-3 tracking-[-0.01em] text-charcoal">
          {stats.heading}
        </h2>
        <p className="text-lg text-muted max-w-prose mb-12 leading-relaxed">
          {stats.description}
        </p>

        <div ref={staggerRef} className={`reveal-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 ${staggerVisible ? "visible" : ""}`}>
          {stats.items?.map((item) => (
            <StatCard
              key={item.icon ?? ""}
              icon={item.icon ?? ""}
              target={item.target ?? 0}
              suffix={item.suffix ?? ""}
              label={item.label ?? ""}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
