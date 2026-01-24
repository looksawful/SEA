export type Difficulty = "easy" | "medium" | "hard" | "expert";

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

export const difficultyLabel = (difficulty: Difficulty): string => {
  switch (difficulty) {
    case "easy":
      return "Лёгкая";
    case "medium":
      return "Средняя";
    case "hard":
      return "Сложная";
    case "expert":
      return "Эксперт";
  }
};
