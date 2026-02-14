import { GameId } from "@/types";
import { LocalizedText } from "@/utils/i18n";

const text = (ru: string, en: string): LocalizedText => ({ ru, en });

export interface TheoryBlock {
  title: LocalizedText;
  sections: { heading: LocalizedText; body: LocalizedText }[];
}

export const GAME_THEORY: Partial<Record<GameId, TheoryBlock>> = {
  "color-compare": {
    title: text("Сравнение цветов", "Comparing Colors"),
    sections: [
      {
        heading: text("HSL-модель", "HSL Model"),
        body: text(
          "Цвет в HSL описывается тремя параметрами: H (Hue) — тон на цветовом круге (0–360°), S (Saturation) — насыщенность (0–100%), L (Lightness) — светлота (0–100%). Чем выше S, тем чище цвет; чем ниже — тем ближе к серому.",
          "A color in HSL is described by three parameters: H (Hue) — the hue angle on the color wheel (0–360°), S (Saturation) — saturation (0–100%), L (Lightness) — lightness (0–100%). Higher S means purer color; lower S means closer to gray.",
        ),
      },
      {
        heading: text("Яркость и насыщенность", "Brightness & Saturation"),
        body: text(
          "Более яркий цвет имеет большее значение L. Более насыщенный — большее S. Тёмный цвет — L ближе к 0%. При сравнении двух цветов обращайте внимание на конкретный параметр, который просит задание.",
          "A brighter color has a higher L value. A more saturated one has a higher S. A darker color has L closer to 0%. When comparing two colors, focus on the specific parameter the task asks about.",
        ),
      },
    ],
  },
  "font-size": {
    title: text("Размер шрифта", "Font Size"),
    sections: [
      {
        heading: text("Пиксели и масштаб", "Pixels & Scale"),
        body: text(
          "Размер шрифта в вебе чаще всего задаётся в пикселях (px). Базовый размер текста — 16px. Заголовки обычно 24–48px, мелкий текст — 12–14px. Тренируйте глазомер, запоминая эталонные размеры.",
          "Font size on the web is usually set in pixels (px). The base body text size is 16px. Headings are typically 24–48px, small text is 12–14px. Train your eye by remembering reference sizes.",
        ),
      },
      {
        heading: text("Типографские шкалы", "Type Scales"),
        body: text(
          "Дизайнеры часто используют модульные шкалы (например, 1.25 — Major Third). Каждый следующий размер получается умножением предыдущего на коэффициент. Это создаёт визуальную гармонию.",
          "Designers often use modular scales (e.g. 1.25 — Major Third). Each next size is the previous one multiplied by the ratio. This creates visual harmony.",
        ),
      },
    ],
  },
  "font-weight": {
    title: text("Толщина шрифта", "Font Weight"),
    sections: [
      {
        heading: text("Шкала весов", "Weight Scale"),
        body: text(
          "Вес шрифта задаётся числом от 100 до 900 с шагом 100. 100 — Thin (самый тонкий), 400 — Regular (обычный), 700 — Bold (жирный), 900 — Black (самый жирный). Не все шрифты поддерживают все веса.",
          "Font weight is a number from 100 to 900 in steps of 100. 100 — Thin, 400 — Regular, 700 — Bold, 900 — Black. Not all fonts support every weight.",
        ),
      },
      {
        heading: text("Визуальное различие", "Visual Difference"),
        body: text(
          "Разница между соседними весами (например, 400 и 500) может быть едва заметна. Чем дальше веса друг от друга, тем очевиднее контраст. Сравнивайте толщину штрихов букв.",
          "The difference between adjacent weights (e.g. 400 and 500) can be subtle. The farther apart the weights, the more obvious the contrast. Compare the stroke thickness of letters.",
        ),
      },
    ],
  },
  "guess-font": {
    title: text("Распознавание шрифтов", "Font Recognition"),
    sections: [
      {
        heading: text("Ключевые признаки", "Key Features"),
        body: text(
          "Обращайте внимание на: засечки (serif vs sans-serif), форму букв a, g, e, терминалы штрихов, ширину символов, x-высоту. У каждого шрифта есть уникальные детали.",
          "Look for: serifs (serif vs sans-serif), letterforms of a, g, e, stroke terminals, character width, x-height. Every font has unique details.",
        ),
      },
      {
        heading: text("Популярные шрифты", "Popular Fonts"),
        body: text(
          "Inter — геометрический sans с открытыми формами. Roboto — гуманистический sans от Google. Georgia — классический serif для экранов. Manrope — геометрический sans с округлёнными деталями.",
          "Inter — geometric sans with open shapes. Roboto — humanist sans from Google. Georgia — classic serif for screens. Manrope — geometric sans with rounded details.",
        ),
      },
    ],
  },
  "color-params": {
    title: text("Параметры цвета HSL", "HSL Color Parameters"),
    sections: [
      {
        heading: text("Тон (Hue)", "Hue"),
        body: text(
          "H — это угол на цветовом круге: 0° — красный, 60° — жёлтый, 120° — зелёный, 180° — голубой, 240° — синий, 300° — маджента. Тон определяет «имя» цвета.",
          "H is the angle on the color wheel: 0° — red, 60° — yellow, 120° — green, 180° — cyan, 240° — blue, 300° — magenta. Hue defines the color \"name\".",
        ),
      },
      {
        heading: text("Насыщенность и светлота", "Saturation & Lightness"),
        body: text(
          "S (0–100%) показывает чистоту: 0% — серый, 100% — чистый цвет. L (0–100%) показывает яркость: 0% — чёрный, 50% — чистый цвет, 100% — белый. При анализе цвета разбирайте все три параметра.",
          "S (0–100%) shows purity: 0% — gray, 100% — pure color. L (0–100%) shows brightness: 0% — black, 50% — pure color, 100% — white. When analyzing a color, break it into all three.",
        ),
      },
    ],
  },
  "color-temperature": {
    title: text("Температура цвета", "Color Temperature"),
    sections: [
      {
        heading: text("Тёплые и холодные", "Warm & Cool"),
        body: text(
          "Тёплые оттенки расположены в районе 0–60° и 300–360° (красные, оранжевые, жёлтые). Холодные — 150–270° (голубые, синие, фиолетовые). Зона 60–150° и 270–300° — переходная.",
          "Warm hues are around 0–60° and 300–360° (reds, oranges, yellows). Cool hues are around 150–270° (cyans, blues, purples). The zones 60–150° and 270–300° are transitional.",
        ),
      },
      {
        heading: text("В дизайне", "In Design"),
        body: text(
          "Тёплые цвета воспринимаются как ближе, энергичнее. Холодные — как дальше, спокойнее. Баланс температуры важен для создания настроения интерфейса.",
          "Warm colors feel closer and more energetic. Cool colors feel farther and calmer. Temperature balance is key to setting the mood of an interface.",
        ),
      },
    ],
  },
  accessibility: {
    title: text("Доступность (WCAG)", "Accessibility (WCAG)"),
    sections: [
      {
        heading: text("Контрастность", "Contrast Ratio"),
        body: text(
          "WCAG требует минимальный контраст 4.5:1 для обычного текста (AA) и 7:1 для AAA. Для крупного текста (≥18px bold или ≥24px) — 3:1 (AA). Контраст считается между цветом текста и фона.",
          "WCAG requires a minimum contrast of 4.5:1 for normal text (AA) and 7:1 for AAA. For large text (≥18px bold or ≥24px) — 3:1 (AA). Contrast is measured between text and background.",
        ),
      },
      {
        heading: text("Как оценивать", "How to Evaluate"),
        body: text(
          "Светлый текст на тёмном фоне или наоборот — высокий контраст. Серый текст на белом — низкий. Обращайте внимание на размер шрифта: крупный текст допускает меньший контраст.",
          "Light text on dark background or vice versa — high contrast. Gray text on white — low. Note font size: large text allows lower contrast.",
        ),
      },
    ],
  },
  "palette-error": {
    title: text("Гармония палитр", "Palette Harmony"),
    sections: [
      {
        heading: text("Типы палитр", "Palette Types"),
        body: text(
          "Монохромная — один тон, разная светлота/насыщенность. Аналоговая — соседние тона (±30°). Комплементарная — противоположные (180°). Триадная — три тона через 120°. Тетрадная — четыре через 90°.",
          "Monochromatic — one hue, varying lightness/saturation. Analogous — neighboring hues (±30°). Complementary — opposite (180°). Triadic — three hues 120° apart. Tetradic — four hues 90° apart.",
        ),
      },
      {
        heading: text("Поиск ошибки", "Finding the Error"),
        body: text(
          "Ошибочный цвет не вписывается в схему палитры. Мысленно расположите цвета на круге и найдите тот, чей тон выпадает из закономерности. Обращайте внимание на тон (H), а не только на яркость.",
          "The error color doesn't fit the palette scheme. Mentally place colors on the wheel and find the one whose hue breaks the pattern. Focus on hue (H), not just lightness.",
        ),
      },
    ],
  },
  "size-sequence": {
    title: text("Типографские шкалы", "Type Scales"),
    sections: [
      {
        heading: text("Виды шкал", "Scale Types"),
        body: text(
          "Модульная — каждый размер = предыдущий × коэффициент. Линейная — фиксированный шаг. Фибоначчи — сумма двух предыдущих. Golden Ratio — коэффициент 1.618. Major Third — 1.25. Perfect Fourth — 1.333.",
          "Modular — each size = previous × ratio. Linear — fixed step. Fibonacci — sum of two previous. Golden Ratio — 1.618 multiplier. Major Third — 1.25. Perfect Fourth — 1.333.",
        ),
      },
      {
        heading: text("Поиск ошибки", "Finding the Error"),
        body: text(
          "Сравнивайте шаг между соседними размерами. В правильной шкале пропорции последовательны. Ошибочный элемент нарушает плавность роста или уменьшения размеров.",
          "Compare the step between adjacent sizes. In a correct scale, proportions are consistent. The error element breaks the smooth growth or reduction pattern.",
        ),
      },
    ],
  },
  complementary: {
    title: text("Дополнительные цвета", "Complementary Colors"),
    sections: [
      {
        heading: text("Комплементарные пары", "Complementary Pairs"),
        body: text(
          "Комплементарный цвет — противоположный на цветовом круге (Δ180°). Красный ↔ Голубой (0° ↔ 180°), Жёлтый ↔ Синий (60° ↔ 240°), Зелёный ↔ Маджента (120° ↔ 300°).",
          "A complementary color is the opposite on the wheel (Δ180°). Red ↔ Cyan (0° ↔ 180°), Yellow ↔ Blue (60° ↔ 240°), Green ↔ Magenta (120° ↔ 300°).",
        ),
      },
      {
        heading: text("Сплит-комплемент", "Split-Complementary"),
        body: text(
          "Вместо одного противоположного берут два цвета по бокам от него (±30°). Это даёт контраст, но мягче чистого комплемента.",
          "Instead of one opposite, take two colors flanking it (±30°). This gives contrast but softer than pure complement.",
        ),
      },
    ],
  },
  "guess-hex": {
    title: text("HEX-коды цветов", "HEX Color Codes"),
    sections: [
      {
        heading: text("Структура HEX", "HEX Structure"),
        body: text(
          "HEX-код — #RRGGBB, где каждая пара задаёт интенсивность канала (00–FF). #FF0000 — красный, #00FF00 — зелёный, #0000FF — синий. #000000 — чёрный, #FFFFFF — белый.",
          "HEX code is #RRGGBB, where each pair sets a channel intensity (00–FF). #FF0000 — red, #00FF00 — green, #0000FF — blue. #000000 — black, #FFFFFF — white.",
        ),
      },
      {
        heading: text("Как угадывать", "How to Guess"),
        body: text(
          "Оцените доминирующий канал (R, G или B). Высокие значения во всех каналах = светлый. Равные значения = оттенок серого. Один высокий канал = чистый цвет.",
          "Identify the dominant channel (R, G, or B). High values in all channels = light. Equal values = gray shade. One high channel = pure color.",
        ),
      },
    ],
  },
  "guess-params": {
    title: text("Оценка HSL-параметров", "HSL Parameter Estimation"),
    sections: [
      {
        heading: text("Метод оценки", "Estimation Method"),
        body: text(
          "Сначала определите тон (H): к какой зоне круга ближе цвет? Затем насыщенность (S): яркий и чистый или приглушённый? Наконец светлоту (L): тёмный, средний или светлый?",
          "First identify hue (H): which part of the wheel? Then saturation (S): vivid or muted? Finally lightness (L): dark, medium, or light?",
        ),
      },
      {
        heading: text("Якорные точки", "Anchor Points"),
        body: text(
          "Запомните якоря: чистый красный = H0° S100% L50%. Пастельный = S~40% L~75%. Тёмный насыщенный = S~80% L~25%. Серый = S~0%.",
          "Remember anchors: pure red = H0° S100% L50%. Pastel = S~40% L~75%. Dark saturated = S~80% L~25%. Gray = S~0%.",
        ),
      },
    ],
  },
  quiz: {
    title: text("Теория дизайна", "Design Theory"),
    sections: [
      {
        heading: text("Цвет и типографика", "Color & Typography"),
        body: text(
          "Квиз охватывает теорию цвета (HSL, цветовой круг, гармонии, контраст), типографику (шрифты, кернинг, интерлиньяж, антиквы vs гротески) и основы UX/доступности.",
          "The quiz covers color theory (HSL, color wheel, harmonies, contrast), typography (fonts, kerning, leading, serifs vs sans-serifs) and UX/accessibility basics.",
        ),
      },
      {
        heading: text("Композиция и 3D", "Layout & 3D"),
        body: text(
          "Также включены вопросы по композиции (правило третей, золотое сечение, визуальная иерархия), шейдерам, 3D-графике и рендерингу.",
          "Also includes questions about layout (rule of thirds, golden ratio, visual hierarchy), shaders, 3D graphics, and rendering.",
        ),
      },
    ],
  },
  "theme-analog": {
    title: text("Адаптация под тему", "Theme Adaptation"),
    sections: [
      {
        heading: text("Светлая → Тёмная", "Light → Dark"),
        body: text(
          "При переходе к тёмной теме: инвертируйте светлоту (L), немного снизьте насыщенность (S), сохраните тон (H). Это обеспечивает читаемость на тёмном фоне.",
          "When switching to a dark theme: invert lightness (L), slightly reduce saturation (S), keep hue (H). This ensures readability on a dark background.",
        ),
      },
      {
        heading: text("Тёмная → Светлая", "Dark → Light"),
        body: text(
          "Обратный процесс: инвертируйте L, немного увеличьте S, сохраните H. Цвет должен сохранять узнаваемость бренда при смене темы.",
          "Reverse process: invert L, slightly increase S, keep H. The color should maintain brand recognition across themes.",
        ),
      },
    ],
  },
  "image-size": {
    title: text("Размеры изображений", "Image Dimensions"),
    sections: [
      {
        heading: text("Стандартные размеры", "Standard Sizes"),
        body: text(
          "Распространённые разрешения: 1920×1080 (Full HD), 3840×2160 (4K), 1280×720 (HD). Для веба часто используют ширину 800–1200px. Оценивайте пропорции и соотношение сторон.",
          "Common resolutions: 1920×1080 (Full HD), 3840×2160 (4K), 1280×720 (HD). Web images often use 800–1200px width. Evaluate proportions and aspect ratio.",
        ),
      },
    ],
  },
  "image-format": {
    title: text("Форматы кадра", "Aspect Ratios"),
    sections: [
      {
        heading: text("Популярные соотношения", "Common Ratios"),
        body: text(
          "4:3 — классическое фото/ТВ. 3:2 — стандарт 35mm плёнки. 16:9 — широкоэкранное видео. 1:1 — квадрат (Instagram). 21:9 — ультраширокий кинемотограф.",
          "4:3 — classic photo/TV. 3:2 — 35mm film standard. 16:9 — widescreen video. 1:1 — square (Instagram). 21:9 — ultrawide cinema.",
        ),
      },
      {
        heading: text("Как определять", "How to Identify"),
        body: text(
          "Сравните ширину и высоту кадра. Если ширина лишь немного больше высоты — ближе к 4:3. Сильно вытянут — 16:9 или шире. Почти квадрат — 1:1 или 5:4.",
          "Compare frame width to height. If width is slightly more than height — closer to 4:3. Very wide — 16:9 or wider. Almost square — 1:1 or 5:4.",
        ),
      },
    ],
  },
  "color-eye": {
    title: text("Подбор цвета по образцу", "Color Matching"),
    sections: [
      {
        heading: text("Метод подбора", "Matching Method"),
        body: text(
          "Сначала определите тон (тёплый/холодный), затем насыщенность (яркий/приглушённый), наконец светлоту. Сравнивайте параметры по отдельности, не пытайтесь оценить цвет целиком.",
          "First identify hue (warm/cool), then saturation (vivid/muted), then lightness. Compare parameters one at a time rather than the whole color at once.",
        ),
      },
    ],
  },
  "color-wheel": {
    title: text("Цветовой круг", "Color Wheel"),
    sections: [
      {
        heading: text("Структура круга", "Wheel Structure"),
        body: text(
          "Цветовой круг разделён на 360°. Основные цвета: красный (0°), жёлтый (60°), зелёный (120°), голубой (180°), синий (240°), маджента (300°). Аналоговые цвета — соседние (±30°), комплементарные — противоположные (180°).",
          "The color wheel spans 360°. Primary hues: red (0°), yellow (60°), green (120°), cyan (180°), blue (240°), magenta (300°). Analogous colors are neighbors (±30°), complementary are opposite (180°).",
        ),
      },
    ],
  },
  "film-type": {
    title: text("Профили плёнки", "Film Profiles"),
    sections: [
      {
        heading: text("Характеристики плёнок", "Film Characteristics"),
        body: text(
          "Каждый тип плёнки имеет уникальную цветопередачу. Kodak Portra — тёплые тона, мягкий контраст. Fuji Velvia — насыщенные цвета, высокий контраст. Ilford HP5 — чёрно-белая с широким динамическим диапазоном.",
          "Each film type has a unique color rendering. Kodak Portra — warm tones, soft contrast. Fuji Velvia — saturated colors, high contrast. Ilford HP5 — black & white with wide dynamic range.",
        ),
      },
    ],
  },
  "composition-technique": {
    title: text("Композиционные приёмы", "Composition Techniques"),
    sections: [
      {
        heading: text("Основные правила", "Core Rules"),
        body: text(
          "Правило третей — объект на пересечении линий, делящих кадр на 9 частей. Золотое сечение — спираль 1.618. Ведущие линии направляют взгляд. Симметрия создаёт баланс. Кадрирование выделяет объект.",
          "Rule of thirds — place subject at intersections of lines dividing the frame into 9 parts. Golden ratio — 1.618 spiral. Leading lines guide the eye. Symmetry creates balance. Framing highlights the subject.",
        ),
      },
    ],
  },
  "focal-length": {
    title: text("Фокусное расстояние", "Focal Length"),
    sections: [
      {
        heading: text("Углы обзора", "Field of View"),
        body: text(
          "Широкоугольный (14–35mm) — большой угол обзора, перспективное искажение. Стандартный (35–70mm) — близко к человеческому зрению. Телефото (70–200mm+) — сжатие перспективы, изоляция объекта.",
          "Wide angle (14–35mm) — wide FOV, perspective distortion. Standard (35–70mm) — close to human vision. Telephoto (70–200mm+) — compressed perspective, subject isolation.",
        ),
      },
    ],
  },
  "wcag-issue": {
    title: text("Проблемы WCAG", "WCAG Issues"),
    sections: [
      {
        heading: text("Типичные ошибки", "Common Issues"),
        body: text(
          "Низкий контраст текста/фона, отсутствие alt-текста для изображений, слишком мелкий шрифт, неразличимые элементы только по цвету, отсутствие фокус-индикатора, недоступные интерактивные элементы.",
          "Low text/background contrast, missing alt text for images, too small font, elements distinguishable only by color, no focus indicator, inaccessible interactive elements.",
        ),
      },
    ],
  },
  "button-color": {
    title: text("Цвет кнопки", "Button Color"),
    sections: [
      {
        heading: text("Контраст и читаемость", "Contrast & Readability"),
        body: text(
          "Цвет кнопки должен обеспечивать достаточный контраст с текстом внутри (WCAG AA: 4.5:1). Также кнопка должна выделяться на фоне страницы. Учитывайте и тон, и светлоту.",
          "Button color must provide sufficient contrast with its text (WCAG AA: 4.5:1). The button should also stand out from the page background. Consider both hue and lightness.",
        ),
      },
    ],
  },
  "font-size-choice": {
    title: text("Размер шрифта в интерфейсе", "UI Font Sizing"),
    sections: [
      {
        heading: text("Рекомендации", "Recommendations"),
        body: text(
          "Основной текст — 14–16px. Мелкий вспомогательный — 12px минимум. Заголовки — 20–32px. Кнопки — 14–16px. Слишком мелкий шрифт снижает читаемость, слишком крупный — нарушает иерархию.",
          "Body text — 14–16px. Small helper text — 12px minimum. Headings — 20–32px. Buttons — 14–16px. Too small reduces readability, too large breaks hierarchy.",
        ),
      },
    ],
  },
  "layout-error": {
    title: text("Ошибки вёрстки", "Layout Errors"),
    sections: [
      {
        heading: text("Типичные проблемы", "Common Problems"),
        body: text(
          "Нарушение выравнивания, неравномерные отступы, переполнение контейнера, нарушение визуальной иерархии, неотзывчивый дизайн, неправильный порядок элементов.",
          "Misalignment, uneven spacing, container overflow, broken visual hierarchy, non-responsive layout, incorrect element order.",
        ),
      },
    ],
  },
  "long-test": {
    title: text("Длинный тест", "Long Test"),
    sections: [
      {
        heading: text("Формат", "Format"),
        body: text(
          "Смешанный раунд с вопросами из всех игр: теория цвета, типографика, композиция, доступность и другие. Вопросы выбираются случайно из общего пула.",
          "A mixed round with questions from all games: color theory, typography, layout, accessibility, and more. Questions are randomly drawn from the full pool.",
        ),
      },
    ],
  },
};
