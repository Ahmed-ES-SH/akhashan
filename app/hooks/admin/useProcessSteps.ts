"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  adminGetProcessSteps,
  adminCreateProcessStep,
  adminUpdateProcessStep,
  adminDeleteProcessStep,
  adminReorderProcessSteps,
  adminSingleReorderProcessStep,
} from "@/app/helpers/api/adminApi";
import type {
  AdminProcessStep,
  AdminCreateProcessStepPayload,
  AdminUpdateProcessStepPayload,
} from "@/app/types/website/admin.types";

/////////////////////////////////////////////////////////////////////
///////////// useProcessSteps — process steps CRUD hook /////////////
/////////////////////////////////////////////////////////////////////

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

export function useProcessSteps() {
  const [items, setItems] = useState<AdminProcessStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /////////////////////////////////////////////////////////////////////
  ///////////// Fetch process steps from API with retry ///////////////
  /////////////////////////////////////////////////////////////////////

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const attemptFetch = async (retriesLeft: number): Promise<void> => {
      try {
        const data = await adminGetProcessSteps();
        setItems(data);
      } catch {
        if (retriesLeft > 0) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          return attemptFetch(retriesLeft - 1);
        }
        setError("Failed to load process steps");
      }
    };

    await attemptFetch(MAX_RETRIES);
    setIsLoading(false);
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Create a new process step /////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const createItem = useCallback(
    async (data: AdminCreateProcessStepPayload) => {
      try {
        const newItem = await adminCreateProcessStep(data);
        setItems((prev) => [...prev, newItem]);
        toast.success("Process step created successfully");
        return newItem;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to create process step";
        toast.error(message);
        throw new Error(message);
      }
    },
    [],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Update an existing process step ///////////////////////
  /////////////////////////////////////////////////////////////////////

  const updateItem = useCallback(
    async (id: number, data: AdminUpdateProcessStepPayload) => {
      try {
        const updated = await adminUpdateProcessStep(id, data);
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item)),
        );
        toast.success("Process step updated successfully");
        return updated;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to update process step";
        toast.error(message);
        throw new Error(message);
      }
    },
    [],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Delete a process step /////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const deleteItem = useCallback(async (id: number) => {
    try {
      await adminDeleteProcessStep(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Process step deleted successfully");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete process step";
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Bulk reorder process steps ////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const reorderItems = useCallback(async (ids: number[]) => {
    try {
      const reordered = await adminReorderProcessSteps(ids);
      setItems(reordered);
      toast.success("Process steps reordered successfully");
      return reordered;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to reorder process steps";
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Single step reorder ///////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const singleReorderItem = useCallback(
    async (id: number, sort_order: number) => {
      try {
        const updated = await adminSingleReorderProcessStep(id, sort_order);
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item)),
        );
        return updated;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to reorder process step";
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
