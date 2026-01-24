'use client'
import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/Card'
import { Swatch } from '@/components/Swatch'
import { useGameStore } from '@/store/gameStore'
import { useNumberKeys } from '@/hooks/useKeyboard'
import { useSound } from '@/hooks/useSound'
import { randomHsl, hslToRgb, rgbToHex } from '@/utils/colors'
import { shuffle, randomInt } from '@/utils/helpers'
import { Difficulty, difficultyDots, getDifficulty } from '@/utils/difficulty'

interface HslValue {
  h: number
  s: number
  l: number
}

interface Challenge {
  color: string
  hsl: HslValue
  options: HslValue[]
  correctIndex: number
  difficulty: Difficulty
}

const generateSimilarHsl = (base: HslValue, difficulty: Difficulty): HslValue => {
  let hVar: number, sVar: number, lVar: number
  
  switch (difficulty) {
    case 'easy':
      hVar = randomInt(40, 80)
      sVar = randomInt(20, 35)
      lVar = randomInt(15, 25)
      break
    case 'medium':
      hVar = randomInt(20, 40)
      sVar = randomInt(10, 20)
      lVar = randomInt(8, 15)
      break
    case 'hard':
      hVar = randomInt(10, 20)
      sVar = randomInt(5, 12)
      lVar = randomInt(4, 8)
      break
    case 'expert':
      hVar = randomInt(6, 12)
      sVar = randomInt(3, 7)
      lVar = randomInt(2, 5)
      break
  }
  
  const direction = Math.random() > 0.5 ? 1 : -1
  
  return {
    h: ((base.h + direction * hVar) % 360 + 360) % 360,
    s: Math.max(10, Math.min(95, base.s + direction * sVar)),
    l: Math.max(15, Math.min(85, base.l + direction * lVar)),
  }
}

const generateChallenge = (round: number): Challenge => {
  const difficulty = getDifficulty(round)
  
  const hsl = {
    h: randomInt(0, 359),
    s: randomInt(30, 80),
    l: randomInt(30, 70),
  }
  
  const { r, g, b } = hslToRgb(hsl.h, hsl.s, hsl.l)
  const color = rgbToHex(r, g, b)
  
  const wrongOptions = new Set<string>()
  const wrongHslOptions: HslValue[] = []
  
  while (wrongHslOptions.length < 3) {
    const wrong = generateSimilarHsl(hsl, difficulty)
    const key = `${wrong.h}-${wrong.s}-${wrong.l}`
    if (!wrongOptions.has(key)) {
      wrongOptions.add(key)
      wrongHslOptions.push(wrong)
    }
  }
  
  const options = shuffle([hsl, ...wrongHslOptions])
  const correctIndex = options.findIndex(o => o.h === hsl.h && o.s === hsl.s && o.l === hsl.l)
  
  return { color, hsl, options, correctIndex, difficulty }
}

interface Props {
  onAnswer: (correct: boolean) => void
}

export const GuessParamsGame = ({ onAnswer }: Props) => {
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
    
    const correct = index === challenge.correctIndex
    
    if (correct) {
      const points = challenge.difficulty === 'expert' ? 230 : challenge.difficulty === 'hard' ? 200 : challenge.difficulty === 'medium' ? 150 : 120
      addScore(points)
      incrementStreak()
      playCorrect()
    } else {
      resetStreak()
      playWrong()
      const userHsl = challenge.options[index]
      
      addMistake({
        question: `Определи HSL-параметры цвета`,
        userAnswer: `H=${userHsl.h}° S=${userHsl.s}% L=${userHsl.l}%`,
        correctAnswer: `H=${challenge.hsl.h}° S=${challenge.hsl.s}% L=${challenge.hsl.l}%`,
        explanation: `H (Hue) — тон на цветовом круге (0-360°). S (Saturation) — насыщенность (0-100%). L (Lightness) — светлость (0-100%). Разница: H на ${Math.abs(userHsl.h - challenge.hsl.h)}°, S на ${Math.abs(userHsl.s - challenge.hsl.s)}%, L на ${Math.abs(userHsl.l - challenge.hsl.l)}%`,
        visual: {
          type: 'colors',
          data: { 'Цвет': challenge.color }
        }
      })
    }
    
    updateStats('guess-params', correct)
    
    setTimeout(() => {
      onAnswer(correct)
      setRound(r => r + 1)
      setChallenge(generateChallenge(round + 1))
      setSelected(null)
      setShowResult(false)
    }, 1000)
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
        <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">Угадай HSL-параметры</h2>
        <div className="text-xs text-soft mt-1">
          Сложность: {difficultyDots(challenge.difficulty)}
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
        {challenge.options.map((hsl, index) => (
          <Card
            key={index}
            onClick={() => handleSelect(index)}
            selected={selected === index}
            correct={showResult ? index === challenge.correctIndex : null}
          >
            <div className="text-center font-mono text-sm space-y-1">
              <div>H: <span className="font-bold">{hsl.h}°</span></div>
              <div>S: <span className="font-bold">{hsl.s}%</span></div>
              <div>L: <span className="font-bold">{hsl.l}%</span></div>
              <div className="hidden sm:inline text-xs text-soft">[{index + 1}]</div>
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
          <div className="font-mono">
            HSL({challenge.hsl.h}°, {challenge.hsl.s}%, {challenge.hsl.l}%)
          </div>
          <div className="text-xs mt-1 text-soft">{challenge.color.toUpperCase()}</div>
        </motion.div>
      )}
    </div>
  )
}

