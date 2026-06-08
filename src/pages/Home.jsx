import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cards, CATEGORY_COLORS, CATEGORY_NAMES, CATEGORY_KEYS } from '../data/cards.js'
import {
  getReadinessScore, getCategoryProgress, getDueCount,
  getMostMissedCards, getNeedsReviewCards, getStreak, touchStreak, getMissCount
} from '../utils/storage.js'
import ProgressRing from '../components/ProgressRing.jsx'

const EXAM_DATE = new Date('2026-06-23T00:00:00')

function getDaysLeft() {
  return Math.max(0, Math.ceil((EXAM_DATE - new Date()) / (1000 * 60 * 60 * 24)))
}

function useAnimatedNumber(target, duration = 900) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = null
    const step = ts => {
      if (!start) start = ts
      const pct = Math.min((ts - start) / duration, 1)
      setVal(Math.round(target * pct))
      if (pct < 1) requestAnimationFrame(step)
    }
    const raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

const MODES = [
  { label: 'Flashcards',  icon: '📚', path: '/flashcards', desc: 'Flip & study',      color: '#F59E0B' },
  { label: 'Quiz',        icon: '❓', path: '/quiz',       desc: '4-choice test',     color: '#3B82F6' },
  { label: 'Lightning',   icon: '⚡', path: '/lightning',  desc: '60-sec blitz',      color: '#EF4444' },
  { label: 'Matching',    icon: '🎯', path: '/matching',   desc: 'Match terms',       color: '#8B5CF6' },
  { label: 'Cram Mode',   icon: '🔥', path: '/cram',       desc: 'Review pile only',  color: '#F97316' },
  { label: 'Leaderboard', icon: '🏆', path: '/leaderboard',desc: 'Top scores',        color: '#06B6D4' },
]

