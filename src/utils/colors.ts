export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
}

export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  h /= 360; s /= 100; l /= 100
  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

export const randomColor = (): string => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}

export const randomHsl = (): { h: number; s: number; l: number } => ({
  h: Math.floor(Math.random() * 360),
  s: Math.floor(Math.random() * 60) + 40,
  l: Math.floor(Math.random() * 50) + 25
})

export const getComplementary = (h: number): number => (h + 180) % 360

export const getAnalogous = (h: number): number[] => [(h + 30) % 360, (h + 330) % 360]

export const getTriadic = (h: number): number[] => [(h + 120) % 360, (h + 240) % 360]

export const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export const colorDistance = (c1: string, c2: string): number => {
  const rgb1 = hexToRgb(c1)
  const rgb2 = hexToRgb(c2)
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  )
}

export const adjustForDarkTheme = (hex: string): string => {
  const { h, s, l } = rgbToHsl(...Object.values(hexToRgb(hex)) as [number, number, number])
  const newL = l < 50 ? Math.min(100, 100 - l + 10) : Math.max(0, 100 - l - 10)
  const { r, g, b } = hslToRgb(h, Math.max(s - 10, 0), newL)
  return rgbToHex(r, g, b)
}

export const adjustForLightTheme = (hex: string): string => {
  const { h, s, l } = rgbToHsl(...Object.values(hexToRgb(hex)) as [number, number, number])
  const newL = l > 50 ? Math.max(0, 100 - l - 10) : Math.min(100, 100 - l + 10)
  const { r, g, b } = hslToRgb(h, Math.min(s + 10, 100), newL)
  return rgbToHex(r, g, b)
}
