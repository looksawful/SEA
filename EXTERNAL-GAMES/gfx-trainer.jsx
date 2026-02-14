import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const CATEGORIES = {
  color: { name: "Color Theory", icon: "◐" },
  shader: { name: "Shader Math", icon: "△" },
  gpu: { name: "GPU & Pipeline", icon: "⬡" },
  visual: { name: "Visual Precision", icon: "◎" },
  code: { name: "Code Challenge", icon: "⌘" },
  space: { name: "3D & Space", icon: "◇" },
};

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const hslToStr = (h, s, l) => `hsl(${h}, ${s}%, ${l}%)`;
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);
const hexFromRgb = (r, g, b) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
const rgbFromHex = (hex) => {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
};

function generateColorTheoryGame() {
  const types = ["complementary", "triadic", "analogous", "split", "hex_guess", "mix_result"];
  const type = types[randInt(0, types.length - 1)];
  const baseHue = randInt(0, 359);

  if (type === "complementary") {
    const correct = (baseHue + 180) % 360;
    const options = shuffle([
      correct,
      (baseHue + 120) % 360,
      (baseHue + 90) % 360,
      (baseHue + 210) % 360,
    ]);
    return {
      type: "color_pick",
      category: "color",
      question: `What is the complementary color?`,
      baseColor: hslToStr(baseHue, 70, 50),
      options: options.map((h) => ({ value: h, display: hslToStr(h, 70, 50) })),
      correct: correct,
      explain: `Complementary = base hue + 180°. ${baseHue}° → ${correct}°`,
    };
  }
  if (type === "triadic") {
    const c1 = (baseHue + 120) % 360;
    const c2 = (baseHue + 240) % 360;
    const correctPair = [c1, c2].sort((a, b) => a - b);
    const wrong1 = [(baseHue + 90) % 360, (baseHue + 270) % 360].sort((a, b) => a - b);
    const wrong2 = [(baseHue + 60) % 360, (baseHue + 180) % 360].sort((a, b) => a - b);
    const options = shuffle([correctPair, wrong1, wrong2]);
    return {
      type: "color_pair_pick",
      category: "color",
      question: `Pick the triadic pair for this color`,
      baseColor: hslToStr(baseHue, 70, 50),
      options: options.map((pair) => ({
        value: pair.join(","),
        colors: pair.map((h) => hslToStr(h, 70, 50)),
      })),
      correct: correctPair.join(","),
      explain: `Triadic = base ±120°. ${baseHue}° → ${c1}°, ${c2}°`,
    };
  }
  if (type === "analogous") {
    const correct = (baseHue + 30) % 360;
    const options = shuffle([correct, (baseHue + 90) % 360, (baseHue + 180) % 360, (baseHue + 150) % 360]);
    return {
      type: "color_pick",
      category: "color",
      question: `Which color is analogous (30° offset)?`,
      baseColor: hslToStr(baseHue, 70, 50),
      options: options.map((h) => ({ value: h, display: hslToStr(h, 70, 50) })),
      correct: correct,
      explain: `Analogous colors are within 30° on the wheel. ${baseHue}° → ${correct}°`,
    };
  }
  if (type === "split") {
    const c1 = (baseHue + 150) % 360;
    const c2 = (baseHue + 210) % 360;
    const correct = c1;
    const options = shuffle([c1, (baseHue + 60) % 360, (baseHue + 120) % 360, (baseHue + 90) % 360]);
    return {
      type: "color_pick",
      category: "color",
      question: `Pick one of the split-complementary colors`,
      baseColor: hslToStr(baseHue, 70, 50),
      options: options.map((h) => ({ value: h, display: hslToStr(h, 70, 50) })),
      correct: correct,
      explain: `Split-complementary = 150° and 210° from base. ${baseHue}° → ${c1}°, ${c2}°`,
    };
  }
  if (type === "hex_guess") {
    const r = randInt(0, 255);
    const g = randInt(0, 255);
    const b = randInt(0, 255);
    const hex = hexFromRgb(r, g, b);
    return {
      type: "text_input",
      category: "color",
      question: `What is the HEX value of this color?`,
      baseColor: `rgb(${r},${g},${b})`,
      correct: hex.toLowerCase(),
      placeholder: "#rrggbb",
      validate: (input) => input.toLowerCase().replace(/\s/g, "") === hex.toLowerCase(),
      explain: `RGB(${r}, ${g}, ${b}) = ${hex}`,
    };
  }
  {
    const r1 = randInt(50, 200), g1 = randInt(50, 200), b1 = randInt(50, 200);
    const r2 = randInt(50, 200), g2 = randInt(50, 200), b2 = randInt(50, 200);
    const mr = Math.round((r1 + r2) / 2);
    const mg = Math.round((g1 + g2) / 2);
    const mb = Math.round((b1 + b2) / 2);
    const correctHex = hexFromRgb(mr, mg, mb);
    const options = shuffle([
      correctHex,
      hexFromRgb(clamp(mr + 40, 0, 255), clamp(mg - 30, 0, 255), mb),
      hexFromRgb(mr, clamp(mg + 50, 0, 255), clamp(mb - 40, 0, 255)),
      hexFromRgb(clamp(mr - 35, 0, 255), mg, clamp(mb + 45, 0, 255)),
    ]);
    return {
      type: "color_mix",
      category: "color",
      question: `What color do you get by mixing these two (average)?`,
      color1: `rgb(${r1},${g1},${b1})`,
      color2: `rgb(${r2},${g2},${b2})`,
      options: options.map((h) => ({ value: h, display: h })),
      correct: correctHex,
      explain: `Average: R=(${r1}+${r2})/2=${mr}, G=(${g1}+${g2})/2=${mg}, B=(${b1}+${b2})/2=${mb} → ${correctHex}`,
    };
  }
}

