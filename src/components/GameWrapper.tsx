"use client";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useSound } from "@/hooks/useSound";
import { useTimer } from "@/hooks/useTimer";
import { useGameStore } from "@/store/gameStore";
import { GameId, MistakeRecord } from "@/types";
import { GAMES } from "@/utils/gameConfig";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { Button } from "./Button";
import { ProgressBar, TimerDisplay } from "./Progress";
import { ScoreDisplay } from "./Score";
import { Swatch } from "./Swatch";

interface GameWrapperProps {
  gameId: GameId;
  children: ReactNode;
  onComplete?: (score: number, correct: number, total: number) => void;
  totalChallenges?: number;
  currentChallenge?: number;
  onRestart?: () => void;
  nextGame?: { id: GameId; queue: GameId[] } | null;
  correctCount?: number | null;
}

const MistakeCard = ({ mistake, index }: { mistake: MistakeRecord; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-surface border border-[color:var(--danger)] rounded-xl p-4 space-y-3 shadow-card"
  >
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 bg-[color:var(--danger-soft)] text-[color:var(--danger)] rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-strong mb-1">{mistake.question}</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-[color:var(--danger-soft)] text-[color:var(--danger-strong)] px-3 py-2 rounded-lg">
            <span className="text-[color:var(--danger)] text-xs block">Твой ответ</span>
            {mistake.userAnswer}
          </div>
          <div className="bg-[color:var(--success-soft)] text-[color:var(--success-strong)] px-3 py-2 rounded-lg">
            <span className="text-[color:var(--success)] text-xs block">Правильный</span>
            {mistake.correctAnswer}
          </div>
        </div>
        {mistake.visual && mistake.visual.type === "colors" && (
          <div className="flex gap-2 mt-2">
            {Object.entries(mistake.visual.data).map(([key, value]) => (
              <div key={key} className="flex items-center gap-1">
                <Swatch color={String(value)} className="w-6 h-6 rounded border border-subtle" />
                <span className="text-xs text-muted">{key}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 text-sm text-muted bg-surface-2 p-3 rounded-lg">{mistake.explanation}</div>
      </div>
    </div>
  </motion.div>
);

export const GameWrapper = ({
  gameId,
  children,
  onComplete,
  totalChallenges = 10,
  currentChallenge = 0,
  onRestart,
  nextGame = null,
  correctCount = null,
}: GameWrapperProps) => {
  const router = useRouter();
  const game = GAMES[gameId];
  const GameIcon = game.icon;
  const [showComplete, setShowComplete] = useState(false);
  const [showMistakes, setShowMistakes] = useState(false);
  const [sessionTimeLimit, setSessionTimeLimit] = useState(game.timeLimit);
  const { playComplete } = useSound();

  const {
    score,
    timeLeft,
    setTimeLeft,
    isPlaying,
    setIsPlaying,
    isPaused,
    setIsPaused,
    resetGame,
    addResult,
    currentMistakes,
    clearMistakes,
  } = useGameStore();

  const { start, stop, reset } = useTimer({
    initialTime: sessionTimeLimit,
    onTick: setTimeLeft,
    onComplete: () => {
      handleGameComplete();
    },
  });

  const resolvedCorrect =
    typeof correctCount === "number" ? correctCount : Math.floor(score / game.pointsPerCorrect);

  const handleGameComplete = () => {
    stop();
    setIsPlaying(false);
    setShowComplete(true);
    playComplete();

    addResult({
      gameId,
      score,
      maxScore: totalChallenges * game.pointsPerCorrect,
      time: sessionTimeLimit - timeLeft,
      correct: resolvedCorrect,
      total: totalChallenges,
      timestamp: Date.now(),
      mistakes: currentMistakes,
    });

    onComplete?.(score, resolvedCorrect, totalChallenges);
  };

  const handleStart = () => {
    onRestart?.();
    resetGame();
    clearMistakes();
    reset(sessionTimeLimit);
    setTimeLeft(sessionTimeLimit);
    setIsPlaying(true);
    start();
  };

  const handlePause = () => {
    if (isPaused) {
      start();
      setIsPaused(false);
    } else {
      stop();
      setIsPaused(true);
    }
  };

  const handleExit = () => {
    stop();
    resetGame();
    clearMistakes();
    router.push("/");
  };

  const handleNext = () => {
    if (!nextGame) return;
    const nextQueue =
      nextGame.queue.length > 0 ? `?next=${encodeURIComponent(JSON.stringify(nextGame.queue))}` : "";
    router.push(`/game/${nextGame.id}${nextQueue}`);
  };

  useKeyboard(
    {
      escape: handleExit,
      p: handlePause,
      " ": () => !isPlaying && !showComplete && handleStart(),
    },
    true,
  );

  useEffect(() => {
    return () => {
      stop();
      resetGame();
    };
  }, []);

  useEffect(() => {
    if (currentChallenge >= totalChallenges && isPlaying) {
      handleGameComplete();
    }
  }, [currentChallenge, totalChallenges, isPlaying]);

  useEffect(() => {
    setSessionTimeLimit(game.timeLimit);
  }, [game.timeLimit]);

  useEffect(() => {
    if (!isPlaying) {
      reset(sessionTimeLimit);
      setTimeLeft(sessionTimeLimit);
    }
  }, [sessionTimeLimit, isPlaying, reset, setTimeLeft]);

  if (showComplete) {
    const accuracy = totalChallenges > 0 ? Math.round((resolvedCorrect / totalChallenges) * 100) : 0;

    if (showMistakes && currentMistakes.length > 0) {
      return (
        <div className="min-h-screen bg-surface-2">
          <header className="sticky top-0 z-10 bg-surface border-b border-subtle px-4 py-3">
            <div className="max-w-2xl mx-auto flex items-center justify-between">
              <button onClick={() => setShowMistakes(false)} className="p-2 -ml-2 text-muted">
                ← Назад
              </button>
              <h2 className="font-semibold text-strong">Разбор ошибок ({currentMistakes.length})</h2>
              <div className="w-10" />
            </div>
          </header>
          <main className="max-w-2xl mx-auto p-4 space-y-4">
            {currentMistakes.map((mistake, i) => (
              <MistakeCard key={i} mistake={mistake} index={i} />
            ))}
            <div className="pt-4">
              <Button onClick={handleStart} fullWidth size="lg">
                Попробовать снова
              </Button>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-6xl mb-4"
          >
            {accuracy >= 80 ? "Отлично" : accuracy >= 50 ? "Хорошо" : "Неплохо"}
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Раунд завершён!</h2>
          <div className="text-4xl font-mono font-bold mb-2">{score.toLocaleString()}</div>
          <div className="text-muted mb-6">
            Правильно: {resolvedCorrect} из {totalChallenges} ({accuracy}%)
          </div>
          {nextGame && (
            <div className="text-sm text-muted mb-4">
              Далее: {GAMES[nextGame.id].name}
            </div>
          )}

          {currentMistakes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 p-4 bg-[color:var(--danger-soft)] border border-[color:var(--danger)] rounded-xl"
            >
              <div className="text-[color:var(--danger-strong)] font-medium mb-1">
                {currentMistakes.length}{" "}
                {currentMistakes.length === 1 ? "ошибка" : currentMistakes.length < 5 ? "ошибки" : "ошибок"}
              </div>
              <button
                onClick={() => setShowMistakes(true)}
                className="text-[color:var(--danger)] text-sm underline hover:no-underline"
              >
                Посмотреть разбор →
              </button>
            </motion.div>
          )}

          <div className="flex gap-3 justify-center">
            <Button onClick={handleExit} variant="secondary">
              Выйти
            </Button>
            <Button
              onClick={() => {
                setShowComplete(false);
                setShowMistakes(false);
                handleStart();
              }}
              variant={nextGame ? "secondary" : "primary"}
            >
              Ещё раз
            </Button>
            {nextGame && (
              <Button onClick={handleNext} variant="primary">
                Следующая игра
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md w-full"
        >
          <div className="flex justify-center mb-4">
            <span className="w-14 h-14 rounded-2xl bg-surface-2 border border-subtle flex items-center justify-center text-accent shadow-card">
              <GameIcon className="text-3xl" aria-hidden />
            </span>
          </div>
          <h1 className="text-2xl font-display font-semibold mb-2">{game.name}</h1>
          <p className="text-muted mb-6">{game.description}</p>
          <div className="flex flex-col gap-3 mb-6 text-sm text-muted">
            <div className="flex justify-between px-4 py-2 bg-surface-2 border border-subtle rounded-lg">
              <span>Время</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={20}
                  max={300}
                  step={5}
                  value={sessionTimeLimit}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isNaN(next)) return;
                    const clamped = Math.min(300, Math.max(20, next));
                    setSessionTimeLimit(clamped);
                  }}
                  className="w-20 px-2 py-1 rounded-md bg-surface border border-subtle text-right font-mono text-strong"
                  aria-label="Время на раунд, секунд"
                />
                <span className="font-mono">с</span>
              </div>
            </div>
            <div className="flex justify-between px-4 py-2 bg-surface-2 border border-subtle rounded-lg">
              <span>За правильный ответ</span>
              <span className="font-mono">+{game.pointsPerCorrect}</span>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleExit} variant="ghost">
              Назад
            </Button>
            <Button onClick={handleStart} hotkey="Space">
              Начать
            </Button>
          </div>
          <div className="mt-6 text-xs text-soft">1-4 — выбор ответа • P — пауза • Esc — выход</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-[color:var(--surface-1-80)] backdrop-blur-sm border-b border-subtle">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleExit}
              className="p-2 -ml-2 text-soft hover:text-strong"
              aria-label="Выйти из игры"
            >
              X
            </button>
            <div className="flex-1">
              <ProgressBar value={currentChallenge} max={totalChallenges} size="sm" />
            </div>
            <TimerDisplay seconds={timeLeft} />
          </div>
          <div className="flex justify-center mt-2">
            <ScoreDisplay compact />
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-[color:var(--surface-1-95)] flex items-center justify-center"
          >
            <div className="text-center">
              <div className="text-4xl mb-4" />
              <h2 className="text-xl font-display font-semibold mb-4">Пауза</h2>
              <Button onClick={handlePause} hotkey="P">
                Продолжить
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentChallenge}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
