'use client'
import { CSSProperties, useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/Card'
import { HintToggle } from '@/components/HintToggle'
import { useGameStore } from '@/store/gameStore'
import { useNumberKeys } from '@/hooks/useKeyboard'
import { useSkipSignal } from '@/hooks/useSkipSignal'
import { useSound } from '@/hooks/useSound'
import { hslToRgb, rgbToHex } from '@/utils/colors'
import { shuffle, randomInt, pickRandom } from '@/utils/helpers'
import { Difficulty, difficultyDots, getDifficulty } from '@/utils/difficulty'
import { LocalizedText, localize, t } from '@/utils/i18n'

type PaletteType = 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'split' | 'tetradic'

interface Challenge {
  colors: string[]
  errorIndex: number
  paletteType: PaletteType
  baseHue: number
  difficulty: Difficulty
}

const text = (ru: string, en: string): LocalizedText => ({ ru, en })

const PALETTE_NAMES: Record<PaletteType, LocalizedText> = {
  monochromatic: text('монохромная', 'monochromatic'),
  analogous: text('аналоговая', 'analogous'),
  complementary: text('комплементарная', 'complementary'),
  triadic: text('триадная', 'triadic'),
  split: text('сплит-комплементарная', 'split-complementary'),
  tetradic: text('тетра́дная', 'tetradic'),
}

const PALETTE_EXPLANATIONS: Record<PaletteType, LocalizedText> = {
  monochromatic: text(
    'Монохромная палитра использует один тон (H) с разной насыщенностью и светлотой',
    'A monochromatic palette uses one hue (H) with varying saturation and lightness'
  ),
  analogous: text(
    'Аналоговая палитра использует соседние тона на цветовом круге (±30°)',
    'An analogous palette uses neighboring hues on the color wheel (±30°)'
  ),
  complementary: text(
    'Комплементарная палитра использует противоположные тона (180°)',
    'A complementary palette uses opposite hues (180°)'
  ),
  triadic: text(
    'Триадная палитра использует три равноудалённых тона (120° друг от друга)',
    'A triadic palette uses three evenly spaced hues (120° apart)'
  ),
  split: text(
    'Сплит-комплементарная палитра использует два тона вокруг комплементарного (±30°)',
    'A split-complementary palette uses two hues around the complement (±30°)'
  ),
  tetradic: text(
    'Тетрадная палитра использует две пары комплементарных тонов (через 90°)',
    'A tetradic palette uses two complementary pairs (90° apart)'
  ),
}

const generatePalette = (type: PaletteType, baseHue: number, count: number): { h: number; s: number; l: number }[] => {
  const colors: { h: number; s: number; l: number }[] = []
  
  switch (type) {
    case 'monochromatic':
      for (let i = 0; i < count; i++) {
        colors.push({
          h: baseHue,
          s: 40 + randomInt(0, 40),
          l: 25 + i * 12 + randomInt(-5, 5),
        })
      }
      break
    case 'analogous':
      for (let i = 0; i < count; i++) {
        const offset = (i - Math.floor(count / 2)) * 20
        colors.push({
          h: (baseHue + offset + 360) % 360,
          s: 50 + randomInt(0, 30),
          l: 45 + randomInt(-10, 10),
        })
      }
      break
    case 'complementary':
      for (let i = 0; i < count; i++) {
        const isComplement = i >= count / 2
        colors.push({
          h: isComplement ? (baseHue + 180) % 360 : baseHue,
          s: 50 + randomInt(0, 30),
          l: 40 + randomInt(0, 20),
        })
      }
      break
    case 'triadic':
      for (let i = 0; i < count; i++) {
        const offset = Math.floor(i / 2) * 120
        colors.push({
          h: (baseHue + offset) % 360,
          s: 50 + randomInt(0, 30),
          l: 45 + randomInt(-5, 10),
        })
      }
      break
    case 'split': {
      const splitHues = [(baseHue + 150) % 360, (baseHue + 210) % 360]
      for (let i = 0; i < count; i++) {
        const hue = i === 0 ? baseHue : splitHues[i % splitHues.length]
        colors.push({
          h: hue,
          s: 45 + randomInt(0, 30),
          l: 40 + randomInt(-5, 12),
        })
      }
      break
    }
    case 'tetradic': {
      const offsets = [0, 90, 180, 270]
      for (let i = 0; i < count; i++) {
        const hue = (baseHue + offsets[i % offsets.length]) % 360
        colors.push({
          h: hue,
          s: 45 + randomInt(0, 30),
          l: 40 + randomInt(-5, 12),
        })
      }
      break
    }
  }
  
  return colors
}

const generateErrorColor = (type: PaletteType, baseHue: number, difficulty: Difficulty): { h: number; s: number; l: number } => {
  let errorHue: number
  
  switch (difficulty) {
    case 'easy':
      errorHue = (baseHue + 90 + randomInt(30, 60)) % 360
      break
    case 'medium':
      errorHue = (baseHue + 60 + randomInt(20, 40)) % 360
      break
    case 'hard':
      errorHue = (baseHue + 40 + randomInt(10, 25)) % 360
      break
    case 'expert':
      errorHue = (baseHue + 30 + randomInt(8, 16)) % 360
      break
  }
  
  return {
    h: errorHue,
    s: 50 + randomInt(0, 30),
    l: 45 + randomInt(-5, 15),
  }
}

const generateChallenge = (round: number): Challenge => {
  const difficulty = getDifficulty(round)
  const paletteType = pickRandom(['monochromatic', 'analogous', 'complementary', 'triadic', 'split', 'tetradic'] as PaletteType[])
  const baseHue = randomInt(0, 359)
  const colorCount = difficulty === 'hard' || difficulty === 'expert' ? 6 : 5
  
  const palette = generatePalette(paletteType, baseHue, colorCount - 1)
  const errorColor = generateErrorColor(paletteType, baseHue, difficulty)
  const errorIndex = randomInt(0, colorCount - 1)
  
  const allColors = [...palette]
  allColors.splice(errorIndex, 0, errorColor)
  
  const hexColors = allColors.map(c => {
    const { r, g, b } = hslToRgb(c.h, c.s, c.l)
    return rgbToHex(r, g, b)
  })
  
  return {
    colors: hexColors,
    errorIndex,
    paletteType,
    baseHue,
    difficulty,
  }
}

interface Props {
  onAnswer: (correct: boolean) => void
}

export const PaletteErrorGame = ({ onAnswer }: Props) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [round, setRound] = useState(0)
  const language = useGameStore((state) => state.language)
  const { addScore, incrementStreak, resetStreak, updateStats, addMistake, setReviewPause } = useGameStore()
  const { playCorrect, playWrong } = useSound()

  useEffect(() => {
    setChallenge(generateChallenge(round))
  }, [])

  const handleSelect = useCallback((index: number) => {
    if (showResult || !challenge) return
    
    setSelected(index)
    setShowResult(true)
    
    const correct = index === challenge.errorIndex
    
    if (correct) {
      const points = challenge.difficulty === 'expert' ? 220 : challenge.difficulty === 'hard' ? 200 : challenge.difficulty === 'medium' ? 150 : 120
      addScore(points)
      incrementStreak()
      playCorrect()
    } else {
      resetStreak()
      playWrong()
      const paletteName = localize(PALETTE_NAMES[challenge.paletteType], language)
      const paletteExplanation = localize(PALETTE_EXPLANATIONS[challenge.paletteType], language)
      const colorLabel = language === 'ru' ? 'Цвет' : 'Color'
      addMistake({
        question:
          language === 'ru'
            ? `Найди цвет, выбивающийся из ${paletteName} палитры`
            : `Find the color that does not belong to the ${paletteName} palette`,
        userAnswer: `${colorLabel} ${index + 1}`,
        correctAnswer: `${colorLabel} ${challenge.errorIndex + 1}`,
        explanation:
          language === 'ru'
            ? `${paletteExplanation}. Базовый тон палитры: ${challenge.baseHue}°. Ошибочный цвет имеет тон, не вписывающийся в схему.`
            : `${paletteExplanation}. Palette base hue: ${challenge.baseHue}°. The odd color uses a hue outside the scheme.`,
        visual: {
          type: 'colors',
          data: challenge.colors.reduce((acc, c, i) => ({ ...acc, [`${colorLabel} ${i + 1}`]: c }), {}),
        }
      })
    }
    
    updateStats('palette-error', correct)
    
    const reviewDelay = correct ? 1200 : 2400
    setReviewPause(reviewDelay)

    setTimeout(() => {
      onAnswer(correct)
      setRound(r => r + 1)
      setChallenge(generateChallenge(round + 1))
      setSelected(null)
      setShowResult(false)
    }, reviewDelay)
  }, [challenge, showResult, round, setReviewPause, language])

  const handleSkip = useCallback(() => {
    if (!challenge || showResult) return
    onAnswer(false)
    setRound(r => r + 1)
    setChallenge(generateChallenge(round + 1))
    setSelected(null)
    setShowResult(false)
  }, [challenge, showResult, round, onAnswer])

  useSkipSignal(handleSkip, !showResult)

  useNumberKeys((num) => {
    if (num < (challenge?.colors.length || 0)) {
      handleSelect(num)
    }
  }, !showResult)

  if (!challenge) return null

  const paletteName = localize(PALETTE_NAMES[challenge.paletteType], language)
  const paletteExplanation = localize(PALETTE_EXPLANATIONS[challenge.paletteType], language)
  const paletteLabel = language === 'ru' ? 'Палитра' : 'Palette'
  const errorLabel = language === 'ru' ? 'Ошибка в цвете' : 'Odd color'

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">
          {language === 'ru' ? 'Найди лишний цвет' : 'Find the odd color'}
        </h2>
        <HintToggle hint={paletteExplanation} />
        <div className="text-xs text-soft mt-1">
          {paletteLabel}: {paletteName} • {t(language, 'difficultyLabel')}: {difficultyDots(challenge.difficulty)}
        </div>
      </div>
      
      <div className={`grid gap-3 ${challenge.colors.length > 5 ? 'grid-cols-3' : 'grid-cols-5'}`}>
        {challenge.colors.map((color, index) => {
          const swatchStyle = { '--swatch': color } as CSSProperties
          return (
          <Card
            key={index}
            onClick={() => handleSelect(index)}
            selected={selected === index}
            correct={showResult ? index === challenge.errorIndex : null}
            padding="none"
            className="aspect-square overflow-hidden"
          >
            <motion.div
              className="w-full h-full flex items-end justify-center pb-2 bg-swatch"
              style={swatchStyle}
              whileHover={{ scale: 1.05 }}
            >
              <span className="px-1.5 py-0.5 bg-[color:var(--surface-1-95)] rounded text-xs font-mono">
                {index + 1}
              </span>
            </motion.div>
          </Card>
        )})}
      </div>
      
      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-muted"
        >
          <div>
            {errorLabel} {challenge.errorIndex + 1}
          </div>
          <div className="text-xs mt-1 text-soft">{paletteExplanation}</div>
        </motion.div>
      )}
    </div>
  )
}

