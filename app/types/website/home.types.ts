// ============================================================================
// API Response Types — Public Routes Integration
// ============================================================================

export type Locale = "en" | "ar";

// ── Home Page Content ──────────────────────────────────────────────────────

export interface HeroApiResponse {
  background_image?: string;
  background_image_en?: string | null;
  background_image_ar?: string | null;
  badge?: string;
  heading?: string;
  highlight_text?: string;
  description?: string;
  license?: string;
  cta_primary?: string;
  whatsapp_number?: string;
  cta_whatsapp?: string;
}

export interface StatItemApiResponse {
  icon?: string;
  target?: number;
  suffix?: string;
  label?: string;
}

export interface StatsSectionApiResponse {
  label?: string;
  heading?: string;
  description?: string;
  items: StatItemApiResponse[];
}

export interface LicensingItemApiResponse {
  icon?: string;
  title?: string;
  desc?: string;
  tag?: string;
}

// Admin shape — includes id, sort_order, timestamps, bilingual fields
export interface AdminLicensingItemApiResponse {
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

export interface LicensingSectionApiResponse {
  label?: string;
  heading?: string;
  description?: string;
  items: LicensingItemApiResponse[];
}

export interface ProcessStepApiResponse {
  step_number?: number;
  title?: string;
  desc?: string;
}

// Admin shape — includes id, sort_order, timestamps, bilingual fields
export interface AdminProcessStepApiResponse {
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

export interface ProcessSectionApiResponse {
  label?: string;
  heading?: string;
  description?: string;
  items: ProcessStepApiResponse[];
}

export interface SectionHeaderApiResponse {
  label?: string;
  heading?: string;
  description?: string;
}

export interface HomePageContentApiResponse {
  hero: HeroApiResponse;
  stats: StatsSectionApiResponse;
  licensing: LicensingSectionApiResponse;
  process: ProcessSectionApiResponse;
  services_header: SectionHeaderApiResponse;
  countries_header: SectionHeaderApiResponse;
}

// ── Services ───────────────────────────────────────────────────────────────

export interface PublicServiceApiResponse {
  id: number;
  icon?: string;
  title?: string;
  desc?: string;
  button_label?: string;
  metric_value?: string;
  metric_suffix?: string;
  metric_label?: string;
}

// ── Countries ──────────────────────────────────────────────────────────────

export type CountryRegion = "asia" | "africa";

export interface PublicCountryApiResponse {
  id: number;
  flag_emoji?: string;
  name?: string;
  specialty?: string;
  region?: CountryRegion;
  workers_label?: string;
}

// ── Contact Form ───────────────────────────────────────────────────────────

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  country: string;
  message: string;
}

export interface ContactFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  country?: string;
  message?: string;
}

export type ContactMessageStatus = "new" | "read" | "replied" | "archived";

export interface CreateContactMessagePayload {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  country?: string;
  message?: string;
}

export interface ContactMessageApiResponse {
  id: number;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  country?: string;
  message?: string;
  status: ContactMessageStatus;
  createdAt: string;
}

// ── Error ──────────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
