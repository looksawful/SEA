import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * DesignGym
 * A minimal, logic-first set of micro-games for training visual + technical intuition.
 *
 * No external deps.
 * - Color wheel picking
 * - Multiple choice
 * - Text / numeric input
 * - Safe expression challenges (no eval) + live shader-like preview
 * - Local persistence (optional)
 */

// -----------------------------
// Types
// -----------------------------

type RGB = { r: number; g: number; b: number }; // 0..255

type QuestionBase = {
  id: string;
  title: string;
  prompt: string;
  hint?: string;
};

type QChoice = QuestionBase & {
  type: "choice";
  choices: { id: string; label: string }[];
  correctChoiceId: string;
};

type QText = QuestionBase & {
  type: "text";
  /**
   * Normalize user answer and expected answer before comparing.
   * If omitted, exact trimmed match (case-insensitive).
   */
  expected: string;
  normalize?: (s: string) => string;
};

type QNumber = QuestionBase & {
  type: "number";
  expected: number;
  tolerance?: number; // absolute tolerance
};

type QColorPick = QuestionBase & {
  type: "color";
  target: RGB;
  mode: "match" | "complement";
  tolerance?: number; // distance in 0..1 (linear RGB)
};

type QExpression = QuestionBase & {
  type: "expression";
  /**
   * User writes an expression (shader-like) evaluated over sample inputs.
   * Must evaluate close to reference.
   */
  variables: string[];
  reference: string;
  samples: Record<string, number>[];
  tolerance?: number;
  /** Optional: show live preview canvas of the expression as RGB (r,g,b expressions) */
  preview?: {
    kind: "shader";
    /**
     * User writes r,g,b expressions.
     * Default is provided.
     */
    defaults: { r: string; g: string; b: string };
  };
};

type Question = QChoice | QText | QNumber | QColorPick | QExpression;

type GameDefinition = {
  id: string;
  title: string;
  description: string;
  tasks: ((rng: () => number) => Question)[];
};

type Props = {
  games?: GameDefinition[];
  storageKey?: string;
  initialGameId?: string;
  onEvent?: (evt: { type: string; payload?: any }) => void;
};

// -----------------------------
// Utilities
// -----------------------------