export default function Home() {
  const navigate = useNavigate()
  const [daysLeft,    setDaysLeft]    = useState(getDaysLeft())
  const [readiness,   setReadiness]   = useState(0)
  const [catProgress, setCatProgress] = useState({})
  const [dueCount,    setDueCount]    = useState(0)
  const [weakCards,   setWeakCards]   = useState([])
  const [cramCount,   setCramCount]   = useState(0)
  const [streak,      setStreak]      = useState(0)

  useEffect(() => {
    setReadiness(getReadinessScore(cards))
    setCatProgress(getCategoryProgress(cards))
    setDueCount(getDueCount(cards))
    setWeakCards(getMostMissedCards(cards, 10))
    setCramCount(getNeedsReviewCards(cards).length)
    setStreak(touchStreak())
    const timer = setInterval(() => setDaysLeft(getDaysLeft()), 60000)
    return () => clearInterval(timer)
  }, [])

  const animReadiness = useAnimatedNumber(readiness)
  const animDue       = useAnimatedNumber(dueCount)
  const animCram      = useAnimatedNumber(cramCount)
  const daysUrgent    = daysLeft <= 3

  const readinessColor = readiness >= 75 ? '#10B981' : readiness >= 50 ? '#F59E0B' : '#EF4444'
  const circR          = 32
  const circC          = 2 * Math.PI * circR

  return (
    <div className="page-content min-h-screen px-4 lg:px-10 pt-8 lg:pt-10 pb-24 lg:pb-10">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-6 lg:mb-8"
      >
        {/* On mobile: centered; on desktop: left-aligned (sidebar already has the title) */}
        <div className="text-center lg:hidden">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
            Regents Ready
          </h1>
          <p className="text-white/35 text-sm mt-1 font-medium">US History &amp; Government</p>
        </div>
        <div className="hidden lg:block">
          <h1 className="text-3xl font-black tracking-tight text-white">Dashboard</h1>
          <p className="text-white/35 text-sm mt-0.5 font-medium">US History &amp; Government Regents</p>
        </div>
      </motion.div>

      {/* ── Desktop 2-column layout ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 mb-5">

        {/* LEFT COLUMN */}
        <div className="space-y-4">

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 }}
            className="glass rounded-2xl p-5 relative overflow-hidden"
            style={daysUrgent ? { borderColor: 'rgba(239,68,68,0.35)' } : {}}
          >
            {daysUrgent && (
              <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{ background: 'radial-gradient(circle at center, #EF4444, transparent 70%)' }} />
            )}
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-7xl lg:text-8xl font-black tabular-nums leading-none ${daysUrgent ? 'text-red-400' : 'text-white'}`}>
                  {daysLeft}
                </div>
                <div className={`text-base font-semibold mt-2 ${daysUrgent ? 'text-red-400' : 'text-white/50'}`}>
                  {daysUrgent ? '🚨 ' : ''}days until your Regents
                </div>
                <div className="text-white/25 text-xs mt-0.5">June 23, 2026</div>
              </div>

              <div className="flex items-center gap-3">
                <div className="glass-sm px-3.5 py-2.5 rounded-xl text-center">
                  <div className="text-xl font-black">🔥 {streak}</div>
                  <div className="text-xs text-white/35 mt-0.5">day streak</div>
                </div>
                {dueCount > 0 && (
                  <div className="glass-sm px-3.5 py-2.5 rounded-xl text-center cursor-pointer"
                    onClick={() => navigate('/flashcards')}>
                    <div className="text-xl font-black text-amber-400">{animDue}</div>
                    <div className="text-[10px] text-white/35 mt-0.5">due today</div>
                  </div>
                )}
                {cramCount > 0 && (
                  <div className="glass-sm px-3.5 py-2.5 rounded-xl text-center cursor-pointer"
                    onClick={() => navigate('/cram')}>
                    <div className="text-xl font-black text-orange-400">{animCram}</div>
                    <div className="text-[10px] text-white/35 mt-0.5">to cram</div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Exam Readiness */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-center gap-5">
              {/* Big ring */}
              <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
                <svg viewBox="0 0 80 80" className="-rotate-90 w-20 h-20">
                  <circle cx="40" cy="40" r={circR} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7"/>
                  <circle cx="40" cy="40" r={circR} fill="none" stroke={readinessColor} strokeWidth="7"
                    strokeDasharray={circC}
                    strokeDashoffset={circC * (1 - readiness / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1.2s ease-in-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black">{animReadiness}%</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs text-white/40 font-semibold uppercase tracking-wider">Exam Readiness</div>
                <div className="text-5xl font-black mt-0.5">
                  <span className="tabular-nums">{animReadiness}</span>
                  <span className="text-white/35 text-xl">%</span>
                </div>
                <div className="text-xs text-white/35 mt-1">
                  {cards.length} total cards · progress saved locally
                </div>
                <div className="mt-2 w-full h-1.5 rounded-full bg-white/10">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${readiness}%`, background: readinessColor }} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mode buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {MODES.map(({ label, icon, path, desc, color }) => (
              <motion.button
                key={path}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(path)}
                className="glass rounded-2xl p-4 text-left relative overflow-hidden group"
                style={{ borderColor: color + '1a' }}
              >
                <div className="absolute top-0 right-0 w-14 h-14 rounded-full -translate-y-4 translate-x-4
                  opacity-0 group-hover:opacity-10 transition-opacity duration-200"
                  style={{ background: color }} />
                <div className="text-2xl mb-2">{icon}</div>
                <div className="font-bold text-base text-white">{label}</div>
                <div className="text-sm text-white/35 mt-1">{desc}</div>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">

          {/* Category Progress Rings */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 }}
            className="glass rounded-2xl p-5"
          >
            <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-4">
              Category Progress
            </div>
            {/* Mobile: 4-col small; Desktop: 4-col bigger */}
            <div className="grid grid-cols-4 gap-3 lg:gap-4">
              {CATEGORY_KEYS.map(cat => {
                const prog = catProgress[cat] || { mastered: 0, total: 0 }
                const pct  = prog.total > 0 ? Math.round((prog.mastered / prog.total) * 100) : 0
                return (
                  <div
                    key={cat}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    onClick={() => navigate(`/flashcards?cat=${encodeURIComponent(cat)}`)}
                  >
                    <div className="relative transition-transform duration-150 group-hover:scale-105">
                      <ProgressRing
                        progress={pct}
                        color={CATEGORY_COLORS[cat]}
                        size={60}
                        strokeWidth={5}
                      />
                    </div>
                    <span className="text-[10px] lg:text-xs text-white/40 text-center leading-tight font-medium px-0.5">
                      {CATEGORY_NAMES[cat].split(' ')[0]}{' '}
                      {CATEGORY_NAMES[cat].split(' ')[1]}
                    </span>
                    <span className="text-[9px] text-white/25">{prog.mastered}/{prog.total}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Weak Spots */}
          {weakCards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.26 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-white/40 font-semibold uppercase tracking-wider">Weak Spots</div>
                  <div className="text-sm text-white/60 mt-0.5">Most-missed terms</div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/flashcards?mode=weakspots')}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg"
                  style={{ background: '#EF444420', color: '#EF4444', border: '1px solid #EF444430' }}
                >
                  Study Now
                </motion.button>
              </div>
              <div className="space-y-1.5">
                {weakCards.slice(0, 7).map(card => (
                  <div key={card.id}
                    className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                    <span className="text-sm lg:text-base text-white/75 font-medium truncate flex-1 pr-3">{card.term}</span>
                    <span className="text-xs text-red-400 font-bold flex-shrink-0">×{getMissCount(card.id)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-white/15 text-xs">
        {cards.length} total cards · SM-2 spaced repetition
      </div>
    </div>
  )
}
