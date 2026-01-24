'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/Card'
import { useGameStore } from '@/store/gameStore'
import { useNumberKeys } from '@/hooks/useKeyboard'
import { useSound } from '@/hooks/useSound'
import { shuffle, pickRandom } from '@/utils/helpers'
import { getFontSizeClass } from '@/utils/fonts'
import { Difficulty, difficultyDots, getDifficulty } from '@/utils/difficulty'

const TYPE_SCALES = {
  modular: [12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72],
  linear: [12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32],
  ios: [11, 13, 15, 17, 20, 22, 28, 34],
  material: [10, 12, 14, 16, 20, 24, 34, 48, 60],
  bootstrap: [12, 14, 16, 20, 24, 28, 32, 36, 48],
  editorial: [14, 16, 18, 22, 26, 32, 40, 52, 64],
  compact: [10, 11, 12, 13, 14, 15, 16, 17, 18],
}

const FALLBACK_TEXTS = [
  'Типографика',
  'Design System',
  'Визуальный баланс',
  'Негативное пространство',
  'Композиция',
  'Гармония цвета',
  'Иерархия',
  'Консистентность',
  'Читаемость',
  'Контраст',
  'Ритм и паттерн',
  'Модульная сетка',
  'Выравнивание',
  'Доступность',
  'Интерфейс',
  'Пропорции',
  'Баланс',
  'Контекст',
  'Гарнитура',
  'Распознавание',
  'Навигация',
  'Привычка',
  'Сетка',
  'Ритм',
  'Градация',
  'Группа',
  'Отклик',
  'Тон',
  'Динамика',
]

interface Challenge {
  size: number
  text: string
  options: number[]
  difficulty: Difficulty
  scale: string
}

const getDifficultyOptions = (correctSize: number, scale: number[], difficulty: Difficulty): number[] => {
  const idx = scale.indexOf(correctSize)
  let options: number[]
  
  switch (difficulty) {
    case 'easy':
      options = [
        correctSize,
        scale[Math.max(0, idx - 2)] || correctSize - 8,
        scale[Math.min(scale.length - 1, idx + 2)] || correctSize + 8,
        scale[Math.max(0, idx - 3)] || correctSize - 12,
      ]
      break
    case 'medium':
      options = [
        correctSize,
        scale[Math.max(0, idx - 1)] || correctSize - 3,
        scale[Math.min(scale.length - 1, idx + 1)] || correctSize + 3,
        correctSize + (Math.random() > 0.5 ? 4 : -4),
      ]
      break
    case 'hard':
      options = [
        correctSize,
        correctSize + 1,
        correctSize - 1,
        correctSize + 2,
      ]
      break
    case 'expert':
      options = [
        correctSize,
        correctSize + 1,
        correctSize - 1,
        correctSize + (Math.random() > 0.5 ? 2 : -2),
      ]
      break
  }
  
  return shuffle([...new Set(options.map(Math.round).filter(n => n > 0))]).slice(0, 4)
}

interface Props {
  onAnswer: (correct: boolean) => void
}

