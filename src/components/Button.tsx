'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  fullWidth?: boolean
  className?: string
  hotkey?: string
}

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = '',
  hotkey,
}: ButtonProps) => {
  const baseStyles = 'relative font-medium rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-[color:var(--surface-0)]'
  
  const variants = {
    primary: 'bg-accent text-white hover:bg-[color:var(--accent-strong)]',
    secondary: 'bg-surface-2 text-strong hover:bg-surface-3',
    ghost: 'bg-transparent text-muted hover:bg-surface-2',
    danger: 'bg-[color:var(--danger)] text-white hover:bg-[color:var(--danger-strong)]',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
      {hotkey && (
        <span className="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded hidden sm:inline-flex">
          {hotkey}
        </span>
      )}
    </motion.button>
  )
}
