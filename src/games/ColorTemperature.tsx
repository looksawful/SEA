"use client";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/Card";
import { Swatch } from "@/components/Swatch";
import { useGameStore } from "@/store/gameStore";
import { useNumberKeys } from "@/hooks/useKeyboard";
import { useSound } from "@/hooks/useSound";
import { hslToRgb, rgbToHex } from "@/utils/colors";
import { pickRandom, randomInt, shuffle } from "@/utils/helpers";
import { Difficulty, difficultyDots, getDifficulty } from "@/utils/difficulty";

type TemperatureTarget = "warm" | "cool";

interface Option {
  color: string;
  hue: number;
}

interface Challenge {
  options: Option[];
  correctIndex: number;
  target: TemperatureTarget;
  difficulty: Difficulty;
}

const POINTS: Record<Difficulty, number> = {
  easy: 100,
  medium: 120,
  hard: 150,
  expert: 180,
};

const NEUTRAL_RANGES: Array<[number, number]> = [
  [70, 140],
  [240, 300],
];

const pickHue = (ranges: Array<[number, number]>): number => {
  const [min, max] = pickRandom(ranges);
  return randomInt(min, max);
};

const getRanges = (target: TemperatureTarget, difficulty: Difficulty) => {
  const warmRanges: Record<Difficulty, Array<[number, number]>> = {
    easy: [
      [0, 50],
      [310, 360],
    ],
    medium: [
      [10, 60],
      [300, 350],
    ],
    hard: [
      [20, 70],
      [290, 340],
    ],
    expert: [
      [30, 75],
      [285, 330],
    ],
  };

  const coolRanges: Record<Difficulty, Array<[number, number]>> = {
    easy: [[170, 230]],
    medium: [[160, 240]],
    hard: [[150, 250]],
    expert: [[140, 260]],
  };

  const targetRanges = target === "warm" ? warmRanges[difficulty] : coolRanges[difficulty];
  const wrongRanges =
    target === "warm"
      ? [...coolRanges[difficulty], ...NEUTRAL_RANGES]
      : [...warmRanges[difficulty], ...NEUTRAL_RANGES];

  return { targetRanges, wrongRanges };
};

const toHex = (h: number, s: number, l: number): string => {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
};

const generateChallenge = (round: number): Challenge => {
  const difficulty = getDifficulty(round);
  const target = pickRandom(["warm", "cool"] as TemperatureTarget[]);
  const { targetRanges, wrongRanges } = getRanges(target, difficulty);

  const options: Option[] = [];
  const used = new Set<number>();

  const correctHue = pickHue(targetRanges);
  const correctColor = toHex(correctHue, randomInt(45, 85), randomInt(35, 70));
  options.push({ color: correctColor, hue: correctHue });
  used.add(correctHue);

  while (options.length < 4) {
    const hue = pickHue(wrongRanges);
    if (used.has(hue)) continue;
    used.add(hue);
    options.push({ color: toHex(hue, randomInt(35, 80), randomInt(30, 75)), hue });
  }

  const shuffledOptions = shuffle(options);
  const correctIndex = shuffledOptions.findIndex((option) => option.hue === correctHue);

  return { options: shuffledOptions, correctIndex, target, difficulty };
};

interface Props {
  onAnswer: (correct: boolean) => void;
}

export const ColorTemperatureGame = ({ onAnswer }: Props) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(0);
  const { addScore, incrementStreak, resetStreak, updateStats, addMistake } = useGameStore();
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

      if (correct) {
        addScore(POINTS[challenge.difficulty]);
        incrementStreak();
        playCorrect();
      } else {
        resetStreak();
        playWrong();
        const userChoice = challenge.options[index];
        const correctChoice = challenge.options[challenge.correctIndex];
        addMistake({
          question: challenge.target === "warm" ? "Найди самый тёплый цвет" : "Найди самый холодный цвет",
          userAnswer: `Hue ${userChoice.hue}°`,
          correctAnswer: `Hue ${correctChoice.hue}°`,
          explanation:
            "Тёплые тона лежат ближе к красно-жёлтой зоне, холодные — к синей. Сравни положение оттенка на круге.",
          visual: {
            type: "colors",
            data: {
              "Твой выбор": userChoice.color,
              "Правильный": correctChoice.color,
            },
          },
        });
      }

      updateStats("color-temperature", correct);

      setTimeout(() => {
        onAnswer(correct);
        setRound((r) => r + 1);
        setChallenge(generateChallenge(round + 1));
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-medium">
          {challenge.target === "warm" ? "Найди самый тёплый цвет" : "Найди самый холодный цвет"}
        </h2>
        <div className="text-xs text-soft mt-1">Сложность: {difficultyDots(challenge.difficulty)}</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {challenge.options.map((option, index) => (
          <Card
            key={`${option.color}-${index}`}
            onClick={() => handleSelect(index)}
            selected={selected === index}
            correct={showResult ? index === challenge.correctIndex : null}
            padding="lg"
          >
            <div className="flex flex-col items-center gap-3">
              <Swatch color={option.color} className="w-full h-24 rounded-xl border border-subtle shadow-card" />
              <span className="text-xs text-soft">[{index + 1}]</span>
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
          Правильный оттенок: Hue {challenge.options[challenge.correctIndex].hue}°
        </motion.div>
      )}
    </div>
  );
};
