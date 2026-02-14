import { useState, useCallback, useMemo, useRef, useEffect } from "react";

// ============================================================
// DATA LAYER
// ============================================================

const CATEGORIES = {
  vertices: { name: "Vertices & Meshes", icon: "◇" },
  transforms: { name: "Matrix Transforms", icon: "⊞" },
  color: { name: "Color & Shading", icon: "◐" },
  pbr: { name: "PBR Materials", icon: "◉" },
  textures: { name: "Textures & UVs", icon: "▦" },
  procedural: { name: "Procedural Textures", icon: "≋" },
  lighting: { name: "Lighting", icon: "☀" },
  particles: { name: "Particles", icon: "✦" },
  skeleton: { name: "Skeleton & Rigging", icon: "♆" },
  atlas: { name: "Texture Atlases", icon: "▤" },
  rendering: { name: "Rendering Pipeline", icon: "▶" },
  shaders: { name: "Shaders & GLSL", icon: "⟐" },
};

// --- Exercise generators ---

function generateVertexExercise() {
  const types = [
    {
      type: "identify_primitive",
      question: "Сколько вершин у этого примитива?",
      shapes: [
        { name: "Куб", vertices: 8, edges: 12, faces: 6, desc: "Box / Cube" },
        { name: "Тетраэдр", vertices: 4, edges: 6, faces: 4, desc: "Tetrahedron" },
        { name: "Октаэдр", vertices: 6, edges: 12, faces: 8, desc: "Octahedron" },
        { name: "Икосаэдр", vertices: 12, edges: 30, faces: 20, desc: "Icosahedron" },
        { name: "Додекаэдр", vertices: 20, edges: 30, faces: 12, desc: "Dodecahedron" },
        { name: "Цилиндр (16 seg)", vertices: 32, edges: 48, faces: 18, desc: "Cylinder 16 segments" },
        { name: "UV Sphere (16×16)", vertices: 242, edges: 480, faces: 240, desc: "UV Sphere" },
        { name: "Plane (1 seg)", vertices: 4, edges: 4, faces: 1, desc: "Plane" },
        { name: "Torus (16×12)", vertices: 192, edges: 384, faces: 192, desc: "Torus" },
      ],
    },
    {
      type: "topology",
      question: "Какая формула Эйлера для замкнутого полиэдра?",
      options: ["V - E + F = 2", "V + E - F = 2", "V - E + F = 0", "V + E + F = 2"],
      correct: 0,
    },
    {
      type: "mesh_type",
      question: "Какой тип меша использует общие вершины между гранями?",
      options: ["Triangle Soup", "Indexed Mesh", "Point Cloud", "Voxel Grid"],
      correct: 1,
    },
    {
      type: "winding",
      question: "Counter-clockwise winding order определяет:",
      options: ["Цвет грани", "Направление нормали (front face)", "UV координаты", "Вес вершины"],
      correct: 1,
    },
    {
      type: "vertex_attribs",
      question: "Какие атрибуты обычно хранятся в вершине? (выберите все)",
      multiSelect: true,
      options: ["Position (vec3)", "Normal (vec3)", "UV (vec2)", "Tangent (vec4)", "Color (vec4)", "Bone Weights", "Все перечисленные"],
      correct: [0, 1, 2, 3, 4, 5, 6],
    },
  ];
  const t = types[Math.floor(Math.random() * types.length)];
  if (t.type === "identify_primitive") {
    const shape = t.shapes[Math.floor(Math.random() * t.shapes.length)];
    const field = ["vertices", "edges", "faces"][Math.floor(Math.random() * 3)];
    const fieldName = { vertices: "вершин", edges: "рёбер", faces: "граней" }[field];
    const correct = shape[field];
    const wrongs = new Set();
    while (wrongs.size < 3) {
      const w = correct + (Math.floor(Math.random() * 10) - 5) * (Math.random() > 0.5 ? 2 : 1);
      if (w > 0 && w !== correct) wrongs.add(w);
    }
    const options = [...wrongs, correct].sort(() => Math.random() - 0.5);
    return {
      category: "vertices",
      type: "choice",
      question: `${shape.name} (${shape.desc}) — сколько ${fieldName}?`,
      options: options.map(String),
      correct: options.indexOf(correct),
      explanation: `${shape.name}: V=${shape.vertices}, E=${shape.edges}, F=${shape.faces}`,
    };
  }
  if (t.multiSelect) {
    return { category: "vertices", type: "choice", question: t.question, options: t.options, correct: t.correct.length === t.options.length ? t.options.length - 1 : t.correct[0], explanation: "Все перечисленные атрибуты могут храниться в вершине" };
  }
  return { category: "vertices", type: "choice", question: t.question, options: t.options, correct: t.correct, explanation: "" };
}

