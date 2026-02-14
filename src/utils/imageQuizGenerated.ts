import { hslToRgb, rgbToHex } from "@/utils/colors";
import { pickRandom, randomInt, shuffle } from "@/utils/helpers";
import type { LocalizedText } from "@/utils/i18n";
import type { CompositionType } from "@/utils/imageQuizSvg";
import {
  fovForFocalLength,
  makeColorSampleSvg,
  makeCompositionSvg,
  makeFilmChartSvg,
  makeFovSvg,
  makePaletteSvg,
} from "@/utils/imageQuizSvg";
import type { GeneratedImageQuizGameId, ImageQuizOption, ImageQuizQuestion } from "@/utils/imageQuizData";

const text = (ru: string, en: string): LocalizedText => ({ ru, en });

const uid = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const wrapHue = (value: number): number => ((value % 360) + 360) % 360;

const hslHex = (h: number, s: number, l: number): string => {
  const { r, g, b } = hslToRgb(wrapHue(h), Math.min(100, Math.max(0, s)), Math.min(100, Math.max(0, l)));
  return rgbToHex(r, g, b).toUpperCase();
};

const withCorrect = (correct: ImageQuizOption, distractors: ImageQuizOption[]) => {
  const options = shuffle([correct, ...distractors]);
  return { options, correctIndex: options.indexOf(correct) };
};

const pickDistinct = <T>(items: readonly T[], count: number, exclude: readonly T[] = []): T[] => {
  const excluded = new Set(exclude);
  return shuffle(items.filter((item) => !excluded.has(item))).slice(0, count);
};

const makePaletteDistractor = (palette: string[], hueShift: number): string[] => {
  return palette.map((hex, index) => {
    const seed = index * 9;
    const shiftedHue = hueShift + seed;
    const sat = randomInt(52, 86);
    const light = randomInt(32, 74);
    const fallback = hslHex(shiftedHue, sat, light);
    // Keep distribution stable while still deriving from the input order.
    return hex ? hslHex(shiftedHue + index * 6, sat, light) : fallback;
  });
};

const generateColorEyeQuestion = (): ImageQuizQuestion => {
  const hue = randomInt(0, 359);
  const sat = randomInt(58, 88);
  const light = randomInt(34, 68);
  const correctColor = hslHex(hue, sat, light);
  const offsets = pickDistinct([10, 14, 18, 22, 26, 30, -10, -14, -18, -22, -26, -30], 3);
  const distractors = offsets.map((offset) => {
    const color = hslHex(hue + offset, sat + randomInt(-10, 10), light + randomInt(-10, 10));
    return { label: color, color };
  });

  const correctOption: ImageQuizOption = { label: correctColor, color: correctColor };
  const { options, correctIndex } = withCorrect(correctOption, distractors);

  return {
    id: uid("color-eye"),
    prompt: text("Какой цвет точнее совпадает с образцом?", "Which color best matches the sample?"),
    helper: text("Сравнивай оттенок и светлоту одновременно.", "Compare hue and lightness together."),
    explanation: text(
      `Точный оттенок: ${correctColor}.`,
      `The exact target color is ${correctColor}.`,
    ),
    imageSrc: makeColorSampleSvg(correctColor),
    imageAlt: text("Цветовой образец", "Color sample"),
    imageSource: { label: text("Сгенерировано в приложении", "Generated in-app") },
    imageFrameClass: "w-full max-w-2xl aspect-[4/3] bg-surface-2",
    imageClass: "object-contain",
    options,
    correctIndex,
    difficulty: "medium",
  };
};

