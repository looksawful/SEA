"use client";
import { Card } from "@/components/Card";
import { HintToggle } from "@/components/HintToggle";
import { useNumberKeys } from "@/hooks/useKeyboard";
import { useSkipSignal } from "@/hooks/useSkipSignal";
import { useSound } from "@/hooks/useSound";
import { useGameStore } from "@/store/gameStore";
import { Difficulty, difficultyDots, getDifficulty } from "@/utils/difficulty";
import { pickRandom, shuffle } from "@/utils/helpers";
import { Language, LocalizedText, localize, t } from "@/utils/i18n";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

interface QuizQuestion {
  question: LocalizedText;
  options: LocalizedText[];
  correctIndex: number;
  explanation: LocalizedText;
  category: "color" | "typography" | "layout" | "ux" | "accessibility" | "shader" | "3d" | "rendering" | "code";
  difficulty: Difficulty;
}

const text = (ru: string, en: string): LocalizedText => ({ ru, en });

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: text(
      "Какой контраст минимально необходим для WCAG AA для обычного текста?",
      "What is the minimum contrast required for WCAG AA for normal text?",
    ),
    options: [text("3:1", "3:1"), text("4.5:1", "4.5:1"), text("7:1", "7:1"), text("2:1", "2:1")],
    correctIndex: 1,
    explanation: text(
      "WCAG AA требует контраст 4.5:1 для обычного текста и 3:1 для крупного",
      "WCAG AA requires 4.5:1 for normal text and 3:1 for large text",
    ),
    category: "accessibility",
    difficulty: "easy",
  },
  {
    question: text("Что такое кернинг?", "What is kerning?"),
    options: [
      text("Расстояние между конкретными парами букв", "Spacing between specific letter pairs"),
      text("Одинаковое расстояние между всеми буквами", "Uniform spacing between all letters"),
      text("Расстояние между словами", "Spacing between words"),
      text("Размер шрифта", "Font size"),
    ],
    correctIndex: 0,
    explanation: text(
      "Кернинг — регулировка расстояния между конкретными парами букв",
      "Kerning is the adjustment of spacing between specific letter pairs",
    ),
    category: "typography",
    difficulty: "easy",
  },
  {
    question: text(
      "Комплементарные цвета находятся на цветовом круге...",
      "Complementary colors on the color wheel are...",
    ),
    options: [
      text("Рядом (30°)", "Adjacent (30°)"),
      text("Напротив (180°)", "Opposite (180°)"),
      text("Под углом 90°", "At 90°"),
      text("Под углом 120°", "At 120°"),
    ],
    correctIndex: 1,
    explanation: text(
      "Комплементарные цвета расположены напротив друг друга (180°)",
      "Complementary colors sit opposite each other (180°)",
    ),
    category: "color",
    difficulty: "easy",
  },
  {
    question: text("Что такое leading (интерлиньяж)?", "What is leading (line spacing)?"),
    options: [
      text("Расстояние между буквами", "Spacing between letters"),
      text("Расстояние между строками", "Spacing between lines"),
      text("Толщина шрифта", "Font weight"),
      text("Наклон шрифта", "Font slant"),
    ],
    correctIndex: 1,
    explanation: text(
      "Leading — вертикальное расстояние между базовыми линиями строк",
      "Leading is the vertical distance between baselines of lines of text",
    ),
    category: "typography",
    difficulty: "easy",
  },
  {
    question: text(
      "Какой цвет получится при смешении красного и синего в RGB?",
      "What color results from mixing red and blue in RGB?",
    ),
    options: [text("Зелёный", "Green"), text("Жёлтый", "Yellow"), text("Маджента", "Magenta"), text("Циан", "Cyan")],
    correctIndex: 2,
    explanation: text("В аддитивной модели RGB: красный + синий = маджента", "In additive RGB, red + blue = magenta"),
    category: "color",
    difficulty: "easy",
  },
  {
    question: text("Что такое whitespace в дизайне?", "What is whitespace in design?"),
    options: [
      text("Белый фон", "White background"),
      text("Пустое пространство", "Empty space"),
      text("Белый текст", "White text"),
      text("Светлая тема", "Light theme"),
    ],
    correctIndex: 1,
    explanation: text(
      "Whitespace — пустое пространство, помогающее организовать контент",
      "Whitespace is empty space that helps structure content",
    ),
    category: "layout",
    difficulty: "easy",
  },
  {
    question: text("Какой шрифт относится к sans-serif?", "Which font is sans-serif?"),
    options: [
      text("Times New Roman", "Times New Roman"),
      text("Georgia", "Georgia"),
      text("Arial", "Arial"),
      text("Courier", "Courier"),
    ],
    correctIndex: 2,
    explanation: text(
      "Sans-serif — шрифты без засечек. Arial — классический гротеск",
      "Sans-serif fonts have no serifs. Arial is a classic grotesque",
    ),
    category: "typography",
    difficulty: "easy",
  },
  {
    question: text("Что означает HSL?", "What does HSL stand for?"),
    options: [
      text("Hue, Shade, Light", "Hue, Shade, Light"),
      text("Hue, Saturation, Lightness", "Hue, Saturation, Lightness"),
      text("High, Standard, Low", "High, Standard, Low"),
      text("Hex, Saturation, Level", "Hex, Saturation, Level"),
    ],
    correctIndex: 1,
    explanation: text(
      "HSL: Hue (тон), Saturation (насыщенность), Lightness (светлость)",
      "HSL stands for Hue, Saturation, Lightness",
    ),
    category: "color",
    difficulty: "easy",
  },
  {
    question: text("Какое золотое сечение используется в дизайне?", "What golden ratio is used in design?"),
    options: [text("1.414", "1.414"), text("1.618", "1.618"), text("1.732", "1.732"), text("1.5", "1.5")],
    correctIndex: 1,
    explanation: text("Золотое сечение ≈ 1.618 (φ)", "The golden ratio is ≈ 1.618 (φ)"),
    category: "layout",
    difficulty: "medium",
  },
  {
    question: text("Что такое трекинг в типографике?", "What is tracking in typography?"),
    options: [
      text("Расстояние между строками", "Line spacing"),
      text("Межбуквенный интервал", "Letter spacing"),
      text("Расстояние между абзацами", "Paragraph spacing"),
      text("Выравнивание текста", "Text alignment"),
    ],
    correctIndex: 1,
    explanation: text(
      "Трекинг — равномерное изменение расстояния между всеми буквами",
      "Tracking is uniform adjustment of spacing between all letters",
    ),
    category: "typography",
    difficulty: "medium",
  },
  {
    question: text("Аналоговые цвета расположены...", "Analogous colors are located..."),
    options: [
      text("Напротив друг друга", "Opposite each other"),
      text("Рядом (±30°)", "Adjacent (±30°)"),
      text("Под углом 120°", "At 120°"),
      text("Под углом 90°", "At 90°"),
    ],
    correctIndex: 1,
    explanation: text(
      "Аналоговые цвета рядом на цветовом круге (±30°)",
      "Analogous colors sit next to each other on the color wheel (±30°)",
    ),
    category: "color",
    difficulty: "medium",
  },
  {
    question: text("Что такое x-height?", "What is x-height?"),
    options: [
      text("Высота заглавных букв", "Height of capital letters"),
      text("Высота строчной x", "Height of lowercase x"),
      text("Высота выносных элементов", "Height of ascenders/descenders"),
      text("Общая высота шрифта", "Overall font height"),
    ],
    correctIndex: 1,
    explanation: text(
      "X-height — высота строчных букв без выносных элементов",
      "X-height is the height of lowercase letters excluding ascenders/descenders",
    ),
    category: "typography",
    difficulty: "medium",
  },
  {
    question: text(
      "Какой принцип гештальта описывает группировку близких элементов?",
      "Which Gestalt principle describes grouping by proximity?",
    ),
    options: [
      text("Similarity", "Similarity"),
      text("Proximity", "Proximity"),
      text("Closure", "Closure"),
      text("Continuity", "Continuity"),
    ],
    correctIndex: 1,
    explanation: text(
      "Proximity — элементы, расположенные близко, воспринимаются как группа",
      "Proximity means elements near each other are perceived as a group",
    ),
    category: "ux",
    difficulty: "medium",
  },
  {
    question: text("Что такое baseline grid?", "What is a baseline grid?"),
    options: [
      text("Сетка для изображений", "Grid for images"),
      text("Сетка базовых линий текста", "Grid of text baselines"),
      text("Сетка для кнопок", "Grid for buttons"),
      text("Фоновая сетка", "Background grid"),
    ],
    correctIndex: 1,
    explanation: text(
      "Baseline grid — система выравнивания текста по единым базовым линиям",
      "A baseline grid is a system for aligning text to consistent baselines",
    ),
    category: "typography",
    difficulty: "medium",
  },
  {
    question: text("Триадная цветовая схема использует...", "A triadic color scheme uses..."),
    options: [
      text("2 цвета напротив", "2 opposite colors"),
      text("3 равноудалённых цвета", "3 evenly spaced colors"),
      text("4 цвета", "4 colors"),
      text("Оттенки одного цвета", "Shades of one color"),
    ],
    correctIndex: 1,
    explanation: text("Триадная схема: 3 цвета через 120° друг от друга", "Triadic scheme: 3 colors spaced 120° apart"),
    category: "color",
    difficulty: "medium",
  },
  {
    question: text("Что такое orphan в типографике?", "What is an orphan in typography?"),
    options: [
      text("Слово в конце абзаца", "Word at end of paragraph"),
      text("Последняя строка абзаца на новой странице", "Last line of paragraph on new page"),
      text("Первая строка абзаца в конце страницы", "First line of paragraph at page bottom"),
      text("Перенос слова", "Hyphenation"),
    ],
    correctIndex: 2,
    explanation: text(
      "Orphan — первая строка абзаца, оставшаяся одна внизу страницы",
      "An orphan is the first line of a paragraph stranded at the bottom of a page",
    ),
    category: "typography",
    difficulty: "medium",
  },
  {
    question: text("Закон Хика гласит: время реакции зависит от...", "Hick's law says reaction time depends on..."),
    options: [
      text("Размера элементов", "Size of elements"),
      text("Количества вариантов", "Number of choices"),
      text("Контраста", "Contrast"),
      text("Анимации", "Animation"),
    ],
    correctIndex: 1,
    explanation: text(
      "Закон Хика: время решения растёт с количеством вариантов",
      "Hick's law: decision time increases with number of choices",
    ),
    category: "ux",
    difficulty: "medium",
  },
  {
    question: text("Что такое widow в типографике?", "What is a widow in typography?"),
    options: [
      text("Последняя строка абзаца на новой странице", "Last line of paragraph on new page"),
      text("Первая строка абзаца в конце страницы", "First line of paragraph at page bottom"),
      text("Одинокое слово на строке", "Single word on a line"),
      text("Висячая пунктуация", "Hanging punctuation"),
    ],
    correctIndex: 0,
    explanation: text(
      "Widow — последняя строка абзаца, оставшаяся одна в начале новой страницы",
      "A widow is the last line of a paragraph stranded at the top of a new page",
    ),
    category: "typography",
    difficulty: "hard",
  },
  {
    question: text("Формула контраста WCAG?", "WCAG contrast formula?"),
    options: [
      text("(L1+0.05)/(L2+0.05)", "(L1+0.05)/(L2+0.05)"),
      text("L1/L2", "L1/L2"),
      text("L1-L2", "L1-L2"),
      text("(L1-L2)/L1", "(L1-L2)/L1"),
    ],
    correctIndex: 0,
    explanation: text("Контраст = (L1 + 0.05) / (L2 + 0.05)", "Contrast = (L1 + 0.05) / (L2 + 0.05)"),
    category: "accessibility",
    difficulty: "hard",
  },
  {
    question: text("Ёмкость кратковременной памяти по Миллеру?", "Miller's short-term memory capacity?"),
    options: [text("3±1", "3±1"), text("5±2", "5±2"), text("7±2", "7±2"), text("10±3", "10±3")],
    correctIndex: 2,
    explanation: text("Закон Миллера: 7±2 элементов", "Miller's law: 7±2 items"),
    category: "ux",
    difficulty: "hard",
  },
  {
    question: text("Что такое optical margin alignment?", "What is optical margin alignment?"),
    options: [
      text("Выравнивание по оптической оси", "Alignment to optical axis"),
      text("Пунктуация за полем", "Punctuation outside the margin"),
      text("Выравнивание изображений", "Aligning images"),
      text("Выравнивание колонок", "Aligning columns"),
    ],
    correctIndex: 1,
    explanation: text(
      "Вынос пунктуации за край колонки для визуального выравнивания",
      "Hanging punctuation beyond the margin for visual alignment",
    ),
    category: "typography",
    difficulty: "hard",
  },
  {
    question: text("Коэффициент Major Third шкалы?", "Major Third scale ratio?"),
    options: [text("1.125", "1.125"), text("1.2", "1.2"), text("1.25", "1.25"), text("1.333", "1.333")],
    correctIndex: 2,
    explanation: text("Major Third = 1.25 (5:4)", "Major Third = 1.25 (5:4)"),
    category: "typography",
    difficulty: "hard",
  },
  {
    question: text("Что такое метамерия?", "What is metamerism?"),
    options: [
      text("Смешение цветов", "Color mixing"),
      text("Разный цвет при разном свете", "Different color under different light"),
      text("Цветовая слепота", "Color blindness"),
      text("Насыщенность", "Saturation"),
    ],
    correctIndex: 1,
    explanation: text(
      "Метамерия — цвета выглядят одинаково при одном свете и разными при другом",
      "Metamerism is when colors match under one light and differ under another",
    ),
    category: "color",
    difficulty: "hard",
  },
  {
    question: text("Что такое river в типографике?", "What is a river in typography?"),
    options: [
      text("Волнистый текст", "Wavy text"),
      text("Вертикальные белые полосы", "Vertical white gaps"),
      text("Подчёркивание", "Underline"),
      text("Отступ первой строки", "First-line indent"),
    ],
    correctIndex: 1,
    explanation: text(
      "River — случайное выравнивание пробелов создаёт белые вертикальные полосы",
      "Rivers are vertical gaps created by aligned spaces in text",
    ),
    category: "typography",
    difficulty: "hard",
  },
  {
    question: text("Закон Фиттса описывает зависимость от...", "Fitts's law describes dependence on..."),
    options: [
      text("Количества элементов", "Number of elements"),
      text("Расстояния и размера цели", "Distance and target size"),
      text("Контраста", "Contrast"),
      text("Анимации", "Animation"),
    ],
    correctIndex: 1,
    explanation: text(
      "Закон Фиттса: время наведения зависит от расстояния и размера цели",
      "Fitts's law: pointing time depends on distance and target size",
    ),
    category: "ux",
    difficulty: "hard",
  },
  {
    question: text("Что такое line-height в CSS?", "What is line-height in CSS?"),
    options: [
      text("Высота строки", "Line height"),
      text("Толщина шрифта", "Font weight"),
      text("Интервал между буквами", "Letter spacing"),
      text("Отступ абзаца", "Paragraph indent"),
    ],
    correctIndex: 0,
    explanation: text(
      "Line-height определяет вертикальный интервал между строками текста.",
      "Line-height defines vertical spacing between lines of text.",
    ),
    category: "typography",
    difficulty: "easy",
  },
  {
    question: text("Что означает термин 'baseline'?", "What does the term 'baseline' mean?"),
    options: [
      text("Линия верхнего выравнивания", "Top alignment line"),
      text("Линия нижнего выравнивания букв", "Baseline of letters"),
      text("Центральная линия текста", "Center line of text"),
      text("Границы абзаца", "Paragraph boundaries"),
    ],
    correctIndex: 1,
    explanation: text(
      "Baseline — линия, на которой стоят буквы без выносных элементов.",
      "Baseline is the line on which letters without ascenders/descenders sit.",
    ),
    category: "typography",
    difficulty: "easy",
  },
  {
    question: text("Какая модель цвета используется для печати?", "Which color model is used for print?"),
    options: [text("RGB", "RGB"), text("HSL", "HSL"), text("CMYK", "CMYK"), text("LAB", "LAB")],
    correctIndex: 2,
    explanation: text(
      "Для печати используется субтрактивная модель CMYK.",
      "Printing uses the subtractive CMYK model.",
    ),
    category: "color",
    difficulty: "easy",
  },
  {
    question: text("Что такое контраст по светлоте (Lightness)?", "What is lightness contrast?"),
    options: [
      text("Разница в насыщенности", "Difference in saturation"),
      text("Разница в светлоте", "Difference in lightness"),
      text("Разница в оттенке", "Difference in hue"),
      text("Разница в прозрачности", "Difference in transparency"),
    ],
    correctIndex: 1,
    explanation: text(
      "Контраст по светлоте — это отличие по Lightness (L) в HSL.",
      "Lightness contrast is the difference in HSL lightness (L).",
    ),
    category: "color",
    difficulty: "easy",
  },
  {
    question: text(
      "Как называется расстояние между колонками сетки?",
      "What is the space between grid columns called?",
    ),
    options: [
      text("Gutter", "Gutter"),
      text("Kerning", "Kerning"),
      text("Padding", "Padding"),
      text("Baseline", "Baseline"),
    ],
    correctIndex: 0,
    explanation: text("Gutter — межколоночное пространство в сетке.", "A gutter is the space between columns."),
    category: "layout",
    difficulty: "easy",
  },
  {
    question: text("Что такое affordance?", "What is affordance?"),
    options: [
      text("Визуальный шум", "Visual noise"),
      text("Подсказка о действии", "An affordance cue"),
      text("Сетка макета", "Layout grid"),
      text("Ошибка в UI", "UI error"),
    ],
    correctIndex: 1,
    explanation: text(
      "Affordance — свойства объекта, которые подсказывают его использование.",
      "Affordance refers to properties that suggest how an object can be used.",
    ),
    category: "ux",
    difficulty: "easy",
  },
  {
    question: text("Какой минимальный контраст для AA Large?", "What is the minimum contrast for AA Large?"),
    options: [text("7:1", "7:1"), text("4.5:1", "4.5:1"), text("3:1", "3:1"), text("2:1", "2:1")],
    correctIndex: 2,
    explanation: text("AA Large требует 3:1 для крупного текста.", "AA Large requires 3:1 for large text."),
    category: "accessibility",
    difficulty: "easy",
  },
  {
    question: text("Что такое opacity?", "What is opacity?"),
    options: [
      text("Насыщенность", "Saturation"),
      text("Прозрачность", "Transparency"),
      text("Контраст", "Contrast"),
      text("Тон", "Hue"),
    ],
    correctIndex: 1,
    explanation: text("Opacity задаёт степень прозрачности элемента.", "Opacity sets an element's transparency."),
    category: "color",
    difficulty: "easy",
  },
  {
    question: text("Что такое cap height?", "What is cap height?"),
    options: [
      text("Высота строчных", "Lowercase height"),
      text("Высота заглавных букв", "Capital letter height"),
      text("Высота строки", "Line height"),
      text("Высота выносных элементов", "Ascender/descender height"),
    ],
    correctIndex: 1,
    explanation: text("Cap height — высота заглавных букв.", "Cap height is the height of capital letters."),
    category: "typography",
    difficulty: "medium",
  },
  {
    question: text("X-height важна для...", "X-height is important for..."),
    options: [
      text("Определения ширины", "Defining width"),
      text("Читаемости", "Readability"),
      text("Толщины штриха", "Stroke thickness"),
      text("Наклона", "Slant"),
    ],
    correctIndex: 1,
    explanation: text(
      "X-height влияет на читаемость, особенно в малых размерах.",
      "X-height affects readability, especially at small sizes.",
    ),
    category: "typography",
    difficulty: "medium",
  },
  {
    question: text("Тон (hue) измеряется в...", "Hue is measured in..."),
    options: [
      text("процентах", "percent"),
      text("пикселях", "pixels"),
      text("градусах", "degrees"),
      text("канделах", "candelas"),
    ],
    correctIndex: 2,
    explanation: text("Hue измеряется в градусах на цветовом круге.", "Hue is measured in degrees on the color wheel."),
    category: "color",
    difficulty: "medium",
  },
  {
    question: text("Что такое 8pt grid?", "What is an 8pt grid?"),
    options: [
      text("Сетка с шагом 8px", "Grid with 8px step"),
      text("Сетка с шагом 4px", "Grid with 4px step"),
      text("Сетка без шага", "Grid without step"),
      text("Сетка базовых линий", "Baseline grid"),
    ],
    correctIndex: 0,
    explanation: text(
      "8pt grid — система с шагом 8px (или 8pt) для выравнивания.",
      "An 8pt grid uses an 8px (or 8pt) step for alignment.",
    ),
    category: "layout",
    difficulty: "medium",
  },
  {
    question: text("Закон Якоба говорит о...", "Jakob's law is about..."),
    options: [
      text("Привычках пользователей", "User habits"),
      text("Скорости отклика", "Response speed"),
      text("Читаемости", "Readability"),
      text("Цветовой гармонии", "Color harmony"),
    ],
    correctIndex: 0,
    explanation: text(
      "Пользователи проводят большую часть времени на других сайтах и ожидают знакомые паттерны.",
      "Users spend most of their time on other sites and expect familiar patterns.",
    ),
    category: "ux",
    difficulty: "medium",
  },
  {
    question: text("Что такое 'focus ring'?", "What is a focus ring?"),
    options: [
      text("Анимация кнопки", "Button animation"),
      text("Обводка фокуса", "Focus outline"),
      text("Рамка карточки", "Card border"),
      text("Тень", "Shadow"),
    ],
    correctIndex: 1,
    explanation: text(
      "Focus ring — визуальный индикатор фокуса клавиатуры.",
      "A focus ring is the visual indicator of keyboard focus.",
    ),
    category: "accessibility",
    difficulty: "medium",
  },
  {
    question: text("Чем отличается serif от sans-serif?", "How does serif differ from sans-serif?"),
    options: [
      text("Наличием засечек", "Presence of serifs"),
      text("Курсивом", "Italics"),
      text("Только капсом", "All caps only"),
      text("Шириной", "Width"),
    ],
    correctIndex: 0,
    explanation: text("Serif имеет засечки, sans-serif — без засечек.", "Serif has serifs; sans-serif has none."),
    category: "typography",
    difficulty: "medium",
  },
  {
    question: text("Что такое 'color temperature'?", "What is color temperature?"),
    options: [
      text("Температура экрана", "Screen temperature"),
      text("Восприятие тёплых/холодных оттенков", "Perception of warm/cool hues"),
      text("Контраст по яркости", "Luminance contrast"),
      text("Глубина цвета", "Color depth"),
    ],
    correctIndex: 1,
    explanation: text(
      "Температура цвета описывает ощущение тепла/холода оттенка.",
      "Color temperature describes perceived warmth/coolness of a hue.",
    ),
    category: "color",
    difficulty: "medium",
  },
  {
    question: text("Что такое 'gamut'?", "What is gamut?"),
    options: [
      text("Контур", "Outline"),
      text("Диапазон отображаемых цветов", "Range of displayable colors"),
      text("Межбуквенный интервал", "Letter spacing"),
      text("Тень", "Shadow"),
    ],
    correctIndex: 1,
    explanation: text(
      "Gamut — диапазон цветов, который может отображать устройство.",
      "Gamut is the range of colors a device can display.",
    ),
    category: "color",
    difficulty: "hard",
  },
  {
    question: text("WCAG формула относительной яркости использует...", "WCAG relative luminance formula uses..."),
    options: [
      text("Gamma correction", "Gamma correction"),
      text("HSV conversion", "HSV conversion"),
      text("CMYK conversion", "CMYK conversion"),
      text("Blur", "Blur"),
    ],
    correctIndex: 0,
    explanation: text(
      "WCAG учитывает гамма-коррекцию для расчёта яркости.",
      "WCAG accounts for gamma correction when computing luminance.",
    ),
    category: "accessibility",
    difficulty: "hard",
  },
  {
    question: text("Что такое 'modular scale' в типографике?", "What is a modular scale in typography?"),
    options: [
      text("Список шрифтов", "List of fonts"),
      text("Набор пропорциональных размеров", "Set of proportional sizes"),
      text("Расстояние между буквами", "Letter spacing"),
      text("Глубина текста", "Text depth"),
    ],
    correctIndex: 1,
    explanation: text(
      "Modular scale — пропорциональный ряд размеров на основе коэффициента.",
      "A modular scale is a proportional series based on a ratio.",
    ),
    category: "typography",
    difficulty: "hard",
  },
  {
    question: text("Что такое 'visual hierarchy'?", "What is visual hierarchy?"),
    options: [
      text("Расположение слоёв", "Layer order"),
      text("Приоритет внимания через размер/контраст", "Priority of attention via size/contrast"),
      text("Список компонентов", "Component list"),
      text("Порядок сетки", "Grid order"),
    ],
    correctIndex: 1,
    explanation: text(
      "Visual hierarchy управляет вниманием через контраст, размер и композицию.",
      "Visual hierarchy guides attention via contrast, size, and composition.",
    ),
    category: "layout",
    difficulty: "hard",
  },
  {
    question: text("Закон Паркинсона для UX чаще означает...", "In UX, Parkinson's law most often means..."),
    options: [
      text("Растягивание сроков", "Expanding timelines"),
      text("Сокращение кликов", "Fewer clicks"),
      text("Рост контраста", "Higher contrast"),
      text("Снижение шума", "Less noise"),
    ],
    correctIndex: 0,
    explanation: text(
      "Закон Паркинсона — работа заполняет всё выделенное время.",
      "Parkinson's law: work expands to fill the time available.",
    ),
    category: "ux",
    difficulty: "hard",
  },
  {
    question: text("Что такое 'perceptual uniformity' в цвете?", "What is perceptual uniformity in color?"),
    options: [
      text("Равномерное распределение оттенков", "Even distribution of hues"),
      text("Равномерное восприятие различий", "Even perception of differences"),
      text("Одинаковая насыщенность", "Same saturation"),
      text("Одинаковая яркость", "Same brightness"),
    ],
    correctIndex: 1,
    explanation: text(
      "Perceptual uniformity означает, что одинаковые численные шаги воспринимаются одинаковыми.",
      "Perceptual uniformity means equal numeric steps are perceived as equal changes.",
    ),
    category: "color",
    difficulty: "expert",
  },
  {
    question: text("Что такое variable font?", "What is a variable font?"),
    options: [
      text("Шрифт с переменной шириной символов", "Font with variable character widths"),
      text("Шрифт с одним файлом и осями вариаций", "Single font file with variation axes"),
      text("Шрифт без кернинга", "Font without kerning"),
      text("Шрифт только для UI", "UI-only font"),
    ],
    correctIndex: 1,
    explanation: text(
      "Variable fonts содержат оси вариаций (weight, width, slant) в одном файле.",
      "Variable fonts include variation axes (weight, width, slant) in one file.",
    ),
    category: "typography",
    difficulty: "expert",
  },
  {
    question: text("Что такое 'luminance contrast'?", "What is luminance contrast?"),
    options: [
      text("Контраст по насыщенности", "Saturation contrast"),
      text("Контраст по относительной яркости", "Relative luminance contrast"),
      text("Контраст по оттенку", "Hue contrast"),
      text("Контраст по прозрачности", "Transparency contrast"),
    ],
    correctIndex: 1,
    explanation: text(
      "Luminance contrast измеряется по относительной яркости (WCAG).",
      "Luminance contrast is measured by relative luminance (WCAG).",
    ),
    category: "accessibility",
    difficulty: "expert",
  },
  {
    question: text("Что такое 'optical size' в типографике?", "What is optical size in typography?"),
    options: [
      text("Размер в пикселях", "Size in pixels"),
      text("Оптическая корректировка формы под размер", "Optical adjustment of shapes for size"),
      text("Межбуквенный интервал", "Letter spacing"),
      text("Толщина штриха", "Stroke weight"),
    ],
    correctIndex: 1,
    explanation: text(
      "Optical size — настройка форм под разные кегли для читабельности.",
      "Optical size adjusts shapes for different sizes for readability.",
    ),
    category: "typography",
    difficulty: "expert",
  },
  {
    question: text("Закон Теслера говорит о...", "Tesler's law is about..."),
    options: [
      text("Сохранении сложности", "Conservation of complexity"),
      text("Привычках пользователей", "User habits"),
      text("Времени реакции от числа вариантов", "Reaction time vs number of choices"),
      text("Зависимости времени от расстояния и размера цели", "Time vs distance and target size"),
    ],
    correctIndex: 0,
    explanation: text(
      "Закон Теслера: сложность нельзя убрать, её можно только перераспределить.",
      "Tesler's law: complexity cannot be eliminated, only redistributed.",
    ),
    category: "ux",
    difficulty: "expert",
  },
  {
    question: text("Что такое 'simultaneous contrast'?", "What is simultaneous contrast?"),
    options: [
      text("Разный контраст в разных местах", "Different contrast in different areas"),
      text("Изменение восприятия цвета рядом с другим", "Color perception changes next to another color"),
      text("Контраст при движении", "Contrast in motion"),
      text("Контраст при масштабировании", "Contrast when scaling"),
    ],
    correctIndex: 1,
    explanation: text(
      "Simultaneous contrast — восприятие цвета меняется из-за соседних цветов.",
      "Simultaneous contrast is when adjacent colors change perceived color.",
    ),
    category: "color",
    difficulty: "expert",
  },

  {
    question: text("Что возвращает mix(a, b, t) в GLSL?", "What does mix(a, b, t) return in GLSL?"),
    options: [
      text("a * b", "a * b"),
      text("a * (1 - t) + b * t", "a * (1 - t) + b * t"),
      text("min(a, b)", "min(a, b)"),
      text("a + b", "a + b"),
    ],
    correctIndex: 1,
    explanation: text(
      "mix(a, b, t) = a * (1 - t) + b * t — линейная интерполяция.",
      "mix(a, b, t) = a * (1 - t) + b * t — linear interpolation.",
    ),
    category: "shader",
    difficulty: "easy",
  },
  {
    question: text("Что возвращает step(edge, x) в GLSL?", "What does step(edge, x) return in GLSL?"),
    options: [
      text("x, если x > edge", "x, if x > edge"),
      text("0.0, если x < edge, иначе 1.0", "0.0 if x < edge, else 1.0"),
      text("edge * x", "edge * x"),
      text("smoothstep аналог", "smoothstep analog"),
    ],
    correctIndex: 1,
    explanation: text(
      "step(edge, x) — ступенчатая функция: 0 при x < edge, 1 при x >= edge.",
      "step(edge, x) is a step function: 0 when x < edge, 1 when x >= edge.",
    ),
    category: "shader",
    difficulty: "easy",
  },
  {
    question: text("smoothstep(a, b, x) в GLSL — это:", "smoothstep(a, b, x) in GLSL is:"),
    options: [
      text("Линейная интерполяция", "Linear interpolation"),
      text("Hermite интерполяция (S-кривая) между a и b", "Hermite interpolation (S-curve) between a and b"),
      text("Ступенчатая функция", "Step function"),
      text("Синусоидальная волна", "Sine wave"),
    ],
    correctIndex: 1,
    explanation: text(
      "smoothstep — плавный переход через полином 3t² - 2t³ между a и b.",
      "smoothstep is a smooth transition via polynomial 3t² - 2t³ between a and b.",
    ),
    category: "shader",
    difficulty: "medium",
  },
  {
    question: text("gl_Position в vertex shader — это:", "gl_Position in vertex shader is:"),
    options: [
      text("Цвет вершины", "Vertex color"),
      text("Позиция в clip space (vec4)", "Position in clip space (vec4)"),
      text("UV координата", "UV coordinate"),
      text("Нормаль вершины", "Vertex normal"),
    ],
    correctIndex: 1,
    explanation: text(
      "gl_Position — выход vertex shader: позиция вершины в clip space.",
      "gl_Position is the vertex shader output: position in clip space.",
    ),
    category: "shader",
    difficulty: "medium",
  },
  {
    question: text("uniform переменная в GLSL:", "A uniform variable in GLSL:"),
    options: [
      text("Меняется для каждой вершины", "Changes per vertex"),
      text("Одинакова для всех вершин/фрагментов в draw call", "Same for all vertices/fragments in a draw call"),
      text("Локальная переменная", "A local variable"),
      text("Только для fragment shader", "Only for fragment shader"),
    ],
    correctIndex: 1,
    explanation: text(
      "Uniform — переменная, постоянная для всего draw call, задаётся с CPU.",
      "A uniform is constant for the whole draw call, set from the CPU.",
    ),
    category: "shader",
    difficulty: "medium",
  },
  {
    question: text("varying (out/in) переменная в GLSL:", "A varying (out/in) variable in GLSL:"),
    options: [
      text("Константа", "A constant"),
      text("Интерполируется между вершинами для фрагментов", "Interpolated between vertices for fragments"),
      text("Только целочисленная", "Integer only"),
      text("Передаётся с CPU", "Sent from the CPU"),
    ],
    correctIndex: 1,
    explanation: text(
      "varying-переменные интерполируются растеризатором между вершинами.",
      "Varying variables are interpolated by the rasterizer between vertices.",
    ),
    category: "shader",
    difficulty: "medium",
  },
  {
    question: text("Что делает discard в fragment shader?", "What does discard do in a fragment shader?"),
    options: [
      text("Удаляет вершину", "Removes a vertex"),
      text("Отбрасывает текущий фрагмент (не рисует пиксель)", "Discards the current fragment (no pixel drawn)"),
      text("Останавливает шейдер", "Stops the shader"),
      text("Очищает буфер", "Clears the buffer"),
    ],
    correctIndex: 1,
    explanation: text(
      "discard в fragment shader отбрасывает фрагмент — пиксель не записывается.",
      "discard in a fragment shader discards the fragment — no pixel is written.",
    ),
    category: "shader",
    difficulty: "medium",
  },
  {
    question: text("texture2D (texture) в GLSL принимает:", "texture2D (texture) in GLSL takes:"),
    options: [
      text("(sampler, UV координаты)", "(sampler, UV coordinates)"),
      text("(цвет, позицию)", "(color, position)"),
      text("(нормаль, свет)", "(normal, light)"),
      text("(float, float)", "(float, float)"),
    ],
    correctIndex: 0,
    explanation: text(
      "texture2D принимает семплер текстуры и UV координаты для чтения пикселя.",
      "texture2D takes a texture sampler and UV coordinates to read a pixel.",
    ),
    category: "shader",
    difficulty: "medium",
  },
  {
    question: text("Compute Shader используется для:", "A Compute Shader is used for:"),
    options: [
      text("Рисования геометрии", "Drawing geometry"),
      text("Общих вычислений на GPU (не привязан к рендерингу)", "General GPU computation (not tied to rendering)"),
      text("Только освещения", "Lighting only"),
      text("Только частиц", "Particles only"),
    ],
    correctIndex: 1,
    explanation: text(
      "Compute Shader выполняет произвольные параллельные вычисления на GPU.",
      "A Compute Shader runs arbitrary parallel computation on the GPU.",
    ),
    category: "shader",
    difficulty: "hard",
  },
  {
    question: text(
      "SDF (Signed Distance Function) в шейдерах возвращает:",
      "SDF (Signed Distance Function) in shaders returns:",
    ),
    options: [
      text("Цвет", "Color"),
      text(
        "Расстояние до ближайшей поверхности (+ снаружи, − внутри)",
        "Distance to nearest surface (+ outside, − inside)",
      ),
      text("UV координаты", "UV coordinates"),
      text("Нормаль", "Normal"),
    ],
    correctIndex: 1,
    explanation: text(
      "SDF возвращает знаковое расстояние: положительное снаружи, отрицательное внутри.",
      "SDF returns a signed distance: positive outside, negative inside.",
    ),
    category: "shader",
    difficulty: "hard",
  },
  {
    question: text("Что такое Blend Mode 'Screen'?", "What is the 'Screen' blend mode?"),
    options: [
      text("a * b", "a * b"),
      text("1 − (1 − a)(1 − b)", "1 − (1 − a)(1 − b)"),
      text("a + b", "a + b"),
      text("max(a, b)", "max(a, b)"),
    ],
    correctIndex: 1,
    explanation: text(
      "Screen: 1 − (1 − a)(1 − b) — осветляющий режим наложения.",
      "Screen: 1 − (1 − a)(1 − b) — a lightening blend mode.",
    ),
    category: "shader",
    difficulty: "hard",
  },
  {
    question: text("В GLSL, cross(a, b) возвращает:", "In GLSL, cross(a, b) returns:"),
    options: [
      text("Скаляр", "A scalar"),
      text("vec3, перпендикулярный и a, и b", "vec3 perpendicular to both a and b"),
      text("Длину вектора", "Vector length"),
      text("Нормализованный вектор", "A normalized vector"),
    ],
    correctIndex: 1,
    explanation: text(
      "cross(a, b) — векторное произведение, результат перпендикулярен обоим входам.",
      "cross(a, b) — cross product, the result is perpendicular to both inputs.",
    ),
    category: "shader",
    difficulty: "hard",
  },
  {
    question: text("Что такое premultiplied alpha?", "What is premultiplied alpha?"),
    options: [
      text("RGB уже умножены на alpha", "RGB already multiplied by alpha"),
      text("Alpha умножена на RGB дважды", "Alpha multiplied by RGB twice"),
      text("RGB хранит только скрытый цвет", "RGB stores only the hidden color"),
      text("Alpha игнорируется", "Alpha is ignored"),
    ],
    correctIndex: 0,
    explanation: text(
      "В premultiplied alpha каналы RGB уже содержат результат умножения на alpha.",
      "In premultiplied alpha, RGB channels already contain the result of multiplication by alpha.",
    ),
    category: "shader",
    difficulty: "expert",
  },

  {
    question: text("Сколько вершин у куба?", "How many vertices does a cube have?"),
    options: [text("4", "4"), text("6", "6"), text("8", "8"), text("12", "12")],
    correctIndex: 2,
    explanation: text("Куб имеет 8 вершин, 12 рёбер и 6 граней.", "A cube has 8 vertices, 12 edges, and 6 faces."),
    category: "3d",
    difficulty: "easy",
  },
  {
    question: text("Формула Эйлера для замкнутого полиэдра:", "Euler's formula for a closed polyhedron:"),
    options: [
      text("V − E + F = 2", "V − E + F = 2"),
      text("V + E − F = 2", "V + E − F = 2"),
      text("V − E + F = 0", "V − E + F = 0"),
      text("V + E + F = 2", "V + E + F = 2"),
    ],
    correctIndex: 0,
    explanation: text(
      "Формула Эйлера: V − E + F = 2 для любого выпуклого полиэдра.",
      "Euler's formula: V − E + F = 2 for any convex polyhedron.",
    ),
    category: "3d",
    difficulty: "medium",
  },
  {
    question: text(
      "Какой тип меша использует общие вершины между гранями?",
      "Which mesh type shares vertices between faces?",
    ),
    options: [
      text("Triangle Soup", "Triangle Soup"),
      text("Indexed Mesh", "Indexed Mesh"),
      text("Point Cloud", "Point Cloud"),
      text("Voxel Grid", "Voxel Grid"),
    ],
    correctIndex: 1,
    explanation: text(
      "Indexed Mesh использует индексный буфер для повторного использования вершин.",
      "Indexed Mesh uses an index buffer to reuse vertices across faces.",
    ),
    category: "3d",
    difficulty: "medium",
  },
  {
    question: text("Counter-clockwise winding order определяет:", "Counter-clockwise winding order determines:"),
    options: [
      text("Цвет грани", "Face color"),
      text("Направление нормали (front face)", "Normal direction (front face)"),
      text("UV координаты", "UV coordinates"),
      text("Вес вершины", "Vertex weight"),
    ],
    correctIndex: 1,
    explanation: text(
      "Порядок обхода вершин определяет, какая сторона грани лицевая.",
      "Winding order of vertices determines which side of a face is the front.",
    ),
    category: "3d",
    difficulty: "medium",
  },
  {
    question: text(
      "В каком порядке обычно применяются трансформации (TRS)?",
      "What order are transforms usually applied (TRS)?",
    ),
    options: [
      text("Scale → Rotate → Translate", "Scale → Rotate → Translate"),
      text("Translate → Rotate → Scale", "Translate → Rotate → Scale"),
      text("Rotate → Translate → Scale", "Rotate → Translate → Scale"),
      text("Scale → Translate → Rotate", "Scale → Translate → Rotate"),
    ],
    correctIndex: 0,
    explanation: text(
      "Стандартный порядок: Scale, Rotate, Translate (в умножении матриц — справа налево).",
      "Standard order: Scale, Rotate, Translate (in matrix multiplication — right to left).",
    ),
    category: "3d",
    difficulty: "medium",
  },
  {
    question: text("Quaternion (0, 0, 0, 1) представляет:", "Quaternion (0, 0, 0, 1) represents:"),
    options: [
      text("Поворот на 180°", "180° rotation"),
      text("Нулевой поворот (identity)", "No rotation (identity)"),
      text("Поворот на 90° по Y", "90° Y rotation"),
      text("Невалидный кватернион", "Invalid quaternion"),
    ],
    correctIndex: 1,
    explanation: text(
      "Кватернион (x=0, y=0, z=0, w=1) — identity, отсутствие вращения.",
      "Quaternion (x=0, y=0, z=0, w=1) is identity — no rotation.",
    ),
    category: "3d",
    difficulty: "hard",
  },
  {
    question: text(
      "Почему в 3D графике используют 4×4 матрицы, а не 3×3?",
      "Why does 3D graphics use 4×4 matrices instead of 3×3?",
    ),
    options: [
      text("Для хранения цвета", "To store color"),
      text(
        "Чтобы объединить поворот, масштаб и перенос в одну матрицу",
        "To combine rotation, scale, and translation in one matrix",
      ),
      text("Для улучшения производительности", "To improve performance"),
      text("Это требование OpenGL", "It's an OpenGL requirement"),
    ],
    correctIndex: 1,
    explanation: text(
      "Однородные координаты (4×4) позволяют выразить все аффинные трансформации одной матрицей.",
      "Homogeneous coordinates (4×4) let you express all affine transformations in a single matrix.",
    ),
    category: "3d",
    difficulty: "hard",
  },
  {
    question: text(
      "Model Space → World Space → View Space → Clip Space. Какая матрица переводит из World в View?",
      "Model Space → World Space → View Space → Clip Space. Which matrix transforms World to View?",
    ),
    options: [
      text("Model Matrix", "Model Matrix"),
      text("View Matrix", "View Matrix"),
      text("Projection Matrix", "Projection Matrix"),
      text("MVP Matrix", "MVP Matrix"),
    ],
    correctIndex: 1,
    explanation: text(
      "View (Camera) Matrix переводит координаты из мирового пространства в пространство камеры.",
      "The View (Camera) Matrix transforms coordinates from world space to camera space.",
    ),
    category: "3d",
    difficulty: "hard",
  },
  {
    question: text("UV координаты (0.5, 0.5) указывают на:", "UV coordinates (0.5, 0.5) point to:"),
    options: [
      text("Верхний левый угол", "Top left corner"),
      text("Центр текстуры", "Center of the texture"),
      text("Нижний правый угол", "Bottom right corner"),
      text("За пределами текстуры", "Outside the texture"),
    ],
    correctIndex: 1,
    explanation: text(
      "UV (0.5, 0.5) — центр текстуры, где UV от 0 до 1.",
      "UV (0.5, 0.5) is the center of the texture, where UV ranges from 0 to 1.",
    ),
    category: "3d",
    difficulty: "easy",
  },
  {
    question: text("Mipmapping — это:", "Mipmapping is:"),
    options: [
      text("Увеличение текстуры", "Texture magnification"),
      text("Предрассчитанные уменьшенные версии текстуры", "Pre-computed downscaled texture versions"),
      text("Тип фильтрации", "A type of filtering"),
      text("Формат сжатия текстур", "A texture compression format"),
    ],
    correctIndex: 1,
    explanation: text(
      "Mipmaps — заранее созданные уменьшенные копии для производительности и качества.",
      "Mipmaps are pre-generated smaller copies for better performance and quality.",
    ),
    category: "3d",
    difficulty: "easy",
  },
  {
    question: text(
      "Anisotropic filtering улучшает качество текстур:",
      "Anisotropic filtering improves texture quality:",
    ),
    options: [
      text("На близких объектах", "On nearby objects"),
      text("Под острым углом к камере", "At sharp angles to the camera"),
      text("В тени", "In shadows"),
      text("На прозрачных объектах", "On transparent objects"),
    ],
    correctIndex: 1,
    explanation: text(
      "Анизотропная фильтрация улучшает качество текстур при косом обзоре.",
      "Anisotropic filtering improves texture quality at oblique viewing angles.",
    ),
    category: "3d",
    difficulty: "medium",
  },
  {
    question: text("Wrap mode REPEAT — при UV > 1.0:", "Wrap mode REPEAT — when UV > 1.0:"),
    options: [
      text("Растягивает край", "Stretches the edge"),
      text("Повторяет текстуру", "Repeats the texture"),
      text("Показывает чёрный", "Shows black"),
      text("Зеркалит текстуру", "Mirrors the texture"),
    ],
    correctIndex: 1,
    explanation: text(
      "REPEAT тайлит текстуру: UV 1.5 → 0.5, UV 2.0 → 0.0.",
      "REPEAT tiles the texture: UV 1.5 → 0.5, UV 2.0 → 0.0.",
    ),
    category: "3d",
    difficulty: "medium",
  },

  {
    question: text(
      "Metallic = 1.0, Roughness = 0.0 — что это за материал?",
      "Metallic = 1.0, Roughness = 0.0 — what material is this?",
    ),
    options: [
      text("Зеркальный металл (хром)", "Mirror metal (chrome)"),
      text("Матовый пластик", "Matte plastic"),
      text("Дерево", "Wood"),
      text("Стекло", "Glass"),
    ],
    correctIndex: 0,
    explanation: text(
      "Metallic 1.0 + Roughness 0.0 = идеально гладкий металл с зеркальным отражением.",
      "Metallic 1.0 + Roughness 0.0 = perfectly smooth metal with mirror reflection.",
    ),
    category: "3d",
    difficulty: "easy",
  },
  {
    question: text(
      "Какой параметр PBR контролирует размытость отражений?",
      "Which PBR parameter controls reflection blurriness?",
    ),
    options: [
      text("Metallic", "Metallic"),
      text("Roughness", "Roughness"),
      text("Albedo", "Albedo"),
      text("Ambient Occlusion", "Ambient Occlusion"),
    ],
    correctIndex: 1,
    explanation: text(
      "Roughness определяет, насколько размыто отражение на поверхности.",
      "Roughness determines how blurry reflections appear on a surface.",
    ),
    category: "3d",
    difficulty: "easy",
  },
  {
    question: text("F0 (Fresnel at 0°) для диэлектриков обычно:", "F0 (Fresnel at 0°) for dielectrics is usually:"),
    options: [text("0.0", "0.0"), text("0.04", "0.04"), text("0.5", "0.5"), text("1.0", "1.0")],
    correctIndex: 1,
    explanation: text(
      "Стандартное значение F0 для неметаллов около 0.04 (4%).",
      "Standard F0 for non-metals is around 0.04 (4%).",
    ),
    category: "3d",
    difficulty: "hard",
  },
  {
    question: text(
      "Normal Map чаще всего хранит нормали в пространстве:",
      "A Normal Map most commonly stores normals in:",
    ),
    options: [
      text("World Space", "World Space"),
      text("Tangent Space", "Tangent Space"),
      text("Object Space", "Object Space"),
      text("Screen Space", "Screen Space"),
    ],
    correctIndex: 1,
    explanation: text(
      "Tangent Space — наиболее распространённый формат для Normal Map.",
      "Tangent Space is the most common format for Normal Maps.",
    ),
    category: "3d",
    difficulty: "hard",
  },
  {
    question: text(
      "Какой канал в ORM текстуре отвечает за Roughness?",
      "Which channel in an ORM texture stores Roughness?",
    ),
    options: [
      text("Red (R)", "Red (R)"),
      text("Green (G)", "Green (G)"),
      text("Blue (B)", "Blue (B)"),
      text("Alpha (A)", "Alpha (A)"),
    ],
    correctIndex: 1,
    explanation: text(
      "ORM: Occlusion = R, Roughness = G, Metallic = B.",
      "ORM: Occlusion = R, Roughness = G, Metallic = B.",
    ),
    category: "3d",
    difficulty: "hard",
  },
  {
    question: text("Закон сохранения энергии в PBR означает:", "Energy conservation in PBR means:"),
    options: [
      text("Объект не может излучать свет", "An object cannot emit light"),
      text("Отражённый + преломлённый свет ≤ падающего", "Reflected + refracted light ≤ incoming"),
      text("Все материалы одинаково яркие", "All materials are equally bright"),
      text("Свет не теряет энергию", "Light doesn't lose energy"),
    ],
    correctIndex: 1,
    explanation: text(
      "PBR гарантирует: поверхность не отражает больше света, чем получает.",
      "PBR guarantees: a surface doesn't reflect more light than it receives.",
    ),
    category: "3d",
    difficulty: "hard",
  },
  {
    question: text(
      "Index of Refraction (IOR) для стекла приблизительно:",
      "Index of Refraction (IOR) for glass is approximately:",
    ),
    options: [text("1.0", "1.0"), text("1.1", "1.1"), text("1.5", "1.5"), text("2.4", "2.4")],
    correctIndex: 2,
    explanation: text(
      "IOR стекла ≈ 1.5. IOR бриллианта ≈ 2.4, воды ≈ 1.33, воздуха ≈ 1.0.",
      "Glass IOR ≈ 1.5. Diamond IOR ≈ 2.4, water ≈ 1.33, air ≈ 1.0.",
    ),
    category: "3d",
    difficulty: "expert",
  },
  {
    question: text("Что такое GGX (Trowbridge-Reitz)?", "What is GGX (Trowbridge-Reitz)?"),
    options: [
      text("Модель освещения", "A lighting model"),
      text("Функция распределения нормалей (NDF)", "Normal Distribution Function (NDF)"),
      text("Текстурный формат", "A texture format"),
      text("Алгоритм сжатия", "A compression algorithm"),
    ],
    correctIndex: 1,
    explanation: text(
      "GGX — популярная NDF для PBR, определяющая распределение микрограней.",
      "GGX is a popular NDF for PBR that defines the distribution of microfacets.",
    ),
    category: "3d",
    difficulty: "expert",
  },

  {
    question: text("Lambertian (diffuse) освещение зависит от:", "Lambertian (diffuse) lighting depends on:"),
    options: [
      text("Позиции камеры", "Camera position"),
      text("dot(Normal, LightDir)", "dot(Normal, LightDir)"),
      text("UV координат", "UV coordinates"),
      text("Размера объекта", "Object size"),
    ],
    correctIndex: 1,
    explanation: text(
      "Diffuse = max(dot(N, L), 0) — зависит от угла между нормалью и светом.",
      "Diffuse = max(dot(N, L), 0) — depends on the angle between normal and light.",
    ),
    category: "3d",
    difficulty: "medium",
  },
  {
    question: text(
      "Blinn-Phong вместо reflection vector использует:",
      "Blinn-Phong uses instead of the reflection vector:",
    ),
    options: [
      text("Нормаль", "Normal"),
      text("Half vector — H = normalize(L + V)", "Half vector — H = normalize(L + V)"),
      text("Tangent", "Tangent"),
      text("Light direction", "Light direction"),
    ],
    correctIndex: 1,
    explanation: text(
      "Blinn-Phong использует half vector H = normalize(L + V) — быстрее и стабильнее.",
      "Blinn-Phong uses the half vector H = normalize(L + V) — faster and more stable.",
    ),
    category: "3d",
    difficulty: "hard",
  },
  {
    question: text("Point light attenuation обычно использует формулу:", "Point light attenuation usually uses:"),
    options: [text("1/d", "1/d"), text("1/d²", "1/d²"), text("d²", "d²"), text("constant", "constant")],
    correctIndex: 1,
    explanation: text(
      "Физически корректное затухание: пропорционально 1/d² (обратный квадрат).",
      "Physically correct falloff: proportional to 1/d² (inverse square).",
    ),
    category: "3d",
    difficulty: "hard",
  },
  {
    question: text("Shadow mapping хранит:", "Shadow mapping stores:"),
    options: [
      text("Цвет теней", "Shadow color"),
      text("Глубину сцены с точки зрения света", "Scene depth from the light's perspective"),
      text("Нормали поверхности", "Surface normals"),
      text("UV координаты", "UV coordinates"),
    ],
    correctIndex: 1,
    explanation: text(
      "Shadow map — текстура глубины, отрендеренная из позиции источника света.",
      "A shadow map is a depth texture rendered from the light's position.",
    ),
    category: "3d",
    difficulty: "medium",
  },
  {
    question: text("IBL (Image-Based Lighting) использует:", "IBL (Image-Based Lighting) uses:"),
    options: [
      text("Point lights", "Point lights"),
      text("Environment map / cubemap для освещения", "Environment map / cubemap for lighting"),
      text("Shadow maps", "Shadow maps"),
      text("Только ambient", "Only ambient"),
    ],
    correctIndex: 1,
    explanation: text(
      "IBL использует cubemap/HDRI окружения как источник непрямого освещения.",
      "IBL uses an environment cubemap/HDRI as a source of indirect lighting.",
    ),
    category: "3d",
    difficulty: "hard",
  },
  {
    question: text("SSAO расшифровывается как:", "SSAO stands for:"),
    options: [
      text("Screen Space Ambient Occlusion", "Screen Space Ambient Occlusion"),
      text("Scene Space AO", "Scene Space AO"),
      text("Shader System AO", "Shader System AO"),
      text("Surface Shading AO", "Surface Shading AO"),
    ],
    correctIndex: 0,
    explanation: text(
      "SSAO — техника затенения в экранном пространстве для мягких теней в углах.",
      "SSAO — a screen-space technique for soft shadows in corners and crevices.",
    ),
    category: "3d",
    difficulty: "medium",
  },
  {
    question: text(
      "Какой тип света имеет direction, но не position?",
      "What type of light has direction but no position?",
    ),
    options: [
      text("Point Light", "Point Light"),
      text("Spot Light", "Spot Light"),
      text("Directional Light", "Directional Light"),
      text("Area Light", "Area Light"),
    ],
    correctIndex: 2,
    explanation: text(
      "Directional Light (солнце) имеет направление, но бесконечно удалён — позиции нет.",
      "A Directional Light (sun) has direction but is infinitely far — no position.",
    ),
    category: "3d",
    difficulty: "easy",
  },

  {
    question: text("Стандартный порядок rendering pipeline:", "Standard rendering pipeline order:"),
    options: [
      text("Vertex → Rasterization → Fragment → Output", "Vertex → Rasterization → Fragment → Output"),
      text("Fragment → Vertex → Output", "Fragment → Vertex → Output"),
      text("Rasterization → Vertex → Fragment", "Rasterization → Vertex → Fragment"),
      text("Output → Fragment → Vertex", "Output → Fragment → Vertex"),
    ],
    correctIndex: 0,
    explanation: text(
      "Vertex shader → Растеризация → Fragment shader → Вывод (output merge).",
      "Vertex shader → Rasterization → Fragment shader → Output merge.",
    ),
    category: "rendering",
    difficulty: "easy",
  },
  {
    question: text("Z-buffer (depth buffer) решает проблему:", "The Z-buffer (depth buffer) solves:"),
    options: [
      text("Прозрачности", "Transparency"),
      text("Определения видимости (какой фрагмент ближе)", "Visibility (which fragment is closer)"),
      text("Освещения", "Lighting"),
      text("Текстурирования", "Texturing"),
    ],
    correctIndex: 1,
    explanation: text(
      "Z-buffer хранит глубину каждого пикселя для определения видимых поверхностей.",
      "The Z-buffer stores depth per pixel to determine visible surfaces.",
    ),
    category: "rendering",
    difficulty: "easy",
  },
  {
    question: text("Draw call — это:", "A draw call is:"),
    options: [
      text("Вызов шейдера", "A shader call"),
      text("Команда CPU к GPU на отрисовку геометрии", "A CPU command to the GPU to draw geometry"),
      text("Рендер одного пикселя", "Rendering a single pixel"),
      text("Загрузка текстуры", "Loading a texture"),
    ],
    correctIndex: 1,
    explanation: text(
      "Draw call — команда от CPU к GPU: нарисовать набор примитивов с текущим состоянием.",
      "A draw call is a CPU → GPU command: draw a set of primitives with current state.",
    ),
    category: "rendering",
    difficulty: "easy",
  },
  {
    question: text("MSAA в первую очередь уменьшает:", "MSAA primarily reduces:"),
    options: [
      text("Зубчатость рёбер геометрии", "Jagged edges on geometry"),
      text("Бандинг в градиентах", "Banding in gradients"),
      text("Размытие текстур", "Texture blurriness"),
      text("Время компиляции шейдеров", "Shader compile time"),
    ],
    correctIndex: 0,
    explanation: text(
      "MSAA (Multi-Sample Anti-Aliasing) сглаживает рёбра геометрии.",
      "MSAA (Multi-Sample Anti-Aliasing) smooths geometry edges.",
    ),
    category: "rendering",
    difficulty: "medium",
  },
  {
    question: text("Alpha blending для прозрачности требует:", "Alpha blending for transparency requires:"),
    options: [
      text("Произвольный порядок", "Arbitrary order"),
      text("Сортировку от дальних к ближним (back-to-front)", "Sorting far to near (back-to-front)"),
      text("Front-to-back порядок", "Front-to-back order"),
      text("Не требует сортировки", "No sorting needed"),
    ],
    correctIndex: 1,
    explanation: text(
      "Для корректного alpha blending полупрозрачные объекты рисуются от дальних к ближним.",
      "For correct alpha blending, semi-transparent objects are drawn from far to near.",
    ),
    category: "rendering",
    difficulty: "medium",
  },
  {
    question: text("Stencil buffer используется для:", "The stencil buffer is used for:"),
    options: [
      text("Глубины", "Depth"),
      text("Маскирования — порталы, outline, mirror", "Masking — portals, outline, mirror"),
      text("Цвета", "Color"),
      text("Текстур", "Textures"),
    ],
    correctIndex: 1,
    explanation: text(
      "Stencil buffer — маска для попиксельного контроля рендеринга: порталы, обводки, зеркала.",
      "The stencil buffer is a per-pixel mask for rendering control: portals, outlines, mirrors.",
    ),
    category: "rendering",
    difficulty: "medium",
  },
  {
    question: text("Instancing позволяет:", "Instancing allows:"),
    options: [
      text("Улучшить качество", "Improve quality"),
      text("Рисовать много копий меша одним draw call", "Draw many mesh copies in one draw call"),
      text("Сжимать текстуры", "Compress textures"),
      text("Ускорить шейдеры", "Speed up shaders"),
    ],
    correctIndex: 1,
    explanation: text(
      "GPU Instancing рисует тысячи копий одного меша за один draw call.",
      "GPU Instancing draws thousands of copies of one mesh in a single draw call.",
    ),
    category: "rendering",
    difficulty: "medium",
  },
  {
    question: text("Frustum culling отсекает:", "Frustum culling discards:"),
    options: [
      text("Невидимые пиксели", "Invisible pixels"),
      text("Объекты за пределами пирамиды видимости", "Objects outside the view frustum"),
      text("Мелкие объекты", "Small objects"),
      text("Прозрачные объекты", "Transparent objects"),
    ],
    correctIndex: 1,
    explanation: text(
      "Frustum culling не рисует объекты, которые не попадают в поле зрения камеры.",
      "Frustum culling skips objects that fall outside the camera's view frustum.",
    ),
    category: "rendering",
    difficulty: "medium",
  },
  {
    question: text("Early-Z test — это оптимизация, которая:", "Early-Z test is an optimization that:"),
    options: [
      text("Отбрасывает фрагменты ДО fragment shader", "Discards fragments BEFORE fragment shader"),
      text("Ускоряет vertex shader", "Speeds up vertex shader"),
      text("Сжимает depth buffer", "Compresses depth buffer"),
      text("Рассчитывает тени", "Computes shadows"),
    ],
    correctIndex: 0,
    explanation: text(
      "Early-Z отбрасывает фрагменты до запуска fragment shader, экономя вычисления.",
      "Early-Z discards fragments before the fragment shader runs, saving computation.",
    ),
    category: "rendering",
    difficulty: "hard",
  },
  {
    question: text("Что такое Overdraw?", "What is Overdraw?"),
    options: [
      text("Отрисовка пикселя несколько раз", "Drawing a pixel multiple times"),
      text("Ошибка рендеринга", "A rendering error"),
      text("Тип шейдера", "A shader type"),
      text("Метод оптимизации", "An optimization method"),
    ],
    correctIndex: 0,
    explanation: text(
      "Overdraw — лишняя отрисовка пикселей, которые перекрываются другими объектами.",
      "Overdraw is redundant drawing of pixels that get covered by other objects.",
    ),
    category: "rendering",
    difficulty: "hard",
  },
  {
    question: text("Forward Rendering считает освещение:", "Forward Rendering computes lighting:"),
    options: [
      text("В отдельном проходе", "In a separate pass"),
      text("Для каждого объекта при его отрисовке", "For each object during its rendering"),
      text("Только для ближних объектов", "Only for nearby objects"),
      text("На CPU", "On the CPU"),
    ],
    correctIndex: 1,
    explanation: text(
      "Forward Rendering вычисляет освещение прямо при рендере каждого объекта.",
      "Forward Rendering computes lighting directly while rendering each object.",
    ),
    category: "rendering",
    difficulty: "hard",
  },
  {
    question: text("Deferred shading хранит данные сцены в:", "Deferred shading stores scene data in:"),
    options: [
      text("Vertex buffer", "Vertex buffer"),
      text("G-Buffer (несколько render targets)", "G-Buffer (multiple render targets)"),
      text("Shadow map", "Shadow map"),
      text("Один framebuffer", "A single framebuffer"),
    ],
    correctIndex: 1,
    explanation: text(
      "Deferred shading записывает данные (позиция, нормаль, albedo) в G-Buffer, а освещение считает отдельно.",
      "Deferred shading writes data (position, normal, albedo) to a G-Buffer, then computes lighting separately.",
    ),
    category: "rendering",
    difficulty: "expert",
  },

  {
    question: text("Billboard-частица всегда повёрнута:", "A billboard particle is always turned:"),
    options: [
      text("К источнику света", "Toward the light source"),
      text("Лицом к камере", "Facing the camera"),
      text("Вверх", "Upward"),
      text("К ближайшему объекту", "Toward the nearest object"),
    ],
    correctIndex: 1,
    explanation: text(
      "Billboard-частицы всегда развёрнуты к камере для создания иллюзии объёма.",
      "Billboard particles always face the camera to create the illusion of volume.",
    ),
    category: "3d",
    difficulty: "easy",
  },
  {
    question: text("Skinning — это:", "Skinning is:"),
    options: [
      text("Текстурирование", "Texturing"),
      text("Привязка вершин меша к костям скелета", "Binding mesh vertices to skeleton bones"),
      text("Создание UV", "Creating UVs"),
      text("Тип рендеринга", "A rendering type"),
    ],
    correctIndex: 1,
    explanation: text(
      "Skinning — процесс привязки вершин к костям для скелетной анимации.",
      "Skinning is the process of binding vertices to bones for skeletal animation.",
    ),
    category: "3d",
    difficulty: "medium",
  },
  {
    question: text("Обычно максимум bone influences на вершину:", "Usually the maximum bone influences per vertex:"),
    options: [text("1", "1"), text("2", "2"), text("4", "4"), text("Неограничено", "Unlimited")],
    correctIndex: 2,
    explanation: text(
      "Стандарт — 4 bone влияния на вершину (оптимизация GPU).",
      "Standard is 4 bone influences per vertex (GPU optimization).",
    ),
    category: "3d",
    difficulty: "medium",
  },
  {
    question: text("Inverse Kinematics (IK) определяет:", "Inverse Kinematics (IK) determines:"),
    options: [
      text("Позу по ключевым кадрам", "Pose from keyframes"),
      text("Позиции костей по целевой точке конечного звена", "Bone positions from end-effector target"),
      text("Физику тряпичной куклы", "Ragdoll physics"),
      text("Текстурные координаты", "Texture coordinates"),
    ],
    correctIndex: 1,
    explanation: text(
      "IK вычисляет позиции костей цепочки, чтобы конечное звено достигло цели.",
      "IK computes bone positions in a chain so the end effector reaches a target.",
    ),
    category: "3d",
    difficulty: "hard",
  },
  {
    question: text("Dual Quaternion Skinning решает проблему:", "Dual Quaternion Skinning solves the problem of:"),
    options: [
      text("Скорости", "Speed"),
      text("Candy wrapper (скручивание) при Linear Blend Skinning", "Candy wrapper artifacts in Linear Blend Skinning"),
      text("UV искажений", "UV distortions"),
      text("Текстурных артефактов", "Texture artifacts"),
    ],
    correctIndex: 1,
    explanation: text(
      "Dual Quaternion Skinning устраняет артефакт «конфетная обёртка» при скручивании.",
      "Dual Quaternion Skinning eliminates the 'candy wrapper' artifact during twists.",
    ),
    category: "3d",
    difficulty: "expert",
  },

  {
    question: text("Perlin Noise возвращает значения в диапазоне:", "Perlin Noise returns values in the range:"),
    options: [
      text("0 до 1", "0 to 1"),
      text("−1 до 1", "−1 to 1"),
      text("0 до 255", "0 to 255"),
      text("Произвольный", "Arbitrary"),
    ],
    correctIndex: 1,
    explanation: text(
      "Perlin Noise возвращает значения от −1 до 1 (или близко к тому).",
      "Perlin Noise returns values from −1 to 1 (or close to it).",
    ),
    category: "3d",
    difficulty: "medium",
  },
  {
    question: text("Fractal Brownian Motion (fBm) — это:", "Fractal Brownian Motion (fBm) is:"),
    options: [
      text("Тип шума", "A type of noise"),
      text("Суммирование нескольких октав шума", "Summing multiple octaves of noise"),
      text("Алгоритм сортировки", "A sorting algorithm"),
      text("Метод рендеринга", "A rendering method"),
    ],
    correctIndex: 1,
    explanation: text(
      "fBm суммирует шум с разными частотами и амплитудами для создания деталей.",
      "fBm sums noise at different frequencies and amplitudes to create detail.",
    ),
    category: "3d",
    difficulty: "hard",
  },
  {
    question: text("Voronoi (Worley) noise отлично подходит для:", "Voronoi (Worley) noise is great for:"),
    options: [
      text("Облаков", "Clouds"),
      text("Ячеистых структур (камень, кожа)", "Cell-like structures (stone, skin)"),
      text("Линейных паттернов", "Linear patterns"),
      text("Гладких градиентов", "Smooth gradients"),
    ],
    correctIndex: 1,
    explanation: text(
      "Voronoi noise создаёт ячеистые паттерны — камень, кожа, мозаика.",
      "Voronoi noise creates cell-like patterns — stone, skin, mosaic.",
    ),
    category: "3d",
    difficulty: "hard",
  },
  {
    question: text("Texture Atlas — это:", "A Texture Atlas is:"),
    options: [
      text("Тип фильтрации", "A type of filtering"),
      text("Несколько текстур, упакованных в одну большую", "Multiple textures packed into one large texture"),
      text("Формат сжатия", "A compression format"),
      text("3D текстура", "A 3D texture"),
    ],
    correctIndex: 1,
    explanation: text(
      "Texture Atlas — одна большая текстура с несколькими изображениями для уменьшения draw calls.",
      "A Texture Atlas is one large texture with multiple images to reduce draw calls.",
    ),
    category: "3d",
    difficulty: "easy",
  },
  {
    question: text("Channel packing — это:", "Channel packing is:"),
    options: [
      text(
        "Упаковка разных данных в R, G, B, A каналы одной текстуры",
        "Packing different data into R, G, B, A channels of one texture",
      ),
      text("Сжатие каналов", "Channel compression"),
      text("Удаление каналов", "Removing channels"),
      text("Конвертация в grayscale", "Conversion to grayscale"),
    ],
    correctIndex: 0,
    explanation: text(
      "Channel packing экономит семплы: разные данные (AO, Roughness, Metallic) в одной текстуре.",
      "Channel packing saves samples: different data (AO, Roughness, Metallic) in one texture.",
    ),
    category: "3d",
    difficulty: "medium",
  },

  {
    question: text("Что происходит во время растеризации?", "What happens during rasterization?"),
    options: [
      text("Треугольники конвертируются в фрагменты/пиксели", "Triangles are converted into fragments/pixels"),
      text("Вершины трансформируются", "Vertices are transformed"),
      text("Текстуры загружаются в память", "Textures are loaded into memory"),
      text("Шейдеры компилируются", "Shaders are compiled"),
    ],
    correctIndex: 0,
    explanation: text(
      "Растеризация определяет, какие пиксели покрыты каждым примитивом.",
      "Rasterization determines which pixels are covered by each primitive.",
    ),
    category: "rendering",
    difficulty: "medium",
  },
  {
    question: text("Что такое FBO (Framebuffer Object)?", "What is an FBO (Framebuffer Object)?"),
    options: [
      text("Render target, отличный от экрана", "A render target other than the screen"),
      text("Контейнер вершинных данных", "A vertex data container"),
      text("Хэндл шейдера", "A shader handle"),
      text("Механизм таймерства GPU", "A GPU timing mechanism"),
    ],
    correctIndex: 0,
    explanation: text(
      "FBO позволяет рендерить в текстуру для пост-обработки, теней и т.д.",
      "FBOs let you render to textures for post-processing, shadows, etc.",
    ),
    category: "rendering",
    difficulty: "hard",
  },
  {
    question: text("Back-face culling отсекает:", "Back-face culling discards:"),
    options: [
      text("Треугольники, повёрнутые от камеры", "Triangles facing away from the camera"),
      text("Пиксели за пределами viewport", "Pixels outside the viewport"),
      text("Вершины с отрицательным Z", "Vertices with negative Z"),
      text("Несвязанные текстуры", "Unbound textures"),
    ],
    correctIndex: 0,
    explanation: text(
      "Back-face culling пропускает треугольники, нормали которых направлены от камеры.",
      "Back-face culling skips triangles whose normals face away from the camera.",
    ),
    category: "rendering",
    difficulty: "easy",
  },

  {
    question: text(
      "Какое цветовое пространство линейно и подходит для вычислений освещения?",
      "Which color space is linear and suitable for lighting calculations?",
    ),
    options: [text("sRGB", "sRGB"), text("Linear RGB", "Linear RGB"), text("HSL", "HSL"), text("CMYK", "CMYK")],
    correctIndex: 1,
    explanation: text(
      "Linear RGB — линейное пространство, необходимое для корректных вычислений света.",
      "Linear RGB is the linear space needed for correct lighting calculations.",
    ),
    category: "color",
    difficulty: "medium",
  },
  {
    question: text(
      "Gamma correction в sRGB — примерное значение гаммы:",
      "Gamma correction in sRGB — approximate gamma value:",
    ),
    options: [text("1.0", "1.0"), text("1.8", "1.8"), text("2.2", "2.2"), text("3.0", "3.0")],
    correctIndex: 2,
    explanation: text(
      "sRGB использует гамма-коррекцию ≈ 2.2 для соответствия нелинейности восприятия.",
      "sRGB uses gamma ≈ 2.2 to match the nonlinearity of human perception.",
    ),
    category: "color",
    difficulty: "medium",
  },
  {
    question: text(
      "В каком пространстве perceptually uniform расстояние между цветами?",
      "In which space is the distance between colors perceptually uniform?",
    ),
    options: [text("RGB", "RGB"), text("HSV", "HSV"), text("CIELAB", "CIELAB"), text("sRGB", "sRGB")],
    correctIndex: 2,
    explanation: text(
      "CIELAB разработан для перцептуально равномерных расстояний между цветами.",
      "CIELAB is designed for perceptually uniform distances between colors.",
    ),
    category: "color",
    difficulty: "hard",
  },
  {
    question: text("HDR использует значения яркости:", "HDR uses brightness values:"),
    options: [
      text("0–1", "0–1"),
      text("0–255", "0–255"),
      text(">1 (без ограничения)", ">1 (unbounded)"),
      text("0–100", "0–100"),
    ],
    correctIndex: 2,
    explanation: text(
      "HDR (High Dynamic Range) допускает яркость > 1.0 для реалистичного освещения.",
      "HDR (High Dynamic Range) allows brightness > 1.0 for realistic lighting.",
    ),
    category: "color",
    difficulty: "medium",
  },

  {
    question: text("Как сделать текст невыделяемым в CSS?", "How to make text unselectable in CSS?"),
    options: [
      text("user-select: none", "user-select: none"),
      text("pointer-events: none", "pointer-events: none"),
      text("text-select: disabled", "text-select: disabled"),
      text("cursor: no-select", "cursor: no-select"),
    ],
    correctIndex: 0,
    explanation: text(
      "user-select: none запрещает выделение текста мышью.",
      "user-select: none prevents text selection by mouse.",
    ),
    category: "code",
    difficulty: "easy",
  },
  {
    question: text("Как добавить размытие фона в CSS?", "How to add a backdrop blur in CSS?"),
    options: [
      text("backdrop-filter: blur(10px)", "backdrop-filter: blur(10px)"),
      text("background-blur: 10px", "background-blur: 10px"),
      text("filter: background-blur(10px)", "filter: background-blur(10px)"),
      text("blur-filter: 10px", "blur-filter: 10px"),
    ],
    correctIndex: 0,
    explanation: text(
      "backdrop-filter: blur() размывает область за элементом.",
      "backdrop-filter: blur() blurs the area behind an element.",
    ),
    category: "code",
    difficulty: "easy",
  },
  {
    question: text("Как обрезать элемент по кругу в CSS?", "How to clip an element to a circle in CSS?"),
    options: [
      text("clip-path: circle(50%)", "clip-path: circle(50%)"),
      text("border-radius: circle", "border-radius: circle"),
      text("mask: circle(50%)", "mask: circle(50%)"),
      text("overflow: circle", "overflow: circle"),
    ],
    correctIndex: 0,
    explanation: text(
      "clip-path: circle(50%) обрезает элемент по кругу.",
      "clip-path: circle(50%) clips the element to a circle.",
    ),
    category: "code",
    difficulty: "medium",
  },
  {
    question: text(
      "Как создать сетку из 3 равных колонок в CSS Grid?",
      "How to create a 3-column equal grid in CSS Grid?",
    ),
    options: [
      text("grid-template-columns: repeat(3, 1fr)", "grid-template-columns: repeat(3, 1fr)"),
      text("grid-columns: 3", "grid-columns: 3"),
      text("display: grid(3)", "display: grid(3)"),
      text("columns: 3 equal", "columns: 3 equal"),
    ],
    correctIndex: 0,
    explanation: text(
      "repeat(3, 1fr) создаёт 3 колонки равной ширины.",
      "repeat(3, 1fr) creates 3 columns of equal width.",
    ),
    category: "code",
    difficulty: "medium",
  },
  {
    question: text(
      "Основное визуальное отличие perspective от orthographic проекции:",
      "The main visual difference between perspective and orthographic projection:",
    ),
    options: [
      text("Perspective имеет перспективное сокращение", "Perspective has foreshortening"),
      text("Orthographic поддерживает больше треугольников", "Orthographic supports more triangles"),
      text("Perspective использует меньше draw calls", "Perspective uses fewer draw calls"),
      text("Orthographic не может отрисовать 3D", "Orthographic can't render 3D"),
    ],
    correctIndex: 0,
    explanation: text(
      "Perspective делает дальние объекты меньше. Orthographic сохраняет параллельность.",
      "Perspective makes far objects smaller. Orthographic preserves parallel lines.",
    ),
    category: "3d",
    difficulty: "medium",
  },
  {
    question: text(
      "В правосторонней системе координат (OpenGL), +Z направлен:",
      "In a right-handed coordinate system (OpenGL), +Z points:",
    ),
    options: [
      text("К зрителю", "Toward the viewer"),
      text("Вглубь экрана", "Into the screen"),
      text("Вверх", "Upward"),
      text("Вправо", "Right"),
    ],
    correctIndex: 0,
    explanation: text(
      "В правосторонней системе (OpenGL): +X вправо, +Y вверх, +Z к зрителю.",
      "In right-handed (OpenGL): +X right, +Y up, +Z toward the viewer.",
    ),
    category: "3d",
    difficulty: "medium",
  },
  {
    question: text("GPU 'occupancy' — это:", "GPU 'occupancy' refers to:"),
    options: [
      text("Отношение активных warps к максимуму", "Ratio of active warps to maximum"),
      text("Объём используемой VRAM", "Amount of VRAM used"),
      text("Количество draw calls на кадр", "Draw calls per frame"),
      text("Процент активных ядер", "Percentage of active cores"),
    ],
    correctIndex: 0,
    explanation: text(
      "Occupancy — насколько эффективно GPU скрывает задержки памяти параллельными потоками.",
      "Occupancy measures how well the GPU hides memory latency with parallel threads.",
    ),
    category: "rendering",
    difficulty: "expert",
  },
];