function generateTransformExercise() {
  const exercises = [
    {
      type: "matrix_identify",
      question: "Какая матрица выполняет масштабирование по оси X в 2 раза?",
      options: [
        "[[2,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]",
        "[[1,0,0,2],[0,1,0,0],[0,0,1,0],[0,0,0,1]]",
        "[[1,0,0,0],[0,2,0,0],[0,0,1,0],[0,0,0,1]]",
        "[[1,0,0,0],[0,1,0,0],[0,0,2,0],[0,0,0,1]]",
      ],
      correct: 0,
      explanation: "Масштабирование по X — элемент [0][0] матрицы",
    },
    {
      type: "transform_order",
      question: "В каком порядке обычно применяются трансформации (TRS)?",
      options: ["Scale → Rotate → Translate", "Translate → Rotate → Scale", "Rotate → Translate → Scale", "Scale → Translate → Rotate"],
      correct: 0,
      explanation: "Стандартный порядок: Scale, затем Rotate, затем Translate (читается справа налево в матричном умножении)",
    },
    {
      type: "space",
      question: "Model Space → World Space → View Space → Clip Space. Какая матрица переводит из World в View?",
      options: ["Model Matrix", "View Matrix", "Projection Matrix", "MVP Matrix"],
      correct: 1,
      explanation: "View (Camera) Matrix переводит координаты из мирового пространства в пространство камеры",
    },
    {
      type: "quaternion",
      question: "Quaternion (0, 0, 0, 1) представляет:",
      options: ["Поворот на 180°", "Нулевой поворот (identity)", "Поворот на 90° по Y", "Невалидный кватернион"],
      correct: 1,
      explanation: "Кватернион (x=0, y=0, z=0, w=1) — это identity rotation",
    },
    {
      type: "code",
      question: "Напишите матрицу трансляции на (tx, ty, tz) в column-major формате (GLSL):\nmat4 translate(vec3 t) {\n  return mat4(\n    1, 0, 0, 0,\n    0, 1, 0, 0,\n    0, 0, 1, 0,\n    ?, ?, ?, 1\n  );\n}\nЧто стоит вместо ?, ?, ?",
      answer: "t.x, t.y, t.z",
      explanation: "В column-major: последний столбец содержит трансляцию",
    },
    {
      type: "compute",
      question: "Вектор (1, 0, 0) повернули на 90° вокруг оси Z. Результат?",
      options: ["(0, 1, 0)", "(0, -1, 0)", "(-1, 0, 0)", "(0, 0, 1)"],
      correct: 0,
      explanation: "Поворот на 90° CCW вокруг Z: x→y, y→-x",
    },
    {
      type: "homogeneous",
      question: "Почему в 3D графике используют 4×4 матрицы, а не 3×3?",
      options: [
        "Для хранения цвета",
        "Чтобы объединить поворот, масштаб и перенос в одну матрицу",
        "Для улучшения производительности",
        "Это требование OpenGL"
      ],
      correct: 1,
      explanation: "Однородные координаты (4×4) позволяют выразить аффинные трансформации одной матрицей",
    },
  ];
  const e = exercises[Math.floor(Math.random() * exercises.length)];
  if (e.type === "code") {
    return { category: "transforms", type: "input", question: e.question, answer: e.answer, explanation: e.explanation };
  }
  return { category: "transforms", type: "choice", question: e.question, options: e.options, correct: e.correct, explanation: e.explanation };
}

function generateColorExercise() {
  const exercises = [
    () => {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      return {
        category: "color", type: "color_pick",
        question: `Воспроизведите этот цвет: rgb(${r}, ${g}, ${b})`,
        targetColor: { r, g, b },
        tolerance: 30,
        explanation: `Точный цвет: rgb(${r}, ${g}, ${b})`,
      };
    },
    () => {
      const spaces = [
        { q: "Какое цветовое пространство линейно и подходит для вычислений освещения?", opts: ["sRGB", "Linear RGB", "HSL", "CMYK"], c: 1 },
        { q: "Какое цветовое пространство использует Hue, Saturation, Value?", opts: ["RGB", "HSL", "HSV", "LAB"], c: 2 },
        { q: "Gamma correction в sRGB — приблизительное значение гаммы:", opts: ["1.0", "1.8", "2.2", "3.0"], c: 2 },
        { q: "В каком пространстве perceptually uniform расстояние между цветами?", opts: ["RGB", "HSV", "CIELAB", "sRGB"], c: 2 },
        { q: "HDR использует значения яркости:", opts: ["0-1", "0-255", ">1 (unbounded)", "0-100"], c: 2 },
      ];
      const s = spaces[Math.floor(Math.random() * spaces.length)];
      return { category: "color", type: "choice", question: s.q, options: s.opts, correct: s.c, explanation: "" };
    },
    () => {
      const hex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return {
        category: "color", type: "input",
        question: `Переведите HEX ${hex} в RGB (формат: r, g, b)`,
        answer: `${r}, ${g}, ${b}`,
        explanation: `${hex} = rgb(${r}, ${g}, ${b})`,
      };
    },
  ];
  return exercises[Math.floor(Math.random() * exercises.length)]();
}