const FILM_PROFILE_OPTIONS = [
  {
    key: "velvia",
    label: text("Fujifilm Velvia 50", "Fujifilm Velvia 50"),
    explanation: text("Velvia усиливает насыщенность и контраст пейзажей.", "Velvia boosts saturation and landscape contrast."),
  },
  {
    key: "portra",
    label: text("Kodak Portra 400", "Kodak Portra 400"),
    explanation: text("Portra даёт мягкий контраст и естественные тона кожи.", "Portra keeps contrast soft and skin tones natural."),
  },
  {
    key: "gold",
    label: text("Kodak Gold 200", "Kodak Gold 200"),
    explanation: text("Gold склоняется к тёплым тонам и мягкому свету.", "Gold leans warm with a gentle roll-off."),
  },
  {
    key: "pro400h",
    label: text("Fujifilm Pro 400H", "Fujifilm Pro 400H"),
    explanation: text("Pro 400H смягчает насыщенность и добавляет пастельный характер.", "Pro 400H softens saturation with a pastel look."),
  },
  {
    key: "cinestill",
    label: text("Cinestill 800T", "Cinestill 800T"),
    explanation: text("Cinestill 800T добавляет киношный сдвиг и неоновые акценты.", "Cinestill 800T adds a cinematic shift and neon accents."),
  },
  {
    key: "superia",
    label: text("Fujifilm Superia", "Fujifilm Superia"),
    explanation: text("Superia смещает палитру в более прохладно-зелёный диапазон.", "Superia nudges the palette into cooler green tones."),
  },
] as const;

const FILM_BASE_PALETTES = [
  ["#f5c2a7", "#d97706", "#84cc16", "#22c55e", "#0ea5e9", "#475569"],
  ["#38bdf8", "#0ea5e9", "#22c55e", "#84cc16", "#f59e0b", "#334155"],
  ["#f1c27d", "#e3b08d", "#bfa38a", "#9ca3af", "#d97706", "#475569"],
  ["#fbcfe8", "#f9a8d4", "#bfdbfe", "#93c5fd", "#a7f3d0", "#e2e8f0"],
  ["#0f172a", "#0ea5e9", "#a855f7", "#f97316", "#f43f5e", "#f8fafc"],
  ["#14532d", "#166534", "#22c55e", "#84cc16", "#4b5563", "#94a3b8"],
];

const generateFilmTypeQuestion = (): ImageQuizQuestion => {
  const correct = pickRandom([...FILM_PROFILE_OPTIONS]);
  const distractorProfiles = pickDistinct(FILM_PROFILE_OPTIONS, 3, [correct]);
  const correctOption: ImageQuizOption = { label: correct.label };
  const distractors: ImageQuizOption[] = distractorProfiles.map((profile) => ({ label: profile.label }));
  const { options, correctIndex } = withCorrect(correctOption, distractors);

  return {
    id: uid("film-type"),
    prompt: text(
      "Какой плёночный профиль лучше всего соответствует нижнему ряду?",
      "Which film profile best matches the transformed row?",
    ),
    helper: text(
      "Сравнивай насыщенность и контраст между двумя рядами.",
      "Compare saturation and contrast between the two rows.",
    ),
    explanation: correct.explanation,
    imageSrc: makeFilmChartSvg(correct.key, pickRandom(FILM_BASE_PALETTES)),
    imageAlt: text("Сравнение базовой и обработанной цветовой карты", "Comparison of base and transformed color chart"),
    imageSource: { label: text("Сгенерировано в приложении", "Generated in-app") },
    imageFrameClass: "w-full max-w-2xl aspect-[3/2] bg-surface-2",
    imageClass: "object-contain",
    options,
    correctIndex,
    difficulty: "medium",
  };
};

