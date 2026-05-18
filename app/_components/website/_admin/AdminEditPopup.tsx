"use client";

import { useAdminEditor } from "@/app/contexts/AdminEditorContext";
import InlineEditPopup from "./InlineEditPopup";

/////////////////////////////////////////////////////////////////////
/////////////// AdminEditPopup — thin wrapper around popup //////////
/////////////// Reads all state from AdminEditorContext /////////////
/////////////////////////////////////////////////////////////////////

const FIELD_LABELS: Record<string, string> = {
  badge: "Hero Badge",
  heading: "Hero Heading",
  highlight_text: "Hero Highlight Text",
  description: "Hero Description",
  license: "License Text",
  cta_primary: "Primary CTA Button",
  cta_whatsapp: "WhatsApp CTA Button",
  whatsapp_number: "WhatsApp Number",
  label: "Section Label",
  // Stat item fields (for bilingual label editing)
  stat_item_label: "Stat Item Label",
  stat_item_icon: "Stat Item Icon",
  stat_item_target: "Stat Item Target",
  stat_item_suffix: "Stat Item Suffix",
  // Process section fields
  process_label: "Process Section Label",
  process_heading: "Process Section Heading",
  process_description: "Process Section Description",
};

export default function AdminEditPopup() {
  const {
    editingField,
    editingValueEn,
    editingValueAr,
    activeFieldMap,
    closeEditor,
    handlePopupSave,
  } = useAdminEditor();

  // Determine popup field type based on which field is being edited
  const popupFieldType =
    editingField === "description" || editingField === "license"
      ? "textarea"
      : "text";

  const isSingleField =
    !!editingField &&
    !!activeFieldMap &&
    typeof activeFieldMap[editingField] === "string";

  return (
    <InlineEditPopup
      isOpen={!!editingField}
      onClose={closeEditor}
      onSave={handlePopupSave}
      currentValueEn={editingValueEn}
      currentValueAr={editingValueAr}
      label={FIELD_LABELS[editingField ?? ""] ?? "Edit Field"}
      fieldType={popupFieldType}
      singleField={isSingleField}
    />
  );
}