function generatePBRExercise() {
  const exercises = [
    { q: "Metallic = 1.0, Roughness = 0.0 — что это за материал?", opts: ["Зеркальный металл (хром)", "Матовый пластик", "Дерево", "Стекло"], c: 0 },
    { q: "Какой параметр PBR контролирует размытость отражений?", opts: ["Metallic", "Roughness", "Albedo", "AO"], c: 1 },
    { q: "Albedo (Base Color) в PBR для диэлектриков — рекомендуемый диапазон:", opts: ["0-1 линейный", "30-240 sRGB", "0-50 sRGB", "200-255 sRGB"], c: 1 },
    { q: "F0 (Fresnel at 0°) для диэлектрика обычно:", opts: ["0.0", "0.04", "0.5", "1.0"], c: 1 },
    { q: "Normal Map хранит нормали в пространстве:", opts: ["World Space", "Tangent Space", "Object Space", "Screen Space"], c: 1, explain: "Чаще всего Tangent Space, реже Object Space" },
    { q: "Какой канал в ORM текстуре отвечает за Roughness?", opts: ["Red (R)", "Green (G)", "Blue (B)", "Alpha (A)"], c: 1, explain: "ORM: Occlusion=R, Roughness=G, Metallic=B" },
    { q: "Ambient Occlusion в PBR отвечает за:", opts: ["Цвет тени", "Затенение в складках/углах", "Отражение света", "Прозрачность"], c: 1 },
    { q: "Закон сохранения энергии в PBR означает:", opts: ["Объект не может излучать свет", "Отражённый + преломлённый свет ≤ падающего", "Все материалы одинаково яркие", "Свет не теряет энергию"], c: 1 },
    { q: "Height Map vs Normal Map — height map хранит:", opts: ["RGB нормали", "Одноканальную высоту (displacement)", "Tangent vectors", "Specular данные"], c: 1 },
    { q: "Subsurface Scattering используется для:", opts: ["Металлов", "Кожи, воска, листьев", "Зеркал", "Стекла"], c: 1 },
    { q: "Metallic workflow vs Specular workflow — основное отличие:", opts: ["Разное количество текстур", "Metallic использует бинарный metal/non-metal", "Specular быстрее", "Нет разницы"], c: 1 },
    { q: "Anisotropy в PBR материалах используется для:", opts: ["Изотропных отражений", "Направленных отражений (hair, brushed metal)", "Прозрачности", "Эмиссии"], c: 1 },
    { q: "Clearcoat слой в PBR симулирует:", opts: ["Грязь", "Лаковое покрытие поверх основного материала", "Подповерхностное рассеивание", "Тень"], c: 1 },
    { q: "Index of Refraction (IOR) для стекла приблизительно:", opts: ["1.0", "1.1", "1.5", "2.4"], c: 2 },
    { q: "Что такое GGX (Trowbridge-Reitz)?", opts: ["Модель освещения", "Функция распределения нормалей (NDF)", "Текстурный формат", "Алгоритм сжатия"], c: 1 },
  ];
  const e = exercises[Math.floor(Math.random() * exercises.length)];
  return { category: "pbr", type: "choice", question: e.q, options: e.opts, correct: e.c, explanation: e.explain || "" };
}

function generateTextureExercise() {
  const exercises = [
    { q: "UV координаты (0.5, 0.5) указывают на:", opts: ["Верхний левый угол", "Центр текстуры", "Нижний правый угол", "За пределами текстуры"], c: 1 },
    { q: "Mipmapping — это:", opts: ["Увеличение текстуры", "Предрассчитанные уменьшенные версии текстуры", "Тип фильтрации", "Формат сжатия"], c: 1 },
    { q: "Trilinear filtering vs Bilinear — основное отличие:", opts: ["Trilinear быстрее", "Trilinear интерполирует между mip-уровнями", "Bilinear лучше качеством", "Нет разницы"], c: 1 },
    { q: "Anisotropic filtering улучшает качество текстур:", opts: ["На близких объектах", "Под острым углом к камере", "В тени", "На прозрачных объектах"], c: 1 },
    { q: "UV развёртка (unwrap) — seam это:", opts: ["Текстурный шов, линия разреза меша", "Тип UV проекции", "Ошибка в текстуре", "Граница текстуры"], c: 0 },
    { q: "Texel — это:", opts: ["Тип шейдера", "Пиксель текстуры", "UV координата", "Vertex attribute"], c: 1 },
    { q: "Wrap mode REPEAT vs CLAMP — при UV > 1.0 REPEAT:", opts: ["Растягивает край", "Повторяет текстуру", "Показывает чёрный", "Зеркалит"], c: 1 },
    { q: "UDIM — это:", opts: ["Тип сжатия", "Система для нескольких UV тайлов", "UV проекция", "Формат файла"], c: 1 },
    {
      type: "input",
      q: "Текстура 2048×2048, mip 0. Какой размер mip уровня 3?",
      a: "256",
      explain: "Каждый mip уровень в 2 раза меньше: 2048→1024→512→256"
    },
  ];
  const e = exercises[Math.floor(Math.random() * exercises.length)];
  if (e.type === "input") return { category: "textures", type: "input", question: e.q, answer: e.a, explanation: e.explain };
  return { category: "textures", type: "choice", question: e.q, options: e.opts, correct: e.c, explanation: "" };
}

