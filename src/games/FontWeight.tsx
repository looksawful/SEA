"use client";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/Card";
import { HintToggle } from "@/components/HintToggle";
import { useGameStore } from "@/store/gameStore";
import { useNumberKeys } from "@/hooks/useKeyboard";
import { useSkipSignal } from "@/hooks/useSkipSignal";
import { useSound } from "@/hooks/useSound";
import { getDisplayText, pickRandom, shuffle } from "@/utils/helpers";
import { Difficulty, difficultyDots, getDifficulty } from "@/utils/difficulty";
import { Language, t } from "@/utils/i18n";

type WeightMode = "heavier" | "lighter";

interface Challenge {
  weights: number[];
  correctIndex: number;
  mode: WeightMode;
  text: string;
  difficulty: Difficulty;
}

const WEIGHTS = [300, 400, 500, 600, 700, 800];
const WEIGHT_CLASS: Record<number, string> = {
  300: "font-light",
  400: "font-normal",
  500: "font-medium",
  600: "font-semibold",
  700: "font-bold",
  800: "font-extrabold",
};

const POINTS: Record<Difficulty, number> = {
  easy: 100,
  medium: 120,
  hard: 150,
  expert: 180,
};

const getWeightSet = (difficulty: Difficulty): number[] => {
  if (difficulty === "easy") {
    return shuffle([300, 400, 700, 800]);
  }
  if (difficulty === "medium") {
    return pickRandom([
      [300, 400, 600, 800],
      [300, 500, 600, 800],
      [300, 500, 700, 800],
      [400, 500, 700, 800],
    ]);
  }

  const start = difficulty === "expert" ? pickRandom([1, 2]) : pickRandom([0, 1, 2]);
  return WEIGHTS.slice(start, start + 4);
};

const generateChallenge = (round: number, language: Language): Challenge => {
  const difficulty = getDifficulty(round);
  const mode = pickRandom(["heavier", "lighter"] as WeightMode[]);
  const weights = getWeightSet(difficulty);
  const text = getDisplayText(language);

  const targetWeight = mode === "heavier" ? Math.max(...weights) : Math.min(...weights);
  const correctIndex = weights.indexOf(targetWeight);

  return { weights, correctIndex, mode, text, difficulty };
};

interface Props {
  onAnswer: (correct: boolean) => void;
}

export const FontWeightGame = ({ onAnswer }: Props) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(0);
  const { addScore, incrementStreak, resetStreak, updateStats, addMistake, setReviewPause, language } = useGameStore();
  const { playCorrect, playWrong } = useSound();

  useEffect(() => {
    setChallenge(generateChallenge(round, language));
  }, [language]);

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
        const correctWeight = challenge.weights[challenge.correctIndex];
        const userWeight = challenge.weights[index];
        const question =
          language === "ru"
            ? challenge.mode === "heavier"
              ? "Найди самый жирный текст"
              : "Найди самый лёгкий текст"
            : challenge.mode === "heavier"
              ? "Find the heaviest text"
              : "Find the lightest text";
        addMistake({
          question,
          userAnswer: language === "ru" ? `Вес ${userWeight}` : `Weight ${userWeight}`,
          correctAnswer: language === "ru" ? `Вес ${correctWeight}` : `Weight ${correctWeight}`,
          explanation:
            language === "ru"
              ? "Сравни визуальную толщину штрихов: больший вес делает буквы заметно массивнее."
              : "Compare stroke thickness: heavier weights make letters noticeably bolder.",
        });
      }

      updateStats("font-weight", correct);

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
    if (num < (challenge?.weights.length || 0)) {
      handleSelect(num);
    }
  }, !showResult);

  if (!challenge) return null;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">
          {language === "ru"
            ? challenge.mode === "heavier"
              ? "Найди самый жирный текст"
              : "Найди самый лёгкий текст"
            : challenge.mode === "heavier"
              ? "Find the heaviest text"
              : "Find the lightest text"}
        </h2>
        <HintToggle
          hint={
            language === "ru"
              ? "Сравни толщину штриха: более жирный выглядит темнее и массивнее."
              : "Compare stroke thickness: heavier weights look darker and more massive."
          }
        />
        <div className="text-xs text-soft">
          {t(language, "difficultyLabel")}: {difficultyDots(challenge.difficulty)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {challenge.weights.map((weight, index) => (
          <Card
            key={weight}
            onClick={() => handleSelect(index)}
            selected={selected === index}
            correct={showResult ? index === challenge.correctIndex : null}
          >
            <div className="flex flex-col items-center gap-2">
              <motion.span
                className={`text-2xl text-strong ${WEIGHT_CLASS[weight]}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {challenge.text}
              </motion.span>
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
          {language === "ru" ? "Вес правильного варианта" : "Correct weight"}: {challenge.weights[challenge.correctIndex]}
        </motion.div>
      )}
    </div>
  );
};

