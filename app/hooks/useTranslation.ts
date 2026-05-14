"use client";

import { useParams } from "next/navigation";
import ar from "@/translations/ar.json";
import en from "@/translations/en.json";

// Get language type
type Locale = "ar" | "en";

// Infer translation type from your JSON
type Messages = typeof ar;

// Get all top-level namespaces (like "mainMeta", "home", ...)
type Namespace = keyof Messages;

// Main Hook
export function useTranslation<N extends Namespace>(namespace: N) {
  const params = useParams();
  const locale = (params?.locale as Locale) ?? "en";

  // Select the correct translation file
  const messages: Messages = locale === "en" ? en : ar;

  // Return the specific namespace object
  return messages[namespace];
}
