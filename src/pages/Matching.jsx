import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cards, CATEGORY_COLORS } from '../data/cards.js'
import CategoryBadge from '../components/CategoryBadge.jsx'

const PAIR_COUNT = 6

function buildGame() {
  const shuffled = [...cards].sort(() => Math.random() - 0.5)
  const pairs    = shuffled.slice(0, PAIR_COUNT)
  const terms    = pairs.map(c => ({ id: c.id, text: c.term,        cat: c.cat, type: 'term' }))
  const defs     = pairs.map(c => ({ id: c.id, text: c.bullets[0],  cat: c.cat, type: 'def'  }))
  return {
    terms: [...terms].sort(() => Math.random() - 0.5),
    defs:  [...defs].sort(() => Math.random() - 0.5),
  }
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export default function Matching() {
  const navigate = useNavigate()
  const [game,       setGame]       = useState(null)
  const [selected,   setSelected]   = useState(null)  // { id, type }
  const [matched,    setMatched]    = useState(new Set())
  const [wrong,      setWrong]      = useState(null)   // id that was wrong
  const [elapsed,    setElapsed]    = useState(0)
  const [startTime,  setStartTime]  = useState(null)
  const [done,       setDone]       = useState(false)
  const [bestTime,   setBestTime]   = useState(() => parseInt(localStorage.getItem('rr_match_best') || '0'))
  const intervalRef  = useRef(null)

  const startGame = () => {
    setGame(buildGame())
    setSelected(null)
    setMatched(new Set())
    setWrong(null)
    setElapsed(0)
    setDone(false)
    setStartTime(Date.now())
  }

  useEffect(() => { startGame() }, [])

  useEffect(() => {
    if (startTime && !done) {
      intervalRef.current = setInterval(() => setElapsed(Date.now() - startTime), 100)
    }
    return () => clearInterval(intervalRef.current)
  }, [startTime, done])

  useEffect(() => {
    if (game && matched.size === PAIR_COUNT) {
      clearInterval(intervalRef.current)
      setDone(true)
      if (!bestTime || elapsed < bestTime) {
        setBestTime(elapsed)
        localStorage.setItem('rr_match_best', String(elapsed))
      }
    }
  }, [matched, game, elapsed, bestTime])

  const handleClick = (id, type) => {
    if (matched.has(id)) return

    if (!selected) {
      setSelected({ id, type })
      return
    }

    if (selected.id === id && selected.type === type) {
      setSelected(null)
      return
    }

    // Clicking same column (both terms or both defs): switch selection, no penalty
    if (selected.type === type) {
      setSelected({ id, type })
      return
    }

    if (selected.id === id && selected.type !== type) {
      // Match!
      setMatched(m => new Set([...m, id]))
      setSelected(null)
      setWrong(null)
    } else {
      // Wrong
      const wrongId = selected.id
      setWrong(wrongId)
      setSelected({ id, type })
      setTimeout(() => setWrong(null), 600)
    }
  }

  const isSelected = (id, type) => selected?.id === id && selected?.type === type
  const isMatched  = (id) => matched.has(id)
  const isWrong    = (id) => wrong === id

  if (!game) return null

  return (
    <div className="page-content min-h-screen flex flex-col px-4 lg:px-10 pt-8 pb-28 lg:pb-10 max-w-lg mx-auto lg:max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/')} className="text-white/40 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div>
          <span className="text-xl font-black tabular-nums">{formatTime(elapsed)}</span>
          {bestTime > 0 && <span className="text-xs text-white/30 ml-2">best {formatTime(bestTime)}</span>}
        </div>
        <button
          onClick={startGame}
          className="text-xs font-bold px-3 py-1.5 rounded-lg glass"
        >New Game</button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex gap-1.5">
          {Array.from({ length: PAIR_COUNT }, (_, i) => (
            <div key={i} className="w-2 h-2 rounded-full transition-all duration-300"
              style={{ background: i < matched.size ? '#10B981' : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>
        <span className="text-xs text-white/40">{matched.size}/{PAIR_COUNT} matched</span>
      </div>

      <div className="text-sm text-white/30 text-center mb-4">Select a term, then select its matching definition</div>

      {/* Celebrate */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 text-center mb-4"
            style={{ border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)' }}
          >
            <div className="text-3xl mb-2">🎉</div>
            <div className="text-xl font-black text-green-400">Board Cleared!</div>
            <div className="text-white/50 text-sm mt-1">Time: {formatTime(elapsed)}</div>
            {bestTime === elapsed && <div className="text-amber-400 text-xs mt-1 font-bold">🏆 New Best!</div>}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={startGame}
              className="mt-4 px-6 py-2.5 rounded-xl font-bold text-sm w-full"
              style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}
            >Play Again</motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Grid */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {/* Terms column */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-bold text-white/30 uppercase tracking-widest text-center">Terms</div>
          {game.terms.map(item => {
            const sel     = isSelected(item.id, 'term')
            const matched_ = isMatched(item.id)
            const wrong_   = isWrong(item.id)
            const color   = CATEGORY_COLORS[item.cat]
            return (
              <motion.button
                key={item.id}
                whileTap={!matched_ ? { scale: 0.96 } : {}}
                onClick={() => !matched_ && handleClick(item.id, 'term')}
                className={`rounded-xl p-4 text-sm lg:text-base font-bold text-left transition-all duration-200 min-h-[72px] flex items-center ${wrong_ ? 'shake' : ''}`}
                style={{
                  background: matched_
                    ? 'rgba(16,185,129,0.15)'
                    : sel
                    ? `${color}22`
                    : 'rgba(255,255,255,0.05)',
                  border: matched_
                    ? '1px solid rgba(16,185,129,0.4)'
                    : sel
                    ? `1px solid ${color}66`
                    : '1px solid rgba(255,255,255,0.08)',
                  color: matched_
                    ? '#10B981'
                    : sel
                    ? color
                    : 'rgba(255,255,255,0.85)',
                  cursor: matched_ ? 'default' : 'pointer'
                }}
              >
                {matched_ && <span className="mr-1.5">✓</span>}
                {item.text}
              </motion.button>
            )
          })}
        </div>

        {/* Definitions column */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-bold text-white/30 uppercase tracking-widest text-center">Definitions</div>
          {game.defs.map(item => {
            const sel      = isSelected(item.id, 'def')
            const matched_ = isMatched(item.id)
            const wrong_   = isWrong(item.id)
            const color    = CATEGORY_COLORS[item.cat]
            return (
              <motion.button
                key={`def-${item.id}`}
                whileTap={!matched_ ? { scale: 0.96 } : {}}
                onClick={() => !matched_ && handleClick(item.id, 'def')}
                className={`rounded-xl p-4 text-sm leading-snug text-left transition-all duration-200 min-h-[72px] flex items-center ${wrong_ ? 'shake' : ''}`}
                style={{
                  background: matched_
                    ? 'rgba(16,185,129,0.15)'
                    : sel
                    ? `${color}22`
                    : 'rgba(255,255,255,0.05)',
                  border: matched_
                    ? '1px solid rgba(16,185,129,0.4)'
                    : sel
                    ? `1px solid ${color}66`
                    : '1px solid rgba(255,255,255,0.08)',
                  color: matched_
                    ? '#10B981'
                    : sel
                    ? color
                    : 'rgba(255,255,255,0.75)',
                  cursor: matched_ ? 'default' : 'pointer'
                }}
              >
                {matched_ && <span className="mr-1.5">✓</span>}
                {item.text}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
