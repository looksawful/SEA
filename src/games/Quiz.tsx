"use client";
import { Card } from "@/components/Card";
import { HintToggle } from "@/components/HintToggle";
import { useNumberKeys } from "@/hooks/useKeyboard";
import { useSkipSignal } from "@/hooks/useSkipSignal";
import { useSound } from "@/hooks/useSound";
import { useGameStore } from "@/store/gameStore";
import { pickRandom, shuffle } from "@/utils/helpers";
import { Difficulty, difficultyDots, getDifficulty } from "@/utils/difficulty";
import { Language, LocalizedText, localize, t } from "@/utils/i18n";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

interface QuizQuestion {
  question: LocalizedText;
  options: LocalizedText[];
  correctIndex: number;
  explanation: LocalizedText;
  category: "color" | "typography" | "layout" | "ux" | "accessibility";
  difficulty: Difficulty;
}

const text = (ru: string, en: string): LocalizedText => ({ ru, en });

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: text("Какой контраст минимально необходим для WCAG AA?", "What is the minimum contrast required for WCAG AA?"),
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
      text("Расстояние между строками", "Spacing between lines"),
      text("Расстояние между буквами", "Spacing between letters"),
      text("Расстояние между словами", "Spacing between words"),
      text("Размер шрифта", "Font size"),
    ],
    correctIndex: 1,
    explanation: text(
      "Кернинг — регулировка расстояния между конкретными парами букв",
      "Kerning is the adjustment of spacing between specific letter pairs",
    ),
    category: "typography",
    difficulty: "easy",
  },
  {
    question: text("Комплементарные цвета находятся на цветовом круге...", "Complementary colors on the color wheel are..."),
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
    question: text("Какой цвет получится при смешении красного и синего в RGB?", "What color results from mixing red and blue in RGB?"),
    options: [
      text("Зелёный", "Green"),
      text("Жёлтый", "Yellow"),
      text("Маджента", "Magenta"),
      text("Циан", "Cyan"),
    ],
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
    options: [text("Times New Roman", "Times New Roman"), text("Georgia", "Georgia"), text("Arial", "Arial"), text("Courier", "Courier")],
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
    options: [text("Similarity", "Similarity"), text("Proximity", "Proximity"), text("Closure", "Closure"), text("Continuity", "Continuity")],
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
    explanation: text(
      "Триадная схема: 3 цвета через 120° друг от друга",
      "Triadic scheme: 3 colors spaced 120° apart",
    ),
    category: "color",
    difficulty: "medium",
  },
  {
    question: text("Что такое orphan в типографике?", "What is an orphan in typography?"),
    options: [
      text("Слово в конце абзаца", "Word at end of paragraph"),
      text("Строка в начале страницы", "Line at the top of a page"),
      text("Строка в конце страницы", "Line at the bottom of a page"),
      text("Перенос слова", "Hyphenation"),
    ],
    correctIndex: 2,
    explanation: text(
      "Orphan — последняя строка абзаца одна на новой странице",
      "An orphan is the last line of a paragraph stranded at the top of a new page",
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
      text("Короткая последняя строка", "Short last line"),
      text("Одинокое слово на строке", "Single word on a line"),
      text("Перенос слова", "Hyphenation"),
      text("Висячая пунктуация", "Hanging punctuation"),
    ],
    correctIndex: 1,
    explanation: text(
      "Widow — одинокое короткое слово на последней строке абзаца",
      "A widow is a single short word left on the last line of a paragraph",
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
    explanation: text("Для печати используется субтрактивная модель CMYK.", "Printing uses the subtractive CMYK model."),
    category: "color",
    difficulty: "easy",
  },
  {
    question: text("Что такое контраст по яркости?", "What is luminance contrast?"),
    options: [
      text("Разница в насыщенности", "Difference in saturation"),
      text("Разница в светлоте", "Difference in lightness"),
      text("Разница в оттенке", "Difference in hue"),
      text("Разница в прозрачности", "Difference in transparency"),
    ],
    correctIndex: 1,
    explanation: text("Контраст по яркости — это отличие по светлоте (L).", "Luminance contrast is the difference in lightness (L)."),
    category: "color",
    difficulty: "easy",
  },
  {
    question: text("Как называется расстояние между колонками сетки?", "What is the space between grid columns called?"),
    options: [text("Gutter", "Gutter"), text("Kerning", "Kerning"), text("Padding", "Padding"), text("Baseline", "Baseline")],
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
    question: text("Что такое x-height важно для...", "X-height is important for..."),
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
    options: [text("процентах", "percent"), text("пикселях", "pixels"), text("градусах", "degrees"), text("канделах", "candelas")],
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
    question: text("Закон Шнайдера говорит о...", "Schneider's law is about..."),
    options: [
      text("Быстродействии мыши", "Mouse performance"),
      text("Группировании сигналов", "Signal grouping"),
      text("Приоритетах задач", "Task priorities"),
      text("Метамерии", "Metamerism"),
    ],
    correctIndex: 2,
    explanation: text(
      "Schneider's Law: больше функций — больше когнитивной нагрузки и ошибки.",
      "Schneider's Law: more functions increase cognitive load and errors.",
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
  },
  en: {
    color: "color",
    typography: "type",
    layout: "layout",
    ux: "UX",
    accessibility: "accessibility",
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
        <HintToggle hint={challenge.explanation} />
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

