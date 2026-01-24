'use client'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number
  max: number
  color?: 'default' | 'success' | 'warning' | 'danger'
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export const ProgressBar = ({
  value,
  max,
  color = 'default',
  showLabel = false,
  size = 'md',
}: ProgressBarProps) => {
  const percentage = Math.min(100, (value / max) * 100)
  
  const colors = {
    default: 'bg-[color:var(--accent)]',
    success: 'bg-[color:var(--success)]',
    warning: 'bg-[color:var(--warning)]',
    danger: 'bg-[color:var(--danger)]',
  }
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
  }

  return (
    <div className="w-full">
      <div className={`w-full bg-surface-2 rounded-full overflow-hidden ${sizes[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`h-full rounded-full ${colors[color]}`}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-muted text-right">
          {value} / {max}
        </div>
      )}
    </div>
  )
}

interface TimerDisplayProps {
  seconds: number
  warning?: number
  danger?: number
}

export const TimerDisplay = ({ seconds, warning = 15, danger = 5 }: TimerDisplayProps) => {
  const getColor = () => {
    if (seconds <= danger) return 'text-[color:var(--danger)]'
    if (seconds <= warning) return 'text-[color:var(--warning)]'
    return 'text-strong'
  }

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      key={seconds}
      initial={seconds <= danger ? { scale: 1.1 } : {}}
      animate={{ scale: 1 }}
      className={`text-2xl font-mono font-bold tabular-nums ${getColor()}`}
    >
      {formatTime(seconds)}
    </motion.div>
  )
}
