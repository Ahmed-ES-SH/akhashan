// ============================================================================
// Admin Types — Shared admin panel types
// ============================================================================

export type ContactMessageStatus = "new" | "read" | "replied" | "archived";

// ── Home Page Content (raw backend shape — bilingual) ──────────────────────

export interface AdminHomePageContent {
  id: number;
  hero_background_image_en: string | null;
  hero_background_image_ar: string | null;
  hero_badge_en: string;
  hero_badge_ar: string;
  hero_heading_en: string;
  hero_heading_ar: string;
  hero_highlight_text_en: string;
  hero_highlight_text_ar: string;
  hero_description_en: string;
  hero_description_ar: string;
  hero_license_en: string;
  hero_license_ar: string;
  hero_cta_primary_en: string;
  hero_cta_primary_ar: string;
  hero_whatsapp_number: string;
  hero_cta_whatsapp_en: string;
  hero_cta_whatsapp_ar: string;
  // Stats section bilingual fields
  stats_label_en: string;
  stats_label_ar: string;
  stats_heading_en: string;
  stats_heading_ar: string;
  stats_description_en: string;
  stats_description_ar: string;
  // Licensing section bilingual fields
  licensing_label_en: string;
  licensing_label_ar: string;
  licensing_heading_en: string;
  licensing_heading_ar: string;
  licensing_description_en: string;
  licensing_description_ar: string;
  // Process section bilingual fields
  process_label_en: string;
  process_label_ar: string;
  process_heading_en: string;
  process_heading_ar: string;
  process_description_en: string;
  process_description_ar: string;
  // Child items (future CRUD phases)
  licensingItems: AdminLicensingItem[];
  processSteps: AdminProcessStep[];
  createdAt: string;
  updatedAt: string;
}

// ── Licensing Item — admin API response shape (full entity) ──────────────

export interface AdminLicensingItem {
  id: number;
  icon: string | null;
  title_en: string | null;
  title_ar: string | null;
  desc_en: string | null;
  desc_ar: string | null;
  tag_en: string | null;
  tag_ar: string | null;
  sort_order: number;
  homePageContentId: number;
  createdAt: string;
  updatedAt: string;
}

// ── Licensing Item — create payload ──────────────────────────────────────

export interface AdminCreateLicensingItemPayload {
  icon?: string;
  title_en?: string;
  title_ar?: string;
  desc_en?: string;
  desc_ar?: string;
  tag_en?: string;
  tag_ar?: string;
  sort_order?: number;
  homePageContentId?: number;
}

// ── Licensing Item — update payload (all optional) ───────────────────────

export type AdminUpdateLicensingItemPayload =
  Partial<AdminCreateLicensingItemPayload>;

// ── Licensing Item — single item reorder payload ─────────────────────────

export interface AdminSingleReorderPayload {
  sort_order: number;
}

// ── Process Step — admin API response shape (full entity) ──────────────

export interface AdminProcessStep {
  id: number;
  step_number: number;
  title_en: string | null;
  title_ar: string | null;
  desc_en: string | null;
  desc_ar: string | null;
  sort_order: number;
  homePageContentId: number;
  createdAt: string;
  updatedAt: string;
}

// ── Process Step — create payload ──────────────────────────────────────

export interface AdminCreateProcessStepPayload {
  step_number: number;
  title_en?: string;
  title_ar?: string;
  desc_en?: string;
  desc_ar?: string;
  sort_order?: number;
  homePageContentId?: number;
}

// ── Process Step — update payload (all optional) ───────────────────────

export type AdminUpdateProcessStepPayload = Partial<AdminCreateProcessStepPayload>;

// ── Update payload — Partial is fine, only send changed fields ─────────────

export type AdminHomeContentUpdatePayload = Partial<{
  hero_background_image_en: string | null;
  hero_background_image_ar: string | null;
  hero_badge_en: string;
  hero_badge_ar: string;
  hero_heading_en: string;
  hero_heading_ar: string;
  hero_highlight_text_en: string;
  hero_highlight_text_ar: string;
  hero_description_en: string;
  hero_description_ar: string;
  hero_license_en: string;
  hero_license_ar: string;
  hero_cta_primary_en: string;
  hero_cta_primary_ar: string;
  hero_whatsapp_number: string;
  hero_cta_whatsapp_en: string;
  hero_cta_whatsapp_ar: string;
  // Stats section fields
  stats_label_en: string;
  stats_label_ar: string;
  stats_heading_en: string;
  stats_heading_ar: string;
  stats_description_en: string;
  stats_description_ar: string;
  // Licensing section fields
  licensing_label_en: string;
  licensing_label_ar: string;
  licensing_heading_en: string;
  licensing_heading_ar: string;
  licensing_description_en: string;
  licensing_description_ar: string;
  // Process section fields
  process_label_en: string;
  process_label_ar: string;
  process_heading_en: string;
  process_heading_ar: string;
  process_description_en: string;
  process_description_ar: string;
}>;

