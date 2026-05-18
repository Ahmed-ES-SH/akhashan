"use client";

import { useAdminAuth } from "@/app/hooks/admin/useAdminAuth";
import { useAdminLogin } from "@/app/hooks/admin/useAdminLogin";
import { AdminLoginForm } from "@/app/_components/website/_admin/AdminLoginForm";
import { AdminEditorProvider } from "@/app/contexts/AdminEditorContext";
import AdminHeroSectionControl from "./AdminHeroSectionControl";
import AdminStatsSectionControl from "./AdminStatsSectionControl";
import AdminLicensingSectionControl from "./AdminLicensingSectionControl";
import AdminProcessSectionControl from "./AdminProcessSectionControl";
import AdminEditPopup from "./AdminEditPopup";
import AdminSaveBar from "./AdminSaveBar";
import { useLocale } from "@/app/hooks/useLocale";
import type {
  HeroApiResponse,
  Locale,
  StatsSectionApiResponse,
  LicensingSectionApiResponse,
  ProcessSectionApiResponse,
} from "@/app/types/website/home.types";

/////////////////////////////////////////////////////////////////////
/////////////// Admin Gate — client-side auth logic /////////////////
/////////////////////////////////////////////////////////////////////

interface AdminGateData {
  hero: HeroApiResponse;
  stats?: StatsSectionApiResponse;
  licensing?: LicensingSectionApiResponse;
  process?: ProcessSectionApiResponse;
}

export function AdminGate({ data }: { data: AdminGateData }) {
  const locale = useLocale();

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

  // Authenticated — show admin editing interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin header */}

      {/* All sections wrapped in single editor provider */}
      <AdminEditorProvider
        hero={data.hero}
        stats={data.stats}
        licensing={data.licensing}
        process={data.process}
        locale={locale as Locale}
      >
        <AdminHeroSectionControl locale={locale as Locale} />
        <AdminStatsSectionControl locale={locale as Locale} />
        <AdminLicensingSectionControl locale={locale as Locale} />
        <AdminProcessSectionControl locale={locale as Locale} />

        {/* Single popup + save bar for ALL sections */}
        <AdminEditPopup />
        <AdminSaveBar />
      </AdminEditorProvider>
    </div>
  );
}
