import type { IconType } from "react-icons"

export type GameId = 
  | 'color-compare'
  | 'font-size'
  | 'guess-font'
  | 'color-params'
  | 'color-temperature'
  | 'accessibility'
  | 'palette-error'
  | 'size-sequence'
  | 'complementary'
  | 'guess-hex'
  | 'guess-params'
  | 'quiz'
  | 'theme-analog'
  | 'font-weight'
  | 'artist-guess'
  | 'style-guess'
  | 'image-size'
  | 'image-format'
  | 'color-eye'
  | 'color-wheel'
  | 'film-type'
  | 'composition-technique'
  | 'focal-length'
  | 'wcag-issue'
  | 'button-color'
  | 'font-size-choice'
  | 'layout-error'
  | 'palette-from-photo'
  | 'long-test'

export type GameTag =
  | 'design'
  | 'interface'
  | 'color'
  | 'typography'
  | 'layout'
  | 'photo'
  | 'accessibility'
  | 'theory'

export interface GameConfig {
  id: GameId
  name: string
  description: string
  tags: GameTag[]
  icon: IconType
  timeLimit: number
  pointsPerCorrect: number
}

export interface MistakeRecord {
  question: string
  userAnswer: string
  correctAnswer: string
  explanation: string
  visual?: {
    type: 'colors' | 'text' | 'contrast'
    data: Record<string, string | number>
  }
}

export interface GameResult {
  gameId: GameId
  score: number
  maxScore: number
  time: number
  correct: number
  total: number
  timestamp: number
  mistakes: MistakeRecord[]
}

export interface GameState {
  currentGame: GameId | null
  score: number
  streak: number
  lives: number
  timeLeft: number
  isPlaying: boolean
  isPaused: boolean
  results: GameResult[]
}

export interface Challenge {
  id: string
  type: string
  data: unknown
  answer: unknown
  points: number
}

export interface Stats {
  totalGames: number
  totalScore: number
  bestStreak: number
  gamesPlayed: Record<GameId, number>
  accuracy: Record<GameId, number>
}
