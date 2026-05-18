import { api } from "./apiClient";
import type {
  AdminHomePageContent,
  AdminHomeContentUpdatePayload,
  AdminStatItem,
  AdminCreateStatItemPayload,
  AdminUpdateStatItemPayload,
  AdminReorderPayload,
  AdminLicensingItem,
  AdminCreateLicensingItemPayload,
  AdminUpdateLicensingItemPayload,
  AdminSingleReorderPayload,
  AdminProcessStep,
  AdminCreateProcessStepPayload,
  AdminUpdateProcessStepPayload,
  AdminService,
  AdminCreateServicePayload,
  AdminUpdateServicePayload,
  AdminPaginatedServicesResponse,
  AdminContactMessage,
  AdminPaginatedMessagesResponse,
  AdminUpdateMessageStatusPayload,
  AdminCountry,
  AdminPaginatedCountriesResponse,
  AdminCreateCountryPayload,
  AdminUpdateCountryPayload,
  AdminSubscriptionResponse,
  AdminUpdateSubscriptionPayload,
} from "@/app/types/website/admin.types";

///////////////////////////////////////////////////////////////////////
///////////// Admin API — httpOnly cookie based auth /////////////////
///////////// All requests use credentials: "include" ////////////////
///////////////////////////////////////////////////////////////////////

export async function adminGetHomeContent(): Promise<AdminHomePageContent> {
  return api.get<AdminHomePageContent>(
    "/api/admin/home-page-content",
    undefined,
    true,
  );
}

export async function adminUpdateHomeContent(
  data: AdminHomeContentUpdatePayload,
): Promise<AdminHomePageContent> {
  return api.put<AdminHomePageContent, AdminHomeContentUpdatePayload>(
    "/api/admin/home-page-content",
    data,
    true,
  );
}

///////////////////////////////////////////////////////////////////////
/////////// Image upload helper — hero background images /////////////
///////////////////////////////////////////////////////////////////////

export interface HeroImageUploadResponse {
  imageUrl_en?: string;
  imageUrl_ar?: string;
}

export async function adminUploadHeroImages(
  fileEn?: File | null,
  fileAr?: File | null,
): Promise<HeroImageUploadResponse> {
  const formData = new FormData();
  if (fileEn) formData.append("image_en", fileEn);
  if (fileAr) formData.append("image_ar", fileAr);

  return api.post<HeroImageUploadResponse>(
    "/api/admin/home-page-content/upload",
    formData as unknown as Record<string, unknown>,
    undefined,
    true,
    true,
  );
}

///////////////////////////////////////////////////////////////////////
///////////// Stat Items CRUD — dedicated endpoints ////////////////
///////////////////////////////////////////////////////////////////////

export async function adminGetStatItems(): Promise<AdminStatItem[]> {
  return api.get<AdminStatItem[]>("/api/admin/stat-items", undefined, true);
}

export async function adminCreateStatItem(
  data: AdminCreateStatItemPayload,
): Promise<AdminStatItem> {
  return api.post<AdminStatItem, AdminCreateStatItemPayload>(
    "/api/admin/stat-items",
    data,
    undefined,
    true,
  );
}

export async function adminUpdateStatItem(
  id: number,
  data: AdminUpdateStatItemPayload,
): Promise<AdminStatItem> {
  return api.put<AdminStatItem, AdminUpdateStatItemPayload>(
    `/api/admin/stat-items/${id}`,
    data,
    true,
  );
}

export async function adminDeleteStatItem(id: number): Promise<void> {
  return api.delete<void>(`/api/admin/stat-items/${id}`, true);
}

export async function adminReorderStatItems(
  ids: number[],
): Promise<AdminStatItem[]> {
  return api.patch<AdminStatItem[], AdminReorderPayload>(
    "/api/admin/stat-items/reorder",
    { ids },
    true,
  );
}

///////////////////////////////////////////////////////////////////////
/////////// Licensing Items CRUD — dedicated endpoints //////////////
///////////////////////////////////////////////////////////////////////

export async function adminGetLicensingItems(): Promise<AdminLicensingItem[]> {
  return api.get<AdminLicensingItem[]>(
    "/api/admin/licensing-items",
    undefined,
    true,
  );
}

