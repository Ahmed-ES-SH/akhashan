"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import type { LoginPayload } from "@/app/types/website/login.types";

///////////////////////////////////////////////////////////////////////
/////////////// Login Form Hook — state, validation, submission ///////
///////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////
/////////////// Error codes returned by validation ///////////////////
/////////////// LoginForm resolves them via useTranslation ///////////
/////////////////////////////////////////////////////////////////////

type FieldErrorCode = "required" | "invalidEmail" | "invalidPassword";
type ServerErrorCode = "unauthorized" | "rateLimited" | "serverError";

interface UseLoginReturn {
  email: string;
  password: string;
  error: string | null;
  isSubmitting: boolean;
  fieldErrors: { email?: FieldErrorCode; password?: FieldErrorCode };
  setEmail: (val: string) => void;
  setPassword: (val: string) => void;
  handleSubmit: () => Promise<void>;
  clearError: () => void;
}

function validateEmail(email: string): FieldErrorCode | null {
  if (!email.trim()) return "required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return "invalidEmail";
  return null;
}

function validatePassword(password: string): FieldErrorCode | null {
  if (!password) return "required";
  if (password.length < 8) return "invalidPassword";
  return null;
}

export function useLogin(): UseLoginReturn {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: FieldErrorCode;
    password?: FieldErrorCode;
  }>({});

  const clearError = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  const handleSubmit = useCallback(async () => {
    clearError();

    // Validate
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setFieldErrors({
        email: emailError ?? undefined,
        password: passwordError ?? undefined,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: LoginPayload = {
        email: email.trim(),
        password,
      };
      await login(payload);
    } catch (err: unknown) {
      // Use the backend message if it's a known key, otherwise default to "serverError"
      const message =
        err instanceof Error ? err.message : "serverError";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, login, clearError]);

  return {
    email,
    password,
    error,
    isSubmitting,
    fieldErrors,
    setEmail,
    setPassword,
    handleSubmit,
    clearError,
  };
}
