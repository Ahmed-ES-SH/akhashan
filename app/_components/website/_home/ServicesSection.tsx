"use client";

import { useLocale } from "@/app/hooks/useLocale";
import { useTranslation } from "@/app/hooks/useTranslation";
import SectionLabel from "@/app/_components/website/SectionLabel";
import ServiceCard from "./ServiceCard";

export default function ServicesSection() {
  const locale = useLocale();
  const t = useTranslation("home");
  const services = t?.services;

  if (!services) return null;

  return (
    <section className="py-[clamp(88px,12vw,160px)] bg-sand" id="services">
      <div className="w-[min(1200px,100%-48px)] mx-auto">
        <SectionLabel>{services.label?.[locale]}</SectionLabel>
        <h2 className="text-[clamp(2rem,3.5vw,3.2rem)] font-extrabold leading-[1.12] mb-3 tracking-[-0.01em] text-charcoal">
          {services.heading?.[locale]}
        </h2>
        <p className="text-lg text-muted max-w-prose mb-12 leading-relaxed">
          {services.description?.[locale]}
        </p>

        <div className="grid grid-cols-1  lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {services.items?.map((item: any, index: number) => (
            <ServiceCard
              key={item.icon + item.title.en}
              icon={item.icon}
              title={item.title[locale]}
              desc={item.desc[locale]}
              metric={
                item.metric
                  ? {
                      value: item.metric.value,
                      suffix: item.metric.suffix,
                      label: item.metric.label[locale],
                    }
                  : undefined
              }
              buttonLabel={item.buttonLabel?.[locale] ?? "Order Service"}
              locale={locale}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