interface Challenge {
  prompt: string;
  explanation: string;
  category: QuizQuestion["category"];
  difficulty: Difficulty;
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
    shader: "шейдеры",
    "3d": "3D графика",
    rendering: "рендеринг",
    code: "код",
  },
  en: {
    color: "color",
    typography: "type",
    layout: "layout",
    ux: "UX",
    accessibility: "accessibility",
    shader: "shaders",
    "3d": "3D graphics",
    rendering: "rendering",
    code: "code",
  },
};

const categoryHints: Record<Language, Record<QuizQuestion["category"], string>> = {
  ru: {
    color: "Подумай о цветовом круге, моделях RGB/HSL и гармонии цветов.",
    typography: "Вспомни основы шрифтов, кернинг, трекинг и интерлиньяж.",
    layout: "Подумай о сетках, пропорциях и визуальной иерархии.",
    ux: "Вспомни законы UX: Фиттса, Хика, Миллера, Якоба.",
    accessibility: "Подумай о WCAG, контрасте и доступности.",
    shader: "Вспомни базовые функции GLSL: mix, step, smoothstep, dot, normalize.",
    "3d": "Подумай о вершинах, матрицах, UV-координатах и трансформациях.",
    rendering: "Вспомни рендер-пайплайн, Z-buffer, draw calls и culling.",
    code: "Подумай о CSS свойствах, transform, grid и flexbox.",
  },
  en: {
    color: "Think about the color wheel, RGB/HSL models, and color harmony.",
    typography: "Recall font basics, kerning, tracking, and leading.",
    layout: "Think about grids, proportions, and visual hierarchy.",
    ux: "Recall UX laws: Fitts, Hick, Miller, Jakob.",
    accessibility: "Think about WCAG, contrast, and accessibility.",
    shader: "Recall basic GLSL functions: mix, step, smoothstep, dot, normalize.",
    "3d": "Think about vertices, matrices, UV coordinates, and transforms.",
    rendering: "Recall the render pipeline, Z-buffer, draw calls, and culling.",
    code: "Think about CSS properties, transform, grid, and flexbox.",
  },
};

