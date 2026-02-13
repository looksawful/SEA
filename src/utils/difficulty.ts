export type Difficulty = "easy" | "medium" | "hard" | "expert";

import { Language, LocalizedText, localize } from "@/utils/i18n";

export const getDifficulty = (round: number): Difficulty => {
  if (round < 3) return "easy";
  if (round < 6) return "medium";
  if (round < 9) return "hard";
  return "expert";
};

export const difficultyDots = (difficulty: Difficulty): string => {
  switch (difficulty) {
    case "easy":
      return "●○○○";
    case "medium":
      return "●●○○";
    case "hard":
      return "●●●○";
    case "expert":
      return "●●●●";
  }
};

const DIFFICULTY_LABELS: Record<Difficulty, LocalizedText> = {
  easy: { ru: "Лёгкая", en: "Easy" },
  medium: { ru: "Средняя", en: "Medium" },
  hard: { ru: "Сложная", en: "Hard" },
  expert: { ru: "Эксперт", en: "Expert" },
};

export const difficultyLabel = (difficulty: Difficulty, language?: Language): string => {
  if (language) {
    return localize(DIFFICULTY_LABELS[difficulty], language);
  }
  return DIFFICULTY_LABELS[difficulty].ru;
};
