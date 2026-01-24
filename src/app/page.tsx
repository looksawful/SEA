'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { GAMES, GAME_ORDER } from '@/utils/gameConfig'
import { Button, Card, Skeleton } from '@/components'
import { CustomQuestionsModal } from '@/components/CustomQuestions'
import { GameId } from '@/types'
import { shuffle } from '@/utils/helpers'
import { IMAGE_QUIZ_DATA, IMAGE_QUIZ_IDS } from '@/utils/imageQuizData'
import { QUIZ_QUESTIONS } from '@/games/Quiz'
import {
  FaArrowLeft,
  FaArrowRight,
  FaChartBar,
  FaDice,
  FaListUl,
  FaPen,
  FaPlay,
  FaPenNib,
  FaPlus,
  FaThLarge,
  FaSearch,
  FaBars,
  FaVolumeMute,
  FaVolumeUp,
} from 'react-icons/fa'

type View = 'menu' | 'games' | 'stats' | 'random'
type GamesView = 'list' | 'grid'

export default function Home() {
  const [view, setView] = useState<View>('menu')
  const [mounted, setMounted] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customModalGame, setCustomModalGame] = useState<GameId | null>(null)
  const [gameSearch, setGameSearch] = useState('')
  const [gamesView, setGamesView] = useState<GamesView>('list')
  const { stats, bestStreak, soundEnabled, toggleSound, resetAll, results, customQuestions } =
    useGameStore()
  const mainClass = 'flex-1 p-4 w-full flex items-center justify-center'
  const router = useRouter()
  const normalizedSearch = gameSearch.trim().toLowerCase()
  const filteredGameIds = normalizedSearch
    ? GAME_ORDER.filter((id) => {
        const game = GAMES[id]
        return (
          game.name.toLowerCase().includes(normalizedSearch) ||
          game.description.toLowerCase().includes(normalizedSearch)
        )
      })
    : GAME_ORDER

  const getQuestionStats = (gameId: GameId) => {
    if (gameId === 'quiz') {
      return countDifficulties(QUIZ_QUESTIONS)
    }

    if (IMAGE_QUIZ_IDS.includes(gameId as (typeof IMAGE_QUIZ_IDS)[number])) {
      return countDifficulties(IMAGE_QUIZ_DATA[gameId as keyof typeof IMAGE_QUIZ_DATA] || [])
    }

    return null
  }

  const formatDifficulty = (counts: DifficultyCounts) => {
    const parts = [
      `Л ${counts.easy}`,
      `С ${counts.medium}`,
      `Т ${counts.hard}`,
      `Э ${counts.expert}`,
    ]
    if (counts.unknown > 0) {
      parts.push(`? ${counts.unknown}`)
    }
    return parts.join(' • ')
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-32 w-full rounded-3xl" />
          <div className="grid gap-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-10 w-2/3 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b border-subtle bg-[color:var(--surface-1-80)] backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setView('menu')} className="flex items-center gap-2">
            <span className="text-lg font-display font-semibold">painful</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCustomModalGame(null)
                setShowCustomModal(true)
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl bg-surface-2 border border-subtle text-muted hover:text-strong hover:bg-surface-3 transition-colors"
              title="Свои вопросы"
            >
              <FaPenNib className="text-base" />
              <span className="hidden sm:inline">Свои вопросы</span>
            </button>
            <button
              onClick={toggleSound}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl bg-surface-2 border border-subtle text-muted hover:text-strong hover:bg-surface-3 transition-colors"
              title={soundEnabled ? 'Выключить звук' : 'Включить звук'}
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? <FaVolumeUp className="text-base" /> : <FaVolumeMute className="text-base" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Звук включен' : 'Звук выключен'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className={mainClass}>
        <AnimatePresence mode="wait">
          {view === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 w-full max-w-md"
            >
              <div className="space-y-3">
                <Button onClick={() => setView('games')} fullWidth size="lg">
                  <span className="inline-flex items-center justify-center gap-2">
                    <FaListUl className="text-base" />
                    Выбрать упражнение
                  </span>
                </Button>
                <Button onClick={() => setView('random')} variant="secondary" fullWidth size="lg">
                  <span className="inline-flex items-center justify-center gap-2">
                    <FaDice className="text-base" />
                    Случайный режим
                  </span>
                </Button>
                <Button onClick={() => setView('stats')} variant="ghost" fullWidth>
                  <span className="inline-flex items-center justify-center gap-2">
                    <FaChartBar className="text-base" />
                    Статистика
                  </span>
                </Button>
              </div>

              {stats.totalGames > 0 && (
                <Card className="mt-8">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-mono font-bold">{stats.totalScore.toLocaleString()}</div>
                      <div className="text-xs text-muted">Всего очков</div>
                    </div>
                    <div>
                      <div className="text-2xl font-mono font-bold">{stats.totalGames}</div>
                      <div className="text-xs text-muted">Игр</div>
                    </div>
                    <div>
                      <div className="text-2xl font-mono font-bold">{bestStreak}</div>
                      <div className="text-xs text-muted">Лучшая серия</div>
                    </div>
                  </div>
                </Card>
              )}

              <div className="text-center text-xs text-soft mt-8">
                Горячие клавиши: 1-4 выбор • P пауза • Esc выход
              </div>
            </motion.div>
          )}

          {view === 'games' && (
            <motion.div
              key="games"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 w-full max-w-4xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setView('menu')} className="p-2 -ml-2 text-muted hover:text-strong">
                  <FaArrowLeft />
                </button>
                <h2 className="text-xl font-display font-semibold flex-1">Выбери упражнение</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGamesView('list')}
                    className={`w-9 h-9 rounded-xl border border-subtle flex items-center justify-center ${
                      gamesView === 'list'
                        ? 'bg-surface-3 text-strong'
                        : 'bg-surface-2 text-muted hover:text-strong'
                    }`}
                    aria-pressed={gamesView === 'list'}
                    title="Список"
                  >
                    <FaBars />
                  </button>
                  <button
                    onClick={() => setGamesView('grid')}
                    className={`w-9 h-9 rounded-xl border border-subtle flex items-center justify-center ${
                      gamesView === 'grid'
                        ? 'bg-surface-3 text-strong'
                        : 'bg-surface-2 text-muted hover:text-strong'
                    }`}
                    aria-pressed={gamesView === 'grid'}
                    title="Плитка"
                  >
                    <FaThLarge />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-subtle bg-surface-2">
                <FaSearch className="text-muted" />
                <input
                  value={gameSearch}
                  onChange={(event) => setGameSearch(event.target.value)}
                  className="flex-1 bg-transparent text-sm text-strong placeholder:text-soft focus:outline-none"
                  placeholder="Поиск по названию или описанию"
                  aria-label="Поиск упражнений"
                />
                {gameSearch.length > 0 && (
                  <button
                    onClick={() => setGameSearch('')}
                    className="text-xs text-muted hover:text-strong"
                  >
                    Очистить
                  </button>
                )}
              </div>

              <div className={gamesView === 'grid' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3' : 'grid gap-3'}>
                {filteredGameIds.map((id) => {
                  const game = GAMES[id]
                  const played = stats.gamesPlayed[id] || 0
                  const accuracy = stats.accuracy[id]
                  const customCount = customQuestions[id]?.length || 0
                  const GameIcon = game.icon
                  const questionStats = getQuestionStats(id)
                  const lastResult = [...results].reverse().find((result) => result.gameId === id)
                  const lastAccuracy = lastResult
                    ? Math.round((lastResult.correct / Math.max(1, lastResult.total)) * 100)
                    : null

                  return (
                    <Card
                      key={id}
                      className="transition-colors"
                      onClick={() => router.push(`/game/${id}`)}
                    >
                      <div className={gamesView === 'grid' ? 'flex flex-col gap-4' : 'flex items-start gap-4'}>
                        <div
                          className={`w-12 h-12 rounded-2xl bg-surface-2 border border-subtle flex items-center justify-center text-accent ${
                            gamesView === 'grid' ? '' : 'flex-shrink-0'
                          }`}
                        >
                          <GameIcon className="text-2xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{game.name}</div>
                          <div className="text-sm text-muted truncate">{game.description}</div>
                          <div className="text-xs text-soft mt-2 space-y-1">
                            {questionStats ? (
                              <div>
                                Вопросов: {questionStats.total} • Сложность: {formatDifficulty(questionStats)}
                              </div>
                            ) : (
                              <div>Вопросы: генеративные • Сложность: адаптивная</div>
                            )}
                            <div>
                              Сыграно: {played} • Точность: {Math.round(accuracy || 0)}%
                            </div>
                            <div>
                              Последний результат:{' '}
                              {lastResult
                                ? `${lastResult.correct}/${lastResult.total} (${lastAccuracy}%)`
                                : '—'}
                            </div>
                            {customCount > 0 && <div>Свои вопросы: {customCount}</div>}
                          </div>
                        </div>
                        <div className={gamesView === 'grid' ? 'flex justify-between gap-2' : 'text-soft'}>
                          {gamesView === 'grid' ? (
                            <div className="text-soft self-center">
                              <FaArrowRight />
                            </div>
                          ) : (
                            <FaArrowRight />
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            setCustomModalGame(id)
                            setShowCustomModal(true)
                          }}
                          className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-xl bg-surface-2 border border-subtle text-muted hover:text-strong hover:bg-surface-3 transition-colors"
                        >
                          <FaPlus className="text-xs" />
                          Добавить вопросы
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            setCustomModalGame(id)
                            setShowCustomModal(true)
                          }}
                          className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-xl bg-surface-2 border border-subtle text-muted hover:text-strong hover:bg-surface-3 transition-colors"
                        >
                          <FaPen className="text-xs" />
                          Редактировать
                        </button>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {filteredGameIds.length === 0 && (
                <div className="text-center text-sm text-muted py-8">
                  Ничего не найдено. Попробуй другое слово.
                </div>
              )}
            </motion.div>
          )}

          {view === 'random' && (
            <div className="w-full max-w-4xl">
              <RandomMode onBack={() => setView('menu')} />
            </div>
          )}

          {view === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 w-full max-w-4xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setView('menu')} className="p-2 -ml-2 text-muted hover:text-strong">
                  <FaArrowLeft />
                </button>
                <h2 className="text-xl font-display font-semibold">Статистика</h2>
              </div>

              <Card>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold">{stats.totalScore.toLocaleString()}</div>
                    <div className="text-sm text-muted">Всего очков</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold">{stats.totalGames}</div>
                    <div className="text-sm text-muted">Игр сыграно</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold">{bestStreak}</div>
                    <div className="text-sm text-muted">Лучшая серия</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold">
                      {Object.values(stats.accuracy).length > 0 
                        ? Math.round(Object.values(stats.accuracy).reduce((a, b) => a + b, 0) / Object.values(stats.accuracy).length)
                        : 0}%
                    </div>
                    <div className="text-sm text-muted">Средняя точность</div>
                  </div>
                </div>
              </Card>

              <h3 className="font-medium mt-6 mb-3 text-strong">По играм</h3>
              <div className="space-y-2">
                {GAME_ORDER.map((id) => {
                  const game = GAMES[id]
                  const played = stats.gamesPlayed[id] || 0
                  const accuracy = stats.accuracy[id] || 0
                  const GameIcon = game.icon

                  return (
                    <div key={id} className="flex items-center gap-3 p-3 bg-surface-2 border border-subtle rounded-lg">
                      <span className="w-9 h-9 rounded-xl bg-surface border border-subtle flex items-center justify-center text-accent">
                        <GameIcon className="text-lg" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{game.name}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-mono">{played}</div>
                        <div className="text-xs text-soft">{Math.round(accuracy)}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="pt-6">
                <Button 
                  onClick={() => {
                    if (confirm('Сбросить всю статистику?')) {
                      resetAll()
                    }
                  }}
                  variant="danger"
                  fullWidth
                >
                  Сбросить статистику
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {showCustomModal && (
        <CustomQuestionsModal
          onClose={() => {
            setShowCustomModal(false)
            setCustomModalGame(null)
          }}
          initialGameId={customModalGame ?? undefined}
        />
      )}
    </div>
  )
}

type DifficultyCounts = {
  easy: number
  medium: number
  hard: number
  expert: number
  unknown: number
  total: number
}

const countDifficulties = (items: { difficulty?: string }[]): DifficultyCounts => {
  return items.reduce(
    (acc, item) => {
      const diff = item.difficulty || 'unknown'
      if (diff === 'easy') acc.easy += 1
      else if (diff === 'medium') acc.medium += 1
      else if (diff === 'hard') acc.hard += 1
      else if (diff === 'expert') acc.expert += 1
      else acc.unknown += 1
      acc.total += 1
      return acc
    },
    { easy: 0, medium: 0, hard: 0, expert: 0, unknown: 0, total: 0 },
  )
}

function RandomMode({ onBack }: { onBack: () => void }) {
  const router = useRouter()
  const [queue, setQueue] = useState<GameId[]>([])
  const currentIndex = 0

  useEffect(() => {
    setQueue(shuffle([...GAME_ORDER]))
  }, [])

  if (queue.length === 0) {
    return <div className="text-muted">Загрузка...</div>
  }

  const currentGame = queue[currentIndex]
  const CurrentIcon = GAMES[currentGame].icon
  const nextQueue = queue.slice(currentIndex + 1)
  const handleStart = () => {
    const nextParam = nextQueue.length > 0 ? `?next=${encodeURIComponent(JSON.stringify(nextQueue))}` : ''
    router.push(`/game/${currentGame}${nextParam}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-muted hover:text-strong">
          <FaArrowLeft />
        </button>
        <h2 className="text-xl font-display font-semibold">Случайный режим</h2>
      </div>

      <div className="text-center py-4">
        <div className="text-sm text-muted mb-2">
          Игра {currentIndex + 1} из {queue.length}
        </div>
        <div className="text-4xl mb-2 text-accent">
          <CurrentIcon />
        </div>
        <div className="text-xl font-medium">{GAMES[currentGame].name}</div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="ghost" fullWidth>
          Отмена
        </Button>
        <Button onClick={handleStart} fullWidth>
          <span className="inline-flex items-center justify-center gap-2">
            <FaPlay className="text-base" />
            Начать
          </span>
        </Button>
      </div>

      <div className="flex gap-1 justify-center mt-4">
        {queue.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${i === currentIndex ? 'bg-[color:var(--accent)]' : 'bg-surface-3'}`}
          />
        ))}
      </div>
    </motion.div>
  )
}
