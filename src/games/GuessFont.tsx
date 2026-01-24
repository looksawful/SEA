'use client'
import { CSSProperties, useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/Card'
import { useGameStore } from '@/store/gameStore'
import { useNumberKeys } from '@/hooks/useKeyboard'
import { useSound } from '@/hooks/useSound'
import { shuffle, pickRandom, getDisplayText } from '@/utils/helpers'
import { Difficulty, difficultyDots, getDifficulty } from '@/utils/difficulty'

interface FontInfo {
  name: string
  family: string
  category: 'serif' | 'sans-serif' | 'monospace' | 'display'
  characteristics: string
}

const FONTS: FontInfo[] = [
  { name: 'Manrope', family: 'Manrope, sans-serif', category: 'sans-serif', characteristics: 'Современный гротеск с мягкой геометрией' },
  { name: 'Space Grotesk', family: '"Space Grotesk", sans-serif', category: 'display', characteristics: 'Выразительный гротеск с широкими пропорциями' },
  { name: 'Inter', family: 'Inter, sans-serif', category: 'sans-serif', characteristics: 'Геометрический гротеск с открытыми формами' },
  { name: 'Roboto', family: 'Roboto, sans-serif', category: 'sans-serif', characteristics: 'Механистичный гротеск от Google' },
  { name: 'Open Sans', family: '"Open Sans", sans-serif', category: 'sans-serif', characteristics: 'Гуманистический гротеск с открытыми формами' },
  { name: 'Lato', family: 'Lato, sans-serif', category: 'sans-serif', characteristics: 'Тёплый гротеск с полукруглыми деталями' },
  { name: 'Montserrat', family: 'Montserrat, sans-serif', category: 'sans-serif', characteristics: 'Геометрический гротеск с прямыми штрихами' },
  { name: 'Poppins', family: 'Poppins, sans-serif', category: 'sans-serif', characteristics: 'Геометрический гротеск с круглыми формами' },
  { name: 'Nunito', family: 'Nunito, sans-serif', category: 'sans-serif', characteristics: 'Округлённый гротеск' },
  { name: 'Source Sans Pro', family: '"Source Sans Pro", sans-serif', category: 'sans-serif', characteristics: 'Гуманистический гротеск от Adobe' },
  { name: 'Playfair Display', family: '"Playfair Display", serif', category: 'serif', characteristics: 'Контрастная антиква в стиле переходного периода' },
  { name: 'Merriweather', family: 'Merriweather, serif', category: 'serif', characteristics: 'Экранная антиква с массивными засечками' },
  { name: 'Lora', family: 'Lora, serif', category: 'serif', characteristics: 'Современная антиква с умеренным контрастом' },
  { name: 'PT Serif', family: '"PT Serif", serif', category: 'serif', characteristics: 'Русская антиква с мягкими формами' },
  { name: 'Fira Code', family: '"Fira Code", monospace', category: 'monospace', characteristics: 'Моноширинный шрифт с лигатурами' },
  { name: 'JetBrains Mono', family: '"JetBrains Mono", monospace', category: 'monospace', characteristics: 'Моноширинный с увеличенной высотой строчных' },
  { name: 'Source Code Pro', family: '"Source Code Pro", monospace', category: 'monospace', characteristics: 'Моноширинный гротеск от Adobe' },
]

interface Challenge {
  font: FontInfo
  text: string
  options: FontInfo[]
  difficulty: Difficulty
}

const generateChallenge = (round: number): Challenge => {
  const difficulty = getDifficulty(round)
  const font = pickRandom(FONTS)
  const text = getDisplayText()
  
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
  const { addScore, incrementStreak, resetStreak, updateStats, addMistake } = useGameStore()
  const { playCorrect, playWrong } = useSound()

  useEffect(() => {
    setChallenge(generateChallenge(round))
  }, [])

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
      addMistake({
        question: `Какой это шрифт?`,
        userAnswer: userAnswer.name,
        correctAnswer: challenge.font.name,
        explanation: `${challenge.font.name} — ${challenge.font.characteristics}. ${userAnswer.name} — ${userAnswer.characteristics}. Обратите внимание на форму букв "a", "g", "e" и характер засечек.`,
      })
    }
    
    updateStats('guess-font', correct)
    
    setTimeout(() => {
      onAnswer(correct)
      setRound(r => r + 1)
      setChallenge(generateChallenge(round + 1))
      setSelected(null)
      setShowResult(false)
    }, 1200)
  }, [challenge, showResult, round])

  useNumberKeys((num) => {
    if (num < (challenge?.options.length || 0)) {
      handleSelect(num)
    }
  }, !showResult)

  if (!challenge) return null

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">Какой это шрифт?</h2>
        <div className="text-xs text-soft mt-1">
          Сложность: {difficultyDots(challenge.difficulty)}
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
              <div className="text-xs text-soft mt-1">{font.category}</div>
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
          <div className="text-xs mt-1 text-soft">{challenge.font.characteristics}</div>
        </motion.div>
      )}
    </div>
  )
}

