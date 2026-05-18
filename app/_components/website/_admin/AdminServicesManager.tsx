"use client";

import { useEffect, useState, useCallback, useMemo, useDeferredValue } from "react";
import { FiPlus, FiRefreshCw, FiSearch } from "react-icons/fi";
import { toast } from "sonner";
import { useTranslation } from "@/app/hooks/useTranslation";
import { useAdminServices } from "@/app/hooks/admin/useAdminServices";
import type {
  AdminService,
  AdminCreateServicePayload,
  AdminUpdateServicePayload,
} from "@/app/types/website/admin.types";
import AdminServiceRow from "./AdminServiceRow";
import AdminServiceForm from "./AdminServiceForm";
import AdminPagination from "./AdminPagination";

///////////////////////////////////////////////////////////////////////
/////////////// AdminServicesManager — main admin component ///////////
///////////////////////////////////////////////////////////////////////

interface AdminServicesManagerProps {
  locale: "en" | "ar";
}

type FilterStatus = "all" | "active" | "inactive";
type SortBy = "name" | "order" | "status";
type SortDirection = "asc" | "desc";

export default function AdminServicesManager({
  locale,
}: AdminServicesManagerProps) {
  const {
    services,
    meta,
    isLoading,
    error,
    fetchServices,
    createService,
    updateService,
    deleteService,
    toggleActive,
  } = useAdminServices();

  const adminT = useTranslation("admin");
  const servicesSection = (adminT as Record<string, unknown>)?.services as
    | Record<string, unknown>
    | undefined;
  const filters = (servicesSection?.filters as Record<string, string>) ?? {};
  const actions = (servicesSection?.actions as Record<string, string>) ?? {};
  const toasts =
    (servicesSection?.toasts as Record<string, string>) ?? {};

  // Memoize toasts to avoid useCallback dependency issues
  const toastsRef = toasts;

  // Filter state
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("order");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<
    AdminService | undefined
  >(undefined);
  const [isSaving, setIsSaving] = useState(false);

  ///////////////////////////////////////////////////////////////////////
  ///////////// Fetch services on mount /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  ///////////////////////////////////////////////////////////////////////
  ///////////// Debounced search query //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////

  const deferredSearch = useDeferredValue(searchQuery);

  ///////////////////////////////////////////////////////////////////////
  ///////////// Filter + Sort + Pagination pipeline /////////////////////
  ///////////////////////////////////////////////////////////////////////

  // Step 1: Filter by status + search
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      // Status filter
      if (filterStatus === "active") return service.is_active;
      if (filterStatus === "inactive") return !service.is_active;

      // Search filter (both EN and AR titles)
      if (deferredSearch) {
        const q = deferredSearch.toLowerCase();
        const matchesEn = service.title_en?.toLowerCase().includes(q);
        const matchesAr = service.title_ar?.includes(q);
        if (!matchesEn && !matchesAr) return false;
      }

      return true;
    });
  }, [services, filterStatus, deferredSearch]);

  // Step 2: Sort
  const sortedServices = useMemo(() => {
    const sorted = [...filteredServices];
    sorted.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        const aTitle = (
          locale === "ar" ? a.title_ar : a.title_en
        ) ?? "";
        const bTitle = (
          locale === "ar" ? b.title_ar : b.title_en
        ) ?? "";
        comparison = aTitle.localeCompare(bTitle);
      } else if (sortBy === "order") {
        comparison = a.sort_order - b.sort_order;
      } else if (sortBy === "status") {
        comparison = Number(b.is_active) - Number(a.is_active);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [filteredServices, sortBy, sortDirection, locale]);

  // Step 3: Pagination (must happen LAST)
  const paginatedServices = sortedServices.slice(
    (meta.page - 1) * meta.limit,
    meta.page * meta.limit,
  );

  ///////////////////////////////////////////////////////////////////////
  ///////////// Open form in create mode ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////

  const handleAddService = () => {
    setEditingService(undefined);
    setIsFormOpen(true);
  };

  ///////////////////////////////////////////////////////////////////////
  ///////////// Open form in edit mode //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////

  const handleEditService = (service: AdminService) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  ///////////////////////////////////////////////////////////////////////
  ///////////// Save (create or update) /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////

  const handleSave = useCallback(
    async (
      data: AdminCreateServicePayload | AdminUpdateServicePayload,
    ) => {
      setIsSaving(true);
      try {
        if (editingService) {
          await updateService(
            editingService.id,
            data as AdminUpdateServicePayload,
          );
          toast.success(toastsRef.updated ?? "Service updated successfully");
        } else {
          await createService(data as AdminCreateServicePayload);
          toast.success(toastsRef.created ?? "Service created successfully");
        }
        setIsFormOpen(false);
        setEditingService(undefined);
      } finally {
        setIsSaving(false);
      }
    },
    [editingService, createService, updateService, toastsRef],
  );

  ///////////////////////////////////////////////////////////////////////
  ///////////// Delete with confirmation ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////

  const handleDeleteService = async (id: number) => {
    try {
      await deleteService(id);
      toast.success(toasts.deleted ?? "Service deleted successfully");
    } catch {
      // Error already handled in hook
    }
  };

  ///////////////////////////////////////////////////////////////////////
  ///////////// Toggle active/inactive //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////

  const handleToggleActive = async (id: number) => {
    try {
      await toggleActive(id);
      toast.success(toasts.toggled ?? "Service status updated");
    } catch {
      // Error already handled in hook
    }
  };

  ///////////////////////////////////////////////////////////////////////
  ///////////// Handle page change //////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////

  const handlePageChange = async (page: number) => {
    await fetchServices(page);
  };

  ///////////////////////////////////////////////////////////////////////
  ///////////// Retry fetch /////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////

  const handleRetry = () => {
    fetchServices();
  };

  ///////////////////////////////////////////////////////////////////////
  ///////////// Safe translation accessors //////////////////////////////
  ///////////////////////////////////////////////////////////////////////

  const titleText =
    typeof servicesSection?.title === "string"
      ? servicesSection.title
      : "Services Management";
  const addServiceText =
    typeof servicesSection?.addService === "string"
      ? servicesSection.addService
      : "Add Service";
  const noServicesText =
    typeof servicesSection?.noServices === "string"
      ? servicesSection.noServices
      : 'No services yet. Click "Add Service" to create one.';
  const filterAllText =
    typeof servicesSection?.filterAll === "string"
      ? servicesSection.filterAll
      : "All";
  const filterActiveText =
    typeof servicesSection?.filterActive === "string"
      ? servicesSection.filterActive
      : "Active";
  const filterInactiveText =
    typeof servicesSection?.filterInactive === "string"
      ? servicesSection.filterInactive
      : "Inactive";
  const fetchErrorText =
    typeof toasts?.fetchError === "string"
      ? toasts.fetchError
      : "Failed to load services";

  // Sort options
  const sortByNameAsc = filters.sortByNameAsc ?? "Name A-Z";
  const sortByNameDesc = filters.sortByNameDesc ?? "Name Z-A";
  const sortByOrder = filters.sortByOrder ?? "Sort Order";
  const sortByStatusActive = filters.sortByStatusActive ?? "Active first";
  const sortByStatusInactive =
    filters.sortByStatusInactive ?? "Inactive first";
  const searchPlaceholder =
    filters.searchPlaceholder ?? "Search services...";

  const sortOptions: { value: `${SortBy}-${SortDirection}`; label: string }[] =
    [
      { value: "name-asc", label: sortByNameAsc },
      { value: "name-desc", label: sortByNameDesc },
      { value: "order-asc", label: sortByOrder },
      { value: "status-desc", label: sortByStatusActive },
      { value: "status-asc", label: sortByStatusInactive },
    ];

  const handleSortChange = (value: string) => {
    const [by, dir] = value.split("-") as [SortBy, SortDirection];
    setSortBy(by);
    setSortDirection(dir);
  };

  const currentSortValue = `${sortBy}-${sortDirection}`;

  ///////////////////////////////////////////////////////////////////////
  ///////////// Loading skeleton ////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////

  if (isLoading) {
    return (
      <div
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="min-h-screen bg-bg"
        data-testid="admin-services-loading"
      >
        {/* Header skeleton */}
        <header className="border-b border-border bg-surface px-6 py-4">
          <div className="mx-auto max-w-7xl">
            <div className="h-7 w-48 rounded bg-gray-200 animate-pulse" />
          </div>
        </header>

        {/* Table skeleton */}
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-4 border-b border-border/50 animate-pulse"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-200" />
                <div className="flex-1 h-4 bg-gray-200 rounded w-1/3" />
                <div className="flex-1 h-4 bg-gray-200 rounded w-1/2 hidden lg:block" />
                <div className="w-16 h-4 bg-gray-200 rounded hidden md:block" />
                <div className="w-8 h-8 rounded-lg bg-gray-200 hidden sm:block" />
                <div className="w-11 h-6 rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  ///////////////////////////////////////////////////////////////////////
  ///////////// Error state /////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////

  if (error) {
    return (
      <div
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="min-h-screen bg-bg flex items-center justify-center"
        data-testid="admin-services-error"
      >
        <div className="text-center">
          <div className="text-red-500 mb-4 text-lg font-medium">
            {fetchErrorText}
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-deep"
            data-testid="retry-fetch-services"
          >
            <FiRefreshCw className="w-4 h-4" />
            {actions.retry ?? "Retry"}
          </button>
        </div>
      </div>
    );
  }

  ///////////////////////////////////////////////////////////////////////
  ///////////// Main render /////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////

  return (
    <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-bg"
      data-testid="admin-services-page"
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <h1 className="text-xl font-bold text-charcoal">{titleText}</h1>
          <button
            type="button"
            onClick={handleAddService}
            className="inline-flex items-center gap-2 rounded-xl bg-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-deep"
            data-testid="add-service"
          >
            <FiPlus className="w-4 h-4" />
            {addServiceText}
          </button>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* ── Search + Sort toolbar ────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          {/* Search input */}
          <div className="relative flex-1">
            <FiSearch className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-border bg-surface ps-10 pe-4 py-2.5 text-sm text-charcoal transition placeholder:text-muted/70 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none"
              dir={locale === "ar" ? "rtl" : "ltr"}
              data-testid="service-search"
            />
          </div>

          {/* Sort dropdown */}
          <select
            value={currentSortValue}
            onChange={(e) => handleSortChange(e.target.value)}
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-charcoal transition focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none"
            data-testid="service-sort"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Filter tabs ──────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-6">
          {(
            [
              { key: "all", label: filterAllText },
              { key: "active", label: filterActiveText },
              { key: "inactive", label: filterInactiveText },
            ] as { key: FilterStatus; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterStatus(key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filterStatus === key
                  ? "bg-green text-white"
                  : "bg-surface text-muted hover:bg-gray-100 border border-border"
              }`}
              data-testid={`filter-${key}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Empty state ──────────────────────────────────────── */}
        {paginatedServices.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border text-center py-16">
            <p className="text-muted mb-6">{noServicesText}</p>
            <button
              type="button"
              onClick={handleAddService}
              className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-deep"
              data-testid="add-service-empty"
            >
              <FiPlus className="w-4 h-4" />
              {addServiceText}
            </button>
          </div>
        ) : (
          <>
            {/* ── Services table ───────────────────────────────── */}
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-bg/50">
                      <th className="px-4 py-3 text-start text-xs font-semibold text-muted uppercase tracking-wider">
                        Icon
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold text-muted uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">
                        Description
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">
                        Metric
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">
                        Order
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold text-muted uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold text-muted uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedServices.map((service) => (
                      <AdminServiceRow
                        key={service.id}
                        service={service}
                        locale={locale}
                        onEdit={handleEditService}
                        onDelete={handleDeleteService}
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
      <AdminServiceForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingService(undefined);
        }}
        onSave={handleSave}
        initialData={editingService}
        isSaving={isSaving}
      />
    </div>
  );
}
