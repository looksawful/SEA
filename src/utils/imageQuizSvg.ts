import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from "@/utils/colors";

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const svgDataUrl = (svg: string): string => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const round = (value: number): number => Math.round(value);

export const makeColorSampleSvg = (color: string, width = 1200, height = 900): string => {
  const frameX = round(width * 0.06);
  const frameY = round(height * 0.08);
  const frameW = width - frameX * 2;
  const frameH = height - frameY * 2;
  const sampleW = round(frameW * 0.6);
  const sampleH = round(frameH * 0.6);
  const sampleX = round((width - sampleW) / 2);
  const sampleY = round((height - sampleH) / 2);

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#f8fafc"/>
  <rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" rx="28" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
  <rect x="${sampleX}" y="${sampleY}" width="${sampleW}" height="${sampleH}" rx="24" fill="${color}" stroke="#0f172a" stroke-width="6"/>
</svg>`;

  return svgDataUrl(svg);
};

export const makePaletteSvg = (palette: string[], width = 1200, height = 800): string => {
  const colors = palette.slice(0, 3);
  const [c1, c2, c3] = [colors[0] ?? "#94a3b8", colors[1] ?? "#64748b", colors[2] ?? "#475569"];
  const frameX = round(width * 0.05);
  const frameY = round(height * 0.08);
  const frameW = width - frameX * 2;
  const frameH = height - frameY * 2;
  const innerX = frameX + 12;
  const innerY = frameY + 12;
  const innerW = frameW - 24;
  const innerH = frameH - 24;
  const skyH = round(innerH * 0.45);
  const midH = round(innerH * 0.3);
  const groundH = innerH - skyH - midH;

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#f8fafc"/>
  <rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" rx="28" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
  <rect x="${innerX}" y="${innerY}" width="${innerW}" height="${skyH}" fill="${c1}"/>
  <rect x="${innerX}" y="${innerY + skyH}" width="${innerW}" height="${midH}" fill="${c2}"/>
  <rect x="${innerX}" y="${innerY + skyH + midH}" width="${innerW}" height="${groundH}" fill="${c3}"/>
</svg>`;

  return svgDataUrl(svg);
};

export type CompositionType =
  | "thirds"
  | "center"
  | "diagonal"
  | "leading-lines"
  | "symmetry"
  | "negative-space"
  | "repetition"
  | "framing"
  | "depth"
  | "s-curve"
  | "pattern"
  | "silhouette"
  | "perspective";