const COMPOSITION_OPTIONS: { type: CompositionType; label: LocalizedText; explanation: LocalizedText }[] = [
  {
    type: "thirds",
    label: text("Правило третей", "Rule of thirds"),
    explanation: text("Ключевой объект размещён на пересечении третей.", "The key subject sits on a thirds intersection."),
  },
  {
    type: "center",
    label: text("Центральная композиция", "Centered composition"),
    explanation: text("Главный объект расположен по центру кадра.", "The main subject is centered in the frame."),
  },
  {
    type: "leading-lines",
    label: text("Ведущие линии", "Leading lines"),
    explanation: text("Линии направляют взгляд к точке фокуса.", "Lines guide the eye toward the focal point."),
  },
  {
    type: "diagonal",
    label: text("Диагональ", "Diagonal composition"),
    explanation: text("Диагональ задаёт динамику и направление.", "A diagonal creates motion and direction."),
  },
  {
    type: "symmetry",
    label: text("Симметрия", "Symmetry"),
    explanation: text("Композиция выстроена вокруг оси симметрии.", "The scene is balanced around a symmetry axis."),
  },
  {
    type: "negative-space",
    label: text("Негативное пространство", "Negative space"),
    explanation: text("Пустое пространство подчёркивает основной объект.", "Empty space emphasizes the subject."),
  },
  {
    type: "framing",
    label: text("Кадр в кадре", "Framing"),
    explanation: text("Внутренние границы рамки выделяют объект.", "Inner frame boundaries isolate the subject."),
  },
  {
    type: "perspective",
    label: text("Перспектива", "Perspective"),
    explanation: text("Линии сходятся в точке, усиливая глубину.", "Converging lines enhance depth perception."),
  },
];

const generateCompositionQuestion = (): ImageQuizQuestion => {
  const correct = pickRandom(COMPOSITION_OPTIONS);
  const distractors = pickDistinct(COMPOSITION_OPTIONS, 3, [correct]).map((item) => ({ label: item.label }));
  const correctOption: ImageQuizOption = { label: correct.label };
  const { options, correctIndex } = withCorrect(correctOption, distractors);

  return {
    id: uid("composition"),
    prompt: text("Какой композиционный приём показан на схеме?", "Which composition technique is shown in the diagram?"),
    helper: text("Оцени направление линий и положение акцента.", "Evaluate line direction and accent placement."),
    explanation: correct.explanation,
    imageSrc: makeCompositionSvg(correct.type),
    imageAlt: text("Схема композиции", "Composition diagram"),
    imageSource: { label: text("Сгенерировано в приложении", "Generated in-app") },
    imageFrameClass: "w-full max-w-2xl aspect-[3/2] bg-surface-2",
    imageClass: "object-contain",
    options,
    correctIndex,
    difficulty: "medium",
  };
};

const FOCAL_LENGTHS = [16, 24, 35, 50, 85, 135, 200];

const generateFocalLengthQuestion = (): ImageQuizQuestion => {
  const correct = pickRandom(FOCAL_LENGTHS);
  const distractorValues = pickDistinct(FOCAL_LENGTHS, 3, [correct]);
  const correctOption: ImageQuizOption = { label: text(`${correct} мм`, `${correct} mm`) };
  const distractors: ImageQuizOption[] = distractorValues.map((value) => ({
    label: text(`${value} мм`, `${value} mm`),
  }));
  const { options, correctIndex } = withCorrect(correctOption, distractors);
  const angle = fovForFocalLength(correct);

  return {
    id: uid("focal-length"),
    prompt: text("Какое фокусное расстояние соответствует этой схеме?", "Which focal length matches this diagram?"),
    helper: text("Чем шире угол, тем меньше фокусное расстояние.", "Wider angle means shorter focal length."),
    explanation: text(
      `Правильный ответ: ${correct} мм (угол обзора около ${angle}°).`,
      `Correct answer: ${correct} mm (field of view about ${angle}deg).`,
    ),
    imageSrc: makeFovSvg(angle),
    imageAlt: text("Схема угла обзора", "Field-of-view diagram"),
    imageSource: { label: text("Сгенерировано в приложении", "Generated in-app") },
    imageFrameClass: "w-full max-w-2xl aspect-[3/2] bg-surface-2",
    imageClass: "object-contain",
    options,
    correctIndex,
    difficulty: "hard",
  };
};

