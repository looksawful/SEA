"use client";
import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/Card";
import { HintToggle } from "@/components/HintToggle";
import { Swatch } from "@/components/Swatch";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useSkipSignal } from "@/hooks/useSkipSignal";
import { useSound } from "@/hooks/useSound";
import { useGameStore } from "@/store/gameStore";
import { GameId } from "@/types";
import { GAMES } from "@/utils/gameConfig";
import { difficultyDots, getDifficulty } from "@/utils/difficulty";
import { getFontSizeClass } from "@/utils/fonts";
import { shuffle } from "@/utils/helpers";
import { ImageQuizGameId, ImageQuizOption, IMAGE_QUIZ_DATA } from "@/utils/imageQuizData";
import { Language, LocalizedText, localize, t } from "@/utils/i18n";

const resolveText = (value: string | LocalizedText, language: Language): string =>
  typeof value === "string" ? value : localize(value, language);

const renderOption = (option: ImageQuizOption, language: Language) => {
  if (option.palette && option.palette.length > 0) {
    const label = option.label ? resolveText(option.label, language) : "";
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1">
          {option.palette.map((color, index) => (
            <Swatch key={`${color}-${index}`} color={color} className="w-8 h-8 rounded-lg border border-subtle" />
          ))}
        </div>
        {label && <span className="text-xs text-soft">{label}</span>}
      </div>
    );
  }

  if (option.color) {
    const label = option.label ? resolveText(option.label, language) : option.color;
    return (
      <div className="flex flex-col items-center gap-2">
        <Swatch color={option.color} className="w-full h-20 rounded-xl border border-subtle shadow-card" />
        <span className="text-xs text-soft">{label}</span>
      </div>
    );
  }

  if (typeof option.size === "number") {
    const displaySize = Math.min(option.size, 32);
    const label = option.label ? resolveText(option.label, language) : `${option.size}px`;
    return (
      <div className="flex flex-col items-center gap-2">
        <span className={`text-strong ${getFontSizeClass(displaySize, "text-[32px]")}`}>Aa</span>
        <span className="text-xs text-soft">{label}</span>
      </div>
    );
  }

  return <span className="text-sm text-strong">{option.label ? resolveText(option.label, language) : ""}</span>;
};

const fallbackOptionLabels: Record<Language, string> = { ru: "Вариант", en: "Option" };

const formatOptionLabel = (option: ImageQuizOption, language: Language): string => {
  if (option.label) return resolveText(option.label, language);
  if (option.color) return option.color;
  if (option.palette) return option.palette.join(", ");
  if (typeof option.size === "number") return `${option.size}px`;
  return fallbackOptionLabels[language];
};

interface Props {
  gameId: GameId;
  onAnswer: (correct: boolean) => void;
}

