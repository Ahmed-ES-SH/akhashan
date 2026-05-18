"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAdminHomeContent } from "@/app/hooks/admin/useAdminHomeContent";
import type {
  HeroApiResponse,
  Locale,
  StatsSectionApiResponse,
  LicensingSectionApiResponse,
  ProcessSectionApiResponse,
} from "@/app/types/website/home.types";
import type { STATS_FIELD_API_MAP } from "@/app/types/website/admin.types";
import { toast } from "sonner";

/////////////////////////////////////////////////////////////////////
/////////////// AdminEditorContext — single popup + save bar ////////
/////////////// Shared across ALL admin section controls ////////////
/////////////////////////////////////////////////////////////////////

type FieldApiMap = typeof STATS_FIELD_API_MAP;

interface AdminEditorContextValue {
  // Popup state
  editingField: string | null;
  editingValueEn: string;
  editingValueAr: string;
  activeFieldMap: FieldApiMap | null;
  openEditor: (fieldKey: string, fieldMap: FieldApiMap) => void;
  openChildItemEditor: (fieldKey: string, currentValue: string) => void;
  closeEditor: () => void;
  handlePopupSave: (valueEn: string, valueAr: string) => Promise<void>;
  handleChildItemSave: (value: string) => Promise<void>;

  // From useAdminHomeContent
  isLoading: boolean;
  fetchError: string | null;
  getFieldValue: (uiFieldKey: string) => string;
  getBilingualValue: (uiFieldKey: string) => { en: string; ar: string };
  setBilingualField: (
    uiFieldKey: string,
    valueEn: string,
    valueAr: string,
  ) => void;
  setField: (uiFieldKey: string, newValue: string) => void;
  saveAll: () => Promise<boolean>;
  reset: () => void;
  isDirty: boolean;
  dirtyCount: number;
  isSaving: boolean;
}

const AdminEditorContext = createContext<AdminEditorContextValue | null>(null);

///////////////////////////////////////////////////////////////////////
///////////// WhatsApp number validation regex ///////////////////////
///////////////////////////////////////////////////////////////////////

const WHATSAPP_REGEX = /^\+?[0-9\s-]{6,20}$/;

interface AdminEditorProviderProps {
  hero: HeroApiResponse;
  stats?: StatsSectionApiResponse;
  licensing?: LicensingSectionApiResponse;
  process?: ProcessSectionApiResponse;
  locale: Locale;
  children: ReactNode;
}

export function AdminEditorProvider({
  hero,
  stats,
  licensing,
  process,
  locale,
  children,
}: AdminEditorProviderProps) {
  // Single hook instance for all sections
  const {
    getFieldValue,
    getBilingualValue,
    setBilingualField,
    setField,
    saveAll,
    reset,
    isDirty,
    dirtyCount,
    isSaving,
    isLoading,
    fetchError,
  } = useAdminHomeContent({ hero, stats, licensing, process, locale });

  // Popup state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValueEn, setEditingValueEn] = useState("");
  const [editingValueAr, setEditingValueAr] = useState("");
  const [activeFieldMap, setActiveFieldMap] = useState<FieldApiMap | null>(
    null,
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Open editor with field key and its API map ////////////
  /////////////////////////////////////////////////////////////////////

  const openEditor = useCallback(
    (fieldKey: string, fieldMap: FieldApiMap) => {
      const { en, ar } = getBilingualValue(fieldKey);
      setEditingField(fieldKey);
      setEditingValueEn(en);
      setEditingValueAr(ar);
      setActiveFieldMap(fieldMap);
    },
    [getBilingualValue],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Open editor for child item (single-field) /////////////
  /////////////////////////////////////////////////////////////////////
  // NOTE: Stats section no longer uses this — it has its own useStatItems hook.
  // Kept for licensing and process section controls.

  const openChildItemEditor = useCallback(
    (fieldKey: string, currentValue: string) => {
      setEditingField(fieldKey);
      setEditingValueEn(currentValue);
      setEditingValueAr("");
      setActiveFieldMap(null);
    },
    [],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Close editor and reset popup state ////////////////////
  /////////////////////////////////////////////////////////////////////

  const closeEditor = useCallback(() => {
    setEditingField(null);
    setEditingValueEn("");
    setEditingValueAr("");
    setActiveFieldMap(null);
  }, []);

  /////////////////////////////////////////////////////////////////////
  ///////////// Save from popup — marks field dirty ///////////////////
  /////////////////////////////////////////////////////////////////////

  const handlePopupSave = useCallback(
    async (valueEn: string, valueAr: string) => {
      if (!editingField || !activeFieldMap) return;

      // WhatsApp number validation
      if (editingField === "whatsapp_number" && !WHATSAPP_REGEX.test(valueEn)) {
        toast.error("Invalid WhatsApp number format. Use: +[digits][spaces][-]");
        return;
      }

      // Check if this field is bilingual or single-field
      const mapping = activeFieldMap[editingField];
      const isBilingual = typeof mapping === "object";

      if (isBilingual) {
        setBilingualField(editingField, valueEn, valueAr);
      } else {
        setField(editingField, valueEn);
      }

      // Brief delay for visual feedback before closing
      await new Promise((r) => setTimeout(r, 200));
      closeEditor();
    },
    [editingField, activeFieldMap, setBilingualField, setField, closeEditor],
  );

  /////////////////////////////////////////////////////////////////////
  ///////////// Save child item field (single-field, no AR) ///////////
  /////////////////////////////////////////////////////////////////////
  // NOTE: Stats section no longer uses this — it has its own useStatItems hook.
  // Kept for licensing and process section controls.

  const handleChildItemSave = useCallback(
    async (value: string) => {
      if (!editingField) return;

      setField(editingField, value);

      await new Promise((r) => setTimeout(r, 200));
      closeEditor();
    },
    [editingField, setField, closeEditor],
  );

  const value: AdminEditorContextValue = {
    editingField,
    editingValueEn,
    editingValueAr,
    activeFieldMap,
    openEditor,
    openChildItemEditor,
    closeEditor,
    handlePopupSave,
    handleChildItemSave,
    isLoading,
    fetchError,
    getFieldValue,
    getBilingualValue,
    setBilingualField,
    setField,
    saveAll,
    reset,
    isDirty,
    dirtyCount,
    isSaving,
  };

  return (
    <AdminEditorContext.Provider value={value}>
      {children}
    </AdminEditorContext.Provider>
  );
}

/////////////////////////////////////////////////////////////////////
/////////////// Hook to consume the context /////////////////////////
/////////////////////////////////////////////////////////////////////

export function useAdminEditor(): AdminEditorContextValue {
  const context = useContext(AdminEditorContext);
  if (!context) {
    throw new Error("useAdminEditor must be used within AdminEditorProvider");
  }
  return context;
}
