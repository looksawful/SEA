"use client";
import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Swatch } from "@/components/Swatch";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useSound } from "@/hooks/useSound";
import { useGameStore } from "@/store/gameStore";
import { GameId } from "@/types";
import { GAME_ORDER, GAMES } from "@/utils/gameConfig";
import { getFontSizeClass } from "@/utils/fonts";
import { generateId, shuffle } from "@/utils/helpers";
import {
  CUSTOM_QUESTION_CONFIG,
  CustomOptionKind,
  CustomQuestion,
  CustomQuestionConfig,
  CustomQuestionOption,
  CustomQuestionPreview,
} from "@/utils/customQuestions";

const WEIGHT_CLASS: Record<number, string> = {
  300: "font-light",
  400: "font-normal",
  500: "font-medium",
  600: "font-semibold",
  700: "font-bold",
  800: "font-extrabold",
};

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-surface-2 border border-subtle text-sm text-strong focus-visible:outline focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]";

const textAreaClass =
  "w-full px-3 py-2 rounded-lg bg-surface-2 border border-subtle text-sm text-strong min-h-[96px] resize-y focus-visible:outline focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]";

const maxOptions = 6;

const createDefaultOptions = (config: CustomQuestionConfig): CustomQuestionOption[] => {
  const count = config.defaultOptions;

  if (config.optionKind === "color") {
    const palette = ["#1a73e8", "#34a853", "#fbbc04", "#ea4335", "#9334e6", "#00acc1"];
    return Array.from({ length: count }, (_, index) => ({
      label: "",
      color: palette[index % palette.length],
    }));
  }

  if (config.optionKind === "size") {
    const sizes = [14, 16, 18, 20, 24, 28];
    return Array.from({ length: count }, (_, index) => ({
      label: "Aa",
      size: sizes[index % sizes.length],
    }));
  }

  if (config.optionKind === "weight") {
    const weights = [300, 400, 600, 700, 800, 500];
    return Array.from({ length: count }, (_, index) => ({
      label: "Aa",
      weight: weights[index % weights.length],
    }));
  }

  if (config.optionKind === "font") {
    const fonts = ["Manrope", "Space Grotesk", "Georgia", "Times New Roman"];
    return Array.from({ length: count }, (_, index) => ({
      label: "Aa",
      font: fonts[index % fonts.length],
    }));
  }

  if (config.optionKind === "palette") {
    const palettes = [
      ["#1a73e8", "#34a853", "#fbbc04"],
      ["#d93025", "#f9ab00", "#188038"],
      ["#5f6368", "#9aa0a6", "#dadce0"],
      ["#9334e6", "#1a73e8", "#00acc1"],
    ];
    return Array.from({ length: count }, (_, index) => ({
      label: `Палитра ${index + 1}`,
      palette: palettes[index % palettes.length],
    }));
  }

  return Array.from({ length: count }, (_, index) => ({
    label: `${config.optionLabel} ${index + 1}`,
  }));
};

const createDefaultPreview = (config: CustomQuestionConfig): CustomQuestionPreview | undefined => {
  if (config.previewKind === "none") return undefined;

  if (config.previewKind === "sample") {
    return {
      kind: "sample",
      text: "Типографика",
      font: "Manrope",
    };
  }

  if (config.previewKind === "contrast") {
    return {
      kind: "contrast",
      colors: ["#1f1f1f", "#ffffff"],
      labels: config.previewLabels,
      text: "Доступность",
    };
  }

  if (config.previewKind === "dual-color") {
    return {
      kind: "dual-color",
      colors: ["#1a73e8", "#34a853"],
      labels: config.previewLabels,
    };
  }

  if (config.previewKind === "image") {
    return {
      kind: "image",
      imageSrc: "https://commons.wikimedia.org/wiki/Special:FilePath/Example.jpg?width=1200",
      imageAlt: "Пример фото",
      source: "Wikimedia Commons",
    };
  }

  return {
    kind: "single-color",
    colors: ["#1a73e8"],
    labels: config.previewLabels,
  };
};

