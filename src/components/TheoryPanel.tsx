"use client";
import { GameId } from "@/types";
import { localize, t, Language } from "@/utils/i18n";
import { GAME_THEORY } from "@/utils/theoryData";
import { AnimatePresence, motion } from "framer-motion";
import { FaBook, FaTimes } from "react-icons/fa";

interface TheoryPanelProps {
  gameId: GameId;
  language: Language;
  open: boolean;
  onClose: () => void;
}

export const TheoryPanel = ({ gameId, language, open, onClose }: TheoryPanelProps) => {
  const theory = GAME_THEORY[gameId];

  if (!theory) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto py-8 px-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-surface-2 border border-subtle rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <FaBook className="text-lg" />
                </div>
                <h2 className="text-lg font-display font-semibold text-strong">
                  {localize(theory.title, language)}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-surface-3 border border-subtle flex items-center justify-center text-muted hover:text-strong hover:bg-surface-3 transition-colors"
                aria-label={t(language, "close")}
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {theory.sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="bg-surface-3 border border-subtle rounded-xl p-4 space-y-2"
                >
                  <h3 className="text-sm font-display font-semibold text-strong">
                    {localize(section.heading, language)}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {localize(section.body, language)}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="p-4 pt-0">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
              >
                {language === "ru" ? "Понятно, начать" : "Got it, start"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const TheoryButton = ({
  gameId,
  language,
  onClick,
}: {
  gameId: GameId;
  language: Language;
  onClick: () => void;
}) => {
  const theory = GAME_THEORY[gameId];
  if (!theory) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-3 border border-subtle text-sm font-medium text-muted hover:text-strong hover:border-accent/30 transition-all w-full"
    >
      <FaBook className="text-accent" />
      {language === "ru" ? "Теория" : "Theory"}
    </button>
  );
};
