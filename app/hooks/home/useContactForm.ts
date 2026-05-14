"use client";

import { useState, useCallback } from "react";
import type { ContactFormData, ContactFormErrors } from "@/app/types/website/home.types";

const initial: ContactFormData = {
  name: "",
  email: "",
  phone: "",
  service: "",
  country: "",
  message: "",
};

export function useContactForm(t: any, locale: "en" | "ar") {
  const [formData, setFormData] = useState<ContactFormData>(initial);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const msg = (key: string) =>
    t?.contact?.form?.validation?.[key]?.[locale] ?? "";

  const updateField = useCallback(
    (field: keyof ContactFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [],
  );

  const validate = useCallback((): ContactFormErrors => {
    const e: ContactFormErrors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2)
      e.name = msg("nameRequired");
    if (!formData.email.trim()) e.email = msg("emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = msg("emailInvalid");
    if (!formData.phone.trim()) e.phone = msg("phoneRequired");
    if (!formData.service) e.service = msg("serviceRequired");
    if (!formData.country) e.country = msg("countryRequired");
    return e;
  }, [formData, locale]);

  const submit = useCallback(async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return false;

    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("submit failed");
      setStatus("success");
      setFormData(initial);
      return true;
    } catch {
      setStatus("error");
      return false;
    }
  }, [formData, validate]);

  const resetStatus = useCallback(() => setStatus("idle"), []);

  return { formData, errors, status, updateField, submit, resetStatus };
}