// ── UI field mapping — maps UI keys to bilingual API keys ──────────────────

export const HERO_FIELD_API_MAP: Record<
  string,
  { en: string; ar: string } | string
> = {
  background_image: { en: "hero_background_image_en", ar: "hero_background_image_ar" },
  badge: { en: "hero_badge_en", ar: "hero_badge_ar" },
  heading: { en: "hero_heading_en", ar: "hero_heading_ar" },
  highlight_text: { en: "hero_highlight_text_en", ar: "hero_highlight_text_ar" },
  description: { en: "hero_description_en", ar: "hero_description_ar" },
  license: { en: "hero_license_en", ar: "hero_license_ar" },
  cta_primary: { en: "hero_cta_primary_en", ar: "hero_cta_primary_ar" },
  cta_whatsapp: { en: "hero_cta_whatsapp_en", ar: "hero_cta_whatsapp_ar" },
  whatsapp_number: "hero_whatsapp_number",
};

// ── Stats section field mapping ────────────────────────────────────────────

export const STATS_FIELD_API_MAP: Record<
  string,
  { en: string; ar: string } | string
> = {
  label: { en: "stats_label_en", ar: "stats_label_ar" },
  heading: { en: "stats_heading_en", ar: "stats_heading_ar" },
  description: { en: "stats_description_en", ar: "stats_description_ar" },
};

// ── Licensing section field mapping ────────────────────────────────────────

export const LICENSING_FIELD_API_MAP: Record<
  string,
  { en: string; ar: string } | string
> = {
  label: { en: "licensing_label_en", ar: "licensing_label_ar" },
  heading: { en: "licensing_heading_en", ar: "licensing_heading_ar" },
  description: { en: "licensing_description_en", ar: "licensing_description_ar" },
};

// ── Process section field mapping ──────────────────────────────────────────

export const PROCESS_FIELD_API_MAP: Record<
  string,
  { en: string; ar: string } | string
> = {
  label: { en: "process_label_en", ar: "process_label_ar" },
  heading: { en: "process_heading_en", ar: "process_heading_ar" },
  description: { en: "process_description_en", ar: "process_description_ar" },
};

///////////////////////////////////////////////////////////////////////
/////////////// Stat Item types — admin API contract /////////////////
///////////////////////////////////////////////////////////////////////

