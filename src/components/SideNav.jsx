import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

const EXAM_DATE = new Date('2026-06-23T00:00:00')

function getDaysLeft() {
  return Math.max(0, Math.ceil((EXAM_DATE - new Date()) / (1000 * 60 * 60 * 24)))
}

const LINKS = [
  { to: '/',            label: 'Home',        end: true,  icon: HomeIcon  },
  { to: '/flashcards',  label: 'Flashcards',  end: false, icon: CardsIcon },
  { to: '/quiz',        label: 'Quiz',        end: false, icon: QuizIcon  },
  { to: '/lightning',   label: 'Lightning',   end: false, icon: BoltIcon  },
  { to: '/matching',    label: 'Matching',    end: false, icon: PuzzleIcon},
  { to: '/cram',        label: 'Cram Mode',   end: false, icon: FireIcon  },
  { to: '/leaderboard', label: 'Leaderboard', end: false, icon: TrophyIcon},
]

export default function SideNav() {
  const [daysLeft, setDaysLeft] = useState(getDaysLeft())

  useEffect(() => {
    const t = setInterval(() => setDaysLeft(getDaysLeft()), 60000)
    return () => clearInterval(t)
  }, [])

  const urgent = daysLeft <= 3

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-56 z-40"
      style={{ background: 'rgba(8,8,16,0.97)', borderRight: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Logo */}
      <div className="px-5 pt-7 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h1 className="text-xl font-black tracking-tight text-white">Regents Ready</h1>
        <p className="text-white/30 text-sm mt-0.5 font-medium">US History &amp; Gov</p>
      </div>

      {/* Countdown */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className={`text-5xl font-black tabular-nums leading-none ${urgent ? 'text-red-400' : 'text-white'}`}>
          {daysLeft}
        </div>
        <div className="text-white/35 text-sm mt-1 font-medium">
          {urgent ? '🚨 ' : ''}days until Regents
        </div>
        <div className="text-white/20 text-[10px]">June 23, 2026</div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {LINKS.map(({ to, label, end, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3.5 rounded-xl text-[16px] font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/75 hover:bg-white/[0.06]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="w-5 h-5 flex-shrink-0 opacity-80">
                  <Icon active={isActive} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-[10px] text-white/20 leading-relaxed">
          SM-2 spaced repetition<br />Progress saved locally
        </div>
      </div>
    </aside>
  )
}

function HomeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'white' : 'none'} stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function CardsIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  )
}
function QuizIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}
function BoltIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'white' : 'none'} stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}
function PuzzleIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}
function FireIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'white' : 'none'} stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>
    </svg>
  )
}
function TrophyIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/>
      <path d="M7 4H4v3c0 3 2 5 5 6M17 4h3v3c0 3-2 5-5 6"/><path d="M7 4h10v5a5 5 0 01-10 0V4z"/>
    </svg>
  )
}
