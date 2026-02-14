import { GameId } from "@/types";
import { Language } from "@/utils/i18n";

export type CustomOptionKind = "text" | "color" | "size" | "weight" | "font" | "palette";
export type CustomPreviewKind = "none" | "single-color" | "dual-color" | "contrast" | "sample" | "image";

type LocalizedText = { ru: string; en: string };

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

export interface CustomQuestionConfigBase {
  title: LocalizedText;
  optionKind: CustomOptionKind;
  previewKind: CustomPreviewKind;
  defaultOptions: number;
  optionLabel: LocalizedText;
  previewLabels?: LocalizedText[];
  sampleLabel?: LocalizedText;
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

export const CUSTOM_QUESTION_CONFIG: Record<GameId, CustomQuestionConfigBase> = {
  "color-compare": {
    title: { ru: "Сравнить цвета", en: "Compare colors" },
    optionKind: "color",
    previewKind: "none",
    defaultOptions: 4,
    optionLabel: { ru: "Цвет", en: "Color" },
  },
  "font-size": {
    title: { ru: "Размер шрифта", en: "Font size" },
    optionKind: "size",
    previewKind: "none",
    defaultOptions: 4,
    optionLabel: { ru: "Размер", en: "Size" },
  },
  "guess-font": {
    title: { ru: "Угадать шрифт", en: "Guess the font" },
    optionKind: "text",
    previewKind: "sample",
    defaultOptions: 4,
    optionLabel: { ru: "Шрифт", en: "Font" },
    sampleLabel: { ru: "Текст образца", en: "Sample text" },
  },
  "color-params": {
    title: { ru: "Параметры цвета", en: "Color parameters" },
    optionKind: "text",
    previewKind: "dual-color",
    defaultOptions: 4,
    optionLabel: { ru: "Ответ", en: "Answer" },
    previewLabels: [
      { ru: "Цвет A", en: "Color A" },
      { ru: "Цвет B", en: "Color B" },
    ],
  },
  "color-temperature": {
    title: { ru: "Температура цвета", en: "Color temperature" },
    optionKind: "color",
    previewKind: "none",
    defaultOptions: 4,
    optionLabel: { ru: "Цвет", en: "Color" },
  },
  accessibility: {
    title: { ru: "Доступность", en: "Accessibility" },
    optionKind: "text",
    previewKind: "contrast",
    defaultOptions: 4,
    optionLabel: { ru: "Уровень", en: "Level" },
    previewLabels: [
      { ru: "Текст", en: "Text" },
      { ru: "Фон", en: "Background" },
    ],
  },
  "palette-error": {
    title: { ru: "Ошибка в палитре", en: "Palette error" },
    optionKind: "color",
    previewKind: "none",
    defaultOptions: 6,
    optionLabel: { ru: "Цвет", en: "Color" },
  },
  "size-sequence": {
    title: { ru: "Типографская шкала", en: "Type scale" },
    optionKind: "size",
    previewKind: "none",
    defaultOptions: 5,
    optionLabel: { ru: "Размер", en: "Size" },
  },
  complementary: {
    title: { ru: "Дополнительный цвет", en: "Complementary color" },
    optionKind: "color",
    previewKind: "none",
    defaultOptions: 4,
    optionLabel: { ru: "Цвет", en: "Color" },
  },
  "guess-hex": {
    title: { ru: "Угадать HEX", en: "Guess HEX" },
    optionKind: "text",
    previewKind: "single-color",
    defaultOptions: 4,
    optionLabel: { ru: "HEX", en: "HEX" },
    previewLabels: [{ ru: "Цвет", en: "Color" }],
  },
  "guess-params": {
    title: { ru: "Угадать HSL", en: "Guess HSL" },
    optionKind: "text",
    previewKind: "single-color",
    defaultOptions: 4,
    optionLabel: { ru: "HSL", en: "HSL" },
    previewLabels: [{ ru: "Цвет", en: "Color" }],
  },
  quiz: {
    title: { ru: "Квиз", en: "Quiz" },
    optionKind: "text",
    previewKind: "none",
    defaultOptions: 4,
    optionLabel: { ru: "Ответ", en: "Answer" },
  },
  "theme-analog": {
    title: { ru: "Тёмная/Светлая тема", en: "Light/Dark theme" },
    optionKind: "color",
    previewKind: "single-color",
    defaultOptions: 4,
    optionLabel: { ru: "Цвет", en: "Color" },
    previewLabels: [{ ru: "Исходный", en: "Original" }],
  },
  "font-weight": {
    title: { ru: "Толщина шрифта", en: "Font weight" },
    optionKind: "weight",
    previewKind: "none",
    defaultOptions: 4,
    optionLabel: { ru: "Вес", en: "Weight" },
  },
  "artist-guess": {
    title: { ru: "Угадать художника", en: "Guess the artist" },
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: { ru: "Художник", en: "Artist" },
  },
  "style-guess": {
    title: { ru: "Угадать стиль", en: "Guess the style" },
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: { ru: "Стиль", en: "Style" },
  },
  "image-size": {
    title: { ru: "Размер изображения", en: "Image size" },
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: { ru: "Размер", en: "Size" },
  },
  "image-format": {
    title: { ru: "Формат кадра", en: "Aspect ratio" },
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: { ru: "Формат", en: "Format" },
  },
  "color-eye": {
    title: { ru: "Цвет по образцу", en: "Color match" },
    optionKind: "color",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: { ru: "Цвет", en: "Color" },
  },
  "color-wheel": {
    title: { ru: "Цветовой круг", en: "Color wheel" },
    optionKind: "color",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: { ru: "Цвет", en: "Color" },
  },
  "film-type": {
    title: { ru: "Профиль плёнки", en: "Film profile" },
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: { ru: "Профиль", en: "Profile" },
  },
  "composition-technique": {
    title: { ru: "Композиция (схема)", en: "Composition diagram" },
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: { ru: "Приём", en: "Technique" },
  },
  "focal-length": {
    title: { ru: "Фокусное расстояние", en: "Focal length" },
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: { ru: "Фокусное", en: "Focal length" },
  },
  "fov-angle": {
    title: { ru: "Угол обзора", en: "Field of view" },
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: { ru: "Угол", en: "Angle" },
  },
  "wcag-issue": {
    title: { ru: "Проблема WCAG", en: "WCAG issue" },
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: { ru: "Проблема", en: "Issue" },
  },
  "button-color": {
    title: { ru: "Цвет кнопки", en: "Button color" },
    optionKind: "color",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: { ru: "Цвет", en: "Color" },
  },
  "font-size-choice": {
    title: { ru: "Размер шрифта в UI", en: "UI font size" },
    optionKind: "size",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: { ru: "Размер", en: "Size" },
  },
  "layout-error": {
    title: { ru: "Ошибка в вёрстке", en: "Layout error" },
    optionKind: "text",
    previewKind: "image",
    defaultOptions: 4,
    optionLabel: { ru: "Ошибка", en: "Error" },
  },
  "palette-from-photo": {
    title: { ru: "Палитра по образцу", en: "Palette match" },
    optionKind: "palette",
    previewKind: "image",
    defaultOptions: 3,
    optionLabel: { ru: "Палитра", en: "Palette" },
  },
  "palette-lab": {
    title: { ru: "Лаборатория палитр", en: "Palette lab" },
    optionKind: "palette",
    previewKind: "image",
    defaultOptions: 3,
    optionLabel: { ru: "Палитра", en: "Palette" },
  },
  "long-test": {
    title: { ru: "Длинный тест", en: "Long test" },
    optionKind: "text",
    previewKind: "none",
    defaultOptions: 4,
    optionLabel: { ru: "Вариант", en: "Option" },
  },
};

export const getCustomQuestionConfig = (gameId: GameId, language: Language): CustomQuestionConfig => {
  const config = CUSTOM_QUESTION_CONFIG[gameId];
  return {
    ...config,
    title: config.title[language],
    optionLabel: config.optionLabel[language],
    previewLabels: config.previewLabels?.map((label) => label[language]),
    sampleLabel: config.sampleLabel?.[language],
  };
};
