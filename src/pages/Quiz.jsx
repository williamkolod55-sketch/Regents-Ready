import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cards, CATEGORY_COLORS, CATEGORY_NAMES, CATEGORY_KEYS } from '../data/cards.js'
import { markNeedsReview } from '../utils/storage.js'
import CategoryBadge from '../components/CategoryBadge.jsx'

function buildQuestion(card, pool) {
  const sameCat   = pool.filter(c => c.id !== card.id && c.cat === card.cat)
  const otherCat  = pool.filter(c => c.id !== card.id && c.cat !== card.cat)
  const shuffledS = [...sameCat].sort(() => Math.random() - 0.5)
  const shuffledO = [...otherCat].sort(() => Math.random() - 0.5)
  const wrongs    = [...shuffledS, ...shuffledO].slice(0, 3)
  const options   = [card, ...wrongs].sort(() => Math.random() - 0.5)
  return { card, options }
}

function buildQuiz(filteredCards, count = 20) {
  const shuffled = [...filteredCards].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length)).map(card => buildQuestion(card, filteredCards))
}

const QUIZ_LENGTH = 20

export default function Quiz() {
  const navigate = useNavigate()
  const [catFilter,    setCatFilter]    = useState('all')
  const [phase,        setPhase]        = useState('setup')  // setup | playing | results
  const [questions,    setQuestions]    = useState([])
  const [qIndex,       setQIndex]       = useState(0)
  const [selected,     setSelected]     = useState(null)
  const [isCorrect,    setIsCorrect]    = useState(null)
  const [score,        setScore]        = useState(0)
  const [breakdown,    setBreakdown]    = useState({})
  const [shakeId,      setShakeId]      = useState(null)
  const [username,     setUsername]     = useState(() => localStorage.getItem('rr_username') || '')
  const [submitted,    setSubmitted]    = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)
  const timerRef = useRef(null)

  const filteredPool = catFilter === 'all' ? cards : cards.filter(c => c.cat === catFilter)

  const startQuiz = () => {
    if (filteredPool.length < 4) return
    const qs = buildQuiz(filteredPool, QUIZ_LENGTH)
    setQuestions(qs)
    setQIndex(0)
    setScore(0)
    setBreakdown({})
    setSelected(null)
    setIsCorrect(null)
    setSubmitted(false)
    setPhase('playing')
  }

  const handleSelect = (optCard) => {
    if (selected !== null) return
    const correct = optCard.id === questions[qIndex].card.id
    setSelected(optCard.id)
    setIsCorrect(correct)

    if (!correct) {
      setShakeId(optCard.id)
      setTimeout(() => setShakeId(null), 500)
      markNeedsReview(questions[qIndex].card.id)
    } else {
      setScore(s => s + 1)
    }

    const cat = questions[qIndex].card.cat
    setBreakdown(prev => ({
      ...prev,
      [cat]: {
        correct: (prev[cat]?.correct || 0) + (correct ? 1 : 0),
        total:   (prev[cat]?.total   || 0) + 1
      }
    }))

    timerRef.current = setTimeout(() => {
      if (qIndex + 1 >= questions.length) {
        setPhase('results')
      } else {
        setQIndex(i => i + 1)
        setSelected(null)
        setIsCorrect(null)
      }
    }, 1100)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const submitScore = async () => {
    if (!username.trim()) return
    localStorage.setItem('rr_username', username)
    const accuracy = Math.round((score / questions.length) * 100)
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), score, total: questions.length, accuracy, category: catFilter, mode: 'quiz' })
      })
      setSubmitStatus('success')
      setSubmitted(true)
    } catch {
      setSubmitStatus('error')
    }
  }

  if (phase === 'setup') {
    return (
      <div className="page-content min-h-screen flex flex-col px-4 lg:px-10 pt-10 pb-28 lg:pb-10 max-w-lg mx-auto lg:max-w-2xl">
        <button onClick={() => navigate('/')} className="text-white/40 hover:text-white transition-colors mb-6 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span className="text-sm font-medium">Back</span>
        </button>

        <h1 className="text-3xl font-black mb-2">Quiz Mode</h1>
        <p className="text-white/40 text-sm mb-8">4-choice multiple choice · {QUIZ_LENGTH} questions max</p>

        <div className="glass rounded-2xl p-5 mb-4">
          <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">Category Filter</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCatFilter('all')}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={catFilter === 'all'
                ? { background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >ALL</button>
            {CATEGORY_KEYS.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={catFilter === cat
                  ? { background: CATEGORY_COLORS[cat] + '33', color: CATEGORY_COLORS[cat], border: `1px solid ${CATEGORY_COLORS[cat]}66` }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >{CATEGORY_NAMES[cat]}</button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 mb-6">
          <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1">Pool Size</div>
          <div className="text-2xl font-black">{filteredPool.length}</div>
          <div className="text-xs text-white/40">cards available{filteredPool.length < 4 && ' — need at least 4'}</div>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={startQuiz}
          disabled={filteredPool.length < 4}
          className="w-full py-4 rounded-2xl font-black text-lg transition-all"
          style={filteredPool.length >= 4
            ? { background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: 'white' }
            : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed' }
          }
        >
          Start Quiz →
        </motion.button>
      </div>
    )
  }

  if (phase === 'results') {
    const accuracy = Math.round((score / questions.length) * 100)
    return (
      <div className="page-content min-h-screen flex flex-col px-4 lg:px-10 pt-10 pb-28 lg:pb-10 max-w-lg mx-auto lg:max-w-2xl">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">{accuracy >= 80 ? '🎉' : accuracy >= 60 ? '📚' : '💪'}</div>
            <h2 className="text-3xl font-black">{score} / {questions.length}</h2>
            <p className="text-white/40 mt-1">{accuracy}% accuracy</p>
          </div>

          <div className="glass rounded-2xl p-5 mb-4">
            <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">Breakdown by Category</div>
            {Object.entries(breakdown).map(([cat, { correct, total: t }]) => (
              <div key={cat} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <CategoryBadge cat={cat} small />
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-white/10">
                    <div className="h-full rounded-full" style={{ width: `${(correct/t)*100}%`, background: CATEGORY_COLORS[cat] }} />
                  </div>
                  <span className="text-xs font-bold text-white/60">{correct}/{t}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="glass rounded-2xl p-5 mb-4">
            <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">Submit to Leaderboard</div>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Your display name..."
              maxLength={30}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-white/25 mb-3"
            />
            {submitStatus === 'success' ? (
              <div className="text-center text-green-400 font-semibold py-2">✓ Score submitted!</div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={submitScore}
                disabled={!username.trim() || submitted}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                style={username.trim()
                  ? { background: 'rgba(59,130,246,0.2)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed' }
                }
              >Submit Score</motion.button>
            )}
          </div>

          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.96 }} onClick={startQuiz}
              className="flex-1 py-3 rounded-xl font-bold text-sm glass">
              Retry Quiz
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/')}
              className="flex-1 py-3 rounded-xl font-bold text-sm glass">
              Home
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  const { card, options } = questions[qIndex]
  const progress = ((qIndex) / questions.length) * 100
  const accuracy = qIndex > 0 ? Math.round((score / qIndex) * 100) : 0

  return (
    <div className="page-content min-h-screen flex flex-col px-4 lg:px-10 pt-8 pb-28 lg:pb-10 max-w-lg mx-auto lg:max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setPhase('setup')} className="text-white/40">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className="text-sm font-bold">{qIndex + 1} / {questions.length}</div>
        <div className="text-sm font-bold text-white/50">
          {score} ✓ {qIndex > 0 ? `· ${accuracy}%` : ''}
        </div>
      </div>

      <div className="w-full h-1.5 rounded-full bg-white/10 mb-6">
        <div className="h-full rounded-full transition-all duration-300 bg-blue-500" style={{ width: `${progress}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col"
        >
          {/* Question */}
          <div className="glass rounded-2xl p-6 mb-5 text-center">
            <CategoryBadge cat={card.cat} />
            <h2 className="text-3xl lg:text-4xl font-black mt-3 text-white leading-tight">{card.term}</h2>
            <p className="text-white/30 text-base mt-2">Choose the correct definition</p>
          </div>

          {/* Options */}
          <div className="space-y-3 flex-1">
            {options.map((opt) => {
              const isSelected = selected === opt.id
              const isRight    = opt.id === card.id
              let bg, border, textColor

              if (selected === null) {
                bg = 'rgba(255,255,255,0.05)'; border = 'rgba(255,255,255,0.1)'; textColor = 'white'
              } else if (isRight) {
                bg = 'rgba(16,185,129,0.2)'; border = 'rgba(16,185,129,0.5)'; textColor = '#10B981'
              } else if (isSelected && !isRight) {
                bg = 'rgba(239,68,68,0.2)'; border = 'rgba(239,68,68,0.5)'; textColor = '#EF4444'
              } else {
                bg = 'rgba(255,255,255,0.02)'; border = 'rgba(255,255,255,0.05)'; textColor = 'rgba(255,255,255,0.3)'
              }

              return (
                <motion.button
                  key={opt.id}
                  whileTap={selected === null ? { scale: 0.98 } : {}}
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left p-5 rounded-xl border transition-all duration-200 ${shakeId === opt.id ? 'shake' : ''}`}
                  style={{ background: bg, borderColor: border, color: textColor }}
                >
                  <ul className="space-y-2">
                    {opt.bullets.map((b, i) => (
                      <li key={i} className="text-base leading-snug flex items-start gap-2.5">
                        <span className="mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-60"
                          style={{ background: textColor }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </motion.button>
              )
            })}
          </div>

          {selected !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 text-center text-base font-bold py-3 rounded-xl ${
                isCorrect ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
              }`}
            >
              {isCorrect ? '✓ Correct!' : '✗ Missed — added to review pile'}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