const formatOptionLabel = (option: CustomQuestionOption, kind: CustomOptionKind): string => {
  if (kind === "color") {
    return option.label || option.color || "Color";
  }
  if (kind === "palette") {
    return option.label || (option.palette ? option.palette.join(", ") : "Palette");
  }
  if (kind === "size") {
    return `${option.label || "Aa"} ${option.size ?? ""}`.trim();
  }
  if (kind === "weight") {
    return `${option.label || "Aa"} ${option.weight ?? ""}`.trim();
  }
  if (kind === "font") {
    return option.label || option.font || "Font";
  }
  return option.label || "Option";
};

const renderPreview = (preview?: CustomQuestionPreview) => {
  if (!preview) return null;

  if (preview.kind === "single-color" || preview.kind === "dual-color") {
    const colors = preview.colors ?? [];
    return (
      <div className="flex gap-3 justify-center">
        {colors.map((color, index) => (
          <div key={`${color}-${index}`} className="flex flex-col items-center gap-2">
            <Swatch color={color} className="w-24 h-16 rounded-xl border border-subtle shadow-card" />
            {preview.labels?.[index] && <span className="text-xs text-soft">{preview.labels[index]}</span>}
          </div>
        ))}
      </div>
    );
  }

  if (preview.kind === "contrast") {
    const [textColor, background] = preview.colors ?? ["#1f1f1f", "#ffffff"];
    return (
      <div className="rounded-2xl p-6 bg-swatch border border-subtle shadow-card flex items-center justify-center">
        <Swatch
          color={background}
          ink={textColor}
          className="w-full min-h-[120px] flex items-center justify-center rounded-xl border border-subtle"
        >
          <span className="text-xl font-medium text-swatch">{preview.text || "Контраст"}</span>
        </Swatch>
      </div>
    );
  }

  if (preview.kind === "sample") {
    return (
      <div className="rounded-2xl p-6 bg-surface border border-subtle shadow-card text-center">
        <span
          className="text-3xl font-sample text-strong"
          style={{ "--sample-font": preview.font || "Manrope" } as CSSProperties}
        >
          {preview.text || "Aa"}
        </span>
        {preview.font && <div className="text-xs text-soft mt-2">{preview.font}</div>}
      </div>
    );
  }

  if (preview.kind === "image") {
    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-2xl border border-subtle shadow-card">
          <img
            src={preview.imageSrc || ""}
            alt={preview.imageAlt || "Preview"}
            className="w-full h-full object-cover max-h-72"
            loading="lazy"
            decoding="async"
          />
        </div>
        {preview.source && (
          <div className="text-xs text-soft">Источник: {preview.source}</div>
        )}
      </div>
    );
  }

  return null;
};

const renderOption = (option: CustomQuestionOption, kind: CustomOptionKind) => {
  if (kind === "color") {
    return (
      <div className="flex flex-col items-center gap-2">
        <Swatch color={option.color || "#ffffff"} className="w-full h-20 rounded-xl border border-subtle shadow-card" />
        {option.label && <span className="text-xs text-soft">{option.label}</span>}
      </div>
    );
  }

  if (kind === "size") {
    const size = option.size ?? 16;
    const displaySize = Math.min(size, 48);
    return (
      <div className="flex flex-col items-center gap-2">
        <span className={`text-strong ${getFontSizeClass(displaySize, "text-[32px]")}`}>
          {option.label || "Aa"}
        </span>
        <span className="text-xs text-soft">{size}px</span>
      </div>
    );
  }

  if (kind === "weight") {
    const weight = option.weight ?? 400;
    const weightClass = WEIGHT_CLASS[weight] || "font-normal";
    return (
      <div className="flex flex-col items-center gap-2">
        <span className={`text-2xl text-strong ${weightClass}`}>{option.label || "Aa"}</span>
        <span className="text-xs text-soft">{weight}</span>
      </div>
    );
  }

  if (kind === "font") {
    return (
      <div className="flex flex-col items-center gap-2">
        <span
          className="text-2xl text-strong font-sample"
          style={{ "--sample-font": option.font || "Manrope" } as CSSProperties}
        >
          {option.label || option.font || "Aa"}
        </span>
        {option.font && <span className="text-xs text-soft">{option.font}</span>}
      </div>
    );
  }

  if (kind === "palette") {
    const palette = option.palette || [];
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1">
          {palette.map((color, index) => (
            <Swatch key={`${color}-${index}`} color={color} className="w-8 h-8 rounded-lg border border-subtle" />
          ))}
        </div>
        {option.label && <span className="text-xs text-soft">{option.label}</span>}
      </div>
    );
  }

  return <span className="text-sm text-strong">{option.label}</span>;
};

