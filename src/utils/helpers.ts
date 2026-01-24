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

const SAMPLE_TEXTS = [
  'Быстрая коричневая лиса',
  'Съешь ещё этих мягких булок',
  'В чащах юга жил бы цитрус',
  'Широкая электрификация',
  'Южно-эфиопский грач увёл мышь',
  'Типографика и дизайн',
  'Дизайн-система',
  'Интерфейс пользователя',
  'Визуальная иерархия',
  'Негативное пространство',
  'Цветовая гармония',
  'Контрастность текста',
  'Баланс элементов',
  'Модульная сетка',
  'Базовая линия',
  'Кернинг и трекинг',
  'Минимализм в UI',
  'Адаптивность',
  'Доступность контента',
  'Консистентность',
  'Микроанимации',
  'Состояния компонентов',
  'Цветовые токены',
  'Design tokens',
  'Component library',
  'Atomic design',
  'Visual rhythm',
  'Grid system',
  'Spacing scale',
  'Font pairing',
  'Информационная плотность',
  'Семантические заголовки',
  'Подписи и лейблы',
  'Контентный ритм',
  'Масштабирование интерфейса',
  'Сетка 12 колонок',
  'Ритм строк',
  'Группировка по смыслу',
  'Точки фокуса',
  'Модульность компонентов',
]

const DISPLAY_TEXTS = [
  'Аа',
  'Ag',
  'Typography',
  'Design',
  'Grotesk',
  'Sample',
  'Preview',
  'Headline',
  'Display',
  'Заголовок',
  'Текст',
  'UI Kit',
  'Specimen',
  'Axis',
]

export const getRandomText = (): string => pickRandom(SAMPLE_TEXTS)

export const getDisplayText = (): string => pickRandom(DISPLAY_TEXTS)

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1)
