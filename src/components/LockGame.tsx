import { useEffect, useMemo, useRef, useState } from 'react'

type Phase = 'idle' | 'playing' | 'flash-hit' | 'flash-miss' | 'complete'

type Target = { start: number; width: number }

const ROUNDS: { width: number; duration: number }[] = [
  { width: 46, duration: 3400 },
  { width: 34, duration: 2600 },
  { width: 24, duration: 2000 },
]

const CX = 160
const CY = 160
const RIM_R = 130
const TICK_OUT = 130
const TICK_IN_MINOR = 120
const TICK_IN_MAJOR = 114
const NEEDLE_LEN = 118

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

export default function LockGame({ onUnlocked }: { onUnlocked: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [round, setRound] = useState(0)
  const [target, setTarget] = useState<Target>(() => randomTarget(ROUNDS[0].width))
  const [announce, setAnnounce] = useState('Pick the lock. Click to start.')

  const needleRef = useRef<SVGLineElement | null>(null)
  const angleRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const targetRef = useRef<Target>(target)
  const phaseRef = useRef<Phase>('idle')

  targetRef.current = target
  phaseRef.current = phase

  const ticks = useMemo(() => {
    const arr: { key: number; major: boolean; x1: number; y1: number; x2: number; y2: number }[] = []
    for (let i = 0; i < 60; i++) {
      const deg = i * 6
      const major = i % 5 === 0
      const [x1, y1] = toXY(deg, major ? TICK_IN_MAJOR : TICK_IN_MINOR)
      const [x2, y2] = toXY(deg, TICK_OUT)
      arr.push({ key: i, major, x1, y1, x2, y2 })
    }
    return arr
  }, [])

  function stopLoop() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    lastTimeRef.current = null
  }

  function runLoop(durationMs: number) {
    const speed = 360 / durationMs // deg per ms
    const step = (t: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = t
      const dt = t - lastTimeRef.current
      lastTimeRef.current = t
      angleRef.current = (angleRef.current + speed * dt) % 360
      if (needleRef.current) {
        needleRef.current.setAttribute('transform', `rotate(${angleRef.current} ${CX} ${CY})`)
      }
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }

  function startRound(index: number) {
    const cfg = ROUNDS[index]
    const t = randomTarget(cfg.width)
    setTarget(t)
    setRound(index)
    setPhase('playing')
    setAnnounce(`Round ${index + 1} of ${ROUNDS.length}. Click when the needle crosses the bright arc.`)
    angleRef.current = Math.random() * 360
    stopLoop()
    runLoop(cfg.duration)
  }

  function handleClick() {
    if (phase === 'idle') {
      startRound(0)
      return
    }
    if (phase !== 'playing') return

    stopLoop()
    const hit = inTarget(angleRef.current, targetRef.current)

    if (hit) {
      setPhase('flash-hit')
      setAnnounce('Pin set.')
      window.setTimeout(() => {
        const next = round + 1
        if (next >= ROUNDS.length) {
          setPhase('complete')
          setAnnounce('Access granted.')
          window.setTimeout(onUnlocked, 700)
        } else {
          startRound(next)
        }
      }, 320)
    } else {
      setPhase('flash-miss')
      setAnnounce('Missed. Resetting pin.')
      window.setTimeout(() => {
        startRound(round)
      }, 300)
    }
  }

  useEffect(() => stopLoop, [])

  const targetPath = describeArc(target.start, target.width, RIM_R)
  const isComplete = phase === 'complete'
  const needleClass =
    phase === 'flash-hit' || isComplete
      ? 'lock__needle lock__needle--hit'
      : phase === 'flash-miss'
        ? 'lock__needle lock__needle--miss'
        : 'lock__needle'

  const label =
    phase === 'idle'
      ? 'Click to start'
      : phase === 'flash-hit'
        ? 'Locked'
        : phase === 'flash-miss'
          ? 'Missed — resetting'
          : phase === 'complete'
            ? 'Access granted'
            : 'Click to lock'

  const needleStart = toXY(0, 8)
  const needleEnd = toXY(0, NEEDLE_LEN)

  return (
    <div className={`lock${isComplete ? ' lock--complete' : ''}`}>
      <button
        type="button"
        className="lock__dial-btn"
        onClick={handleClick}
        disabled={isComplete}
        aria-label={label}
      >
        <svg className="lock__svg" viewBox="0 0 320 320" aria-hidden="true">
          <circle className="lock__rim" cx={CX} cy={CY} r={RIM_R} />

          {ticks.map((tk) => (
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

          {!isComplete && (
            <path
              className="lock__target"
              d={targetPath}
              pathLength={100}
            />
          )}

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

      <div className="lock__pips" aria-hidden="true">
        {ROUNDS.map((_, i) => (
          <span
            key={i}
            className={`lock__pip${i < round || isComplete ? ' lock__pip--filled' : ''}`}
          />
        ))}
      </div>

      {!isComplete && (
        <button type="button" className="hero__skip" onClick={onUnlocked}>
          Skip →
        </button>
      )}

      <span className="visually-hidden" role="status" aria-live="polite">
        {announce}
      </span>
    </div>
  )
}
