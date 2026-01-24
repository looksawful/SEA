import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GameId, GameResult, Stats, MistakeRecord } from '@/types'
import { CustomQuestion } from '@/utils/customQuestions'

interface GameStore {
  currentGame: GameId | null
  score: number
  streak: number
  bestStreak: number
  lives: number
  timeLeft: number
  isPlaying: boolean
  isPaused: boolean
  results: GameResult[]
  stats: Stats
  soundEnabled: boolean
  currentMistakes: MistakeRecord[]
  customQuestions: Record<GameId, CustomQuestion[]>
  customMode: Record<GameId, boolean>
  
  setCurrentGame: (game: GameId | null) => void
  addScore: (points: number) => void
  resetScore: () => void
  incrementStreak: () => void
  resetStreak: () => void
  setLives: (lives: number) => void
  decrementLives: () => void
  setTimeLeft: (time: number) => void
  decrementTime: () => void
  setIsPlaying: (playing: boolean) => void
  setIsPaused: (paused: boolean) => void
  addResult: (result: GameResult) => void
  updateStats: (gameId: GameId, correct: boolean) => void
  toggleSound: () => void
  resetGame: () => void
  resetAll: () => void
  addMistake: (mistake: MistakeRecord) => void
  clearMistakes: () => void
  addCustomQuestion: (gameId: GameId, question: CustomQuestion) => void
  updateCustomQuestion: (gameId: GameId, questionId: string, question: CustomQuestion) => void
  removeCustomQuestion: (gameId: GameId, questionId: string) => void
  setCustomMode: (gameId: GameId, enabled: boolean) => void
}

const initialStats: Stats = {
  totalGames: 0,
  totalScore: 0,
  bestStreak: 0,
  gamesPlayed: {} as Record<GameId, number>,
  accuracy: {} as Record<GameId, number>,
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      currentGame: null,
      score: 0,
      streak: 0,
      bestStreak: 0,
      lives: 3,
      timeLeft: 60,
      isPlaying: false,
      isPaused: false,
      results: [],
      stats: initialStats,
      soundEnabled: true,
      currentMistakes: [],
      customQuestions: {} as Record<GameId, CustomQuestion[]>,
      customMode: {} as Record<GameId, boolean>,

      setCurrentGame: (game) => set({ currentGame: game }),
      
      addScore: (points) => set((state) => ({ 
        score: state.score + points,
        stats: { ...state.stats, totalScore: state.stats.totalScore + points }
      })),
      
      resetScore: () => set({ score: 0 }),
      
      incrementStreak: () => set((state) => {
        const newStreak = state.streak + 1
        const newBestStreak = Math.max(newStreak, state.bestStreak)
        return { 
          streak: newStreak,
          bestStreak: newBestStreak,
          stats: { ...state.stats, bestStreak: Math.max(newBestStreak, state.stats.bestStreak) }
        }
      }),
      
      resetStreak: () => set({ streak: 0 }),
      
      setLives: (lives) => set({ lives }),
      
      decrementLives: () => set((state) => ({ lives: Math.max(0, state.lives - 1) })),
      
      setTimeLeft: (time) => set({ timeLeft: time }),
      
      decrementTime: () => set((state) => ({ timeLeft: Math.max(0, state.timeLeft - 1) })),
      
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      
      setIsPaused: (paused) => set({ isPaused: paused }),
      
      addResult: (result) => set((state) => ({ 
        results: [...state.results.slice(-99), result],
        stats: { ...state.stats, totalGames: state.stats.totalGames + 1 }
      })),
      
      updateStats: (gameId, correct) => set((state) => {
        const played = (state.stats.gamesPlayed[gameId] || 0) + 1
        const prevCorrect = (state.stats.accuracy[gameId] || 0) * ((played - 1) / 100)
        const newAccuracy = ((prevCorrect + (correct ? 1 : 0)) / played) * 100
        
        return {
          stats: {
            ...state.stats,
            gamesPlayed: { ...state.stats.gamesPlayed, [gameId]: played },
            accuracy: { ...state.stats.accuracy, [gameId]: newAccuracy }
          }
        }
      }),
      
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      
      addMistake: (mistake) => set((state) => ({
        currentMistakes: [...state.currentMistakes, mistake]
      })),
      
      clearMistakes: () => set({ currentMistakes: [] }),

      addCustomQuestion: (gameId, question) =>
        set((state) => ({
          customQuestions: {
            ...state.customQuestions,
            [gameId]: [...(state.customQuestions[gameId] || []), question],
          },
        })),

      updateCustomQuestion: (gameId, questionId, question) =>
        set((state) => ({
          customQuestions: {
            ...state.customQuestions,
            [gameId]: (state.customQuestions[gameId] || []).map((item) =>
              item.id === questionId ? question : item
            ),
          },
        })),

      removeCustomQuestion: (gameId, questionId) =>
        set((state) => {
          const next = (state.customQuestions[gameId] || []).filter((question) => question.id !== questionId)
          return {
            customQuestions: { ...state.customQuestions, [gameId]: next },
            customMode: next.length === 0 ? { ...state.customMode, [gameId]: false } : state.customMode,
          }
        }),

      setCustomMode: (gameId, enabled) =>
        set((state) => ({
          customMode: { ...state.customMode, [gameId]: enabled },
        })),
      
      resetGame: () => set({ 
        score: 0, 
        streak: 0, 
        lives: 3, 
        timeLeft: 60, 
        isPlaying: false, 
        isPaused: false,
        currentMistakes: []
      }),
      
      resetAll: () => set((state) => ({ 
        currentGame: null,
        score: 0, 
        streak: 0, 
        bestStreak: 0,
        lives: 3, 
        timeLeft: 60, 
        isPlaying: false, 
        isPaused: false,
        results: [],
        stats: initialStats,
        currentMistakes: [],
        customQuestions: state.customQuestions,
        customMode: {} as Record<GameId, boolean>,
      })),
    }),
    {
      name: 'awful-exercises',
      partialize: (state) => ({ 
        stats: state.stats, 
        results: state.results,
        bestStreak: state.bestStreak,
        soundEnabled: state.soundEnabled,
        customQuestions: state.customQuestions,
        customMode: state.customMode
      }),
    }
  )
)
