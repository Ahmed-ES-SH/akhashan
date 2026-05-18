/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchCountries } from "@/app/helpers/api/publicApi";
import type { PublicCountryApiResponse, Locale } from "@/app/types/website/home.types";

///////////////////////////////////////////////////////////////////////
///////////// useCountries — public countries fetch hook //////////////
///////////////////////////////////////////////////////////////////////

export function useCountries(locale: Locale) {
  const [countries, setCountries] = useState<PublicCountryApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCountries(locale);
      setCountries(data);
    } catch {
      setError("Failed to load countries");
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetch();
  }, []);

  return { countries, isLoading, error, refetch: fetch };
}
