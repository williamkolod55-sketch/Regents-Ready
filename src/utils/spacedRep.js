export function calculateSM2(quality, currentData) {
  // quality: 5=perfect, 4=correct hesitation, 3=correct difficulty, 2=incorrect easy, 1=incorrect, 0=blackout
  // quality >= 3 = pass, < 3 = fail
  let { repetitions = 0, interval = 1, easeFactor = 2.5 } = currentData || {}

  if (quality >= 3) {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)
    repetitions += 1
  } else {
    repetitions = 0
    interval = 1
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (easeFactor < 1.3) easeFactor = 1.3

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  return { repetitions, interval, easeFactor, nextReview: nextReview.toISOString() }
}

export function isDueToday(cardData) {
  if (!cardData?.nextReview) return true
  return new Date(cardData.nextReview) <= new Date()
}

export function isMastered(cardData) {
  return cardData?.repetitions >= 3 && cardData?.interval >= 7
}
