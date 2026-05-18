"use client";

import { useAdminAuth } from "@/app/hooks/admin/useAdminAuth";
import { useAdminLogin } from "@/app/hooks/admin/useAdminLogin";
import { AdminLoginForm } from "@/app/_components/website/_admin/AdminLoginForm";
import AdminCountriesManager from "@/app/_components/website/_admin/AdminCountriesManager";

///////////////////////////////////////////////////////////////////////
///////////// Admin Countries Page Client — auth + manager ////////////
///////////////////////////////////////////////////////////////////////

function CountriesGate({ locale }: { locale: "en" | "ar" }) {
  const { isLoading, isAuthenticated } = useAdminAuth();
  const { login, isLoading: isLoggingIn, error: loginError } = useAdminLogin();

  // Still checking auth session
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-700 border-t-transparent" />
      </div>
    );
  }

  // Not authenticated — show login form
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <AdminLoginForm
          onLogin={async (email, password) => {
            await login(email, password);
          }}
          isLoading={isLoggingIn}
          error={loginError}
        />
      </div>
    );
  }

  // Authenticated — show countries manager
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminCountriesManager locale={locale} />
    </div>
  );
}

export default function AdminCountriesPageClient({
  locale,
}: {
  locale: "en" | "ar";
}) {
  return <CountriesGate locale={locale} />;
}