function generateProceduralExercise() {
  const exercises = [
    { q: "Perlin Noise возвращает значения в диапазоне:", opts: ["0-1", "-1 до 1", "0-255", "Произвольный"], c: 1 },
    { q: "Fractal Brownian Motion (fBm) — это:", opts: ["Тип шума", "Суммирование нескольких октав шума", "Алгоритм сортировки", "Метод рендеринга"], c: 1 },
    { q: "Voronoi (Worley) noise отлично подходит для:", opts: ["Облаков", "Ячеистых структур (камень, кожа)", "Линейных паттернов", "Гладких градиентов"], c: 1 },
    { q: "Simplex Noise vs Perlin Noise — основное преимущество Simplex:", opts: ["Лучше качество", "Меньше артефактов, работает в любой размерности", "Проще реализовать", "Красивее"], c: 1 },
    {
      type: "code",
      q: 'Допишите fBm функцию (GLSL):\nfloat fbm(vec2 p) {\n  float value = 0.0;\n  float amplitude = 0.5;\n  for(int i = 0; i < 6; i++) {\n    value += amplitude * noise(p);\n    p *= ???;\n    amplitude *= ???;\n  }\n  return value;\n}\nЧто стоит вместо ???, ??? (стандартные значения)',
      a: "2.0, 0.5",
      explain: "Lacunarity=2.0 (удвоение частоты), Gain=0.5 (уменьшение амплитуды вдвое)"
    },
    { q: "Domain Warping — это:", opts: ["Фильтрация текстур", "Искажение входных координат шума другим шумом", "Тип UV маппинга", "Метод сжатия"], c: 1 },
    { q: "Tiling процедурной текстуры обычно достигается:", opts: ["Растягиванием UV", "Использованием fract() / mod()", "Увеличением разрешения", "Специальным форматом"], c: 1 },
  ];
  const e = exercises[Math.floor(Math.random() * exercises.length)];
  if (e.type === "code") return { category: "procedural", type: "input", question: e.q, answer: e.a, explanation: e.explain };
  return { category: "procedural", type: "choice", question: e.q, options: e.opts, correct: e.c, explanation: e.explain || "" };
}

function generateLightingExercise() {
  const exercises = [
    { q: "Lambertian (diffuse) освещение зависит от:", opts: ["Позиции камеры", "dot(Normal, LightDir)", "UV координат", "Размера объекта"], c: 1 },
    { q: "Phong specular использует вектор:", opts: ["Half vector", "Reflection vector", "Tangent vector", "Binormal"], c: 1 },
    { q: "Blinn-Phong вместо reflection vector использует:", opts: ["Normal", "Half vector (H = normalize(L + V))", "Tangent", "Light direction"], c: 1 },
    { q: "Point light attenuation обычно использует формулу:", opts: ["1/d", "1/d²", "d²", "constant"], c: 1 },
    { q: "Shadow mapping хранит:", opts: ["Цвет теней", "Глубину сцены с точки зрения света", "Нормали поверхности", "UV координаты"], c: 1 },
    { q: "Shadow acne возникает из-за:", opts: ["Низкого разрешения", "Numerical precision при сравнении глубин", "Неправильных нормалей", "Слишком яркого света"], c: 1 },
    { q: "IBL (Image-Based Lighting) использует:", opts: ["Point lights", "Environment map / cubemap для освещения", "Shadow maps", "Только ambient"], c: 1 },
    { q: "Hemisphere lighting — это:", opts: ["Точечный свет сверху", "Интерполяция между sky и ground цветом по нормали", "Свет полусферой", "Прожектор"], c: 1 },
    { q: "SSAO расшифровывается как:", opts: ["Screen Space Ambient Occlusion", "Scene Space AO", "Shader System AO", "Surface Shading AO"], c: 0 },
    { q: "Deferred shading хранит данные сцены в:", opts: ["Vertex buffer", "G-Buffer (несколько render targets)", "Shadow map", "Один framebuffer"], c: 1 },
    { q: "Volumetric lighting (god rays) симулирует:", opts: ["Отражения", "Рассеивание света в среде (fog, dust)", "Тени", "Caustics"], c: 1 },
    { q: "Какой тип света имеет direction но не position?", opts: ["Point Light", "Spot Light", "Directional Light", "Area Light"], c: 2 },
    {
      type: "code",
      q: "Напишите базовый Lambertian diffuse (GLSL):\nfloat diffuse = ???(???(N, L), 0.0);\nЧто вместо ???, ???",
      a: "max, dot",
      explain: "diffuse = max(dot(N, L), 0.0) — clamp отрицательных значений"
    },
  ];
  const e = exercises[Math.floor(Math.random() * exercises.length)];
  if (e.type === "code") return { category: "lighting", type: "input", question: e.q, answer: e.a, explanation: e.explain };
  return { category: "lighting", type: "choice", question: e.q, options: e.opts, correct: e.c, explanation: e.explain || "" };
}

function generateParticleExercise() {
  const exercises = [
    { q: "Billboard частица всегда повёрнута:", opts: ["К источнику света", "Лицом к камере", "Вверх", "К ближайшему объекту"], c: 1 },
    { q: "Particle emitter shape — Cone испускает частицы:", opts: ["Из точки", "Из конуса", "Из сферы", "С поверхности меша"], c: 1 },
    { q: "Velocity over lifetime обычно модифицируется:", opts: ["Текстурой", "Кривой (curve)", "Случайно каждый кадр", "Только при спавне"], c: 1 },
    { q: "GPU Particles vs CPU Particles — основное преимущество GPU:", opts: ["Лучший контроль", "Миллионы частиц (параллельные вычисления)", "Проще программировать", "Меньше памяти"], c: 1 },
    { q: "Particle collision detection чаще всего использует:", opts: ["Mesh collision", "Depth buffer (scene depth)", "Raycasting", "Аналитические формы"], c: 1 },
    { q: "Soft particles — это техника для:", opts: ["Мягких теней", "Плавного пересечения с геометрией (fade у depth)", "Размытых текстур", "Медленного движения"], c: 1 },
    { q: "Trail renderer для частиц создаёт:", opts: ["Тени", "Геометрию-шлейф по пути частицы", "Отражения", "Дополнительные частицы"], c: 1 },
    { q: "Sub-emitter — это:", opts: ["Дочерний emitter, спавнящийся от событий частицы (birth/death/collision)", "Уменьшенная версия эмиттера", "Emitter внутри меша", "Тип шума для частиц"], c: 0 },
  ];
  const e = exercises[Math.floor(Math.random() * exercises.length)];
  return { category: "particles", type: "choice", question: e.q, options: e.opts, correct: e.c, explanation: "" };
}

