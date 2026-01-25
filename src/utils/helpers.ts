import { Language } from "@/utils/i18n";

export const shuffle = <T>(array: T[]): T[] => {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const randomFloat = (min: number, max: number, decimals = 2): number => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const formatScore = (score: number): string => {
  return score.toLocaleString()
}

export const calculateAccuracy = (correct: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9)
}

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t
}

export const easeOutQuad = (t: number): number => {
  return t * (2 - t)
}

export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export const pickRandom = <T>(array: T[]): T =>
  array[Math.floor(Math.random() * array.length)]

const SAMPLE_TEXTS: Record<Language, string[]> = {
  ru: [
    "Быстрая коричневая лиса",
    "Съешь ещё этих мягких булок",
    "В чащах юга жил бы цитрус",
    "Широкая электрификация",
    "Южно-эфиопский грач увёл мышь",
    "Типографика и дизайн",
    "Дизайн-система",
    "Интерфейс пользователя",
    "Визуальная иерархия",
    "Негативное пространство",
    "Цветовая гармония",
    "Контрастность текста",
    "Баланс элементов",
    "Модульная сетка",
    "Базовая линия",
    "Кернинг и трекинг",
    "Минимализм в UI",
    "Адаптивность",
    "Доступность контента",
    "Консистентность",
    "Микроанимации",
    "Состояния компонентов",
    "Цветовые токены",
    "Информационная плотность",
    "Семантические заголовки",
    "Подписи и лейблы",
    "Контентный ритм",
    "Масштабирование интерфейса",
    "Сетка 12 колонок",
    "Ритм строк",
    "Группировка по смыслу",
    "Точки фокуса",
    "Модульность компонентов",
  ],
  en: [
    "The quick brown fox",
    "Sphinx of black quartz",
    "Pack my box with five dozen liquor jugs",
    "Typography and design",
    "Design system",
    "User interface",
    "Visual hierarchy",
    "Negative space",
    "Color harmony",
    "Text contrast",
    "Element balance",
    "Modular grid",
    "Baseline rhythm",
    "Kerning and tracking",
    "Minimalist UI",
    "Responsive layout",
    "Content accessibility",
    "Consistency",
    "Micro animations",
    "Component states",
    "Design tokens",
    "Component library",
    "Atomic design",
    "Visual rhythm",
    "Grid system",
    "Spacing scale",
    "Font pairing",
    "Information density",
    "Semantic headings",
    "Labels and captions",
    "Content cadence",
    "Interface scaling",
    "12-column grid",
    "Reading rhythm",
    "Grouping by meaning",
    "Focus points",
    "Component modularity",
  ],
};

const DISPLAY_TEXTS: Record<Language, string[]> = {
  ru: ["Аа", "Ag", "Типографика", "Дизайн", "Гротеск", "Пример", "Превью", "Заголовок", "Дисплей", "Текст", "UI Kit"],
  en: ["Aa", "Ag", "Typography", "Design", "Grotesk", "Sample", "Preview", "Headline", "Display", "Text", "UI Kit"],
};

const resolveTextList = (lists: Record<Language, string[]>, language: Language) =>
  lists[language] ?? lists.ru;

export const getRandomText = (language: Language = "ru"): string => pickRandom(resolveTextList(SAMPLE_TEXTS, language));

export const getDisplayText = (language: Language = "ru"): string => pickRandom(resolveTextList(DISPLAY_TEXTS, language));

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1)
