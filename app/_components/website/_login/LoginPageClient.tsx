"use client";

import { useLocale } from "@/app/hooks/useLocale";
import { useTranslation } from "@/app/hooks/useTranslation";
import { AuthProvider, useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginForm from "./LoginForm";
import { FiShield } from "react-icons/fi";
import Image from "next/image";

///////////////////////////////////////////////////////////////////////
/////////////// Login Page Client — 2-column brand + form /////////////
/////////////// Left: brand identity / Right: login card //////////////
///////////////////////////////////////////////////////////////////////

function LoginContent() {
  const t = useTranslation("login");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  /////////////////////////////////////////////////////////////////////
  ///////////// Redirect to admin if already authenticated /////////////
  /////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(`/${locale}/admin`);
    }
  }, [isAuthenticated, isLoading, locale, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ── Left: Brand Panel ─────────────────────────────────────── */}
      <div className="relative flex min-h-[40vh] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-green via-green-deep to-charcoal lg:min-h-screen lg:w-1/2">
        {/* Subtle geometric pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(30deg, #C8A96B 12%, transparent 12.5%, transparent 87%, #C8A96B 87.5%),
              linear-gradient(150deg, #C8A96B 12%, transparent 12.5%, transparent 87%, #C8A96B 87.5%),
              linear-gradient(30deg, #C8A96B 12%, transparent 12.5%, transparent 87%, #C8A96B 87.5%),
              linear-gradient(150deg, #C8A96B 12%, transparent 12.5%, transparent 87%, #C8A96B 87.5%)
            `,
            backgroundSize: "80px 140px",
            backgroundPosition: "0 0, 0 0, 40px 70px, 40px 70px",
          }}
        />

        {/* Radial glow */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

        {/* Brand content */}
        <div className="relative z-10 mx-auto max-w-md px-8 text-center lg:px-12 ">
          {/* Logo mark */}
          <Image
            src={"/logo.png"}
            className="w-72   mx-auto"
            width={200}
            height={200}
            alt="logo"
          />

          {/* Company name */}
          <h1
            className={`text-3xl font-bold leading-tight text-white lg:text-4xl xl:text-5xl ${
              isArabic ? "font-arabic" : ""
            }`}
          >
            {isArabic ? "عبدالله خشّان الشمري" : "Abdullah Khashan"}
          </h1>
          <p
            className={`mt-2 text-lg text-gold lg:text-xl ${
              isArabic ? "font-arabic" : ""
            }`}
          >
            {isArabic ? "شركة الاستقدام" : "Al-Shammari Recruitment"}
          </p>

          {/* Gold accent line */}
          <div className="mx-auto mt-6 h-0.5 w-16 bg-gold/60 lg:mx-0" />

          {/* Tagline */}
          <p className="mt-6 text-sm leading-relaxed text-white/60">
            {isArabic
              ? "شريكك الموثوق في خدمات الاستقدام"
              : "Your trusted partner in recruitment services"}
          </p>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50 backdrop-blur-sm">
              {isArabic ? "مرخص من وزارة الموارد البشرية" : "MHRSD Licensed"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50 backdrop-blur-sm">
              {isArabic ? "مساند" : "Musaned"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Right: Form Panel ─────────────────────────────────────── */}
      <div className="flex w-full items-center justify-center bg-bg px-6 py-12 lg:w-1/2 lg:px-16 lg:py-0">
        <div className="w-full max-w-md">
          {/* Page heading */}
          <h2
            data-testid="login-page-title"
            className="text-2xl font-bold text-charcoal lg:text-3xl"
          >
            {t.page.title}
          </h2>
          <p className="mt-2 text-sm text-muted">{t.page.subtitle}</p>

          {/* Form */}
          <div className="mt-8">
            <LoginForm />
          </div>

          {/* Footer note */}
          <p className="mt-8 text-center text-xs text-muted/60">
            &copy; {new Date().getFullYear()}{" "}
            {isArabic
              ? "شركة عبدالله خشّان الشمري للاستقدام"
              : "Abdullah Khashan Al-Shammari Recruitment"}
            . {isArabic ? "جميع الحقوق محفوظة" : "All rights reserved."}
          </p>
        </div>
      </div>
    </div>
  );
}

///////////////////////////////////////////////////////////////////////
/////////////// Client wrapper with AuthProvider //////////////////////
///////////////////////////////////////////////////////////////////////

export default function LoginPageClient({ locale }: { locale: string }) {
  return (
    <AuthProvider locale={locale}>
      <LoginContent />
    </AuthProvider>
  );
}