function generateShaderGame() {
  const types = ["vec_op", "mix_func", "dot_product", "normalize", "step_func", "blend_mode"];
  const type = types[randInt(0, types.length - 1)];

  if (type === "vec_op") {
    const a = [randFloat(0, 1), randFloat(0, 1), randFloat(0, 1)];
    const b = [randFloat(0, 1), randFloat(0, 1), randFloat(0, 1)];
    const ops = ["+", "*", "-"];
    const op = ops[randInt(0, 2)];
    let result;
    if (op === "+") result = a.map((v, i) => +(v + b[i]).toFixed(2));
    else if (op === "*") result = a.map((v, i) => +(v * b[i]).toFixed(2));
    else result = a.map((v, i) => +(v - b[i]).toFixed(2));
    const resultStr = `vec3(${result.join(", ")})`;
    const wrong1 = `vec3(${a.map((v, i) => +(v + b[i] * 0.5).toFixed(2)).join(", ")})`;
    const wrong2 = `vec3(${a.map((v, i) => +(v * b[i] + 0.1).toFixed(2)).join(", ")})`;
    const wrong3 = `vec3(${result.map((v) => +(v + 0.15).toFixed(2)).join(", ")})`;
    return {
      type: "choice",
      category: "shader",
      question: `vec3 a = vec3(${a.join(", ")});\nvec3 b = vec3(${b.join(", ")});\nWhat is a ${op} b?`,
      options: shuffle([resultStr, wrong1, wrong2, wrong3]),
      correct: resultStr,
      explain: `Component-wise operation: (${a[0]}${op}${b[0]}, ${a[1]}${op}${b[1]}, ${a[2]}${op}${b[2]})`,
    };
  }
  if (type === "mix_func") {
    const a = randFloat(0, 1);
    const b = randFloat(0, 1);
    const t = randFloat(0, 1);
    const result = +(a * (1 - t) + b * t).toFixed(3);
    return {
      type: "text_input",
      category: "shader",
      question: `mix(${a}, ${b}, ${t}) = ?\n\nFormula: mix(a, b, t) = a*(1-t) + b*t`,
      correct: String(result),
      placeholder: "0.000",
      validate: (input) => Math.abs(parseFloat(input) - result) < 0.01,
      explain: `${a}*(1-${t}) + ${b}*${t} = ${a}*${(1 - t).toFixed(2)} + ${b}*${t} = ${result}`,
    };
  }
  if (type === "dot_product") {
    const a = [randInt(-3, 3), randInt(-3, 3), randInt(-3, 3)];
    const b = [randInt(-3, 3), randInt(-3, 3), randInt(-3, 3)];
    const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const options = shuffle([dot, dot + 2, dot - 3, dot + 5]);
    return {
      type: "choice",
      category: "shader",
      question: `dot(vec3(${a.join(",")}), vec3(${b.join(",")})) = ?`,
      options: options.map(String),
      correct: String(dot),
      explain: `${a[0]}*${b[0]} + ${a[1]}*${b[1]} + ${a[2]}*${b[2]} = ${dot}`,
    };
  }
  if (type === "normalize") {
    const v = [randInt(1, 5), randInt(1, 5), 0];
    const len = Math.sqrt(v[0] ** 2 + v[1] ** 2);
    const norm = v.map((c) => +(c / len).toFixed(3));
    const normStr = `(${norm.join(", ")})`;
    const wrong1 = `(${v.map((c) => +(c / (len + 1)).toFixed(3)).join(", ")})`;
    const wrong2 = `(${v.map((c) => +(c / (len * 2)).toFixed(3)).join(", ")})`;
    return {
      type: "choice",
      category: "shader",
      question: `normalize(vec3(${v.join(", ")})) = ?\nlength = √(${v[0]}² + ${v[1]}²) = ${len.toFixed(3)}`,
      options: shuffle([normStr, wrong1, wrong2]),
      correct: normStr,
      explain: `Each component / length: (${v[0]}/${len.toFixed(3)}, ${v[1]}/${len.toFixed(3)}, 0)`,
    };
  }
  if (type === "step_func") {
    const edge = randFloat(0.2, 0.8);
    const x = randFloat(0, 1);
    const result = x >= edge ? 1.0 : 0.0;
    return {
      type: "choice",
      category: "shader",
      question: `step(${edge}, ${x}) = ?`,
      options: shuffle(["0.0", "1.0"]),
      correct: String(result.toFixed(1)),
      explain: `step(edge, x) returns 0.0 if x < edge, 1.0 otherwise. ${x} ${x >= edge ? ">=" : "<"} ${edge} → ${result}`,
    };
  }
  {
    const modes = [
      { name: "Multiply", formula: "a * b", fn: (a, b) => a * b },
      { name: "Screen", formula: "1-(1-a)*(1-b)", fn: (a, b) => 1 - (1 - a) * (1 - b) },
      { name: "Overlay", formula: "a<0.5 ? 2ab : 1-2(1-a)(1-b)", fn: (a, b) => a < 0.5 ? 2 * a * b : 1 - 2 * (1 - a) * (1 - b) },
    ];
    const mode = modes[randInt(0, modes.length - 1)];
    const a = randFloat(0, 1);
    const b = randFloat(0, 1);
    const result = +mode.fn(a, b).toFixed(3);
    return {
      type: "text_input",
      category: "shader",
      question: `Blend mode: ${mode.name}\nFormula: ${mode.formula}\na = ${a}, b = ${b}\nResult = ?`,
      correct: String(result),
      placeholder: "0.000",
      validate: (input) => Math.abs(parseFloat(input) - result) < 0.02,
      explain: `${mode.name}(${a}, ${b}) = ${result}`,
    };
  }
}

