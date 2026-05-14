/* eslint-disable @typescript-eslint/no-explicit-any */
import { Cairo, Inter } from "next/font/google";
import { directionMap } from "@/constants/global";
import { ReactNode } from "react";
import Navbar from "../_components/website/_home/Navbar";
import Footer from "../_components/website/_home/Footer";
import FloatingWhatsApp from "../_components/website/_home/FloatingWhatsApp";
import { Toaster } from "sonner";

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
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
  const fontClass = locale === "ar" ? cairo.variable : inter.variable;

  return (
    <html lang={locale} dir={directionMap[locale]}>
      <body className={`${fontClass} antialiased`}>
        <Navbar />
        {children}
        <Toaster position="top-center" richColors closeButton />
        <FloatingWhatsApp />
        <Footer />
      </body>
    </html>
  );
}
