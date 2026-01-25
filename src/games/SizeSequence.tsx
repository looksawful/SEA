'use client'
import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/Card'
import { HintToggle } from '@/components/HintToggle'
import { useGameStore } from '@/store/gameStore'
import { useNumberKeys } from '@/hooks/useKeyboard'
import { useSkipSignal } from '@/hooks/useSkipSignal'
import { useSound } from '@/hooks/useSound'
import { randomInt, pickRandom } from '@/utils/helpers'
import { getFontSizeClass, TYPE_SCALE } from '@/utils/fonts'
import { Difficulty, difficultyDots, getDifficulty } from '@/utils/difficulty'
import { LocalizedText, localize, t } from '@/utils/i18n'

type ScaleType = 'modular' | 'linear' | 'fibonacci' | 'golden' | 'major-third' | 'perfect-fourth'

interface Challenge {
  sizes: number[]
  errorIndex: number
  scaleType: ScaleType
  ratio: number
  difficulty: Difficulty
}

const text = (ru: string, en: string): LocalizedText => ({ ru, en })

const SCALE_NAMES: Record<ScaleType, LocalizedText> = {
  modular: text('модульная', 'modular'),
  linear: text('линейная', 'linear'),
  fibonacci: text('Фибоначчи', 'Fibonacci'),
  golden: text('золотое сечение', 'golden ratio'),
  'major-third': text('major third', 'major third'),
  'perfect-fourth': text('perfect fourth', 'perfect fourth'),
}

const SCALE_EXPLANATIONS: Record<ScaleType, LocalizedText> = {
  modular: text(
    'Модульная шкала умножает базовый размер на постоянный коэффициент (обычно 1.2-1.5)',
    'A modular scale multiplies the base size by a constant ratio (typically 1.2–1.5).',
  ),
  linear: text(
    'Линейная шкала добавляет фиксированное значение к каждому следующему размеру',
    'A linear scale adds a fixed step to each next size.',
  ),
  fibonacci: text(
    'Шкала Фибоначчи: каждое число — сумма двух предыдущих',
    'A Fibonacci scale: each number is the sum of the two previous ones.',
  ),
  golden: text(
    'Золотое сечение использует коэффициент 1.618 для каждого следующего размера',
    'The golden ratio uses 1.618 as the multiplier for each next size.',
  ),
  'major-third': text('Major Third масштабирует размеры по коэффициенту 1.25', 'Major Third scales sizes by 1.25.'),
  'perfect-fourth': text(
    'Perfect Fourth масштабирует размеры по коэффициенту 1.333',
    'Perfect Fourth scales sizes by 1.333.',
  ),
}

const snapToScale = (value: number): number => {
  return TYPE_SCALE.reduce((closest, size) => {
    return Math.abs(size - value) < Math.abs(closest - value) ? size : closest
  }, TYPE_SCALE[0])
}

const normalizeScale = (sizes: number[]): number[] => {
  const normalized: number[] = []
  let last = 0

  for (const value of sizes) {
    const snapped = snapToScale(value)
    const next = snapped > last ? snapped : TYPE_SCALE.find((size) => size > last) || snapped
    normalized.push(next)
    last = next
  }

  return normalized
}

const generateScale = (type: ScaleType, count: number): number[] => {
  const sizes: number[] = []
  
  switch (type) {
    case 'modular': {
      const base = 16
      const ratio = pickRandom([1.2, 1.25, 1.333, 1.414, 1.5])
      for (let i = 0; i < count; i++) {
        sizes.push(Math.round(base * Math.pow(ratio, i)))
      }
      break
    }
    case 'linear': {
      const base = 12
      const step = pickRandom([2, 3, 4])
      for (let i = 0; i < count; i++) {
        sizes.push(base + i * step)
      }
      break
    }
    case 'fibonacci': {
      const fib = [8, 13, 21, 34, 55, 89]
      sizes.push(...fib.slice(0, count))
      break
    }
    case 'golden': {
      const base = 10
      const ratio = 1.618
      for (let i = 0; i < count; i++) {
        sizes.push(Math.round(base * Math.pow(ratio, i)))
      }
      break
    }
    case 'major-third': {
      const base = 14
      const ratio = 1.25
      for (let i = 0; i < count; i++) {
        sizes.push(Math.round(base * Math.pow(ratio, i)))
      }
      break
    }
    case 'perfect-fourth': {
      const base = 14
      const ratio = 1.333
      for (let i = 0; i < count; i++) {
        sizes.push(Math.round(base * Math.pow(ratio, i)))
      }
      break
    }
  }
  
  return normalizeScale(sizes)
}

const generateErrorSize = (sizes: number[], errorIndex: number, difficulty: Difficulty): number => {
  const original = sizes[errorIndex]
  let error: number
  
  switch (difficulty) {
    case 'easy':
      error = original + (Math.random() > 0.5 ? 1 : -1) * randomInt(6, 10)
      break
    case 'medium':
      error = original + (Math.random() > 0.5 ? 1 : -1) * randomInt(3, 5)
      break
    case 'hard':
      error = original + (Math.random() > 0.5 ? 1 : -1) * randomInt(1, 2)
      break
    case 'expert':
      error = original + (Math.random() > 0.5 ? 1 : -1) * 1
      break
  }
  
  return Math.max(8, error)
}