function clamp(x: number, a = 0, b = 1) {
  return Math.min(b, Math.max(a, x));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function toHex2(n: number) {
  return Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0");
}

function rgbToHex(rgb: RGB) {
  return `#${toHex2(rgb.r)}${toHex2(rgb.g)}${toHex2(rgb.b)}`;
}

function hexToRgb(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const v = m[1];
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

function rgbToHsl({ r, g, b }: RGB) {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    switch (max) {
      case R:
        h = ((G - B) / d) % 6;
        break;
      case G:
        h = (B - R) / d + 2;
        break;
      case B:
        h = (R - G) / d + 4;
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): RGB {
  const C = (1 - Math.abs(2 * l - 1)) * s;
  const Hp = (h / 60) % 6;
  const X = C * (1 - Math.abs((Hp % 2) - 1));
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (0 <= Hp && Hp < 1) [r1, g1, b1] = [C, X, 0];
  else if (1 <= Hp && Hp < 2) [r1, g1, b1] = [X, C, 0];
  else if (2 <= Hp && Hp < 3) [r1, g1, b1] = [0, C, X];
  else if (3 <= Hp && Hp < 4) [r1, g1, b1] = [0, X, C];
  else if (4 <= Hp && Hp < 5) [r1, g1, b1] = [X, 0, C];
  else [r1, g1, b1] = [C, 0, X];
  const m = l - C / 2;
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function deltaHue(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function rgbLin(x: number) {
  // sRGB -> linear
  const v = x / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearRgbDistance(a: RGB, b: RGB) {
  const dr = rgbLin(a.r) - rgbLin(b.r);
  const dg = rgbLin(a.g) - rgbLin(b.g);
  const db = rgbLin(a.b) - rgbLin(b.b);
  return Math.sqrt(dr * dr + dg * dg + db * db); // 0..~1.73
}

function normalizeText(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

// Deterministic RNG
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uid(prefix = "q") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

// -----------------------------
// Safe expression engine (shunting-yard)
// Supports: + - * / ^, parentheses, variables, constants, and functions.
// Functions: clamp(x,a,b), mix(a,b,t), step(edge,x), smoothstep(a,b,x),
// abs, min, max, sin, cos, tan, pow, sqrt, floor, ceil, fract, mod.
// -----------------------------

type Token =
  | { t: "num"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: string }
  | { t: "lp" }
  | { t: "rp" }
  | { t: "comma" };

const OP_INFO: Record<
  string,
  { prec: number; assoc: "L" | "R"; arity: 1 | 2 }
> = {
  "u-": { prec: 5, assoc: "R", arity: 1 },
  "^": { prec: 4, assoc: "R", arity: 2 },
  "*": { prec: 3, assoc: "L", arity: 2 },
  "/": { prec: 3, assoc: "L", arity: 2 },
  "+": { prec: 2, assoc: "L", arity: 2 },
  "-": { prec: 2, assoc: "L", arity: 2 },
};

function tokenize(expr: string): Token[] {
  const s = expr.trim();
  const tokens: Token[] = [];
  let i = 0;

  const isSpace = (c: string) => /\s/.test(c);
  const isDigit = (c: string) => /[0-9]/.test(c);
  const isIdStart = (c: string) => /[a-zA-Z_]/.test(c);
  const isId = (c: string) => /[a-zA-Z0-9_]/.test(c);

  while (i < s.length) {
    const c = s[i];
    if (isSpace(c)) {
      i++;
      continue;
    }
    if (c === "(") {
      tokens.push({ t: "lp" });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ t: "rp" });
      i++;
      continue;
    }
    if (c === ",") {
      tokens.push({ t: "comma" });
      i++;
      continue;
    }
    if ("+-*/^".includes(c)) {
      tokens.push({ t: "op", v: c });
      i++;
      continue;
    }
    if (isDigit(c) || (c === "." && i + 1 < s.length && isDigit(s[i + 1]))) {
      let j = i + 1;
      while (j < s.length && (isDigit(s[j]) || s[j] === ".")) j++;
      const num = Number(s.slice(i, j));
      if (Number.isNaN(num)) throw new Error("Invalid number");
      tokens.push({ t: "num", v: num });
      i = j;
      continue;
    }
    if (isIdStart(c)) {
      let j = i + 1;
      while (j < s.length && isId(s[j])) j++;
      tokens.push({ t: "id", v: s.slice(i, j) });
      i = j;
      continue;
    }
    throw new Error(`Unexpected character: ${c}`);
  }
  return tokens;
}

type RpnItem =
  | { k: "num"; v: number }
  | { k: "var"; v: string }
  | { k: "op"; v: string }
  | { k: "fn"; v: string; argc: number };

function toRpn(tokens: Token[]): RpnItem[] {
  const out: RpnItem[] = [];
  const stack: (Token | { t: "fn"; name: string; argc: number })[] = [];

  let prev: Token | null = null;

  // For function arg counting: on seeing '(' after id, push fn marker with argc=1.
  // Commas increase argc.

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];

    if (tok.t === "num") {
      out.push({ k: "num", v: tok.v });
    } else if (tok.t === "id") {
      // function or variable? If next token is lp, treat as function.
      const next = tokens[i + 1];
      if (next && next.t === "lp") {
        stack.push({ t: "fn", name: tok.v, argc: 0 });
      } else {
        out.push({ k: "var", v: tok.v });
      }
    } else if (tok.t === "op") {
      let op = tok.v;
      // unary minus detection
      if (op === "-") {
        const isUnary =
          !prev ||
          prev.t === "op" ||
          prev.t === "lp" ||
          prev.t === "comma";
        if (isUnary) op = "u-";
      }

      const info = OP_INFO[op];
      if (!info) throw new Error(`Unsupported operator: ${op}`);

      while (stack.length) {
        const top = stack[stack.length - 1] as any;
        if (top.t === "op") {
          const topInfo = OP_INFO[top.v];
          if (!topInfo) break;
          const higher =
            topInfo.prec > info.prec ||
            (topInfo.prec === info.prec && info.assoc === "L");
          if (higher) {
            stack.pop();
            out.push({ k: "op", v: top.v });
            continue;
          }
        }
        break;
      }
      stack.push({ t: "op", v: op });
    } else if (tok.t === "lp") {
      // If previous token is a function marker (already on stack), '(' starts arg list.
      // If the immediately previous stack item is fn and its argc==0, we will detect empty args later.
      stack.push(tok);
    } else if (tok.t === "comma") {
      // Pop operators until left paren
      while (stack.length && stack[stack.length - 1].t !== "lp") {
        const top = stack.pop() as any;
        if (top.t === "op") out.push({ k: "op", v: top.v });
        else if (top.t === "fn") out.push({ k: "fn", v: top.name, argc: top.argc });
      }
      // Increase the argc on nearest fn marker below '('.
      for (let j = stack.length - 1; j >= 0; j--) {
        const item = stack[j] as any;
        if (item.t === "fn") {
          item.argc = Math.max(1, item.argc) + 1;
          break;
        }
      }
    } else if (tok.t === "rp") {
      while (stack.length && stack[stack.length - 1].t !== "lp") {
        const top = stack.pop() as any;
        if (top.t === "op") out.push({ k: "op", v: top.v });
        else if (top.t === "fn") out.push({ k: "fn", v: top.name, argc: top.argc });
      }
      if (!stack.length) throw new Error("Mismatched parentheses");
      stack.pop(); // pop lp

      // If there is a function marker on top, pop it to output.
      const top = stack[stack.length - 1] as any;
      if (top && top.t === "fn") {
        stack.pop();
        // Determine argc: if marker argc==0, then there were either 0 args or 1 arg.
        // If previous token was lp, then it was empty () => 0 args.
        const hadEmpty = prev && prev.t === "lp";
        const argc = hadEmpty ? 0 : Math.max(1, top.argc);
        out.push({ k: "fn", v: top.name, argc });
      }
    }

    prev = tok;
  }

  while (stack.length) {
    const top = stack.pop() as any;
    if (top.t === "lp") throw new Error("Mismatched parentheses");
    if (top.t === "op") out.push({ k: "op", v: top.v });
    else if (top.t === "fn") out.push({ k: "fn", v: top.name, argc: top.argc });
  }

  return out;
}

function evalRpn(rpn: RpnItem[], vars: Record<string, number>) {
  const st: number[] = [];

  const fns: Record<string, (...args: number[]) => number> = {
    abs: (x) => Math.abs(x),
    min: (a, b) => Math.min(a, b),
    max: (a, b) => Math.max(a, b),
    sin: (x) => Math.sin(x),
    cos: (x) => Math.cos(x),
    tan: (x) => Math.tan(x),
    pow: (a, b) => Math.pow(a, b),
    sqrt: (x) => Math.sqrt(Math.max(0, x)),
    floor: (x) => Math.floor(x),
    ceil: (x) => Math.ceil(x),
    fract: (x) => x - Math.floor(x),
    mod: (a, b) => ((a % b) + b) % b,
    clamp: (x, a, b) => Math.min(b, Math.max(a, x)),
    mix: (a, b, t) => a + (b - a) * t,
    step: (edge, x) => (x < edge ? 0 : 1),
    smoothstep: (a, b, x) => {
      const t = clamp((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    },
  };

  for (const it of rpn) {
    if (it.k === "num") st.push(it.v);
    else if (it.k === "var") {
      if (it.v === "pi") st.push(Math.PI);
      else if (it.v === "e") st.push(Math.E);
      else st.push(vars[it.v] ?? 0);
    } else if (it.k === "op") {
      const info = OP_INFO[it.v];
      if (!info) throw new Error(`Bad op: ${it.v}`);
      if (info.arity === 1) {
        const a = st.pop();
        if (a === undefined) throw new Error("Stack underflow");
        if (it.v === "u-") st.push(-a);
        else throw new Error(`Unsupported unary op: ${it.v}`);
      } else {
        const b = st.pop();
        const a = st.pop();
        if (a === undefined || b === undefined) throw new Error("Stack underflow");
        switch (it.v) {
          case "+":
            st.push(a + b);
            break;
          case "-":
            st.push(a - b);
            break;
          case "*":
            st.push(a * b);
            break;
          case "/":
            st.push(a / b);
            break;
          case "^":
            st.push(Math.pow(a, b));
            break;
          default:
            throw new Error(`Unsupported op: ${it.v}`);
        }
      }
    } else if (it.k === "fn") {
      const fn = fns[it.v];
      if (!fn) throw new Error(`Unknown function: ${it.v}`);
      const args = st.splice(-it.argc, it.argc);
      if (args.length !== it.argc) throw new Error("Stack underflow");
      st.push(fn(...args));
    }
  }

  if (st.length !== 1) throw new Error("Invalid expression");
  return st[0];
}

function compileExpression(expr: string) {
  const tokens = tokenize(expr);
  const rpn = toRpn(tokens);
  return (vars: Record<string, number>) => evalRpn(rpn, vars);
}

// -----------------------------
// Default content (games)
// -----------------------------

function defaultGames(): GameDefinition[] {
  const games: GameDefinition[] = [
    {
      id: "color_hue",
      title: "Color: Hue Match",
      description: "Pick the closest hue on the wheel.",
      tasks: [
        (rng) => {
          const h = Math.floor(rng() * 360);
          const s = lerp(0.55, 0.95, rng());
          const l = lerp(0.38, 0.62, rng());
          const target = hslToRgb(h, s, l);
          return {
            id: uid("hue"),
            type: "color",
            title: "Match the target color",
            prompt: "Select a color as close as possible to the target patch.",
            hint: "Focus on hue first. Saturation and lightness are secondary.",
            target,
            mode: "match",
            tolerance: 0.11, // tuned for linear RGB distance
          };
        },
        (rng) => {
          const h = Math.floor(rng() * 360);
          const target = hslToRgb(h, 0.78, 0.52);
          return {
            id: uid("comp"),
            type: "color",
            title: "Pick complementary",
            prompt: "Select the complementary color (opposite on the wheel).",
            hint: "Complementary ≈ hue + 180° (mod 360).",
            target,
            mode: "complement",
            tolerance: 0.12,
          };
        },
      ],
    },
    {
      id: "shader_math",
      title: "Shader Math",
      description: "Mental math used in shaders and color programming.",
      tasks: [
        () => ({
          id: uid("mix"),
          type: "choice",
          title: "mix()",
          prompt:
            "What is mix( vec3(1,0,0), vec3(0,0,1), 0.25 ) ? (linear space)",
          choices: [
            { id: "a", label: "vec3(0.75, 0.0, 0.25)" },
            { id: "b", label: "vec3(0.25, 0.0, 0.75)" },
            { id: "c", label: "vec3(1.0, 0.0, 0.25)" },
            { id: "d", label: "vec3(0.75, 0.25, 0.0)" },
          ],
          correctChoiceId: "a",
          hint: "mix(a,b,t) = a*(1-t)+b*t",
        }),
        () => ({
          id: uid("gamma"),
          type: "choice",
          title: "Gamma intuition",
          prompt:
            "You brighten an sRGB image by multiplying the stored sRGB value by 2 (clamped). What is the main problem?",
          choices: [
            { id: "a", label: "It is not linear-light; midtones shift incorrectly" },
            { id: "b", label: "It breaks alpha blending only" },
            { id: "c", label: "It only affects red channel" },
            { id: "d", label: "No problem; sRGB is linear" },
          ],
          correctChoiceId: "a",
          hint: "For physically correct ops, convert sRGB → linear first.",
        }),
        () => ({
          id: uid("premul"),
          type: "choice",
          title: "Premultiplied alpha",
          prompt:
            "In premultiplied alpha, what does storing RGB mean?",
          choices: [
            { id: "a", label: "RGB already multiplied by alpha" },
            { id: "b", label: "Alpha multiplied by RGB twice" },
            { id: "c", label: "RGB stores only the 'hidden' color" },
            { id: "d", label: "Alpha is ignored" },
          ],
          correctChoiceId: "a",
        }),
      ],
    },
    {
      id: "gpu_pipeline",
      title: "GPU & Rendering",
      description: "Core facts about pipelines, memory, and performance.",
      tasks: [
        () => ({
          id: uid("stage"),
          type: "choice",
          title: "Pipeline stage",
          prompt: "Texture sampling usually happens in…",
          choices: [
            { id: "a", label: "Fragment/pixel stage" },
            { id: "b", label: "Vertex stage only" },
            { id: "c", label: "CPU" },
            { id: "d", label: "Swapchain present" },
          ],
          correctChoiceId: "a",
        }),
        () => ({
          id: uid("band"),
          type: "choice",
          title: "Bandwidth",
          prompt:
            "Which change most directly reduces GPU memory bandwidth usage for a fullscreen pass?",
          choices: [
            { id: "a", label: "Lower render resolution" },
            { id: "b", label: "Increase anisotropy" },
            { id: "c", label: "Use more texture samples" },
            { id: "d", label: "Increase FPS cap" },
          ],
          correctChoiceId: "a",
        }),
        () => ({
          id: uid("msaa"),
          type: "choice",
          title: "MSAA",
          prompt: "MSAA mainly reduces…",
          choices: [
            { id: "a", label: "Edge aliasing on geometry" },
            { id: "b", label: "Banding in gradients" },
            { id: "c", label: "Texture blurriness" },
            { id: "d", label: "Shader compilation time" },
          ],
          correctChoiceId: "a",
        }),
      ],
    },
    {
      id: "expressions",
      title: "Expressions",
      description: "Write small expressions used in shaders. Live preview included.",
      tasks: [
        () => ({
          id: uid("smooth"),
          type: "expression",
          title: "Smoothstep",
          prompt:
            "Write an expression equivalent to smoothstep(0,1,x) (x in [0..1]). Use only x and basic ops.",
          hint: "Classic polynomial: x*x*(3-2*x)",
          variables: ["x"],
          reference: "smoothstep(0,1,x)",
          samples: [
            { x: 0 },
            { x: 0.1 },
            { x: 0.3 },
            { x: 0.5 },
            { x: 0.8 },
            { x: 1 },
          ],
          tolerance: 1e-3,
          preview: {
            kind: "shader",
            defaults: {
              r: "smoothstep(0.1,0.9,uvx)",
              g: "smoothstep(0.1,0.9,uvy)",
              b: "0.5+0.5*sin(time)",
            },
          },
        }),
        () => ({
          id: uid("pulse"),
          type: "expression",
          title: "Pulse",
          prompt:
            "Write an expression for a 0..1 oscillation over time with period ~2π. Use time.",
          hint: "0.5 + 0.5*sin(time)",
          variables: ["time"],
          reference: "0.5+0.5*sin(time)",
          samples: [
            { time: 0 },
            { time: Math.PI / 2 },
            { time: Math.PI },
            { time: (3 * Math.PI) / 2 },
            { time: 2 * Math.PI },
          ],
          tolerance: 1e-3,
        }),
      ],
    },
    {
      id: "ui_principles",
      title: "UI Principles",
      description: "Small factual checks for UI/UX and accessibility.",
      tasks: [
        () => ({
          id: uid("contrast"),
          type: "choice",
          title: "Contrast",
          prompt: "For body text on a solid background, what is a common minimum contrast ratio target?",
          choices: [
            { id: "a", label: "4.5:1" },
            { id: "b", label: "2:1" },
            { id: "c", label: "1:1" },
            { id: "d", label: "10:1 always" },
          ],
          correctChoiceId: "a",
          hint: "WCAG AA for normal text is 4.5:1.",
        }),
        () => ({
          id: uid("fitts"),
          type: "text",
          title: "Law",
          prompt: "Name the law: " +
            "Time to acquire a target depends on distance and target size.",
          expected: "fitts law",
          normalize: normalizeText,
          hint: "Two words. Starts with F.",
        }),
      ],
    },
  ];

  return games;
}

// -----------------------------
// UI primitives (minimal)
// -----------------------------

function Btn({
  children,
  onClick,
  disabled,
  variant = "solid",
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "solid" | "ghost";
  title?: string;
}) {
  const base: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--dg-border)",
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
    background:
      variant === "solid" ? "var(--dg-accent)" : "transparent",
    color: variant === "solid" ? "var(--dg-accent-ink)" : "var(--dg-fg)",
    opacity: disabled ? 0.5 : 1,
    userSelect: "none",
  };
  return (
    <button type="button" title={title} style={base} onClick={disabled ? undefined : onClick}>
      {children}
    </button>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid var(--dg-border)",
        background: "var(--dg-surface-2)",
        fontSize: 12,
        color: "var(--dg-muted)",
      }}
    >
      {children}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid var(--dg-border)",
        borderRadius: 16,
        background: "var(--dg-surface)",
        padding: 14,
      }}
    >
      {children}
    </div>
  );
}

