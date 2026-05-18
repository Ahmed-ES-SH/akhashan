"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  adminGetStatItems,
  adminCreateStatItem,
  adminUpdateStatItem,
  adminDeleteStatItem,
  adminReorderStatItems,
} from "@/app/helpers/api/adminApi";
import type {
  AdminStatItem,
  AdminCreateStatItemPayload,
  AdminUpdateStatItemPayload,
} from "@/app/types/website/admin.types";

///////////////////////////////////////////////////////////////////////
/////////////// useStatItems — stat items CRUD hook ///////////////////
///////////////////////////////////////////////////////////////////////

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

export function useStatItems() {
  const [items, setItems] = useState<AdminStatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /////////////////////////////////////////////////////////////////////
  ///////////// Fetch stat items from API with retry //////////////////
  /////////////////////////////////////////////////////////////////////

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const attemptFetch = async (retriesLeft: number): Promise<void> => {
      try {
        const data = await adminGetStatItems();
        setItems(data);
      } catch {
        if (retriesLeft > 0) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          return attemptFetch(retriesLeft - 1);
        }
        setError("Failed to load stat items");
      }
    };

    await attemptFetch(MAX_RETRIES);
    setIsLoading(false);
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Create a new stat item ////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const createItem = useCallback(
    async (data: AdminCreateStatItemPayload) => {
      try {
        const newItem = await adminCreateStatItem(data);
        setItems((prev) => [...prev, newItem]);
        toast.success("Stat item created successfully");
        return newItem;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to create stat item";
        toast.error(message);
        throw new Error(message);
      }
    },
    [],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Update an existing stat item //////////////////////////
  /////////////////////////////////////////////////////////////////////

  const updateItem = useCallback(
    async (id: number, data: AdminUpdateStatItemPayload) => {
      try {
        const updated = await adminUpdateStatItem(id, data);
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item)),
        );
        toast.success("Stat item updated successfully");
        return updated;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update stat item";
        toast.error(message);
        throw new Error(message);
      }
    },
    [],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Delete a stat item ////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const deleteItem = useCallback(async (id: number) => {
    try {
      await adminDeleteStatItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Stat item deleted successfully");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete stat item";
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Reorder stat items ////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const reorderItems = useCallback(async (ids: number[]) => {
    try {
      const reordered = await adminReorderStatItems(ids);
      setItems(reordered);
      toast.success("Stat items reordered successfully");
      return reordered;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to reorder stat items";
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  return {
    items,
    isLoading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    reorderItems,
  };
}
