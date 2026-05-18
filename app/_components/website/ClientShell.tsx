"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import Navbar from "@/app/_components/website/_home/Navbar";
import Footer from "@/app/_components/website/_home/Footer";
import FloatingWhatsApp from "@/app/_components/website/_home/FloatingWhatsApp";
import { useLocale } from "@/app/hooks/useLocale";
import { AuthProvider } from "@/app/contexts/AuthContext";

///////////////////////////////////////////////////////////////////////
/////////////// Client Shell — conditionally hides chrome /////////////
/////////////// on auth pages (login, admin) //////////////////////////
///////////////////////////////////////////////////////////////////////

export default function ClientShell({ children }: { children: ReactNode }) {
  const locale = useLocale() ?? "ar";
  const pathname = usePathname();
  const isAuthPage = pathname.includes("/login") || pathname.includes("/admin");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <AuthProvider locale={locale}>
        <Navbar />
        {children}
        <FloatingWhatsApp />
        <Footer />
      </AuthProvider>
    </>
  );
}
