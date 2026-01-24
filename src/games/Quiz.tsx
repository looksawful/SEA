"use client";
import { Card } from "@/components/Card";
import { useNumberKeys } from "@/hooks/useKeyboard";
import { useSound } from "@/hooks/useSound";
import { useGameStore } from "@/store/gameStore";
import { pickRandom, shuffle } from "@/utils/helpers";
import { Difficulty, difficultyDots, getDifficulty } from "@/utils/difficulty";
import { Language, t } from "@/utils/i18n";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: "color" | "typography" | "layout" | "ux" | "accessibility";
  difficulty: Difficulty;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Какой контраст минимально необходим для WCAG AA?",
    options: ["3:1", "4.5:1", "7:1", "2:1"],
    correctIndex: 1,
    explanation: "WCAG AA требует контраст 4.5:1 для обычного текста и 3:1 для крупного",
    category: "accessibility",
    difficulty: "easy",
  },
  {
    question: "Что такое кернинг?",
    options: ["Расстояние между строками", "Расстояние между буквами", "Расстояние между словами", "Размер шрифта"],
    correctIndex: 1,
    explanation: "Кернинг — регулировка расстояния между конкретными парами букв",
    category: "typography",
    difficulty: "easy",
  },
  {
    question: "Комплементарные цвета находятся на цветовом круге...",
    options: ["Рядом (30°)", "Напротив (180°)", "Под углом 90°", "Под углом 120°"],
    correctIndex: 1,
    explanation: "Комплементарные цвета расположены напротив друг друга (180°)",
    category: "color",
    difficulty: "easy",
  },
  {
    question: "Что такое leading (интерлиньяж)?",
    options: ["Расстояние между буквами", "Расстояние между строками", "Толщина шрифта", "Наклон шрифта"],
    correctIndex: 1,
    explanation: "Leading — вертикальное расстояние между базовыми линиями строк",
    category: "typography",
    difficulty: "easy",
  },
  {
    question: "Какой цвет получится при смешении красного и синего в RGB?",
    options: ["Зелёный", "Жёлтый", "Маджента", "Циан"],
    correctIndex: 2,
    explanation: "В аддитивной модели RGB: красный + синий = маджента",
    category: "color",
    difficulty: "easy",
  },
  {
    question: "Что такое whitespace в дизайне?",
    options: ["Белый фон", "Пустое пространство", "Белый текст", "Светлая тема"],
    correctIndex: 1,
    explanation: "Whitespace — пустое пространство, помогающее организовать контент",
    category: "layout",
    difficulty: "easy",
  },
  {
    question: "Какой шрифт относится к sans-serif?",
    options: ["Times New Roman", "Georgia", "Arial", "Courier"],
    correctIndex: 2,
    explanation: "Sans-serif — шрифты без засечек. Arial — классический гротеск",
    category: "typography",
    difficulty: "easy",
  },
  {
    question: "Что означает HSL?",
    options: ["Hue, Shade, Light", "Hue, Saturation, Lightness", "High, Standard, Low", "Hex, Saturation, Level"],
    correctIndex: 1,
    explanation: "HSL: Hue (тон), Saturation (насыщенность), Lightness (светлость)",
    category: "color",
    difficulty: "easy",
  },
  {
    question: "Какое золотое сечение используется в дизайне?",
    options: ["1.414", "1.618", "1.732", "1.5"],
    correctIndex: 1,
    explanation: "Золотое сечение ≈ 1.618 (φ)",
    category: "layout",
    difficulty: "medium",
  },
  {
    question: "Что такое трекинг в типографике?",
    options: ["Расстояние между строками", "Межбуквенный интервал", "Расстояние между абзацами", "Выравнивание текста"],
    correctIndex: 1,
    explanation: "Трекинг — равномерное изменение расстояния между всеми буквами",
    category: "typography",
    difficulty: "medium",
  },
  {
    question: "Аналоговые цвета расположены...",
    options: ["Напротив друг друга", "Рядом (±30°)", "Под углом 120°", "Под углом 90°"],
    correctIndex: 1,
    explanation: "Аналоговые цвета рядом на цветовом круге (±30°)",
    category: "color",
    difficulty: "medium",
  },
  {
    question: "Что такое x-height?",
    options: ["Высота заглавных букв", "Высота строчной x", "Высота выносных элементов", "Общая высота шрифта"],
    correctIndex: 1,
    explanation: "X-height — высота строчных букв без выносных элементов",
    category: "typography",
    difficulty: "medium",
  },
  {
    question: "Какой принцип гештальта описывает группировку близких элементов?",
    options: ["Similarity", "Proximity", "Closure", "Continuity"],
    correctIndex: 1,
    explanation: "Proximity — элементы, расположенные близко, воспринимаются как группа",
    category: "ux",
    difficulty: "medium",
  },
  {
    question: "Что такое baseline grid?",
    options: ["Сетка для изображений", "Сетка базовых линий текста", "Сетка для кнопок", "Фоновая сетка"],
    correctIndex: 1,
    explanation: "Baseline grid — система выравнивания текста по единым базовым линиям",
    category: "typography",
    difficulty: "medium",
  },
  {
    question: "Триадная цветовая схема использует...",
    options: ["2 цвета напротив", "3 равноудалённых цвета", "4 цвета", "Оттенки одного цвета"],
    correctIndex: 1,
    explanation: "Триадная схема: 3 цвета через 120° друг от друга",
    category: "color",
    difficulty: "medium",
  },
  {
    question: "Что такое orphan в типографике?",
    options: ["Слово в конце абзаца", "Строка в начале страницы", "Строка в конце страницы", "Перенос слова"],
    correctIndex: 2,
    explanation: "Orphan — последняя строка абзаца одна на новой странице",
    category: "typography",
    difficulty: "medium",
  },
  {
    question: "Закон Хика гласит: время реакции зависит от...",
    options: ["Размера элементов", "Количества вариантов", "Контраста", "Анимации"],
    correctIndex: 1,
    explanation: "Закон Хика: время решения растёт с количеством вариантов",
    category: "ux",
    difficulty: "medium",
  },
  {
    question: "Что такое widow в типографике?",
    options: ["Короткая последняя строка", "Одинокое слово на строке", "Перенос слова", "Висячая пунктуация"],
    correctIndex: 1,
    explanation: "Widow — одинокое короткое слово на последней строке абзаца",
    category: "typography",
    difficulty: "hard",
  },
  {
    question: "Формула контраста WCAG?",
    options: ["(L1+0.05)/(L2+0.05)", "L1/L2", "L1-L2", "(L1-L2)/L1"],
    correctIndex: 0,
    explanation: "Контраст = (L1 + 0.05) / (L2 + 0.05)",
    category: "accessibility",
    difficulty: "hard",
  },
  {
    question: "Ёмкость кратковременной памяти по Миллеру?",
    options: ["3±1", "5±2", "7±2", "10±3"],
    correctIndex: 2,
    explanation: "Закон Миллера: 7±2 элементов",
    category: "ux",
    difficulty: "hard",
  },
  {
    question: "Что такое optical margin alignment?",
    options: [
      "Выравнивание по оптической оси",
      "Пунктуация за полем",
      "Выравнивание изображений",
      "Выравнивание колонок",
    ],
    correctIndex: 1,
    explanation: "Вынос пунктуации за край колонки для визуального выравнивания",
    category: "typography",
    difficulty: "hard",
  },
  {
    question: "Коэффициент Major Third шкалы?",
    options: ["1.125", "1.2", "1.25", "1.333"],
    correctIndex: 2,
    explanation: "Major Third = 1.25 (5:4)",
    category: "typography",
    difficulty: "hard",
  },
  {
    question: "Что такое метамерия?",
    options: ["Смешение цветов", "Разный цвет при разном свете", "Цветовая слепота", "Насыщенность"],
    correctIndex: 1,
    explanation: "Метамерия — цвета выглядят одинаково при одном свете и разными при другом",
    category: "color",
    difficulty: "hard",
  },
  {
    question: "Что такое river в типографике?",
    options: ["Волнистый текст", "Вертикальные белые полосы", "Подчёркивание", "Отступ первой строки"],
    correctIndex: 1,
    explanation: "River — случайное выравнивание пробелов создаёт белые вертикальные полосы",
    category: "typography",
    difficulty: "hard",
  },
  {
    question: "Закон Фиттса описывает зависимость от...",
    options: ["Количества элементов", "Расстояния и размера цели", "Контраста", "Анимации"],
    correctIndex: 1,
    explanation: "Закон Фиттса: время наведения зависит от расстояния и размера цели",
    category: "ux",
    difficulty: "hard",
  },
  {
    question: "Что такое line-height в CSS?",
    options: ["Высота строки", "Толщина шрифта", "Интервал между буквами", "Отступ абзаца"],
    correctIndex: 0,
    explanation: "Line-height определяет вертикальный интервал между строками текста.",
    category: "typography",
    difficulty: "easy",
  },
  {
    question: "Что означает термин 'baseline'?",
    options: ["Линия верхнего выравнивания", "Линия нижнего выравнивания букв", "Центральная линия текста", "Границы абзаца"],
    correctIndex: 1,
    explanation: "Baseline — линия, на которой стоят буквы без выносных элементов.",
    category: "typography",
    difficulty: "easy",
  },
  {
    question: "Какая модель цвета используется для печати?",
    options: ["RGB", "HSL", "CMYK", "LAB"],
    correctIndex: 2,
    explanation: "Для печати используется субтрактивная модель CMYK.",
    category: "color",
    difficulty: "easy",
  },
  {
    question: "Что такое контраст по яркости?",
    options: ["Разница в насыщенности", "Разница в светлоте", "Разница в оттенке", "Разница в прозрачности"],
    correctIndex: 1,
    explanation: "Контраст по яркости — это отличие по светлоте (L).",
    category: "color",
    difficulty: "easy",
  },
  {
    question: "Как называется расстояние между колонками сетки?",
    options: ["Gutter", "Kerning", "Padding", "Baseline"],
    correctIndex: 0,
    explanation: "Gutter — межколоночное пространство в сетке.",
    category: "layout",
    difficulty: "easy",
  },
  {
    question: "Что такое affordance?",
    options: ["Визуальный шум", "Подсказка о действии", "Сетка макета", "Ошибка в UI"],
    correctIndex: 1,
    explanation: "Affordance — свойства объекта, которые подсказывают его использование.",
    category: "ux",
    difficulty: "easy",
  },
  {
    question: "Какой минимальный контраст для AA Large?",
    options: ["7:1", "4.5:1", "3:1", "2:1"],
    correctIndex: 2,
    explanation: "AA Large требует 3:1 для крупного текста.",
    category: "accessibility",
    difficulty: "easy",
  },
  {
    question: "Что такое opacity?",
    options: ["Насыщенность", "Прозрачность", "Контраст", "Тон"],
    correctIndex: 1,
    explanation: "Opacity задаёт степень прозрачности элемента.",
    category: "color",
    difficulty: "easy",
  },
  {
    question: "Что такое cap height?",
    options: ["Высота строчных", "Высота заглавных букв", "Высота строки", "Высота выносных элементов"],
    correctIndex: 1,
    explanation: "Cap height — высота заглавных букв.",
    category: "typography",
    difficulty: "medium",
  },
  {
    question: "Что такое x-height важно для...",
    options: ["Определения ширины", "Читаемости", "Толщины штриха", "Наклона"],
    correctIndex: 1,
    explanation: "X-height влияет на читаемость, особенно в малых размерах.",
    category: "typography",
    difficulty: "medium",
  },
  {
    question: "Тон (hue) измеряется в...",
    options: ["процентах", "пикселях", "градусах", "канделах"],
    correctIndex: 2,
    explanation: "Hue измеряется в градусах на цветовом круге.",
    category: "color",
    difficulty: "medium",
  },
  {
    question: "Что такое 8pt grid?",
    options: ["Сетка с шагом 8px", "Сетка с шагом 4px", "Сетка без шага", "Сетка базовых линий"],
    correctIndex: 0,
    explanation: "8pt grid — система с шагом 8px (или 8pt) для выравнивания.",
    category: "layout",
    difficulty: "medium",
  },
  {
    question: "Закон Якоба говорит о...",
    options: ["Привычках пользователей", "Скорости отклика", "Читаемости", "Цветовой гармонии"],
    correctIndex: 0,
    explanation: "Пользователи проводят большую часть времени на других сайтах и ожидают знакомые паттерны.",
    category: "ux",
    difficulty: "medium",
  },
  {
    question: "Что такое 'focus ring'?",
    options: ["Анимация кнопки", "Обводка фокуса", "Рамка карточки", "Тень"],
    correctIndex: 1,
    explanation: "Focus ring — визуальный индикатор фокуса клавиатуры.",
    category: "accessibility",
    difficulty: "medium",
  },
  {
    question: "Чем отличается serif от sans-serif?",
    options: ["Наличием засечек", "Курсивом", "Только капсом", "Шириной"],
    correctIndex: 0,
    explanation: "Serif имеет засечки, sans-serif — без засечек.",
    category: "typography",
    difficulty: "medium",
  },
  {
    question: "Что такое 'color temperature'?",
    options: ["Температура экрана", "Восприятие тёплых/холодных оттенков", "Контраст по яркости", "Глубина цвета"],
    correctIndex: 1,
    explanation: "Температура цвета описывает ощущение тепла/холода оттенка.",
    category: "color",
    difficulty: "medium",
  },
  {
    question: "Что такое 'gamut'?",
    options: ["Контур", "Диапазон отображаемых цветов", "Межбуквенный интервал", "Тень"],
    correctIndex: 1,
    explanation: "Gamut — диапазон цветов, который может отображать устройство.",
    category: "color",
    difficulty: "hard",
  },
  {
    question: "WCAG формула относительной яркости использует...",
    options: ["Gamma correction", "HSV conversion", "CMYK conversion", "Blur"],
    correctIndex: 0,
    explanation: "WCAG учитывает гамма-коррекцию для расчёта яркости.",
    category: "accessibility",
    difficulty: "hard",
  },
  {
    question: "Что такое 'modular scale' в типографике?",
    options: ["Список шрифтов", "Набор пропорциональных размеров", "Расстояние между буквами", "Глубина текста"],
    correctIndex: 1,
    explanation: "Modular scale — пропорциональный ряд размеров на основе коэффициента.",
    category: "typography",
    difficulty: "hard",
  },
  {
    question: "Что такое 'visual hierarchy'?",
    options: ["Расположение слоёв", "Приоритет внимания через размер/контраст", "Список компонентов", "Порядок сетки"],
    correctIndex: 1,
    explanation: "Visual hierarchy управляет вниманием через контраст, размер и композицию.",
    category: "layout",
    difficulty: "hard",
  },
  {
    question: "Закон Паркинсона для UX чаще означает...",
    options: ["Растягивание сроков", "Сокращение кликов", "Рост контраста", "Снижение шума"],
    correctIndex: 0,
    explanation: "Закон Паркинсона — работа заполняет всё выделенное время.",
    category: "ux",
    difficulty: "hard",
  },
  {
    question: "Что такое 'perceptual uniformity' в цвете?",
    options: ["Равномерное распределение оттенков", "Равномерное восприятие различий", "Одинаковая насыщенность", "Одинаковая яркость"],
    correctIndex: 1,
    explanation: "Perceptual uniformity означает, что одинаковые численные шаги воспринимаются одинаковыми.",
    category: "color",
    difficulty: "expert",
  },
  {
    question: "Что такое variable font?",
    options: ["Шрифт с переменной шириной символов", "Шрифт с одним файлом и осями вариаций", "Шрифт без кернинга", "Шрифт только для UI"],
    correctIndex: 1,
    explanation: "Variable fonts содержат оси вариаций (weight, width, slant) в одном файле.",
    category: "typography",
    difficulty: "expert",
  },
  {
    question: "Что такое 'luminance contrast'?",
    options: ["Контраст по насыщенности", "Контраст по относительной яркости", "Контраст по оттенку", "Контраст по прозрачности"],
    correctIndex: 1,
    explanation: "Luminance contrast измеряется по относительной яркости (WCAG).",
    category: "accessibility",
    difficulty: "expert",
  },
  {
    question: "Что такое 'optical size' в типографике?",
    options: ["Размер в пикселях", "Оптическая корректировка формы под размер", "Межбуквенный интервал", "Толщина штриха"],
    correctIndex: 1,
    explanation: "Optical size — настройка форм под разные кегли для читабельности.",
    category: "typography",
    difficulty: "expert",
  },
  {
    question: "Закон Шнайдера говорит о...",
    options: ["Быстродействии мыши", "Группировании сигналов", "Приоритетах задач", "Метамерии"],
    correctIndex: 2,
    explanation: "Schneider's Law: больше функций — больше когнитивной нагрузки и ошибки.",
    category: "ux",
    difficulty: "expert",
  },
  {
    question: "Что такое 'simultaneous contrast'?",
    options: ["Разный контраст в разных местах", "Изменение восприятия цвета рядом с другим", "Контраст при движении", "Контраст при масштабировании"],
    correctIndex: 1,
    explanation: "Simultaneous contrast — восприятие цвета меняется из-за соседних цветов.",
    category: "color",
    difficulty: "expert",
  },
];

