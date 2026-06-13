import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cards, CATEGORY_COLORS, CATEGORY_NAMES, CATEGORY_KEYS } from '../data/cards.js'
import { markNeedsReview } from '../utils/storage.js'
import { validateName, formatName } from '../utils/nameValidation.js'
import CategoryBadge from '../components/CategoryBadge.jsx'

const ERA_GROUPS = {
  "FOUNDING":         ["REV. ERA", "CIVIL WAR ERA"],
  "REV. ERA":         ["FOUNDING", "CIVIL WAR ERA"],
  "CIVIL WAR ERA":    ["FOUNDING", "REV. ERA", "GILDED AGE"],
  "GILDED AGE":       ["CIVIL WAR ERA", "PROG. ERA"],
  "PROG. ERA":        ["GILDED AGE", "GREAT DEPRESSION"],
  "GREAT DEPRESSION": ["PROG. ERA", "WWII"],
  "WWII":             ["GREAT DEPRESSION", "COLD WAR"],
  "COLD WAR":         ["WWII", "KOREA/VIETNAM", "CIVIL RIGHTS"],
  "KOREA/VIETNAM":    ["COLD WAR", "WWII", "CIVIL RIGHTS"],
  "CIVIL RIGHTS":     ["COLD WAR", "KOREA/VIETNAM", "MODERN ERA"],
  "MODERN ERA":       ["CIVIL RIGHTS", "COLD WAR"],
}

function buildQuestion(card) {
  const allOthers = cards.filter(c => c.id !== card.id)
  const sameCat   = [...allOthers.filter(c => c.cat === card.cat)].sort(() => Math.random() - 0.5)

  if (sameCat.length >= 3) {
    const options = [card, ...sameCat.slice(0, 3)].sort(() => Math.random() - 0.5)
    return { card, options }
  }

  const needed  = 3 - sameCat.length
  const adjCats = ERA_GROUPS[card.cat] || []
  const adjPool = [...allOthers.filter(c => adjCats.includes(c.cat))].sort(() => Math.random() - 0.5)
  const wrongs  = [...sameCat, ...adjPool.slice(0, needed)]
  const options = [card, ...wrongs].sort(() => Math.random() - 0.5)
  return { card, options }
}

function buildQuiz(filteredCards, count = 20) {
  const shuffled = [...filteredCards].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length)).map(card => buildQuestion(card))
}

const QUIZ_LENGTH = 20

