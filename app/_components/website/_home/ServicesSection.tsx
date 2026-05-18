"use client";

import SectionLabel from "@/app/_components/website/SectionLabel";
import ServiceCard from "./ServiceCard";
import type {
  SectionHeaderApiResponse,
  PublicServiceApiResponse,
  Locale,
} from "@/app/types/website/home.types";

interface ServicesSectionProps {
  servicesHeader: SectionHeaderApiResponse;
  services: PublicServiceApiResponse[];
  locale: Locale;
}

export default function ServicesSection({
  servicesHeader,
  services,
  locale,
}: ServicesSectionProps) {
  return (
    <section className="py-[clamp(88px,12vw,160px)] bg-sand" id="services">
      <div className="w-[min(1200px,100%-48px)] mx-auto">
        <SectionLabel>{servicesHeader.label}</SectionLabel>
        <h2 className="text-[clamp(2rem,3.5vw,3.2rem)] font-extrabold leading-[1.12] mb-3 tracking-[-0.01em] text-charcoal">
          {servicesHeader.heading}
        </h2>
        <p className="text-lg text-muted max-w-prose mb-12 leading-relaxed">
          {servicesHeader.description}
        </p>

        <div className="grid grid-cols-1  lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {services?.map((item, index) => (
            <ServiceCard
              key={item.id}
              icon={item.icon ?? ""}
              title={item.title ?? ""}
              desc={item.desc ?? ""}
              metric={
                item.metric_value
                  ? {
                      value: parseInt(item.metric_value, 10) || 0,
                      suffix: item.metric_suffix ?? "",
                      label: item.metric_label ?? "",
                    }
                  : undefined
              }
              buttonLabel={item.button_label ?? ""}
              locale={locale}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
