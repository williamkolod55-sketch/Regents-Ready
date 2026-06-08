import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cards } from '../data/cards.js'
import { markNeedsReview, markGotIt } from '../utils/storage.js'
import CategoryBadge from '../components/CategoryBadge.jsx'
import { CATEGORY_COLORS } from '../data/cards.js'

const DURATION = 60

export default function LightningRound() {
  const navigate = useNavigate()
  const [phase,     setPhase]     = useState('ready')  // ready | playing | done
  const [deck,      setDeck]      = useState([])
  const [index,     setIndex]     = useState(0)
  const [timeLeft,  setTimeLeft]  = useState(DURATION)
  const [got,       setGot]       = useState(0)
  const [missed,    setMissed]    = useState(0)
  const [cardKey,   setCardKey]   = useState(0)
  const [username,  setUsername]  = useState(() => localStorage.getItem('rr_username') || '')
  const [submitted, setSubmitted] = useState(false)
  const timerRef = useRef(null)

  const start = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setDeck(shuffled)
    setIndex(0)
    setGot(0)
    setMissed(0)
    setTimeLeft(DURATION)
    setSubmitted(false)
    setCardKey(0)
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setPhase('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  const advance = (gotIt) => {
    if (phase !== 'playing') return
    const card = deck[index % deck.length]
    if (gotIt) { markGotIt(card.id); setGot(g => g + 1) }
    else        { markNeedsReview(card.id); setMissed(m => m + 1) }
    setIndex(i => i + 1)
    setCardKey(k => k + 1)
  }

  const submitScore = async () => {
    if (!username.trim() || submitted) return
    localStorage.setItem('rr_username', username)
    const total    = got + missed
    const accuracy = total > 0 ? Math.round((got / total) * 100) : 0
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), score: got, total, accuracy, category: 'ALL', mode: 'lightning' })
      })
      setSubmitted(true)
    } catch { /* non-critical */ }
  }

  const urgent = timeLeft <= 10 && phase === 'playing'
  const currentCard = deck[index % deck.length]
  const totalAnswered = got + missed
  const accuracy = totalAnswered > 0 ? Math.round((got / totalAnswered) * 100) : 0

  if (phase === 'ready') {
    return (
      <div className="page-content min-h-screen flex flex-col items-center justify-center px-4 lg:px-10 pb-28 lg:pb-10 max-w-lg mx-auto lg:max-w-xl">
        <button onClick={() => navigate('/')} className="self-start text-white/40 hover:text-white mb-8 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span className="text-sm">Back</span>
        </button>
        <div className="text-6xl mb-4">⚡</div>
        <h1 className="text-3xl font-black mb-2">Lightning Round</h1>
        <p className="text-white/40 text-center mb-2">How many cards can you answer in 60 seconds?</p>
        <p className="text-white/25 text-sm text-center mb-8">Tap Got It or Missed as fast as you can</p>
        <div className="glass rounded-2xl p-5 mb-8 w-full text-center">
          <div className="text-4xl font-black text-red-400">{DURATION}s</div>
          <div className="text-white/40 text-sm mt-1">time limit</div>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={start}
          className="w-full py-4 rounded-2xl font-black text-lg"
          style={{ background: 'linear-gradient(135deg, #EF4444, #F59E0B)', color: 'white' }}
        >
          Start ⚡
        </motion.button>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="page-content min-h-screen flex flex-col px-4 lg:px-10 pt-10 pb-28 lg:pb-10 max-w-lg mx-auto lg:max-w-xl">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-6">
          <div className="text-5xl mb-3">⚡</div>
          <h2 className="text-4xl font-black">{got}</h2>
          <p className="text-white/40">cards in 60 seconds</p>
          <p className="text-white/25 text-sm mt-1">{accuracy}% accuracy · {missed} missed</p>
        </motion.div>

        <div className="glass rounded-2xl p-5 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-black text-green-400">{got}</div>
              <div className="text-xs text-white/40">Got It</div>
            </div>
            <div>
              <div className="text-2xl font-black text-red-400">{missed}</div>
              <div className="text-xs text-white/40">Missed</div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-400">{accuracy}%</div>
              <div className="text-xs text-white/40">Accuracy</div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 mb-4">
          <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">Submit to Lightning Board</div>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Your display name..."
            maxLength={30}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-white/25 mb-3"
          />
          {submitted ? (
            <div className="text-center text-green-400 font-semibold py-2">✓ Score submitted!</div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={submitScore}
              disabled={!username.trim()}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all"
              style={username.trim()
                ? { background: 'rgba(239,68,68,0.2)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed' }
              }
            >Submit ⚡ Score</motion.button>
          )}
        </div>

        <div className="flex gap-3">
          <motion.button whileTap={{ scale: 0.96 }} onClick={start}
            className="flex-1 py-3 rounded-xl font-bold text-sm glass">Try Again</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/')}
            className="flex-1 py-3 rounded-xl font-bold text-sm glass">Home</motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content min-h-screen flex flex-col px-4 lg:px-10 pt-8 pb-28 lg:pb-10 max-w-lg mx-auto lg:max-w-xl">
      {/* Timer */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-bold text-white/40">{got} got · {missed} miss</div>
        <motion.div
          className={`text-4xl font-black tabular-nums rounded-2xl px-4 py-2 ${urgent ? 'timer-pulse' : ''}`}
          style={{
            color: urgent ? '#EF4444' : timeLeft <= 30 ? '#F59E0B' : 'white',
            background: urgent ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
            border: urgent ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {timeLeft}
        </motion.div>
        <div className="text-sm font-bold text-white/40">{accuracy}%</div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full bg-white/10 mb-5">
        <div className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${(timeLeft / DURATION) * 100}%`,
            background: urgent ? '#EF4444' : timeLeft <= 30 ? '#F59E0B' : '#10B981'
          }} />
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {currentCard && (
            <motion.div
              key={cardKey}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="glass rounded-2xl p-6 text-center mb-5"
              style={{
                background: `linear-gradient(135deg, ${CATEGORY_COLORS[currentCard.cat]}11 0%, rgba(255,255,255,0.03) 100%)`
              }}
            >
              <CategoryBadge cat={currentCard.cat} />
              <h2 className="text-4xl font-black mt-4 text-white leading-tight">{currentCard.term}</h2>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center text-white/20 text-xs mb-5">Know this term?</div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => advance(false)}
          className="flex-1 py-6 rounded-2xl font-black text-lg"
          style={{ background: 'rgba(239,68,68,0.2)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          ✗ Missed
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => advance(true)}
          className="flex-1 py-6 rounded-2xl font-black text-lg"
          style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}
        >
          ✓ Got It
        </motion.button>
      </div>
    </div>
  )
}