export const ImageQuizGame = ({ gameId, onAnswer }: Props) => {
  const { addScore, incrementStreak, resetStreak, updateStats, addMistake, language, avoidRepeats, setReviewPause } =
    useGameStore();
  const { playCorrect, playWrong } = useSound();
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const questions = IMAGE_QUIZ_DATA[gameId as ImageQuizGameId] || [];
  const order = useMemo(() => shuffle(questions.map((_, index) => index)), [questions.length]);
  const currentIndex = order.length > 0 ? (avoidRepeats ? order[round] : order[round % order.length]) : -1;
  const question = typeof currentIndex === "number" ? questions[currentIndex] : null;
  const challenge = useMemo(() => {
    if (!question) return null;
    const optionOrder = shuffle(question.options.map((_, index) => index));
    const shuffledOptions = optionOrder.map((optionIndex) => question.options[optionIndex]);
    const correctIndex = optionOrder.indexOf(question.correctIndex);
    return { question, options: shuffledOptions, correctIndex };
  }, [question]);

  const handleSelect = useCallback(
    (index: number) => {
      if (!challenge || showResult) return;

      setSelected(index);
      setShowResult(true);

      const correct = index === challenge.correctIndex;

      if (correct) {
        addScore(GAMES[gameId].pointsPerCorrect);
        incrementStreak();
        playCorrect();
      } else {
        resetStreak();
        playWrong();
        const userOption = challenge.options[index];
        const correctOption = challenge.options[challenge.correctIndex];
        addMistake({
          question: challenge.question.prompt,
          userAnswer: formatOptionLabel(userOption, language),
          correctAnswer: formatOptionLabel(correctOption, language),
          explanation: challenge.question.explanation,
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

      const reviewDelay = correct ? 1200 : 2400;
      setReviewPause(reviewDelay);

      setTimeout(() => {
        onAnswer(correct);
        setRound((value) => value + 1);
        setSelected(null);
        setShowResult(false);
      }, reviewDelay);
    },
    [challenge, showResult, gameId, language, setReviewPause],
  );

  const handleSkip = useCallback(() => {
    if (!challenge || showResult) return;
    onAnswer(false);
    setRound((value) => value + 1);
    setSelected(null);
    setShowResult(false);
  }, [challenge, showResult, onAnswer]);

  useSkipSignal(handleSkip, !showResult);

  useKeyboard(
    {
      "1": () => challenge && challenge.options.length > 0 && handleSelect(0),
      "2": () => challenge && challenge.options.length > 1 && handleSelect(1),
      "3": () => challenge && challenge.options.length > 2 && handleSelect(2),
      "4": () => challenge && challenge.options.length > 3 && handleSelect(3),
      "5": () => challenge && challenge.options.length > 4 && handleSelect(4),
      "6": () => challenge && challenge.options.length > 5 && handleSelect(5),
      Digit1: () => challenge && challenge.options.length > 0 && handleSelect(0),
      Digit2: () => challenge && challenge.options.length > 1 && handleSelect(1),
      Digit3: () => challenge && challenge.options.length > 2 && handleSelect(2),
      Digit4: () => challenge && challenge.options.length > 3 && handleSelect(3),
      Digit5: () => challenge && challenge.options.length > 4 && handleSelect(4),
      Digit6: () => challenge && challenge.options.length > 5 && handleSelect(5),
    },
    !showResult,
  );

  if (!challenge) {
    return (
      <div className="text-center space-y-3">
        <div className="text-xl sm:text-2xl font-display font-semibold tracking-tight">
          {t(language, "noQuestionsTitle")}
        </div>
        <div className="text-sm text-muted">{t(language, "noQuestionsHint")}</div>
      </div>
    );
  }

  const difficulty = challenge.question.difficulty ?? getDifficulty(round);
  const gridClass = challenge.options.length <= 4 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3";
  const containerClass = challenge.question.imageContainerClass ?? "flex justify-center";
  const frameClass = challenge.question.imageFrameClass ?? "w-full max-w-2xl aspect-[4/3]";
  const imageClass = challenge.question.imageClass ?? "object-cover";

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">
          {resolveText(challenge.question.prompt, language)}
        </h2>
        <HintToggle
          hint={challenge.question.helper ? resolveText(challenge.question.helper, language) : undefined}
        />
        <div className="text-xs text-soft">
          {t(language, "difficultyLabel")}: {difficultyDots(difficulty)}
        </div>
      </div>

      <div className={containerClass}>
        <div className={`overflow-hidden rounded-2xl border border-subtle shadow-card ${frameClass}`}>
          <img
            src={challenge.question.imageSrc}
            alt={resolveText(challenge.question.imageAlt, language)}
            className={`w-full h-full ${imageClass}`}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {challenge.question.imageSource && (
        <div className="text-center text-xs text-soft">
          {t(language, "imageSourceLabel")}:{" "}
          {challenge.question.imageSource.url ? (
            <a
              href={challenge.question.imageSource.url}
              target="_blank"
              rel="noreferrer"
              className="underline hover:no-underline"
            >
              {resolveText(challenge.question.imageSource.label, language)}
            </a>
          ) : (
            resolveText(challenge.question.imageSource.label, language)
          )}
        </div>
      )}

      <div className={`grid gap-3 ${gridClass}`}>
        {challenge.options.map((option, index) => (
          <Card
            key={`${option.label}-${index}`}
            onClick={() => handleSelect(index)}
            selected={selected === index}
            correct={showResult ? index === challenge.correctIndex : null}
            padding="lg"
          >
            <div className="flex flex-col items-center gap-2">
                {renderOption(option, language)}
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
          {challenge.question.explanation}
        </motion.div>
      )}
    </div>
  );
};

