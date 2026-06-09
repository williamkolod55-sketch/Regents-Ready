import { calculateSM2, isDueToday, isMastered } from './spacedRep.js'

const SR_KEY       = 'regents_sr_data'
const STREAK_KEY   = 'regents_streak'

function getSRData() {
  try { return JSON.parse(localStorage.getItem(SR_KEY) || '{}') } catch { return {} }
}

function setSRData(data) {
  localStorage.setItem(SR_KEY, JSON.stringify(data))
}

export function getCardData(cardId) {
  const data = getSRData()
  return data[cardId] || {
    interval: 1, repetitions: 0, easeFactor: 2.5,
    nextReview: new Date().toISOString(),
    missCount: 0, needsReview: false, mastered: false
  }
}

export function markGotIt(cardId) {
  touchStreak()
  const data  = getSRData()
  const cur   = getCardData(cardId)
  const sm2   = calculateSM2(4, cur)
  data[cardId] = {
    ...cur, ...sm2,
    needsReview: false,
    mastered: isMastered(sm2)
  }
  setSRData(data)
}

export function markNeedsReview(cardId) {
  touchStreak()
  const data  = getSRData()
  const cur   = getCardData(cardId)
  const sm2   = calculateSM2(1, cur)
  data[cardId] = {
    ...cur, ...sm2,
    needsReview: true,
    mastered: false,
    missCount: (cur.missCount || 0) + 1
  }
  setSRData(data)
}

export function clearNeedsReview(cardId) {
  const data = getSRData()
  if (data[cardId]) {
    data[cardId].needsReview = false
    setSRData(data)
  }
}

export function getDueCards(allCards) {
  const data = getSRData()
  return allCards.filter(c => isDueToday(data[c.id]))
}

export function getNeedsReviewCards(allCards) {
  const data = getSRData()
  return allCards.filter(c => data[c.id]?.needsReview === true)
}

export function getMostMissedCards(allCards, limit = 10) {
  const data = getSRData()
  return [...allCards]
    .filter(c => (data[c.id]?.missCount || 0) > 0)
    .sort((a, b) => (data[b.id]?.missCount || 0) - (data[a.id]?.missCount || 0))
    .slice(0, limit)
}

export function getCategoryProgress(allCards) {
  const data = getSRData()
  const progress = {}
  const cats = [...new Set(allCards.map(c => c.cat))]
  cats.forEach(cat => {
    const catCards = allCards.filter(c => c.cat === cat)
    const mastered = catCards.filter(c => isMastered(data[c.id])).length
    progress[cat] = { mastered, total: catCards.length }
  })
  return progress
}

export function getReadinessScore(allCards) {
  const data = getSRData()
  const mastered = allCards.filter(c => isMastered(data[c.id])).length
  return Math.round((mastered / allCards.length) * 100)
}

export function getDueCount(allCards) {
  return getDueCards(allCards).length
}

export function getMissCount(cardId) {
  return getCardData(cardId).missCount || 0
}

// ── Streak ──────────────────────────────────────────────────────────────────

export function getStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    return raw ? JSON.parse(raw) : { count: 0, lastDate: null }
  } catch { return { count: 0, lastDate: null } }
}

export function touchStreak() {
  const streak  = getStreak()
  const today   = new Date().toDateString()
  if (streak.lastDate === today) return streak.count

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const newCount = streak.lastDate === yesterday.toDateString()
    ? streak.count + 1 : 1

  const newStreak = { count: newCount, lastDate: today }
  localStorage.setItem(STREAK_KEY, JSON.stringify(newStreak))
  return newCount
}
