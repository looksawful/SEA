"use client";
import { Card } from "@/components/Card";
import { HintToggle } from "@/components/HintToggle";
import { useNumberKeys } from "@/hooks/useKeyboard";
import { useSkipSignal } from "@/hooks/useSkipSignal";
import { useSound } from "@/hooks/useSound";
import { useGameStore } from "@/store/gameStore";
import { getContrastRatio, hslToRgb, randomHsl, rgbToHex } from "@/utils/colors";
import { Difficulty, difficultyDots, getDifficulty } from "@/utils/difficulty";
import { getRandomText, pickRandom, shuffle } from "@/utils/helpers";
import { Language, LocalizedText, localize, t } from "@/utils/i18n";
import { motion } from "framer-motion";
import { CSSProperties, useCallback, useEffect, useState } from "react";

type WcagLevel = "AAA" | "AA" | "AA Large" | "Fail";
type ChallengeMode = "level" | "pass-fail" | "large-text";

interface Challenge {
  foreground: string;
  background: string;
  contrastRatio: number;
  correctLevel: WcagLevel;
  options: WcagLevel[];
  text: string;
  difficulty: Difficulty;
  mode: ChallengeMode;
}

const text = (ru: string, en: string): LocalizedText => ({ ru, en });

const getWcagLevel = (ratio: number): WcagLevel => {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
};

const WCAG_EXPLANATIONS: Record<WcagLevel, LocalizedText> = {
  AAA: text(
    "Контраст ≥7:1 — максимальный уровень доступности для обычного текста",
    "Contrast ≥7:1 — highest accessibility level for normal text",
  ),
  AA: text(
    "Контраст ≥4.5:1 — минимальный стандарт для обычного текста",
    "Contrast ≥4.5:1 — minimum standard for normal text",
  ),
  "AA Large": text(
    "Контраст ≥3:1 — допустимо только для крупного текста (18pt+ или 14pt bold)",
    "Contrast ≥3:1 — allowed only for large text (18pt+ or 14pt bold)",
  ),
  Fail: text("Контраст <3:1 — не соответствует WCAG", "Contrast <3:1 — does not meet WCAG standards"),
};

const PROMPTS: Record<ChallengeMode, LocalizedText> = {
  level: text("Определить уровень WCAG", "Determine the WCAG level"),
  "pass-fail": text("Проходит ли WCAG AA?", "Passes WCAG AA?"),
  "large-text": text("Проходит ли для крупного текста?", "Passes for large text?"),
};

const WCAG_HINT = text(
  "AA требует 4.5:1, для крупного текста достаточно 3:1, AAA начинается с 7:1.",
  "AA needs 4.5:1, large text allows 3:1, AAA starts at 7:1.",
);
const PASS_LABEL = text("Проходит", "Pass");
const FAIL_LABEL = text("Не проходит", "Fail");
const CONTRAST_LABEL = text("Контраст", "Contrast");
const TEXT_LABEL = text("Текст", "Text");
const BACKGROUND_LABEL = text("Фон", "Background");
const LARGE_TEXT_EXPLANATION = text(
  "Для крупного текста достаточно 3:1 (AA Large).",
  "Large text requires only 3:1 (AA Large).",
);

const getPrompt = (mode: ChallengeMode, language: Language) => localize(PROMPTS[mode], language);

const getOptionLabel = (mode: ChallengeMode, level: WcagLevel, language: Language) => {
  if (mode === "pass-fail" || mode === "large-text") {
    return level === "AA" ? localize(PASS_LABEL, language) : localize(FAIL_LABEL, language);
  }
  return level;
};

