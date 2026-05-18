// ============================================================================
// Auth Types — Login, User, Session
// ============================================================================

export interface LoginPayload {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  role: "admin" | "user";
  isEmailVerified: boolean;
}

export interface LoginResponse {
  user: User;
  message: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}
