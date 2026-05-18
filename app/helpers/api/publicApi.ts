import { api } from "./apiClient";
import type {
  Locale,
  HomePageContentApiResponse,
  PublicServiceApiResponse,
  PublicCountryApiResponse,
  CreateContactMessagePayload,
  ContactMessageApiResponse,
} from "@/app/types/website/home.types";

///////////////////////////////////////////////////////////////////////
/////////////// Endpoint 1 — Home Page Content ////////////////////////
///////////////////////////////////////////////////////////////////////

export async function fetchHomePageContent(
  locale: Locale = "en",
): Promise<HomePageContentApiResponse> {
  return api.get<HomePageContentApiResponse>(
    "/api/home-page-content",
    locale,
  );
}

///////////////////////////////////////////////////////////////////////
/////////////// Endpoint 2 — Active Services //////////////////////////
///////////////////////////////////////////////////////////////////////

export async function fetchServices(
  locale: Locale = "en",
): Promise<PublicServiceApiResponse[]> {
  return api.get<PublicServiceApiResponse[]>("/api/services", locale);
}

///////////////////////////////////////////////////////////////////////
/////////////// Endpoint 3 — Active Countries /////////////////////////
///////////////////////////////////////////////////////////////////////

export async function fetchCountries(
  locale: Locale = "en",
): Promise<PublicCountryApiResponse[]> {
  return api.get<PublicCountryApiResponse[]>("/api/countries", locale);
}

///////////////////////////////////////////////////////////////////////
/////////////// Endpoint 4 — Submit Contact Form /////////////////////
///////////////////////////////////////////////////////////////////////

export async function submitContactForm(
  data: CreateContactMessagePayload,
): Promise<ContactMessageApiResponse> {
  return api.post<ContactMessageApiResponse, CreateContactMessagePayload>(
    "/api/contact",
    data,
  );
}