function generateGPUGame() {
  const questions = [
    {
      q: "In which order does the standard GPU rendering pipeline execute?",
      options: [
        "Vertex → Rasterization → Fragment → Output",
        "Fragment → Vertex → Output → Rasterization",
        "Rasterization → Vertex → Fragment → Output",
        "Vertex → Fragment → Rasterization → Output",
      ],
      correct: "Vertex → Rasterization → Fragment → Output",
      explain: "Vertex shader processes vertices, rasterizer creates fragments, fragment shader colors them, then output merging.",
    },
    {
      q: "What does the z-buffer (depth buffer) store?",
      options: ["Color per pixel", "Depth per pixel", "Normal vectors", "UV coordinates"],
      correct: "Depth per pixel",
      explain: "The z-buffer stores depth values to determine which surfaces are visible (closest to camera).",
    },
    {
      q: "What is a draw call?",
      options: [
        "A CPU instruction to the GPU to render geometry",
        "A pixel shader execution",
        "A memory allocation on VRAM",
        "A vertex buffer creation",
      ],
      correct: "A CPU instruction to the GPU to render geometry",
      explain: "Each draw call is a CPU→GPU command to render a set of primitives with current state.",
    },
    {
      q: "What happens during rasterization?",
      options: [
        "Triangles are converted to fragments/pixels",
        "Vertices are transformed",
        "Textures are loaded into memory",
        "Shaders are compiled",
      ],
      correct: "Triangles are converted to fragments/pixels",
      explain: "Rasterization determines which pixels are covered by each primitive and interpolates vertex data.",
    },
    {
      q: "What is MSAA?",
      options: [
        "Multi-Sample Anti-Aliasing",
        "Multi-Stage Alpha Averaging",
        "Maximum Shader Array Allocation",
        "Mapped Surface Area Algorithm",
      ],
      correct: "Multi-Sample Anti-Aliasing",
      explain: "MSAA samples geometry at multiple points per pixel to reduce jagged edges.",
    },
    {
      q: "What is a stencil buffer used for?",
      options: [
        "Masking regions to control rendering",
        "Storing texture data",
        "Calculating lighting",
        "Compressing vertex data",
      ],
      correct: "Masking regions to control rendering",
      explain: "Stencil buffer allows per-pixel masking for effects like portals, outlines, shadows.",
    },
    {
      q: "What is texture mipmapping?",
      options: [
        "Pre-computed downscaled texture levels",
        "Real-time texture compression",
        "Procedural texture generation",
        "UV coordinate animation",
      ],
      correct: "Pre-computed downscaled texture levels",
      explain: "Mipmaps are pre-generated smaller versions used for distant surfaces to improve quality and performance.",
    },
    {
      q: "What does 'early z-test' optimize?",
      options: [
        "Skips fragment shading for occluded pixels",
        "Speeds up vertex processing",
        "Reduces texture bandwidth",
        "Compresses frame buffer data",
      ],
      correct: "Skips fragment shading for occluded pixels",
      explain: "Early z-test rejects fragments before the fragment shader runs, saving GPU computation.",
    },
    {
      q: "What is a framebuffer object (FBO)?",
      options: [
        "A render target that isn't the screen",
        "A vertex data container",
        "A shader program handle",
        "A GPU timing mechanism",
      ],
      correct: "A render target that isn't the screen",
      explain: "FBOs let you render to textures/offscreen buffers for post-processing, shadows, etc.",
    },
    {
      q: "What does GPU 'occupancy' refer to?",
      options: [
        "Ratio of active warps to max possible warps",
        "Amount of VRAM used",
        "Number of draw calls per frame",
        "Percentage of shader cores active",
      ],
      correct: "Ratio of active warps to max possible warps",
      explain: "Occupancy measures how well the GPU hides latency by having enough active thread groups.",
    },
    {
      q: "What does 'back-face culling' discard?",
      options: [
        "Triangles facing away from the camera",
        "Pixels outside the viewport",
        "Vertices with negative Z",
        "Textures not bound to materials",
      ],
      correct: "Triangles facing away from the camera",
      explain: "By checking winding order, back-face culling skips triangles whose normals point away.",
    },
    {
      q: "What is a compute shader used for?",
      options: [
        "General-purpose GPU computation outside the graphics pipeline",
        "Compiling other shaders faster",
        "Managing GPU memory allocation",
        "Rendering text efficiently",
      ],
      correct: "General-purpose GPU computation outside the graphics pipeline",
      explain: "Compute shaders run arbitrary parallel code on the GPU — particles, physics, image processing.",
    },
  ];
  const q = questions[randInt(0, questions.length - 1)];
  return {
    type: "choice",
    category: "gpu",
    question: q.q,
    options: shuffle(q.options),
    correct: q.correct,
    explain: q.explain,
  };
}

