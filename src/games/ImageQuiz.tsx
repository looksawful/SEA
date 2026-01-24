"use client";
import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/Card";
import { Swatch } from "@/components/Swatch";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useSound } from "@/hooks/useSound";
import { useGameStore } from "@/store/gameStore";
import { GameId } from "@/types";
import { GAMES } from "@/utils/gameConfig";
import { difficultyDots, getDifficulty } from "@/utils/difficulty";
import { getFontSizeClass } from "@/utils/fonts";
import { shuffle } from "@/utils/helpers";
import { ImageQuizGameId, ImageQuizOption, IMAGE_QUIZ_DATA } from "@/utils/imageQuizData";

const renderOption = (option: ImageQuizOption) => {
  if (option.palette && option.palette.length > 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1">
          {option.palette.map((color, index) => (
            <Swatch key={`${color}-${index}`} color={color} className="w-8 h-8 rounded-lg border border-subtle" />
          ))}
        </div>
        {option.label && <span className="text-xs text-soft">{option.label}</span>}
      </div>
    );
  }

  if (option.color) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Swatch color={option.color} className="w-full h-20 rounded-xl border border-subtle shadow-card" />
        <span className="text-xs text-soft">{option.label || option.color}</span>
      </div>
    );
  }

  if (typeof option.size === "number") {
    const displaySize = Math.min(option.size, 32);
    return (
      <div className="flex flex-col items-center gap-2">
        <span className={`text-strong ${getFontSizeClass(displaySize, "text-[32px]")}`}>Aa</span>
        <span className="text-xs text-soft">{option.label || `${option.size}px`}</span>
      </div>
    );
  }

  return <span className="text-sm text-strong">{option.label}</span>;
};

const formatOptionLabel = (option: ImageQuizOption): string => {
  if (option.label) return option.label;
  if (option.color) return option.color;
  if (option.palette) return option.palette.join(", ");
  if (typeof option.size === "number") return `${option.size}px`;
  return "Option";
};

interface Props {
  gameId: GameId;
  onAnswer: (correct: boolean) => void;
}

export const ImageQuizGame = ({ gameId, onAnswer }: Props) => {
  const { addScore, incrementStreak, resetStreak, updateStats, addMistake } = useGameStore();
  const { playCorrect, playWrong } = useSound();
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const questions = IMAGE_QUIZ_DATA[gameId as ImageQuizGameId] || [];
  const order = useMemo(() => shuffle(questions.map((_, index) => index)), [questions.length]);
  const currentIndex = order.length > 0 ? order[round % order.length] : -1;
  const question = currentIndex >= 0 ? questions[currentIndex] : null;

  const handleSelect = useCallback(
    (index: number) => {
      if (!question || showResult) return;

      setSelected(index);
      setShowResult(true);

      const correct = index === question.correctIndex;

      if (correct) {
        addScore(GAMES[gameId].pointsPerCorrect);
        incrementStreak();
        playCorrect();
      } else {
        resetStreak();
        playWrong();
        const userOption = question.options[index];
        const correctOption = question.options[question.correctIndex];
        addMistake({
          question: question.prompt,
          userAnswer: formatOptionLabel(userOption),
          correctAnswer: formatOptionLabel(correctOption),
          explanation: question.explanation,
          visual:
            userOption.color || correctOption.color
              ? {
                  type: "colors",
                  data: {
                    Correct: correctOption.color || "",
                    Selected: userOption.color || "",
                  },
                }
              : userOption.palette || correctOption.palette
                ? {
                    type: "colors",
                    data: {
                      "Correct 1": correctOption.palette?.[0] || "",
                      "Correct 2": correctOption.palette?.[1] || "",
                      "Correct 3": correctOption.palette?.[2] || "",
                      "Selected 1": userOption.palette?.[0] || "",
                      "Selected 2": userOption.palette?.[1] || "",
                      "Selected 3": userOption.palette?.[2] || "",
                    },
                  }
                : undefined,
        });
      }

      updateStats(gameId, correct);

      setTimeout(() => {
        onAnswer(correct);
        setRound((value) => value + 1);
        setSelected(null);
        setShowResult(false);
      }, 1000);
    },
    [question, showResult, gameId],
  );

  useKeyboard(
    {
      "1": () => question && question.options.length > 0 && handleSelect(0),
      "2": () => question && question.options.length > 1 && handleSelect(1),
      "3": () => question && question.options.length > 2 && handleSelect(2),
      "4": () => question && question.options.length > 3 && handleSelect(3),
      "5": () => question && question.options.length > 4 && handleSelect(4),
      "6": () => question && question.options.length > 5 && handleSelect(5),
      Digit1: () => question && question.options.length > 0 && handleSelect(0),
      Digit2: () => question && question.options.length > 1 && handleSelect(1),
      Digit3: () => question && question.options.length > 2 && handleSelect(2),
      Digit4: () => question && question.options.length > 3 && handleSelect(3),
      Digit5: () => question && question.options.length > 4 && handleSelect(4),
      Digit6: () => question && question.options.length > 5 && handleSelect(5),
    },
    !showResult,
  );

  if (!question) {
    return (
      <div className="text-center space-y-3">
        <div className="text-xl font-medium">Вопросы скоро появятся</div>
        <div className="text-sm text-muted">Добавь собственные вопросы в меню сверху.</div>
      </div>
    );
  }

  const difficulty = question.difficulty ?? getDifficulty(round);
  const gridClass = question.options.length <= 4 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3";
  const containerClass = question.imageContainerClass ?? "flex justify-center";
  const frameClass = question.imageFrameClass ?? "w-full max-w-2xl aspect-[4/3]";
  const imageClass = question.imageClass ?? "object-cover";

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-medium">{question.prompt}</h2>
        {question.helper && <div className="text-xs text-soft">{question.helper}</div>}
        <div className="text-xs text-soft">Сложность: {difficultyDots(difficulty)}</div>
      </div>

      <div className={containerClass}>
        <div className={`overflow-hidden rounded-2xl border border-subtle shadow-card ${frameClass}`}>
          <img src={question.imageSrc} alt={question.imageAlt} className={`w-full h-full ${imageClass}`} />
        </div>
      </div>

      {question.imageSource && (
        <div className="text-center text-xs text-soft">
          Источник:{" "}
          {question.imageSource.url ? (
            <a
              href={question.imageSource.url}
              target="_blank"
              rel="noreferrer"
              className="underline hover:no-underline"
            >
              {question.imageSource.label}
            </a>
          ) : (
            question.imageSource.label
          )}
        </div>
      )}

      <div className={`grid gap-3 ${gridClass}`}>
        {question.options.map((option, index) => (
          <Card
            key={`${option.label}-${index}`}
            onClick={() => handleSelect(index)}
            selected={selected === index}
            correct={showResult ? index === question.correctIndex : null}
            padding="lg"
          >
            <div className="flex flex-col items-center gap-2">
              {renderOption(option)}
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
          {question.explanation}
        </motion.div>
      )}
    </div>
  );
};
