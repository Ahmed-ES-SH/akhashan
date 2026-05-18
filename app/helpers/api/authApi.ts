import { api } from "./apiClient";
import type {
  User,
  LoginPayload,
  LoginResponse,
} from "@/app/types/website/login.types";

///////////////////////////////////////////////////////////////////////
/////////////// Auth API — all requests use credentials: "include" ////
/////////////// Backend manages the httpOnly cookie ///////////////////
///////////////////////////////////////////////////////////////////////

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return api.post<LoginResponse, LoginPayload>(
    "/auth/login",
    payload,
    undefined,
    true,
  );
}

export async function getCurrentUser(): Promise<User> {
  return api.get<User>("/auth/current-user", undefined, true);
}

export async function logoutUser(): Promise<void> {
  return api.post<void, Record<string, never>>(
    "/auth/logout",
    {},
    undefined,
    true,
  );
}

export async function checkSession(): Promise<User | null> {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}
