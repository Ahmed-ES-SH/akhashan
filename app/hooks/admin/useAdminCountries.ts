"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  adminGetCountries,
  adminCreateCountry,
  adminUpdateCountry,
  adminDeleteCountry,
  adminToggleCountryActive,
  adminReorderCountries,
} from "@/app/helpers/api/adminApi";
import type {
  AdminCountry,
  AdminCountryMeta,
  AdminCreateCountryPayload,
  AdminUpdateCountryPayload,
} from "@/app/types/website/admin.types";

///////////////////////////////////////////////////////////////////////
///////////// useAdminCountries — countries CRUD hook /////////////////
///////////////////////////////////////////////////////////////////////

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const DEFAULT_LIMIT = 20;

export function useAdminCountries() {
  const [countries, setCountries] = useState<AdminCountry[]>([]);
  const [meta, setMeta] = useState<AdminCountryMeta>({
    total: 0,
    page: 1,
    limit: DEFAULT_LIMIT,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  /////////////////////////////////////////////////////////////////////
  ///////////// Fetch countries from API with retry ////////////////////
  /////////////////////////////////////////////////////////////////////

  const fetchCountries = useCallback(
    async (page?: number, limit?: number) => {
      const targetPage = page ?? currentPage;
      const targetLimit = limit ?? DEFAULT_LIMIT;
      setIsLoading(true);
      setError(null);

      const attemptFetch = async (retriesLeft: number): Promise<void> => {
        try {
          const response = await adminGetCountries(targetPage, targetLimit);
          setCountries(response.data);
          setMeta(response.meta);
          setCurrentPage(targetPage);
        } catch {
          if (retriesLeft > 0) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
            return attemptFetch(retriesLeft - 1);
          }
          setError("Failed to load countries");
        }
      };

      await attemptFetch(MAX_RETRIES);
      setIsLoading(false);
    },
    [currentPage],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Create a new country //////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const createCountry = useCallback(
    async (data: AdminCreateCountryPayload) => {
      try {
        const newItem = await adminCreateCountry(data);
        setCountries((prev) => [...prev, newItem]);
        return newItem;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to create country";
        toast.error(message);
        throw new Error(message);
      }
    },
    [],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Update an existing country ////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const updateCountry = useCallback(
    async (id: number, data: AdminUpdateCountryPayload) => {
      try {
        const updated = await adminUpdateCountry(id, data);
        setCountries((prev) =>
          prev.map((country) => (country.id === id ? updated : country)),
        );
        return updated;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update country";
        toast.error(message);
        throw new Error(message);
      }
    },
    [],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Delete a country //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const deleteCountry = useCallback(async (id: number) => {
    try {
      await adminDeleteCountry(id);
      setCountries((prev) => prev.filter((country) => country.id !== id));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete country";
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Toggle country active/inactive ////////////////////////
  /////////////////////////////////////////////////////////////////////

  const toggleActive = useCallback(async (id: number) => {
    try {
      const updated = await adminToggleCountryActive(id);
      setCountries((prev) =>
        prev.map((country) => (country.id === id ? updated : country)),
      );
      return updated;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update country status";
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Reorder countries /////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const reorderCountries = useCallback(async (ids: number[]) => {
    try {
      const reordered = await adminReorderCountries(ids);
      setCountries(reordered);
      return reordered;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to reorder countries";
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  return {
    countries,
    meta,
    isLoading,
    error,
    currentPage,
    setCurrentPage,
    fetchCountries,
    createCountry,
    updateCountry,
    deleteCountry,
    toggleActive,
    reorderCountries,
  };
}
