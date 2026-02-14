"use client";
import { Card } from "@/components/Card";
import { HintToggle } from "@/components/HintToggle";
import { Swatch } from "@/components/Swatch";
import { useNumberKeys } from "@/hooks/useKeyboard";
import { useSkipSignal } from "@/hooks/useSkipSignal";
import { useSound } from "@/hooks/useSound";
import { useGameStore } from "@/store/gameStore";
import { hslToRgb, rgbToHex } from "@/utils/colors";
import { Difficulty, difficultyDots, getDifficulty } from "@/utils/difficulty";
import { pickRandom, randomInt, shuffle } from "@/utils/helpers";
import { LocalizedText, localize, t } from "@/utils/i18n";
import { motion } from "framer-motion";
import { CSSProperties, useCallback, useEffect, useState } from "react";

const text = (ru: string, en: string): LocalizedText => ({ ru, en });

const THEME_TITLES = {
  "light-to-dark": text("Адаптируй для тёмной темы", "Adapt for the dark theme"),
  "dark-to-light": text("Адаптируй для светлой темы", "Adapt for the light theme"),
};

const THEME_HINTS = {
  "light-to-dark": text(
    "Инвертируй светлоту и слегка снизь насыщенность для тёмного UI.",
    "Invert lightness and slightly reduce saturation for dark UI.",
  ),
  "dark-to-light": text(
    "Инвертируй светлоту и слегка увеличь насыщенность для светлого UI.",
    "Invert lightness and slightly increase saturation for light UI.",
  ),
};

const THEME_EXPLANATIONS = {
  "light-to-dark": text(
    "Для тёмной темы: инвертируй светлоту (L), слегка снизь насыщенность (S), сохрани тон (H). Это обеспечивает читаемость на тёмном фоне.",
    "For a dark theme: invert lightness (L), slightly reduce saturation (S), keep hue (H). This ensures readability on a dark background.",
  ),
  "dark-to-light": text(
    "Для светлой темы: инвертируй светлоту (L), слегка увеличь насыщенность (S), сохрани тон (H). Это обеспечивает контраст на светлом фоне.",
    "For a light theme: invert lightness (L), slightly increase saturation (S), keep hue (H). This ensures contrast on a light background.",
  ),
};

const LABELS = {
  original: text("Оригинал", "Original"),
  correct: text("Правильный", "Correct"),
  yourChoice: text("Ваш выбор", "Your choice"),
  originalLightTheme: text("Оригинал (светлая тема)", "Original (light theme)"),
  originalDarkTheme: text("Оригинал (тёмная тема)", "Original (dark theme)"),
  targetTheme: text("Целевая тема", "Target theme"),
  correctAdaptation: text("Правильная адаптация", "Correct adaptation"),
};

type ThemeType = "light-to-dark" | "dark-to-light";

interface Challenge {
  originalColor: string;
  originalHsl: { h: number; s: number; l: number };
  themeType: ThemeType;
  options: { color: string; hsl: { h: number; s: number; l: number } }[];
  correctIndex: number;
  difficulty: Difficulty;
}

const adaptColorForDarkTheme = (
  hsl: { h: number; s: number; l: number },
  difficulty: Difficulty,
): { h: number; s: number; l: number } => {
  const saturationShift = difficulty === "expert" ? 16 : difficulty === "hard" ? 12 : 10;
  const lightnessShift = difficulty === "expert" ? 20 : difficulty === "hard" ? 18 : 15;
  return {
    h: hsl.h,
    s: Math.max(hsl.s - saturationShift, 18),
    l: Math.min(100 - hsl.l + lightnessShift, 92),
  };
};

const adaptColorForLightTheme = (
  hsl: { h: number; s: number; l: number },
  difficulty: Difficulty,
): { h: number; s: number; l: number } => {
  const saturationShift = difficulty === "expert" ? 16 : difficulty === "hard" ? 12 : 10;
  const lightnessShift = difficulty === "expert" ? 20 : difficulty === "hard" ? 18 : 15;
  return {
    h: hsl.h,
    s: Math.min(hsl.s + saturationShift, 92),
    l: Math.max(100 - hsl.l - lightnessShift, 18),
  };
};

