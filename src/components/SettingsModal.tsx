"use client";
import { useGameStore } from "@/store/gameStore";
import { t } from "@/utils/i18n";
import { Button } from "./Button";
import { FaCog, FaEnvelope, FaLink, FaTimes } from "react-icons/fa";

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal = ({ onClose }: SettingsModalProps) => {
  const {
    soundEnabled,
    toggleSound,
    backgroundAnimation,
    setBackgroundAnimation,
    timedMode,
    setTimedMode,
    language,
  } = useGameStore();

  return (
    <div className="fixed inset-0 z-30 bg-[color:var(--surface-1-95)] backdrop-blur-sm overflow-y-auto">
      <div className="max-w-xl mx-auto p-4 sm:p-6">
        <div className="bg-surface border border-subtle rounded-3xl shadow-card p-4 sm:p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-surface-2 border border-subtle flex items-center justify-center text-accent">
                <FaCog />
              </span>
              <h2 className="text-2xl font-display font-semibold tracking-tight">{t(language, "settings")}</h2>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <span className="inline-flex items-center gap-2">
                <FaTimes />
                {t(language, "close")}
              </span>
            </Button>
          </div>

          <div className="space-y-3 text-sm text-muted">
            <div className="flex items-center justify-between rounded-xl border border-subtle bg-surface-2 px-4 py-3">
              <span>{t(language, "sound")}</span>
              <button
                onClick={toggleSound}
                className="text-xs font-medium text-strong bg-surface-3 border border-subtle rounded-full px-3 py-1"
                aria-pressed={soundEnabled}
              >
                {soundEnabled ? t(language, "on") : t(language, "off")}
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-subtle bg-surface-2 px-4 py-3">
              <span>{t(language, "backgroundAnimation")}</span>
              <button
                onClick={() => setBackgroundAnimation(!backgroundAnimation)}
                className="text-xs font-medium text-strong bg-surface-3 border border-subtle rounded-full px-3 py-1"
                aria-pressed={backgroundAnimation}
              >
                {backgroundAnimation ? t(language, "on") : t(language, "off")}
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-subtle bg-surface-2 px-4 py-3">
              <span>{t(language, "timedMode")}</span>
              <button
                onClick={() => setTimedMode(!timedMode)}
                className="text-xs font-medium text-strong bg-surface-3 border border-subtle rounded-full px-3 py-1"
                aria-pressed={timedMode}
              >
                {timedMode ? t(language, "on") : t(language, "off")}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-subtle bg-surface-2 px-4 py-3 text-sm text-muted space-y-1">
            <div className="text-xs uppercase tracking-[0.2em] text-soft">{t(language, "hotkeysTitle")}</div>
            <div>{t(language, "hotkeyStart")}</div>
            <div>{t(language, "hotkeyPause")}</div>
            <div>{t(language, "hotkeySkip")}</div>
            <div>{t(language, "hotkeyShuffle")}</div>
            <div>{t(language, "hotkeyAnswer")}</div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <a
              href="mailto:i@lookawful.ru?subject=Awful-Exercises%20feedback"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-subtle bg-surface-2 px-4 py-2 text-sm text-muted hover:text-strong hover:bg-surface-3"
            >
              <FaEnvelope />
              {t(language, "feedback")}
            </a>
            <a
              href="https://github.com/looksawful/Awful-Exercises"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-subtle bg-surface-2 px-4 py-2 text-sm text-muted hover:text-strong hover:bg-surface-3"
            >
              <FaLink />
              {t(language, "github")}
            </a>
            <a
              href="https://github.com/looksawful/Awful-Exercises/blob/main/LICENSE"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-subtle bg-surface-2 px-4 py-2 text-sm text-muted hover:text-strong hover:bg-surface-3"
            >
              <FaLink />
              {t(language, "license")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
