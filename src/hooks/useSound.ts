import { useCallback, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'

const createOscillator = (
  ctx: AudioContext,
  frequency: number,
  type: OscillatorType,
  duration: number,
  volume = 0.3
) => {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  
  osc.type = type
  osc.frequency.setValueAtTime(frequency, ctx.currentTime)
  
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
  
  osc.connect(gain)
  gain.connect(ctx.destination)
  
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

export const useSound = () => {
  const ctxRef = useRef<AudioContext | null>(null)
  const soundEnabled = useGameStore(s => s.soundEnabled)

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return ctxRef.current
  }, [])

  const playCorrect = useCallback(() => {
    if (!soundEnabled) return
    const ctx = getContext()
    createOscillator(ctx, 523.25, 'sine', 0.1, 0.2)
    setTimeout(() => createOscillator(ctx, 659.25, 'sine', 0.15, 0.2), 80)
  }, [soundEnabled, getContext])

  const playWrong = useCallback(() => {
    if (!soundEnabled) return
    const ctx = getContext()
    createOscillator(ctx, 200, 'square', 0.2, 0.15)
  }, [soundEnabled, getContext])

  const playTick = useCallback(() => {
    if (!soundEnabled) return
    const ctx = getContext()
    createOscillator(ctx, 800, 'sine', 0.05, 0.1)
  }, [soundEnabled, getContext])

  const playComplete = useCallback(() => {
    if (!soundEnabled) return
    const ctx = getContext()
    const notes = [523.25, 659.25, 783.99, 1046.50]
    notes.forEach((freq, i) => {
      setTimeout(() => createOscillator(ctx, freq, 'sine', 0.2, 0.2), i * 100)
    })
  }, [soundEnabled, getContext])

  return { playCorrect, playWrong, playTick, playComplete }
}
