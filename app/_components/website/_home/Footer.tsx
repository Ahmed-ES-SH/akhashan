"use client";

import { useLocale } from "@/app/hooks/useLocale";
import { useTranslation } from "@/app/hooks/useTranslation";
import { useWhatsAppNumber } from "@/app/hooks/useWhatsAppNumber";
import Image from "next/image";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa6";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";

export default function Footer() {
  const locale = useLocale();
  const t = useTranslation("home");
  const footer = t?.footer;
  const { whatsappNumber } = useWhatsAppNumber();

  if (!footer) return null;

  return (
    <footer
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="bg-charcoal text-white/80 pt-20 pb-0"
    >
      <div className="w-[min(1200px,100%-48px)] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.3fr] gap-12 mb-12">
          {/* Brand */}
          <div>
            <Image
              src={"/favicon.ico"}
              alt="Akhashan Logo"
              width={50}
              height={50}
              className="mb-5"
            />
            <p className="text-sm leading-relaxed text-white/55 mt-3.5">
              {footer.brandDesc?.[locale]}
            </p>
            {/* social media links */}
            {/* <div className="flex gap-2.5 mt-5">
              <a
                href="#"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-full border border-white/12 flex items-center justify-center transition-all duration-250 hover:border-gold hover:bg-gold/10 hover:-translate-y-0.5"
              >
                <FaWhatsapp className="w-4 h-4 text-white/55 hover:text-gold" />
              </a>
              <a
                href="#"
                aria-label="X (Twitter)"
                className="w-9 h-9 rounded-full border border-white/12 flex items-center justify-center transition-all duration-250 hover:border-gold hover:bg-gold/10 hover:-translate-y-0.5"
              >
                <FaXTwitter className="w-4 h-4 text-white/55 hover:text-gold" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full border border-white/12 flex items-center justify-center transition-all duration-250 hover:border-gold hover:bg-gold/10 hover:-translate-y-0.5"
              >
                <FaInstagram className="w-4 h-4 text-white/55 hover:text-gold" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-full border border-white/12 flex items-center justify-center transition-all duration-250 hover:border-gold hover:bg-gold/10 hover:-translate-y-0.5"
              >
                <FaLinkedinIn className="w-4 h-4 text-white/55 hover:text-gold" />
              </a>
            </div> */}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-base mb-5">
              {footer.quickLinksTitle?.[locale]}
            </h3>
            <ul className="list-none">
              {footer.quickLinks?.map(
                (link: { href: string; label: { en: string; ar: string } }) => (
                  <li key={link.href} className="mb-2.5">
                    <Link
                      href={`/${locale}${link.href}`}
                      className="text-sm text-white/55 no-underline transition-colors duration-200 hover:text-gold"
                    >
                      {link.label[locale]}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-bold text-base mb-5">
              {footer.servicesTitle?.[locale]}
            </h3>
            <ul className="list-none">
              {footer.serviceLinks?.map(
                (link: { href: string; label: { en: string; ar: string } }) => (
                  <li key={link.label.en} className="mb-2.5">
                    <Link
                      href={link.href}
                      className="text-sm text-white/55 no-underline transition-colors duration-200 hover:text-gold"
                    >
                      {link.label[locale]}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold text-base mb-5">
              {footer.contactTitle?.[locale]}
            </h3>

            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 mb-3.5 text-sm text-white/55 hover:text-gold transition-colors duration-200"
              >
                <FaWhatsapp className="w-4.5 h-4.5 text-gold shrink-0 mt-0.5" />
                <span>{whatsappNumber}</span>
              </a>
            )}
            {/* <div className="flex items-start gap-3 mb-3.5 text-sm text-white/55">
              <FiMail className="w-4.5 h-4.5 text-gold shrink-0 mt-0.5" />
              <span>{footer.email}</span>
            </div> */}
            <div className="flex items-start gap-3 mb-3.5 text-sm text-white/55">
              <FiMapPin className="w-4.5 h-4.5 text-gold shrink-0 mt-0.5" />
              <span>{footer.address?.[locale]}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/6 py-5 flex justify-between items-center flex-wrap gap-3 text-xs text-white/40">
          <span>{footer.copyright?.[locale]}</span>
        </div>
      </div>
    </footer>
  );
}
