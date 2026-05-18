import type { Metadata } from "next";
import { getServerTranslation } from "@/app/helpers/serverTranslation";
import { getSharedMetadata } from "@/app/helpers/SharedMetadata";
import LoginPageClient from "@/app/_components/website/_login/LoginPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "en" | "ar" }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getServerTranslation(locale, "login");
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

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"}>
      <LoginPageClient locale={locale} />
    </div>
  );
}