function Sep() {
  return (
    <div
      style={{
        height: 1,
        background: "var(--dg-border)",
        opacity: 0.9,
        margin: "12px 0",
      }}
    />
  );
}

// -----------------------------
// Color wheel
// -----------------------------

function ColorWheel({
  value,
  onChange,
  size = 220,
}: {
  value: RGB;
  onChange: (rgb: RGB) => void;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { h } = rgbToHsl(value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2;
    const cy = size / 2;
    const rOuter = size * 0.46;
    const rInner = size * 0.30;

    ctx.clearRect(0, 0, size, size);

    // Draw hue ring
    const steps = 360;
    for (let i = 0; i < steps; i++) {
      const a0 = (i * Math.PI) / 180;
      const a1 = ((i + 1) * Math.PI) / 180;

      ctx.beginPath();
      ctx.arc(cx, cy, rOuter, a0, a1);
      ctx.arc(cx, cy, rInner, a1, a0, true);
      ctx.closePath();

      const col = hslToRgb(i, 1, 0.5);
      ctx.fillStyle = `rgb(${col.r},${col.g},${col.b})`;
      ctx.fill();
    }

    // Center area (shows selected color)
    ctx.beginPath();
    ctx.arc(cx, cy, rInner - 8, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = `rgb(${value.r},${value.g},${value.b})`;
    ctx.fill();

    // Marker
    const ang = ((h - 90) * Math.PI) / 180;
    const mx = cx + Math.cos(ang) * ((rOuter + rInner) / 2);
    const my = cy + Math.sin(ang) * ((rOuter + rInner) / 2);
    ctx.beginPath();
    ctx.arc(mx, my, 6, 0, Math.PI * 2);
    ctx.closePath();
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fill();
  }, [value, size, h]);

  function pick(e: React.MouseEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const rOuter = rect.width * 0.46;
    const rInner = rect.width * 0.30;

    if (dist < rInner - 8) {
      // inside center: keep hue, adjust lightness by radius
      const k = clamp(dist / (rInner - 8));
      const { h, s } = rgbToHsl(value);
      const l = lerp(0.15, 0.85, 1 - k);
      onChange(hslToRgb(h, Math.max(0.25, s), l));
      return;
    }

    if (dist < rInner || dist > rOuter) return;

    const ang = Math.atan2(dy, dx);
    const deg = ((ang * 180) / Math.PI + 90 + 360) % 360;
    const { s, l } = rgbToHsl(value);
    onChange(hslToRgb(deg, Math.max(0.6, s), Math.max(0.45, Math.min(0.6, l))));
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <canvas
        ref={canvasRef}
        onMouseDown={pick}
        style={{
          borderRadius: 18,
          border: "1px solid var(--dg-border)",
          background: "var(--dg-surface-2)",
          cursor: "crosshair",
        }}
      />
    </div>
  );
}

// -----------------------------
// Shader-like preview
// -----------------------------

function ShaderPreview({
  rExpr,
  gExpr,
  bExpr,
  size = 220,
}: {
  rExpr: string;
  gExpr: string;
  bExpr: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 120;
    const H = 120;
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let rFn: ((v: Record<string, number>) => number) | null = null;
    let gFn: ((v: Record<string, number>) => number) | null = null;
    let bFn: ((v: Record<string, number>) => number) | null = null;

    try {
      rFn = compileExpression(rExpr);
      gFn = compileExpression(gExpr);
      bFn = compileExpression(bExpr);
    } catch {
      // keep nulls
    }

    const img = ctx.createImageData(W, H);
    const data = img.data;

    const start = performance.now();

    const draw = () => {
      const t = (performance.now() - start) / 1000;

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const uvx = x / (W - 1);
          const uvy = y / (H - 1);
          const vars = { uvx, uvy, time: t, pi: Math.PI, e: Math.E };

          let rr = 0,
            gg = 0,
            bb = 0;
          try {
            rr = rFn ? rFn(vars) : 0;
            gg = gFn ? gFn(vars) : 0;
            bb = bFn ? bFn(vars) : 0;
          } catch {
            rr = 0;
            gg = 0;
            bb = 0;
          }
          rr = clamp(rr);
          gg = clamp(gg);
          bb = clamp(bb);

          const i = (y * W + x) * 4;
          data[i + 0] = Math.round(rr * 255);
          data[i + 1] = Math.round(gg * 255);
          data[i + 2] = Math.round(bb * 255);
          data[i + 3] = 255;
        }
      }

      ctx.putImageData(img, 0, 0);
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [rExpr, gExpr, bExpr, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        borderRadius: 16,
        border: "1px solid var(--dg-border)",
        background: "var(--dg-surface-2)",
        imageRendering: "pixelated",
      }}
    />
  );
}

