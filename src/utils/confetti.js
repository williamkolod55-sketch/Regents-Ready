import confetti from 'canvas-confetti'

export function fireConfetti(opts = {}) {
  confetti({
    particleCount: opts.particleCount || 120,
    spread: opts.spread || 80,
    origin: opts.origin || { y: 0.6 },
    colors: opts.colors || ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899'],
    ...opts
  })
}

export function fireStreakConfetti() {
  fireConfetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } })
}

export function fireCelebrationConfetti() {
  const end = Date.now() + 2500
  const frame = () => {
    confetti({ particleCount: 5, angle: 60,  spread: 55, origin: { x: 0 }, colors: ['#F59E0B', '#EF4444', '#8B5CF6'] })
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#3B82F6', '#10B981', '#EC4899'] })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}