function generateVisualGame() {
  const types = ["color_distance", "spacing", "opacity", "gradient_midpoint"];
  const type = types[randInt(0, types.length - 1)];

  if (type === "color_distance") {
    const targetH = randInt(0, 359);
    const targetS = randInt(50, 90);
    const targetL = randInt(30, 70);
    return {
      type: "eyedropper",
      category: "visual",
      question: "Reproduce this color as closely as possible",
      targetColor: hslToStr(targetH, targetS, targetL),
      targetHSL: [targetH, targetS, targetL],
      explain: `Target was HSL(${targetH}, ${targetS}%, ${targetL}%)`,
    };
  }
  if (type === "spacing") {
    const target = randInt(8, 64);
    return {
      type: "slider_guess",
      category: "visual",
      question: "Guess the gap between these elements (in px)",
      targetValue: target,
      min: 0,
      max: 80,
      unit: "px",
      explain: `The gap was ${target}px`,
    };
  }
  if (type === "opacity") {
    const target = randInt(10, 90);
    return {
      type: "slider_guess",
      category: "visual",
      question: "What opacity (%) is this overlay?",
      targetValue: target,
      min: 0,
      max: 100,
      unit: "%",
      renderPreview: "opacity",
      explain: `The opacity was ${target}%`,
    };
  }
  {
    const midpoint = randInt(20, 80);
    return {
      type: "slider_guess",
      category: "visual",
      question: "Where is the gradient midpoint? (%)",
      targetValue: midpoint,
      min: 0,
      max: 100,
      unit: "%",
      renderPreview: "gradient",
      explain: `The midpoint was at ${midpoint}%`,
    };
  }
}

function generateCodeGame() {
  const types = ["css_color", "transform", "css_property", "keyframe"];
  const type = types[randInt(0, types.length - 1)];

  if (type === "css_color") {
    const r = randInt(0, 255), g = randInt(0, 255), b = randInt(0, 255);
    const hex = hexFromRgb(r, g, b);
    return {
      type: "code_input",
      category: "code",
      question: `Write the CSS to set background-color to RGB(${r}, ${g}, ${b}) in hex notation`,
      correct: `background-color: ${hex};`,
      validate: (input) => {
        const clean = input.replace(/\s/g, "").toLowerCase();
        return clean === `background-color:${hex};` || clean === `background-color:${hex}`;
      },
      placeholder: "background-color: #...;",
      explain: `background-color: ${hex};`,
    };
  }
  if (type === "transform") {
    const deg = randInt(0, 360);
    const scale = randFloat(0.5, 2.0);
    return {
      type: "code_input",
      category: "code",
      question: `Write CSS to rotate ${deg}deg AND scale to ${scale}`,
      correct: `transform: rotate(${deg}deg) scale(${scale});`,
      validate: (input) => {
        const clean = input.replace(/\s+/g, " ").toLowerCase().trim();
        return (
          clean.includes(`rotate(${deg}deg)`) &&
          clean.includes(`scale(${scale})`) &&
          clean.includes("transform")
        );
      },
      placeholder: "transform: ...;",
      explain: `transform: rotate(${deg}deg) scale(${scale});`,
    };
  }
  if (type === "keyframe") {
    const prop = ["opacity", "translateX", "scale"][randInt(0, 2)];
    const from = prop === "opacity" ? "0" : prop === "translateX" ? "0px" : "0.5";
    const to = prop === "opacity" ? "1" : prop === "translateX" ? "100px" : "1.5";
    return {
      type: "choice",
      category: "code",
      question: `Which keyframe animates ${prop} from ${from} to ${to}?`,
      options: shuffle([
        `@keyframes a { from { ${prop === "translateX" ? "transform: translateX(" + from + ")" : prop + ": " + from} } to { ${prop === "translateX" ? "transform: translateX(" + to + ")" : prop + ": " + to} } }`,
        `@keyframes a { 0% { ${prop}: ${to} } 100% { ${prop}: ${from} } }`,
        `@keyframes a { from { ${prop}: ${to} } to { ${prop}: ${from} } }`,
        `@animation a { start { ${prop}: ${from} } end { ${prop}: ${to} } }`,
      ]),
      correct: `@keyframes a { from { ${prop === "translateX" ? "transform: translateX(" + from + ")" : prop + ": " + from} } to { ${prop === "translateX" ? "transform: translateX(" + to + ")" : prop + ": " + to} } }`,
      explain: `@keyframes uses 'from/to' or '0%/100%' with correct property syntax`,
    };
  }
  {
    const props = [
      { q: "How to make text not selectable?", a: "user-select: none", wrong: ["pointer-events: none", "text-select: disabled", "cursor: no-select"] },
      { q: "How to add a blur to a background?", a: "backdrop-filter: blur(10px)", wrong: ["background-blur: 10px", "filter: background-blur(10px)", "blur-filter: 10px"] },
      { q: "How to clip content to a circle?", a: "clip-path: circle(50%)", wrong: ["border-radius: circle", "mask: circle(50%)", "overflow: circle"] },
      { q: "How to make a grid with 3 equal columns?", a: "grid-template-columns: repeat(3, 1fr)", wrong: ["grid-columns: 3", "display: grid(3)", "columns: 3 equal"] },
    ];
    const p = props[randInt(0, props.length - 1)];
    return {
      type: "choice",
      category: "code",
      question: p.q,
      options: shuffle([p.a, ...p.wrong]),
      correct: p.a,
      explain: `Correct: ${p.a}`,
    };
  }
}

