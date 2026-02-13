"use client";
import { Card } from "@/components/Card";
import { HintToggle } from "@/components/HintToggle";
import { Swatch } from "@/components/Swatch";
import { useNumberKeys } from "@/hooks/useKeyboard";
import { useSkipSignal } from "@/hooks/useSkipSignal";
import { useSound } from "@/hooks/useSound";
import { useGameStore } from "@/store/gameStore";
import { getComplementary, hslToRgb, randomHsl, rgbToHex } from "@/utils/colors";
import { Difficulty, difficultyDots, getDifficulty } from "@/utils/difficulty";
import { pickRandom, shuffle } from "@/utils/helpers";
import { LocalizedText, localize, t } from "@/utils/i18n";
import { motion } from "framer-motion";
import { CSSProperties, useCallback, useEffect, useState } from "react";

const text = (ru: string, en: string): LocalizedText => ({ ru, en });

const MODE_TITLES = {
  complementary: text("Выбрать комплементарный цвет", "Choose the complementary color"),
  split: text("Выбрать сплит-комплементарный цвет", "Choose the split-complementary color"),
};

const MODE_HINTS = {
  complementary: text(
    "Комплементарные цвета расположены напротив на круге (180°).",
    "Complementary colors are 180° apart on the wheel.",
  ),
  split: text(
    "Сплит-комплементарный находится на ±30° от комплементарного.",
    "Split-complementary sits ±30° from the complement.",
  ),
};

const MODE_EXPLANATIONS = {
  complementary: (baseHue: number, complementaryHue: number) => ({
    ru: `Комплементарный цвет находится на противоположной стороне цветового круга (180° от базового). Базовый тон: ${baseHue}°, комплементарный: ${complementaryHue}°`,
    en: `A complementary color is on the opposite side of the color wheel (180° from the base). Base hue: ${baseHue}°, complementary: ${complementaryHue}°`,
  }),
  split: (baseHue: number, targetHue: number) => ({
    ru: `Сплит-комплементарные цвета находятся на ±30° от комплементарного. Базовый тон: ${baseHue}°, целевой: ${targetHue}°`,
    en: `Split-complementary colors sit ±30° from the complement. Base hue: ${baseHue}°, target: ${targetHue}°`,
  }),
};

const LABELS = {
  hue: text("Тон", "Hue"),
  deviation: text("отклонение", "deviation"),
  correct: text("правильный", "correct"),
  base: text("Базовый", "Base"),
  complementary: text("Комплементарный", "Complementary"),
  yourChoice: text("Ваш выбор", "Your choice"),
};

interface Challenge {
  baseColor: string;
  baseHsl: { h: number; s: number; l: number };
  options: { color: string; hue: number }[];
  correctIndex: number;
  difficulty: Difficulty;
  mode: "complementary" | "split";
  targetHue: number;
}

const generateChallenge = (round: number): Challenge => {
  const difficulty = getDifficulty(round);
  const modes: Challenge["mode"][] = ["complementary", "split"];
  const mode = difficulty === "easy" ? "complementary" : pickRandom(modes);

  const baseHsl = randomHsl();
  const { r, g, b } = hslToRgb(baseHsl.h, baseHsl.s, baseHsl.l);
  const baseColor = rgbToHex(r, g, b);

  const complementaryHue = getComplementary(baseHsl.h);
  const splitOffset = pickRandom([30, -30]);
  const targetHue = mode === "split" ? (complementaryHue + splitOffset + 360) % 360 : complementaryHue;

  let wrongHues: number[];
  switch (difficulty) {
    case "easy":
      wrongHues = [(baseHsl.h + 90) % 360, (baseHsl.h + 60) % 360, (baseHsl.h + 270) % 360];
      break;
    case "medium":
      wrongHues = [(complementaryHue + 45) % 360, (complementaryHue + 315) % 360, (baseHsl.h + 90) % 360];
      break;
    case "hard":
      wrongHues = [(targetHue + 18) % 360, (targetHue + 342) % 360, (complementaryHue + 15) % 360];
      break;
    case "expert":
      wrongHues = [(targetHue + 12) % 360, (targetHue + 348) % 360, (complementaryHue + 8) % 360];
      break;
  }

  const options = [targetHue, ...wrongHues].map((hue) => {
    const { r, g, b } = hslToRgb(hue, baseHsl.s, baseHsl.l);
    return { color: rgbToHex(r, g, b), hue };
  });

  const shuffledOptions = shuffle(options);
  const correctIndex = shuffledOptions.findIndex((o) => o.hue === targetHue);

  return {
    baseColor,
    baseHsl,
    options: shuffledOptions,
    correctIndex,
    difficulty,
    mode,
    targetHue,
  };
};

