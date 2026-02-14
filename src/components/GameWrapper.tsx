"use client";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useSound } from "@/hooks/useSound";
import { useTimer } from "@/hooks/useTimer";
import { useGameStore } from "@/store/gameStore";
import { GameId, MistakeRecord } from "@/types";
import { GAMES } from "@/utils/gameConfig";
import { Language, getGameLabel, t } from "@/utils/i18n";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { FaFlag, FaForward } from "react-icons/fa";
import { Button } from "./Button";
import { ProgressBar, TimerDisplay } from "./Progress";
import { ScoreDisplay } from "./Score";
import { Swatch } from "./Swatch";
import { TheoryButton, TheoryPanel } from "./TheoryPanel";

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

const MistakeCard = ({ mistake, index, language }: { mistake: MistakeRecord; index: number; language: Language }) => (
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
            <span className="text-[color:var(--danger)] text-xs block">{t(language, "yourAnswer")}</span>
            {mistake.userAnswer}
          </div>
          <div className="bg-[color:var(--success-soft)] text-[color:var(--success-strong)] px-3 py-2 rounded-lg">
            <span className="text-[color:var(--success)] text-xs block">{t(language, "correctAnswer")}</span>
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
  const [showReport, setShowReport] = useState(false);
  const [showTheory, setShowTheory] = useState(false);
  const [reportText, setReportText] = useState("");
  const [sessionTimeLimit, setSessionTimeLimit] = useState(game.timeLimit);
  const { playComplete } = useSound();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

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
    language,
    avoidRepeats,
    setAvoidRepeats,
    longTestLength,
    setLongTestLength,
    timedMode,
    reviewPauseUntil,
    clearReviewPause,
    triggerSkip,
  } = useGameStore();
  const gameLabel = getGameLabel(gameId, language);
  const longTestOptions = [10, 20, 30, 40, 50];
  const reportSubject = `${t(language, "reportIssueTitle")} — ${gameLabel.name}`;
  const reportMeta = `Game: ${gameLabel.name} (${gameId})\nQuestion: ${Math.min(
    currentChallenge + 1,
    totalChallenges,
  )}/${totalChallenges}\nURL: ${typeof window !== "undefined" ? window.location.href : ""}`;
  const reportBody = reportText.trim() ? `${reportText.trim()}\n\n${reportMeta}` : reportMeta;

  const { start, stop, reset } = useTimer({
    initialTime: sessionTimeLimit,
    onTick: setTimeLeft,
    onComplete: () => {
      handleGameComplete();
    },
  });

  const resolvedCorrect = typeof correctCount === "number" ? correctCount : Math.floor(score / game.pointsPerCorrect);

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
    if (timedMode) {
      start();
    }
  };

  const handlePause = () => {
    if (isPaused) {
      if (timedMode) {
        start();
      }
      setIsPaused(false);
    } else {
      if (timedMode) {
        stop();
      }
      setIsPaused(true);
    }
  };

  const handleSkip = () => {
    if (!isPlaying || isPaused || showComplete) return;
    triggerSkip();
  };

  const closeReport = () => {
    setShowReport(false);
    setReportText("");
  };

  const handleReportEmail = () => {
    const url = `mailto:i@lookawful.ru?subject=${encodeURIComponent(reportSubject)}&body=${encodeURIComponent(reportBody)}`;
    window.location.href = url;
    closeReport();
  };

  const handleReportGithub = () => {
    const url = `https://github.com/looksawful/SEA/issues/new?title=${encodeURIComponent(
      reportSubject,
    )}&body=${encodeURIComponent(reportBody)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    closeReport();
  };

  const handleExit = () => {
    stop();
    resetGame();
    clearMistakes();
    router.push("/");
  };

  const handleNext = () => {
    if (!nextGame) return;
    const nextQueue = nextGame.queue.length > 0 ? `?next=${encodeURIComponent(JSON.stringify(nextGame.queue))}` : "";
    router.push(`/game/${nextGame.id}${nextQueue}`);
  };

  useKeyboard(
    {
      escape: () => {
        if (showReport) {
          closeReport();
        } else {
          handleExit();
        }
      },
      p: handlePause,
      s: handleSkip,
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
  }, [sessionTimeLimit, isPlaying, timedMode, reset, setTimeLeft]);

  useEffect(() => {
    if (!reviewPauseUntil || !isPlaying || isPaused || !timedMode) return;
    const remaining = reviewPauseUntil - Date.now();
    if (remaining <= 0) {
      clearReviewPause();
      return;
    }
    stop();
    const timeout = window.setTimeout(() => {
      clearReviewPause();
      if (!isPaused && isPlaying && timedMode) {
        start();
      }
    }, remaining);
    return () => window.clearTimeout(timeout);
  }, [reviewPauseUntil, isPlaying, isPaused, timedMode, start, stop, clearReviewPause]);

  if (showComplete) {
    const accuracy = totalChallenges > 0 ? Math.round((resolvedCorrect / totalChallenges) * 100) : 0;

    if (showMistakes && currentMistakes.length > 0) {
      return (
        <div className="min-h-screen bg-surface-2">
          <header className="sticky top-0 z-10 bg-surface border-b border-subtle px-4 py-3">
            <div className="max-w-2xl mx-auto flex items-center justify-between">
              <button onClick={() => setShowMistakes(false)} className="p-2 -ml-2 text-muted">
                ← {t(language, "back")}
              </button>
              <h2 className="text-lg sm:text-xl font-display font-semibold tracking-tight text-strong">
                {t(language, "mistakeReviewTitle", { count: currentMistakes.length })}
              </h2>
              <div className="w-10" />
            </div>
          </header>
          <main className="max-w-2xl mx-auto p-4 space-y-4">
            {currentMistakes.map((mistake, i) => (
              <MistakeCard key={i} mistake={mistake} index={i} language={language} />
            ))}
            <div className="pt-4">
              <Button onClick={handleStart} fullWidth size="lg">
                {t(language, "tryAgain")}
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
            {accuracy >= 80
              ? t(language, "resultGreat")
              : accuracy >= 50
                ? t(language, "resultGood")
                : t(language, "resultOk")}
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-2">
            {t(language, "roundComplete")}
          </h2>
          <div className="text-4xl font-mono font-bold mb-2">{score.toLocaleString()}</div>
          <div className="text-muted mb-6">
            {t(language, "correctSummary", { correct: resolvedCorrect, total: totalChallenges, accuracy })}
          </div>
          {nextGame && (
            <div className="text-sm text-muted mb-4">
              {t(language, "nextGame", { name: getGameLabel(nextGame.id, language).name })}
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
                {t(language, "mistakesCount", {
                  count: currentMistakes.length,
                  label: t(language, "mistakesLabel", { count: currentMistakes.length }),
                })}
              </div>
              <button
                onClick={() => setShowMistakes(true)}
                className="text-[color:var(--danger)] text-sm underline hover:no-underline"
              >
                {t(language, "reviewMistakes")}
              </button>
            </motion.div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleExit} variant="secondary" fullWidth>
              {t(language, "exit")}
            </Button>
            <Button
              onClick={() => {
                setShowComplete(false);
                setShowMistakes(false);
                handleStart();
              }}
              variant={nextGame ? "secondary" : "primary"}
              fullWidth
            >
              {t(language, "again")}
            </Button>
            {nextGame && (
              <Button onClick={handleNext} variant="primary" fullWidth>
                {t(language, "next")}
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
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-2">{gameLabel.name}</h1>
          <p className="text-muted mb-6">{gameLabel.description}</p>
          <div className="flex flex-col gap-3 mb-6 text-sm text-muted">
            <div className="flex justify-between px-4 py-2 bg-surface-2 border border-subtle rounded-lg">
              <span>{t(language, "time")}</span>
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
                  aria-label={t(language, "timeRoundLabel")}
                  disabled={!timedMode}
                />
                <span className="font-mono">{t(language, "seconds")}</span>
              </div>
            </div>
            <div className="flex justify-between px-4 py-2 bg-surface-2 border border-subtle rounded-lg">
              <span>{t(language, "pointsPerCorrect")}</span>
              <span className="font-mono">+{game.pointsPerCorrect}</span>
            </div>
            <div className="flex justify-between px-4 py-2 bg-surface-2 border border-subtle rounded-lg">
              <span>{t(language, "repeatMode")}</span>
              <button
                onClick={() => setAvoidRepeats(!avoidRepeats)}
                className="text-xs font-medium text-strong bg-surface-3 border border-subtle rounded-full px-3 py-1"
                aria-pressed={avoidRepeats}
              >
                {avoidRepeats ? t(language, "noRepeats") : t(language, "allowRepeats")}
              </button>
            </div>
            {gameId === "long-test" && (
              <div className="flex justify-between px-4 py-2 bg-surface-2 border border-subtle rounded-lg">
                <span>{t(language, "questionCount")}</span>
                <div className="flex flex-wrap justify-end gap-2">
                  {longTestOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setLongTestLength(option)}
                      className={`text-xs font-medium rounded-full px-3 py-1 border ${
                        longTestLength === option
                          ? "bg-surface-3 text-strong border-subtle"
                          : "bg-surface text-muted border-subtle hover:text-strong"
                      }`}
                      aria-pressed={longTestLength === option}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <TheoryButton gameId={gameId} language={language} onClick={() => setShowTheory(true)} />
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleExit} variant="ghost" fullWidth>
              {t(language, "back")}
            </Button>
            <Button onClick={handleStart} hotkey="Space" fullWidth>
              {t(language, "start")}
            </Button>
          </div>
          <div className="mt-6 text-xs text-soft hidden sm:block">{t(language, "hotkeys")}</div>
          <TheoryPanel gameId={gameId} language={language} open={showTheory} onClose={() => setShowTheory(false)} />
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
              aria-label={t(language, "exit")}
            >
              X
            </button>
            <div className="flex-1">
              <ProgressBar value={currentChallenge} max={totalChallenges} size="sm" />
            </div>
            <TimerDisplay seconds={timeLeft} disabled={!timedMode} />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReport(true)}
                className="p-2 rounded-xl border border-subtle bg-surface-2 text-muted hover:text-strong hover:bg-surface-3"
                aria-label={t(language, "reportQuestion")}
                title={t(language, "reportQuestion")}
              >
                <FaFlag />
              </button>
              <button
                onClick={handleSkip}
                className="p-2 rounded-xl border border-subtle bg-surface-2 text-muted hover:text-strong hover:bg-surface-3"
                aria-label={t(language, "skip")}
                title={`${t(language, "skip")} (S)`}
              >
                <FaForward />
              </button>
            </div>
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
            className="fixed inset-0 z-20 bg-[color:var(--surface-1-80)] backdrop-blur flex items-center justify-center"
          >
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold tracking-tight mb-4">{t(language, "pause")}</h2>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handlePause} hotkey="P">
                  {t(language, "resume")}
                </Button>
                <Button onClick={handleExit} variant="ghost">
                  {t(language, "exit")}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-[color:var(--surface-1-95)] backdrop-blur flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-lg bg-surface border border-subtle rounded-3xl shadow-card p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-display font-semibold tracking-tight">{t(language, "reportIssueTitle")}</h2>
                <button onClick={closeReport} className="text-soft hover:text-strong">
                  {t(language, "close")}
                </button>
              </div>
              <textarea
                value={reportText}
                onChange={(event) => setReportText(event.target.value)}
                placeholder={t(language, "reportPlaceholder")}
                className="w-full min-h-[120px] rounded-2xl glass-input p-3 text-sm text-strong placeholder:text-soft focus:outline-none"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleReportEmail} fullWidth>
                  {t(language, "sendEmail")}
                </Button>
                <Button onClick={handleReportGithub} variant="secondary" fullWidth>
                  {t(language, "github")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main
        className="flex-1 flex items-center justify-center p-4"
        onTouchStart={(event) => {
          if (!isPlaying || isPaused || showComplete) return;
          const touch = event.touches[0];
          if (!touch) return;
          touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          if (!touchStartRef.current) return;
          const touch = event.changedTouches[0];
          if (!touch) return;
          const dx = touch.clientX - touchStartRef.current.x;
          const dy = touch.clientY - touchStartRef.current.y;
          touchStartRef.current = null;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
            handleSkip();
          }
        }}
      >
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