const generateWrongAdaptation = (
  correctHsl: { h: number; s: number; l: number },
  difficulty: Difficulty,
): { h: number; s: number; l: number } => {
  let hVar: number, sVar: number, lVar: number;

  switch (difficulty) {
    case "easy":
      hVar = randomInt(20, 40);
      sVar = randomInt(15, 30);
      lVar = randomInt(20, 35);
      break;
    case "medium":
      hVar = randomInt(10, 25);
      sVar = randomInt(10, 20);
      lVar = randomInt(12, 22);
      break;
    case "hard":
      hVar = randomInt(5, 15);
      sVar = randomInt(5, 12);
      lVar = randomInt(6, 14);
      break;
    case "expert":
      hVar = randomInt(3, 9);
      sVar = randomInt(4, 8);
      lVar = randomInt(4, 8);
      break;
  }

  const dir = Math.random() > 0.5 ? 1 : -1;

  return {
    h: (((correctHsl.h + dir * hVar) % 360) + 360) % 360,
    s: Math.max(10, Math.min(95, correctHsl.s + dir * sVar)),
    l: Math.max(10, Math.min(90, correctHsl.l + dir * lVar)),
  };
};

const generateChallenge = (round: number): Challenge => {
  const difficulty = getDifficulty(round);
  const themeType = pickRandom(["light-to-dark", "dark-to-light"] as ThemeType[]);

  let originalHsl: { h: number; s: number; l: number };

  if (themeType === "light-to-dark") {
    originalHsl = { h: randomInt(0, 359), s: randomInt(50, 80), l: randomInt(25, 45) };
  } else {
    originalHsl = { h: randomInt(0, 359), s: randomInt(40, 70), l: randomInt(55, 75) };
  }

  const { r, g, b } = hslToRgb(originalHsl.h, originalHsl.s, originalHsl.l);
  const originalColor = rgbToHex(r, g, b);

  const correctHsl =
    themeType === "light-to-dark"
      ? adaptColorForDarkTheme(originalHsl, difficulty)
      : adaptColorForLightTheme(originalHsl, difficulty);

  const wrongOptions: { h: number; s: number; l: number }[] = [];
  const usedKeys = new Set<string>();
  usedKeys.add(`${correctHsl.h}-${correctHsl.s}-${correctHsl.l}`);

  while (wrongOptions.length < 3) {
    const wrong = generateWrongAdaptation(correctHsl, difficulty);
    const key = `${wrong.h}-${wrong.s}-${wrong.l}`;
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
      wrongOptions.push(wrong);
    }
  }

  const allOptions = [correctHsl, ...wrongOptions].map((hsl) => {
    const { r, g, b } = hslToRgb(hsl.h, hsl.s, hsl.l);
    return { color: rgbToHex(r, g, b), hsl };
  });

  const shuffledOptions = shuffle(allOptions);
  const correctIndex = shuffledOptions.findIndex(
    (o) => o.hsl.h === correctHsl.h && o.hsl.s === correctHsl.s && o.hsl.l === correctHsl.l,
  );

  return {
    originalColor,
    originalHsl,
    themeType,
    options: shuffledOptions,
    correctIndex,
    difficulty,
  };
};

interface Props {
  onAnswer: (correct: boolean) => void;
}

