"use client";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/Card";
import { Swatch } from "@/components/Swatch";
import { useNumberKeys } from "@/hooks/useKeyboard";
import { useSound } from "@/hooks/useSound";
import { useGameStore } from "@/store/gameStore";
import { hslToRgb, randomHsl, rgbToHex } from "@/utils/colors";
import { clamp, pickRandom, shuffle } from "@/utils/helpers";
import { Difficulty, difficultyDots, getDifficulty } from "@/utils/difficulty";

type CompareType = "brighter" | "darker" | "saturated" | "muted";

interface Option {
  color: string;
  hsl: { h: number; s: number; l: number };
}

interface Challenge {
  compareType: CompareType;
  difficulty: Difficulty;
  options: Option[];
  correctIndex: number;
}

const PROMPTS: Record<
  CompareType,
  { title: string; helper: string; axis: "l" | "s"; target: "max" | "min" }
> = {
  brighter: {
    title: "Какой цвет ярче?",
    helper: "Сравни светлоту (L): у яркого цвета значение L выше.",
    axis: "l",
    target: "max",
  },
  darker: {
    title: "Какой цвет темнее?",
    helper: "Сравни светлоту (L): у темного цвета значение L ниже.",
    axis: "l",
    target: "min",
  },
  saturated: {
    title: "Какой цвет насыщеннее?",
    helper: "Сравни насыщенность (S): у насыщенного цвета значение S выше.",
    axis: "s",
    target: "max",
  },
  muted: {
    title: "Какой цвет более приглушённый?",
    helper: "Сравни насыщенность (S): у приглушённого цвета значение S ниже.",
    axis: "s",
    target: "min",
  },
};

const DIFFICULTY_SPREAD: Record<Difficulty, number> = {
  easy: 26,
  medium: 16,
  hard: 10,
  expert: 6,
};

const POINTS: Record<Difficulty, number> = {
  easy: 100,
  medium: 120,
  hard: 150,
  expert: 180,
};

const createOptions = (base: Option["hsl"], axis: "l" | "s", spread: number): Option[] => {
  const values = new Set<number>([base[axis]]);
  const min = axis === "l" ? 12 : 15;
  const max = axis === "l" ? 92 : 95;

  while (values.size < 4) {
    const offset = Math.floor(Math.random() * spread * 2) - spread;
    if (offset === 0) continue;
    values.add(clamp(base[axis] + offset, min, max));
  }

  return shuffle([...values]).map((value) => {
    const next = { ...base, [axis]: value };
    const { r, g, b } = hslToRgb(next.h, next.s, next.l);
    return { color: rgbToHex(r, g, b), hsl: next };
  });
};

const getCorrectIndex = (options: Option[], axis: "l" | "s", target: "max" | "min"): number => {
  const values = options.map((option) => option.hsl[axis]);
  const targetValue = target === "max" ? Math.max(...values) : Math.min(...values);
  return values.indexOf(targetValue);
};

const generateChallenge = (round: number): Challenge => {
  const difficulty = getDifficulty(round);
  const compareType = pickRandom(["brighter", "darker", "saturated", "muted"] as CompareType[]);
  const prompt = PROMPTS[compareType];
  const spread = DIFFICULTY_SPREAD[difficulty];

  const base = randomHsl();
  base.s = clamp(base.s, 35, 85);
  base.l = clamp(base.l, 28, 78);

  const options = createOptions(base, prompt.axis, spread);
  const correctIndex = getCorrectIndex(options, prompt.axis, prompt.target);

  return {
    compareType,
    difficulty,
    options,
    correctIndex,
  };
};

interface Props {
  onAnswer: (correct: boolean) => void;
}

export const ColorCompareGame = ({ onAnswer }: Props) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(0);
  const { addScore, incrementStreak, resetStreak, updateStats, addMistake } = useGameStore();
  const { playCorrect, playWrong } = useSound();

  useEffect(() => {
    setChallenge(generateChallenge(0));
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      if (!challenge || showResult) return;
      setSelected(index);
      setShowResult(true);

      const correct = index === challenge.correctIndex;

      if (correct) {
        addScore(POINTS[challenge.difficulty]);
        incrementStreak();
        playCorrect();
      } else {
        resetStreak();
        playWrong();

        const prompt = PROMPTS[challenge.compareType];
        const correctOption = challenge.options[challenge.correctIndex];
        const selectedOption = challenge.options[index];
        const axisLabel = prompt.axis === "l" ? "L" : "S";
        const unit = "%";

        addMistake({
          question: prompt.title,
          userAnswer: `Вариант ${index + 1}`,
          correctAnswer: `Вариант ${challenge.correctIndex + 1}`,
          explanation: `У правильного варианта ${axisLabel}=${correctOption.hsl[prompt.axis]}${unit}, у выбранного ${axisLabel}=${selectedOption.hsl[prompt.axis]}${unit}. ${prompt.helper}`,
          visual: {
            type: "colors",
            data: {
              Correct: correctOption.color,
              Selected: selectedOption.color,
            },
          },
        });
      }

      updateStats("color-compare", correct);

      setTimeout(() => {
        onAnswer(correct);
        const nextRound = round + 1;
        setRound(nextRound);
        setChallenge(generateChallenge(nextRound));
        setSelected(null);
        setShowResult(false);
      }, 1000);
    },
    [challenge, showResult, round],
  );

  useNumberKeys((num) => {
    if (num < (challenge?.options.length || 0)) {
      handleSelect(num);
    }
  }, !showResult);

  if (!challenge) return null;

  const prompt = PROMPTS[challenge.compareType];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">{prompt.title}</h2>
        <div className="text-xs text-soft mt-1">
          Сложность: {difficultyDots(challenge.difficulty)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {challenge.options.map((option, index) => (
          <Card
            key={option.color}
            onClick={() => handleSelect(index)}
            selected={selected === index}
            correct={showResult ? index === challenge.correctIndex : null}
            padding="lg"
          >
            <div className="flex flex-col items-center gap-3">
              <Swatch color={option.color} className="w-full h-24 rounded-xl border border-subtle shadow-card" />
              <span className="hidden sm:inline text-xs text-soft">[{index + 1}]</span>
            </div>
          </Card>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-sm text-muted"
      >
        {prompt.helper}
      </motion.div>
    </div>
  );
};

