import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cards, CATEGORY_COLORS, CATEGORY_NAMES, CATEGORY_KEYS } from '../data/cards.js'
import { markGotIt, markNeedsReview, getNeedsReviewCards, getMostMissedCards, getCardData } from '../utils/storage.js'
import { fireStreakConfetti } from '../utils/confetti.js'
import CategoryBadge from '../components/CategoryBadge.jsx'

const ALL_TABS = [
  { key: 'all',    label: 'ALL' },
  ...CATEGORY_KEYS.map(k => ({ key: k, label: CATEGORY_NAMES[k].toUpperCase() })),
  { key: 'review', label: '★ REVIEW' },
]

export default function Flashcards() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()

  const initCat  = searchParams.get('cat')
  const defaultTab = initCat && CATEGORY_KEYS.includes(initCat) ? initCat : 'all'

  const [activeTab,   setActiveTab]   = useState(defaultTab)
  const [modeFilter,  setModeFilter]  = useState(searchParams.get('mode') || null)
  const [deck,        setDeck]        = useState([])
  const [index,       setIndex]       = useState(0)
  const [isFlipped,   setIsFlipped]   = useState(false)
  const [direction,   setDirection]   = useState(1)
  const [streak,      setStreak]      = useState(0)
  const [sessionGot,  setSessionGot]  = useState(0)
  const [sessionMiss, setSessionMiss] = useState(0)
  const [key,         setKey]         = useState(0)
  const [studyMode,   setStudyMode]   = useState(() => localStorage.getItem('rr_study_mode') || 'term-first')

  const toggleStudyMode = () => {
    const next = studyMode === 'term-first' ? 'def-first' : 'term-first'
    setStudyMode(next)
    localStorage.setItem('rr_study_mode', next)
    setIsFlipped(false)
  }

  const shuffledRef = useRef([])

  const buildDeck = useCallback((tab, mode) => {
    let filtered
    if (mode === 'weakspots')  filtered = getMostMissedCards(cards, 10)
    else if (tab === 'all')    filtered = cards
    else if (tab === 'review') filtered = getNeedsReviewCards(cards)
    else                       filtered = cards.filter(c => c.cat === tab)
    const shuffled = [...filtered].sort(() => Math.random() - 0.5)
    shuffledRef.current = shuffled
    setDeck(shuffled)
    setIndex(0)
    setIsFlipped(false)
    setKey(k => k + 1)
  }, [])

  useEffect(() => { buildDeck(activeTab, modeFilter) }, [activeTab, modeFilter, buildDeck])

  const currentCard = deck[index]

  const goNext = (dir = 1) => {
    setDirection(dir)
    setIsFlipped(false)
    setTimeout(() => {
      setIndex(i => (i + 1) % deck.length)
      setKey(k => k + 1)
    }, 80)
  }

  const handleGotIt = () => {
    if (!currentCard) return
    markGotIt(currentCard.id)
    const newStreak = streak + 1
    setStreak(newStreak)
    setSessionGot(s => s + 1)
    if (newStreak > 0 && newStreak % 10 === 0) fireStreakConfetti()
    goNext(1)
  }

  const handleNeedsReview = () => {
    if (!currentCard) return
    markNeedsReview(currentCard.id)
    setStreak(0)
    setSessionMiss(s => s + 1)
    goNext(1)
  }

  const handleTabChange = (tab) => {
    setModeFilter(null)
    setActiveTab(tab)
    setStreak(0)
    setSessionGot(0)
    setSessionMiss(0)
  }

  const total    = sessionGot + sessionMiss
  const accuracy = total > 0 ? Math.round((sessionGot / total) * 100) : 0

  const cardData = currentCard ? getCardData(currentCard.id) : null

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === ' ')           { e.preventDefault(); setIsFlipped(f => !f) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goNext(1) }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); setDirection(-1); setIsFlipped(false); setTimeout(() => { setIndex(i => (i - 1 + deck.length) % deck.length); setKey(k => k + 1) }, 80) }
      else if (e.key === 'ArrowUp')    { e.preventDefault(); if (isFlipped) handleGotIt() }
      else if (e.key === 'ArrowDown')  { e.preventDefault(); if (isFlipped) handleNeedsReview() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFlipped, deck.length, goNext, handleGotIt, handleNeedsReview])

  if (deck.length === 0) {
    return (
      <div className="page-content flex-1 flex flex-col items-center justify-center px-4 lg:px-10 gap-4 max-w-lg mx-auto lg:max-w-2xl">
        <div className="text-4xl">🎉</div>
        <div className="text-xl font-bold">No cards here!</div>
        <div className="text-white/40 text-sm text-center">
          {activeTab === 'review' ? 'Nothing in the review pile — you\'re clear!' : 'Switch to a different category.'}
        </div>
        <button onClick={() => navigate('/')} className="glass px-5 py-2.5 rounded-xl font-semibold text-sm mt-2">
          ← Home
        </button>
      </div>
    )
  }

  return (
    <div className="page-content flex-1 flex flex-col px-4 lg:px-10 pt-3 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => navigate('/')} className="text-white/40 hover:text-white transition-colors p-2">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className="text-base font-bold text-white/60">
          {index + 1} / {deck.length}
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
              🔥 {streak}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full bg-white/10 mb-2">
        <div className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${((index + 1) / deck.length) * 100}%`,
            background: currentCard ? CATEGORY_COLORS[currentCard.cat] : '#fff'
          }} />
      </div>

      {/* Category tabs */}
      <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1.5 mb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {ALL_TABS.map(({ key: tabKey, label }) => {
          const active = activeTab === tabKey
          const color  = CATEGORY_COLORS[tabKey] || (tabKey === 'review' ? '#EC4899' : '#ffffff')
          return (
            <button
              key={tabKey}
              onClick={() => handleTabChange(tabKey)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-150"
              style={active
                ? { background: color + '33', color, border: `1px solid ${color}66` }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Study mode toggle */}
      <div className="flex justify-center mb-3">
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.07)', borderRadius: '999px', padding: '3px', gap: '2px' }}>
          {[['term-first', 'Term → Definition'], ['def-first', 'Definition → Term']].map(([val, label]) => (
            <button key={val} onClick={toggleStudyMode}
              className="text-xs font-bold transition-all duration-150"
              style={studyMode === val
                ? { background: 'rgba(255,255,255,0.18)', color: 'white', borderRadius: '999px', padding: '5px 14px' }
                : { color: 'rgba(255,255,255,0.35)', borderRadius: '999px', padding: '5px 14px' }
              }
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Flip Card */}
      <div className="w-full card-3d-container flex-1 min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={key}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              <div
                className={`card-3d w-full h-full cursor-pointer`}
                style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                onClick={() => setIsFlipped(f => !f)}
              >
                {/* Front */}
                <div className="card-face glass flex flex-col items-center justify-center p-6 text-center">
                  {currentCard && (
                    <>
                      <div className="absolute top-4 left-1/2 -translate-x-1/2">
                        <CategoryBadge cat={currentCard.cat} />
                      </div>
                      {studyMode === 'term-first' ? (
                        <>
                          <h2 className={`font-black leading-tight text-white ${
                            currentCard.term.length <= 12 ? 'text-5xl lg:text-6xl' :
                            currentCard.term.length <= 22 ? 'text-4xl lg:text-5xl' :
                            currentCard.term.length <= 35 ? 'text-3xl lg:text-4xl' :
                            'text-2xl lg:text-3xl'
                          }`}>{currentCard.term}</h2>
                          <p className="text-white/30 text-base mt-3">Tap to reveal</p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg lg:text-xl leading-snug text-white/90 px-2">{currentCard.bullets[0]}</p>
                          <p className="text-white/30 text-base mt-3">What term is this?</p>
                        </>
                      )}
                      {cardData?.missCount > 0 && (
                        <div className="mt-2 text-sm text-red-400/60">missed {cardData.missCount}×</div>
                      )}
                    </>
                  )}
                </div>

                {/* Back */}
                <div className="card-face card-face-back glass flex flex-col justify-center p-6 lg:p-8">
                  {currentCard && (
                    <>
                      <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)' }}>
                        <CategoryBadge cat={currentCard.cat} />
                      </div>
                      {studyMode === 'term-first' ? (
                        <>
                          <h3 className="text-3xl font-bold text-white mb-5 mt-6">{currentCard.term}</h3>
                          <ul className="flex flex-col gap-4">
                            {currentCard.bullets.map((bullet, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <span className="mt-[8px] w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ background: CATEGORY_COLORS[currentCard.cat] }} />
                                <span className="text-lg leading-relaxed text-white/90">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <>
                          <h2 className={`font-black leading-tight text-white mt-6 mb-5 ${
                            currentCard.term.length <= 12 ? 'text-5xl lg:text-6xl' :
                            currentCard.term.length <= 22 ? 'text-4xl lg:text-5xl' :
                            currentCard.term.length <= 35 ? 'text-3xl lg:text-4xl' :
                            'text-2xl lg:text-3xl'
                          }`}>{currentCard.term}</h2>
                          <ul className="flex flex-col gap-4">
                            {currentCard.bullets.map((bullet, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <span className="mt-[8px] w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ background: CATEGORY_COLORS[currentCard.cat] }} />
                                <span className="text-lg leading-relaxed text-white/90">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex gap-3">
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={handleNeedsReview}
          disabled={!isFlipped}
          className="flex-1 py-5 rounded-2xl font-bold text-lg transition-all duration-150 flex items-center justify-center gap-2"
          style={isFlipped
            ? { background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }
            : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'not-allowed' }
          }
        >
          <span className="text-xl">⊗</span> Needs Review
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={handleGotIt}
          disabled={!isFlipped}
          className="flex-1 py-5 rounded-2xl font-bold text-lg transition-all duration-150 flex items-center justify-center gap-2"
          style={isFlipped
            ? { background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }
            : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'not-allowed' }
          }
        >
          <span className="text-xl">✓</span> Got It
        </motion.button>
      </div>

      {/* Session stats */}
      {total > 0 && (
        <div className="mt-2 flex justify-center gap-5 text-xs text-white/35">
          <span>✓ {sessionGot} correct</span>
          <span>⊗ {sessionMiss} review</span>
          <span>{accuracy}% accuracy</span>
        </div>
      )}

      {/* Keyboard hint */}
      <p className="text-center text-white/25 text-xs mt-2 hidden lg:block">
        Space to flip · ← → navigate · ↑ Got It · ↓ Needs Review
      </p>
      {!isFlipped && (
        <p className="text-center text-white/35 text-sm mt-1 lg:hidden">Tap the card to flip</p>
      )}
    </div>
  )
}
