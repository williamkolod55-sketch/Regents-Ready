import { useEffect, useState } from 'react'

export default function ProgressRing({ progress = 0, color = '#F59E0B', size = 64, strokeWidth = 5, label = '' }) {
  const [displayed, setDisplayed] = useState(0)
  const radius      = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset      = circumference - (displayed / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setDisplayed(progress), 100)
    return () => clearTimeout(timer)
  }, [progress])

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold" style={{ color }}>{Math.round(displayed)}%</span>
        </div>
      </div>
      {label && <span className="text-[10px] text-white/50 font-medium text-center leading-tight">{label}</span>}
    </div>
  )
}
