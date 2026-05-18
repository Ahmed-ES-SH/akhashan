"use client";
import Image from "next/image";
import UserButton from "./UserButton";
import SubscriptionPopup from "./SubscriptionPopup";
import { useAdminSubscription } from "@/app/hooks/admin/useAdminSubscription";
import { useTranslation } from "@/app/hooks/useTranslation";
import { useEffect, useState } from "react";
import { FiClock } from "react-icons/fi";
import { useRouter } from "next/navigation";

///////////////////////////////////////////////////////////////////////
/////////////// Admin Topbar — logo + user dropdown + expiry ///////////
///////////////////////////////////////////////////////////////////////

export default function Topbar() {
  const router = useRouter();

  const {
    expirationDate,
    daysLeft,
    isExpired,
    isLoading,
    fetchSubscription,
    updateExpiry,
  } = useAdminSubscription();
  const t = useTranslation("topbar");
  const [showPopup, setShowPopup] = useState(false);

  /////////////////////////////////////////////////////////////////////
  ///////////// Fetch subscription expiry on mount ////////////////////
  /////////////////////////////////////////////////////////////////////

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const expiryColor = isExpired
    ? "text-red-600 bg-red-50 border-red-200"
    : daysLeft !== null && daysLeft <= 30
      ? "text-amber-600 bg-amber-50 border-amber-200"
      : "text-gray-600 bg-gray-50 border-gray-200";

  const label = isExpired
    ? t.expired
    : daysLeft === 1
      ? t.dayLeft?.replace("{days}", "1")
      : t.daysLeft?.replace("{days}", String(daysLeft));

  return (
    <header
      className="border-b border-gray-200 bg-white px-6 py-4"
      aria-label="Admin navigation"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="cursor-pointer" onClick={() => router.push("/")}>
          <Image
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="w-32"
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Expiry indicator */}
          {!isLoading && daysLeft !== null && (
            <button
              onClick={() => setShowPopup(true)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition hover:opacity-80 ${expiryColor}`}
              aria-label="Subscription expiry"
            >
              <FiClock className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </button>
          )}

          <UserButton />
        </div>
      </div>

      <SubscriptionPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        currentExpiry={expirationDate}
        onSave={updateExpiry}
      />
    </header>
  );
}
