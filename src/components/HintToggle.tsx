"use client";
import { useState } from "react";
import { FaRegLightbulb } from "react-icons/fa";
import { useGameStore } from "@/store/gameStore";
import { t } from "@/utils/i18n";

interface HintToggleProps {
  hint?: string | null;
  className?: string;
}

export const HintToggle = ({ hint, className = "" }: HintToggleProps) => {
  const { language } = useGameStore();
  const [open, setOpen] = useState(false);

  if (!hint) return null;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-subtle bg-surface-2 text-muted hover:text-strong hover:bg-surface-3"
        aria-expanded={open}
        aria-label={t(language, "hint")}
      >
        <FaRegLightbulb />
        {t(language, "hint")}
      </button>
      {open && <div className="text-xs text-soft text-center">{hint}</div>}
    </div>
  );
};