function generateSkeletonExercise() {
  const exercises = [
    { q: "Skinning — это:", opts: ["Текстурирование", "Привязка вершин меша к костям скелета", "Создание UV", "Тип рендеринга"], c: 1 },
    { q: "Vertex weights в скиннинге определяют:", opts: ["Цвет вершины", "Влияние каждой кости на вершину", "Позицию в UV", "Размер вершины"], c: 1 },
    { q: "Обычно максимум bone influences на вершину:", opts: ["1", "2", "4", "Неограничено"], c: 2 },
    { q: "Blend Shapes (Morph Targets) отличаются от скелетной анимации тем, что:", opts: ["Быстрее", "Хранят смещения вершин напрямую, без костей", "Используют текстуры", "Работают только в 2D"], c: 1 },
    { q: "Inverse Kinematics (IK) определяет:", opts: ["Позу по ключевым кадрам", "Позиции костей по целевой точке конечного звена", "Физику тряпичной куклы", "Текстурные координаты"], c: 1 },
    { q: "Forward Kinematics (FK) — поворот parent кости:", opts: ["Не влияет на children", "Переносится на все дочерние кости", "Только на прямых children", "Инвертируется"], c: 1 },
    { q: "Bind pose (T-pose / A-pose) — это:", opts: ["Анимация покоя", "Референсная поза, к которой привязан скин", "Тип ригга", "Формат экспорта"], c: 1 },
    { q: "Dual Quaternion Skinning решает проблему:", opts: ["Скорости", "Candy wrapper (скручивание) при Linear Blend Skinning", "UV искажений", "Текстурных артефактов"], c: 1 },
    { q: "Animation blending используется для:", opts: ["Смешивания текстур", "Плавного перехода между анимациями", "Размытия", "Компрессии"], c: 1 },
    { q: "Root Motion — это:", opts: ["Анимация корневой кости двигает персонажа в мире", "Неподвижная корневая кость", "Тип IK", "Физическая симуляция"], c: 0 },
  ];
  const e = exercises[Math.floor(Math.random() * exercises.length)];
  return { category: "skeleton", type: "choice", question: e.q, options: e.opts, correct: e.c, explanation: "" };
}

function generateAtlasExercise() {
  const exercises = [
    { q: "Texture Atlas — это:", opts: ["Тип фильтрации", "Несколько текстур, упакованных в одну большую", "Формат сжатия", "3D текстура"], c: 1 },
    { q: "Основное преимущество атласа:", opts: ["Лучшее качество", "Меньше draw calls (одна текстура = один батч)", "Больше деталей", "Проще создавать"], c: 1 },
    { q: "Sprite Sheet — это:", opts: ["Тип шейдера", "Атлас с кадрами анимации", "3D модель", "Карта нормалей"], c: 1 },
    { q: "Padding между элементами атласа нужен для:", opts: ["Красоты", "Предотвращения bleeding (утечки цвета при фильтрации)", "Экономии памяти", "UV маппинга"], c: 1 },
    {
      type: "input",
      q: "В атласе 4096×4096 каждый тайл 256×256. Сколько тайлов помещается?",
      a: "256",
      explain: "(4096/256) × (4096/256) = 16 × 16 = 256"
    },
    { q: "Channel packing — это:", opts: ["Упаковка разных данных в R, G, B, A каналы одной текстуры", "Сжатие каналов", "Удаление каналов", "Конвертация в grayscale"], c: 0 },
    {
      type: "input",
      q: "Спрайт в атласе 512×512 занимает пиксели (64, 128)-(192, 256). Какие UV координаты левого нижнего угла? (формат: u, v)",
      a: "0.125, 0.5",
      explain: "u = 64/512 = 0.125, v = 256/512 = 0.5"
    },
  ];
  const e = exercises[Math.floor(Math.random() * exercises.length)];
  if (e.type === "input") return { category: "atlas", type: "input", question: e.q, answer: e.a, explanation: e.explain };
  return { category: "atlas", type: "choice", question: e.q, options: e.opts, correct: e.c, explanation: e.explain || "" };
}