// -----------------------------
// Main component
// -----------------------------

export default function DesignGym({
  games: gamesProp,
  storageKey = "design_gym_v1",
  initialGameId,
  onEvent,
}: Props) {
  const games = useMemo(() => gamesProp ?? defaultGames(), [gamesProp]);

  // persisted
  const persisted = useMemo(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [storageKey]);

  const [seed, setSeed] = useState<number>(() => persisted?.seed ?? Date.now());
  const rng = useMemo(() => mulberry32(seed), [seed]);

  const [activeGameId, setActiveGameId] = useState<string>(() => {
    return (
      initialGameId ??
      persisted?.activeGameId ??
      games[0]?.id ??
      "color_hue"
    );
  });

  const activeGame = useMemo(
    () => games.find((g) => g.id === activeGameId) ?? games[0],
    [games, activeGameId]
  );

  const [taskIndex, setTaskIndex] = useState<number>(() => persisted?.taskIndex ?? 0);
  const [score, setScore] = useState<number>(() => persisted?.score ?? 0);
  const [streak, setStreak] = useState<number>(() => persisted?.streak ?? 0);

  const [question, setQuestion] = useState<Question | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [feedback, setFeedback] = useState<string>("");

  // inputs
  const [choiceId, setChoiceId] = useState<string>("");
  const [textValue, setTextValue] = useState<string>("");
  const [numValue, setNumValue] = useState<string>("");
  const [pickedColor, setPickedColor] = useState<RGB>({ r: 255, g: 0, b: 0 });

  // expression inputs
  const [exprValue, setExprValue] = useState<string>("");
  const [shaderR, setShaderR] = useState<string>("smoothstep(0.1,0.9,uvx)");
  const [shaderG, setShaderG] = useState<string>("smoothstep(0.1,0.9,uvy)");
  const [shaderB, setShaderB] = useState<string>("0.5+0.5*sin(time)");

  // Save
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          seed,
          activeGameId,
          taskIndex,
          score,
          streak,
        })
      );
    } catch {
      // ignore
    }
  }, [storageKey, seed, activeGameId, taskIndex, score, streak]);

  // Load question
  useEffect(() => {
    if (!activeGame) return;
    const idx = ((taskIndex % activeGame.tasks.length) + activeGame.tasks.length) % activeGame.tasks.length;
    const q = activeGame.tasks[idx](rng);
    setQuestion(q);
    setStatus("idle");
    setFeedback("");

    // reset inputs
    setChoiceId("");
    setTextValue("");
    setNumValue("");
    setExprValue("");

    if (q.type === "color") {
      setPickedColor({ r: 255, g: 0, b: 0 });
    }

    if (q.type === "expression" && q.preview?.kind === "shader") {
      setShaderR(q.preview.defaults.r);
      setShaderG(q.preview.defaults.g);
      setShaderB(q.preview.defaults.b);
    }

    onEvent?.({ type: "question_loaded", payload: { gameId: activeGame.id, questionId: q.id } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGameId, taskIndex, seed]);

  function goNext() {
    setTaskIndex((x) => x + 1);
  }

  function resetRun() {
    setSeed(Date.now());
    setTaskIndex(0);
    setScore(0);
    setStreak(0);
    onEvent?.({ type: "reset" });
  }

  function pickWithEyeDropper() {
    // Chromium EyeDropper API
    const anyWin = window as any;
    if (!anyWin.EyeDropper) {
      setFeedback("EyeDropper API not available in this browser.");
      return;
    }
    const ed = new anyWin.EyeDropper();
    ed.open()
      .then((res: { sRGBHex: string }) => {
        const rgb = hexToRgb(res.sRGBHex);
        if (rgb) setPickedColor(rgb);
      })
      .catch(() => {
        // user cancelled
      });
  }

  function evaluate(): { ok: boolean; note: string } {
    if (!question) return { ok: false, note: "No question" };

    if (question.type === "choice") {
      const ok = choiceId === question.correctChoiceId;
      const correctLabel =
        question.choices.find((c) => c.id === question.correctChoiceId)?.label ?? "";
      return {
        ok,
        note: ok ? "Correct." : `Wrong. Correct: ${correctLabel}`,
      };
    }

    if (question.type === "text") {
      const norm = question.normalize ?? normalizeText;
      const ok = norm(textValue) === norm(question.expected);
      return {
        ok,
        note: ok ? "Correct." : `Wrong. Expected: ${question.expected}`,
      };
    }

    if (question.type === "number") {
      const v = Number(numValue);
      if (Number.isNaN(v)) return { ok: false, note: "Enter a number." };
      const tol = question.tolerance ?? 1e-6;
      const ok = Math.abs(v - question.expected) <= tol;
      return {
        ok,
        note: ok ? "Correct." : `Wrong. Expected: ${question.expected}`,
      };
    }

    if (question.type === "color") {
      const tol = question.tolerance ?? 0.12;
      let expected = question.target;
      if (question.mode === "complement") {
        const hsl = rgbToHsl(question.target);
        expected = hslToRgb((hsl.h + 180) % 360, hsl.s, hsl.l);
      }
      const dist = linearRgbDistance(pickedColor, expected);
      const ok = dist <= tol;

      const tHex = rgbToHex(question.target);
      const eHex = rgbToHex(expected);
      return {
        ok,
        note:
          question.mode === "match"
            ? `Distance: ${dist.toFixed(3)} (target ${tHex})`
            : `Distance: ${dist.toFixed(3)} (expected complement ${eHex})`,
      };
    }

    if (question.type === "expression") {
      const tol = question.tolerance ?? 1e-3;
      let userFn: (vars: Record<string, number>) => number;
      let refFn: (vars: Record<string, number>) => number;
      try {
        userFn = compileExpression(exprValue);
      } catch (e: any) {
        return { ok: false, note: `Parse error in your expression.` };
      }
      try {
        refFn = compileExpression(question.reference);
      } catch {
        return { ok: false, note: "Internal: reference parse error." };
      }

      // Evaluate on samples
      let maxErr = 0;
      for (const s of question.samples) {
        const vars: Record<string, number> = {};
        for (const k of question.variables) vars[k] = s[k] ?? 0;
        const y1 = userFn(vars);
        const y2 = refFn(vars);
        maxErr = Math.max(maxErr, Math.abs(y1 - y2));
      }
      const ok = maxErr <= tol;
      return {
        ok,
        note: ok
          ? `Correct. max error = ${maxErr.toExponential(2)}`
          : `Wrong. max error = ${maxErr.toExponential(2)} (tol ${tol})`,
      };
    }

    return { ok: false, note: "Unsupported question" };
  }

  function submit() {
    if (!question) return;
    const { ok, note } = evaluate();
    setStatus(ok ? "correct" : "wrong");
    setFeedback(note);

    if (ok) {
      setScore((x) => x + 1);
      setStreak((x) => x + 1);
    } else {
      setStreak(0);
    }

    onEvent?.({
      type: "submitted",
      payload: { gameId: activeGameId, questionId: question.id, ok },
    });
  }

  // Derived UI
  const statusColor =
    status === "correct"
      ? "rgba(28, 180, 90, 0.12)"
      : status === "wrong"
      ? "rgba(230, 80, 80, 0.12)"
      : "transparent";

  const statusBorder =
    status === "correct"
      ? "rgba(28, 180, 90, 0.35)"
      : status === "wrong"
      ? "rgba(230, 80, 80, 0.35)"
      : "var(--dg-border)";

  const progressText = `${(taskIndex % (activeGame?.tasks.length ?? 1)) + 1}/${
    activeGame?.tasks.length ?? 1
  }`;

  return (
    <div
      style={
        {
          // Theme via CSS variables; easy to override from host app
          "--dg-bg": "#0b0d10",
          "--dg-surface": "#10141a",
          "--dg-surface-2": "#0d1116",
          "--dg-fg": "#e9eef7",
          "--dg-muted": "rgba(233,238,247,0.7)",
          "--dg-border": "rgba(233,238,247,0.14)",
          "--dg-accent": "#e9eef7",
          "--dg-accent-ink": "#0b0d10",
        } as React.CSSProperties
      }
    >
      <div
        style={{
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          background: "var(--dg-bg)",
          color: "var(--dg-fg)",
          border: "1px solid var(--dg-border)",
          borderRadius: 18,
          padding: 14,
          display: "grid",
          gap: 12,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 2 }}>
            <div style={{ fontSize: 14, fontWeight: 650, letterSpacing: 0.2 }}>
              DesignGym
            </div>
            <div style={{ fontSize: 12, color: "var(--dg-muted)" }}>
              Micro-games for CG + UI designers
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <Pill>Score: {score}</Pill>
          <Pill>Streak: {streak}</Pill>
          <Pill>Task: {progressText}</Pill>
          <Btn variant="ghost" onClick={resetRun} title="New random seed">
            Reset
          </Btn>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr 300px",
            gap: 12,
          }}
        >
          {/* Left nav */}
          <Card>
            <div style={{ fontSize: 12, color: "var(--dg-muted)", marginBottom: 10 }}>
              Games
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {games.map((g) => {
                const active = g.id === activeGameId;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setActiveGameId(g.id);
                      setTaskIndex(0);
                      setStatus("idle");
                      setFeedback("");
                      onEvent?.({ type: "game_changed", payload: { gameId: g.id } });
                    }}
                    style={{
                      textAlign: "left",
                      padding: "10px 10px",
                      borderRadius: 14,
                      border: `1px solid ${active ? "rgba(233,238,247,0.28)" : "var(--dg-border)"}`,
                      background: active ? "rgba(233,238,247,0.08)" : "transparent",
                      color: "var(--dg-fg)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 650 }}>{g.title}</div>
                    <div style={{ fontSize: 12, color: "var(--dg-muted)", marginTop: 4 }}>
                      {g.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Main */}
          <div style={{ display: "grid", gap: 12 }}>
            <Card>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 650 }}>
                    {question?.title ?? "—"}
                  </div>
                  <div style={{ flex: 1 }} />
                  {question?.hint ? <Pill>Hint: {question.hint}</Pill> : null}
                </div>
                <div style={{ fontSize: 13, color: "var(--dg-muted)" }}>
                  {question?.prompt ?? ""}
                </div>
              </div>
              <Sep />

              {/* Question body */}
              <div
                style={{
                  border: `1px solid ${statusBorder}`,
                  borderRadius: 14,
                  background: statusColor,
                  padding: 12,
                  display: "grid",
                  gap: 10,
                }}
              >
                {question?.type === "choice" ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    {question.choices.map((c) => {
                      const selected = choiceId === c.id;
                      return (
                        <label
                          key={c.id}
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            padding: "10px 10px",
                            borderRadius: 12,
                            border: `1px solid ${selected ? "rgba(233,238,247,0.28)" : "var(--dg-border)"}`,
                            background: selected ? "rgba(233,238,247,0.08)" : "transparent",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="radio"
                            name="dg_choice"
                            checked={selected}
                            onChange={() => setChoiceId(c.id)}
                          />
                          <span style={{ fontSize: 13 }}>{c.label}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}

                {question?.type === "text" ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    <input
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      placeholder="Type your answer"
                      style={inputStyle()}
                    />
                  </div>
                ) : null}

                {question?.type === "number" ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    <input
                      value={numValue}
                      onChange={(e) => setNumValue(e.target.value)}
                      placeholder="Type a number"
                      inputMode="decimal"
                      style={inputStyle()}
                    />
                  </div>
                ) : null}

                {question?.type === "color" ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Pill>
                        Target: <span style={{ fontFamily: "ui-monospace" }}>{rgbToHex(question.target)}</span>
                      </Pill>
                      <Pill>
                        Picked: <span style={{ fontFamily: "ui-monospace" }}>{rgbToHex(pickedColor)}</span>
                      </Pill>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                      <ColorWheel value={pickedColor} onChange={setPickedColor} />
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <input
                          type="color"
                          value={rgbToHex(pickedColor)}
                          onChange={(e) => {
                            const rgb = hexToRgb(e.target.value);
                            if (rgb) setPickedColor(rgb);
                          }}
                          style={{
                            width: 54,
                            height: 36,
                            padding: 0,
                            borderRadius: 10,
                            border: "1px solid var(--dg-border)",
                            background: "transparent",
                          }}
                          title="Fallback color picker"
                        />
                        <Btn variant="ghost" onClick={pickWithEyeDropper}>
                          Pick from screen
                        </Btn>
                        <span style={{ fontSize: 12, color: "var(--dg-muted)" }}>
                          (EyeDropper works in Chromium-based browsers)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {question?.type === "expression" ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ fontSize: 12, color: "var(--dg-muted)" }}>
                        Variables: <span style={{ fontFamily: "ui-monospace" }}>{question.variables.join(", ")}</span>
                      </div>
                      <textarea
                        value={exprValue}
                        onChange={(e) => setExprValue(e.target.value)}
                        placeholder="Write an expression, e.g. x*x*(3-2*x)"
                        rows={3}
                        style={{
                          ...inputStyle(),
                          resize: "vertical",
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                          lineHeight: 1.35,
                        }}
                      />
                      <div style={{ fontSize: 12, color: "var(--dg-muted)" }}>
                        Allowed: + - * / ^, (), variables, and functions: clamp, mix, step, smoothstep, abs, min, max, sin, cos, tan, pow, sqrt, floor, ceil, fract, mod.
                      </div>
                    </div>

                    {question.preview?.kind === "shader" ? (
                      <div style={{ display: "grid", gap: 10 }}>
                        <Sep />
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <div style={{ fontSize: 13, fontWeight: 650 }}>Live preview</div>
                          <Pill>
                            vars: <span style={{ fontFamily: "ui-monospace" }}>uvx, uvy, time</span>
                          </Pill>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                          <div style={{ display: "grid", gap: 8 }}>
                            <LabeledInput label="R" value={shaderR} onChange={setShaderR} />
                            <LabeledInput label="G" value={shaderG} onChange={setShaderG} />
                            <LabeledInput label="B" value={shaderB} onChange={setShaderB} />
                          </div>
                          <ShaderPreview rExpr={shaderR} gExpr={shaderG} bExpr={shaderB} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Actions */}
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <Btn onClick={submit} disabled={!question}>
                    Submit
                  </Btn>
                  <Btn variant="ghost" onClick={goNext}>
                    Next
                  </Btn>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 12, color: "var(--dg-muted)" }}>{feedback}</span>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 650 }}>Notes</div>
                <div style={{ flex: 1 }} />
                <Pill>{activeGame?.id}</Pill>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--dg-muted)", lineHeight: 1.5 }}>
                Add your own games by passing a custom <span style={{ fontFamily: "ui-monospace" }}>games</span> prop.
                Each game is just an array of task factories returning typed questions.
              </div>
            </Card>
          </div>

          {/* Right preview */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 650 }}>Preview</div>
              <div style={{ flex: 1 }} />
              <Pill>Minimal</Pill>
            </div>
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              {/* Preview shows relevant content depending on question */}
              {question?.type === "color" ? (
                <>
                  <PreviewSwatch label="Target" rgb={question.target} />
                  <PreviewSwatch label="Picked" rgb={pickedColor} />
                  <Sep />
                  <ContrastMini target={question.target} picked={pickedColor} />
                </>
              ) : null}

              {question?.type === "choice" ? (
                <div style={{ fontSize: 12, color: "var(--dg-muted)", lineHeight: 1.5 }}>
                  Train for speed and certainty: pick fast, then validate.
                </div>
              ) : null}

              {question?.type === "expression" ? (
                <div style={{ fontSize: 12, color: "var(--dg-muted)", lineHeight: 1.5 }}>
                  Expressions are graded against multiple samples. Aim for functional equivalence.
                </div>
              ) : null}

              {question?.type === "text" || question?.type === "number" ? (
                <div style={{ fontSize: 12, color: "var(--dg-muted)", lineHeight: 1.5 }}>
                  Keep answers short. Prefer canonical terminology.
                </div>
              ) : null}

              {!question ? (
                <div style={{ fontSize: 12, color: "var(--dg-muted)" }}>No question loaded.</div>
              ) : null}
            </div>
          </Card>
        </div>

        {/* Responsive fallback */}
        <style>{`
          @media (max-width: 980px) {
            .dg-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid var(--dg-border)",
    background: "rgba(255,255,255,0.04)",
    color: "var(--dg-fg)",
    outline: "none",
    fontSize: 13,
  };
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, color: "var(--dg-muted)" }}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...inputStyle(),
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        }}
        placeholder={`${label} expression`}
      />
    </label>
  );
}

function PreviewSwatch({ label, rgb }: { label: string; rgb: RGB }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 12, color: "var(--dg-muted)" }}>{label}</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, color: "var(--dg-muted)", fontFamily: "ui-monospace" }}>
          {rgbToHex(rgb)}
        </div>
      </div>
      <div
        style={{
          height: 46,
          borderRadius: 14,
          border: "1px solid var(--dg-border)",
          background: `rgb(${rgb.r},${rgb.g},${rgb.b})`,
        }}
      />
    </div>
  );
}

function relativeLuminance(rgb: RGB) {
  // WCAG relative luminance in linear space
  const R = rgbLin(rgb.r);
  const G = rgbLin(rgb.g);
  const B = rgbLin(rgb.b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(a: RGB, b: RGB) {
  const L1 = relativeLuminance(a);
  const L2 = relativeLuminance(b);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

function ContrastMini({ target, picked }: { target: RGB; picked: RGB }) {
  const bg: RGB = { r: 16, g: 20, b: 26 };
  const crTarget = contrastRatio(target, bg);
  const crPicked = contrastRatio(picked, bg);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontSize: 12, color: "var(--dg-muted)" }}>Contrast vs dark UI bg</div>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, color: "var(--dg-muted)" }}>Target</div>
          <Bar value={crTarget} />
          <div style={{ fontSize: 12, fontFamily: "ui-monospace", color: "var(--dg-muted)" }}>
            {crTarget.toFixed(2)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, color: "var(--dg-muted)" }}>Picked</div>
          <Bar value={crPicked} />
          <div style={{ fontSize: 12, fontFamily: "ui-monospace", color: "var(--dg-muted)" }}>
            {crPicked.toFixed(2)}
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--dg-muted)",
          lineHeight: 1.5,
        }}
      >
        Reference: 4.5:1 for normal text (WCAG AA).
      </div>
    </div>
  );
}

function Bar({ value }: { value: number }) {
  // Map 1..10+ to 0..1
  const t = clamp((value - 1) / 9);
  return (
    <div
      style={{
        flex: 1,
        height: 10,
        borderRadius: 999,
        border: "1px solid var(--dg-border)",
        background: "rgba(255,255,255,0.04)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.round(t * 100)}%`,
          height: "100%",
          background: "rgba(233,238,247,0.55)",
        }}
      />
    </div>
  );
}
