"use client";

import { useTranslation } from "@/app/hooks/useTranslation";
import { useContactForm } from "@/app/hooks/home/useContactForm";
import SectionLabel from "@/app/_components/website/SectionLabel";
import { FiPhone, FiMail, FiClock } from "react-icons/fi";
import type {
  PublicServiceApiResponse,
  PublicCountryApiResponse,
  Locale,
} from "@/app/types/website/home.types";

interface ContactSectionProps {
  services: PublicServiceApiResponse[];
  countries: PublicCountryApiResponse[];
  locale: Locale;
}

export default function ContactSection({
  services,
  countries,
  locale,
}: ContactSectionProps) {
  const t = useTranslation("home");
  const contact = t?.contact;
  const { formData, errors, status, updateField, submit } =
    useContactForm(t, locale);

  if (!contact) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit();
  };

  const isRtl = locale === "ar";

  const rateLimitMessage = contact.form?.rateLimit?.[locale] ??
    (isRtl ? "محاولات كثيرة جداً، يرجى المحاولة لاحقاً" : "Too many attempts. Please try again later.");

  return (
    <section
      className="py-[clamp(88px,12vw,160px)] bg-sand"
      id="contact"
      dir={isRtl ? "rtl" : "ltr"}
      data-testid="contact-section"
    >
      <div className="w-[min(1200px,100%-48px)] mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-start">
          <div>
            <SectionLabel>{contact.label?.[locale]}</SectionLabel>
            <h2 className="text-[clamp(2rem,3.5vw,3.2rem)] font-extrabold leading-[1.12] mb-3 tracking-[-0.01em] text-charcoal">
              {contact.heading?.[locale]}
            </h2>
            <p className="text-lg text-muted max-w-prose mb-10 leading-relaxed">
              {contact.description?.[locale]}
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted">
                <span className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center shrink-0">
                  <FiPhone className="w-4.5 h-4.5 text-green" />
                </span>
                <span>{t?.footer?.phone}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted">
                <span className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center shrink-0">
                  <FiMail className="w-4.5 h-4.5 text-green" />
                </span>
                <span>{t?.footer?.email}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted">
                <span className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center shrink-0">
                  <FiClock className="w-4.5 h-4.5 text-green" />
                </span>
                <span>{contact.responseTime?.[locale] ?? (isRtl ? "رد خلال ٢٤ ساعة" : "24h response time")}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-5">
                <label className="block text-sm font-bold text-charcoal mb-1.5">
                  {contact.form.name[locale]}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder={contact.form.namePlaceholder[locale]}
                  className={`w-full px-4 py-3 rounded-xl border bg-bg text-charcoal text-sm transition-all duration-200 focus:ring-2 focus:ring-green/20 ${
                    errors.name ? "border-red-400" : "border-border focus:border-green"
                  }`}
                  dir={isRtl ? "rtl" : "ltr"}
                  data-testid="contact-form-name"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-bold text-charcoal mb-1.5">
                    {contact.form.email[locale]}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder={contact.form.emailPlaceholder[locale]}
                    className={`w-full px-4 py-3 rounded-xl border bg-bg text-charcoal text-sm transition-all duration-200 focus:ring-2 focus:ring-green/20 ${
                      errors.email
                        ? "border-red-400"
                        : "border-border focus:border-green"
                    }`}
                    dir="ltr"
                    data-testid="contact-form-email"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-charcoal mb-1.5">
                    {contact.form.phone[locale]}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder={contact.form.phonePlaceholder[locale]}
                    className={`w-full px-4 py-3 rounded-xl border bg-bg text-charcoal text-sm transition-all duration-200 focus:ring-2 focus:ring-green/20 ${
                      errors.phone
                        ? "border-red-400"
                        : "border-border focus:border-green"
                    }`}
                    dir="ltr"
                    data-testid="contact-form-phone"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-bold text-charcoal mb-1.5">
                    {contact.form.service[locale]}
                  </label>
                  <select
                    value={formData.service}
                    onChange={(e) => updateField("service", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-bg text-charcoal text-sm transition-all duration-200 focus:ring-2 focus:ring-green/20 appearance-none ${
                      errors.service
                        ? "border-red-400"
                        : "border-border focus:border-green"
                    }`}
                    dir={isRtl ? "rtl" : "ltr"}
                    data-testid="contact-form-service"
                  >
                    <option value="">
                      {contact.form.servicePlaceholder[locale]}
                    </option>
                    {services?.map((s) => (
                      <option key={s.id} value={s.title ?? ""}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                  {errors.service && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {errors.service}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-charcoal mb-1.5">
                    {contact.form.country[locale]}
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-bg text-charcoal text-sm transition-all duration-200 focus:ring-2 focus:ring-green/20 appearance-none ${
                      errors.country
                        ? "border-red-400"
                        : "border-border focus:border-green"
                    }`}
                    dir={isRtl ? "rtl" : "ltr"}
                    data-testid="contact-form-country"
                  >
                    <option value="">
                      {contact.form.countryPlaceholder[locale]}
                    </option>
                    {countries?.map((c) => (
                      <option key={c.id} value={c.name ?? ""}>
                        {c.flag_emoji} {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.country && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {errors.country}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-charcoal mb-1.5">
                  {contact.form.message[locale]}
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  placeholder={contact.form.messagePlaceholder[locale]}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-charcoal text-sm transition-all duration-200 focus:border-green focus:ring-2 focus:ring-green/20 resize-none"
                  dir={isRtl ? "rtl" : "ltr"}
                  data-testid="contact-form-message"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading" || status === "rateLimited"}
                className="w-full bg-green text-white text-sm font-bold py-3.5 px-6 rounded-xl transition-all duration-300 hover:bg-green-dark active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid="contact-form-submit"
              >
                {status === "loading"
                  ? contact.form.sending[locale]
                  : contact.form.submit[locale]}
              </button>

              {status === "success" && (
                <div className="mt-4 p-3.5 rounded-xl bg-green/8 border border-green/20 text-green-dark text-sm text-center font-medium" data-testid="contact-form-success">
                  {contact.form.success[locale]}
                </div>
              )}
              {status === "error" && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center font-medium" data-testid="contact-form-error">
                  {contact.form.error[locale]}
                </div>
              )}
              {status === "rateLimited" && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center font-medium" data-testid="contact-form-rate-limited">
                  {rateLimitMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
