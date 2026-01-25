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
import { Difficulty, difficultyDots, getDifficulty } from "@/utils/difficulty";
import { getFontSizeClass } from "@/utils/fonts";
import { shuffle } from "@/utils/helpers";
import { ImageQuizOption, ImageQuizSource, IMAGE_QUIZ_DATA } from "@/utils/imageQuizData";
import { Language, localize, t } from "@/utils/i18n";
import { QUIZ_QUESTIONS } from "@/games/Quiz";

interface LongTestQuestion {
  id: string;
  sourceGameId: GameId;
  prompt: string;
  helper?: string;
  explanation: string;
  options: ImageQuizOption[];
  correctIndex: number;
  difficulty?: Difficulty;
  imageSrc?: string;
  imageAlt?: string;
  imageSource?: ImageQuizSource;
  imageContainerClass?: string;
  imageFrameClass?: string;
  imageClass?: string;
}

interface LongTestChallenge extends LongTestQuestion {
  options: ImageQuizOption[];
  correctIndex: number;
}

const buildLongTestPool = (language: Language): LongTestQuestion[] => {
  const quizQuestions = QUIZ_QUESTIONS.map((question, index) => ({
    id: `quiz-${index}`,
    sourceGameId: "quiz",
    prompt: localize(question.question, language),
    explanation: localize(question.explanation, language),
    options: question.options.map((option) => ({ label: localize(option, language) })),
    correctIndex: question.correctIndex,
    difficulty: question.difficulty,
  }));

  const imageQuestions = Object.entries(IMAGE_QUIZ_DATA).flatMap(([gameId, questions]) =>
    questions.map((question) => ({
      id: `${gameId}-${question.id}`,
      sourceGameId: gameId as GameId,
      prompt: question.prompt,
      helper: question.helper,
      explanation: question.explanation,
      options: question.options,
      correctIndex: question.correctIndex,
      difficulty: question.difficulty,
      imageSrc: question.imageSrc,
      imageAlt: question.imageAlt,
      imageSource: question.imageSource,
      imageContainerClass: question.imageContainerClass,
      imageFrameClass: question.imageFrameClass,
      imageClass: question.imageClass,
    })),
  );

  return [...quizQuestions, ...imageQuestions];
};

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

const fallbackOptionLabels: Record<Language, string> = { ru: "Вариант", en: "Option" };

const formatOptionLabel = (option: ImageQuizOption, language: Language): string => {
  if (option.label) return option.label;
  if (option.color) return option.color;
  if (option.palette) return option.palette.join(", ");
  if (typeof option.size === "number") return `${option.size}px`;
  return fallbackOptionLabels[language];
};

interface Props {
  onAnswer: (correct: boolean) => void;
  totalQuestions: number;
}

export const LongTestGame = ({ onAnswer, totalQuestions }: Props) => {
  const {
    addScore,
    incrementStreak,
    resetStreak,
    updateStats,
    addMistake,
    language,
    avoidRepeats,
    setReviewPause,
  } = useGameStore();
  const { playCorrect, playWrong } = useSound();
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const pointsPerCorrect = GAMES["long-test"].pointsPerCorrect;

  const pool = useMemo(() => buildLongTestPool(language), [language]);
  const effectiveTotal =
    avoidRepeats && pool.length > 0 ? Math.min(totalQuestions, pool.length) : totalQuestions;

  const sequence = useMemo(() => {
    if (pool.length === 0 || effectiveTotal === 0) return [];
    if (avoidRepeats) {
      return shuffle(pool.map((_, index) => index)).slice(0, effectiveTotal);
    }
    return Array.from({ length: effectiveTotal }, () => Math.floor(Math.random() * pool.length));
  }, [pool.length, effectiveTotal, avoidRepeats]);

  const questionIndex = sequence[round];
  const question = typeof questionIndex === "number" ? pool[questionIndex] : null;
  const challenge = useMemo<LongTestChallenge | null>(() => {
    if (!question) return null;
    const optionOrder = shuffle(question.options.map((_, index) => index));
    const options = optionOrder.map((optionIndex) => question.options[optionIndex]);
    const correctIndex = optionOrder.indexOf(question.correctIndex);
    return { ...question, options, correctIndex };
  }, [question]);

  const handleSelect = useCallback(
    (index: number) => {
      if (!challenge || showResult) return;

      setSelected(index);
      setShowResult(true);

      const correct = index === challenge.correctIndex;

      if (correct) {
        addScore(pointsPerCorrect);
        incrementStreak();
        playCorrect();
      } else {
        resetStreak();
        playWrong();
        const userOption = challenge.options[index];
        const correctOption = challenge.options[challenge.correctIndex];
        addMistake({
          question: challenge.prompt,
          userAnswer: formatOptionLabel(userOption, language),
          correctAnswer: formatOptionLabel(correctOption, language),
          explanation: challenge.explanation,
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

      updateStats("long-test", correct);

      const reviewDelay = correct ? 1200 : 2400;
      setReviewPause(reviewDelay);

      setTimeout(() => {
        onAnswer(correct);
        setRound((value) => value + 1);
        setSelected(null);
        setShowResult(false);
      }, reviewDelay);
    },
    [challenge, showResult, language, setReviewPause],
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

  const difficulty = challenge.difficulty ?? getDifficulty(round);
  const hasVisualOptions = challenge.options.some(
    (option) => option.color || option.palette || typeof option.size === "number",
  );
  const gridClass = challenge.options.length <= 4 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3";
  const containerClass = challenge.imageContainerClass ?? "flex justify-center";
  const frameClass = challenge.imageFrameClass ?? "w-full max-w-2xl aspect-[4/3]";
  const imageClass = challenge.imageClass ?? "object-cover";

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">{challenge.prompt}</h2>
        <HintToggle hint={challenge.helper} />
        <div className="text-xs text-soft">
          {t(language, "difficultyLabel")}: {difficultyDots(difficulty)}
        </div>
      </div>

      {challenge.imageSrc && (
        <div className={containerClass}>
          <div className={`overflow-hidden rounded-2xl border border-subtle shadow-card ${frameClass}`}>
            <img
              src={challenge.imageSrc}
              alt={challenge.imageAlt || ""}
              className={`w-full h-full ${imageClass}`}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      )}

      {challenge.imageSource && (
        <div className="text-center text-xs text-soft">
          {t(language, "imageSourceLabel")}:{" "}
          {challenge.imageSource.url ? (
            <a
              href={challenge.imageSource.url}
              target="_blank"
              rel="noreferrer"
              className="underline hover:no-underline"
            >
              {challenge.imageSource.label}
            </a>
          ) : (
            challenge.imageSource.label
          )}
        </div>
      )}

      {hasVisualOptions ? (
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
                {renderOption(option)}
                <span className="hidden sm:inline text-xs text-soft">[{index + 1}]</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:gap-3">
          {challenge.options.map((option, index) => (
            <Card
              key={`${option.label}-${index}`}
              onClick={() => handleSelect(index)}
              selected={selected === index}
              correct={showResult ? index === challenge.correctIndex : null}
              className="min-h-[56px]"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-surface-2 rounded-full flex items-center justify-center text-sm font-mono text-muted">
                  {index + 1}
                </span>
                <span>{formatOptionLabel(option, language)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-muted"
        >
          {challenge.explanation}
        </motion.div>
      )}
    </div>
  );
};
