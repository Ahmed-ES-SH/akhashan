import type { ApiErrorResponse } from "@/app/types/website/home.types";

///////////////////////////////////////////////////////////////////////
/////////////// Base URL resolution — server & client safe /////////////
///////////////////////////////////////////////////////////////////////

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? "";
  }
  return process.env.API_URL ?? "";
}

///////////////////////////////////////////////////////////////////////
///////////// Resolve image URL — strips /api suffix /////////////////
///////////////////////////////////////////////////////////////////////

export function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) {
    const url = new URL(path);
    if (url.pathname.startsWith("/uploads")) {
      return url.pathname;
    }
    return path;
  }

  const baseUrl = getBaseUrl();
  const origin = baseUrl.replace(/\/api\/?$/, "");
  return `${origin}${path}`;
}

///////////////////////////////////////////////////////////////////////
/////////////// Typed API error ///////////////////////////////////////
///////////////////////////////////////////////////////////////////////

export class ApiError extends Error {
  statusCode: number;
  details: string | string[];

  constructor(statusCode: number, message: string | string[]) {
    super(Array.isArray(message) ? message.join(", ") : message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = message;
  }
}

///////////////////////////////////////////////////////////////////////
/////////////// Core request helper ///////////////////////////////////
///////////////////////////////////////////////////////////////////////

interface RequestConfig<B = Record<string, unknown>> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: B;
  locale?: string;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  withCredentials?: boolean;
  isFormData?: boolean;
}

async function request<T, B = Record<string, unknown>>(
  path: string,
  config: RequestConfig<B> = {},
): Promise<T> {
  const { method = "GET", body, locale, cache, next, withCredentials, isFormData } = config;

  const url = new URL(path, getBaseUrl());
  if (locale) url.searchParams.set("locale", locale);

  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const fetchInit: RequestInit = {
    method,
    headers,
    cache,
    next,
    credentials: withCredentials ? "include" : "same-origin",
  };

  if (body) {
    fetchInit.body = isFormData ? (body as unknown as FormData) : JSON.stringify(body);
  }

  const res = await fetch(url.toString(), fetchInit);

  // 2xx — success
  if (res.ok) {
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
  }

  // Error responses
  let errorBody: ApiErrorResponse;
  try {
    errorBody = (await res.json()) as ApiErrorResponse;
  } catch {
    errorBody = {
      statusCode: res.status,
      message: res.statusText,
      error: "Unknown",
    };
  }

  throw new ApiError(errorBody.statusCode, errorBody.message);
}

///////////////////////////////////////////////////////////////////////
/////////////// Exported helpers //////////////////////////////////////
///////////////////////////////////////////////////////////////////////

export const api = {
  get: <T>(path: string, locale?: string, withCredentials?: boolean) =>
    request<T>(path, { method: "GET", locale, withCredentials }),

  post: <T, B = Record<string, unknown>>(
    path: string,
    body: B,
    locale?: string,
    withCredentials?: boolean,
    isFormData?: boolean,
  ) => request<T, B>(path, { method: "POST", body, locale, withCredentials, isFormData }),

  put: <T, B = Record<string, unknown>>(
    path: string,
    body: B,
    withCredentials?: boolean,
  ) => request<T, B>(path, { method: "PUT", body, withCredentials }),

  patch: <T, B = Record<string, unknown>>(
    path: string,
    body: B,
    withCredentials?: boolean,
  ) => request<T, B>(path, { method: "PATCH", body, withCredentials }),

  delete: <T>(path: string, withCredentials?: boolean) =>
    request<T>(path, { method: "DELETE", withCredentials }),
};