interface Challenge {
  question: QuizQuestion;
  shuffledOptions: string[];
  correctIndex: number;
}

const categoryLabels: Record<Language, Record<QuizQuestion["category"], string>> = {
  ru: {
    color: "цвет",
    typography: "типографика",
    layout: "композиция",
    ux: "UX",
    accessibility: "доступность",
  },
  en: {
    color: "color",
    typography: "type",
    layout: "layout",
    ux: "UX",
    accessibility: "accessibility",
  },
};

const generateChallenge = (usedQuestions: Set<number>, round: number): Challenge | null => {
  const difficulty = getDifficulty(round);

  let available = QUIZ_QUESTIONS.map((q, i) => ({ q, i })).filter(
    ({ q, i }) => !usedQuestions.has(i) && q.difficulty === difficulty,
  );

  if (available.length === 0) {
    available = QUIZ_QUESTIONS.map((q, i) => ({ q, i })).filter(({ i }) => !usedQuestions.has(i));
    if (available.length === 0) return null;
  }

  const { q: question, i: idx } = pickRandom(available);
  usedQuestions.add(idx);
  const shuffledOptions = shuffle([...question.options]);
  const correctIndex = shuffledOptions.indexOf(question.options[question.correctIndex]);

  return { question, shuffledOptions, correctIndex };
};