interface CustomQuestionGameProps {
  gameId: GameId;
  onAnswer: (correct: boolean) => void;
}

export const CustomQuestionGame = ({ gameId, onAnswer }: CustomQuestionGameProps) => {
  const { customQuestions, addScore, incrementStreak, resetStreak, updateStats, addMistake } = useGameStore();
  const { playCorrect, playWrong } = useSound();
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const questions = customQuestions[gameId] || [];
  const config = CUSTOM_QUESTION_CONFIG[gameId];

  const order = useMemo(() => shuffle(questions.map((_, index) => index)), [questions.length]);
  const currentIndex = order.length > 0 ? order[round % order.length] : -1;
  const question = currentIndex >= 0 ? questions[currentIndex] : null;

  const handleSelect = useCallback(
    (index: number) => {
      if (!question || showResult) return;

      setSelected(index);
      setShowResult(true);

      const correct = index === question.correctIndex;

      if (correct) {
        addScore(GAMES[gameId].pointsPerCorrect);
        incrementStreak();
        playCorrect();
      } else {
        resetStreak();
        playWrong();
        const userOption = question.options[index];
        const correctOption = question.options[question.correctIndex];
        addMistake({
          question: question.prompt,
          userAnswer: formatOptionLabel(userOption, question.optionKind),
          correctAnswer: formatOptionLabel(correctOption, question.optionKind),
          explanation: question.explanation,
          visual:
            question.optionKind === "palette"
              ? {
                  type: "colors",
                  data: {
                    "Correct 1": correctOption.palette?.[0] || "",
                    "Correct 2": correctOption.palette?.[1] || "",
                    "Correct 3": correctOption.palette?.[2] || "",
                    "Selected 1": userOption.palette?.[0] || "",
                    "Selected 2": userOption.palette?.[1] || "",
                    "Selected 3": userOption.palette?.[2] || "",
                  },
                }
              : question.optionKind === "color"
              ? {
                  type: "colors",
                  data: {
                    Correct: correctOption.color || "",
                    Selected: userOption.color || "",
                  },
                }
              : question.preview?.kind === "contrast"
                ? {
                    type: "contrast",
                    data: {
                      Text: question.preview.colors?.[0] || "",
                      Background: question.preview.colors?.[1] || "",
                    },
                  }
                : question.preview?.kind === "single-color" || question.preview?.kind === "dual-color"
                  ? {
                      type: "colors",
                      data: Object.fromEntries(
                        (question.preview.colors || []).map((color, idx) => [
                          question.preview?.labels?.[idx] || `Color ${idx + 1}`,
                          color,
                        ]),
                      ),
                    }
                  : undefined,
        });
      }

      updateStats(gameId, correct);

      setTimeout(() => {
        onAnswer(correct);
        setRound((value) => value + 1);
        setSelected(null);
        setShowResult(false);
      }, 1000);
    },
    [question, showResult, gameId],
  );

  useKeyboard(
    {
      "1": () => question && question.options.length > 0 && handleSelect(0),
      "2": () => question && question.options.length > 1 && handleSelect(1),
      "3": () => question && question.options.length > 2 && handleSelect(2),
      "4": () => question && question.options.length > 3 && handleSelect(3),
      "5": () => question && question.options.length > 4 && handleSelect(4),
      "6": () => question && question.options.length > 5 && handleSelect(5),
      Digit1: () => question && question.options.length > 0 && handleSelect(0),
      Digit2: () => question && question.options.length > 1 && handleSelect(1),
      Digit3: () => question && question.options.length > 2 && handleSelect(2),
      Digit4: () => question && question.options.length > 3 && handleSelect(3),
      Digit5: () => question && question.options.length > 4 && handleSelect(4),
      Digit6: () => question && question.options.length > 5 && handleSelect(5),
    },
    !showResult,
  );

  if (!question) {
    return (
      <div className="text-center space-y-3">
        <div className="text-xl font-medium">Свои вопросы не найдены</div>
        <div className="text-sm text-muted">Добавь вопросы в редакторе, чтобы играть в своём режиме.</div>
      </div>
    );
  }

  const gridClass =
    question.options.length <= 4 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-medium">{question.prompt || config.title}</h2>
        {question.helper && <div className="text-xs text-soft mt-1">{question.helper}</div>}
      </div>

      {renderPreview(question.preview)}

      <div className={`grid gap-3 ${gridClass}`}>
        {question.options.map((option, index) => (
          <Card
            key={`${option.label}-${index}`}
            onClick={() => handleSelect(index)}
            selected={selected === index}
            correct={showResult ? index === question.correctIndex : null}
            padding="lg"
          >
            <div className="flex flex-col items-center gap-2">
              {renderOption(option, question.optionKind)}
              <span className="text-xs text-soft">[{index + 1}]</span>
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
          {question.explanation}
        </motion.div>
      )}
    </div>
  );
};