const generateChallenge = (
  usedQuestions: Set<number>,
  round: number,
  language: Language,
  avoidRepeats: boolean,
): Challenge | null => {
  const difficulty = getDifficulty(round);

  let available = QUIZ_QUESTIONS.map((q, i) => ({ q, i })).filter(
    ({ q, i }) => (!avoidRepeats || !usedQuestions.has(i)) && q.difficulty === difficulty,
  );

  if (available.length === 0) {
    available = QUIZ_QUESTIONS.map((q, i) => ({ q, i })).filter(({ i }) => !avoidRepeats || !usedQuestions.has(i));
    if (available.length === 0) return null;
  }

  const { q: question, i: idx } = pickRandom(available);
  if (avoidRepeats) {
    usedQuestions.add(idx);
  }
  const optionOrder = shuffle(question.options.map((_, optionIndex) => optionIndex));
  const shuffledOptions = optionOrder.map((optionIndex) => localize(question.options[optionIndex], language));
  const correctIndex = optionOrder.indexOf(question.correctIndex);

  return {
    prompt: localize(question.question, language),
    explanation: localize(question.explanation, language),
    category: question.category,
    difficulty: question.difficulty,
    shuffledOptions,
    correctIndex,
  };
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
  const { addScore, incrementStreak, resetStreak, updateStats, addMistake, language, avoidRepeats, setReviewPause } =
    useGameStore();
  const { playCorrect, playWrong } = useSound();

  useEffect(() => {
    setChallenge(generateChallenge(usedQuestions, round, language, avoidRepeats));
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      if (showResult || !challenge) return;

      setSelected(index);
      setShowResult(true);

      const correct = index === challenge.correctIndex;

      if (correct) {
        const pts =
          challenge.difficulty === "expert"
            ? 250
            : challenge.difficulty === "hard"
              ? 200
              : challenge.difficulty === "medium"
                ? 150
                : 100;
        addScore(pts);
        incrementStreak();
        playCorrect();
      } else {
        resetStreak();
        playWrong();
        addMistake({
          question: challenge.prompt,
          userAnswer: challenge.shuffledOptions[index],
          correctAnswer: challenge.shuffledOptions[challenge.correctIndex],
          explanation: challenge.explanation,
        });
      }

      updateStats("quiz", correct);

      const reviewDelay = correct ? 1400 : 2600;
      setReviewPause(reviewDelay);

      setTimeout(() => {
        onAnswer(correct);
        setRound((r) => r + 1);
        setChallenge(generateChallenge(usedQuestions, round + 1, language, avoidRepeats));
        setSelected(null);
        setShowResult(false);
      }, reviewDelay);
    },
    [challenge, showResult, round, usedQuestions, language, avoidRepeats, setReviewPause],
  );

  const handleSkip = useCallback(() => {
    if (!challenge || showResult) return;
    onAnswer(false);
    setRound((r) => r + 1);
    setChallenge(generateChallenge(usedQuestions, round + 1, language, avoidRepeats));
    setSelected(null);
    setShowResult(false);
  }, [challenge, showResult, round, usedQuestions, language, avoidRepeats, onAnswer]);

  useSkipSignal(handleSkip, !showResult);

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
    shader: "bg-purple-500/10 text-purple-400",
    "3d": "bg-cyan-500/10 text-cyan-400",
    rendering: "bg-emerald-500/10 text-emerald-400",
    code: "bg-orange-500/10 text-orange-400",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2 sm:space-y-3">
        <div className="hidden sm:flex justify-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${catColors[challenge.category]}`}>
            {categoryLabels[language][challenge.category]}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-surface-2 text-muted">
            {difficultyDots(challenge.difficulty)}
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">{challenge.prompt}</h2>
        <HintToggle hint={categoryHints[language][challenge.category]} />
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
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-surface-2 rounded-full flex items-center justify-center text-sm font-mono text-muted flex-shrink-0">
                {index + 1}
              </span>
              <span className="flex-1 min-w-0 break-words">{option}</span>
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
          {challenge.explanation}
        </motion.div>
      )}
    </div>
  );
};