function generateRenderingExercise() {
  const exercises = [
    { q: "Стандартный порядок rendering pipeline:", opts: [
      "Vertex → Rasterization → Fragment → Output",
      "Fragment → Vertex → Output",
      "Rasterization → Vertex → Fragment",
      "Output → Fragment → Vertex"
    ], c: 0 },
    { q: "Z-buffer (depth buffer) решает проблему:", opts: ["Прозрачности", "Определения видимости (какой фрагмент ближе)", "Освещения", "Текстурирования"], c: 1 },
    { q: "Alpha blending для прозрачности требует:", opts: ["Произвольный порядок", "Сортировку объектов от дальних к ближним (back-to-front)", "Front-to-back порядок", "Не требует сортировки"], c: 1 },
    { q: "Stencil buffer используется для:", opts: ["Глубины", "Маскирования — порталы, outline, mirror", "Цвета", "Текстур"], c: 1 },
    { q: "Draw call — это:", opts: ["Вызов shader-а", "Команда CPU к GPU на отрисовку геометрии", "Рендер одного пикселя", "Загрузка текстуры"], c: 1 },
    { q: "Instancing позволяет:", opts: ["Улучшить качество", "Рисовать много копий меша одним draw call", "Сжимать текстуры", "Ускорить шейдеры"], c: 1 },
    { q: "Forward Rendering vs Deferred — Forward считает освещение:", opts: ["В отдельном проходе", "Для каждого объекта при его отрисовке", "Только для ближних объектов", "На CPU"], c: 1 },
    { q: "Frustum culling отсекает:", opts: ["Невидимые пиксели", "Объекты за пределами пирамиды видимости камеры", "Мелкие объекты", "Прозрачные объекты"], c: 1 },
    { q: "Occlusion culling отсекает:", opts: ["Объекты за другими объектами", "Маленькие объекты", "Прозрачные объекты", "Далёкие объекты"], c: 0 },
    { q: "Render Target (FBO) позволяет:", opts: ["Рендерить в текстуру вместо экрана", "Ускорить рендеринг", "Загружать модели", "Сжимать текстуры"], c: 0 },
    { q: "Что такое Overdraw?", opts: ["Отрисовка пикселя несколько раз", "Ошибка рендеринга", "Тип шейдера", "Метод оптимизации"], c: 0 },
    { q: "Early-Z test — это оптимизация, которая:", opts: ["Отбрасывает невидимые фрагменты ДО выполнения fragment shader", "Ускоряет vertex shader", "Сжимает depth buffer", "Рассчитывает тени"], c: 0 },
  ];
  const e = exercises[Math.floor(Math.random() * exercises.length)];
  return { category: "rendering", type: "choice", question: e.q, options: e.opts, correct: e.c, explanation: "" };
}

function generateShaderExercise() {
  const exercises = [
    { q: "gl_Position в vertex shader — это:", opts: ["Цвет вершины", "Позиция в clip space (vec4)", "UV координата", "Нормаль"], c: 1 },
    { q: "uniform переменная в GLSL:", opts: ["Меняется для каждой вершины", "Одинакова для всех вершин/фрагментов в draw call", "Локальная переменная", "Только для fragment shader"], c: 1 },
    { q: "varying (out/in) переменная:", opts: ["Константа", "Интерполируется между вершинами для фрагментов", "Только integer", "Передаётся с CPU"], c: 1 },
    { q: "mix(a, b, t) в GLSL возвращает:", opts: ["a * b", "a + b", "a * (1-t) + b * t", "min(a, b)"], c: 2 },
    { q: "step(edge, x) возвращает:", opts: ["x если x > edge", "0.0 если x < edge, иначе 1.0", "edge * x", "smoothstep"], c: 1 },
    { q: "smoothstep(a, b, x) — это:", opts: ["Линейная интерполяция", "Hermite интерполяция (S-кривая) между a и b", "Ступенчатая функция", "Синусоида"], c: 1 },
    {
      type: "code",
      q: "Напишите UV-based gradient шейдер (GLSL):\nvoid main() {\n  gl_FragColor = vec4(vec3(???), 1.0);\n}\nЧто вместо ??? для горизонтального градиента чёрный→белый?",
      a: "uv.x",
      explain: "uv.x от 0 до 1 создаёт горизонтальный градиент"
    },
    { q: "discard в fragment shader:", opts: ["Удаляет вершину", "Отбрасывает текущий фрагмент (не рисует пиксель)", "Останавливает шейдер", "Очищает буфер"], c: 1 },
    { q: "texture2D (texture) в GLSL принимает:", opts: ["(sampler, UV координаты)", "(цвет, позицию)", "(нормаль, свет)", "(float, float)"], c: 0 },
    {
      type: "code",
      q: "Rotate UV на angle радиан вокруг центра:\nvec2 rotateUV(vec2 uv, float angle) {\n  uv -= 0.5;\n  float s = sin(angle), c = cos(angle);\n  uv = vec2(uv.x*c - uv.y*s, uv.x*??? + uv.y*???);\n  uv += 0.5;\n  return uv;\n}\nЧто вместо ???, ???",
      a: "s, c",
      explain: "Матрица поворота: [cos, -sin; sin, cos]"
    },
    { q: "Compute Shader используется для:", opts: ["Рисования геометрии", "Общих вычислений на GPU (не привязан к рендерингу)", "Только освещения", "Только частиц"], c: 1 },
    { q: "SDF (Signed Distance Function) в шейдерах возвращает:", opts: ["Цвет", "Расстояние до ближайшей поверхности (+ снаружи, - внутри)", "UV координаты", "Нормаль"], c: 1 },
  ];
  const e = exercises[Math.floor(Math.random() * exercises.length)];
  if (e.type === "code") return { category: "shaders", type: "input", question: e.q, answer: e.a, explanation: e.explain };
  return { category: "shaders", type: "choice", question: e.q, options: e.opts, correct: e.c, explanation: e.explain || "" };
}

