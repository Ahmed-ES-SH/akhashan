import { getServerTranslation } from "@/app/helpers/serverTranslation";
import type { Metadata } from "next";
import AdminServicesPageClient from "@/app/_components/website/_admin/AdminServicesPageClient";

/////////////////////////////////////////////////////////////////////
/////////////// Admin Services Page — server component //////////////
/////////////////////////////////////////////////////////////////////

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "en" | "ar" }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const adminT = getServerTranslation(locale, "admin");
  const servicesSection = (adminT as Record<string, unknown>)?.services as
    | Record<string, unknown>
    | undefined;

  const title =
    typeof servicesSection?.title === "string"
      ? servicesSection.title
      : "Services Management";

  return {
    title: `${title} — Admin`,
  };
}

export default async function AdminServicesPage({
  params,
}: {
  params: Promise<{ locale: "en" | "ar" }>;
}) {
  const { locale } = await params;

  return <AdminServicesPageClient locale={locale} />;
}