export async function adminCreateLicensingItem(
  data: AdminCreateLicensingItemPayload,
): Promise<AdminLicensingItem> {
  return api.post<AdminLicensingItem, AdminCreateLicensingItemPayload>(
    "/api/admin/licensing-items",
    data,
    undefined,
    true,
  );
}

export async function adminUpdateLicensingItem(
  id: number,
  data: AdminUpdateLicensingItemPayload,
): Promise<AdminLicensingItem> {
  return api.put<AdminLicensingItem, AdminUpdateLicensingItemPayload>(
    `/api/admin/licensing-items/${id}`,
    data,
    true,
  );
}

export async function adminDeleteLicensingItem(id: number): Promise<void> {
  return api.delete<void>(`/api/admin/licensing-items/${id}`, true);
}

export async function adminReorderLicensingItems(
  ids: number[],
): Promise<AdminLicensingItem[]> {
  return api.patch<AdminLicensingItem[], AdminReorderPayload>(
    "/api/admin/licensing-items/reorder",
    { ids },
    true,
  );
}

export async function adminSingleReorderLicensingItem(
  id: number,
  sort_order: number,
): Promise<AdminLicensingItem> {
  return api.patch<AdminLicensingItem, AdminSingleReorderPayload>(
    `/api/admin/licensing-items/${id}/reorder`,
    { sort_order },
    true,
  );
}

///////////////////////////////////////////////////////////////////////
/////////// Process Steps CRUD — dedicated endpoints //////////////
///////////////////////////////////////////////////////////////////////

export async function adminGetProcessSteps(): Promise<AdminProcessStep[]> {
  return api.get<AdminProcessStep[]>(
    "/api/admin/process-steps",
    undefined,
    true,
  );
}

export async function adminCreateProcessStep(
  data: AdminCreateProcessStepPayload,
): Promise<AdminProcessStep> {
  return api.post<AdminProcessStep, AdminCreateProcessStepPayload>(
    "/api/admin/process-steps",
    data,
    undefined,
    true,
  );
}

export async function adminUpdateProcessStep(
  id: number,
  data: AdminUpdateProcessStepPayload,
): Promise<AdminProcessStep> {
  return api.put<AdminProcessStep, AdminUpdateProcessStepPayload>(
    `/api/admin/process-steps/${id}`,
    data,
    true,
  );
}

export async function adminDeleteProcessStep(id: number): Promise<void> {
  return api.delete<void>(`/api/admin/process-steps/${id}`, true);
}

export async function adminReorderProcessSteps(
  ids: number[],
): Promise<AdminProcessStep[]> {
  return api.patch<AdminProcessStep[], AdminReorderPayload>(
    "/api/admin/process-steps/reorder",
    { ids },
    true,
  );
}

export async function adminSingleReorderProcessStep(
  id: number,
  sort_order: number,
): Promise<AdminProcessStep> {
  return api.patch<AdminProcessStep, AdminSingleReorderPayload>(
    `/api/admin/process-steps/${id}/reorder`,
    { sort_order },
    true,
  );
}

///////////////////////////////////////////////////////////////////////
///////////// Services CRUD — dedicated endpoints ///////////////////
///////////////////////////////////////////////////////////////////////

export async function adminGetServices(
  page: number = 1,
  limit: number = 20,
): Promise<AdminPaginatedServicesResponse> {
  return api.get<AdminPaginatedServicesResponse>(
    `/api/admin/services?page=${page}&limit=${limit}`,
    undefined,
    true,
  );
}

export async function adminCreateService(
  data: AdminCreateServicePayload,
): Promise<AdminService> {
  return api.post<AdminService, AdminCreateServicePayload>(
    "/api/admin/services",
    data,
    undefined,
    true,
  );
}

export async function adminUpdateService(
  id: number,
  data: AdminUpdateServicePayload,
): Promise<AdminService> {
  return api.put<AdminService, AdminUpdateServicePayload>(
    `/api/admin/services/${id}`,
    data,
    true,
  );
}

export async function adminDeleteService(id: number): Promise<void> {
  return api.delete<void>(`/api/admin/services/${id}`, true);
}

export async function adminToggleServiceActive(
  id: number,
): Promise<AdminService> {
  return api.patch<AdminService>(`/api/admin/services/${id}/toggle`, {}, true);
}

