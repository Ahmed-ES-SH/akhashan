"use client";
import * as FaIcons from "react-icons/fa";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "@/app/hooks/useTranslation";

///////////////////////////////////////////////////////////////////////
/////////////// IconPicker — controlled modal for icon selection //////
///////////////////////////////////////////////////////////////////////

interface Props {
  value: string;
  onChange: (iconName: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function IconPicker({
  value,
  onChange,
  open,
  onOpenChange,
}: Props) {
  const adminT = useTranslation("admin");
  const picker =
    ((adminT as Record<string, unknown>)?.services as Record<string, unknown>)
      ?.picker as Record<string, string> | undefined;
  const editor =
    (adminT as Record<string, unknown>)?.editor as
      | Record<string, string>
      | undefined;

  const searchPlaceholder =
    picker?.searchPlaceholder ?? "Search icons...";
  const closeLabel = editor?.popupCancel ?? "Cancel";
  const dialogTitle = picker?.title ?? "Choose Icon";
  const noResultsText = picker?.noResults ?? "No icons found";

  const allowedIcons = useMemo(
    () => Object.keys(FaIcons).filter((name) => name.startsWith("Fa")),
    [],
  );

  const [searchTerm, setSearchTerm] = useState("");

  const filteredIcons = useMemo(
    () =>
      allowedIcons.filter((icon) =>
        icon.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [allowedIcons, searchTerm],
  );

  // Pre-build icon component map to avoid repeated lookups in render loop
  const iconComponents = useMemo(() => {
    const map = new Map<
      string,
      React.ComponentType<React.SVGProps<SVGSVGElement>>
    >();
    filteredIcons.forEach((name) => {
      map.set(
        name,
        (FaIcons as Record<
          string,
          React.ComponentType<React.SVGProps<SVGSVGElement>>
        >)[name],
      );
    });
    return map;
  }, [filteredIcons]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-charcoal/50 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
          role="dialog"
          aria-modal="true"
          aria-label={dialogTitle}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="mx-4 w-full max-w-3xl space-y-4 rounded-xl border border-border bg-surface p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-charcoal outline-none transition placeholder:text-muted/70 focus:border-gold focus:ring-2 focus:ring-gold/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              dir="ltr"
              autoFocus
            />

            <div className="max-h-96 grid grid-cols-6 gap-2 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-8 md:grid-cols-10">
              {filteredIcons.length === 0 ? (
                <div className="col-span-full flex items-center justify-center py-8 text-sm text-muted">
                  {noResultsText}
                </div>
              ) : (
                filteredIcons.map((iconName) => {
                const IconComponent = iconComponents.get(iconName);
                if (!IconComponent) return null;

                return (
                  <div
                    key={iconName}
                    onClick={() => {
                      onChange(iconName);
                      setSearchTerm("");
                    }}
                    className={`flex cursor-pointer items-center justify-center rounded-lg border p-2 transition ${
                      value === iconName
                        ? "border-gold bg-green text-white"
                        : "border-border hover:bg-bg"
                    }`}
                    title={iconName}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        onChange(iconName);
                        setSearchTerm("");
                      }
                    }}
                  >
                    <IconComponent className="text-lg" />
                  </div>
                );
              })
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                setSearchTerm("");
              }}
              className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gold/40"
            >
              {closeLabel}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
