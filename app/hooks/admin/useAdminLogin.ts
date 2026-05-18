"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import type { LoginPayload } from "@/app/types/website/login.types";

///////////////////////////////////////////////////////////////////////
/////////////// Admin Login hook — wraps AuthContext login ////////////
///////////////////////////////////////////////////////////////////////

export function useAdminLogin() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const payload: LoginPayload = { email, password };
        await login(payload);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "login.errors.serverError",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [login],
  );

  return {
    login: handleLogin,
    isLoading,
    error,
  };
}
