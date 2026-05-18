/* eslint-disable @typescript-eslint/no-explicit-any */
import { directionMap } from "@/constants/global";
import { Tajawal, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import ClientShell from "../_components/website/ClientShell";
import { ErrorBoundary } from "../_components/website/ErrorBoundary";
import { ReactNode } from "react";

const tajawal = Tajawal({
  subsets: ["arabic"],
  variable: "--font-tajawal",
  display: "swap",
  weight: ["300", "400", "500", "700", "800"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

interface RootLayoutProps {
  children: ReactNode;
  params: any;
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale = "ar" } = await params;
  const fontClass =
    locale === "ar" ? tajawal.variable : plusJakartaSans.variable;

  return (
    <html lang={locale} dir={directionMap[locale]}>
      <body className={`${fontClass} antialiased`}>
        <ErrorBoundary>
          <ClientShell>{children}</ClientShell>
          <Toaster position="top-center" richColors closeButton />
        </ErrorBoundary>
      </body>
    </html>
  );
}