export default function Quiz() {
  const navigate = useNavigate()
  const deviceId = (() => {
    let id = localStorage.getItem('rr_device_id')
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('rr_device_id', id) }
    return id
  })()
  const [catFilter,    setCatFilter]    = useState('all')
  const [phase,        setPhase]        = useState('setup')  // setup | playing | results
  const [questions,    setQuestions]    = useState([])
  const [qIndex,       setQIndex]       = useState(0)
  const [selected,     setSelected]     = useState(null)
  const [isCorrect,    setIsCorrect]    = useState(null)
  const [score,        setScore]        = useState(0)
  const [breakdown,    setBreakdown]    = useState({})
  const [shakeId,      setShakeId]      = useState(null)
  const [hoveredId,    setHoveredId]    = useState(null)
  const [username,     setUsername]     = useState(() => localStorage.getItem('rr_username') || '')
  const [submitted,    setSubmitted]    = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)
  const [nameError,    setNameError]    = useState(null)
  const timerRef = useRef(null) // kept for compatibility

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
    setSubmitStatus(null)
    setNameError(null)
    setPhase('playing')
  }

  const handleSelect = (optCard) => {
    if (selected !== null) return
    setHoveredId(null)
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
  }

  const handleAdvance = useCallback(() => {
    if (selected === null) return
    if (qIndex + 1 >= questions.length) {
      setPhase('results')
    } else {
      setQIndex(i => i + 1)
      setSelected(null)
      setIsCorrect(null)
    }
  }, [selected, qIndex, questions.length])

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (selected !== null && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        handleAdvance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, handleAdvance])

  const submitScore = async () => {
    const { valid, error } = validateName(username)
    if (!valid) { setNameError(error); return }
    const formatted = formatName(username)
    localStorage.setItem('rr_username', formatted)
    const accuracy = Math.round((score / questions.length) * 100)
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formatted, score, total: questions.length, accuracy, category: catFilter, mode: 'quiz', device_id: deviceId })
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      setSubmitStatus('success')
      setSubmitted(true)
    } catch {
      setSubmitStatus('error')
    }
  }

  if (phase === 'setup') {
    return (
      <div style={{ position: 'fixed', top: 0, left: '224px', right: 0, bottom: 0, display: 'flex', flexDirection: 'column', padding: '32px', gap: '24px' }}>

        {/* Row 1: Title */}
        <div style={{ flexShrink: 0, marginBottom: '24px' }}>
          <button onClick={() => navigate('/')} className="text-white/40 hover:text-white transition-colors mb-4 flex items-center gap-2 p-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span className="text-base font-medium">Back</span>
          </button>
          <h1 className="text-4xl font-black mb-1">Quiz Mode</h1>
          <p className="text-white/50 text-base">4-choice multiple choice · {QUIZ_LENGTH} questions max</p>
        </div>

        {/* Row 2: Category filter */}
        <div className="glass rounded-2xl p-5" style={{ flex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-4">Category Filter</div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setCatFilter('all')}
              className="px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={catFilter === 'all'
                ? { background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >All Categories</button>
            {CATEGORY_KEYS.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className="px-4 py-2 rounded-full text-sm font-bold transition-all"
                style={catFilter === cat
                  ? { background: CATEGORY_COLORS[cat] + '33', color: CATEGORY_COLORS[cat], border: `1px solid ${CATEGORY_COLORS[cat]}66` }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >{CATEGORY_NAMES[cat]}</button>
            ))}
          </div>
        </div>

        {/* Row 4: Pool size */}
        <div className="glass rounded-2xl" style={{ flex: 1, padding: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1">Pool Size</div>
            <div className="text-sm text-white/40">
              {filteredPool.length < 4 ? 'Need at least 4 cards' : 'cards available'}
            </div>
          </div>
          <div className="text-5xl lg:text-6xl font-black tabular-nums"
            style={{ color: filteredPool.length < 4 ? '#EF4444' : 'white' }}>
            {filteredPool.length}
          </div>
        </div>

        {/* Row 5: Start button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={startQuiz}
          disabled={filteredPool.length < 4}
          className="w-full rounded-2xl font-black text-xl transition-all"
          style={filteredPool.length >= 4
            ? { flexShrink: 0, padding: '20px', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: 'white' }
            : { flexShrink: 0, padding: '20px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed' }
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
      <div className="page-content flex-1 flex flex-col px-4 lg:px-10 pt-10 pb-28 lg:pb-10 max-w-lg mx-auto lg:max-w-2xl">
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
              onChange={e => { setUsername(e.target.value); setNameError(null) }}
              placeholder="First Last (e.g. Jane Smith)"
              maxLength={40}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-white/25 mb-1"
            />
            {nameError && <p className="text-red-400 text-xs mb-2 px-1">{nameError}</p>}
            {submitStatus === 'success' ? (
              <div className="text-center text-green-400 font-semibold py-2 mt-1">✓ Score submitted!</div>
            ) : (
              <>
                {submitStatus === 'error' && <p className="text-red-400 text-xs mb-2 px-1">Failed to submit — try again</p>}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={submitScore}
                  disabled={submitted}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all mt-1"
                  style={username.trim()
                    ? { background: 'rgba(59,130,246,0.2)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)' }
                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed' }
                  }
                >Submit Score</motion.button>
              </>
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
    <div className="h-screen flex flex-col w-full px-8 pt-6" style={{ paddingBottom: selected !== null ? '140px' : '40px' }}>
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
          <div className="glass rounded-2xl p-6 mb-5 text-center"
            style={{ borderTop: `3px solid ${CATEGORY_COLORS[card.cat]}` }}>
            <CategoryBadge cat={card.cat} solid />
            <h2 className="text-3xl lg:text-4xl font-black mt-3 text-white leading-tight">{card.term}</h2>
            <p className="text-white/30 text-base mt-2">Choose the correct definition</p>
          </div>

          {/* Options — 2x2 Kahoot-style grid */}
          {(() => {
            const QUAD_COLORS = [
              { bg: 'rgba(159,18,57,0.35)',   border: 'rgba(251,113,133,0.5)',  hoverBg: 'rgba(159,18,57,0.5)',   hoverBorder: 'rgba(251,113,133,0.75)'  },
              { bg: 'rgba(30,58,138,0.35)',   border: 'rgba(96,165,250,0.5)',   hoverBg: 'rgba(30,58,138,0.5)',   hoverBorder: 'rgba(96,165,250,0.75)'   },
              { bg: 'rgba(6,78,59,0.35)',     border: 'rgba(52,211,153,0.5)',   hoverBg: 'rgba(6,78,59,0.5)',     hoverBorder: 'rgba(52,211,153,0.75)'   },
              { bg: 'rgba(120,53,15,0.35)',   border: 'rgba(251,191,36,0.5)',   hoverBg: 'rgba(120,53,15,0.5)',   hoverBorder: 'rgba(251,191,36,0.75)'   },
            ]
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1, padding: '8px 0' }}>
                {options.map((opt, i) => {
                  const isSelected = selected === opt.id
                  const isRight    = opt.id === card.id
                  const colors     = QUAD_COLORS[i]
                  const isHovered  = hoveredId === opt.id

                  let bgColor, borderStyle, opacity, showCheck, showX
                  if (selected === null) {
                    bgColor     = isHovered ? colors.hoverBg     : colors.bg
                    borderStyle = `1px solid ${isHovered ? colors.hoverBorder : colors.border}`
                    opacity     = 1
                    showCheck   = false
                    showX       = false
                  } else if (isRight) {
                    bgColor     = colors.hoverBg
                    borderStyle = '2px solid white'
                    opacity     = 1
                    showCheck   = true
                    showX       = false
                  } else if (isSelected && !isRight) {
                    bgColor     = colors.bg
                    borderStyle = `1px solid ${colors.border}`
                    opacity     = 0.25
                    showCheck   = false
                    showX       = true
                  } else {
                    bgColor     = colors.bg
                    borderStyle = `1px solid ${colors.border}`
                    opacity     = 0.3
                    showCheck   = false
                    showX       = false
                  }

                  return (
                    <motion.button
                      key={opt.id}
                      whileTap={selected === null ? { scale: 0.97 } : {}}
                      animate={showCheck ? { scale: [1, 1.03, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      onClick={() => handleSelect(opt)}
                      onMouseEnter={() => selected === null && setHoveredId(opt.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`rounded-2xl relative transition-all duration-200 ${shakeId === opt.id ? 'shake' : ''}`}
                      style={{
                        background: bgColor,
                        border: borderStyle,
                        opacity,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px 20px',
                      }}
                    >
                      {showCheck && (
                        <span style={{
                          position: 'absolute', top: '10px', right: '12px',
                          fontSize: '18px', fontWeight: 900, color: '#10B981',
                        }}>✓</span>
                      )}
                      {showX && (
                        <span style={{
                          position: 'absolute', top: '10px', right: '12px',
                          fontSize: '18px', fontWeight: 900, color: 'rgba(255,255,255,0.6)',
                        }}>✗</span>
                      )}
                      <span style={{
                        color: 'white', fontWeight: 700,
                        fontSize: '16px', lineHeight: 1.35,
                        textAlign: 'center',
                      }}>{opt.bullets[0]}</span>
                    </motion.button>
                  )
                })}
              </div>
            )
          })()}

        </motion.div>
      </AnimatePresence>

      {/* Continue bar — fixed at bottom after answer selected */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-[72px] lg:bottom-0 left-0 lg:left-56 right-0 z-20 px-8 py-4"
            style={{ background: 'rgba(10,10,18,0.97)', borderTop: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
          >
            {!isCorrect && (
              <p className="text-sm text-white/55 mb-3 text-center">
                Correct answer: <span className="text-white font-semibold">{card.bullets[0]}</span>
              </p>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAdvance}
              className="w-full py-4 rounded-2xl font-black text-lg"
              style={isCorrect
                ? { background: 'rgba(16,185,129,0.2)', color: '#10B981', border: '1px solid rgba(16,185,129,0.35)' }
                : { background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }
              }
            >
              {isCorrect ? '✓ Correct — Continue →' : '✗ Missed — Continue →'}
            </motion.button>
            <p className="text-center text-white/25 text-xs mt-2 hidden lg:block">Press Enter or Space to continue</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
