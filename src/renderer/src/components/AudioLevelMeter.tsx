import { useEffect, useState } from 'react'

interface AudioLevelMeterProps {
  level: number // 0-1
  isActive: boolean
}

export function AudioLevelMeter({ level, isActive }: AudioLevelMeterProps): React.JSX.Element {
  const [smoothLevel, setSmoothLevel] = useState(0)

  // Smooth the level for better visualization
  useEffect(() => {
    const smoothing = 0.3
    setSmoothLevel((prev) => prev + smoothing * (level - prev))
  }, [level])

  const bars = 12
  const activeBars = Math.round(smoothLevel * bars)

  return (
    <div className="flex items-center gap-1">
      {/* Mic icon */}
      <MicIcon className={`w-4 h-4 ${isActive ? 'text-red-500' : 'text-neutral-400'}`} />

      {/* Level bars */}
      <div className="flex items-end gap-0.5 h-4">
        {Array.from({ length: bars }).map((_, i) => {
          const isActiveBar = i < activeBars
          const barHeight = 4 + (i / bars) * 12 // Graduated height

          return (
            <div
              key={i}
              className={`w-1 rounded-sm transition-all duration-75 ${
                isActiveBar
                  ? i < bars * 0.6
                    ? 'bg-green-500'
                    : i < bars * 0.8
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
              style={{ height: `${barHeight}px` }}
            />
          )
        })}
      </div>
    </div>
  )
}

function MicIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
      />
    </svg>
  )
}