export const FontSizeGame = ({ onAnswer }: Props) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [round, setRound] = useState(0)
  const [randomTexts, setRandomTexts] = useState<string[]>([])
  const textIndexRef = useRef(0)
  const { addScore, incrementStreak, resetStreak, updateStats, addMistake } = useGameStore()
  const { playCorrect, playWrong } = useSound()

  useEffect(() => {
    const fetchTexts = async () => {
      try {
        const response = await fetch('https://fish-text.ru/get?type=sentence&number=20')
        const data = await response.json()
        if (data.status === 'success' && data.text) {
          const sentences = data.text.split(/[.!?]+/).filter((s: string) => s.trim().length > 3 && s.trim().length < 30)
          if (sentences.length > 0) {
            setRandomTexts(sentences.map((s: string) => s.trim()))
            return
          }
        }
      } catch (e) {
      }
      
      try {
        const response = await fetch('https://baconipsum.com/api/?type=all-meat&sentences=15')
        const data = await response.json()
        if (Array.isArray(data) && data[0]) {
          const words = data[0].split(' ').filter((w: string) => w.length > 2)
          const phrases = []
          for (let i = 0; i < words.length - 1; i += 2) {
            phrases.push(words.slice(i, i + 2).join(' '))
          }
          if (phrases.length > 0) {
            setRandomTexts(phrases)
            return
          }
        }
      } catch (e) {
      }
      
      setRandomTexts(shuffle([...FALLBACK_TEXTS]))
    }
    
    fetchTexts()
  }, [])

  const generateChallenge = useCallback((roundNum: number): Challenge => {
    const difficulty: Difficulty = getDifficulty(roundNum)
    const scaleNames = Object.keys(TYPE_SCALES) as (keyof typeof TYPE_SCALES)[]
    const scaleName = pickRandom(scaleNames)
    const scale = TYPE_SCALES[scaleName]
    
    const availableSizes = difficulty === 'hard' 
      ? scale.filter(s => s >= 14 && s <= 36)
      : scale.filter(s => s >= 12 && s <= 48)
    
    const size = pickRandom(availableSizes)
    
    let text: string
    if (randomTexts.length > 0) {
      text = randomTexts[textIndexRef.current % randomTexts.length]
      textIndexRef.current++
    } else {
      text = pickRandom(FALLBACK_TEXTS)
    }
    
    const options = getDifficultyOptions(size, scale, difficulty)
    
    if (!options.includes(size)) {
      options[0] = size
    }
    
    return {
      size,
      text,
      options: shuffle(options),
      difficulty,
      scale: scaleName,
    }
  }, [randomTexts])

  useEffect(() => {
    if (randomTexts.length > 0 || round === 0) {
      setChallenge(generateChallenge(round))
    }
  }, [randomTexts])

  const handleSelect = useCallback((index: number) => {
    if (showResult || !challenge) return
    
    setSelected(index)
    setShowResult(true)
    
    const userAnswer = challenge.options[index]
    const correct = userAnswer === challenge.size
    
    if (correct) {
      const points = challenge.difficulty === 'expert' ? 180 : challenge.difficulty === 'hard' ? 150 : challenge.difficulty === 'medium' ? 120 : 100
      addScore(points)
      incrementStreak()
      playCorrect()
    } else {
      resetStreak()
      playWrong()
      addMistake({
        question: `Какой размер шрифта? (текст: "${challenge.text}")`,
        userAnswer: `${userAnswer}px`,
        correctAnswer: `${challenge.size}px`,
        explanation: `Разница между ${userAnswer}px и ${challenge.size}px составляет ${Math.abs(userAnswer - challenge.size)}px. Тренируйте глаз на модульных шкалах: ${TYPE_SCALES.modular.slice(0, 6).join(', ')}...`,
      })
    }
    
    updateStats('font-size', correct)
    
    setTimeout(() => {
      onAnswer(correct)
      const newRound = round + 1
      setRound(newRound)
      setChallenge(generateChallenge(newRound))
      setSelected(null)
      setShowResult(false)
    }, 1000)
  }, [challenge, showResult, round, generateChallenge])

  useNumberKeys((num) => {
    if (num < (challenge?.options.length || 0)) {
      handleSelect(num)
    }
  }, !showResult)

  if (!challenge) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-soft">Загрузка...</div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg sm:text-xl font-medium">Какой это размер шрифта?</h2>
        <div className="text-xs text-soft mt-1">
          Сложность: {difficultyDots(challenge.difficulty)}
        </div>
      </div>
      
      <div className="bg-surface-2 rounded-2xl p-8 flex items-center justify-center min-h-40 border border-subtle shadow-card">
        <motion.span 
          className={`font-medium text-strong select-none text-center ${getFontSizeClass(challenge.size)}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          key={challenge.text}
        >
          {challenge.text}
        </motion.span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {challenge.options.map((size, index) => (
          <Card
            key={index}
            onClick={() => handleSelect(index)}
            selected={selected === index}
            correct={showResult ? size === challenge.size : null}
          >
            <div className="text-center">
              <span className="font-mono text-lg">{size}px</span>
              <span className="hidden sm:inline text-xs text-soft ml-2">[{index + 1}]</span>
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
          Правильный размер: <span className="font-mono font-medium">{challenge.size}px</span>
          <span className="text-xs block mt-1 text-soft">Шкала: {challenge.scale}</span>
        </motion.div>
      )}
    </div>
  )
}
