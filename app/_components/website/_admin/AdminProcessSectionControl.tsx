"use client";

import { useState, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import SectionLabel from "@/app/_components/website/SectionLabel";
import EditableText from "./EditableText";
import AdminProcessStepCard from "./AdminProcessStepCard";
import AdminProcessStepForm from "./AdminProcessStepForm";
import { useAdminEditor } from "@/app/contexts/AdminEditorContext";
import { useProcessSteps } from "@/app/hooks/admin/useProcessSteps";
import { PROCESS_FIELD_API_MAP } from "@/app/types/website/admin.types";
import type {
  AdminProcessStep,
  AdminCreateProcessStepPayload,
  AdminUpdateProcessStepPayload,
} from "@/app/types/website/admin.types";
import type { Locale } from "@/app/types/website/home.types";

/////////////////////////////////////////////////////////////////////
///////////// AdminProcessSectionControl — full CRUD UI /////////////
///////////// Section text via context + steps via hook /////////////
/////////////////////////////////////////////////////////////////////

interface AdminProcessSectionControlProps {
  locale: Locale;
}

export default function AdminProcessSectionControl({
  locale,
}: AdminProcessSectionControlProps) {
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
  } = useProcessSteps();

  // Form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<AdminProcessStep | undefined>(
    undefined,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  /////////////////////////////////////////////////////////////////////
  ///////////// Fetch steps on mount //////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Open form for creating a new step /////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleAddStep = () => {
    setEditingStep(undefined);
    setFormOpen(true);
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Open form for editing an existing step ////////////////
  /////////////////////////////////////////////////////////////////////

  const handleEditStep = (step: AdminProcessStep) => {
    setEditingStep(step);
    setFormOpen(true);
  };

  /////////////////////////////////////////////////////////////////////
  ///////////// Save handler — create or update ///////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleSave = async (
    data: AdminCreateProcessStepPayload | AdminUpdateProcessStepPayload,
  ) => {
    setIsSaving(true);
    try {
      if (editingStep) {
        await updateItem(editingStep.id, data as AdminUpdateProcessStepPayload);
      } else {
        await createItem(data as AdminCreateProcessStepPayload);
      }
      setFormOpen(false);
      setEditingStep(undefined);
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
  ///////////// Reorder — move step up or down ////////////////////////
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
      className="py-[clamp(88px,12vw,160px)] bg-green-dark text-white"
      id="process"
      data-testid="admin-process-section"
    >
      <div className="w-[min(1200px,100%-48px)] mx-auto">
        {/* ── Section-level text (label, heading, description) ────── */}
        <EditableText
          value={getFieldValue("label")}
          fieldKey="label"
          onEdit={(key) => openEditor(key, PROCESS_FIELD_API_MAP)}
          as="div"
        >
          <SectionLabel>{getFieldValue("label")}</SectionLabel>
        </EditableText>

        <EditableText
          value={getFieldValue("heading")}
          fieldKey="heading"
          onEdit={(key) => openEditor(key, PROCESS_FIELD_API_MAP)}
          as="h2"
          className="text-[clamp(2rem,3.5vw,3.2rem)] font-extrabold leading-[1.12] mb-3 tracking-[-0.01em] text-white"
        />

        <EditableText
          value={getFieldValue("description")}
          fieldKey="description"
          onEdit={(key) => openEditor(key, PROCESS_FIELD_API_MAP)}
          as="p"
          className="text-lg text-white/65 max-w-prose mb-12 leading-relaxed"
        />

        {/* ── Process steps grid ─────────────────────────────────── */}
        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-6 text-center"
              >
                <div className="mb-5 w-14 h-14 rounded-full bg-white/10 mx-auto" />
                <div className="mb-2 h-5 w-3/4 rounded bg-white/10 mx-auto" />
                <div className="h-4 w-5/6 rounded bg-white/5 mx-auto" />
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="rounded-xl border border-red-200/30 bg-red-900/20 p-8 text-center">
            <p className="mb-4 text-sm text-red-300">{error}</p>
            <button
              type="button"
              data-testid="retry-fetch-process"
              onClick={fetchItems}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          // Empty state
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="mb-6 text-white/60">
              No process steps yet. Click the button below to create one.
            </p>
            <button
              type="button"
              data-testid="add-process-step"
              onClick={handleAddStep}
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-green-dark transition hover:bg-gold-dark"
            >
              <FiPlus className="h-4 w-4" />
              Add First Process Step
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {items.map((step, index) => (
                <AdminProcessStepCard
                  key={step.id}
                  step={step}
                  index={index}
                  totalSteps={items.length}
                  locale={locale}
                  onEdit={handleEditStep}
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
                data-testid="add-process-step"
                onClick={handleAddStep}
                className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-green-dark transition hover:bg-gold-dark"
              >
                <FiPlus className="h-4 w-4" />
                Add Process Step
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Create/Edit form modal ───────────────────────────────── */}
      <AdminProcessStepForm
        key={editingStep?.id ?? "new"}
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingStep(undefined);
        }}
        onSave={handleSave}
        initialData={editingStep}
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
              Delete Step
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete this process step? This action
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