interface Props {
  onAnswer: (correct: boolean) => void;
}

export const ComplementaryGame = ({ onAnswer }: Props) => {
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
      const complementaryHue = getComplementary(challenge.baseHsl.h);

      if (correct) {
        const points =
          challenge.difficulty === "expert"
            ? 180
            : challenge.difficulty === "hard"
              ? 150
              : challenge.difficulty === "medium"
                ? 120
                : 100;
        addScore(points);
        incrementStreak();
        playCorrect();
      } else {
        resetStreak();
        playWrong();
        const userHue = challenge.options[index].hue;
        const explanationText =
          challenge.mode === "split"
            ? MODE_EXPLANATIONS.split(challenge.baseHsl.h, challenge.targetHue)
            : MODE_EXPLANATIONS.complementary(challenge.baseHsl.h, complementaryHue);
        addMistake({
          question: localize(MODE_TITLES[challenge.mode], language),
          userAnswer: `${localize(LABELS.hue, language)} ${userHue}° (${localize(LABELS.deviation, language)} ${Math.abs(userHue - challenge.targetHue)}°)`,
          correctAnswer: `${localize(LABELS.hue, language)} ${challenge.targetHue}°`,
          explanation: localize(explanationText, language),
          visual: {
            type: "colors",
            data: {
              [localize(LABELS.base, language)]: challenge.baseColor,
              [localize(LABELS.complementary, language)]: challenge.options[challenge.correctIndex].color,
              [localize(LABELS.yourChoice, language)]: challenge.options[index].color,
            },
          },
        });
      }

      updateStats("complementary", correct);

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
    if (num < (challenge?.options.length || 0)) {
      handleSelect(num);
    }
  }, !showResult);

  if (!challenge) return null;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">
          {localize(MODE_TITLES[challenge.mode], language)}
        </h2>
        <HintToggle hint={localize(MODE_HINTS[challenge.mode], language)} />
        <div className="text-xs text-soft">
          {t(language, "difficultyLabel")}: {difficultyDots(challenge.difficulty)}
        </div>
      </div>

      <div className="flex justify-center">
        <motion.div className="w-32 h-32" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Swatch color={challenge.baseColor} className="w-full h-full rounded-2xl shadow-card border border-subtle" />
        </motion.div>
      </div>

      <div className="text-center text-sm text-muted">
        {localize(LABELS.hue, language)}: {challenge.baseHsl.h}°
      </div>

      <div className="grid grid-cols-2 gap-3">
        {challenge.options.map((option, index) => {
          const swatchStyle = { "--swatch": option.color } as CSSProperties;
          return (
            <Card
              key={index}
              onClick={() => handleSelect(index)}
              selected={selected === index}
              correct={showResult ? index === challenge.correctIndex : null}
              padding="none"
              className="aspect-square overflow-hidden"
            >
              <motion.div
                className="w-full h-full flex items-end justify-center pb-3 bg-swatch"
                style={swatchStyle}
                whileHover={{ scale: 1.02 }}
              >
                <span className="px-2 py-1 bg-[color:var(--surface-1-95)] rounded text-xs font-mono">{index + 1}</span>
              </motion.div>
            </Card>
          );
        })}
      </div>

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-muted"
        >
          <div className="flex justify-center gap-4">
            {challenge.options.map((o, i) => (
              <span key={i} className="font-mono">
                {i + 1}: {o.hue}°{i === challenge.correctIndex && ` (${localize(LABELS.correct, language)})`}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
