import { useEffect, useCallback } from 'react'

type KeyHandler = (event: KeyboardEvent) => void

interface KeyMap {
  [key: string]: KeyHandler
}

export const useKeyboard = (keyMap: KeyMap, enabled = true) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return
    
    const key = event.key.toLowerCase()
    const withMod = `${event.ctrlKey ? 'ctrl+' : ''}${event.shiftKey ? 'shift+' : ''}${event.altKey ? 'alt+' : ''}${key}`
    
    if (keyMap[withMod]) {
      event.preventDefault()
      keyMap[withMod](event)
    } else if (keyMap[key]) {
      event.preventDefault()
      keyMap[key](event)
    } else if (keyMap[event.code]) {
      event.preventDefault()
      keyMap[event.code](event)
    }
  }, [keyMap, enabled])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export const useNumberKeys = (onNumber: (num: number) => void, enabled = true) => {
  useKeyboard({
    '1': () => onNumber(0),
    '2': () => onNumber(1),
    '3': () => onNumber(2),
    '4': () => onNumber(3),
    'Digit1': () => onNumber(0),
    'Digit2': () => onNumber(1),
    'Digit3': () => onNumber(2),
    'Digit4': () => onNumber(3),
  }, enabled)
}
