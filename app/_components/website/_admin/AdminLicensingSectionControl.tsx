"use client";

import { useState, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import SectionLabel from "@/app/_components/website/SectionLabel";
import EditableText from "./EditableText";
import AdminLicensingItemCard from "./AdminLicensingItemCard";
import AdminLicensingItemForm from "./AdminLicensingItemForm";
import { useAdminEditor } from "@/app/contexts/AdminEditorContext";
import { useLicensingItems } from "@/app/hooks/admin/useLicensingItems";
import { LICENSING_FIELD_API_MAP } from "@/app/types/website/admin.types";
import type {
  AdminLicensingItem,
  AdminCreateLicensingItemPayload,
  AdminUpdateLicensingItemPayload,
} from "@/app/types/website/admin.types";
import type { Locale } from "@/app/types/website/home.types";

///////////////////////////////////////////////////////////////////////
///////////// AdminLicensingSectionControl — full CRUD UI /////////////
///////////// Section text via context + items via hook ///////////////
///////////////////////////////////////////////////////////////////////

interface AdminLicensingSectionControlProps {
  locale: Locale;
}

export default function AdminLicensingSectionControl({
  locale,
}: AdminLicensingSectionControlProps) {
  const { getFieldValue, openEditor } = useAdminEditor();
  const {
    items,
    isLoading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    reorderItems,
  } = useLicensingItems();

  // Form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminLicensingItem | undefined>(
    undefined,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  /////////////////////////////////////////////////////////////////////
  ///////////// Fetch items on mount //////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Open form for creating a new item /////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleAddItem = () => {
    setEditingItem(undefined);
    setFormOpen(true);
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Open form for editing an existing item ////////////////
  /////////////////////////////////////////////////////////////////////

  const handleEditItem = (item: AdminLicensingItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Save handler — create or update ///////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleSave = async (
    data: AdminCreateLicensingItemPayload | AdminUpdateLicensingItemPayload,
  ) => {
    setIsSaving(true);
    try {
      if (editingItem) {
        await updateItem(editingItem.id, data as AdminUpdateLicensingItemPayload);
      } else {
        await createItem(data as AdminCreateLicensingItemPayload);
      }
      setFormOpen(false);
      setEditingItem(undefined);
    } finally {
      setIsSaving(false);
    }
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Delete with confirmation //////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmId === null) return;
    await deleteItem(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Reorder — move item up or down ////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleMoveUp = async (id: number) => {
    const index = items.findIndex((item) => item.id === id);
    if (index <= 0) return;

    const newIds = items.map((item) => item.id);
    [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
    await reorderItems(newIds);
  };

  const handleMoveDown = async (id: number) => {
    const index = items.findIndex((item) => item.id === id);
    if (index === -1 || index >= items.length - 1) return;

    const newIds = items.map((item) => item.id);
    [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
    await reorderItems(newIds);
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Render ////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  return (
    <section
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="py-[clamp(72px,10vw,140px)]"
      id="licensing"
      data-testid="admin-licensing-section"
    >
      <div className="w-[min(1200px,100%-48px)] mx-auto">
        {/* ── Section-level text (label, heading, description) ────── */}
        <EditableText
          value={getFieldValue("label")}
          fieldKey="label"
          onEdit={(key) => openEditor(key, LICENSING_FIELD_API_MAP)}
          as="div"
        >
          <SectionLabel>{getFieldValue("label")}</SectionLabel>
        </EditableText>

        <EditableText
          value={getFieldValue("heading")}
          fieldKey="heading"
          onEdit={(key) => openEditor(key, LICENSING_FIELD_API_MAP)}
          as="h2"
          className="text-[clamp(2rem,3.5vw,3.2rem)] font-extrabold leading-[1.12] mb-3 tracking-[-0.01em] text-charcoal"
        />

        <EditableText
          value={getFieldValue("description")}
          fieldKey="description"
          onEdit={(key) => openEditor(key, LICENSING_FIELD_API_MAP)}
          as="p"
          className="text-lg text-muted max-w-prose mb-12 leading-relaxed"
        />

        {/* ── Licensing items grid ───────────────────────────────── */}
        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-border bg-surface p-6"
              >
                <div className="mb-4 h-14 w-14 rounded-2xl bg-gray-200" />
                <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
                <div className="mb-2 h-4 w-full rounded bg-gray-100" />
                <div className="mb-2 h-4 w-5/6 rounded bg-gray-100" />
                <div className="mt-4 h-6 w-16 rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="mb-4 text-sm text-red-600">{error}</p>
            <button
              type="button"
              data-testid="retry-fetch-licensing"
              onClick={fetchItems}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          // Empty state
          <div className="rounded-xl border border-border bg-surface p-12 text-center">
            <p className="mb-6 text-muted">
              No licensing items yet. Click the button below to create one.
            </p>
            <button
              type="button"
              data-testid="add-licensing-item"
              onClick={handleAddItem}
              className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-deep"
            >
              <FiPlus className="h-4 w-4" />
              Add First Licensing Item
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {items.map((item, index) => (
                <AdminLicensingItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  totalItems={items.length}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteClick}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />
              ))}
            </div>

            {/* Add button */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                data-testid="add-licensing-item"
                onClick={handleAddItem}
                className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-deep"
              >
                <FiPlus className="h-4 w-4" />
                Add Licensing Item
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Create/Edit form modal ───────────────────────────────── */}
      <AdminLicensingItemForm
        key={editingItem?.id ?? "new"}
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingItem(undefined);
        }}
        onSave={handleSave}
        initialData={editingItem}
        isSaving={isSaving}
      />

      {/* ── Delete confirmation dialog ───────────────────────────── */}
      {deleteConfirmId !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleDeleteCancel}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm delete"
          data-testid="delete-confirm-dialog"
        >
          <div
            className="w-full max-w-md mx-4 rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Delete Item
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete this licensing item? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                data-testid="cancel-delete"
                onClick={handleDeleteCancel}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-delete"
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
