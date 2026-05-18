"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  loginUser,
  getCurrentUser,
  logoutUser,
} from "@/app/helpers/api/authApi";
import type { User, LoginPayload } from "@/app/types/website/login.types";
import { toast } from "sonner";
import en from "@/translations/en.json";
import ar from "@/translations/ar.json";

///////////////////////////////////////////////////////////////////////
/////////////// Auth Context — httpOnly cookie based //////////////////
/////////////// No token stored in JS memory / localStorage ///////////
///////////////////////////////////////////////////////////////////////

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getLoginMessages(locale: string) {
  const messages = locale === "en" ? en : ar;
  const login = (messages as Record<string, unknown>).login as Record<
    string,
    unknown
  >;
  return login;
}

export function AuthProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: string;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  /////////////////////////////////////////////////////////////////////
  ///////////// Check existing session on mount ///////////////////////
  ///////////// setState calls run asynchronously via promise /////////
  /////////////////////////////////////////////////////////////////////

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  /////////////////////////////////////////////////////////////////////
  ///////////// Login — backend sets httpOnly cookie //////////////////
  /////////////////////////////////////////////////////////////////////

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await loginUser(payload);
      setUser(response.user);

      // Resolve translated toast message + personalize with user name
      const loginMsgs = getLoginMessages(locale);
      const successMsg = (loginMsgs.success as Record<string, string>).loggedIn;
      toast.success(successMsg.replace("{name}", response.user.name));

      router.push(`/${locale}/admin`);
    },
    [locale, router],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Logout — backend clears httpOnly cookie ///////////////
  /////////////////////////////////////////////////////////////////////

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      router.push(`/${locale}/login`);
    }
  }, [locale, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
