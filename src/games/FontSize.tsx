"use client";
import { Card } from "@/components/Card";
import { HintToggle } from "@/components/HintToggle";
import { useNumberKeys } from "@/hooks/useKeyboard";
import { useSkipSignal } from "@/hooks/useSkipSignal";
import { useSound } from "@/hooks/useSound";
import { useGameStore } from "@/store/gameStore";
import { Difficulty, difficultyDots, getDifficulty } from "@/utils/difficulty";
import { getFontSizeClass } from "@/utils/fonts";
import { pickRandom, shuffle } from "@/utils/helpers";
import { Language, LocalizedText, localize, t } from "@/utils/i18n";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const TYPE_SCALES = {
  modular: [12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72],
  linear: [12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32],
  ios: [11, 13, 15, 17, 20, 22, 28, 34],
  material: [10, 12, 14, 16, 20, 24, 34, 48, 60],
  bootstrap: [12, 14, 16, 20, 24, 28, 32, 36, 48],
  editorial: [14, 16, 18, 22, 26, 32, 40, 52, 64],
  compact: [10, 11, 12, 13, 14, 15, 16, 17, 18],
};

const text = (ru: string, en: string): LocalizedText => ({ ru, en });

const FALLBACK_TEXTS: Record<Language, string[]> = {
  ru: [
    "Типографика",
    "Дизайн-система",
    "Визуальный баланс",
    "Негативное пространство",
    "Композиция",
    "Гармония цвета",
    "Иерархия",
    "Консистентность",
    "Читаемость",
    "Контраст",
    "Ритм и паттерн",
    "Модульная сетка",
    "Выравнивание",
    "Доступность",
    "Интерфейс",
    "Пропорции",
    "Баланс",
    "Контекст",
    "Гарнитура",
    "Распознавание",
    "Навигация",
    "Привычка",
    "Сетка",
    "Ритм",
    "Градация",
    "Группа",
    "Отклик",
    "Тон",
    "Динамика",
  ],
  en: [
    "Typography",
    "Design system",
    "Visual balance",
    "Negative space",
    "Composition",
    "Color harmony",
    "Hierarchy",
    "Consistency",
    "Readability",
    "Contrast",
    "Rhythm and pattern",
    "Modular grid",
    "Alignment",
    "Accessibility",
    "Interface",
    "Proportions",
    "Balance",
    "Context",
    "Typeface",
    "Recognition",
    "Navigation",
    "Habit",
    "Grid",
    "Rhythm",
    "Gradation",
    "Group",
    "Response",
    "Tone",
    "Dynamics",
  ],
};

const SCALE_LABELS: Record<keyof typeof TYPE_SCALES, LocalizedText> = {
  modular: text("Модульная", "Modular"),
  linear: text("Линейная", "Linear"),
  ios: text("iOS", "iOS"),
  material: text("Material", "Material"),
  bootstrap: text("Bootstrap", "Bootstrap"),
  editorial: text("Редакционная", "Editorial"),
  compact: text("Компактная", "Compact"),
};

interface Challenge {
  size: number;
  text: string;
  options: number[];
  difficulty: Difficulty;
  scale: keyof typeof TYPE_SCALES;
}

const getDifficultyOptions = (correctSize: number, scale: number[], difficulty: Difficulty): number[] => {
  const idx = scale.indexOf(correctSize);
  const offsets: Record<Difficulty, number[]> = {
    easy: [-3, -2, -1, 1, 2, 3],
    medium: [-2, -1, 1, 2],
    hard: [-1, 1, 2],
    expert: [-1, 1],
  };

  const values = new Set<number>([correctSize]);

  for (const offset of offsets[difficulty]) {
    const candidate = scale[idx + offset];
    if (typeof candidate === "number") {
      values.add(candidate);
    }
    if (values.size >= 4) break;
  }

  const fallback = scale.filter((value) => !values.has(value));
  while (values.size < 4 && fallback.length > 0) {
    const pick = pickRandom(fallback);
    values.add(pick);
    fallback.splice(fallback.indexOf(pick), 1);
  }

  return shuffle([...values]).slice(0, 4);
};

interface Props {
  onAnswer: (correct: boolean) => void;
}

