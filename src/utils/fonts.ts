export const FONTS = [
  { name: 'Inter', family: 'Inter, sans-serif', category: 'sans-serif' },
  { name: 'Roboto', family: 'Roboto, sans-serif', category: 'sans-serif' },
  { name: 'Open Sans', family: '"Open Sans", sans-serif', category: 'sans-serif' },
  { name: 'Montserrat', family: 'Montserrat, sans-serif', category: 'sans-serif' },
  { name: 'Lato', family: 'Lato, sans-serif', category: 'sans-serif' },
  { name: 'Poppins', family: 'Poppins, sans-serif', category: 'sans-serif' },
  { name: 'Source Sans Pro', family: '"Source Sans Pro", sans-serif', category: 'sans-serif' },
  { name: 'Nunito', family: 'Nunito, sans-serif', category: 'sans-serif' },
  { name: 'Playfair Display', family: '"Playfair Display", serif', category: 'serif' },
  { name: 'Merriweather', family: 'Merriweather, serif', category: 'serif' },
  { name: 'Lora', family: 'Lora, serif', category: 'serif' },
  { name: 'PT Serif', family: '"PT Serif", serif', category: 'serif' },
  { name: 'Georgia', family: 'Georgia, serif', category: 'serif' },
  { name: 'Fira Code', family: '"Fira Code", monospace', category: 'monospace' },
  { name: 'JetBrains Mono', family: '"JetBrains Mono", monospace', category: 'monospace' },
  { name: 'Source Code Pro', family: '"Source Code Pro", monospace', category: 'monospace' },
]

export const TYPE_SCALE = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72]

export const FONT_SIZE_CLASSES: Record<number, string> = {
  10: 'text-[10px]',
  11: 'text-[11px]',
  12: 'text-[12px]',
  13: 'text-[13px]',
  14: 'text-[14px]',
  15: 'text-[15px]',
  16: 'text-[16px]',
  17: 'text-[17px]',
  18: 'text-[18px]',
  20: 'text-[20px]',
  22: 'text-[22px]',
  24: 'text-[24px]',
  26: 'text-[26px]',
  28: 'text-[28px]',
  30: 'text-[30px]',
  32: 'text-[32px]',
  34: 'text-[34px]',
  36: 'text-[36px]',
  40: 'text-[40px]',
  48: 'text-[48px]',
  56: 'text-[56px]',
  60: 'text-[60px]',
  64: 'text-[64px]',
  72: 'text-[72px]',
}

export const getFontSizeClass = (size: number, fallback = 'text-2xl'): string =>
  FONT_SIZE_CLASSES[size] || fallback

export const MODULAR_SCALES = {
  minorSecond: 1.067,
  majorSecond: 1.125,
  minorThird: 1.2,
  majorThird: 1.25,
  perfectFourth: 1.333,
  augmentedFourth: 1.414,
  perfectFifth: 1.5,
  goldenRatio: 1.618,
}

export const generateTypeScale = (base: number, ratio: number, steps: number): number[] => {
  const scale: number[] = []
  for (let i = -2; i < steps; i++) {
    scale.push(Math.round(base * Math.pow(ratio, i)))
  }
  return scale
}

export const randomFontSize = (): number => {
  return TYPE_SCALE[Math.floor(Math.random() * TYPE_SCALE.length)]
}

export const randomFont = () => {
  return FONTS[Math.floor(Math.random() * FONTS.length)]
}

export const getFontsByCategory = (category: string) => {
  return FONTS.filter(f => f.category === category)
}