const generateColorWithContrast = (bg: string, targetLevel: WcagLevel): string => {
  const bgIsLight = bg === "#ffffff" || bg === "#fafafa";
  let attempts = 0;

  while (attempts < 50) {
    const hsl = randomHsl();

    switch (targetLevel) {
      case "AAA":
        hsl.l = bgIsLight ? Math.floor(Math.random() * 25) + 5 : Math.floor(Math.random() * 25) + 70;
        break;
      case "AA":
        hsl.l = bgIsLight ? Math.floor(Math.random() * 20) + 25 : Math.floor(Math.random() * 20) + 55;
        break;
      case "AA Large":
        hsl.l = bgIsLight ? Math.floor(Math.random() * 15) + 40 : Math.floor(Math.random() * 15) + 45;
        break;
      case "Fail":
        hsl.l = bgIsLight ? Math.floor(Math.random() * 20) + 55 : Math.floor(Math.random() * 20) + 25;
        hsl.s = Math.floor(Math.random() * 30) + 20;
        break;
    }

    const { r, g, b } = hslToRgb(hsl.h, hsl.s, hsl.l);
    const fg = rgbToHex(r, g, b);
    const ratio = getContrastRatio(fg, bg);
    const actualLevel = getWcagLevel(ratio);

    if (actualLevel === targetLevel) {
      return fg;
    }

    attempts++;
  }

  return bgIsLight ? "#333333" : "#cccccc";
};

const generateChallenge = (round: number, language: Language): Challenge => {
  const difficulty = getDifficulty(round);
  const mode: ChallengeMode =
    difficulty === "easy" ? "pass-fail" : difficulty === "expert" ? "large-text" : pickRandom(["level", "pass-fail"]);

  const backgrounds = ["#ffffff", "#fafafa", "#1a1a1a", "#0a0a0a", "#f3f0e8", "#102a43"];
  const background = pickRandom(backgrounds);

  const levels: WcagLevel[] = ["AAA", "AA", "AA Large", "Fail"];
  const targetLevel = pickRandom(levels);

  const foreground = generateColorWithContrast(background, targetLevel);
  const contrastRatio = getContrastRatio(foreground, background);
  const computedLevel = getWcagLevel(contrastRatio);
  const passesNormal = contrastRatio >= 4.5;
  const passesLarge = contrastRatio >= 3;
  const correctLevel =
    mode === "pass-fail"
      ? passesNormal
        ? "AA"
        : "Fail"
      : mode === "large-text"
        ? passesLarge
          ? "AA"
          : "Fail"
        : computedLevel;

  let options: WcagLevel[];
  if (mode === "pass-fail" || mode === "large-text") {
    options = shuffle(["AA", "Fail"] as WcagLevel[]);
  } else if (difficulty === "easy") {
    options = shuffle(["AAA", "AA", "Fail"] as WcagLevel[]);
    if (!options.includes(correctLevel)) options[0] = correctLevel;
  } else {
    options = shuffle([...levels]);
  }

  const text = getRandomText(language);

  return {
    foreground,
    background,
    contrastRatio,
    correctLevel,
    options: options.slice(0, 4),
    text,
    difficulty,
    mode,
  };
};

interface Props {
  onAnswer: (correct: boolean) => void;
}