interface Props {
  onAnswer: (correct: boolean) => void;
}

export const QuizGame = ({ onAnswer }: Props) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [round, setRound] = useState(0);
  const [usedQuestions] = useState(() => new Set<number>());
  const { addScore, incrementStreak, resetStreak, updateStats, addMistake, language } = useGameStore();
  const { playCorrect, playWrong } = useSound();

  useEffect(() => {
    setChallenge(generateChallenge(usedQuestions, round));
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      if (showResult || !challenge) return;

      setSelected(index);
      setShowResult(true);

      const correct = index === challenge.correctIndex;

      if (correct) {
        const pts =
          challenge.question.difficulty === "expert"
            ? 250
            : challenge.question.difficulty === "hard"
              ? 200
              : challenge.question.difficulty === "medium"
                ? 150
                : 100;
        addScore(pts);
        incrementStreak();
        playCorrect();
      } else {
        resetStreak();
        playWrong();
        addMistake({
          question: challenge.question.question,
          userAnswer: challenge.shuffledOptions[index],
          correctAnswer: challenge.shuffledOptions[challenge.correctIndex],
          explanation: challenge.question.explanation,
        });
      }

      updateStats("quiz", correct);

      setTimeout(() => {
        onAnswer(correct);
        setRound((r) => r + 1);
        setChallenge(generateChallenge(usedQuestions, round + 1));
        setSelected(null);
        setShowResult(false);
      }, 1500);
    },
    [challenge, showResult, round, usedQuestions],
  );

  useNumberKeys((num) => {
    if (num < (challenge?.shuffledOptions.length || 0)) handleSelect(num);
  }, !showResult);

  if (!challenge) return <div className="text-center p-8 text-muted">{t(language, "noQuestionsLeft")}</div>;

  const catColors: Record<string, string> = {
    color: "bg-[color:var(--accent-soft)] text-accent",
    typography: "bg-[color:var(--warning-soft)] text-[color:var(--warning-strong)]",
    layout: "bg-[color:var(--success-soft)] text-[color:var(--success-strong)]",
    ux: "bg-surface-3 text-muted",
    accessibility: "bg-[color:var(--danger-soft)] text-[color:var(--danger-strong)]",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-1 sm:space-y-2">
        <div className="hidden sm:flex justify-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${catColors[challenge.question.category]}`}>
            {categoryLabels[language][challenge.question.category]}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-surface-2 text-muted">
            {difficultyDots(challenge.question.difficulty)}
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">{challenge.question.question}</h2>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3">
        {challenge.shuffledOptions.map((option, index) => (
          <Card
            key={index}
            onClick={() => handleSelect(index)}
            selected={selected === index}
            correct={showResult ? index === challenge.correctIndex : null}
            className="min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 bg-surface-2 rounded-full flex items-center justify-center text-sm font-mono text-muted">
                {index + 1}
              </span>
              <span>{option}</span>
            </div>
          </Card>
        ))}
      </div>

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-surface-2 rounded-xl text-sm text-muted"
        >
          {challenge.question.explanation}
        </motion.div>
      )}
    </div>
  );
};

