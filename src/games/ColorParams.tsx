"use client";
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/Card";
import { Swatch } from "@/components/Swatch";
import { useGameStore } from "@/store/gameStore";
import { useNumberKeys } from "@/hooks/useKeyboard";
import { useSound } from "@/hooks/useSound";
import { randomHsl, hslToRgb, rgbToHex } from "@/utils/colors";
import { shuffle, pickRandom } from "@/utils/helpers";
import { Difficulty, difficultyDots, getDifficulty } from "@/utils/difficulty";

type ParamType = "hue" | "saturation" | "lightness";
type ParamMode = "value" | "shift";

interface ValueChallenge {
  mode: "value";
  color: string;
  hsl: { h: number; s: number; l: number };
  paramType: ParamType;
  options: number[];
  correctValue: number;
  difficulty: Difficulty;
}

interface ShiftChallenge {
  mode: "shift";
  baseColor: string;
  baseHsl: { h: number; s: number; l: number };
  targetColor: string;
  targetHsl: { h: number; s: number; l: number };
  paramType: ParamType;
  options: ParamType[];
  difficulty: Difficulty;
}

type Challenge = ValueChallenge | ShiftChallenge;

const PARAM_NAMES: Record<ParamType, string> = {
  hue: "Hue (H)",
  saturation: "Saturation (S)",
  lightness: "Lightness (L)",
};

const PARAM_EXPLANATIONS: Record<ParamType, string> = {
  hue: "Hue is the position on the color wheel: 0° — red, 60° — yellow, 120° — green, 180° — cyan, 240° — blue, 300° — magenta",
  saturation: "Saturation shows color intensity: 0% — gray, 100% — pure color",
  lightness: "Lightness is the amount of white/black: 0% — black, 50% — pure color, 100% — white",
};

const generateOptions = (
  correctValue: number,
  paramType: ParamType,
  difficulty: Difficulty,
): number[] => {
  const max = paramType === "hue" ? 360 : 100;
  let spread: number;

  switch (difficulty) {
    case "easy":
      spread = paramType === "hue" ? 60 : 25;
      break;
    case "medium":
      spread = paramType === "hue" ? 30 : 15;
      break;
    case "hard":
      spread = paramType === "hue" ? 15 : 8;
      break;
    case "expert":
      spread = paramType === "hue" ? 8 : 5;
      break;
  }

  const options = new Set<number>([correctValue]);

  while (options.size < 4) {
    let offset = Math.floor(Math.random() * spread * 2) - spread;
    if (offset === 0) offset = spread;
    let newVal = correctValue + offset;

    if (paramType === "hue") {
      newVal = ((newVal % 360) + 360) % 360;
    } else {
      newVal = Math.max(5, Math.min(95, newVal));
    }

    options.add(newVal);
  }

  return shuffle([...options]);
};

const generateValueChallenge = (difficulty: Difficulty): ValueChallenge => {
  const paramType = pickRandom(["hue", "saturation", "lightness"] as ParamType[]);
  const hsl = randomHsl();

  const { r, g, b } = hslToRgb(hsl.h, hsl.s, hsl.l);
  const color = rgbToHex(r, g, b);

  let correctValue: number;
  switch (paramType) {
    case "hue":
      correctValue = hsl.h;
      break;
    case "saturation":
      correctValue = hsl.s;
      break;
    case "lightness":
      correctValue = hsl.l;
      break;
  }

  const options = generateOptions(correctValue, paramType, difficulty);

  return { mode: "value", color, hsl, paramType, options, correctValue, difficulty };
};

const generateShiftChallenge = (difficulty: Difficulty): ShiftChallenge => {
  const paramType = pickRandom(["hue", "saturation", "lightness"] as ParamType[]);
  const baseHsl = randomHsl();

  let delta: number;
  switch (difficulty) {
    case "easy":
      delta = paramType === "hue" ? 60 : 30;
      break;
    case "medium":
      delta = paramType === "hue" ? 35 : 18;
      break;
    case "hard":
      delta = paramType === "hue" ? 20 : 12;
      break;
    case "expert":
      delta = paramType === "hue" ? 12 : 8;
      break;
  }

  const direction = Math.random() > 0.5 ? 1 : -1;
  const targetHsl = { ...baseHsl };

  if (paramType === "hue") {
    targetHsl.h = ((targetHsl.h + direction * delta) % 360 + 360) % 360;
  } else if (paramType === "saturation") {
    targetHsl.s = Math.max(10, Math.min(95, targetHsl.s + direction * delta));
  } else {
    targetHsl.l = Math.max(10, Math.min(90, targetHsl.l + direction * delta));
  }

  const baseRgb = hslToRgb(baseHsl.h, baseHsl.s, baseHsl.l);
  const targetRgb = hslToRgb(targetHsl.h, targetHsl.s, targetHsl.l);

  return {
    mode: "shift",
    baseColor: rgbToHex(baseRgb.r, baseRgb.g, baseRgb.b),
    baseHsl,
    targetColor: rgbToHex(targetRgb.r, targetRgb.g, targetRgb.b),
    targetHsl,
    paramType,
    options: shuffle(["hue", "saturation", "lightness"] as ParamType[]),
    difficulty,
  };
};

