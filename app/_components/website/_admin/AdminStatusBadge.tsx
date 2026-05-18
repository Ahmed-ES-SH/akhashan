import { useTranslation } from "@/app/hooks/useTranslation";
import type { ContactMessageStatus } from "@/app/types/website/admin.types";

///////////////////////////////////////////////////////////////////////
/////////////// Admin Status Badge — reusable component ///////////////
///////////////////////////////////////////////////////////////////////

interface AdminStatusBadgeProps {
  status: ContactMessageStatus | boolean;
  labelMap?: Record<string, string>;
}

export function AdminStatusBadge({ status, labelMap }: AdminStatusBadgeProps) {
  const t = useTranslation("admin");

  // Boolean status (for services is_active)
  if (typeof status === "boolean") {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          status
            ? "bg-emerald-100 text-emerald-800"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {status ? t.common.statusActive : t.common.statusInactive}
      </span>
    );
  }

  // Contact message status
  const defaultLabelMap: Record<ContactMessageStatus, string> = {
    new: t.contactMessages.statusNew,
    read: t.contactMessages.statusRead,
    replied: t.contactMessages.statusReplied,
    archived: t.contactMessages.statusArchived,
  };

  const labels = labelMap ?? defaultLabelMap;
  const label = labels[status as ContactMessageStatus] ?? status;

  const colorMap: Record<string, string> = {
    new: "bg-green/10 text-green",
    read: "bg-gray-100 text-gray-600",
    replied: "bg-emerald-100 text-emerald-800",
    archived: "bg-amber-100 text-amber-800",
  };

  return (
    <span
      data-testid="message-status"
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {label}
    </span>
  );
}
