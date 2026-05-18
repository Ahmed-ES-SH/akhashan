import AdminContactMessagesPageClient from "@/app/_components/website/_admin/AdminContactMessagesPageClient";
import { directionMap } from "@/constants/global";

export default async function AdminContactMessagesPage({
  params,
}: {
  params: Promise<{ locale: "en" | "ar" }>;
}) {
  const { locale } = await params;

  return (
    <div dir={directionMap[locale]}>
      <AdminContactMessagesPageClient />
    </div>
  );
}
