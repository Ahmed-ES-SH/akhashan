"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/app/hooks/useLocale";
import { useTranslation } from "@/app/hooks/useTranslation";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import MobailMenue from "./MobailMenue";

export default function Navbar() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslation("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const links: { href: string; label: { en: string; ar: string } }[] =
    t?.navbar?.links ?? [];

  const toggleLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    window.location.href = newPath;
  };

  const currentLangLabel = t?.navbar?.langToggle?.[locale] ?? locale;

  return (
    <nav
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`fixed  top-0 left-0 right-0 z-100 h-20 transition-all duration-500 ${scrolled ? "bg-black/60 backdrop-blur-lg" : ""}`}
    >
      <div className="nav-inner c-container  mx-auto flex items-center justify-between h-full">
        <Link
          href={`/${locale}#home`}
          className="flex items-center gap-3.5 no-underline"
        >
          <Image
            className="w-32 object-contain"
            src={"/logo.png"}
            alt="Logo"
            width={200}
            height={200}
          />
        </Link>
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 bg-white/8 border border-gold/20 rounded-full px-4 py-1.75 text-gold-light text-xs font-semibold transition-all duration-250 hover:bg-gold/15 hover:border-gold hover:text-gold font-inherit tracking-[0.03em] cursor-pointer whitespace-nowrap"
          >
            {currentLangLabel}
          </button>
          <button
            className=" flex flex-col gap-1.5 bg-none border-none p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <motion.span
              className="block w-6 h-0.5 bg-white rounded"
              animate={mobileOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
            />
            <motion.span
              className="block w-6 h-0.5 bg-white rounded"
              animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
            />
            <motion.span
              className="block w-6 h-0.5 bg-white rounded"
              animate={
                mobileOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }
              }
            />
          </button>
        </div>

        {/* Mobile Menu */}
        <MobailMenue
          mobileOpen={mobileOpen}
          links={links}
          locale={locale}
          setMobileOpen={setMobileOpen}
        />
        <div className="hidden md:flex md:items-center md:gap-[clamp(16px,2.5vw,36px)]">
          <ul className="flex items-center gap-[clamp(16px,2.5vw,36px)] list-none">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={`/${locale}${link.href}`}
                  className="text-white/70 hover:text-white text-sm font-medium transition-colors duration-250 whitespace-nowrap relative no-underline
                    after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-gold after:transition-all after:duration-300 after:rounded-full hover:after:w-full"
                >
                  {link.label[locale]}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={toggleLocale}
                className="flex items-center gap-1.5 bg-white/8 border border-gold/20 rounded-full px-4 py-1.75 text-gold-light text-xs font-semibold transition-all duration-250 hover:bg-gold/15 hover:border-gold hover:text-gold font-inherit tracking-[0.03em] cursor-pointer whitespace-nowrap"
              >
                {currentLangLabel}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
