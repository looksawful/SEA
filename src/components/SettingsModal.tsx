"use client";
import { useMemo } from "react";
import { useGameStore } from "@/store/gameStore";
import { GameId, GameTag } from "@/types";
import { GAMES, normalizeGameOrder } from "@/utils/gameConfig";
import { getGameLabel, t } from "@/utils/i18n";
import { Button } from "./Button";
import { FaChevronDown, FaChevronUp, FaCog, FaEnvelope, FaLink, FaTimes } from "react-icons/fa";

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
    gameOrderOverride,
    setGameOrder,
    gameTagOverrides,
    setGameTags,
  } = useGameStore();

  const orderedGameIds = useMemo(() => normalizeGameOrder(gameOrderOverride), [gameOrderOverride]);
  const tagOptions: { id: GameTag; label: string }[] = [
    { id: "design", label: t(language, "tagDesign") },
    { id: "interface", label: t(language, "tagInterface") },
    { id: "color", label: t(language, "tagColor") },
    { id: "typography", label: t(language, "tagTypography") },
    { id: "layout", label: t(language, "tagLayout") },
    { id: "photo", label: t(language, "tagPhoto") },
    { id: "accessibility", label: t(language, "tagAccessibility") },
    { id: "theory", label: t(language, "tagTheory") },
  ];
  const getTagsForGame = (gameId: GameId) => gameTagOverrides[gameId] ?? GAMES[gameId].tags;

  const moveGame = (gameId: GameId, direction: number) => {
    const index = orderedGameIds.indexOf(gameId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= orderedGameIds.length) return;
    const nextOrder = [...orderedGameIds];
    [nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]];
    setGameOrder(nextOrder);
  };

  const toggleTag = (gameId: GameId, tag: GameTag) => {
    const currentTags = new Set(getTagsForGame(gameId));
    if (currentTags.has(tag)) {
      currentTags.delete(tag);
    } else {
      currentTags.add(tag);
    }
    const nextTags = tagOptions.filter((option) => currentTags.has(option.id)).map((option) => option.id);
    setGameTags(gameId, nextTags);
  };

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

          <div className="rounded-xl border border-subtle bg-surface-2 px-4 py-4 text-sm text-muted space-y-4">
            <div className="text-xs uppercase tracking-[0.2em] text-soft">{t(language, "gameOrganization")}</div>
            <div className="space-y-3">
              {orderedGameIds.map((gameId, index) => {
                const gameLabel = getGameLabel(gameId, language);
                const tags = getTagsForGame(gameId);
                return (
                  <div key={gameId} className="rounded-2xl border border-subtle bg-surface-3 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-strong">{gameLabel.name}</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveGame(gameId, -1)}
                          className={`w-8 h-8 rounded-xl border border-subtle bg-surface-2 text-muted hover:text-strong flex items-center justify-center ${
                            index === 0 ? "opacity-40 pointer-events-none" : ""
                          }`}
                          title={t(language, "moveUp")}
                          aria-label={t(language, "moveUp")}
                        >
                          <FaChevronUp />
                        </button>
                        <button
                          onClick={() => moveGame(gameId, 1)}
                          className={`w-8 h-8 rounded-xl border border-subtle bg-surface-2 text-muted hover:text-strong flex items-center justify-center ${
                            index === orderedGameIds.length - 1 ? "opacity-40 pointer-events-none" : ""
                          }`}
                          title={t(language, "moveDown")}
                          aria-label={t(language, "moveDown")}
                        >
                          <FaChevronDown />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-soft">{t(language, "gameTags")}</div>
                    <div className="flex flex-wrap gap-2">
                      {tagOptions.map((option) => {
                        const active = tags.includes(option.id);
                        return (
                          <button
                            key={`${gameId}-${option.id}`}
                            onClick={() => toggleTag(gameId, option.id)}
                            className={`px-3 py-1 rounded-full border text-xs ${
                              active
                                ? "bg-surface-2 text-strong border-subtle"
                                : "bg-surface text-muted border-subtle hover:text-strong"
                            }`}
                            aria-pressed={active}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
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
