import { useEffect, useRef, useState } from 'react'

type Phase = 'idle' | 'playing' | 'complete'
type Flash = 'hit' | 'miss' | null
type Target = { start: number; width: number }

const GAME_DURATION = 30000 // ms
const WIDTH_START = 42 // deg, easier at the beginning
const WIDTH_END = 20 // deg, tighter near the end
const REV_START = 2600 // ms per revolution, slower at the beginning
const REV_END = 1500 // ms per revolution, faster near the end

const CX = 160
const CY = 160
const RIM_R = 130
const TICK_OUT = 130
const TICK_IN_MINOR = 120
const TICK_IN_MAJOR = 114
const NEEDLE_LEN = 118

function lerp(a: number, b: number, f: number) {
  const c = Math.min(Math.max(f, 0), 1)
  return a + (b - a) * c
}

function toXY(angleDeg: number, r: number) {
  const rad = (angleDeg * Math.PI) / 180
  return [CX + r * Math.sin(rad), CY - r * Math.cos(rad)] as const
}

function describeArc(startAngle: number, width: number, r: number) {
  const endAngle = startAngle + width
  const [x1, y1] = toXY(startAngle, r)
  const [x2, y2] = toXY(endAngle, r)
  const largeArc = width > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
}

function inTarget(angle: number, target: Target) {
  const a = ((angle - target.start) % 360 + 360) % 360
  return a <= target.width
}

function randomTarget(width: number): Target {
  return { start: Math.random() * 360, width }
}

type AudioCtxCtor = typeof AudioContext

function getAudioCtor(): AudioCtxCtor | undefined {
  return (window.AudioContext || (window as unknown as { webkitAudioContext?: AudioCtxCtor }).webkitAudioContext)
}

const TICKS = (() => {
  const arr: { key: number; major: boolean; x1: number; y1: number; x2: number; y2: number }[] = []
  for (let i = 0; i < 60; i++) {
    const deg = i * 6
    const major = i % 5 === 0
    const [x1, y1] = toXY(deg, major ? TICK_IN_MAJOR : TICK_IN_MINOR)
    const [x2, y2] = toXY(deg, TICK_OUT)
    arr.push({ key: i, major, x1, y1, x2, y2 })
  }
  return arr
})()