export async function adminReorderServices(
  ids: number[],
): Promise<AdminService[]> {
  return api.patch<AdminService[], AdminReorderPayload>(
    "/api/admin/services/reorder",
    { ids },
    true,
  );
}

export async function adminSingleReorderService(
  id: number,
  sort_order: number,
): Promise<AdminService> {
  return api.patch<AdminService, AdminSingleReorderPayload>(
    `/api/admin/services/${id}/reorder`,
    { sort_order },
    true,
  );
}

///////////////////////////////////////////////////////////////////////
/////////// Contact Messages — admin inbox CRUD ///////////////////
///////////////////////////////////////////////////////////////////////

export async function adminGetContactMessages(
  page: number = 1,
  limit: number = 20,
  status?: "new" | "read" | "replied" | "archived",
): Promise<AdminPaginatedMessagesResponse> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (status) params.set("status", status);

  return api.get<AdminPaginatedMessagesResponse>(
    `/api/admin/contact-messages?${params.toString()}`,
    undefined,
    true,
  );
}

export async function adminGetContactMessage(
  id: number,
): Promise<AdminContactMessage> {
  return api.get<AdminContactMessage>(
    `/api/admin/contact-messages/${id}`,
    undefined,
    true,
  );
}

export async function adminUpdateMessageStatus(
  id: number,
  status: "new" | "read" | "replied" | "archived",
): Promise<AdminContactMessage> {
  return api.patch<AdminContactMessage, AdminUpdateMessageStatusPayload>(
    `/api/admin/contact-messages/${id}/status`,
    { status },
    true,
  );
}

export async function adminDeleteContactMessage(id: number): Promise<void> {
  return api.delete<void>(`/api/admin/contact-messages/${id}`, true);
}

///////////////////////////////////////////////////////////////////////
///////////// Countries CRUD — dedicated endpoints ///////////////////
///////////////////////////////////////////////////////////////////////

export async function adminGetCountries(
  page: number = 1,
  limit: number = 20,
): Promise<AdminPaginatedCountriesResponse> {
  return api.get<AdminPaginatedCountriesResponse>(
    `/api/admin/countries?page=${page}&limit=${limit}`,
    undefined,
    true,
  );
}

export async function adminCreateCountry(
  data: AdminCreateCountryPayload,
): Promise<AdminCountry> {
  return api.post<AdminCountry, AdminCreateCountryPayload>(
    "/api/admin/countries",
    data,
    undefined,
    true,
  );
}

export async function adminUpdateCountry(
  id: number,
  data: AdminUpdateCountryPayload,
): Promise<AdminCountry> {
  return api.put<AdminCountry, AdminUpdateCountryPayload>(
    `/api/admin/countries/${id}`,
    data,
    true,
  );
}

export async function adminDeleteCountry(id: number): Promise<void> {
  return api.delete<void>(`/api/admin/countries/${id}`, true);
}

export async function adminToggleCountryActive(
  id: number,
): Promise<AdminCountry> {
  return api.patch<AdminCountry>(`/api/admin/countries/${id}/toggle`, {}, true);
}

export async function adminReorderCountries(
  ids: number[],
): Promise<AdminCountry[]> {
  return api.patch<AdminCountry[], AdminReorderPayload>(
    "/api/admin/countries/reorder",
    { ids },
    true,
  );
}

export async function adminSingleReorderCountry(
  id: number,
  sort_order: number,
): Promise<AdminCountry> {
  return api.patch<AdminCountry, AdminSingleReorderPayload>(
    `/api/admin/countries/${id}/reorder`,
    { sort_order },
    true,
  );
}

// ── Subscription expiry endpoints ──────────────────────────────────────

export async function adminGetSubscription(): Promise<AdminSubscriptionResponse> {
  return api.get<AdminSubscriptionResponse>(
    "/api/admin/hosting-config",
    undefined,
    true,
  );
}

export async function adminUpdateSubscription(
  data: AdminUpdateSubscriptionPayload,
): Promise<AdminSubscriptionResponse> {
  return api.put<AdminSubscriptionResponse, AdminUpdateSubscriptionPayload>(
    "/api/admin/hosting-config",
    data,
    true,
  );
}