export const makeCompositionSvg = (type: CompositionType, width = 1200, height = 800): string => {
  const frameX = round(width * 0.08);
  const frameY = round(height * 0.1);
  const frameW = width - frameX * 2;
  const frameH = height - frameY * 2;
  const cx = round(frameX + frameW / 2);
  const cy = round(frameY + frameH / 2);
  const accent = "#0ea5e9";
  const dark = "#0f172a";
  const muted = "#94a3b8";
  const faint = "#cbd5e1";

  let content = "";

  switch (type) {
    case "thirds": {
      const x1 = round(frameX + frameW / 3);
      const x2 = round(frameX + (frameW * 2) / 3);
      const y1 = round(frameY + frameH / 3);
      const y2 = round(frameY + (frameH * 2) / 3);
      content += `<line x1="${x1}" y1="${frameY}" x2="${x1}" y2="${frameY + frameH}" stroke="${faint}" stroke-width="3"/>`;
      content += `<line x1="${x2}" y1="${frameY}" x2="${x2}" y2="${frameY + frameH}" stroke="${faint}" stroke-width="3"/>`;
      content += `<line x1="${frameX}" y1="${y1}" x2="${frameX + frameW}" y2="${y1}" stroke="${faint}" stroke-width="3"/>`;
      content += `<line x1="${frameX}" y1="${y2}" x2="${frameX + frameW}" y2="${y2}" stroke="${faint}" stroke-width="3"/>`;
      content += `<circle cx="${x1}" cy="${y1}" r="18" fill="${accent}"/>`;
      break;
    }
    case "center": {
      content += `<circle cx="${cx}" cy="${cy}" r="70" fill="${accent}"/>`;
      content += `<circle cx="${cx}" cy="${cy}" r="110" fill="none" stroke="${faint}" stroke-width="4"/>`;
      break;
    }
    case "diagonal": {
      const x1 = round(frameX + frameW * 0.15);
      const y1 = round(frameY + frameH * 0.85);
      const x2 = round(frameX + frameW * 0.85);
      const y2 = round(frameY + frameH * 0.15);
      content += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>`;
      content += `<rect x="${cx - 50}" y="${cy - 30}" width="100" height="60" fill="${dark}" transform="rotate(-35 ${cx} ${cy})" rx="10"/>`;
      break;
    }
    case "leading-lines": {
      const targetX = cx;
      const targetY = round(frameY + frameH * 0.2);
      const steps = 4;
      for (let i = 0; i < steps; i += 1) {
        const offset = i * 40;
        content += `<line x1="${frameX + offset}" y1="${frameY + frameH}" x2="${targetX}" y2="${targetY}" stroke="${faint}" stroke-width="4"/>`;
        content += `<line x1="${frameX + frameW - offset}" y1="${frameY + frameH}" x2="${targetX}" y2="${targetY}" stroke="${faint}" stroke-width="4"/>`;
      }
      content += `<circle cx="${targetX}" cy="${targetY}" r="20" fill="${accent}"/>`;
      break;
    }
    case "symmetry": {
      content += `<line x1="${cx}" y1="${frameY}" x2="${cx}" y2="${frameY + frameH}" stroke="${faint}" stroke-width="3"/>`;
      content += `<rect x="${cx - 220}" y="${cy - 120}" width="160" height="240" rx="18" fill="${muted}"/>`;
      content += `<rect x="${cx + 60}" y="${cy - 120}" width="160" height="240" rx="18" fill="${muted}"/>`;
      content += `<circle cx="${cx}" cy="${cy - 140}" r="24" fill="${accent}"/>`;
      break;
    }
    case "negative-space": {
      content += `<rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" fill="none"/>`;
      content += `<circle cx="${frameX + frameW * 0.2}" cy="${frameY + frameH * 0.75}" r="28" fill="${accent}"/>`;
      break;
    }
    case "repetition": {
      const count = 7;
      const gap = frameW * 0.04;
      const barW = (frameW - gap * (count + 1)) / count;
      const barH = frameH * 0.7;
      const startY = frameY + frameH * 0.15;
      for (let i = 0; i < count; i += 1) {
        const x = frameX + gap + i * (barW + gap);
        content += `<rect x="${round(x)}" y="${round(startY)}" width="${round(barW)}" height="${round(barH)}" rx="10" fill="${muted}"/>`;
      }
      break;
    }
    case "framing": {
      const innerX = round(frameX + frameW * 0.15);
      const innerY = round(frameY + frameH * 0.18);
      const innerW = round(frameW * 0.7);
      const innerH = round(frameH * 0.64);
      content += `<rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" fill="none" stroke="${dark}" stroke-width="10" rx="18"/>`;
      content += `<circle cx="${cx}" cy="${cy}" r="50" fill="${accent}"/>`;
      break;
    }
    case "depth": {
      content += `<rect x="${frameX + 60}" y="${frameY + 140}" width="${frameW - 120}" height="${frameH - 280}" rx="20" fill="#cbd5f5"/>`;
      content += `<rect x="${frameX + 120}" y="${frameY + 220}" width="${frameW - 240}" height="${frameH - 360}" rx="20" fill="#94a3b8"/>`;
      content += `<rect x="${frameX + 200}" y="${frameY + 300}" width="${frameW - 400}" height="${frameH - 440}" rx="20" fill="${dark}"/>`;
      break;
    }
    case "s-curve": {
      const path = `M ${frameX + frameW * 0.2} ${frameY + frameH * 0.2} C ${frameX + frameW * 0.45} ${frameY + frameH * 0.1}, ${frameX + frameW * 0.55} ${frameY + frameH * 0.9}, ${frameX + frameW * 0.8} ${frameY + frameH * 0.8}`;
      content += `<path d="${path}" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>`;
      break;
    }
    case "pattern": {
      const rows = 4;
      const cols = 6;
      const cellW = frameW / (cols + 1);
      const cellH = frameH / (rows + 1);
      for (let row = 1; row <= rows; row += 1) {
        for (let col = 1; col <= cols; col += 1) {
          const x = frameX + col * cellW;
          const y = frameY + row * cellH;
          content += `<circle cx="${round(x)}" cy="${round(y)}" r="14" fill="${muted}"/>`;
        }
      }
      break;
    }
    case "silhouette": {
      const sunX = round(frameX + frameW * 0.7);
      const sunY = round(frameY + frameH * 0.3);
      content += `<circle cx="${sunX}" cy="${sunY}" r="60" fill="#f8fafc" stroke="#e2e8f0" stroke-width="6"/>`;
      const hillPath = `M ${frameX} ${frameY + frameH} Q ${cx} ${frameY + frameH * 0.45} ${frameX + frameW} ${frameY + frameH} Z`;
      content += `<path d="${hillPath}" fill="${dark}"/>`;
      break;
    }
    case "perspective": {
      const vpX = cx;
      const vpY = round(frameY + frameH * 0.2);
      const baseY = frameY + frameH;
      content += `<line x1="${frameX}" y1="${baseY}" x2="${vpX}" y2="${vpY}" stroke="${faint}" stroke-width="4"/>`;
      content += `<line x1="${frameX + frameW}" y1="${baseY}" x2="${vpX}" y2="${vpY}" stroke="${faint}" stroke-width="4"/>`;
      for (let i = 1; i <= 4; i += 1) {
        const y = round(frameY + (frameH * i) / 5);
        content += `<line x1="${frameX + 80}" y1="${y}" x2="${frameX + frameW - 80}" y2="${y}" stroke="${faint}" stroke-width="3"/>`;
      }
      content += `<circle cx="${vpX}" cy="${vpY}" r="16" fill="${accent}"/>`;
      break;
    }
    default:
      break;
  }

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#f8fafc"/>
  <rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" rx="28" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
  ${content}
</svg>`;

  return svgDataUrl(svg);
};

export const fovForFocalLength = (focalLength: number, sensorWidth = 36): number => {
  const radians = 2 * Math.atan(sensorWidth / (2 * focalLength));
  return Math.round((radians * 180) / Math.PI);
};

export const makeFovSvg = (angle: number, width = 1200, height = 800): string => {
  const frameX = round(width * 0.08);
  const frameY = round(height * 0.1);
  const frameW = width - frameX * 2;
  const frameH = height - frameY * 2;
  const centerX = round(width / 2);
  const camY = round(frameY + frameH * 0.78);
  const topY = round(frameY + frameH * 0.15);
  const halfRad = (angle / 2) * (Math.PI / 180);
  const dx = Math.tan(halfRad) * (camY - topY);
  const leftX = round(centerX - dx);
  const rightX = round(centerX + dx);

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#f8fafc"/>
  <rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" rx="28" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
  <polygon points="${centerX},${camY} ${leftX},${topY} ${rightX},${topY}" fill="#0ea5e9" fill-opacity="0.18"/>
  <line x1="${centerX}" y1="${camY}" x2="${leftX}" y2="${topY}" stroke="#0ea5e9" stroke-width="5"/>
  <line x1="${centerX}" y1="${camY}" x2="${rightX}" y2="${topY}" stroke="#0ea5e9" stroke-width="5"/>
  <rect x="${centerX - 60}" y="${camY}" width="120" height="40" rx="8" fill="#0f172a"/>
  <circle cx="${centerX}" cy="${camY + 20}" r="14" fill="#f8fafc"/>
</svg>`;

  return svgDataUrl(svg);
};