export default function LockGame({ onUnlocked }: { onUnlocked: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [flash, setFlash] = useState<Flash>(null)
  const [target, setTarget] = useState<Target>(() => randomTarget(WIDTH_START))
  const [hits, setHits] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [announce, setAnnounce] = useState('Pick the lock. Click to start.')
  const [replayReady, setReplayReady] = useState(false)

  const needleRef = useRef<SVGLineElement | null>(null)
  const angleRef = useRef(0)
  const directionRef = useRef<1 | -1>(1)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const targetRef = useRef<Target>(target)
  const intervalRef = useRef<number | null>(null)
  const flashTimeoutRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  targetRef.current = target

  function getAudioContext(): AudioContext | null {
    const Ctor = getAudioCtor()
    if (!Ctor) return null
    if (!audioCtxRef.current) audioCtxRef.current = new Ctor()
    if (audioCtxRef.current.state === 'suspended') void audioCtxRef.current.resume()
    return audioCtxRef.current
  }

  function playTone(freq: number, duration: number, type: OscillatorType, peak: number) {
    const ctx = getAudioContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    const now = ctx.currentTime
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + duration + 0.02)
  }

  function playHitSound() {
    playTone(880, 0.13, 'sine', 0.07)
  }

  function playMissSound() {
    playTone(160, 0.16, 'triangle', 0.06)
  }

  function stopLoop() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    lastTimeRef.current = null
  }

  function stopTimer() {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function runLoop() {
    const step = (t: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = t
      const dt = t - lastTimeRef.current
      lastTimeRef.current = t

      const elapsed = t - (startTimeRef.current ?? t)
      if (elapsed >= GAME_DURATION) {
        finish()
        return
      }

      const f = elapsed / GAME_DURATION
      const duration = lerp(REV_START, REV_END, f)
      const speed = 360 / duration // deg per ms
      angleRef.current = (angleRef.current + directionRef.current * speed * dt + 360) % 360
      if (needleRef.current) {
        needleRef.current.setAttribute('transform', `rotate(${angleRef.current} ${CX} ${CY})`)
      }
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }

  function flashNeedle(kind: Flash) {
    setFlash(kind)
    if (flashTimeoutRef.current !== null) window.clearTimeout(flashTimeoutRef.current)
    flashTimeoutRef.current = window.setTimeout(() => setFlash(null), 220)
  }

  function start() {
    startTimeRef.current = performance.now()
    directionRef.current = 1
    angleRef.current = Math.random() * 360
    const t = randomTarget(WIDTH_START)
    setTarget(t)
    setHits(0)
    setTimeLeft(30)
    setPhase('playing')
    setReplayReady(false)
    setAnnounce('Click when the needle crosses the bright arc. You have 30 seconds.')
    stopLoop()
    runLoop()
    stopTimer()
    intervalRef.current = window.setInterval(() => {
      const elapsed = performance.now() - (startTimeRef.current ?? performance.now())
      setTimeLeft(Math.max(0, Math.ceil((GAME_DURATION - elapsed) / 1000)))
    }, 250)
  }

  function finish(immediate = false) {
    stopLoop()
    stopTimer()
    setPhase('complete')
    setTimeLeft(0)
    setAnnounce('Access granted.')
    window.setTimeout(onUnlocked, immediate ? 0 : 700)
    window.setTimeout(() => setReplayReady(true), immediate ? 0 : 900)
  }

  function handleDialClick() {
    if (phase === 'idle' || phase === 'complete') {
      start()
      return
    }
    if (phase !== 'playing') return

    const hit = inTarget(angleRef.current, targetRef.current)
    if (hit) {
      directionRef.current = directionRef.current === 1 ? -1 : 1
      const elapsed = performance.now() - (startTimeRef.current ?? performance.now())
      const f = elapsed / GAME_DURATION
      const nextTarget = randomTarget(lerp(WIDTH_START, WIDTH_END, f))
      setTarget(nextTarget)
      setHits((h) => h + 1)
      flashNeedle('hit')
      playHitSound()
    } else {
      flashNeedle('miss')
      playMissSound()
    }
  }

  function handleSkip() {
    if (phase === 'complete') return
    finish(true)
  }

  useEffect(() => {
    return () => {
      stopLoop()
      stopTimer()
      if (flashTimeoutRef.current !== null) window.clearTimeout(flashTimeoutRef.current)
      if (audioCtxRef.current) void audioCtxRef.current.close()
    }
  }, [])

  const isComplete = phase === 'complete'
  const targetPath = describeArc(target.start, target.width, RIM_R)

  const needleClass =
    isComplete || flash === 'hit'
      ? 'lock__needle lock__needle--hit'
      : flash === 'miss'
        ? 'lock__needle lock__needle--miss'
        : 'lock__needle'

  const label =
    phase === 'idle'
      ? 'Click to start'
      : isComplete
        ? replayReady
          ? 'Click to play again'
          : 'Access granted'
        : 'Click to lock'

  const needleStart = toXY(0, 8)
  const needleEnd = toXY(0, NEEDLE_LEN)

  return (
    <div className={`lock${isComplete ? ' lock--complete' : ''}`}>
      <button
        type="button"
        className="lock__dial-btn"
        onClick={handleDialClick}
        aria-label={label}
      >
        <svg className="lock__svg" viewBox="0 0 320 320" aria-hidden="true">
          <circle className="lock__rim" cx={CX} cy={CY} r={RIM_R} />

          {TICKS.map((tk) => (
            <line
              key={tk.key}
              className={tk.major ? 'lock__tick lock__tick--major' : 'lock__tick'}
              x1={tk.x1}
              y1={tk.y1}
              x2={tk.x2}
              y2={tk.y2}
              strokeWidth={tk.major ? 2 : 1}
            />
          ))}

          {!isComplete && <path className="lock__target" d={targetPath} />}

          <line
            ref={needleRef}
            className={needleClass}
            x1={needleStart[0]}
            y1={needleStart[1]}
            x2={needleEnd[0]}
            y2={needleEnd[1]}
          />

          <circle className="lock__hub" cx={CX} cy={CY} r={30} />
          <rect
            className="lock__hub-icon"
            x={CX - 14}
            y={CY + 4}
            width={28}
            height={20}
            rx={3}
            fill="var(--panel)"
          />
          <path
            className="lock__hub-icon lock__hub-shackle"
            d={`M ${CX - 9} ${CY + 4} v-8 a9 9 0 0 1 18 0 v8`}
            fill="none"
          />
        </svg>
      </button>

      <p className="lock__label">{label}</p>

      <div className="lock__stats" aria-hidden="true">
        <span>{phase === 'idle' ? '0:30' : `0:${String(timeLeft).padStart(2, '0')}`}</span>
        <span className="lock__stats-sep">—</span>
        <span>{hits} hit{hits === 1 ? '' : 's'}</span>
      </div>

      {!isComplete && (
        <button type="button" className="hero__skip" onClick={handleSkip}>
          Skip →
        </button>
      )}

      <span className="visually-hidden" role="status" aria-live="polite">
        {announce}
      </span>
    </div>
  )
}
