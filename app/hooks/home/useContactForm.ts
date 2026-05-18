"use client";

import { useState, useCallback, useEffect } from "react";
import { submitContactForm } from "@/app/helpers/api/publicApi";
import { ApiError } from "@/app/helpers/api/apiClient";
import type {
  ContactFormData,
  ContactFormErrors,
  Locale,
} from "@/app/types/website/home.types";

/////////////////////////////////////////////////////////////////////
///////////// Translation helper type /////////////////////////////////
/////////////////////////////////////////////////////////////////////

interface TranslationStrings {
  contact?: {
    form?: {
      validation?: Record<string, Record<Locale, string>>;
      rateLimit?: Record<Locale, string>;
    };
  };
}

const initial: ContactFormData = {
  name: "",
  email: "",
  phone: "",
  service: "",
  country: "",
  message: "",
};

/////////////////////////////////////////////////////////////////////
///////////// Auto-reset delay for success state (ms) ///////////////
/////////////////////////////////////////////////////////////////////

const SUCCESS_RESET_DELAY_MS = 5000;

export function useContactForm(
  t: TranslationStrings,
  locale: Locale,
) {
  const [formData, setFormData] = useState<ContactFormData>(initial);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "rateLimited"
  >("idle");

  const msg = useCallback(
    (key: string): string =>
      t?.contact?.form?.validation?.[key]?.[locale] ?? "",
    [t, locale],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Auto-reset success state after delay //////////////////
  /////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (status !== "success") return;

    const timer = setTimeout(() => {
      setStatus("idle");
    }, SUCCESS_RESET_DELAY_MS);

    return () => clearTimeout(timer);
  }, [status]);

  const updateField = useCallback(
    (field: keyof ContactFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      if (status === "error" || status === "rateLimited") {
        setStatus("idle");
      }
    },
    [status],
  );

  const validate = useCallback((): ContactFormErrors => {
    const e: ContactFormErrors = {};
    const msgFn = msg;
    if (!formData.name.trim() || formData.name.trim().length < 2)
      e.name = msgFn("nameRequired");
    if (!formData.email.trim()) e.email = msgFn("emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = msgFn("emailInvalid");
    // phone, service, country are optional per API spec — skip validation
    return e;
  }, [formData, msg]);

  ///////////////////////////////////////////////////////////////////////
  /////////////// Map backend validation errors to field errors /////////
  ///////////////////////////////////////////////////////////////////////

  const mapBackendErrors = useCallback(
    (backendMessages: string | string[]): ContactFormErrors => {
      const messages = Array.isArray(backendMessages)
        ? backendMessages
        : [backendMessages];
      const fieldErrors: ContactFormErrors = {};

      for (const message of messages) {
        const lower = message.toLowerCase();
        if (lower.includes("email")) fieldErrors.email = msg("emailInvalid");
        else if (lower.includes("name"))
          fieldErrors.name = msg("nameRequired");
        else if (lower.includes("phone"))
          fieldErrors.phone = msg("phoneRequired");
      }

      return fieldErrors;
    },
    [msg],
  );

  const submit = useCallback(async (): Promise<boolean> => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return false;

    setStatus("loading");
    try {
      // Build payload — only include non-empty optional fields
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        service: formData.service || undefined,
        country: formData.country || undefined,
        message: formData.message.trim() || undefined,
      };

      await submitContactForm(payload);
      setStatus("success");
      setFormData(initial);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setStatus("rateLimited");
          return false;
        }
        if (err.statusCode === 400) {
          const fieldErrors = mapBackendErrors(err.details);
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
          setStatus("error");
          return false;
        }
      }
      setStatus("error");
      return false;
    }
  }, [formData, validate, mapBackendErrors]);

  const resetStatus = useCallback(() => setStatus("idle"), []);

  return { formData, errors, status, updateField, submit, resetStatus };
}
