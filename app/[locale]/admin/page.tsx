import { getServerTranslation } from "@/app/helpers/serverTranslation";
import type { Metadata } from "next";
import AdminPageClient from "@/app/_components/website/_admin/AdminPageClient";
import {
  fetchCountries,
  fetchHomePageContent,
  fetchServices,
} from "@/app/helpers/api/publicApi";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "en" | "ar" }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getServerTranslation(locale, "admin");

  return {
    title: "Admin Dashboard",
  };
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: "en" | "ar" }>;
}) {
  const { locale } = await params;

  // Fetch home page content first (hero, stats, licensing, process, headers)
  const [homeContent, services, countries] = await Promise.all([
    fetchHomePageContent(locale),
    fetchServices(locale),
    fetchCountries(locale),
  ]);

  const data = {
    hero: homeContent.hero,
    stats: homeContent.stats,
    licensing: homeContent.licensing,
    process: homeContent.process,
    services,
    countries,
  };

  return <AdminPageClient locale={locale} data={data} />;
}
