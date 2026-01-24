import { GameId } from "@/types";

export type CustomOptionKind = "text" | "color" | "size" | "weight" | "font" | "palette";
export type CustomPreviewKind = "none" | "single-color" | "dual-color" | "contrast" | "sample" | "image";

export interface CustomQuestionOption {
  label: string;
  color?: string;
  palette?: string[];
  size?: number;
  weight?: number;
  font?: string;
}

export interface CustomQuestionPreview {
  kind: CustomPreviewKind;
  colors?: string[];
  labels?: string[];
  text?: string;
  font?: string;
  imageSrc?: string;
  imageAlt?: string;
  source?: string;
}

export interface CustomQuestion {
  id: string;
  gameId: GameId;
  prompt: string;
  helper: string;
  explanation: string;
  optionKind: CustomOptionKind;
  options: CustomQuestionOption[];
  correctIndex: number;
  preview?: CustomQuestionPreview;
}

export interface CustomQuestionConfig {
  title: string;
  optionKind: CustomOptionKind;
  previewKind: CustomPreviewKind;
  defaultOptions: number;
  optionLabel: string;
  previewLabels?: string[];
  sampleLabel?: string;
}

export const CUSTOM_QUESTION_CONFIG: Record<GameId, CustomQuestionConfig> = {
  "color-compare": {
    title: "Сравни цвета",
    optionKind: "color",
    previewKind: "none",
    defaultOptions: 4,
    optionLabel: "Цвет",
  },
  "font-size": {
    title: "Размер шрифта",
    optionKind: "size",
    previewKind: "none",
    defaultOptions: 4,
    optionLabel: "Размер",
  },
  "guess-font": {
    title: "Угадай шрифт",
    optionKind: "text",
    previewKind: "sample",
    defaultOptions: 4,
    optionLabel: "Шрифт",
    sampleLabel: "Текст образца",
  },
  "color-params": {
    title: "Параметры цвета",
    optionKind: "text",
    previewKind: "dual-color",
    defaultOptions: 4,
    optionLabel: "Ответ",
    previewLabels: ["Цвет A", "Цвет B"],
  },
  "color-temperature": {
    title: "Температура цвета",
    optionKind: "color",
    previewKind: "none",
    defaultOptions: 4,
    optionLabel: "Цвет",
  },
  accessibility: {
    title: "Доступность",
    optionKind: "text",
    previewKind: "contrast",
    defaultOptions: 4,
    optionLabel: "Уровень",
    previewLabels: ["Текст", "Фон"],
  },
  "palette-error": {
    title: "Ошибка в палитре",
    optionKind: "color",
    previewKind: "none",
    defaultOptions: 6,
    optionLabel: "Цвет",
  },
  "size-sequence": {
    title: "Типографская шкала",
    optionKind: "size",
    previewKind: "none",
    defaultOptions: 5,
    optionLabel: "Размер",
  },
  complementary: {
    title: "Дополнительный цвет",
    optionKind: "color",
    previewKind: "none",
    defaultOptions: 4,
    optionLabel: "Цвет",
  },
  "guess-hex": {
    title: "Угадай HEX",
    optionKind: "text",
    previewKind: "single-color",
    defaultOptions: 4,
    optionLabel: "HEX",
    previewLabels: ["Цвет"],
  },
  "guess-params": {
    title: "Угадай HSL",
    optionKind: "text",
    previewKind: "single-color",
    defaultOptions: 4,
    optionLabel: "HSL",
    previewLabels: ["Цвет"],
  },
  quiz: {
    title: "Квиз",
    optionKind: "text",
    previewKind: "none",
    defaultOptions: 4,
    optionLabel: "Ответ",
  },
  "theme-analog": {
    title: "Тёмная/Светлая тема",
    optionKind: "color",
    previewKind: "single-color",
    defaultOptions: 4,
    optionLabel: "Цвет",
    previewLabels: ["Исходный"],
  },
  "font-weight": {
    title: "Толщина шрифта",
    optionKind: "weight",
    previewKind: "none",
    defaultOptions: 4,
    optionLabel: "Вес",
  },
  "artist-guess": {
    title: "Угадай художника",
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: "Художник",
  },
  "style-guess": {
    title: "Угадай стиль",
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: "Стиль",
  },
  "image-size": {
    title: "Размер изображения",
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: "Размер",
  },
  "image-format": {
    title: "Формат кадра",
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: "Формат",
  },
  "color-eye": {
    title: "Цвет на глаз",
    optionKind: "color",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: "Цвет",
  },
  "color-wheel": {
    title: "Цветовой круг",
    optionKind: "color",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: "Цвет",
  },
  "film-type": {
    title: "Тип плёнки",
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: "Плёнка",
  },
  "composition-technique": {
    title: "Композиция",
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: "Приём",
  },
  "focal-length": {
    title: "Фокусное расстояние",
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: "Фокусное",
  },
  "wcag-issue": {
    title: "Проблема WCAG",
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: "Проблема",
  },
  "button-color": {
    title: "Цвет кнопки",
    optionKind: "color",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: "Цвет",
  },
  "font-size-choice": {
    title: "Размер шрифта в UI",
    optionKind: "size",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: "Размер",
  },
  "layout-error": {
    title: "Ошибка в вёрстке",
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: "Ошибка",
  },
  "palette-from-photo": {
    title: "Палитра из фото",
    optionKind: "palette",
    previewKind: "image",
    defaultOptions: 3,
    optionLabel: "Палитра",
  },
};
