'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { GAMES, GAME_ORDER } from '@/utils/gameConfig'
import { Button, Card, Skeleton, SettingsModal } from '@/components'
import { CustomQuestionsModal } from '@/components/CustomQuestions'
import { GameId } from '@/types'
import { shuffle } from '@/utils/helpers'
import { useKeyboard } from '@/hooks/useKeyboard'
import { IMAGE_QUIZ_DATA, IMAGE_QUIZ_IDS } from '@/utils/imageQuizData'
import { QUIZ_QUESTIONS } from '@/games/Quiz'
import { getGameLabel, t } from '@/utils/i18n'
import {
  FaArrowLeft,
  FaArrowRight,
  FaChartBar,
  FaCog,
  FaDice,
  FaListUl,
  FaPen,
  FaPlay,
  FaPenNib,
  FaPlus,
  FaThLarge,
  FaSearch,
  FaBars,
  FaSyncAlt,
  FaVolumeMute,
  FaVolumeUp,
  FaHome,
} from 'react-icons/fa'

type View = 'menu' | 'games' | 'stats' | 'random'
type GamesView = 'list' | 'grid'

export default function Home() {
  const [view, setView] = useState<View>('menu')
  const [mounted, setMounted] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customModalGame, setCustomModalGame] = useState<GameId | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [gameSearch, setGameSearch] = useState('')
  const [gamesView, setGamesView] = useState<GamesView>('list')
  const {
    stats,
    bestStreak,
    soundEnabled,
    toggleSound,
    resetAll,
    results,
    customQuestions,
    language,
    setLanguage,
  } = useGameStore()
  const mainClass = 'flex-1 p-4 pb-24 sm:pb-4 w-full flex items-center justify-center'
  const router = useRouter()
  const isGrid = gamesView === 'grid'
  const normalizedSearch = gameSearch.trim().toLowerCase()
  const filteredGameIds = normalizedSearch
    ? GAME_ORDER.filter((id) => {
        const game = getGameLabel(id, language)
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
            <span className="text-lg font-display font-semibold">{t(language, 'appName')}</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCustomModalGame(null)
                setShowCustomModal(true)
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl bg-surface-2 border border-subtle text-muted hover:text-strong hover:bg-surface-3 transition-colors"
              title={t(language, 'customQuestions')}
            >
              <FaPenNib className="text-base" />
              <span className="hidden sm:inline">{t(language, 'customQuestions')}</span>
            </button>
            <button
              onClick={toggleSound}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl bg-surface-2 border border-subtle text-muted hover:text-strong hover:bg-surface-3 transition-colors"
              title={soundEnabled ? t(language, 'soundOn') : t(language, 'soundOff')}
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? <FaVolumeUp className="text-base" /> : <FaVolumeMute className="text-base" />}
              <span className="hidden sm:inline">
                {soundEnabled ? t(language, 'soundOn') : t(language, 'soundOff')}
              </span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl bg-surface-2 border border-subtle text-muted hover:text-strong hover:bg-surface-3 transition-colors"
              title={t(language, 'settings')}
            >
              <FaCog className="text-base" />
              <span className="hidden sm:inline">{t(language, 'settings')}</span>
            </button>
            <div
              className="flex items-center rounded-xl border border-subtle bg-surface-2 p-1"
              role="group"
              aria-label={t(language, 'uiLanguage')}
            >
              <button
                onClick={() => setLanguage('ru')}
                className={`px-2 py-1 text-xs rounded-lg ${
                  language === 'ru' ? 'bg-surface-3 text-strong' : 'text-muted hover:text-strong'
                }`}
                aria-pressed={language === 'ru'}
              >
                RU
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 text-xs rounded-lg ${
                  language === 'en' ? 'bg-surface-3 text-strong' : 'text-muted hover:text-strong'
                }`}
                aria-pressed={language === 'en'}
              >
                EN
              </button>
            </div>
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
              className="space-y-6 w-full max-w-md mx-auto"
            >
              <div className="bg-surface border border-subtle rounded-3xl p-6 shadow-card space-y-3">
                <Button onClick={() => setView('games')} fullWidth size="lg">
                  <span className="inline-flex items-center justify-center gap-2">
                    <FaListUl className="text-base" />
                    {t(language, 'chooseExercise')}
                  </span>
                </Button>
                <Button onClick={() => setView('random')} variant="secondary" fullWidth size="lg">
                  <span className="inline-flex items-center justify-center gap-2">
                    <FaDice className="text-base" />
                    {t(language, 'randomMode')}
                  </span>
                </Button>
                <Button onClick={() => setView('stats')} variant="ghost" fullWidth>
                  <span className="inline-flex items-center justify-center gap-2">
                    <FaChartBar className="text-base" />
                    {t(language, 'stats')}
                  </span>
                </Button>
                <Button onClick={() => setShowSettings(true)} variant="ghost" fullWidth>
                  <span className="inline-flex items-center justify-center gap-2">
                    <FaCog className="text-base" />
                    {t(language, 'settings')}
                  </span>
                </Button>
                <div className="text-center text-xs text-soft pt-2 hidden sm:block">
                  {t(language, 'hotkeys')}
                </div>
              </div>

              {stats.totalGames > 0 && (
                <Card className="mt-8 shadow-card">
                  <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-mono font-bold">{stats.totalScore.toLocaleString()}</div>
                    <div className="text-xs text-muted">{t(language, 'totalScore')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-mono font-bold">{stats.totalGames}</div>
                    <div className="text-xs text-muted">{t(language, 'games')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-mono font-bold">{bestStreak}</div>
                    <div className="text-xs text-muted">{t(language, 'bestStreak')}</div>
                  </div>
                  </div>
                </Card>
              )}

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
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <button onClick={() => setView('menu')} className="p-2 -ml-2 text-muted hover:text-strong">
                  <FaArrowLeft />
                </button>
                <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight flex-1">
                  {t(language, 'chooseExerciseTitle')}
                </h2>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setGamesView('list')}
                    className={`w-9 h-9 rounded-xl border border-subtle flex items-center justify-center ${
                      gamesView === 'list'
                        ? 'bg-surface-3 text-strong'
                        : 'bg-surface-2 text-muted hover:text-strong'
                    }`}
                    aria-pressed={gamesView === 'list'}
                    title={t(language, 'listView')}
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
                    title={t(language, 'gridView')}
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
                  placeholder={t(language, 'searchPlaceholder')}
                  aria-label={t(language, 'searchLabel')}
                />
                {gameSearch.length > 0 && (
                  <button
                    onClick={() => setGameSearch('')}
                    className="text-xs text-muted hover:text-strong"
                  >
                    {t(language, 'clear')}
                  </button>
                )}
              </div>

              <div className={isGrid ? 'grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3' : 'grid gap-3'}>
                {filteredGameIds.map((id) => {
                  const game = GAMES[id]
                  const gameLabel = getGameLabel(id, language)
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
                      className="transition-colors shadow-card min-w-0"
                      padding={isGrid ? 'sm' : 'md'}
                      onClick={() => router.push(`/game/${id}`)}
                    >
                      <div className={isGrid ? 'flex flex-col gap-3' : 'flex items-start gap-4'}>
                        <div
                          className={`${
                            isGrid ? 'w-10 h-10' : 'w-12 h-12'
                          } rounded-2xl bg-surface-2 border border-subtle flex items-center justify-center text-accent ${
                            isGrid ? '' : 'flex-shrink-0'
                          }`}
                        >
                          <GameIcon className={isGrid ? 'text-xl' : 'text-2xl'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={isGrid ? 'font-medium text-sm sm:text-base' : 'font-medium'}>
                            {gameLabel.name}
                          </div>
                          {!isGrid && (
                            <div className="text-sm text-muted">
                              <span className="truncate block">{gameLabel.description}</span>
                            </div>
                          )}
                          <div className={isGrid ? 'text-[11px] text-soft mt-2 space-y-1' : 'text-xs text-soft mt-2 space-y-1'}>
                            {questionStats ? (
                              <div>
                                {t(language, 'questions')}: {questionStats.total}
                              </div>
                            ) : (
                              <div>
                                {t(language, 'questions')}: {t(language, 'generated')}
                              </div>
                            )}
                            <div>
                              {t(language, 'played')}: {played} • {t(language, 'accuracy')}:{' '}
                              {Math.round(accuracy || 0)}%
                            </div>
                            {!isGrid && (
                              <div>
                                {t(language, 'lastResult')}:{' '}
                                {lastResult
                                  ? `${lastResult.correct}/${lastResult.total} (${lastAccuracy}%)`
                                  : '—'}
                              </div>
                            )}
                            {!isGrid && customCount > 0 && (
                              <div>
                                {t(language, 'customQuestionsCount')}: {customCount}
                              </div>
                            )}
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

                      <div className={isGrid ? 'mt-3 grid grid-cols-2 gap-2' : 'mt-4 flex flex-wrap gap-2'}>
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            setCustomModalGame(id)
                            setShowCustomModal(true)
                          }}
                          className={`inline-flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-xl bg-surface-2 border border-subtle text-muted hover:text-strong hover:bg-surface-3 transition-colors ${
                            isGrid ? 'w-full' : ''
                          }`}
                        >
                          <FaPlus className="text-xs" />
                          <span className={isGrid ? 'hidden sm:inline' : ''}>{t(language, 'addQuestions')}</span>
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            setCustomModalGame(id)
                            setShowCustomModal(true)
                          }}
                          className={`inline-flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-xl bg-surface-2 border border-subtle text-muted hover:text-strong hover:bg-surface-3 transition-colors ${
                            isGrid ? 'w-full' : ''
                          }`}
                        >
                          <FaPen className="text-xs" />
                          <span className={isGrid ? 'hidden sm:inline' : ''}>{t(language, 'edit')}</span>
                        </button>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {filteredGameIds.length === 0 && (
                <div className="text-center text-sm text-muted py-8">
                  {t(language, 'noResults')}
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
                <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight">
                  {t(language, 'statsTitle')}
                </h2>
              </div>

              <Card className="shadow-card">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold">{stats.totalScore.toLocaleString()}</div>
                    <div className="text-sm text-muted">{t(language, 'totalScore')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold">{stats.totalGames}</div>
                    <div className="text-sm text-muted">{t(language, 'gamesPlayed')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold">{bestStreak}</div>
                    <div className="text-sm text-muted">{t(language, 'bestStreak')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold">
                      {Object.values(stats.accuracy).length > 0 
                        ? Math.round(Object.values(stats.accuracy).reduce((a, b) => a + b, 0) / Object.values(stats.accuracy).length)
                        : 0}%
                    </div>
                    <div className="text-sm text-muted">{t(language, 'averageAccuracy')}</div>
                  </div>
                </div>
              </Card>

              <h3 className="text-lg font-display font-semibold tracking-tight mt-6 mb-3 text-strong">
                {t(language, 'byGames')}
              </h3>
              <div className="space-y-2">
                {GAME_ORDER.map((id) => {
                  const game = GAMES[id]
                  const played = stats.gamesPlayed[id] || 0
                  const accuracy = stats.accuracy[id] || 0
                  const GameIcon = game.icon
                  const gameLabel = getGameLabel(id, language)

                  return (
                    <div key={id} className="flex items-center gap-3 p-3 bg-surface border border-subtle rounded-lg shadow-card">
                      <span className="w-9 h-9 rounded-xl bg-surface border border-subtle flex items-center justify-center text-accent">
                        <GameIcon className="text-lg" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{gameLabel.name}</div>
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
                    if (confirm(t(language, 'resetStatsConfirm'))) {
                      resetAll()
                    }
                  }}
                  variant="danger"
                  fullWidth
                >
                  {t(language, 'resetStats')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-subtle bg-[color:var(--surface-1-80)] backdrop-blur sm:hidden">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          <button
            onClick={() => setView('menu')}
            className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs ${
              view === 'menu' ? 'bg-surface-3 text-strong' : 'text-muted'
            }`}
          >
            <FaHome className="text-base" />
            {t(language, 'home')}
          </button>
          <button
            onClick={() => setView('games')}
            className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs ${
              view === 'games' ? 'bg-surface-3 text-strong' : 'text-muted'
            }`}
          >
            <FaListUl className="text-base" />
            {t(language, 'gamesNav')}
          </button>
          <button
            onClick={() => setView('random')}
            className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs ${
              view === 'random' ? 'bg-surface-3 text-strong' : 'text-muted'
            }`}
          >
            <FaDice className="text-base" />
            {t(language, 'randomNav')}
          </button>
          <button
            onClick={() => setView('stats')}
            className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs ${
              view === 'stats' ? 'bg-surface-3 text-strong' : 'text-muted'
            }`}
          >
            <FaChartBar className="text-base" />
            {t(language, 'stats')}
          </button>
        </div>
      </nav>

      {showCustomModal && (
        <CustomQuestionsModal
          onClose={() => {
            setShowCustomModal(false)
            setCustomModalGame(null)
          }}
          initialGameId={customModalGame ?? undefined}
        />
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
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
  const { language, longTestLength } = useGameStore()

  const reroll = () => {
    setQueue(shuffle([...GAME_ORDER]))
  }

  useEffect(() => {
    reroll()
  }, [])

  useKeyboard(
    {
      r: reroll,
    },
    true,
  )

  if (queue.length === 0) {
    return <div className="text-muted">{t(language, 'loading')}</div>
  }

  const currentGame = queue[currentIndex]
  const CurrentIcon = GAMES[currentGame].icon
  const currentLabel = getGameLabel(currentGame, language)
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
      className="space-y-6 w-full max-w-xl mx-auto"
    >
      <div className="grid grid-cols-[auto,1fr,auto] items-center">
        <button onClick={onBack} className="p-2 -ml-2 text-muted hover:text-strong">
          <FaArrowLeft />
        </button>
        <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-center">
          {t(language, 'randomModeTitle')}
        </h2>
        <div className="w-8" />
      </div>

      <div className="text-center bg-surface border border-subtle rounded-3xl p-6 space-y-3 shadow-card">
        <div className="text-xs text-muted uppercase tracking-[0.2em]">
          {t(language, 'gameOf', { current: currentIndex + 1, total: queue.length })}
        </div>
        <div className="text-5xl text-accent">
          <CurrentIcon />
        </div>
        <div className="text-xl font-medium">{currentLabel.name}</div>
      </div>

      <div className="text-center bg-surface border border-subtle rounded-3xl p-6 space-y-4 shadow-card">
        <div className="text-xs text-muted uppercase tracking-[0.2em]">{t(language, 'longTest')}</div>
        <div className="text-lg font-medium">{t(language, 'longTestDescription')}</div>
        <div className="text-xs text-soft">
          {t(language, 'questionCount')}: {longTestLength}
        </div>
        <Button onClick={() => router.push('/game/long-test')} fullWidth>
          <span className="inline-flex items-center justify-center gap-2">
            <FaPlay className="text-base" />
            {t(language, 'start')}
          </span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto w-full">
        <Button onClick={onBack} variant="ghost" fullWidth>
          {t(language, 'cancel')}
        </Button>
        <Button onClick={handleStart} fullWidth>
          <span className="inline-flex items-center justify-center gap-2">
            <FaPlay className="text-base" />
            {t(language, 'start')}
          </span>
        </Button>
      </div>

      <Button onClick={reroll} variant="secondary" fullWidth hotkey="R">
        <span className="inline-flex items-center justify-center gap-2">
          <FaSyncAlt className="text-base" />
          {t(language, 'reroll')}
        </span>
      </Button>

      <div className="flex gap-1 justify-center">
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
