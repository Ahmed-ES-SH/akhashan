"use client";

import { useState, useEffect } from "react";

interface WhatsAppNumberResponse {
  whatsapp_number: string | null;
}

export function useWhatsAppNumber() {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNumber = async () => {
      try {
        const res = await fetch("/api/whatsapp-number");
        const data: WhatsAppNumberResponse = await res.json();
        setWhatsappNumber(data.whatsapp_number);
      } catch {
        setWhatsappNumber(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNumber();
  }, []);

  return { whatsappNumber, isLoading };
}
