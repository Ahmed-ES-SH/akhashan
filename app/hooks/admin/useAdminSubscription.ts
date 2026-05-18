"use client";

import { useState, useCallback } from "react";
import {
  adminGetSubscription,
  adminUpdateSubscription,
} from "@/app/helpers/api/adminApi";
import { toast } from "sonner";

interface UseAdminSubscriptionReturn {
  expirationDate: string | null;
  daysLeft: number | null;
  isExpired: boolean;
  isLoading: boolean;
  fetchSubscription: () => Promise<void>;
  updateExpiry: (newDate: string) => Promise<boolean>;
}

///////////////////////////////////////////////////////////////////////
/////////////// Calculate days between now and a future date //////////
///////////////////////////////////////////////////////////////////////

function calculateDaysLeft(dateStr: string): number {
  const expiry = new Date(dateStr);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function useAdminSubscription(): UseAdminSubscriptionReturn {
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const daysLeft = expirationDate ? calculateDaysLeft(expirationDate) : null;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  const fetchSubscription = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminGetSubscription();
      setExpirationDate(data.expiration_date);
    } catch {
      // Silently fail — Topbar should not break the page
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateExpiry = useCallback(
    async (newDate: string): Promise<boolean> => {
      try {
        const data = await adminUpdateSubscription({ expiration_date: newDate });
        setExpirationDate(data.expiration_date);
        toast.success("Subscription expiry updated successfully");
        return true;
      } catch {
        toast.error("Failed to update subscription expiry");
        return false;
      }
    },
    [],
  );

  return {
    expirationDate,
    daysLeft,
    isExpired,
    isLoading,
    fetchSubscription,
    updateExpiry,
  };
}