const generateChallenge = (round: number): Challenge => {
  const difficulty = getDifficulty(round)
  const scaleType = pickRandom(['modular', 'linear', 'golden', 'fibonacci', 'major-third', 'perfect-fourth'] as ScaleType[])
  const count = difficulty === 'hard' || difficulty === 'expert' ? 6 : 5
  
  const sizes = generateScale(scaleType, count)
  const errorIndex = randomInt(1, count - 2)
  const errorSize = generateErrorSize(sizes, errorIndex, difficulty)
  
  const resultSizes = [...sizes]
  resultSizes[errorIndex] = errorSize
  
  return {
    sizes: resultSizes,
    errorIndex,
    scaleType,
    ratio: scaleType === 'modular' ? 1.333 : scaleType === 'golden' ? 1.618 : scaleType === 'major-third' ? 1.25 : scaleType === 'perfect-fourth' ? 1.333 : 1,
    difficulty,
  }
}

interface Props {
  onAnswer: (correct: boolean) => void
}

export const SizeSequenceGame = ({ onAnswer }: Props) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [round, setRound] = useState(0)
  const { addScore, incrementStreak, resetStreak, updateStats, addMistake, setReviewPause, language } = useGameStore()
  const { playCorrect, playWrong } = useSound()

  useEffect(() => {
    setChallenge(generateChallenge(round))
  }, [])

  const handleSelect = useCallback((index: number) => {
    if (showResult || !challenge) return
    
    setSelected(index)
    setShowResult(true)
    
    const correct = index === challenge.errorIndex
    const correctScale = generateScale(challenge.scaleType, challenge.sizes.length)
    const scaleName = localize(SCALE_NAMES[challenge.scaleType], language)
    const scaleExplanation = localize(SCALE_EXPLANATIONS[challenge.scaleType], language)
    
    if (correct) {
      const points = challenge.difficulty === 'expert' ? 180 : challenge.difficulty === 'hard' ? 150 : challenge.difficulty === 'medium' ? 120 : 100
      addScore(points)
      incrementStreak()
      playCorrect()
    } else {
      resetStreak()
      playWrong()
      addMistake({
        question:
          language === 'ru'
            ? `Найди ошибку в ${scaleName} шкале`
            : `Find the error in the ${scaleName} scale`,
        userAnswer:
          language === 'ru'
            ? `Позиция ${index + 1} (${challenge.sizes[index]}px)`
            : `Position ${index + 1} (${challenge.sizes[index]}px)`,
        correctAnswer:
          language === 'ru'
            ? `Позиция ${challenge.errorIndex + 1} (должно быть ${correctScale[challenge.errorIndex]}px, показано ${challenge.sizes[challenge.errorIndex]}px)`
            : `Position ${challenge.errorIndex + 1} (should be ${correctScale[challenge.errorIndex]}px, shown ${challenge.sizes[challenge.errorIndex]}px)`,
        explanation:
          language === 'ru'
            ? `${scaleExplanation}. Правильная последовательность: ${correctScale.join(', ')}px`
            : `${scaleExplanation}. Correct sequence: ${correctScale.join(', ')}px`,
      })
    }
    
    updateStats('size-sequence', correct)
    
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
  }, [challenge, showResult, round, onAnswer, language])

  useSkipSignal(handleSkip, !showResult)

  useNumberKeys((num) => {
    if (num < (challenge?.sizes.length || 0)) {
      handleSelect(num)
    }
  }, !showResult)

  if (!challenge) return null

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">
          {language === 'ru' ? 'Найди ошибку в шкале' : 'Find the error in the scale'}
        </h2>
        <HintToggle hint={localize(SCALE_EXPLANATIONS[challenge.scaleType], language)} />
        <div className="text-xs text-soft mt-1">
          {language === 'ru' ? 'Тип' : 'Type'}: {localize(SCALE_NAMES[challenge.scaleType], language)} •{' '}
          {t(language, 'difficultyLabel')}: {difficultyDots(challenge.difficulty)}
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        {challenge.sizes.map((size, index) => {
          return (
          <Card
            key={index}
            onClick={() => handleSelect(index)}
            selected={selected === index}
            correct={showResult ? index === challenge.errorIndex : null}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <span className="w-8 text-center font-mono text-sm text-soft">
                {index + 1}
              </span>
              <motion.span
                className={`font-medium text-strong flex-1 ${getFontSizeClass(size, 'text-[48px]')}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Aa
              </motion.span>
              <span className="font-mono text-sm text-muted">
                {size}px
              </span>
            </div>
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
            {language === 'ru' ? 'Ошибка на позиции' : 'Error at position'} {challenge.errorIndex + 1}
          </div>
          <div className="text-xs mt-1 text-soft">{localize(SCALE_EXPLANATIONS[challenge.scaleType], language)}</div>
        </motion.div>
      )}
    </div>
  )
}

