"use client";
import { CSSProperties } from "react";
import { useGameStore } from "@/store/gameStore";
import { AnimatePresence, motion } from "framer-motion";
import { t } from "@/utils/i18n";

interface ScoreDisplayProps {
  showStreak?: boolean;
  showLives?: boolean;
  compact?: boolean;
}

export const ScoreDisplay = ({ showStreak = true, showLives = true, compact = false }: ScoreDisplayProps) => {
  const { score, streak, lives, language } = useGameStore();

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <span className="font-mono font-bold">{score.toLocaleString()}</span>
        {showStreak && streak > 0 && <span className="text-amber-500">{streak}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <div className="text-xs text-muted uppercase tracking-wide">{t(language, "scoreLabel")}</div>
        <motion.div
          key={score}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="text-2xl font-mono font-bold"
        >
          {score.toLocaleString()}
        </motion.div>
      </div>

      {showStreak && (
        <div className="text-center">
          <div className="text-xs text-muted uppercase tracking-wide">{t(language, "streakLabel")}</div>
          <div className="flex items-center justify-center gap-1">
            <AnimatePresence mode="wait">
              {streak > 0 && (
                <motion.span
                  key={streak}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  className="text-[color:var(--warning)]"
                >
                  *
                </motion.span>
              )}
            </AnimatePresence>
            <span className="text-2xl font-mono font-bold">{streak}</span>
          </div>
        </div>
      )}

      {showLives && (
        <div className="text-center">
          <div className="text-xs text-muted uppercase tracking-wide">{t(language, "livesLabel")}</div>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <motion.span
                key={i}
                initial={false}
                animate={{
                  scale: i < lives ? 1 : 0.8,
                  opacity: i < lives ? 1 : 0.3,
                }}
                className="text-xl"
              >
                <span className="inline-block w-4 h-4 rounded-full bg-[color:var(--danger)]" />
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface PointsPopupProps {
  points: number;
  x: number;
  y: number;
}

export const PointsPopup = ({ points, x, y }: PointsPopupProps) => {
  const isPositive = points > 0;
  const posStyle = { "--pos-x": `${x}px`, "--pos-y": `${y}px` } as CSSProperties;

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 0.5 }}
      animate={{ opacity: 0, y: -50, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className={`fixed pos-var pointer-events-none font-bold text-lg ${isPositive ? "text-[color:var(--success)]" : "text-[color:var(--danger)]"}`}
      style={posStyle}
    >
      {isPositive ? "+" : ""}
      {points}
    </motion.div>
  );
};