const GENERATORS = {
  vertices: generateVertexExercise,
  transforms: generateTransformExercise,
  color: generateColorExercise,
  pbr: generatePBRExercise,
  textures: generateTextureExercise,
  procedural: generateProceduralExercise,
  lighting: generateLightingExercise,
  particles: generateParticleExercise,
  skeleton: generateSkeletonExercise,
  atlas: generateAtlasExercise,
  rendering: generateRenderingExercise,
  shaders: generateShaderExercise,
};

function generateExercise(category) {
  if (category === "all") {
    const keys = Object.keys(GENERATORS);
    category = keys[Math.floor(Math.random() * keys.length)];
  }
  return GENERATORS[category]();
}

// ============================================================
// COMPONENTS
// ============================================================

function ColorPicker({ targetColor, onResult }) {
  const [r, setR] = useState(128);
  const [g, setG] = useState(128);
  const [b, setB] = useState(128);
  const [submitted, setSubmitted] = useState(false);

  const distance = Math.sqrt((r - targetColor.r) ** 2 + (g - targetColor.g) ** 2 + (b - targetColor.b) ** 2);

  const handleSubmit = () => {
    setSubmitted(true);
    onResult(distance < 45);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, color: "#888" }}>Цель</span>
          <div style={{ width: "100%", height: 72, borderRadius: 6, background: `rgb(${targetColor.r},${targetColor.g},${targetColor.b})`, border: "1px solid #333" }} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, color: "#888" }}>Ваш цвет</span>
          <div style={{ width: "100%", height: 72, borderRadius: 6, background: `rgb(${r},${g},${b})`, border: "1px solid #333" }} />
        </div>
      </div>
      {["R", "G", "B"].map((ch, i) => {
        const val = [r, g, b][i];
        const setter = [setR, setG, setB][i];
        const clr = ["#f44", "#4f4", "#48f"][i];
        return (
          <div key={ch} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 16, color: clr, fontWeight: 700, fontSize: 13 }}>{ch}</span>
            <input type="range" min={0} max={255} value={val} onChange={e => setter(+e.target.value)} disabled={submitted} style={{ flex: 1, accentColor: clr }} />
            <span style={{ width: 32, fontSize: 12, color: "#aaa", textAlign: "right" }}>{val}</span>
          </div>
        );
      })}
      {submitted && (
        <div style={{ fontSize: 12, color: distance < 45 ? "#4f4" : "#f84", padding: "6px 10px", background: "#1a1a1a", borderRadius: 6 }}>
          Δ = {distance.toFixed(1)} {distance < 45 ? "✓ Отличное попадание!" : "✗ Попробуйте точнее"}
          <br />Цель: rgb({targetColor.r}, {targetColor.g}, {targetColor.b}) → Ваш: rgb({r}, {g}, {b})
        </div>
      )}
      {!submitted && (
        <button onClick={handleSubmit} style={{ padding: "8px 16px", background: "#2a2a2a", color: "#fff", border: "1px solid #444", borderRadius: 6, cursor: "pointer" }}>
          Проверить цвет
        </button>
      )}
    </div>
  );
}

function ChoiceExercise({ exercise, onResult }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (idx) => {
    if (submitted) return;
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    onResult(selected === exercise.correct);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {exercise.options.map((opt, idx) => {
        let bg = "#1a1a1a";
        let border = "1px solid #333";
        if (submitted) {
          if (idx === exercise.correct) { bg = "#1a3a1a"; border = "1px solid #4f4"; }
          else if (idx === selected && selected !== exercise.correct) { bg = "#3a1a1a"; border = "1px solid #f44"; }
        } else if (idx === selected) {
          bg = "#2a2a3a";
          border = "1px solid #88f";
        }
        return (
          <button key={idx} onClick={() => handleSelect(idx)} style={{ padding: "10px 14px", background: bg, color: "#ddd", border, borderRadius: 6, cursor: submitted ? "default" : "pointer", textAlign: "left", fontSize: 13, lineHeight: 1.4, fontFamily: opt.includes("[") || opt.includes("mat") ? "monospace" : "inherit", whiteSpace: "pre-wrap" }}>
            {opt}
          </button>
        );
      })}
      {submitted && exercise.explanation && (
        <div style={{ fontSize: 12, color: "#aaa", padding: "6px 10px", background: "#111", borderRadius: 6, marginTop: 4 }}>
          {exercise.explanation}
        </div>
      )}
      {!submitted && (
        <button onClick={handleSubmit} disabled={selected === null} style={{ padding: "8px 16px", marginTop: 4, background: selected !== null ? "#2a2a2a" : "#1a1a1a", color: selected !== null ? "#fff" : "#555", border: "1px solid #333", borderRadius: 6, cursor: selected !== null ? "pointer" : "default" }}>
          Ответить
        </button>
      )}
    </div>
  );
}

