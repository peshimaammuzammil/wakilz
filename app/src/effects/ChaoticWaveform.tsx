import { useRef, useEffect, useCallback } from 'react'

const BAR_COUNT = 28
const TIME_SPEED = 0.03
const GLITCH_INTERVAL_MIN = 2000
const GLITCH_INTERVAL_MAX = 4500
const GLITCH_BLOCK_MIN = 4
const GLITCH_BLOCK_MAX = 12
const SWEEP_SPEED = 0.8
const NOISE_INTENSITY = 0.8

export default function ChaoticWaveform({ active }: { active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const barsRef = useRef<HTMLDivElement[]>([])
  const rafRef = useRef<number | undefined>(undefined)
  const timeRef = useRef(0)
  const glitchActiveRef = useRef(false)
  const sweepPosRef = useRef(0)
  const glitchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const glitchRafRef = useRef<number | undefined>(undefined)
  const baseAmplitudesRef = useRef<number[]>(new Array(BAR_COUNT).fill(0.5))
  const glitchRangeRef = useRef({ start: 0, length: 0 })

  const setBarRef = useCallback((el: HTMLDivElement | null, i: number) => {
    if (el) barsRef.current[i] = el
  }, [])

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (glitchRafRef.current) cancelAnimationFrame(glitchRafRef.current)
      if (glitchTimerRef.current) clearTimeout(glitchTimerRef.current)
      return
    }

    // Base wave animation loop
    const animateWave = () => {
      timeRef.current += TIME_SPEED
      const time = timeRef.current

      for (let i = 0; i < BAR_COUNT; i++) {
        const wave1 = Math.sin(i * 0.4 + time) * 0.5 + 0.5
        const wave2 = Math.sin(i * 0.7 - time * 1.2) * 0.3
        const combined = Math.max(0.08, Math.min(1, wave1 + wave2))
        baseAmplitudesRef.current[i] = combined

        if (!glitchActiveRef.current && barsRef.current[i]) {
          barsRef.current[i].style.height = `${combined * 100}%`
          barsRef.current[i].style.opacity = '0.6'
        }
      }

      rafRef.current = requestAnimationFrame(animateWave)
    }

    // Glitch trigger timer
    const scheduleGlitch = () => {
      const delay = GLITCH_INTERVAL_MIN + Math.random() * (GLITCH_INTERVAL_MAX - GLITCH_INTERVAL_MIN)
      glitchTimerRef.current = setTimeout(() => {
        triggerGlitch()
      }, delay)
    }

    // Glitch sweep animation
    const triggerGlitch = () => {
      if (glitchActiveRef.current) {
        scheduleGlitch()
        return
      }

      const startIdx = Math.floor(Math.random() * 20)
      const length = GLITCH_BLOCK_MIN + Math.floor(Math.random() * (GLITCH_BLOCK_MAX - GLITCH_BLOCK_MIN))
      glitchRangeRef.current = { start: startIdx, length }
      glitchActiveRef.current = true
      sweepPosRef.current = startIdx - 3

      const animateGlitch = () => {
        sweepPosRef.current += SWEEP_SPEED
        const { start, length } = glitchRangeRef.current

        for (let i = start; i < start + length && i < BAR_COUNT; i++) {
          if (sweepPosRef.current >= i && barsRef.current[i]) {
            const noise = (Math.random() - 0.5) * NOISE_INTENSITY
            const distorted = Math.max(0.05, Math.min(1, baseAmplitudesRef.current[i] + noise))
            barsRef.current[i].style.height = `${distorted * 100}%`
            barsRef.current[i].style.opacity = `${0.4 + Math.random() * 0.4}`
          }
        }

        if (sweepPosRef.current > start + length + 5) {
          // End glitch
          glitchActiveRef.current = false
          for (let i = start; i < start + length && i < BAR_COUNT; i++) {
            if (barsRef.current[i]) {
              barsRef.current[i].style.height = `${baseAmplitudesRef.current[i] * 100}%`
              barsRef.current[i].style.opacity = '0.6'
            }
          }
          scheduleGlitch()
          return
        }

        glitchRafRef.current = requestAnimationFrame(animateGlitch)
      }

      glitchRafRef.current = requestAnimationFrame(animateGlitch)
    }

    rafRef.current = requestAnimationFrame(animateWave)
    scheduleGlitch()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (glitchRafRef.current) cancelAnimationFrame(glitchRafRef.current)
      if (glitchTimerRef.current) clearTimeout(glitchTimerRef.current)
    }
  }, [active])

  return (
    <div ref={containerRef} className="waveform-container">
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <div
          key={i}
          ref={(el) => setBarRef(el, i)}
          className="waveform-bar"
          style={{ height: '50%' }}
        />
      ))}
    </div>
  )
}
