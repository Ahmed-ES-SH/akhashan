import { getServerTranslation } from "@/app/helpers/serverTranslation";
import type { Metadata } from "next";
import AdminCountriesPageClient from "@/app/_components/website/_admin/AdminCountriesPageClient";

///////////////////////////////////////////////////////////////////////
///////////// Admin Countries Page — server component /////////////////
///////////////////////////////////////////////////////////////////////

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "en" | "ar" }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const adminT = getServerTranslation(locale, "admin");
  const countriesSection = (adminT as Record<string, unknown>)?.countries as
    | Record<string, unknown>
    | undefined;

  const title =
    typeof countriesSection?.title === "string"
      ? countriesSection.title
      : "Countries Management";

  return {
    title: `${title} — Admin`,
  };
}

export default async function AdminCountriesPage({
  params,
}: {
  params: Promise<{ locale: "en" | "ar" }>;
}) {
  const { locale } = await params;

  return <AdminCountriesPageClient locale={locale} />;
}
