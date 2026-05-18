"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  adminGetServices,
  adminCreateService,
  adminUpdateService,
  adminDeleteService,
  adminToggleServiceActive,
  adminReorderServices,
} from "@/app/helpers/api/adminApi";
import type {
  AdminService,
  AdminServiceMeta,
  AdminCreateServicePayload,
  AdminUpdateServicePayload,
} from "@/app/types/website/admin.types";

/////////////////////////////////////////////////////////////////////
/////////////// useAdminServices — services CRUD hook ///////////////
/////////////////////////////////////////////////////////////////////

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const DEFAULT_LIMIT = 20;

export function useAdminServices() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [meta, setMeta] = useState<AdminServiceMeta>({
    total: 0,
    page: 1,
    limit: DEFAULT_LIMIT,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  /////////////////////////////////////////////////////////////////////
  ///////////// Fetch services from API with retry ////////////////////
  /////////////////////////////////////////////////////////////////////

  const fetchServices = useCallback(
    async (page?: number, limit?: number) => {
      const targetPage = page ?? currentPage;
      const targetLimit = limit ?? DEFAULT_LIMIT;
      setIsLoading(true);
      setError(null);

      const attemptFetch = async (retriesLeft: number): Promise<void> => {
        try {
          const response = await adminGetServices(targetPage, targetLimit);
          setServices(response.data);
          setMeta(response.meta);
          setCurrentPage(targetPage);
        } catch {
          if (retriesLeft > 0) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
            return attemptFetch(retriesLeft - 1);
          }
          setError("Failed to load services");
        }
      };

      await attemptFetch(MAX_RETRIES);
      setIsLoading(false);
    },
    [currentPage],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Create a new service //////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const createService = useCallback(
    async (data: AdminCreateServicePayload) => {
      try {
        const newItem = await adminCreateService(data);
        setServices((prev) => [...prev, newItem]);
        return newItem;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to create service";
        toast.error(message);
        throw new Error(message);
      }
    },
    [],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Update an existing service ////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const updateService = useCallback(
    async (id: number, data: AdminUpdateServicePayload) => {
      try {
        const updated = await adminUpdateService(id, data);
        setServices((prev) =>
          prev.map((service) => (service.id === id ? updated : service)),
        );
        return updated;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update service";
        toast.error(message);
        throw new Error(message);
      }
    },
    [],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Delete a service //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const deleteService = useCallback(async (id: number) => {
    try {
      await adminDeleteService(id);
      setServices((prev) => prev.filter((service) => service.id !== id));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete service";
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Toggle service active/inactive ////////////////////////
  /////////////////////////////////////////////////////////////////////

  const toggleActive = useCallback(async (id: number) => {
    try {
      const updated = await adminToggleServiceActive(id);
      setServices((prev) =>
        prev.map((service) => (service.id === id ? updated : service)),
      );
      return updated;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update service status";
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Reorder services //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const reorderServices = useCallback(async (ids: number[]) => {
    try {
      const reordered = await adminReorderServices(ids);
      setServices(reordered);
      return reordered;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to reorder services";
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  return {
    services,
    meta,
    isLoading,
    error,
    currentPage,
    setCurrentPage,
    fetchServices,
    createService,
    updateService,
    deleteService,
    toggleActive,
    reorderServices,
  };
}