function InputExercise({ exercise, onResult }) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const normalize = (s) => s.replace(/\s+/g, "").toLowerCase();

  const handleSubmit = () => {
    if (!value.trim()) return;
    setSubmitted(true);
    const isCorrect = normalize(value) === normalize(exercise.answer);
    onResult(isCorrect);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSubmit()}
        disabled={submitted}
        placeholder="Ваш ответ..."
        style={{ padding: "10px 14px", background: "#111", color: "#fff", border: "1px solid #333", borderRadius: 6, fontSize: 14, fontFamily: "monospace", outline: "none" }}
      />
      {submitted && (
        <div style={{ fontSize: 12, padding: "8px 10px", background: "#111", borderRadius: 6, color: normalize(value) === normalize(exercise.answer) ? "#4f4" : "#f84" }}>
          {normalize(value) === normalize(exercise.answer)
            ? "✓ Правильно!"
            : `✗ Ответ: ${exercise.answer}`}
          {exercise.explanation && <div style={{ color: "#aaa", marginTop: 4 }}>{exercise.explanation}</div>}
        </div>
      )}
      {!submitted && (
        <button onClick={handleSubmit} disabled={!value.trim()} style={{ padding: "8px 16px", background: value.trim() ? "#2a2a2a" : "#1a1a1a", color: value.trim() ? "#fff" : "#555", border: "1px solid #333", borderRadius: 6, cursor: value.trim() ? "pointer" : "default" }}>
          Проверить
        </button>
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  const [screen, setScreen] = useState("menu");
  const [category, setCategory] = useState("all");
  const [exercise, setExercise] = useState(null);
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0, maxStreak: 0 });
  const [history, setHistory] = useState([]);

  const startExercise = useCallback((cat) => {
    setCategory(cat);
    setExercise(generateExercise(cat));
    setScreen("exercise");
  }, []);

  const handleResult = useCallback((isCorrect) => {
    setStats(prev => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
      };
    });
    setHistory(prev => [...prev.slice(-49), { category: exercise.category, correct: isCorrect, question: exercise.question.slice(0, 60) }]);
  }, [exercise]);

  const nextExercise = useCallback(() => {
    setExercise(generateExercise(category));
  }, [category]);

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  // --- MENU SCREEN ---
  if (screen === "menu") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#eee", fontFamily: "'Inter', -apple-system, sans-serif", padding: 20 }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>3D Graphics Trainer</h1>
            <p style={{ fontSize: 13, color: "#666", margin: "6px 0 0" }}>Vertices · PBR · Shaders · Lighting · Particles · Rigging · Rendering</p>
          </div>

          {stats.total > 0 && (
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { label: "Решено", value: stats.total },
                { label: "Точность", value: `${accuracy}%` },
                { label: "Серия", value: stats.streak },
                { label: "Макс серия", value: stats.maxStreak },
              ].map(s => (
                <div key={s.label} style={{ padding: "10px 16px", background: "#111", borderRadius: 8, border: "1px solid #222", minWidth: 80 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => startExercise("all")}
            style={{ width: "100%", padding: "14px 20px", background: "#1a1a2e", color: "#fff", border: "1px solid #333", borderRadius: 8, cursor: "pointer", fontSize: 15, fontWeight: 600, marginBottom: 16, textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}
          >
            <span style={{ fontSize: 20 }}>⚡</span>
            Случайное упражнение из всех категорий
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => startExercise(key)}
                style={{ padding: "12px 14px", background: "#111", color: "#ddd", border: "1px solid #222", borderRadius: 8, cursor: "pointer", textAlign: "left", fontSize: 13, display: "flex", alignItems: "center", gap: 8, transition: "border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#555"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#222"}
              >
                <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {history.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#666", marginBottom: 8 }}>Последние ответы</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
                {[...history].reverse().slice(0, 15).map((h, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#888", padding: "4px 8px", background: "#111", borderRadius: 4 }}>
                    <span style={{ color: h.correct ? "#4f4" : "#f44", fontWeight: 700 }}>{h.correct ? "✓" : "✗"}</span>
                    <span style={{ color: "#555" }}>{CATEGORIES[h.category]?.icon}</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.question}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- EXERCISE SCREEN ---
  if (screen === "exercise" && exercise) {
    const catInfo = CATEGORIES[exercise.category] || { name: "Mixed", icon: "?" };

    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#eee", fontFamily: "'Inter', -apple-system, sans-serif", padding: 20 }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button onClick={() => setScreen("menu")} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 13, padding: "4px 8px" }}>
              ← Меню
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#555" }}>
              <span>{catInfo.icon} {catInfo.name}</span>
              <span>{stats.correct}/{stats.total}</span>
              {stats.streak > 0 && <span style={{ color: "#f84" }}>🔥 {stats.streak}</span>}
            </div>
          </div>

          <div style={{ background: "#111", borderRadius: 10, border: "1px solid #222", padding: 20 }}>
            <div style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 16, whiteSpace: "pre-wrap", fontFamily: exercise.question.includes("(") || exercise.question.includes("{") ? "monospace" : "inherit" }}>
              {exercise.question}
            </div>

            {exercise.type === "choice" && (
              <ChoiceExercise key={exercise.question} exercise={exercise} onResult={handleResult} />
            )}
            {exercise.type === "input" && (
              <InputExercise key={exercise.question} exercise={exercise} onResult={handleResult} />
            )}
            {exercise.type === "color_pick" && (
              <ColorPicker key={exercise.question} targetColor={exercise.targetColor} onResult={handleResult} />
            )}

            <button
              onClick={nextExercise}
              style={{ width: "100%", marginTop: 16, padding: "10px 16px", background: "#1a1a2e", color: "#fff", border: "1px solid #333", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}
            >
              Следующее →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