function generateSpaceGame() {
  const types = ["matrix_op", "coordinate", "projection", "normal"];
  const type = types[randInt(0, types.length - 1)];

  if (type === "matrix_op") {
    const ops = [
      { q: "Which matrix operation moves an object to position (3, 5, -2)?", a: "Translation matrix", wrong: ["Rotation matrix", "Scale matrix", "Shear matrix"] },
      { q: "Which operation changes an object's size uniformly by 2x?", a: "Uniform scale matrix", wrong: ["Translation matrix", "Rotation matrix", "Projection matrix"] },
      { q: "To rotate 90° around the Y axis, which matrix type?", a: "Rotation matrix (Y-axis)", wrong: ["Translation matrix", "Scale matrix", "View matrix"] },
    ];
    const op = ops[randInt(0, ops.length - 1)];
    return {
      type: "choice",
      category: "space",
      question: op.q,
      options: shuffle([op.a, ...op.wrong]),
      correct: op.a,
      explain: `${op.a} — each transform type has its specific matrix structure.`,
    };
  }
  if (type === "coordinate") {
    return {
      type: "choice",
      category: "space",
      question: "In a right-handed coordinate system (OpenGL), which direction is +Z?",
      options: shuffle(["Towards the viewer", "Into the screen", "Upward", "Right"]),
      correct: "Towards the viewer",
      explain: "In right-handed (OpenGL): +X right, +Y up, +Z towards the viewer.",
    };
  }
  if (type === "projection") {
    return {
      type: "choice",
      category: "space",
      question: "What is the main visual difference between orthographic and perspective projection?",
      options: shuffle([
        "Perspective has foreshortening; orthographic doesn't",
        "Orthographic supports more triangles",
        "Perspective uses fewer draw calls",
        "Orthographic cannot render 3D scenes",
      ]),
      correct: "Perspective has foreshortening; orthographic doesn't",
      explain: "Perspective makes far objects smaller (foreshortening). Orthographic preserves parallel lines.",
    };
  }
  {
    const a = [randInt(-3, 3), randInt(-3, 3), randInt(-3, 3)];
    const b = [randInt(-3, 3), randInt(-3, 3), randInt(-3, 3)];
    const cross = [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
    const crossStr = `(${cross.join(", ")})`;
    const wrong1 = `(${cross[0] + 1}, ${cross[1]}, ${cross[2] - 1})`;
    const wrong2 = `(${cross[0]}, ${cross[1] + 2}, ${cross[2]})`;
    return {
      type: "choice",
      category: "space",
      question: `cross(vec3(${a.join(",")}), vec3(${b.join(",")})) = ?\n\ncross(a,b) = (a.y*b.z-a.z*b.y, a.z*b.x-a.x*b.z, a.x*b.y-a.y*b.x)`,
      options: shuffle([crossStr, wrong1, wrong2]),
      correct: crossStr,
      explain: `(${a[1]}*${b[2]}-${a[2]}*${b[1]}, ${a[2]}*${b[0]}-${a[0]}*${b[2]}, ${a[0]}*${b[1]}-${a[1]}*${b[0]}) = ${crossStr}`,
    };
  }
}

const GENERATORS = {
  color: generateColorTheoryGame,
  shader: generateShaderGame,
  gpu: generateGPUGame,
  visual: generateVisualGame,
  code: generateCodeGame,
  space: generateSpaceGame,
};

function ChoiceRenderer({ game, onAnswer, answered, selectedAnswer }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {game.options.map((opt, i) => {
        const val = typeof opt === "string" ? opt : opt.value || opt;
        const isCorrect = val === game.correct;
        const isSelected = val === selectedAnswer;
        let bg = "rgba(255,255,255,0.04)";
        let border = "1px solid rgba(255,255,255,0.08)";
        if (answered) {
          if (isCorrect) { bg = "rgba(80,200,120,0.15)"; border = "1px solid rgba(80,200,120,0.4)"; }
          else if (isSelected && !isCorrect) { bg = "rgba(255,80,80,0.15)"; border = "1px solid rgba(255,80,80,0.4)"; }
        }
        return (
          <button
            key={i}
            onClick={() => !answered && onAnswer(val)}
            style={{
              padding: "10px 14px",
              background: bg,
              border,
              borderRadius: 6,
              color: "#e0e0e0",
              cursor: answered ? "default" : "pointer",
              textAlign: "left",
              fontFamily: "monospace",
              fontSize: 13,
              whiteSpace: "pre-wrap",
              transition: "all 0.15s",
            }}
          >
            {typeof opt === "string" ? opt : opt.value || JSON.stringify(opt)}
          </button>
        );
      })}
    </div>
  );
}

