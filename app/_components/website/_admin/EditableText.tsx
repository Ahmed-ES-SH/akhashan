"use client";

import { type ElementType, type ReactNode } from "react";

///////////////////////////////////////////////////////////////////////
/////////////// EditableText — clickable text wrapper /////////////////
/////////////// Opens InlineEditPopup when clicked ////////////////////
///////////////////////////////////////////////////////////////////////

interface EditableTextProps {
  value: string;
  fieldKey: string;
  onEdit: (fieldKey: string) => void;
  isEditing?: boolean;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
  dangerouslySetInnerHTML?: { __html: string };
  "data-testid"?: string;
}

export default function EditableText({
  value,
  fieldKey,
  onEdit,
  isEditing = false,
  as: Tag = "span",
  className = "",
  children,
  dangerouslySetInnerHTML,
  "data-testid": testId,
}: EditableTextProps) {
  const handleClick = () => {
    onEdit(fieldKey);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEdit(fieldKey);
    }
  };

  return (
    <Tag
      className={`edit-effect${isEditing ? " is-editing" : ""}${className ? ` ${className}` : ""}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Click to edit ${fieldKey.replace(/_/g, " ")}`}
      data-testid={testId ?? "editable-text"}
      data-field-key={fieldKey}
      {...(dangerouslySetInnerHTML
        ? { dangerouslySetInnerHTML }
        : { children: children ?? value })}
    />
  );
}