const generatePaletteQuestion = (gameId: "palette-from-photo" | "palette-lab"): ImageQuizQuestion => {
  const baseHue = randomInt(0, 359);
  const correctPalette = [
    hslHex(baseHue, randomInt(62, 84), randomInt(36, 58)),
    hslHex(baseHue + randomInt(18, 42), randomInt(54, 78), randomInt(44, 68)),
    hslHex(baseHue - randomInt(20, 44), randomInt(36, 66), randomInt(52, 78)),
  ];
  const shifts = pickDistinct([32, 56, 96, 124, 180, 212, 248], 3);
  const distractors = shifts.map((shift, index) => ({
    label: text(`Вариант ${index + 1}`, `Option ${index + 1}`),
    palette: makePaletteDistractor(correctPalette, baseHue + shift),
  }));
  const correctOption: ImageQuizOption = {
    label: text("Совпадение", "Match"),
    palette: correctPalette,
  };
  const { options, correctIndex } = withCorrect(correctOption, distractors);

  const prompt =
    gameId === "palette-lab"
      ? text(
          "Какой набор цветов точнее всего совпадает со сценой?",
          "Which palette best matches the generated scene?",
        )
      : text(
          "Выбери палитру, которая совпадает с изображением.",
          "Pick the palette that matches the image.",
        );

  return {
    id: uid(gameId),
    prompt,
    helper: text("Ищи совпадение сразу по трём цветовым полосам.", "Match all three color bands, not just one."),
    explanation: text(
      `Правильная палитра: ${correctPalette.join(", ")}.`,
      `Correct palette: ${correctPalette.join(", ")}.`,
    ),
    imageSrc: makePaletteSvg(correctPalette),
    imageAlt: text("Сгенерированная цветовая сцена", "Generated color scene"),
    imageSource: { label: text("Сгенерировано в приложении", "Generated in-app") },
    imageFrameClass: "w-full max-w-2xl aspect-[3/2] bg-surface-2",
    imageClass: "object-contain",
    options,
    correctIndex,
    difficulty: "medium",
  };
};

const generateFovAngleQuestion = (): ImageQuizQuestion => {
  const focal = pickRandom([18, 24, 28, 35, 50, 70, 85, 135]);
  const angle = fovForFocalLength(focal);
  const distractorFocals = pickDistinct([18, 24, 28, 35, 50, 70, 85, 135], 3, [focal]);
  const distractorAngles = distractorFocals.map((value) => fovForFocalLength(value));
  const correctOption: ImageQuizOption = { label: text(`${angle}°`, `${angle}deg`) };
  const distractors: ImageQuizOption[] = distractorAngles.map((value) => ({
    label: text(`${value}°`, `${value}deg`),
  }));
  const { options, correctIndex } = withCorrect(correctOption, distractors);

  return {
    id: uid("fov-angle"),
    prompt: text("Какой угол обзора показан на схеме?", "Which field-of-view angle is shown?"),
    helper: text("Смотри на раскрытие лучей: чем шире веер, тем больше угол.", "Wider rays mean a larger angle."),
    explanation: text(
      `Правильный угол: около ${angle}° (примерно ${focal} мм).`,
      `Correct angle: about ${angle}deg (roughly ${focal} mm).`,
    ),
    imageSrc: makeFovSvg(angle),
    imageAlt: text("Схема поля зрения", "Field-of-view sketch"),
    imageSource: { label: text("Сгенерировано в приложении", "Generated in-app") },
    imageFrameClass: "w-full max-w-2xl aspect-[3/2] bg-surface-2",
    imageClass: "object-contain",
    options,
    correctIndex,
    difficulty: "medium",
  };
};

export const buildGeneratedImageQuizQuestion = (gameId: GeneratedImageQuizGameId): ImageQuizQuestion => {
  switch (gameId) {
    case "color-eye":
      return generateColorEyeQuestion();
    case "film-type":
      return generateFilmTypeQuestion();
    case "composition-technique":
      return generateCompositionQuestion();
    case "focal-length":
      return generateFocalLengthQuestion();
    case "palette-from-photo":
      return generatePaletteQuestion("palette-from-photo");
    case "palette-lab":
      return generatePaletteQuestion("palette-lab");
    case "fov-angle":
      return generateFovAngleQuestion();
    default:
      return generateColorEyeQuestion();
  }
};