type FilmProfileName =
  | "ilford-hp5"
  | "kodak-trix"
  | "velvia"
  | "ektar"
  | "portra"
  | "gold"
  | "pro400h"
  | "cinestill"
  | "superia";

const FILM_PROFILES: Record<FilmProfileName, { hueShift: number; sat: number; light: number; contrast: number; bw?: boolean }> = {
  "ilford-hp5": { hueShift: 0, sat: -100, light: 0, contrast: 0.12, bw: true },
  "kodak-trix": { hueShift: 0, sat: -100, light: -5, contrast: 0.28, bw: true },
  velvia: { hueShift: -6, sat: 26, light: -2, contrast: 0.2 },
  ektar: { hueShift: 4, sat: 20, light: 0, contrast: 0.15 },
  portra: { hueShift: 8, sat: -10, light: 6, contrast: -0.08 },
  gold: { hueShift: 12, sat: 6, light: 6, contrast: -0.05 },
  pro400h: { hueShift: -8, sat: -22, light: 8, contrast: -0.1 },
  cinestill: { hueShift: -14, sat: 12, light: 0, contrast: 0.12 },
  superia: { hueShift: -10, sat: 8, light: 0, contrast: 0.05 },
};

const adjustContrast = (lightness: number, contrast: number): number =>
  clamp(50 + (lightness - 50) * (1 + contrast), 0, 100);

