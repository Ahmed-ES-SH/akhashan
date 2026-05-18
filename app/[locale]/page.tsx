import { Metadata } from "next";
import { getServerTranslation } from "../helpers/serverTranslation";
import { getSharedMetadata } from "../helpers/SharedMetadata";
import {
  fetchHomePageContent,
  fetchServices,
  fetchCountries,
} from "../helpers/api/publicApi";
import HeroSection from "../_components/website/_home/HeroSection";
import StatsSection from "../_components/website/_home/StatsSection";
import ServicesSection from "../_components/website/_home/ServicesSection";
import ProcessSection from "../_components/website/_home/ProcessSection";
import CountriesSection from "../_components/website/_home/CountriesSection";
import LicensingSection from "../_components/website/_home/LicensingSection";
import ContactSection from "../_components/website/_home/ContactSection";
import type { Locale } from "../types/website/home.types";

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
  const safeLocale = (locale as Locale) || "en";

  // Fetch home page content first (hero, stats, licensing, process, headers)
  const [homeContent, services, countries] = await Promise.all([
    fetchHomePageContent(safeLocale),
    fetchServices(safeLocale),
    fetchCountries(safeLocale),
  ]);

  return (
    <>
      <main dir={locale === "ar" ? "rtl" : "ltr"} className="">
        <HeroSection hero={homeContent.hero} locale={safeLocale} />
        <StatsSection stats={homeContent.stats} />
        <LicensingSection licensing={homeContent.licensing} locale={safeLocale} />
        <ServicesSection
          servicesHeader={homeContent.services_header}
          services={services}
          locale={safeLocale}
        />
        <ProcessSection process={homeContent.process} />
        <CountriesSection
          countriesHeader={homeContent.countries_header}
          locale={safeLocale}
        />
        <ContactSection
          services={services}
          countries={countries}
          locale={safeLocale}
        />
      </main>
    </>
  );
}
