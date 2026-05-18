"use client";

import { useState, useEffect, useCallback } from "react";
import {
  adminGetHomeContent,
  adminUpdateHomeContent,
} from "@/app/helpers/api/adminApi";
import type {
  AdminHomePageContent,
  AdminHomeContentUpdatePayload,
} from "@/app/types/website/admin.types";
import {
  HERO_FIELD_API_MAP,
  STATS_FIELD_API_MAP,
  LICENSING_FIELD_API_MAP,
  PROCESS_FIELD_API_MAP,
} from "@/app/types/website/admin.types";
import type {
  HeroApiResponse,
  Locale,
  StatsSectionApiResponse,
  LicensingSectionApiResponse,
  ProcessSectionApiResponse,
} from "@/app/types/website/home.types";
import { toast } from "sonner";

/////////////////////////////////////////////////////////////////////
/////////////// useAdminHomeContent — fetch + batch edit ////////////
/////////////// Tracks dirty fields, saves in one PUT ///////////////
/////////////////////////////////////////////////////////////////////

interface UseAdminHomeContentProps {
  hero: HeroApiResponse;
  stats?: StatsSectionApiResponse;
  licensing?: LicensingSectionApiResponse;
  process?: ProcessSectionApiResponse;
  locale: Locale;
}

export function useAdminHomeContent(initialData: UseAdminHomeContentProps) {
  const { locale, hero, stats, licensing, process } = initialData;

  // Content state — initialized from SSR data, overwritten by admin API
  const [content, setContent] = useState<AdminHomePageContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Dirty fields tracking: API field key → new value
  const [dirtyFields, setDirtyFields] = useState<
    Record<string, string>
  >({});

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /////////////////////////////////////////////////////////////////////
  ///////////// Fetch full content from admin API on mount ////////////
  /////////////////////////////////////////////////////////////////////

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await adminGetHomeContent();
      setContent(data);
    } catch {
      // If admin API fails, we still have SSR data — just warn
      setFetchError("Failed to load editable content");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContent();
  }, [fetchContent]);

  /////////////////////////////////////////////////////////////////////
  ///////////// Map UI field key → EN / AR API field keys /////////////
  /////////////////////////////////////////////////////////////////////

  const getBilingualApiKeys = useCallback(
    (uiFieldKey: string): { en: string; ar: string } => {
      const mapping = HERO_FIELD_API_MAP[uiFieldKey];
      if (!mapping) return { en: uiFieldKey, ar: uiFieldKey };
      if (typeof mapping === "string") return { en: mapping, ar: mapping };
      return { en: mapping.en, ar: mapping.ar };
    },
    [],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Map UI field key → API field key (single locale) //////
  /////////////////////////////////////////////////////////////////////

  const getApiKey = useCallback(
    (uiFieldKey: string): string => {
      const mapping = HERO_FIELD_API_MAP[uiFieldKey];
      if (!mapping) return uiFieldKey;
      if (typeof mapping === "string") return mapping;
      return mapping[locale];
    },
    [locale],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Derive SSR section data from API key prefix ///////////
  /////////////////////////////////////////////////////////////////////

  const getSectionSsrData = useCallback(
    (apiKey: string): Record<string, string | number | undefined> => {
      if (apiKey.startsWith("stats_")) return (stats ?? {}) as Record<string, string | number | undefined>;
      if (apiKey.startsWith("licensing_")) return (licensing ?? {}) as Record<string, string | number | undefined>;
      if (apiKey.startsWith("process_")) return (process ?? {}) as Record<string, string | number | undefined>;
      return hero as Record<string, string | number | undefined>;
    },
    [hero, stats, licensing, process],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Resolve a value for a given API key ///////////////////
  ///////////// Priority: dirty → admin content → SSR fallback ///////
  /////////////////////////////////////////////////////////////////////

  const resolveApiValue = useCallback(
    (apiKey: string, uiFieldKey: string): string => {
      // 1. Dirty fields
      if (dirtyFields[apiKey] !== undefined) {
        return dirtyFields[apiKey];
      }
      // 2. Admin content (bilingual, from admin API)
      if (content) {
        const record = content as unknown as Record<string, string | null>;
        const val = record[apiKey];
        if (val !== null && val !== undefined) return val;
      }
      // 3. SSR fallback — derive section from API key prefix
      const sectionData = getSectionSsrData(apiKey);
      const sectionRecord = sectionData as unknown as Record<
        string,
        string | undefined
      >;
      return sectionRecord[uiFieldKey] ?? "";
    },
    [content, dirtyFields, getSectionSsrData],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Get current bilingual values for a UI field ///////////
  /////////////////////////////////////////////////////////////////////

  const getBilingualValue = useCallback(
    (uiFieldKey: string): { en: string; ar: string } => {
      const keys = getBilingualApiKeys(uiFieldKey);
      return {
        en: resolveApiValue(keys.en, uiFieldKey),
        ar: resolveApiValue(keys.ar, uiFieldKey),
      };
    },
    [getBilingualApiKeys, resolveApiValue],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Get the current single-locale display value ///////////
  /////////////////////////////////////////////////////////////////////

  const getFieldValue = useCallback(
    (uiFieldKey: string): string => {
      const apiKey = getApiKey(uiFieldKey);
      return resolveApiValue(apiKey, uiFieldKey);
    },
    [getApiKey, resolveApiValue],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Mark both EN + AR fields as dirty /////////////////////
  /////////////////////////////////////////////////////////////////////

  const setBilingualField = useCallback(
    (uiFieldKey: string, valueEn: string, valueAr: string) => {
      const keys = getBilingualApiKeys(uiFieldKey);
      setDirtyFields((prev) => ({
        ...prev,
        [keys.en]: valueEn,
        [keys.ar]: valueAr,
      }));
    },
    [getBilingualApiKeys],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Mark a single-locale field as dirty ///////////////////
  /////////////////////////////////////////////////////////////////////

  const setField = useCallback(
    (uiFieldKey: string, newValue: string) => {
      const apiKey = getApiKey(uiFieldKey);
      setDirtyFields((prev) => ({
        ...prev,
        [apiKey]: newValue,
      }));
    },
    [getApiKey],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Save ALL dirty fields in one PUT request //////////////
  /////////////////////////////////////////////////////////////////////

  const saveAll = useCallback(async (): Promise<boolean> => {
    if (Object.keys(dirtyFields).length === 0) return true;

    setIsSaving(true);
    setSaveError(null);

    try {
      await adminUpdateHomeContent(
        dirtyFields as AdminHomeContentUpdatePayload,
      );
      // On success: merge dirty fields into content state, then clear dirty fields
      setContent((prev) => {
        if (!prev) return prev;
        return { ...prev, ...dirtyFields } as typeof prev;
      });
      setDirtyFields({});
      toast.success("All changes saved successfully");
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save changes";
      setSaveError(message);
      toast.error(message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [dirtyFields]);

  /////////////////////////////////////////////////////////////////////
  ///////////// Reset all dirty fields (revert changes) ///////////////
  /////////////////////////////////////////////////////////////////////

  const reset = useCallback(() => {
    setDirtyFields({});
    setSaveError(null);
  }, []);

  // Count dirty fields (divided by 2 since each bilingual field = 2 API keys)
  const apiKeyCount = Object.keys(dirtyFields).length;
  // How many UI field groups are dirty (each group is 1 EN + 1 AR)
  // We use Set to count unique UI fields across ALL section maps
  const allFieldMaps = [
    HERO_FIELD_API_MAP,
    STATS_FIELD_API_MAP,
    LICENSING_FIELD_API_MAP,
    PROCESS_FIELD_API_MAP,
  ];
  const uiFieldKeys = new Set<string>();
  for (const apiKey of Object.keys(dirtyFields)) {
    for (const fieldMap of allFieldMaps) {
      for (const [uiKey, mapping] of Object.entries(fieldMap)) {
        if (typeof mapping === "string" && mapping === apiKey) {
          uiFieldKeys.add(uiKey);
        } else if (
          typeof mapping === "object" &&
          (mapping.en === apiKey || mapping.ar === apiKey)
        ) {
          uiFieldKeys.add(uiKey);
        }
      }
    }
  }
  const dirtyCount =
    uiFieldKeys.size > 0 ? uiFieldKeys.size : Math.ceil(apiKeyCount / 2);
  const isDirty = apiKeyCount > 0;

  // Helper to get SSR fallback value for a given UI field key
  const getSsrValue = useCallback(
    (uiFieldKey: string): string => {
      const heroRecord = hero as unknown as Record<
        string,
        string | undefined
      >;
      return heroRecord[uiFieldKey] ?? "";
    },
    [hero],
  );

  return {
    /** Full admin content object (bilingual) */
    content,
    /** Loading state for initial fetch */
    isLoading,
    /** Error from initial fetch */
    fetchError,
    /** Currently tracked dirty fields (apiKey → value) */
    dirtyFields,
    /** Whether there are unsaved changes */
    isDirty,
    /** Number of fields with unsaved changes (counted as UI field groups) */
    dirtyCount,
    /** Is the saveAll operation in progress */
    isSaving,
    /** Error from the last save attempt */
    saveError,
    /** Get current display value for a UI field key (respects dirty state) */
    getFieldValue,
    /** Get bilingual values (en + ar) for a UI field key */
    getBilingualValue,
    /** Get the SSR fallback value */
    getSsrValue,
    /** Mark a single-locale field as dirty (uiFieldKey, newValue) */
    setField,
    /** Mark both EN + AR fields as dirty (uiFieldKey, valueEn, valueAr) */
    setBilingualField,
    /** Save all dirty fields in one PUT */
    saveAll,
    /** Reset all dirty fields */
    reset,
  };
}