const applyFilmProfile = (hex: string, profile: FilmProfileName): string => {
  const rgb = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const settings = FILM_PROFILES[profile];
  const hue = settings.bw ? 0 : (h + settings.hueShift + 360) % 360;
  const sat = settings.bw ? 0 : clamp(s + settings.sat, 0, 100);
  const light = adjustContrast(clamp(l + settings.light, 0, 100), settings.contrast);
  const { r, g, b } = hslToRgb(hue, sat, light);
  return rgbToHex(r, g, b);
};

export const makeFilmChartSvg = (profile: FilmProfileName, basePalette: string[], width = 1200, height = 800): string => {
  const frameX = round(width * 0.06);
  const frameY = round(height * 0.1);
  const frameW = width - frameX * 2;
  const frameH = height - frameY * 2;
  const paddingX = 24;
  const paddingY = 20;
  const innerX = frameX + paddingX;
  const innerY = frameY + paddingY;
  const innerW = frameW - paddingX * 2;
  const innerH = frameH - paddingY * 2;
  const swatches = basePalette.length > 0 ? basePalette : ["#94a3b8", "#64748b", "#475569", "#0ea5e9", "#22c55e", "#f59e0b"];
  const count = swatches.length;
  const gap = 12;
  const rowGap = 28;
  const swatchW = (innerW - gap * (count - 1)) / count;
  const swatchH = (innerH - rowGap) / 2;
  const topY = innerY;
  const bottomY = topY + swatchH + rowGap;

  let topRow = "";
  let bottomRow = "";
  for (let i = 0; i < count; i += 1) {
    const x = innerX + i * (swatchW + gap);
    const base = swatches[i];
    const transformed = applyFilmProfile(base, profile);
    topRow += `<rect x="${round(x)}" y="${round(topY)}" width="${round(swatchW)}" height="${round(swatchH)}" rx="10" fill="${base}"/>`;
    bottomRow += `<rect x="${round(x)}" y="${round(bottomY)}" width="${round(swatchW)}" height="${round(swatchH)}" rx="10" fill="${transformed}"/>`;
  }

  const dividerY = round(topY + swatchH + rowGap / 2);

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#f8fafc"/>
  <rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" rx="28" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
  ${topRow}
  <line x1="${innerX}" y1="${dividerY}" x2="${innerX + innerW}" y2="${dividerY}" stroke="#e2e8f0" stroke-width="3"/>
  ${bottomRow}
</svg>`;

  return svgDataUrl(svg);
};