function ColorPickRenderer({ game, onAnswer, answered, selectedAnswer }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ color: "#888", fontSize: 12 }}>Base:</span>
        <div style={{ width: 48, height: 48, borderRadius: 6, background: game.baseColor, border: "1px solid rgba(255,255,255,0.1)" }} />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {game.options.map((opt, i) => {
          const isCorrect = opt.value === game.correct;
          const isSelected = opt.value === selectedAnswer;
          let outline = "2px solid transparent";
          if (answered) {
            if (isCorrect) outline = "2px solid rgba(80,200,120,0.8)";
            else if (isSelected) outline = "2px solid rgba(255,80,80,0.8)";
          }
          return (
            <button
              key={i}
              onClick={() => !answered && onAnswer(opt.value)}
              style={{
                width: 56, height: 56, borderRadius: 8,
                background: opt.display,
                border: "none", outline,
                cursor: answered ? "default" : "pointer",
                transition: "all 0.15s",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function ColorPairPickRenderer({ game, onAnswer, answered, selectedAnswer }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ color: "#888", fontSize: 12 }}>Base:</span>
        <div style={{ width: 48, height: 48, borderRadius: 6, background: game.baseColor, border: "1px solid rgba(255,255,255,0.1)" }} />
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {game.options.map((opt, i) => {
          const isCorrect = opt.value === game.correct;
          const isSelected = opt.value === selectedAnswer;
          let outline = "2px solid transparent";
          if (answered) {
            if (isCorrect) outline = "2px solid rgba(80,200,120,0.8)";
            else if (isSelected) outline = "2px solid rgba(255,80,80,0.8)";
          }
          return (
            <button
              key={i}
              onClick={() => !answered && onAnswer(opt.value)}
              style={{
                display: "flex", gap: 4, padding: 6, borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
                border: "none", outline,
                cursor: answered ? "default" : "pointer",
              }}
            >
              {opt.colors.map((c, ci) => (
                <div key={ci} style={{ width: 44, height: 44, borderRadius: 6, background: c }} />
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ColorMixRenderer({ game, onAnswer, answered, selectedAnswer }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 6, background: game.color1 }} />
        <span style={{ color: "#666", fontSize: 18 }}>+</span>
        <div style={{ width: 44, height: 44, borderRadius: 6, background: game.color2 }} />
        <span style={{ color: "#666", fontSize: 18 }}>=</span>
        <span style={{ color: "#888", fontSize: 14 }}>?</span>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {game.options.map((opt, i) => {
          const isCorrect = opt.value === game.correct;
          const isSelected = opt.value === selectedAnswer;
          let outline = "2px solid transparent";
          if (answered) {
            if (isCorrect) outline = "2px solid rgba(80,200,120,0.8)";
            else if (isSelected) outline = "2px solid rgba(255,80,80,0.8)";
          }
          return (
            <button
              key={i}
              onClick={() => !answered && onAnswer(opt.value)}
              style={{
                width: 56, height: 56, borderRadius: 8,
                background: opt.display,
                border: "none", outline,
                cursor: answered ? "default" : "pointer",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function TextInputRenderer({ game, onAnswer, answered, result }) {
  const [value, setValue] = useState("");
  return (
    <div>
      {game.baseColor && (
        <div style={{ width: 56, height: 56, borderRadius: 8, background: game.baseColor, marginBottom: 12, border: "1px solid rgba(255,255,255,0.1)" }} />
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !answered && onAnswer(value)}
          placeholder={game.placeholder || "Answer..."}
          disabled={answered}
          style={{
            flex: 1, padding: "8px 12px",
            background: "rgba(255,255,255,0.05)",
            border: answered
              ? result ? "1px solid rgba(80,200,120,0.4)" : "1px solid rgba(255,80,80,0.4)"
              : "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6, color: "#e0e0e0",
            fontFamily: "monospace", fontSize: 13, outline: "none",
          }}
        />
        {!answered && (
          <button
            onClick={() => onAnswer(value)}
            style={{
              padding: "8px 16px", background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6,
              color: "#ccc", cursor: "pointer", fontSize: 13,
            }}
          >
            ↵
          </button>
        )}
      </div>
    </div>
  );
}

function CodeInputRenderer({ game, onAnswer, answered, result }) {
  const [value, setValue] = useState("");
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={game.placeholder || "Write your code..."}
        disabled={answered}
        rows={3}
        style={{
          width: "100%", padding: "10px 12px",
          background: "rgba(255,255,255,0.04)",
          border: answered
            ? result ? "1px solid rgba(80,200,120,0.4)" : "1px solid rgba(255,80,80,0.4)"
            : "1px solid rgba(255,255,255,0.1)",
          borderRadius: 6, color: "#e0e0e0",
          fontFamily: "monospace", fontSize: 13, outline: "none",
          resize: "vertical", boxSizing: "border-box",
        }}
      />
      {!answered && (
        <button
          onClick={() => onAnswer(value)}
          style={{
            marginTop: 8, padding: "8px 20px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6,
            color: "#ccc", cursor: "pointer", fontSize: 13,
          }}
        >
          Submit
        </button>
      )}
    </div>
  );
}

function EyedropperRenderer({ game, onAnswer, answered, result }) {
  const [hue, setHue] = useState(180);
  const [sat, setSat] = useState(70);
  const [lit, setLit] = useState(50);

  const userColor = hslToStr(hue, sat, lit);

  const handleSubmit = () => {
    const [th, ts, tl] = game.targetHSL;
    const dist = Math.sqrt((hue - th) ** 2 + (sat - ts) ** 2 + (lit - tl) ** 2);
    const score = Math.max(0, 100 - dist);
    onAnswer({ h: hue, s: sat, l: lit, score, pass: score > 65 });
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>TARGET</div>
          <div style={{ width: 56, height: 56, borderRadius: 8, background: game.targetColor, border: "1px solid rgba(255,255,255,0.1)" }} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>YOURS</div>
          <div style={{ width: 56, height: 56, borderRadius: 8, background: userColor, border: "1px solid rgba(255,255,255,0.1)" }} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {[
          { label: "H", value: hue, set: setHue, max: 359 },
          { label: "S", value: sat, set: setSat, max: 100 },
          { label: "L", value: lit, set: setLit, max: 100 },
        ].map(({ label, value, set, max }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#666", fontSize: 12, width: 14 }}>{label}</span>
            <input
              type="range"
              min={0}
              max={max}
              value={value}
              onChange={(e) => set(Number(e.target.value))}
              disabled={answered}
              style={{ flex: 1, accentColor: "#888" }}
            />
            <span style={{ color: "#888", fontSize: 11, width: 28, textAlign: "right", fontFamily: "monospace" }}>{value}</span>
          </div>
        ))}
      </div>
      {!answered && (
        <button onClick={handleSubmit} style={{
          padding: "8px 20px", background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6,
          color: "#ccc", cursor: "pointer", fontSize: 13,
        }}>
          Submit
        </button>
      )}
      {answered && result !== null && (
        <div style={{ fontSize: 12, color: result.pass ? "#50c878" : "#ff5050", marginTop: 4 }}>
          Score: {result.score.toFixed(0)}/100
        </div>
      )}
    </div>
  );
}

function SliderGuessRenderer({ game, onAnswer, answered, result }) {
  const [value, setValue] = useState(Math.round((game.min + game.max) / 2));

  const handleSubmit = () => {
    const diff = Math.abs(value - game.targetValue);
    const maxDiff = game.max - game.min;
    const score = Math.max(0, 100 - (diff / maxDiff) * 200);
    onAnswer({ guess: value, score, pass: score > 50 });
  };

  return (
    <div>
      {game.renderPreview === "opacity" && (
        <div style={{ position: "relative", width: 120, height: 80, marginBottom: 16, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #3498db, #e74c3c)" }} />
          <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${game.targetValue / 100})` }} />
        </div>
      )}
      {game.renderPreview === "gradient" && (
        <div style={{
          width: "100%", height: 40, borderRadius: 6, marginBottom: 16,
          background: `linear-gradient(to right, #3498db ${game.targetValue}%, #e74c3c)`,
          border: "1px solid rgba(255,255,255,0.08)",
        }} />
      )}
      {!game.renderPreview && (
        <div style={{ display: "flex", gap: game.targetValue, marginBottom: 16, alignItems: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 6, background: "rgba(255,255,255,0.12)" }} />
          <div style={{ width: 40, height: 40, borderRadius: 6, background: "rgba(255,255,255,0.12)" }} />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input
          type="range"
          min={game.min}
          max={game.max}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          disabled={answered}
          style={{ flex: 1, accentColor: "#888" }}
        />
        <span style={{ color: "#888", fontSize: 12, fontFamily: "monospace", width: 48, textAlign: "right" }}>
          {value}{game.unit}
        </span>
      </div>
      {!answered && (
        <button onClick={handleSubmit} style={{
          padding: "8px 20px", background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6,
          color: "#ccc", cursor: "pointer", fontSize: 13,
        }}>
          Submit
        </button>
      )}
      {answered && result !== null && (
        <div style={{ fontSize: 12, marginTop: 4 }}>
          <span style={{ color: result.pass ? "#50c878" : "#ff5050" }}>
            Score: {result.score.toFixed(0)}/100
          </span>
          <span style={{ color: "#666", marginLeft: 8 }}>
            (answer: {game.targetValue}{game.unit}, yours: {result.guess}{game.unit})
          </span>
        </div>
      )}
    </div>
  );
}

function GameCard({ game, onNext }) {
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [result, setResult] = useState(null);

  const handleAnswer = (value) => {
    setSelectedAnswer(value);
    setAnswered(true);
    if (game.type === "eyedropper" || game.type === "slider_guess") {
      setResult(value);
    } else if (game.validate) {
      setResult(game.validate(value));
    } else {
      setResult(value === game.correct);
    }
  };

  const isCorrect =
    result === true ||
    (result && typeof result === "object" && result.pass) ||
    (game.type !== "eyedropper" && game.type !== "slider_guess" && selectedAnswer === game.correct);

  const cat = CATEGORIES[game.category];

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 10, padding: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 14 }}>{cat.icon}</span>
        <span style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>{cat.name}</span>
      </div>

      <div style={{
        fontSize: 13, color: "#c8c8c8", marginBottom: 16,
        whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: 1.6,
      }}>
        {game.question}
      </div>

      {game.type === "choice" && (
        <ChoiceRenderer game={game} onAnswer={handleAnswer} answered={answered} selectedAnswer={selectedAnswer} />
      )}
      {game.type === "color_pick" && (
        <ColorPickRenderer game={game} onAnswer={handleAnswer} answered={answered} selectedAnswer={selectedAnswer} />
      )}
      {game.type === "color_pair_pick" && (
        <ColorPairPickRenderer game={game} onAnswer={handleAnswer} answered={answered} selectedAnswer={selectedAnswer} />
      )}
      {game.type === "color_mix" && (
        <ColorMixRenderer game={game} onAnswer={handleAnswer} answered={answered} selectedAnswer={selectedAnswer} />
      )}
      {game.type === "text_input" && (
        <TextInputRenderer game={game} onAnswer={handleAnswer} answered={answered} result={result} />
      )}
      {game.type === "code_input" && (
        <CodeInputRenderer game={game} onAnswer={handleAnswer} answered={answered} result={result} />
      )}
      {game.type === "eyedropper" && (
        <EyedropperRenderer game={game} onAnswer={handleAnswer} answered={answered} result={result} />
      )}
      {game.type === "slider_guess" && (
        <SliderGuessRenderer game={game} onAnswer={handleAnswer} answered={answered} result={result} />
      )}

      {answered && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{
            fontSize: 12, color: isCorrect ? "#50c878" : "#ff5050",
            fontWeight: 600, marginBottom: 6,
          }}>
            {isCorrect ? "✓ Correct" : "✗ Wrong"}
          </div>
          {game.explain && (
            <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5, fontFamily: "monospace" }}>
              {game.explain}
            </div>
          )}
          <button
            onClick={onNext}
            style={{
              marginTop: 12, padding: "8px 20px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6, color: "#aaa", cursor: "pointer", fontSize: 13,
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default function GfxTrainer() {
  const [screen, setScreen] = useState("menu");
  const [activeCategory, setActiveCategory] = useState(null);
  const [game, setGame] = useState(null);
  const [stats, setStats] = useState({ total: 0, correct: 0 });
  const [history, setHistory] = useState([]);

  const newGame = useCallback((cat) => {
    const gen = GENERATORS[cat || activeCategory];
    if (gen) setGame(gen());
  }, [activeCategory]);

  const startCategory = (cat) => {
    setActiveCategory(cat);
    setScreen("game");
    const gen = GENERATORS[cat];
    if (gen) setGame(gen());
  };

  const startMix = () => {
    setActiveCategory("mix");
    setScreen("game");
    const cats = Object.keys(GENERATORS);
    const cat = cats[randInt(0, cats.length - 1)];
    setGame(GENERATORS[cat]());
  };

  const handleNext = () => {
    if (activeCategory === "mix") {
      const cats = Object.keys(GENERATORS);
      const cat = cats[randInt(0, cats.length - 1)];
      setGame(GENERATORS[cat]());
    } else {
      newGame(activeCategory);
    }
  };

  const goMenu = () => {
    setScreen("menu");
    setGame(null);
    setActiveCategory(null);
  };

  if (screen === "menu") {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0a0b", color: "#e0e0e0",
        fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
        padding: "40px 20px",
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>GFX Trainer</div>
            <div style={{ fontSize: 12, color: "#555" }}>
              {stats.total > 0
                ? `${stats.correct}/${stats.total} correct (${Math.round((stats.correct / stats.total) * 100)}%)`
                : "Train your graphics & design intuition"}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => startCategory(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8, color: "#ccc",
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{cat.icon}</span>
                <span style={{ fontSize: 14 }}>{cat.name}</span>
              </button>
            ))}

            <button
              onClick={startMix}
              style={{
                marginTop: 8, padding: "14px 16px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, color: "#fff",
                cursor: "pointer", fontSize: 14,
                fontWeight: 600,
              }}
            >
              ⚡ Random Mix
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0b", color: "#e0e0e0",
      fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
      padding: "20px",
    }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <button
            onClick={goMenu}
            style={{
              background: "none", border: "none",
              color: "#666", cursor: "pointer", fontSize: 13,
              padding: "4px 0",
            }}
          >
            ← Back
          </button>
          <span style={{ fontSize: 11, color: "#444" }}>
            {stats.total > 0 && `${stats.correct}/${stats.total}`}
          </span>
        </div>

        {game && (
          <GameCard
            key={JSON.stringify(game.question).slice(0, 60)}
            game={game}
            onNext={handleNext}
          />
        )}
      </div>
    </div>
  );
}