const generateChallenge = (round: number): Challenge => {
  const difficulty = getDifficulty(round);
  const useShift = difficulty !== "easy" && Math.random() > 0.45;

  return useShift ? generateShiftChallenge(difficulty) : generateValueChallenge(difficulty);
};

interface Props {
  onAnswer: (correct: boolean) => void;
}

export const ColorParamsGame = ({ onAnswer }: Props) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(0);
  const { addScore, incrementStreak, resetStreak, updateStats, addMistake, setReviewPause } = useGameStore();
  const { playCorrect, playWrong } = useSound();

  useEffect(() => {
    setChallenge(generateChallenge(round));
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      if (showResult || !challenge) return;

      setSelected(index);
      setShowResult(true);

      const correct =
        challenge.mode === "value"
          ? challenge.options[index] === challenge.correctValue
          : challenge.options[index] === challenge.paramType;

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
        if (challenge.mode === "value") {
          const unit = challenge.paramType === "hue" ? "°" : "%";
          const userAnswer = challenge.options[index];
          addMistake({
            question: `Determine the ${PARAM_NAMES[challenge.paramType]} of the color`,
            userAnswer: `${userAnswer}${unit}`,
            correctAnswer: `${challenge.correctValue}${unit}`,
            explanation: `${PARAM_EXPLANATIONS[challenge.paramType]}. Full HSL values for this color: H=${challenge.hsl.h}°, S=${challenge.hsl.s}%, L=${challenge.hsl.l}%`,
            visual: {
              type: "colors",
              data: { Color: challenge.color },
            },
          });
        } else {
          const userAnswer = challenge.options[index];
          addMistake({
            question: "Что изменилось между двумя цветами?",
            userAnswer: PARAM_NAMES[userAnswer],
            correctAnswer: PARAM_NAMES[challenge.paramType],
            explanation: `${PARAM_EXPLANATIONS[challenge.paramType]}. Исходный цвет: H=${challenge.baseHsl.h}°, S=${challenge.baseHsl.s}%, L=${challenge.baseHsl.l}%.`,
            visual: {
              type: "colors",
              data: { "Цвет A": challenge.baseColor, "Цвет B": challenge.targetColor },
            },
          });
        }
      }

      updateStats("color-params", correct);

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

  useNumberKeys((num) => {
    if (num < (challenge?.options.length || 0)) {
      handleSelect(num);
    }
  }, !showResult);

  if (!challenge) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">
          {challenge.mode === "value"
            ? `Determine ${PARAM_NAMES[challenge.paramType]}`
            : "Что изменилось между цветами?"}
        </h2>
        <div className="text-xs text-soft mt-1">
          Difficulty: {difficultyDots(challenge.difficulty)}
        </div>
      </div>

      <div className="flex justify-center">
        {challenge.mode === "value" ? (
          <motion.div className="w-40 h-40" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Swatch color={challenge.color} className="w-full h-full rounded-2xl shadow-card" />
          </motion.div>
        ) : (
          <div className="flex gap-4">
            <motion.div className="w-28 h-28" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <Swatch color={challenge.baseColor} className="w-full h-full rounded-2xl shadow-card" />
            </motion.div>
            <motion.div className="w-28 h-28" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <Swatch color={challenge.targetColor} className="w-full h-full rounded-2xl shadow-card" />
            </motion.div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {challenge.options.map((value, index) => (
          <Card
            key={index}
            onClick={() => handleSelect(index)}
            selected={selected === index}
            correct={
              showResult
                ? challenge.mode === "value"
                  ? value === challenge.correctValue
                  : value === challenge.paramType
                : null
            }
          >
            {challenge.mode === "value" ? (
              <div className="text-center font-mono text-lg">
                {value}
                {challenge.paramType === "hue" ? "°" : "%"}
                <span className="hidden sm:inline text-xs text-soft ml-2">[{index + 1}]</span>
              </div>
            ) : (
              <div className="text-center font-medium">
                {PARAM_NAMES[value as ParamType]}
                <span className="hidden sm:inline text-xs text-soft ml-2">[{index + 1}]</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-muted"
        >
          {challenge.mode === "value" ? (
            <>
              <div className="font-mono">
                HSL({challenge.hsl.h}°, {challenge.hsl.s}%, {challenge.hsl.l}%)
              </div>
              <div className="text-xs mt-1 text-soft">{challenge.color.toUpperCase()}</div>
            </>
          ) : (
            <div className="text-xs text-soft">
              Изменение: {PARAM_NAMES[challenge.paramType]} • Цвет A → Цвет B
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

