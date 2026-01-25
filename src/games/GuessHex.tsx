'use client'
import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/Card'
import { HintToggle } from '@/components/HintToggle'
import { Swatch } from '@/components/Swatch'
import { useGameStore } from '@/store/gameStore'
import { useNumberKeys } from '@/hooks/useKeyboard'
import { useSkipSignal } from '@/hooks/useSkipSignal'
import { useSound } from '@/hooks/useSound'
import { randomHsl, hslToRgb, rgbToHex, hexToRgb } from '@/utils/colors'
import { shuffle, randomInt } from '@/utils/helpers'
import { Difficulty, difficultyDots, getDifficulty } from '@/utils/difficulty'
import { t } from '@/utils/i18n'

interface Challenge {
  color: string
  hsl: { h: number; s: number; l: number }
  options: string[]
  correctIndex: number
  difficulty: Difficulty
}

const generateSimilarHex = (baseHex: string, difficulty: Difficulty): string => {
  const { r, g, b } = hexToRgb(baseHex)
  
  let variation: number
  switch (difficulty) {
    case 'easy': variation = randomInt(60, 100); break
    case 'medium': variation = randomInt(30, 50); break
    case 'hard': variation = randomInt(10, 25); break
    case 'expert': variation = randomInt(6, 14); break
  }
  
  const channels = difficulty === 'expert' ? shuffle([0, 1, 2]).slice(0, 2) : [randomInt(0, 2)]
  const direction = Math.random() > 0.5 ? 1 : -1
  
  const newR = channels.includes(0) ? Math.max(0, Math.min(255, r + direction * variation)) : r
  const newG = channels.includes(1) ? Math.max(0, Math.min(255, g + direction * variation)) : g
  const newB = channels.includes(2) ? Math.max(0, Math.min(255, b + direction * variation)) : b
  
  return rgbToHex(newR, newG, newB)
}

const generateChallenge = (round: number): Challenge => {
  const difficulty = getDifficulty(round)
  
  const hsl = randomHsl()
  const { r, g, b } = hslToRgb(hsl.h, hsl.s, hsl.l)
  const color = rgbToHex(r, g, b)
  
  const wrongOptions = new Set<string>()
  while (wrongOptions.size < 3) {
    const wrongColor = generateSimilarHex(color, difficulty)
    if (wrongColor !== color) {
      wrongOptions.add(wrongColor)
    }
  }
  
  const options = shuffle([color, ...wrongOptions])
  const correctIndex = options.indexOf(color)
  
  return { color, hsl, options, correctIndex, difficulty }
}

interface Props {
  onAnswer: (correct: boolean) => void
}

export const GuessHexGame = ({ onAnswer }: Props) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [round, setRound] = useState(0)
  const { addScore, incrementStreak, resetStreak, updateStats, addMistake, setReviewPause, language } = useGameStore()
  const { playCorrect, playWrong } = useSound()

  useEffect(() => {
    setChallenge(generateChallenge(round))
  }, [language])

  const handleSelect = useCallback((index: number) => {
    if (showResult || !challenge) return
    
    setSelected(index)
    setShowResult(true)
    
    const correct = index === challenge.correctIndex
    
    if (correct) {
      const points = challenge.difficulty === 'expert' ? 280 : challenge.difficulty === 'hard' ? 250 : challenge.difficulty === 'medium' ? 200 : 150
      addScore(points)
      incrementStreak()
      playCorrect()
    } else {
      resetStreak()
      playWrong()
      const userHex = challenge.options[index]
      const userRgb = hexToRgb(userHex)
      const correctRgb = hexToRgb(challenge.color)
      const correctLabel = language === "ru" ? "Правильный" : "Correct"
      const choiceLabel = language === "ru" ? "Твой выбор" : "Your choice"
      const explanation =
        language === "ru"
          ? `HEX-код состоит из трёх пар цифр (RR GG BB). Правильный: R=${correctRgb.r} G=${correctRgb.g} B=${correctRgb.b}. Твой выбор: R=${userRgb.r} G=${userRgb.g} B=${userRgb.b}. Разница в каналах помогает различать близкие цвета.`
          : `HEX code consists of three pairs (RR GG BB). Correct: R=${correctRgb.r} G=${correctRgb.g} B=${correctRgb.b}. Your choice: R=${userRgb.r} G=${userRgb.g} B=${userRgb.b}. Channel differences help distinguish close colors.`
      addMistake({
        question: language === "ru" ? "Угадай HEX-код цвета" : "Guess the HEX color code",
        userAnswer: userHex.toUpperCase(),
        correctAnswer: challenge.color.toUpperCase(),
        explanation,
        visual: {
          type: "colors",
          data: {
            [correctLabel]: challenge.color,
            [choiceLabel]: userHex,
          }
        }
      })
    }
    
    updateStats('guess-hex', correct)
    
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
    if (num < (challenge?.options.length || 0)) {
      handleSelect(num)
    }
  }, !showResult)

  if (!challenge) return null

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">
          {language === "ru" ? "Угадай HEX-код" : "Guess the HEX code"}
        </h2>
        <HintToggle
          hint={
            language === "ru"
              ? "HEX состоит из трёх пар (RR GG BB). Сравни тон и яркость со свотчем."
              : "HEX uses three pairs (RR GG BB). Compare hue and brightness with the swatch."
          }
        />
      <div className="text-xs text-soft">
          {t(language, "difficultyLabel")}: {difficultyDots(challenge.difficulty)}
        </div>
      </div>

      <div className="flex justify-center">
        <motion.div
          className="w-40 h-40"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Swatch color={challenge.color} className="w-full h-full rounded-2xl shadow-card border border-subtle" />
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {challenge.options.map((hex, index) => (
          <Card
            key={index}
            onClick={() => handleSelect(index)}
            selected={selected === index}
            correct={showResult ? hex === challenge.color : null}
          >
            <div className="text-center">
              <span className="font-mono text-lg">{hex.toUpperCase()}</span>
              <span className="hidden sm:inline text-xs text-soft ml-2">[{index + 1}]</span>
            </div>
          </Card>
        ))}
      </div>
      
      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-muted space-y-1"
        >
          <div className="font-mono">{challenge.color.toUpperCase()}</div>
          <div className="text-xs text-soft">
            HSL({challenge.hsl.h}°, {challenge.hsl.s}%, {challenge.hsl.l}%)
          </div>
        </motion.div>
      )}
    </div>
  )
}

