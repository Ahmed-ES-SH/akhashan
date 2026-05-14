"use client";

import { useLocale } from "@/app/hooks/useLocale";
import { useTranslation } from "@/app/hooks/useTranslation";
import { useScrollReveal } from "@/app/hooks/home/useScrollReveal";

export default function QuoteSection() {
  const locale = useLocale();
  const t = useTranslation("home");
  const quote = t?.quote;

  const { ref: quoteRef, isVisible: quoteVisible } = useScrollReveal<HTMLQuoteElement>();
  const { ref: attrRef, isVisible: attrVisible } = useScrollReveal();

  if (!quote) return null;

  return (
    <section className="bg-green-dark text-center py-[100px] relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(12rem,20vw,24rem)] font-black leading-none text-gold/4 pointer-events-none font-serif">
        &ldquo;
      </div>
      <div className="w-[min(1200px,100%-48px)] mx-auto relative">
        <blockquote
          ref={quoteRef}
          className={`text-[clamp(1.3rem,2.2vw,1.8rem)] font-semibold leading-relaxed max-w-[780px] mx-auto text-white/92 relative reveal ${quoteVisible ? "visible" : ""}`}
        >
          <span className="block w-10 h-[3px] bg-gold mx-auto mb-6 rounded" />
          {quote.text?.[locale]}
        </blockquote>
        <div
          ref={attrRef}
          className={`mt-5 text-sm text-gold/75 font-medium tracking-[0.02em] reveal-fade-delayed ${attrVisible ? "visible" : ""}`}
        >
          {quote.attribution?.[locale]}
        </div>
      </div>
    </section>
  );
}