export interface AdminStatItem {
  id: number;
  icon: string;
  target: number;
  suffix: string;
  label_en: string;
  label_ar: string;
  sort_order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCreateStatItemPayload {
  icon?: string;
  target?: number;
  suffix?: string;
  label_en?: string;
  label_ar?: string;
  sort_order?: number;
  homePageContentId?: number;
}

export type AdminUpdateStatItemPayload = Partial<
  Omit<AdminCreateStatItemPayload, "homePageContentId">
>;

export interface AdminReorderPayload {
  ids: number[];
}

///////////////////////////////////////////////////////////////////////
/////////////// Child item field API maps /////////////////////////////
///////////////////////////////////////////////////////////////////////

export const STAT_ITEM_FIELD_API_MAP: Record<
  string,
  { en: string; ar: string } | string
> = {
  icon: "icon",
  target: "target",
  suffix: "suffix",
  label: { en: "label_en", ar: "label_ar" },
};

export const LICENSING_ITEM_FIELD_API_MAP: Record<
  string,
  { en: string; ar: string } | string
> = {
  title: { en: "title_en", ar: "title_ar" },
  desc: { en: "desc_en", ar: "desc_ar" },
  tag: { en: "tag_en", ar: "tag_ar" },
  icon: "icon",
};

export const PROCESS_ITEM_FIELD_API_MAP: Record<
  string,
  { en: string; ar: string }
> = {
  title: { en: "title_en", ar: "title_ar" },
  desc: { en: "desc_en", ar: "desc_ar" },
};

// ── Hero image upload response ────────────────────────────────────────

export interface HeroImageUploadResponse {
  imageUrl_en?: string;
  imageUrl_ar?: string;
}

///////////////////////////////////////////////////////////////////////
/////////////// Service types — admin API contract ///////////////////
///////////////////////////////////////////////////////////////////////

// Admin Service — full entity shape from backend
export interface AdminService {
  id: number;
  icon: string | null;
  title_en: string | null;
  title_ar: string | null;
  desc_en: string | null;
  desc_ar: string | null;
  button_label_en: string | null;
  button_label_ar: string | null;
  metric_value: string | null;
  metric_suffix: string | null;
  metric_label_en: string | null;
  metric_label_ar: string | null;
  is_active: boolean;
  sort_order: number;
  createdAt: string;
  updatedAt: string;
}

// Pagination metadata for services
export interface AdminServiceMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Paginated response from GET /api/admin/services
export interface AdminPaginatedServicesResponse {
  data: AdminService[];
  meta: AdminServiceMeta;
}

// Create payload (all fields optional)
export interface AdminCreateServicePayload {
  icon?: string;
  title_en?: string;
  title_ar?: string;
  desc_en?: string;
  desc_ar?: string;
  button_label_en?: string;
  button_label_ar?: string;
  metric_value?: string;
  metric_suffix?: string;
  metric_label_en?: string;
  metric_label_ar?: string;
  is_active?: boolean;
  sort_order?: number;
}

// Update payload (all optional)
export type AdminUpdateServicePayload = Partial<AdminCreateServicePayload>;

// Service field API map for inline editing
export const SERVICE_FIELD_API_MAP: Record<
  string,
  { en: string; ar: string } | string
> = {
  title: { en: "title_en", ar: "title_ar" },
  desc: { en: "desc_en", ar: "desc_ar" },
  button_label: { en: "button_label_en", ar: "button_label_ar" },
  metric_label: { en: "metric_label_en", ar: "metric_label_ar" },
  icon: "icon",
  metric_value: "metric_value",
  metric_suffix: "metric_suffix",
};

// ── Contact Messages — admin API contract ──────────────────────────────

// Admin Contact Message — full entity shape from backend
export interface AdminContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  country: string | null;
  message: string | null;
  status: "new" | "read" | "replied" | "archived";
  createdAt: string;
  updatedAt: string;
}

// Pagination metadata for contact messages
export interface AdminContactMessageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Paginated response from GET /api/admin/contact-messages
export interface AdminPaginatedMessagesResponse {
  data: AdminContactMessage[];
  meta: AdminContactMessageMeta;
}

// Update status payload
export interface AdminUpdateMessageStatusPayload {
  status: "new" | "read" | "replied" | "archived";
}

///////////////////////////////////////////////////////////////////////
///////////// Country types — admin API contract /////////////////////
///////////////////////////////////////////////////////////////////////

// Region type matching backend enum values
export type CountryRegion = "asia" | "africa";

// Admin Country — full entity shape from backend
export interface AdminCountry {
  id: number;
  flag_emoji: string | null;
  name_en: string | null;
  name_ar: string | null;
  specialty: string | null;
  region: CountryRegion | null;
  workers_label: string | null;
  is_active: boolean;
  sort_order: number;
  createdAt: string;
  updatedAt: string;
}

// Pagination metadata for countries
export interface AdminCountryMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Paginated response from GET /api/admin/countries
export interface AdminPaginatedCountriesResponse {
  data: AdminCountry[];
  meta: AdminCountryMeta;
}

// Create payload (all fields optional)
export interface AdminCreateCountryPayload {
  flag_emoji?: string;
  name_en?: string;
  name_ar?: string;
  specialty?: string;
  region?: CountryRegion;
  workers_label?: string;
  is_active?: boolean;
  sort_order?: number;
}

// Update payload (all optional)
export type AdminUpdateCountryPayload = Partial<AdminCreateCountryPayload>;

// Country field API map for inline editing
export const COUNTRY_FIELD_API_MAP: Record<
  string,
  { en: string; ar: string } | string
> = {
  name: { en: "name_en", ar: "name_ar" },
  specialty: "specialty",
  flag_emoji: "flag_emoji",
  region: "region",
  workers_label: "workers_label",
};

// ── Subscription / Expiry types ────────────────────────────────────────

export interface AdminSubscriptionResponse {
  id: number;
  is_active: boolean;
  expiration_date: string;
  last_notified_at: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUpdateSubscriptionPayload {
  expiration_date: string;
}
