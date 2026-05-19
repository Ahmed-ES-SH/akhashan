"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/app/hooks/admin/useAdminAuth";
import AdminMessagesInbox from "@/app/_components/website/_admin/AdminMessagesInbox";
import { useLocale } from "@/app/hooks/useLocale";

///////////////////////////////////////////////////////////////////////
/////////////// Admin Contact Messages Page Client — auth + inbox /////
///////////////////////////////////////////////////////////////////////

function ContactMessagesGate() {
  const { isLoading, isAuthenticated } = useAdminAuth();
  const locale = useLocale();
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
      <AdminMessagesInbox />
    </div>
  );
}

export default function AdminContactMessagesPageClient() {
  return <ContactMessagesGate />;
}
