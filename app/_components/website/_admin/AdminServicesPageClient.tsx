"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/app/hooks/admin/useAdminAuth";
import AdminServicesManager from "@/app/_components/website/_admin/AdminServicesManager";

/////////////////////////////////////////////////////////////////////
/////////////// Admin Services Page Client — auth + manager /////////
/////////////////////////////////////////////////////////////////////

function ServicesGate({ locale }: { locale: "en" | "ar" }) {
  const { isLoading, isAuthenticated } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/${locale}/login`);
    }
  }, [isLoading, isAuthenticated, router, locale]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-700 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminServicesManager locale={locale} />
    </div>
  );
}

export default function AdminServicesPageClient({
  locale,
}: {
  locale: "en" | "ar";
}) {
  return <ServicesGate locale={locale} />;
}
