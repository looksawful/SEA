"use client";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/Card";
import { HintToggle } from "@/components/HintToggle";
import { Swatch } from "@/components/Swatch";
import { useGameStore } from "@/store/gameStore";
import { useNumberKeys } from "@/hooks/useKeyboard";
import { useSkipSignal } from "@/hooks/useSkipSignal";
import { useSound } from "@/hooks/useSound";
import { hslToRgb, rgbToHex } from "@/utils/colors";
import { pickRandom, randomInt, shuffle } from "@/utils/helpers";
import { Difficulty, difficultyDots, getDifficulty } from "@/utils/difficulty";
import { LocalizedText, localize, t } from "@/utils/i18n";

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

const text = (ru: string, en: string): LocalizedText => ({ ru, en });

const TARGET_COPY: Record<TemperatureTarget, { title: LocalizedText; hint: LocalizedText }> = {
  warm: {
    title: text("Найди самый тёплый цвет", "Find the warmest color"),
    hint: text(
      "Тёплые оттенки ближе к красному и жёлтому сектору.",
      "Warm hues sit closer to the red and yellow sector.",
    ),
  },
  cool: {
    title: text("Найди самый холодный цвет", "Find the coolest color"),
    hint: text(
      "Холодные оттенки ближе к синему и голубому сектору.",
      "Cool hues sit closer to the blue and cyan sector.",
    ),
  },
};

const EXPLANATION = text(
  "Тёплые тона лежат ближе к красно-жёлтой зоне, холодные — к синей. Сравни положение оттенка на круге.",
  "Warm tones are closer to the red-yellow zone, cool ones to blue. Compare the hue position on the wheel.",
);

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

      if (correct) {
        addScore(POINTS[challenge.difficulty]);
        incrementStreak();
        playCorrect();
      } else {
        resetStreak();
        playWrong();
        const userChoice = challenge.options[index];
        const correctChoice = challenge.options[challenge.correctIndex];
        const choiceLabel = language === "ru" ? "Твой выбор" : "Your choice";
        const correctLabel = language === "ru" ? "Правильный" : "Correct";
        addMistake({
          question: localize(TARGET_COPY[challenge.target].title, language),
          userAnswer: `Hue ${userChoice.hue}°`,
          correctAnswer: `Hue ${correctChoice.hue}°`,
          explanation: localize(EXPLANATION, language),
          visual: {
            type: "colors",
            data: {
              [choiceLabel]: userChoice.color,
              [correctLabel]: correctChoice.color,
            },
          },
        });
      }

      updateStats("color-temperature", correct);

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
          {localize(TARGET_COPY[challenge.target].title, language)}
        </h2>
        <HintToggle hint={localize(TARGET_COPY[challenge.target].hint, language)} />
        <div className="text-xs text-soft">
          {t(language, "difficultyLabel")}: {difficultyDots(challenge.difficulty)}
        </div>
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
              <span className="hidden sm:inline text-xs text-soft">[{index + 1}]</span>
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
          {language === "ru" ? "Правильный оттенок" : "Correct hue"}: Hue {challenge.options[challenge.correctIndex].hue}°
        </motion.div>
      )}
    </div>
  );
};

