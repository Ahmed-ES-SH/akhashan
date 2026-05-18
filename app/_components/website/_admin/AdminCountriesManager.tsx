"use client";

import { useEffect, useState, useCallback } from "react";
import { FiPlus, FiRefreshCw } from "react-icons/fi";
import { toast } from "sonner";
import { useTranslation } from "@/app/hooks/useTranslation";
import { useAdminCountries } from "@/app/hooks/admin/useAdminCountries";
import type {
  AdminCountry,
  AdminCreateCountryPayload,
  AdminUpdateCountryPayload,
} from "@/app/types/website/admin.types";
import AdminCountryRow from "./AdminCountryRow";
import AdminCountryForm from "./AdminCountryForm";
import AdminPagination from "./AdminPagination";

///////////////////////////////////////////////////////////////////////
///////////// AdminCountriesManager — main admin component ////////////
///////////////////////////////////////////////////////////////////////

interface AdminCountriesManagerProps {
  locale: "en" | "ar";
}

type FilterRegion = "all" | "asia" | "africa";
type FilterStatus = "all" | "active" | "inactive";

export default function AdminCountriesManager({
  locale,
}: AdminCountriesManagerProps) {
  const {
    countries,
    meta,
    isLoading,
    error,
    fetchCountries,
    createCountry,
    updateCountry,
    deleteCountry,
    toggleActive,
  } = useAdminCountries();

  const adminT = useTranslation("admin");
  const countriesSection = (adminT as Record<string, unknown>)?.countries as
    | Record<string, unknown>
    | undefined;
  const toasts =
    (countriesSection?.toasts as Record<string, string>) ?? {};

  // Memoize toasts to avoid useCallback dependency issues
  const toastsRef = toasts;

  // Filter state
  const [filterRegion, setFilterRegion] = useState<FilterRegion>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<
    AdminCountry | undefined
  >(undefined);
  const [isSaving, setIsSaving] = useState(false);

  /////////////////////////////////////////////////////////////////////
  ///////////// Fetch countries on mount //////////////////////////////
  /////////////////////////////////////////////////////////////////////

  useEffect(() => {
    fetchCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Filter countries by region and status /////////////////
  /////////////////////////////////////////////////////////////////////

  const filteredCountries = countries.filter((country) => {
    if (filterRegion !== "all" && country.region !== filterRegion) return false;
    if (filterStatus === "active") return country.is_active;
    if (filterStatus === "inactive") return !country.is_active;
    return true;
  });

  /////////////////////////////////////////////////////////////////////
  ///////////// Open form in create mode //////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleAddCountry = () => {
    setEditingCountry(undefined);
    setIsFormOpen(true);
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Open form in edit mode ////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleEditCountry = (country: AdminCountry) => {
    setEditingCountry(country);
    setIsFormOpen(true);
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Save (create or update) ///////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleSave = useCallback(
    async (
      data: AdminCreateCountryPayload | AdminUpdateCountryPayload,
    ) => {
      setIsSaving(true);
      try {
        if (editingCountry) {
          await updateCountry(editingCountry.id, data as AdminUpdateCountryPayload);
          toast.success(toastsRef.updated ?? "Country updated successfully");
        } else {
          await createCountry(data as AdminCreateCountryPayload);
          toast.success(toastsRef.created ?? "Country created successfully");
        }
        setIsFormOpen(false);
        setEditingCountry(undefined);
      } finally {
        setIsSaving(false);
      }
    },
    [editingCountry, createCountry, updateCountry, toastsRef],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Delete with confirmation //////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleDeleteCountry = async (id: number) => {
    try {
      await deleteCountry(id);
      toast.success(toasts.deleted ?? "Country deleted successfully");
    } catch {
      // Error already handled in hook
    }
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Toggle active/inactive ////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleToggleActive = async (id: number) => {
    try {
      await toggleActive(id);
      toast.success(toasts.toggled ?? "Country status updated");
    } catch {
      // Error already handled in hook
    }
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Handle page change ////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handlePageChange = async (page: number) => {
    await fetchCountries(page);
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Retry fetch ///////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleRetry = () => {
    fetchCountries();
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Safe translation accessors ////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const titleText =
    typeof countriesSection?.title === "string"
      ? countriesSection.title
      : "Countries Management";
  const addCountryText =
    typeof countriesSection?.addCountry === "string"
      ? countriesSection.addCountry
      : "Add Country";
  const noCountriesText =
    typeof countriesSection?.noCountries === "string"
      ? countriesSection.noCountries
      : 'No countries yet. Click "Add Country" to create one.';
  const filterAllText =
    typeof countriesSection?.filterAll === "string"
      ? countriesSection.filterAll
      : "All";
  const filterAsiaText =
    typeof countriesSection?.filterAsia === "string"
      ? countriesSection.filterAsia
      : "Asia";
  const filterAfricaText =
    typeof countriesSection?.filterAfrica === "string"
      ? countriesSection.filterAfrica
      : "Africa";
  const filterActiveText =
    typeof countriesSection?.filterActive === "string"
      ? countriesSection.filterActive
      : "Active";
  const filterInactiveText =
    typeof countriesSection?.filterInactive === "string"
      ? countriesSection.filterInactive
      : "Inactive";
  const fetchErrorText =
    typeof toasts?.fetchError === "string"
      ? toasts.fetchError
      : "Failed to load countries";

  // Table header translations
  const tableHeaders =
    (countriesSection?.tableHeaders as Record<string, string>) ?? {};
  const headerFlag = tableHeaders.flag ?? "Flag";
  const headerName = tableHeaders.name ?? "Name";
  const headerRegion = tableHeaders.region ?? "Region";
  const headerSpecialty = tableHeaders.specialty ?? "Specialty";
  const headerWorkers = tableHeaders.workers ?? "Workers";
  const headerOrder = tableHeaders.order ?? "Order";
  const headerStatus = tableHeaders.status ?? "Status";
  const headerActions = tableHeaders.actions ?? "Actions";

  // Error state translations
  const errorSection =
    (countriesSection?.errorState as Record<string, string>) ?? {};
  const retryText = errorSection.retry ?? "Retry";

  /////////////////////////////////////////////////////////////////////
  ///////////// Loading skeleton //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  if (isLoading) {
    return (
      <div
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="min-h-screen bg-gray-50"
        data-testid="admin-countries-loading"
      >
        {/* Header skeleton */}
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="mx-auto max-w-7xl">
            <div className="h-7 w-48 rounded bg-gray-200 animate-pulse" />
          </div>
        </header>

        {/* Table skeleton */}
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 animate-pulse"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-200" />
                <div className="flex-1 h-4 bg-gray-200 rounded w-1/3" />
                <div className="w-16 h-4 bg-gray-200 rounded hidden md:block" />
                <div className="flex-1 h-4 bg-gray-200 rounded w-1/2 hidden lg:block" />
                <div className="w-16 h-4 bg-gray-200 rounded hidden sm:block" />
                <div className="w-8 h-8 rounded-lg bg-gray-200 hidden sm:block" />
                <div className="w-11 h-6 rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /////////////////////////////////////////////////////////////////////
  ///////////// Error state ///////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  if (error) {
    return (
      <div
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        data-testid="admin-countries-error"
      >
        <div className="text-center">
          <div className="text-red-500 mb-4 text-lg font-medium">
            {fetchErrorText}
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-deep"
            data-testid="retry-fetch-countries"
          >
            <FiRefreshCw className="w-4 h-4" />
            {retryText}
          </button>
        </div>
      </div>
    );
  }

  /////////////////////////////////////////////////////////////////////
  ///////////// Main render ///////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  return (
    <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-gray-50"
      data-testid="admin-countries-page"
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">{titleText}</h1>
          <button
            type="button"
            onClick={handleAddCountry}
            className="inline-flex items-center gap-2 rounded-xl bg-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-deep"
            data-testid="add-country"
          >
            <FiPlus className="w-4 h-4" />
            {addCountryText}
          </button>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* ── Filter tabs ──────────────────────────────────────── */}
        <div className="space-y-3 mb-6">
          {/* Region filters */}
          <div className="flex items-center gap-2">
            {(
              [
                { key: "all" as FilterRegion, label: filterAllText },
                { key: "asia" as FilterRegion, label: filterAsiaText },
                { key: "africa" as FilterRegion, label: filterAfricaText },
              ]
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilterRegion(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  filterRegion === key
                    ? "bg-green text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
                data-testid={`filter-region-${key}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-2">
            {(
              [
                { key: "all" as FilterStatus, label: filterAllText },
                { key: "active" as FilterStatus, label: filterActiveText },
                { key: "inactive" as FilterStatus, label: filterInactiveText },
              ]
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilterStatus(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  filterStatus === key
                    ? "bg-green text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
                data-testid={`filter-status-${key}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Empty state ──────────────────────────────────────── */}
        {filteredCountries.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
            <p className="text-muted mb-6">{noCountriesText}</p>
            <button
              type="button"
              onClick={handleAddCountry}
              className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-deep"
              data-testid="add-country-empty"
            >
              <FiPlus className="w-4 h-4" />
              {addCountryText}
            </button>
          </div>
        ) : (
          <>
            {/* ── Countries table ──────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {headerFlag}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {headerName}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        {headerRegion}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        {headerSpecialty}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        {headerWorkers}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        {headerOrder}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {headerStatus}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {headerActions}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCountries.map((country) => (
                      <AdminCountryRow
                        key={country.id}
                        country={country}
                        locale={locale}
                        onEdit={handleEditCountry}
                        onDelete={handleDeleteCountry}
                        onToggle={handleToggleActive}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ─────────────────────────────────── */}
              <AdminPagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Create/Edit Form Modal ──────────────────────────────── */}
      <AdminCountryForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCountry(undefined);
        }}
        onSave={handleSave}
        initialData={editingCountry}
        isSaving={isSaving}
      />
    </div>
  );
}
