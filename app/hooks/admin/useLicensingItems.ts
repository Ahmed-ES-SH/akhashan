"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  adminGetLicensingItems,
  adminCreateLicensingItem,
  adminUpdateLicensingItem,
  adminDeleteLicensingItem,
  adminReorderLicensingItems,
  adminSingleReorderLicensingItem,
} from "@/app/helpers/api/adminApi";
import type {
  AdminLicensingItem,
  AdminCreateLicensingItemPayload,
  AdminUpdateLicensingItemPayload,
} from "@/app/types/website/admin.types";

///////////////////////////////////////////////////////////////////////
///////////// useLicensingItems — licensing items CRUD hook ///////////
///////////////////////////////////////////////////////////////////////

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

export function useLicensingItems() {
  const [items, setItems] = useState<AdminLicensingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /////////////////////////////////////////////////////////////////////
  ///////////// Fetch licensing items from API with retry /////////////
  /////////////////////////////////////////////////////////////////////

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const attemptFetch = async (retriesLeft: number): Promise<void> => {
      try {
        const data = await adminGetLicensingItems();
        setItems(data);
      } catch {
        if (retriesLeft > 0) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          return attemptFetch(retriesLeft - 1);
        }
        setError("Failed to load licensing items");
      }
    };

    await attemptFetch(MAX_RETRIES);
    setIsLoading(false);
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Create a new licensing item ///////////////////////////
  /////////////////////////////////////////////////////////////////////

  const createItem = useCallback(
    async (data: AdminCreateLicensingItemPayload) => {
      try {
        const newItem = await adminCreateLicensingItem(data);
        setItems((prev) => [...prev, newItem]);
        toast.success("Licensing item created successfully");
        return newItem;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to create licensing item";
        toast.error(message);
        throw new Error(message);
      }
    },
    [],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Update an existing licensing item /////////////////////
  /////////////////////////////////////////////////////////////////////

  const updateItem = useCallback(
    async (id: number, data: AdminUpdateLicensingItemPayload) => {
      try {
        const updated = await adminUpdateLicensingItem(id, data);
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item)),
        );
        toast.success("Licensing item updated successfully");
        return updated;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to update licensing item";
        toast.error(message);
        throw new Error(message);
      }
    },
    [],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Delete a licensing item ///////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const deleteItem = useCallback(async (id: number) => {
    try {
      await adminDeleteLicensingItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Licensing item deleted successfully");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete licensing item";
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Bulk reorder licensing items //////////////////////////
  /////////////////////////////////////////////////////////////////////

  const reorderItems = useCallback(async (ids: number[]) => {
    try {
      const reordered = await adminReorderLicensingItems(ids);
      setItems(reordered);
      toast.success("Licensing items reordered successfully");
      return reordered;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to reorder licensing items";
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Single item reorder ///////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const singleReorderItem = useCallback(
    async (id: number, sort_order: number) => {
      try {
        const updated = await adminSingleReorderLicensingItem(id, sort_order);
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item)),
        );
        return updated;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to reorder licensing item";
        toast.error(message);
        throw new Error(message);
      }
    },
    [],
  );

  return {
    items,
    isLoading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    reorderItems,
    singleReorderItem,
  };
}
