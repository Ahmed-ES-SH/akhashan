"use client";

import { FiEdit2, FiTrash2, FiArrowUp, FiArrowDown } from "react-icons/fi";
import type { AdminProcessStep } from "@/app/types/website/admin.types";
import type { Locale } from "@/app/types/website/home.types";

/////////////////////////////////////////////////////////////////////
///////////// AdminProcessStepCard — single step card ///////////////
///////////// Shows step number, bilingual title/desc, /////////////
///////////// edit/delete/move-up/move-down actions ////////////////
/////////////////////////////////////////////////////////////////////

interface AdminProcessStepCardProps {
  step: AdminProcessStep;
  index: number;
  totalSteps: number;
  locale: Locale;
  onEdit: (step: AdminProcessStep) => void;
  onDelete: (id: number) => void;
  onMoveUp: (id: number) => void;
  onMoveDown: (id: number) => void;
}

export default function AdminProcessStepCard({
  step,
  index,
  totalSteps,
  locale,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: AdminProcessStepCardProps) {
  const title = locale === "ar" ? (step.title_ar ?? step.title_en ?? "") : (step.title_en ?? step.title_ar ?? "");
  const desc = locale === "ar" ? (step.desc_ar ?? step.desc_en ?? "") : (step.desc_en ?? step.desc_ar ?? "");

  return (
    <div
      className="group relative rounded-xl border border-white/10 bg-white/5 p-6 text-center transition hover:bg-white/10"
      data-testid={`process-step-card-${step.id}`}
    >
      {/* ── Step number badge ────────────────────────────────────── */}
      <div className="relative mb-5">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mx-auto text-xl font-black text-green-dark">
          {step.step_number}
        </div>
        {/* Connector line (not on last item) */}
        {index < totalSteps - 1 && (
          <div className="absolute top-1/2 left-[calc(100%+12px)] w-[calc(100%-80px)] h-px bg-gold/25 max-lg:hidden" />
        )}
      </div>

      {/* ── Title ────────────────────────────────────────────────── */}
      <h4 className="text-base font-bold mb-1.5 text-white truncate">
        {title || <span className="text-white/30 italic">No title</span>}
      </h4>

      {/* ── Description ──────────────────────────────────────────── */}
      <p className="text-sm text-white/60 leading-relaxed max-w-[220px] mx-auto line-clamp-2">
        {desc || <span className="text-white/30 italic">No description</span>}
      </p>

      {/* ── Action buttons (visible on hover) ────────────────────── */}
      <div className="mt-4 flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Move up */}
        <button
          type="button"
          data-testid={`move-up-step-${step.id}`}
          onClick={() => onMoveUp(step.id)}
          disabled={index === 0}
          className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Move step up"
        >
          <FiArrowUp className="w-4 h-4" />
        </button>

        {/* Edit */}
        <button
          type="button"
          data-testid={`edit-step-${step.id}`}
          onClick={() => onEdit(step)}
          className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-gold"
          aria-label="Edit step"
        >
          <FiEdit2 className="w-4 h-4" />
        </button>

        {/* Delete */}
        <button
          type="button"
          data-testid={`delete-step-${step.id}`}
          onClick={() => onDelete(step.id)}
          className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-red-400"
          aria-label="Delete step"
        >
          <FiTrash2 className="w-4 h-4" />
        </button>

        {/* Move down */}
        <button
          type="button"
          data-testid={`move-down-step-${step.id}`}
          onClick={() => onMoveDown(step.id)}
          disabled={index === totalSteps - 1}
          className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Move step down"
        >
          <FiArrowDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
