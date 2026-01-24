'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  onClick?: () => void
  selected?: boolean
  correct?: boolean | null
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = ({
  children,
  onClick,
  selected = false,
  correct = null,
  className = '',
  padding = 'md',
}: CardProps) => {
  const isInteractive = Boolean(onClick)
  const paddings = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  }

  const getBorderColor = () => {
    if (correct === true) return 'border-[color:var(--success)] bg-[color:var(--success-soft)]'
    if (correct === false) return 'border-[color:var(--danger)] bg-[color:var(--danger-soft)]'
    if (selected) return 'border-strong bg-surface-2'
    return 'border-subtle bg-surface hover:border-strong'
  }

  return (
    <motion.div
      whileTap={isInteractive ? { scale: 0.98 } : {}}
      whileHover={isInteractive ? { scale: 1.01 } : {}}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={(event) => {
        if (!isInteractive) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick?.()
        }
      }}
      className={`
        rounded-2xl border-2 transition-colors focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-0)]
        ${getBorderColor()}
        ${paddings[padding]}
        ${isInteractive ? 'cursor-pointer select-none touch-manipulation min-h-[56px]' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  )
}
