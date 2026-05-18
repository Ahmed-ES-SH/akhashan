"use client";

import { useEffect, useState, useCallback } from "react";
import { FiPlus, FiRefreshCw } from "react-icons/fi";
import { useTranslation } from "@/app/hooks/useTranslation";
import { useStatItems } from "@/app/hooks/admin/useStatItems";
import { useAdminEditor } from "@/app/contexts/AdminEditorContext";
import { STATS_FIELD_API_MAP } from "@/app/types/website/admin.types";
import type {
  AdminStatItem,
  AdminCreateStatItemPayload,
  AdminUpdateStatItemPayload,
} from "@/app/types/website/admin.types";
import EditableText from "./EditableText";
import AdminStatCard from "./AdminStatCard";
import AdminStatItemForm from "./AdminStatItemForm";
import type { Locale } from "@/app/types/website/home.types";

///////////////////////////////////////////////////////////////////////
/////////////// AdminStatsSectionControl — full CRUD UI ///////////////
///////////////////////////////////////////////////////////////////////

interface AdminStatsSectionControlProps {
  locale: Locale;
}

export default function AdminStatsSectionControl({
  locale,
}: AdminStatsSectionControlProps) {
  const { getFieldValue, openEditor, isLoading: isContentLoading } =
    useAdminEditor();
  const {
    items,
    isLoading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
  } = useStatItems();

  const adminT = useTranslation("admin");
  const statsSection = (adminT as Record<string, unknown>)?.statsSection as
    | Record<string, unknown>
    | undefined;

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminStatItem | undefined>(
    undefined,
  );
  const [isSaving, setIsSaving] = useState(false);

  /////////////////////////////////////////////////////////////////////
  ///////////// Fetch stat items on mount /////////////////////////////
  /////////////////////////////////////////////////////////////////////

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Open form in create mode //////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleAddItem = () => {
    setEditingItem(undefined);
    setIsFormOpen(true);
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Open form in edit mode ////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleEditItem = (item: AdminStatItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Save (create or update) ///////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleSave = useCallback(
    async (
      data: AdminCreateStatItemPayload | AdminUpdateStatItemPayload,
    ) => {
      setIsSaving(true);
      try {
        if (editingItem) {
          await updateItem(editingItem.id, data as AdminUpdateStatItemPayload);
        } else {
          await createItem(data as AdminCreateStatItemPayload);
        }
        setIsFormOpen(false);
        setEditingItem(undefined);
      } finally {
        setIsSaving(false);
      }
    },
    [editingItem, createItem, updateItem],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Delete with confirmation (handled in card) ////////////
  /////////////////////////////////////////////////////////////////////

  const handleDeleteItem = async (id: number) => {
    await deleteItem(id);
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Safe translation accessors ////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const emptyStateText =
    typeof statsSection?.emptyState === "string"
      ? statsSection.emptyState
      : "No statistics items yet";
  const addItemText =
    typeof statsSection?.addItem === "string"
      ? statsSection.addItem
      : "Add Stat Item";
  const fetchErrorText =
    typeof (statsSection?.toasts as Record<string, string> | undefined)
      ?.fetchError === "string"
      ? (statsSection?.toasts as Record<string, string>).fetchError
      : "Retry";

  /////////////////////////////////////////////////////////////////////
  ///////////// Loading skeleton //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  if (isLoading || isContentLoading) {
    return (
      <section
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="py-[clamp(60px,8vw,120px)] bg-sand"
        id="about"
      >
        <div className="w-[min(1200px,100%-48px)] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-surface border border-border rounded-xl p-9 text-center animate-pulse"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gray-200" />
                <div className="h-10 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /////////////////////////////////////////////////////////////////////
  ///////////// Error state ///////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  if (error) {
    return (
      <section
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="py-[clamp(60px,8vw,120px)] bg-sand"
        id="about"
      >
        <div className="w-[min(1200px,100%-48px)] mx-auto text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            type="button"
            onClick={fetchItems}
            className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-deep"
            data-testid="retry-fetch-stats"
          >
            <FiRefreshCw className="w-4 h-4" />
            {fetchErrorText}
          </button>
        </div>
      </section>
    );
  }

  /////////////////////////////////////////////////////////////////////
  ///////////// Main render ///////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  return (
    <section
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="py-[clamp(60px,8vw,120px)] bg-sand"
      id="about"
      data-testid="admin-stats-section"
    >
      <div className="w-[min(1200px,100%-48px)] mx-auto">
        {/* ── Section-level text (label, heading, description) ──── */}
        <EditableText
          value={getFieldValue("label")}
          fieldKey="label"
          onEdit={(key) => openEditor(key, STATS_FIELD_API_MAP)}
          as="span"
          className="inline-block text-xs font-bold uppercase tracking-[0.12em] text-gold mb-3"
        />

        <EditableText
          value={getFieldValue("heading")}
          fieldKey="heading"
          onEdit={(key) => openEditor(key, STATS_FIELD_API_MAP)}
          as="h2"
          className="text-[clamp(2rem,3.5vw,3.2rem)] font-extrabold leading-[1.12] mb-3 tracking-[-0.01em] text-charcoal"
        />

        <EditableText
          value={getFieldValue("description")}
          fieldKey="description"
          onEdit={(key) => openEditor(key, STATS_FIELD_API_MAP)}
          as="p"
          className="text-lg text-muted max-w-prose mb-12 leading-relaxed"
        />

        {/* ── Empty state ───────────────────────────────────────── */}
        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted mb-6">{emptyStateText}</p>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-deep"
              data-testid="add-stat-item"
            >
              <FiPlus className="w-4 h-4" />
              {addItemText}
            </button>
          </div>
        ) : (
          <>
            {/* ── Stat items grid ───────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {items.map((item) => (
                <AdminStatCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>

            {/* ── Add button ────────────────────────────────────── */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-deep"
                data-testid="add-stat-item"
              >
                <FiPlus className="w-4 h-4" />
                {addItemText}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Create/Edit Form Modal ──────────────────────────────── */}
      <AdminStatItemForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(undefined);
        }}
        onSave={handleSave}
        initialData={editingItem}
        isSaving={isSaving}
      />
    </section>
  );
}
