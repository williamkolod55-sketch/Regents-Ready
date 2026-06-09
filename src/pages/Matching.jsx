import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cards, CATEGORY_COLORS } from '../data/cards.js'

const PAIR_COUNT = 6

function buildGame() {
  const shuffled = [...cards].sort(() => Math.random() - 0.5)
  const pairs    = shuffled.slice(0, PAIR_COUNT)
  const terms    = pairs.map(c => ({ id: c.id, text: c.term,       cat: c.cat, type: 'term' }))
  const defs     = pairs.map(c => ({ id: c.id, text: c.bullets[0], cat: c.cat, type: 'def'  }))
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
  const [game,      setGame]      = useState(null)
  const [selected,  setSelected]  = useState(null)
  const [matched,   setMatched]   = useState(new Set())
  const [wrong,     setWrong]     = useState(null)
  const [elapsed,   setElapsed]   = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [done,      setDone]      = useState(false)
  const [bestTime,  setBestTime]  = useState(() => parseInt(localStorage.getItem('rr_match_best') || '0'))
  const intervalRef = useRef(null)

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
    if (!selected) { setSelected({ id, type }); return }
    if (selected.id === id && selected.type === type) { setSelected(null); return }
    if (selected.type === type) { setSelected({ id, type }); return }
    if (selected.id === id) {
      setMatched(m => new Set([...m, id]))
      setSelected(null)
      setWrong(null)
    } else {
      const wrongId = selected.id
      setWrong(wrongId)
      setSelected({ id, type })
      setTimeout(() => setWrong(null), 600)
    }
  }

  const isSelected = (id, type) => selected?.id === id && selected?.type === type
  const isMatched  = id => matched.has(id)
  const isWrong    = id => wrong === id

  if (!game) return null

  return (
    <div className="page-content flex-1 flex flex-col px-4 lg:px-10 pt-6 lg:pt-8 pb-24 lg:pb-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate('/')} className="text-white/40 hover:text-white transition-colors p-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className="text-center">
          <div className="text-5xl font-black tabular-nums leading-none">{formatTime(elapsed)}</div>
          {bestTime > 0 && <div className="text-sm text-white/30 mt-1">best {formatTime(bestTime)}</div>}
        </div>
        <button onClick={startGame} className="text-base font-bold px-6 py-3 rounded-xl glass">
          New Game
        </button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-2">
          {Array.from({ length: PAIR_COUNT }, (_, i) => (
            <div key={i} className="w-3 h-3 rounded-full transition-all duration-300"
              style={{ background: i < matched.size ? '#10B981' : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>
        <span className="text-base text-white/50 font-medium">{matched.size}/{PAIR_COUNT} matched</span>
      </div>

      <div className="text-base text-white/35 text-center mb-4">Select a term, then its matching definition</div>

      {/* Victory banner */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-5 text-center mb-4 flex-shrink-0"
            style={{ border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)' }}
          >
            <div className="text-2xl mb-1">🎉</div>
            <div className="text-lg font-black text-green-400">Board Cleared!</div>
            <div className="text-white/50 text-sm mt-0.5">Time: {formatTime(elapsed)}</div>
            {bestTime === elapsed && <div className="text-amber-400 text-xs mt-1 font-bold">🏆 New Best!</div>}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={startGame}
              className="mt-3 px-6 py-2 rounded-xl font-bold text-sm w-full"
              style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}
            >Play Again</motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        Game grid: single CSS grid with 2 columns and (1 header + PAIR_COUNT) rows.
        Auto-placement fills left-to-right, so pairs [term[i], def[i]] land in the same row.
        gridTemplateRows gives each card row an equal 1fr slice of the remaining height,
        so both columns are always the same length and row heights match.
      */}
      <div
        className="flex-1 min-h-0 grid grid-cols-2 gap-3"
        style={{ gridTemplateRows: `auto repeat(${PAIR_COUNT}, 1fr)` }}
      >
        {/* Column headers — row 1 */}
        <div className="text-sm font-bold text-white/50 uppercase tracking-widest text-center pb-2">Terms</div>
        <div className="text-sm font-bold text-white/50 uppercase tracking-widest text-center pb-2">Definitions</div>

        {/* Card pairs — rows 2 … PAIR_COUNT+1, auto-placed left-right */}
        {game.terms.flatMap((term, i) => {
          const def = game.defs[i]
          return [
            // Term card
            (() => {
              const sel  = isSelected(term.id, 'term')
              const mat  = isMatched(term.id)
              const wrg  = isWrong(term.id)
              const col  = CATEGORY_COLORS[term.cat]
              return (
                <motion.button
                  key={`t-${term.id}`}
                  whileTap={!mat ? { scale: 0.97 } : {}}
                  onClick={() => !mat && handleClick(term.id, 'term')}
                  className={`rounded-xl p-4 lg:p-5 text-sm lg:text-base font-bold text-left transition-all duration-200 flex items-center w-full h-full ${wrg ? 'shake' : ''}`}
                  style={{
                    background: mat ? 'rgba(16,185,129,0.15)' : sel ? `${col}22` : 'rgba(255,255,255,0.05)',
                    border:     mat ? '1px solid rgba(16,185,129,0.4)' : sel ? `1px solid ${col}66` : '1px solid rgba(255,255,255,0.08)',
                    color:      mat ? '#10B981' : sel ? col : 'rgba(255,255,255,0.9)',
                    cursor:     mat ? 'default' : 'pointer',
                  }}
                >
                  {mat && <span className="mr-1.5 flex-shrink-0">✓</span>}
                  <span className="leading-snug">{term.text}</span>
                </motion.button>
              )
            })(),
            // Def card
            (() => {
              const sel  = isSelected(def.id, 'def')
              const mat  = isMatched(def.id)
              const wrg  = isWrong(def.id)
              const col  = CATEGORY_COLORS[def.cat]
              return (
                <motion.button
                  key={`d-${def.id}`}
                  whileTap={!mat ? { scale: 0.97 } : {}}
                  onClick={() => !mat && handleClick(def.id, 'def')}
                  className={`rounded-xl p-4 lg:p-5 text-sm leading-snug text-left transition-all duration-200 flex items-center w-full h-full ${wrg ? 'shake' : ''}`}
                  style={{
                    background: mat ? 'rgba(16,185,129,0.15)' : sel ? `${col}22` : 'rgba(255,255,255,0.05)',
                    border:     mat ? '1px solid rgba(16,185,129,0.4)' : sel ? `1px solid ${col}66` : '1px solid rgba(255,255,255,0.08)',
                    color:      mat ? '#10B981' : sel ? col : 'rgba(255,255,255,0.75)',
                    cursor:     mat ? 'default' : 'pointer',
                  }}
                >
                  {mat && <span className="mr-1.5 flex-shrink-0">✓</span>}
                  <span>{def.text}</span>
                </motion.button>
              )
            })(),
          ]
        })}
      </div>
    </div>
  )
}