interface CustomQuestionManagerProps {
  gameId: GameId;
  onClose: () => void;
  variant?: "modal" | "embedded";
  showClose?: boolean;
}

export const CustomQuestionManager = ({
  gameId,
  onClose,
  variant = "modal",
  showClose = true,
}: CustomQuestionManagerProps) => {
  const config = CUSTOM_QUESTION_CONFIG[gameId];
  const {
    customQuestions,
    customMode,
    addCustomQuestion,
    updateCustomQuestion,
    removeCustomQuestion,
    setCustomMode,
  } = useGameStore();
  const existing = customQuestions[gameId] || [];
  const isCustomEnabled = Boolean(customMode[gameId]);

  const [prompt, setPrompt] = useState("");
  const [helper, setHelper] = useState("");
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState<CustomQuestionOption[]>(() => createDefaultOptions(config));
  const [correctIndex, setCorrectIndex] = useState(0);
  const [preview, setPreview] = useState<CustomQuestionPreview | undefined>(() => createDefaultPreview(config));
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setPrompt("");
    setHelper("");
    setExplanation("");
    setOptions(createDefaultOptions(config));
    setCorrectIndex(0);
    setPreview(createDefaultPreview(config));
    setEditingId(null);
  }, [config]);

  useEffect(() => {
    resetForm();
  }, [gameId, resetForm]);

  const canEnableCustom = existing.length > 0;

  const updateOption = (index: number, patch: Partial<CustomQuestionOption>) => {
    setOptions((prev) => prev.map((option, idx) => (idx === index ? { ...option, ...patch } : option)));
  };

  const handleAddOption = () => {
    if (options.length >= maxOptions) return;
    const defaults = createDefaultOptions({ ...config, defaultOptions: 1 });
    setOptions((prev) => [...prev, defaults[0]]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
    setCorrectIndex((prev) => (prev === index ? 0 : prev > index ? prev - 1 : prev));
  };

  const handlePreviewColorChange = (index: number, value: string) => {
    if (!preview) return;
    const colors = [...(preview.colors || [])];
    colors[index] = value;
    setPreview({ ...preview, colors });
  };

  const clonePreview = (current?: CustomQuestionPreview) => {
    if (!current) return current;
    return {
      ...current,
      colors: current.colors ? [...current.colors] : undefined,
      labels: current.labels ? [...current.labels] : undefined,
    };
  };

  const cloneOptions = (current: CustomQuestionOption[]) =>
    current.map((option) => ({
      ...option,
      palette: option.palette ? [...option.palette] : undefined,
    }));

  const startEdit = (question: CustomQuestion) => {
    setEditingId(question.id);
    setPrompt(question.prompt);
    setHelper(question.helper || "");
    setExplanation(question.explanation);
    setOptions(cloneOptions(question.options));
    setCorrectIndex(question.correctIndex);
    setPreview(clonePreview(question.preview) ?? createDefaultPreview(config));
  };

  const handleSubmit = () => {
    if (!prompt.trim() || !explanation.trim()) return;

    if (options.length < 2 || correctIndex >= options.length) return;

    const payload: CustomQuestion = {
      id: editingId ?? generateId(),
      gameId,
      prompt: prompt.trim(),
      helper: helper.trim(),
      explanation: explanation.trim(),
      optionKind: config.optionKind,
      options,
      correctIndex,
      preview,
    };

    if (editingId) {
      updateCustomQuestion(gameId, editingId, payload);
    } else {
      addCustomQuestion(gameId, payload);
    }

    resetForm();
  };

  const previewFields = preview?.kind !== "none" && (
    <div className="space-y-3">
      <div className="text-xs text-muted font-medium">Превью</div>
      {preview?.kind === "sample" && (
        <div className="grid gap-2">
          <input
            className={inputClass}
            placeholder={config.sampleLabel || "Текст образца"}
            value={preview.text || ""}
            onChange={(event) => setPreview({ ...preview, text: event.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Шрифт (например, Manrope)"
            value={preview.font || ""}
            onChange={(event) => setPreview({ ...preview, font: event.target.value })}
          />
        </div>
      )}
      {preview?.kind === "contrast" && (
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className={inputClass}
            type="color"
            value={preview.colors?.[0] || "#1f1f1f"}
            onChange={(event) => handlePreviewColorChange(0, event.target.value)}
          />
          <input
            className={inputClass}
            type="color"
            value={preview.colors?.[1] || "#ffffff"}
            onChange={(event) => handlePreviewColorChange(1, event.target.value)}
          />
          <input
            className={`${inputClass} sm:col-span-2`}
            placeholder="Текст превью"
            value={preview.text || ""}
            onChange={(event) => setPreview({ ...preview, text: event.target.value })}
          />
        </div>
      )}
      {preview?.kind === "single-color" && (
        <div className="grid gap-2">
          <input
            className={inputClass}
            type="color"
            value={preview.colors?.[0] || "#1a73e8"}
            onChange={(event) => handlePreviewColorChange(0, event.target.value)}
          />
        </div>
      )}
      {preview?.kind === "dual-color" && (
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className={inputClass}
            type="color"
            value={preview.colors?.[0] || "#1a73e8"}
            onChange={(event) => handlePreviewColorChange(0, event.target.value)}
          />
          <input
            className={inputClass}
            type="color"
            value={preview.colors?.[1] || "#34a853"}
            onChange={(event) => handlePreviewColorChange(1, event.target.value)}
          />
        </div>
      )}
      {preview?.kind === "image" && (
        <div className="grid gap-2">
          <input
            className={inputClass}
            placeholder="URL изображения"
            value={preview.imageSrc || ""}
            onChange={(event) => setPreview({ ...preview, imageSrc: event.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Alt-текст"
            value={preview.imageAlt || ""}
            onChange={(event) => setPreview({ ...preview, imageAlt: event.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Источник (опционально)"
            value={preview.source || ""}
            onChange={(event) => setPreview({ ...preview, source: event.target.value })}
          />
        </div>
      )}
    </div>
  );

  const optionsFields = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted font-medium">Варианты</div>
        <Button size="sm" variant="ghost" onClick={handleAddOption} disabled={options.length >= maxOptions}>
          + Добавить
        </Button>
      </div>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={`${index}-${option.label}`} className="flex flex-col gap-2 rounded-xl border border-subtle bg-surface-2 p-3">
            <div className="flex items-center justify-between text-xs text-soft">
              <span>Вариант {index + 1}</span>
              <button
                className="text-xs text-muted hover:text-strong"
                onClick={() => handleRemoveOption(index)}
                disabled={options.length <= 2}
              >
                Удалить
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className={inputClass}
                placeholder="Текст варианта"
                value={option.label}
                onChange={(event) => updateOption(index, { label: event.target.value })}
              />
              {config.optionKind === "color" && (
                <input
                  className={inputClass}
                  type="color"
                  value={option.color || "#1a73e8"}
                  onChange={(event) => updateOption(index, { color: event.target.value })}
                />
              )}
              {config.optionKind === "size" && (
                <input
                  className={inputClass}
                  type="number"
                  min={8}
                  max={96}
                  placeholder="Размер"
                  value={option.size ?? ""}
                  onChange={(event) => updateOption(index, { size: Number(event.target.value) })}
                />
              )}
              {config.optionKind === "weight" && (
                <input
                  className={inputClass}
                  type="number"
                  min={100}
                  max={900}
                  step={100}
                  placeholder="Вес"
                  value={option.weight ?? ""}
                  onChange={(event) => updateOption(index, { weight: Number(event.target.value) })}
                />
              )}
              {config.optionKind === "font" && (
                <input
                  className={inputClass}
                  placeholder="Название шрифта"
                  value={option.font || ""}
                  onChange={(event) => updateOption(index, { font: event.target.value })}
                />
              )}
              {config.optionKind === "palette" && (
                <div className="grid gap-2 sm:grid-cols-3 sm:col-span-2">
                  {(option.palette || ["#1a73e8", "#34a853", "#fbbc04"]).map((color, colorIndex) => (
                    <input
                      key={`${index}-${colorIndex}`}
                      className={inputClass}
                      type="color"
                      value={color}
                      onChange={(event) => {
                        const nextPalette = [...(option.palette || [])];
                        nextPalette[colorIndex] = event.target.value;
                        updateOption(index, { palette: nextPalette });
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const optionsComplete = options.every((option) => {
    if (config.optionKind === "color") return Boolean(option.color);
    if (config.optionKind === "palette") return (option.palette || []).filter(Boolean).length >= 3;
    if (config.optionKind === "size") return typeof option.size === "number" && option.size > 0;
    if (config.optionKind === "weight") return typeof option.weight === "number" && option.weight > 0;
    if (config.optionKind === "font") return Boolean(option.font);
    return option.label.trim().length > 0;
  });

  const canSave =
    prompt.trim().length > 0 &&
    explanation.trim().length > 0 &&
    options.length >= 2 &&
    correctIndex >= 0 &&
    correctIndex < options.length &&
    optionsComplete;

  const content = (
    <div className="bg-surface border border-subtle rounded-3xl shadow-card p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold">Свои вопросы: {GAMES[gameId].name}</h2>
          <p className="text-sm text-muted">Создай вопросы, подсказки и объяснения для режима игры.</p>
        </div>
        {showClose && (
          <Button variant="ghost" onClick={onClose}>
            Закрыть
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={isCustomEnabled ? "primary" : "secondary"}
          onClick={() => setCustomMode(gameId, !isCustomEnabled)}
          disabled={!canEnableCustom}
        >
          {isCustomEnabled ? "Свои вопросы включены" : "Включить свои вопросы"}
        </Button>
        {!canEnableCustom && <span className="text-xs text-soft">Добавь хотя бы один вопрос</span>}
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-strong">Список вопросов ({existing.length})</div>
        {existing.length === 0 && <div className="text-sm text-soft">Пока пусто.</div>}
        {existing.length > 0 && (
          <div className="space-y-2">
            {existing.map((item) => (
              <Card key={item.id} className="flex items-center justify-between gap-3" padding="sm">
                <div>
                  <div className="text-sm font-medium text-strong">{item.prompt}</div>
                  <div className="text-xs text-soft">Вариантов: {item.options.length}</div>
                  {editingId === item.id && (
                    <div className="text-xs text-accent mt-1">Редактируется</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>
                    Редактировать
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeCustomQuestion(gameId, item.id)}>
                    Удалить
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-subtle pt-6 space-y-4">
        <div className="text-sm font-medium text-strong">Новый вопрос</div>
        <div className="grid gap-3">
          <input
            className={inputClass}
            placeholder="Текст вопроса"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Подсказка (опционально)"
            value={helper}
            onChange={(event) => setHelper(event.target.value)}
          />
          <textarea
            className={textAreaClass}
            placeholder="Объяснение ошибки (показывается после ответа)"
            value={explanation}
            onChange={(event) => setExplanation(event.target.value)}
          />
        </div>

        {previewFields}

        {optionsFields}

        <div className="grid gap-2 sm:grid-cols-2 items-end">
          <div>
            <label className="text-xs text-muted block mb-1">Правильный ответ</label>
            <select
              className={inputClass}
              value={correctIndex}
              onChange={(event) => setCorrectIndex(Number(event.target.value))}
            >
              {options.map((_, index) => (
                <option key={index} value={index}>
                  Вариант {index + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 sm:justify-self-end">
            {editingId && (
              <Button variant="ghost" onClick={resetForm}>
                Отменить
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={!canSave}>
              {editingId ? "Сохранить изменения" : "Добавить вопрос"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (variant === "embedded") {
    return content;
  }

  return (
    <div className="fixed inset-0 z-30 bg-[color:var(--surface-1-95)] backdrop-blur-sm overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {content}
      </div>
    </div>
  );
};

interface CustomQuestionsModalProps {
  onClose: () => void;
  initialGameId?: GameId;
}

export const CustomQuestionsModal = ({ onClose, initialGameId }: CustomQuestionsModalProps) => {
  const [activeGame, setActiveGame] = useState<GameId>(initialGameId ?? GAME_ORDER[0]);

  useEffect(() => {
    if (!GAME_ORDER.includes(activeGame)) {
      setActiveGame(GAME_ORDER[0]);
    }
  }, [activeGame]);

  return (
    <div className="fixed inset-0 z-30 bg-[color:var(--surface-1-95)] backdrop-blur-sm overflow-y-auto">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="bg-surface border border-subtle rounded-3xl shadow-card p-4 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-semibold">Свои вопросы</h2>
              <p className="text-sm text-muted">Выбери игру и добавь вопросы в одном стиле с базовыми заданиями.</p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              Закрыть
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {GAME_ORDER.map((id) => {
              const GameIcon = GAMES[id].icon;
              const isActive = id === activeGame;
              return (
                <button
                  key={id}
                  onClick={() => setActiveGame(id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors ${
                    isActive
                      ? "bg-accent text-white border-[color:var(--accent)]"
                      : "bg-surface-2 text-muted border-subtle hover:text-strong hover:bg-surface-3"
                  }`}
                >
                  <GameIcon className="text-base" />
                  <span className="truncate">{GAMES[id].name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <CustomQuestionManager
          gameId={activeGame}
          onClose={onClose}
          variant="embedded"
          showClose={false}
        />
      </div>
    </div>
  );
};
