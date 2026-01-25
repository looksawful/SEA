'use client'
import { CSSProperties, useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/Card'
import { HintToggle } from '@/components/HintToggle'
import { useGameStore } from '@/store/gameStore'
import { useNumberKeys } from '@/hooks/useKeyboard'
import { useSkipSignal } from '@/hooks/useSkipSignal'
import { useSound } from '@/hooks/useSound'
import { shuffle, pickRandom, getDisplayText } from '@/utils/helpers'
import { Difficulty, difficultyDots, getDifficulty } from '@/utils/difficulty'
import { Language, LocalizedText, localize, t } from '@/utils/i18n'

interface FontInfo {
  name: string
  family: string
  category: 'serif' | 'sans-serif' | 'monospace' | 'display'
  characteristics: LocalizedText
}

const text = (ru: string, en: string): LocalizedText => ({ ru, en })

const FONTS: FontInfo[] = [
  {
    name: 'Manrope',
    family: 'Manrope, sans-serif',
    category: 'sans-serif',
    characteristics: text('Современный гротеск с мягкой геометрией', 'Modern grotesque with soft geometry'),
  },
  {
    name: 'Space Grotesk',
    family: '"Space Grotesk", sans-serif',
    category: 'display',
    characteristics: text('Выразительный гротеск с широкими пропорциями', 'Expressive grotesque with wide proportions'),
  },
  {
    name: 'Inter',
    family: 'Inter, sans-serif',
    category: 'sans-serif',
    characteristics: text('Геометрический гротеск с открытыми формами', 'Geometric grotesque with open forms'),
  },
  {
    name: 'Roboto',
    family: 'Roboto, sans-serif',
    category: 'sans-serif',
    characteristics: text('Механистичный гротеск от Google', 'Mechanical grotesque by Google'),
  },
  {
    name: 'Open Sans',
    family: '"Open Sans", sans-serif',
    category: 'sans-serif',
    characteristics: text('Гуманистический гротеск с открытыми формами', 'Humanist grotesque with open forms'),
  },
  {
    name: 'Lato',
    family: 'Lato, sans-serif',
    category: 'sans-serif',
    characteristics: text('Тёплый гротеск с полукруглыми деталями', 'Warm grotesque with semi-rounded details'),
  },
  {
    name: 'Montserrat',
    family: 'Montserrat, sans-serif',
    category: 'sans-serif',
    characteristics: text('Геометрический гротеск с прямыми штрихами', 'Geometric grotesque with straight strokes'),
  },
  {
    name: 'Poppins',
    family: 'Poppins, sans-serif',
    category: 'sans-serif',
    characteristics: text('Геометрический гротеск с круглыми формами', 'Geometric grotesque with circular forms'),
  },
  {
    name: 'Nunito',
    family: 'Nunito, sans-serif',
    category: 'sans-serif',
    characteristics: text('Округлённый гротеск', 'Rounded grotesque'),
  },
  {
    name: 'Source Sans Pro',
    family: '"Source Sans Pro", sans-serif',
    category: 'sans-serif',
    characteristics: text('Гуманистический гротеск от Adobe', 'Humanist grotesque by Adobe'),
  },
  {
    name: 'Playfair Display',
    family: '"Playfair Display", serif',
    category: 'serif',
    characteristics: text('Контрастная антиква в стиле переходного периода', 'High-contrast serif in the transitional style'),
  },
  {
    name: 'Merriweather',
    family: 'Merriweather, serif',
    category: 'serif',
    characteristics: text('Экранная антиква с массивными засечками', 'Screen serif with heavy serifs'),
  },
  {
    name: 'Lora',
    family: 'Lora, serif',
    category: 'serif',
    characteristics: text('Современная антиква с умеренным контрастом', 'Modern serif with moderate contrast'),
  },
  {
    name: 'PT Serif',
    family: '"PT Serif", serif',
    category: 'serif',
    characteristics: text('Русская антиква с мягкими формами', 'Russian serif with soft forms'),
  },
  {
    name: 'Fira Code',
    family: '"Fira Code", monospace',
    category: 'monospace',
    characteristics: text('Моноширинный шрифт с лигатурами', 'Monospace font with ligatures'),
  },
  {
    name: 'JetBrains Mono',
    family: '"JetBrains Mono", monospace',
    category: 'monospace',
    characteristics: text('Моноширинный с увеличенной высотой строчных', 'Monospace with a taller x-height'),
  },
  {
    name: 'Source Code Pro',
    family: '"Source Code Pro", monospace',
    category: 'monospace',
    characteristics: text('Моноширинный гротеск от Adobe', 'Monospace grotesque by Adobe'),
  },
]

const CATEGORY_LABELS: Record<FontInfo['category'], LocalizedText> = {
  serif: text('Антиква', 'Serif'),
  'sans-serif': text('Гротеск', 'Sans-serif'),
  monospace: text('Моноширинный', 'Monospace'),
  display: text('Дисплейный', 'Display'),
}

interface Challenge {
  font: FontInfo
  text: string
  options: FontInfo[]
  difficulty: Difficulty
}

const generateChallenge = (round: number, language: Language): Challenge => {
  const difficulty = getDifficulty(round)
  const font = pickRandom(FONTS)
  const text = getDisplayText(language)
  
  let similarFonts: FontInfo[]
  
  if (difficulty === 'easy') {
    similarFonts = FONTS.filter(f => f.category !== font.category && f.name !== font.name)
  } else if (difficulty === 'medium') {
    similarFonts = FONTS.filter(f => f.name !== font.name)
  } else {
    similarFonts = FONTS.filter(f => f.category === font.category && f.name !== font.name)
    if (similarFonts.length < 3) {
      similarFonts = FONTS.filter(f => f.name !== font.name)
    }
  }
  
  const options = shuffle([font, ...shuffle(similarFonts).slice(0, 3)])
  
  return { font, text, options, difficulty }
}

interface Props {
  onAnswer: (correct: boolean) => void
}

export const GuessFontGame = ({ onAnswer }: Props) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [round, setRound] = useState(0)
  const { addScore, incrementStreak, resetStreak, updateStats, addMistake, setReviewPause, language } = useGameStore()
  const { playCorrect, playWrong } = useSound()

  useEffect(() => {
    setChallenge(generateChallenge(round, language))
  }, [language])

  const handleSelect = useCallback((index: number) => {
    if (showResult || !challenge) return
    
    setSelected(index)
    setShowResult(true)
    
    const userAnswer = challenge.options[index]
    const correct = userAnswer.name === challenge.font.name
    
    if (correct) {
      const points = challenge.difficulty === 'expert' ? 220 : challenge.difficulty === 'hard' ? 200 : challenge.difficulty === 'medium' ? 150 : 120
      addScore(points)
      incrementStreak()
      playCorrect()
    } else {
      resetStreak()
      playWrong()
      const correctDescription = localize(challenge.font.characteristics, language)
      const userDescription = localize(userAnswer.characteristics, language)
      const explanation =
        language === "ru"
          ? `${challenge.font.name} — ${correctDescription}. ${userAnswer.name} — ${userDescription}. Обрати внимание на форму букв "a", "g", "e" и характер засечек.`
          : `${challenge.font.name} — ${correctDescription}. ${userAnswer.name} — ${userDescription}. Pay attention to the shapes of "a", "g", "e" and the presence of serifs.`
      addMistake({
        question: language === "ru" ? "Какой это шрифт?" : "Which font is this?",
        userAnswer: userAnswer.name,
        correctAnswer: challenge.font.name,
        explanation,
      })
    }
    
    updateStats('guess-font', correct)
    
    const reviewDelay = correct ? 1200 : 2400
    setReviewPause(reviewDelay)

    setTimeout(() => {
      onAnswer(correct)
      setRound(r => r + 1)
      setChallenge(generateChallenge(round + 1, language))
      setSelected(null)
      setShowResult(false)
    }, reviewDelay)
  }, [challenge, showResult, round, setReviewPause, language])

  const handleSkip = useCallback(() => {
    if (!challenge || showResult) return
    onAnswer(false)
    setRound(r => r + 1)
    setChallenge(generateChallenge(round + 1, language))
    setSelected(null)
    setShowResult(false)
  }, [challenge, showResult, round, onAnswer, language])

  useSkipSignal(handleSkip, !showResult)

  useNumberKeys((num) => {
    if (num < (challenge?.options.length || 0)) {
      handleSelect(num)
    }
  }, !showResult)

  if (!challenge) return null

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">
          {language === "ru" ? "Какой это шрифт?" : "Which font is this?"}
        </h2>
        <HintToggle
          hint={
            language === "ru"
              ? 'Смотри на формы "a", "g", контраст штрихов и наличие засечек.'
              : 'Look at the shapes of "a", "g", stroke contrast, and the presence of serifs.'
          }
        />
        <div className="text-xs text-soft">
          {t(language, "difficultyLabel")}: {difficultyDots(challenge.difficulty)}
        </div>
      </div>

      <div className="bg-surface-2 rounded-2xl p-8 flex items-center justify-center min-h-40 border border-subtle shadow-card">
        <motion.span 
          style={{ '--sample-font': challenge.font.family } as CSSProperties}
          className="font-sample text-[48px] text-strong select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {challenge.text}
        </motion.span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {challenge.options.map((font, index) => (
          <Card
            key={index}
            onClick={() => handleSelect(index)}
            selected={selected === index}
            correct={showResult ? font.name === challenge.font.name : null}
          >
            <div className="text-center">
              <span className="font-medium">{font.name}</span>
              <span className="hidden sm:inline text-xs text-soft ml-2">[{index + 1}]</span>
              <div className="text-xs text-soft mt-1">{localize(CATEGORY_LABELS[font.category], language)}</div>
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
          <div className="font-medium">{challenge.font.name}</div>
          <div className="text-xs mt-1 text-soft">{localize(challenge.font.characteristics, language)}</div>
        </motion.div>
      )}
    </div>
  )
}