export const AccessibilityGame = ({ onAnswer }: Props) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(0);
  const language = useGameStore((state) => state.language);
  const { addScore, incrementStreak, resetStreak, updateStats, addMistake, setReviewPause } = useGameStore();
  const { playCorrect, playWrong } = useSound();

  useEffect(() => {
    setChallenge(generateChallenge(round, language));
  }, [language]);

  const handleSelect = useCallback(
    (index: number) => {
      if (showResult || !challenge) return;

      setSelected(index);
      setShowResult(true);

      const userAnswer = challenge.options[index];
      const correct = userAnswer === challenge.correctLevel;

      if (correct) {
        const points = challenge.difficulty === "hard" ? 150 : challenge.difficulty === "medium" ? 130 : 120;
        addScore(points);
        incrementStreak();
        playCorrect();
      } else {
        resetStreak();
        playWrong();
        const explanation =
          challenge.mode === "large-text"
            ? localize(LARGE_TEXT_EXPLANATION, language)
            : localize(WCAG_EXPLANATIONS[challenge.correctLevel], language);
        const contrastLabel = localize(CONTRAST_LABEL, language);
        const textLabel = localize(TEXT_LABEL, language);
        const backgroundLabel = localize(BACKGROUND_LABEL, language);
        const question = getPrompt(challenge.mode, language);
        const userAnswerLabel = getOptionLabel(challenge.mode, userAnswer, language);
        const correctAnswerLabel = getOptionLabel(challenge.mode, challenge.correctLevel, language);
        addMistake({
          question,
          userAnswer: userAnswerLabel,
          correctAnswer: correctAnswerLabel,
          explanation: `${contrastLabel} ${challenge.contrastRatio.toFixed(2)}:1. ${explanation}`,
          visual: {
            type: "contrast",
            data: {
              [textLabel]: challenge.foreground,
              [backgroundLabel]: challenge.background,
            },
          },
        });
      }

      updateStats("accessibility", correct);

      const reviewDelay = correct ? 1200 : 2400;
      setReviewPause(reviewDelay);

      setTimeout(() => {
        onAnswer(correct);
        setRound((r) => r + 1);
        setChallenge(generateChallenge(round + 1, language));
        setSelected(null);
        setShowResult(false);
      }, reviewDelay);
    },
    [challenge, showResult, round, setReviewPause, language],
  );

  const handleSkip = useCallback(() => {
    if (!challenge || showResult) return;
    onAnswer(false);
    setRound((r) => r + 1);
    setChallenge(generateChallenge(round + 1, language));
    setSelected(null);
    setShowResult(false);
  }, [challenge, showResult, round, onAnswer, language]);

  useSkipSignal(handleSkip, !showResult);

  useNumberKeys((num) => {
    if (num < (challenge?.options.length || 0)) {
      handleSelect(num);
    }
  }, !showResult);

  if (!challenge) return null;

  const levelTone: Record<WcagLevel, string> = {
    AAA: "text-[color:var(--success)]",
    AA: "text-accent",
    "AA Large": "text-[color:var(--warning)]",
    Fail: "text-[color:var(--danger)]",
  };
  const swatchStyle = {
    "--swatch": challenge.background,
    "--swatch-ink": challenge.foreground,
  } as CSSProperties;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">
          {getPrompt(challenge.mode, language)}
        </h2>
        <HintToggle hint={localize(WCAG_HINT, language)} />
        <div className="text-xs text-soft">
          {t(language, "difficultyLabel")}: {difficultyDots(challenge.difficulty)}
        </div>
      </div>

      <motion.div
        className="rounded-2xl p-8 min-h-32 flex flex-col items-center justify-center bg-swatch border border-subtle shadow-card"
        style={swatchStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {challenge.mode === "large-text" && (
          <span className="text-xs opacity-60 mb-2 text-swatch">
            {language === "ru" ? "КРУПНЫЙ ТЕКСТ (18pt+)" : "LARGE TEXT (18pt+)"}
          </span>
        )}
        <p
          className={`font-medium text-center text-swatch ${challenge.mode === "large-text" ? "text-3xl" : "text-2xl"}`}
        >
          {challenge.text}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {challenge.options.map((level, index) => (
          <Card
            key={index}
            onClick={() => handleSelect(index)}
            selected={selected === index}
            correct={showResult ? level === challenge.correctLevel : null}
          >
            <div className="text-center">
              <span className={`font-mono text-lg ${levelTone[level]}`}>
                {getOptionLabel(challenge.mode, level, language)}
              </span>
              <span className="hidden sm:inline text-xs text-soft ml-2">[{index + 1}]</span>
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
          <div className="font-mono">
            {localize(CONTRAST_LABEL, language)}: {challenge.contrastRatio.toFixed(2)}:1
          </div>
          <div className="text-xs mt-1 text-soft">
            {challenge.mode === "large-text"
              ? localize(LARGE_TEXT_EXPLANATION, language)
              : localize(WCAG_EXPLANATIONS[challenge.correctLevel], language)}
          </div>
        </motion.div>
      )}
    </div>
  );
};
