"use client";
import { GameWrapper } from "@/components/GameWrapper";
import { CustomQuestionGame } from "@/components/CustomQuestions";
import { Skeleton } from "@/components/Skeleton";
import {
  AccessibilityGame,
  ColorCompareGame,
  ColorParamsGame,
  ColorTemperatureGame,
  ComplementaryGame,
  FontSizeGame,
  FontWeightGame,
  GuessFontGame,
  GuessHexGame,
  GuessParamsGame,
  ImageQuizGame,
  LongTestGame,
  PaletteErrorGame,
  QuizGame,
  SizeSequenceGame,
  ThemeAnalogGame,
} from "@/games";
import { GameId } from "@/types";
import { useGameStore } from "@/store/gameStore";
import { GAMES } from "@/utils/gameConfig";
import { IMAGE_QUIZ_DATA, IMAGE_QUIZ_IDS } from "@/utils/imageQuizData";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QUIZ_QUESTIONS } from "@/games/Quiz";

const LONG_TEST_POOL_SIZE =
  QUIZ_QUESTIONS.length +
  Object.values(IMAGE_QUIZ_DATA).reduce((total, items) => total + items.length, 0);

interface Props {
  gameId: string;
}

function GameWithWrapper({
  gameId,
  GameComponent,
  nextGame,
}: {
  gameId: GameId;
  GameComponent: React.ComponentType<{ onAnswer: (correct: boolean) => void }>;
  nextGame?: { id: GameId; queue: GameId[] } | null;
}) {
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const baseTotal = 10;
  const { customMode, customQuestions, avoidRepeats } = useGameStore();
  const customCount = customQuestions[gameId]?.length || 0;
  const useCustom = Boolean(customMode[gameId]) && customCount > 0;
  const imageCount = IMAGE_QUIZ_IDS.includes(gameId as (typeof IMAGE_QUIZ_IDS)[number])
    ? IMAGE_QUIZ_DATA[gameId as keyof typeof IMAGE_QUIZ_DATA]?.length || 0
    : 0;
  const availableCount = useCustom ? customCount : gameId === "quiz" ? QUIZ_QUESTIONS.length : imageCount;
  const totalChallenges = avoidRepeats && availableCount > 0 ? Math.min(baseTotal, availableCount) : baseTotal;

  const handleAnswer = useCallback((correct: boolean) => {
    setCurrentChallenge((prev) => prev + 1);
    if (correct) {
      setCorrectCount((prev) => prev + 1);
    }
  }, []);

  return (
    <GameWrapper
      gameId={gameId}
      totalChallenges={totalChallenges}
      currentChallenge={currentChallenge}
      correctCount={correctCount}
      onRestart={() => {
        setCurrentChallenge(0);
        setCorrectCount(0);
      }}
      nextGame={nextGame}
    >
      {useCustom ? (
        <CustomQuestionGame gameId={gameId} onAnswer={handleAnswer} />
      ) : (
        <GameComponent onAnswer={handleAnswer} />
      )}
    </GameWrapper>
  );
}

function LongTestWithWrapper({ nextGame }: { nextGame?: { id: GameId; queue: GameId[] } | null }) {
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const { avoidRepeats, longTestLength } = useGameStore();
  const availableCount = LONG_TEST_POOL_SIZE;
  const totalChallenges =
    avoidRepeats && availableCount > 0 ? Math.min(longTestLength, availableCount) : longTestLength;

  const handleAnswer = useCallback((correct: boolean) => {
    setCurrentChallenge((prev) => prev + 1);
    if (correct) {
      setCorrectCount((prev) => prev + 1);
    }
  }, []);

  return (
    <GameWrapper
      gameId="long-test"
      totalChallenges={totalChallenges}
      currentChallenge={currentChallenge}
      correctCount={correctCount}
      onRestart={() => {
        setCurrentChallenge(0);
        setCorrectCount(0);
      }}
      nextGame={nextGame}
    >
      <LongTestGame totalQuestions={totalChallenges} onAnswer={handleAnswer} />
    </GameWrapper>
  );
}


export function GamePageClient({ gameId }: Props) {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nextQueue = useMemo(() => {
    const raw = searchParams.get("next");
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((id): id is GameId => Boolean(GAMES[id as GameId]));
    } catch {
      return [];
    }
  }, [searchParams]);

  const nextGame = nextQueue.length > 0 ? { id: nextQueue[0], queue: nextQueue.slice(1) } : null;

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const id = gameId as GameId;

  switch (id) {
    case "color-compare":
      return <GameWithWrapper gameId={id} GameComponent={ColorCompareGame} nextGame={nextGame} />;
    case "font-size":
      return <GameWithWrapper gameId={id} GameComponent={FontSizeGame} nextGame={nextGame} />;
    case "guess-font":
      return <GameWithWrapper gameId={id} GameComponent={GuessFontGame} nextGame={nextGame} />;
    case "color-params":
      return <GameWithWrapper gameId={id} GameComponent={ColorParamsGame} nextGame={nextGame} />;
    case "color-temperature":
      return <GameWithWrapper gameId={id} GameComponent={ColorTemperatureGame} nextGame={nextGame} />;
    case "accessibility":
      return <GameWithWrapper gameId={id} GameComponent={AccessibilityGame} nextGame={nextGame} />;
    case "palette-error":
      return <GameWithWrapper gameId={id} GameComponent={PaletteErrorGame} nextGame={nextGame} />;
    case "size-sequence":
      return <GameWithWrapper gameId={id} GameComponent={SizeSequenceGame} nextGame={nextGame} />;
    case "complementary":
      return <GameWithWrapper gameId={id} GameComponent={ComplementaryGame} nextGame={nextGame} />;
    case "guess-hex":
      return <GameWithWrapper gameId={id} GameComponent={GuessHexGame} nextGame={nextGame} />;
    case "guess-params":
      return <GameWithWrapper gameId={id} GameComponent={GuessParamsGame} nextGame={nextGame} />;
    case "quiz":
      return <GameWithWrapper gameId={id} GameComponent={QuizGame} nextGame={nextGame} />;
    case "theme-analog":
      return <GameWithWrapper gameId={id} GameComponent={ThemeAnalogGame} nextGame={nextGame} />;
    case "font-weight":
      return <GameWithWrapper gameId={id} GameComponent={FontWeightGame} nextGame={nextGame} />;
    case "long-test":
      return <LongTestWithWrapper nextGame={nextGame} />;
    default:
      if (IMAGE_QUIZ_IDS.includes(id as (typeof IMAGE_QUIZ_IDS)[number])) {
        const ImageQuizWrapper = (props: { onAnswer: (correct: boolean) => void }) => (
          <ImageQuizGame gameId={id} onAnswer={props.onAnswer} />
        );
        return <GameWithWrapper gameId={id} GameComponent={ImageQuizWrapper} nextGame={nextGame} />;
      }
      return null;
  }
}
