"use client";

import { useAuth } from "@/app/contexts/AuthContext";

///////////////////////////////////////////////////////////////////////
/////////////// Admin Auth hook — wraps AuthContext ///////////////////
///////////////////////////////////////////////////////////////////////

export function useAdminAuth() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
  };
}
