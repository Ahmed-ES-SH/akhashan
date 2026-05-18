"use client";

import { FiSave, FiX } from "react-icons/fi";
import { useAdminEditor } from "@/app/contexts/AdminEditorContext";

/////////////////////////////////////////////////////////////////////
/////////////// AdminSaveBar — thin wrapper around save bar /////////
/////////////// Reads all state from AdminEditorContext /////////////
/////////////////////////////////////////////////////////////////////

export default function AdminSaveBar() {
  const { isDirty, dirtyCount, isSaving, saveAll, reset } = useAdminEditor();

  if (!isDirty) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-6 py-4 shadow-2xl"
      data-testid="save-bar"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-sm font-bold text-gold">
            {dirtyCount}
          </span>
          <span className="text-sm text-gray-600">
            {dirtyCount} unsaved change{dirtyCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <FiX className="w-4 h-4" />
            Discard
          </button>
          <button
            type="button"
            onClick={saveAll}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green/20 transition hover:bg-green-deep disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4" />
                Save All Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