export const FontSizeGame = ({ onAnswer }: Props) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(0);
  const textIndexRef = useRef(0);
  const { addScore, incrementStreak, resetStreak, updateStats, addMistake, setReviewPause, language } = useGameStore();
  const textPool = useMemo(() => shuffle([...(FALLBACK_TEXTS[language] ?? FALLBACK_TEXTS.ru)]), [language]);
  const { playCorrect, playWrong } = useSound();

  const generateChallenge = useCallback(
    (roundNum: number): Challenge => {
      const difficulty: Difficulty = getDifficulty(roundNum);
      const scaleNames = Object.keys(TYPE_SCALES) as (keyof typeof TYPE_SCALES)[];
      const scaleName = pickRandom(scaleNames);
      const scale = TYPE_SCALES[scaleName];

      const availableSizes =
        difficulty === "hard" ? scale.filter((s) => s >= 14 && s <= 36) : scale.filter((s) => s >= 12 && s <= 48);

      const size = pickRandom(availableSizes);

      const text =
        textPool.length > 0
          ? textPool[textIndexRef.current % textPool.length]
          : pickRandom(FALLBACK_TEXTS[language] ?? FALLBACK_TEXTS.ru);
      textIndexRef.current += 1;

      const options = getDifficultyOptions(size, scale, difficulty);

      if (!options.includes(size)) {
        options[0] = size;
      }

      return {
        size,
        text,
        options: shuffle(options),
        difficulty,
        scale: scaleName,
      };
    },
    [textPool, language],
  );

  useEffect(() => {
    textIndexRef.current = 0;
    setChallenge(generateChallenge(round));
  }, [generateChallenge]);

  const handleSelect = useCallback(
    (index: number) => {
      if (showResult || !challenge) return;

      setSelected(index);
      setShowResult(true);

      const userAnswer = challenge.options[index];
      const correct = userAnswer === challenge.size;

      if (correct) {
        const points =
          challenge.difficulty === "expert"
            ? 180
            : challenge.difficulty === "hard"
              ? 150
              : challenge.difficulty === "medium"
                ? 120
                : 100;
        addScore(points);
        incrementStreak();
        playCorrect();
      } else {
        resetStreak();
        playWrong();
        addMistake({
          question:
            language === "ru"
              ? `Какой размер шрифта? (текст: "${challenge.text}")`
              : `What is the font size? (text: "${challenge.text}")`,
          userAnswer: `${userAnswer}px`,
          correctAnswer: `${challenge.size}px`,
          explanation:
            language === "ru"
              ? `Разница между ${userAnswer}px и ${challenge.size}px составляет ${Math.abs(userAnswer - challenge.size)}px. Тренируйте глаз на модульных шкалах: ${TYPE_SCALES.modular.slice(0, 6).join(", ")}...`
              : `The difference between ${userAnswer}px and ${challenge.size}px is ${Math.abs(userAnswer - challenge.size)}px. Train your eye with modular scales: ${TYPE_SCALES.modular.slice(0, 6).join(", ")}...`,
        });
      }

      updateStats("font-size", correct);

      const reviewDelay = correct ? 1200 : 2400;
      setReviewPause(reviewDelay);

      setTimeout(() => {
        onAnswer(correct);
        const newRound = round + 1;
        setRound(newRound);
        setChallenge(generateChallenge(newRound));
        setSelected(null);
        setShowResult(false);
      }, reviewDelay);
    },
    [challenge, showResult, round, generateChallenge, setReviewPause, language],
  );

  const handleSkip = useCallback(() => {
    if (!challenge || showResult) return;
    onAnswer(false);
    const newRound = round + 1;
    setRound(newRound);
    setChallenge(generateChallenge(newRound));
    setSelected(null);
    setShowResult(false);
  }, [challenge, showResult, round, generateChallenge, onAnswer, language]);

  useSkipSignal(handleSkip, !showResult);

  useNumberKeys((num) => {
    if (num < (challenge?.options.length || 0)) {
      handleSelect(num);
    }
  }, !showResult);

  if (!challenge)
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-soft">{t(language, "loading")}</div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">
          {language === "ru" ? "Какой это размер шрифта?" : "What font size is this?"}
        </h2>
        <HintToggle
          hint={
            language === "ru"
              ? "Ориентируйтесь на базовый размер интерфейса 16px и сравните высоту букв."
              : "Use the 16px base UI size and compare letter height."
          }
        />
        <div className="text-xs text-soft">
          {t(language, "difficultyLabel")}: {difficultyDots(challenge.difficulty)}
        </div>
      </div>

      <div className="bg-surface-2 rounded-2xl p-8 flex items-center justify-center min-h-40 border border-subtle shadow-card">
        <motion.span
          className={`font-medium text-strong select-none text-center ${getFontSizeClass(challenge.size)}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          key={challenge.text}
        >
          {challenge.text}
        </motion.span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {challenge.options.map((size, index) => (
          <Card
            key={index}
            onClick={() => handleSelect(index)}
            selected={selected === index}
            correct={showResult ? size === challenge.size : null}
          >
            <div className="text-center">
              <span className="font-mono text-lg">{size}px</span>
              <span className="hidden sm:inline text-xs text-soft ml-2">[{index + 1}]</span>
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
          {language === "ru" ? "Правильный размер" : "Correct size"}:{" "}
          <span className="font-mono font-medium">{challenge.size}px</span>
          <span className="text-xs block mt-1 text-soft">
            {language === "ru" ? "Шкала" : "Scale"}: {localize(SCALE_LABELS[challenge.scale], language)}
          </span>
        </motion.div>
      )}
    </div>
  );
};
