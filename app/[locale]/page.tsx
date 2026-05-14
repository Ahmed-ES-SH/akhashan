import { Metadata } from "next";
import { getServerTranslation } from "../helpers/serverTranslation";
import { getSharedMetadata } from "../helpers/SharedMetadata";
import HeroSection from "../_components/website/_home/HeroSection";
import StatsSection from "../_components/website/_home/StatsSection";
import ServicesSection from "../_components/website/_home/ServicesSection";
import ProcessSection from "../_components/website/_home/ProcessSection";
import CountriesSection from "../_components/website/_home/CountriesSection";
import LicensingSection from "../_components/website/_home/LicensingSection";
import ContactSection from "../_components/website/_home/ContactSection";
import CTABanner from "../_components/website/_home/CTABanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "en" | "ar" }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getServerTranslation(locale, "home");
  const meta = t?.meta;

  const title = meta?.title ?? "";
  const description = meta?.description ?? "";

  const sharedMetaData = getSharedMetadata(title, description);

  return {
    title,
    description,
    ...sharedMetaData,
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <main dir={locale === "ar" ? "rtl" : "ltr"} className="">
        <HeroSection />
        <StatsSection />
        <LicensingSection />
        <ServicesSection />
        <ProcessSection />
        <CountriesSection />
        <ContactSection />
      </main>
    </>
  );
}