export const ThemeAnalogGame = ({ onAnswer }: Props) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(0);
  const { addScore, incrementStreak, resetStreak, updateStats, addMistake, setReviewPause, language } = useGameStore();
  const { playCorrect, playWrong } = useSound();

  useEffect(() => {
    setChallenge(generateChallenge(round));
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      if (showResult || !challenge) return;

      setSelected(index);
      setShowResult(true);

      const correct = index === challenge.correctIndex;
      const correctOption = challenge.options[challenge.correctIndex];

      if (correct) {
        const pts =
          challenge.difficulty === "expert"
            ? 210
            : challenge.difficulty === "hard"
              ? 180
              : challenge.difficulty === "medium"
                ? 140
                : 110;
        addScore(pts);
        incrementStreak();
        playCorrect();
      } else {
        resetStreak();
        playWrong();
        const userOption = challenge.options[index];
        addMistake({
          question: localize(THEME_TITLES[challenge.themeType], language),
          userAnswer: `H=${userOption.hsl.h}° S=${userOption.hsl.s}% L=${userOption.hsl.l}%`,
          correctAnswer: `H=${correctOption.hsl.h}° S=${correctOption.hsl.s}% L=${correctOption.hsl.l}%`,
          explanation: localize(THEME_EXPLANATIONS[challenge.themeType], language),
          visual: {
            type: "colors",
            data: {
              [localize(LABELS.original, language)]: challenge.originalColor,
              [localize(LABELS.correct, language)]: correctOption.color,
              [localize(LABELS.yourChoice, language)]: userOption.color,
            },
          },
        });
      }

      updateStats("theme-analog", correct);

      const reviewDelay = correct ? 1200 : 2400;
      setReviewPause(reviewDelay);

      setTimeout(() => {
        onAnswer(correct);
        setRound((r) => r + 1);
        setChallenge(generateChallenge(round + 1));
        setSelected(null);
        setShowResult(false);
      }, reviewDelay);
    },
    [challenge, showResult, round, setReviewPause],
  );

  const handleSkip = useCallback(() => {
    if (!challenge || showResult) return;
    onAnswer(false);
    setRound((r) => r + 1);
    setChallenge(generateChallenge(round + 1));
    setSelected(null);
    setShowResult(false);
  }, [challenge, showResult, round, onAnswer]);

  useSkipSignal(handleSkip, !showResult);

  useNumberKeys((num) => {
    if (num < (challenge?.options.length || 0)) handleSelect(num);
  }, !showResult);

  if (!challenge) return null;

  const bgColor = challenge.themeType === "light-to-dark" ? "#1a1a1a" : "#ffffff";
  const textColor = challenge.themeType === "light-to-dark" ? "#ffffff" : "#1a1a1a";
  const themeStyle = { "--swatch": bgColor, "--swatch-ink": textColor } as CSSProperties;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">
          {localize(THEME_TITLES[challenge.themeType], language)}
        </h2>
        <HintToggle hint={localize(THEME_HINTS[challenge.themeType], language)} />
        <div className="text-xs text-soft">
          {t(language, "difficultyLabel")}: {difficultyDots(challenge.difficulty)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-xs text-muted text-center">{localize(challenge.themeType === "light-to-dark" ? LABELS.originalLightTheme : LABELS.originalDarkTheme, language)}</div>
          <div className="bg-surface rounded-xl p-4 flex items-center justify-center h-24 border border-subtle shadow-card">
            <Swatch color={challenge.originalColor} className="w-16 h-16 rounded-lg shadow-card border border-subtle" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-muted text-center">{localize(LABELS.targetTheme, language)}</div>
          <div
            className="rounded-xl p-4 flex items-center justify-center h-24 bg-swatch text-swatch border border-subtle shadow-card"
            style={themeStyle}
          >
            <span className="text-2xl">?</span>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-muted">
        HSL({challenge.originalHsl.h}°, {challenge.originalHsl.s}%, {challenge.originalHsl.l}%)
      </div>

      <div className="grid grid-cols-2 gap-3">
        {challenge.options.map((option, index) => (
          <Card
            key={index}
            onClick={() => handleSelect(index)}
            selected={selected === index}
            correct={showResult ? index === challenge.correctIndex : null}
            padding="none"
            className="overflow-hidden"
          >
            <div className="p-3 flex items-center gap-3 bg-swatch text-swatch" style={themeStyle}>
              <Swatch color={option.color} className="w-12 h-12 rounded-lg shadow-card border border-subtle" />
              <div className="text-xs font-mono">
                <div>H: {option.hsl.h}°</div>
                <div>S: {option.hsl.s}%</div>
                <div>L: {option.hsl.l}%</div>
              </div>
              <span className="ml-auto text-xs opacity-50 hidden sm:inline">[{index + 1}]</span>
            </div>
          </Card>
        ))}
      </div>

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-muted"
        >
          {localize(LABELS.correctAdaptation, language)}: H={challenge.options[challenge.correctIndex].hsl.h}° S=
          {challenge.options[challenge.correctIndex].hsl.s}% L={challenge.options[challenge.correctIndex].hsl.l}%
        </motion.div>
      )}
    </div>
  );
};
