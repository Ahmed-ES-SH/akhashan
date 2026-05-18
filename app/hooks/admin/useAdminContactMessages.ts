"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  adminGetContactMessages,
  adminGetContactMessage,
  adminUpdateMessageStatus,
  adminDeleteContactMessage,
} from "@/app/helpers/api/adminApi";
import type {
  AdminContactMessage,
  AdminContactMessageMeta,
} from "@/app/types/website/admin.types";

/////////////////////////////////////////////////////////////////////
///////////// useAdminContactMessages — inbox CRUD hook /////////////
/////////////////////////////////////////////////////////////////////

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const DEFAULT_LIMIT = 20;

type StatusFilter = "new" | "read" | "replied" | "archived" | null;

export function useAdminContactMessages() {
  const [messages, setMessages] = useState<AdminContactMessage[]>([]);
  const [meta, setMeta] = useState<AdminContactMessageMeta>({
    total: 0,
    page: 1,
    limit: DEFAULT_LIMIT,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);

  /////////////////////////////////////////////////////////////////////
  ///////////// Fetch messages from API with retry ////////////////////
  /////////////////////////////////////////////////////////////////////

  const fetchMessages = useCallback(
    async (page?: number, status?: StatusFilter) => {
      const targetPage = page ?? currentPage;
      const targetStatus = status !== undefined ? status : statusFilter;
      setIsLoading(true);
      setError(null);

      const attemptFetch = async (retriesLeft: number): Promise<void> => {
        try {
          const response = await adminGetContactMessages(
            targetPage,
            DEFAULT_LIMIT,
            targetStatus ?? undefined,
          );
          setMessages(response.data);
          setMeta(response.meta);
          setCurrentPage(targetPage);
        } catch {
          if (retriesLeft > 0) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
            return attemptFetch(retriesLeft - 1);
          }
          setError("Failed to load messages");
        }
      };

      await attemptFetch(MAX_RETRIES);
      setIsLoading(false);
    },
    [currentPage, statusFilter],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Get single message detail /////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const getMessage = useCallback(async (id: number) => {
    try {
      return await adminGetContactMessage(id);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load message";
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Update message status /////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const updateStatus = useCallback(
    async (id: number, status: "new" | "read" | "replied" | "archived") => {
      try {
        const updated = await adminUpdateMessageStatus(id, status);
        setMessages((prev) =>
          prev.map((msg) => (msg.id === id ? updated : msg)),
        );
        return updated;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to update message status";
        toast.error(message);
        throw new Error(message);
      }
    },
    [],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Delete a message //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const deleteMessage = useCallback(async (id: number) => {
    try {
      await adminDeleteContactMessage(id);
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete message";
      toast.error(message);
      throw new Error(message);
    }
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Convenience: mark as read /////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const markAsRead = useCallback(
    async (id: number) => {
      return updateStatus(id, "read");
    },
    [updateStatus],
  );

  return {
    messages,
    meta,
    isLoading,
    error,
    currentPage,
    setCurrentPage,
    statusFilter,
    setStatusFilter,
    fetchMessages,
    getMessage,
    updateStatus,
    deleteMessage,
    markAsRead,
  };
}
