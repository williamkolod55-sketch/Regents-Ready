import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cards, CATEGORY_COLORS } from '../data/cards.js'
import { getNeedsReviewCards, markGotIt, markNeedsReview, getMissCount } from '../utils/storage.js'
import { fireCelebrationConfetti } from '../utils/confetti.js'
import CategoryBadge from '../components/CategoryBadge.jsx'

export default function CramMode() {
  const navigate = useNavigate()
  const [deck,       setDeck]       = useState([])
  const [index,      setIndex]      = useState(0)
  const [isFlipped,  setIsFlipped]  = useState(false)
  const [cleared,    setCleared]    = useState(0)
  const [cardKey,    setCardKey]    = useState(0)
  const [direction,  setDirection]  = useState(1)
  const [studyMode,  setStudyMode]  = useState(() => localStorage.getItem('rr_study_mode') || 'term-first')

  const toggleStudyMode = () => {
    const next = studyMode === 'term-first' ? 'def-first' : 'term-first'
    setStudyMode(next)
    localStorage.setItem('rr_study_mode', next)
    setIsFlipped(false)
  }

  const buildDeck = () => {
    const reviewCards = getNeedsReviewCards(cards)
    // Sort by miss count descending (most missed first)
    const sorted = [...reviewCards].sort((a, b) => getMissCount(b.id) - getMissCount(a.id))
    setDeck(sorted)
    setIndex(0)
    setCleared(0)
    setIsFlipped(false)
    setCardKey(0)
  }

  useEffect(() => { buildDeck() }, [])

  const currentCard = deck[index]

  const goNext = (dir = 1) => {
    setDirection(dir)
    setIsFlipped(false)
    setCardKey(k => k + 1)
  }

  const handleGotIt = () => {
    if (!currentCard) return
    markGotIt(currentCard.id)
    const newDeck = deck.filter((_, i) => i !== index)
    setCleared(c => c + 1)
    if (newDeck.length === 0) {
      setDeck([])
      fireCelebrationConfetti()
    } else {
      const newIndex = Math.min(index, newDeck.length - 1)
      setDeck(newDeck)
      setIndex(newIndex)
      goNext(1)
    }
  }

  const handleStillNeed = () => {
    if (!currentCard) return
    markNeedsReview(currentCard.id)
    // Move to next card (cycle through)
    const nextIndex = (index + 1) % deck.length
    setIndex(nextIndex)
    goNext(1)
  }

  // Empty state
  if (deck.length === 0 && cleared === 0) {
    return (
      <div className="page-content flex-1 flex flex-col items-center justify-center px-4 lg:px-10 pb-28 lg:pb-10 gap-4 text-center max-w-lg mx-auto lg:max-w-2xl">
        <div className="text-5xl">✨</div>
        <h2 className="text-2xl font-black">Review Pile is Empty!</h2>
        <p className="text-white/40 text-sm">No cards marked for review. Study more and tap "Needs Review" on cards you miss.</p>
        <div className="flex gap-3 mt-2">
          <button onClick={() => navigate('/flashcards')} className="glass px-5 py-2.5 rounded-xl font-semibold text-sm">
            Flashcards
          </button>
          <button onClick={() => navigate('/')} className="glass px-5 py-2.5 rounded-xl font-semibold text-sm">
            Home
          </button>
        </div>
      </div>
    )
  }

  // Celebration state
  if (deck.length === 0 && cleared > 0) {
    return (
      <div className="page-content flex-1 flex flex-col items-center justify-center px-4 lg:px-10 pb-28 lg:pb-10 gap-5 text-center max-w-lg mx-auto lg:max-w-2xl">
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-6xl"
        >🎉</motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-3xl font-black mb-2">Cram Session Complete!</h2>
          <p className="text-white/50 text-sm">You cleared all {cleared} review cards</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-5 w-full"
        >
          <div className="text-4xl font-black text-green-400">{cleared}</div>
          <div className="text-white/40 text-sm">cards mastered this session</div>
        </motion.div>
        <div className="flex gap-3 w-full">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={buildDeck}
            className="flex-1 py-3 rounded-xl font-bold text-sm glass"
          >Cram Again</motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/')}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}
          >Back to Home</motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content flex-1 flex flex-col px-4 lg:px-10 pt-6 pb-28 lg:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between py-3 mb-4">
        <button onClick={() => navigate('/')} className="text-white/40 hover:text-white transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className="text-center">
          <div className="text-2xl font-bold">Cram Mode 🔥</div>
          <div className="text-base text-orange-400 font-semibold">{deck.length} cards left</div>
        </div>
        <div className="text-base font-bold text-green-400">{cleared > 0 ? `+${cleared}` : ''}</div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-white/10 mb-5">
        <div className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(cleared / (cleared + deck.length)) * 100}%`,
            background: 'linear-gradient(90deg, #F97316, #10B981)'
          }} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-white/30">Sorted by miss count — most missed first</div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.07)', borderRadius: '999px', padding: '3px', gap: '2px' }}>
          {[['term-first', 'Term→Def'], ['def-first', 'Def→Term']].map(([val, label]) => (
            <button key={val} onClick={toggleStudyMode}
              className="text-xs font-bold transition-all duration-150"
              style={studyMode === val
                ? { background: 'rgba(255,255,255,0.18)', color: 'white', borderRadius: '999px', padding: '5px 12px' }
                : { color: 'rgba(255,255,255,0.35)', borderRadius: '999px', padding: '5px 12px' }
              }
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Flip Card */}
      <div className="flex-1 flex flex-col">
        <div className="w-full card-3d-container flex-1 min-h-[280px]">
          <AnimatePresence mode="wait">
            {currentCard && (
              <motion.div
                key={cardKey}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                <div
                  className="card-3d w-full h-full cursor-pointer"
                  style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                  onClick={() => setIsFlipped(f => !f)}
                >
                  {/* Front */}
                  <div className="card-face glass flex flex-col items-center justify-center p-6 text-center"
                    style={{ background: `linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(255,255,255,0.03) 100%)` }}>
                    <div className="flex items-center gap-2 mb-3">
                      <CategoryBadge cat={currentCard.cat} />
                      {getMissCount(currentCard.id) > 0 && (
                        <span className="text-xs text-red-400 font-bold">×{getMissCount(currentCard.id)} missed</span>
                      )}
                    </div>
                    {studyMode === 'term-first' ? (
                      <>
                        <h2 className={`font-black text-white leading-tight ${
                          currentCard.term.length <= 12 ? 'text-5xl' :
                          currentCard.term.length <= 22 ? 'text-4xl' :
                          currentCard.term.length <= 35 ? 'text-3xl' :
                          'text-2xl'
                        }`}>{currentCard.term}</h2>
                        <p className="text-white/25 text-sm mt-4">Tap to reveal</p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg leading-snug text-white/90 px-2">{currentCard.bullets[0]}</p>
                        <p className="text-white/25 text-sm mt-4">What term is this?</p>
                      </>
                    )}
                  </div>

                  {/* Back */}
                  <div className="card-face card-face-back glass flex flex-col justify-center p-8"
                    style={{ background: `linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(255,255,255,0.03) 100%)` }}>
                    <div className="flex items-center gap-2 mb-4">
                      <CategoryBadge cat={currentCard.cat} />
                    </div>
                    {studyMode === 'term-first' ? (
                      <>
                        <h3 className="text-2xl font-bold text-white/70 mb-5">{currentCard.term}</h3>
                        <ul className="flex flex-col gap-4 w-full pl-12">
                          {currentCard.bullets.map((bullet, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="mt-[6px] w-2 h-2 rounded-full flex-shrink-0 bg-orange-400" />
                              <span className="text-lg text-white/90" style={{ lineHeight: 1.7 }}>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <>
                        <h2 className={`font-black text-white leading-tight mb-5 ${
                          currentCard.term.length <= 12 ? 'text-5xl' :
                          currentCard.term.length <= 22 ? 'text-4xl' :
                          currentCard.term.length <= 35 ? 'text-3xl' :
                          'text-2xl'
                        }`}>{currentCard.term}</h2>
                        <ul className="flex flex-col gap-4 w-full pl-12">
                          {currentCard.bullets.map((bullet, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="mt-[6px] w-2 h-2 rounded-full flex-shrink-0 bg-orange-400" />
                              <span className="text-lg text-white/90" style={{ lineHeight: 1.7 }}>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-5 flex gap-3">
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={handleStillNeed}
          disabled={!isFlipped}
          className="flex-1 py-6 rounded-2xl font-bold text-lg transition-all duration-150 flex items-center justify-center gap-2"
          style={isFlipped
            ? { background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }
            : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'not-allowed' }
          }
        >
          <span>↻</span> Still Need It
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={handleGotIt}
          disabled={!isFlipped}
          className="flex-1 py-6 rounded-2xl font-bold text-lg transition-all duration-150 flex items-center justify-center gap-2"
          style={isFlipped
            ? { background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }
            : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'not-allowed' }
          }
        >
          <span>✓</span> Got It — Clear!
        </motion.button>
      </div>

      {!isFlipped && (
        <p className="text-center text-white/20 text-xs mt-2">Tap card to flip · Must flip before answering</p>
      )}
    </div>
  )
}
