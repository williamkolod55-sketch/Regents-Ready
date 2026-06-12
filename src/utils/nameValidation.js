const PROFANITY = [
  'ass', 'asshole', 'bitch', 'cock', 'cunt', 'dick', 'fag', 'faggot',
  'fuck', 'nigga', 'nigger', 'piss', 'pussy', 'retard', 'shit', 'slut', 'whore'
]

const FORMAT_MSG = 'Use "First Last" format — e.g. "John S." or "Jane Doe"'

export function validateName(name) {
  const trimmed = name.trim()
  if (trimmed.length < 2 || trimmed.length > 40) return { valid: false, error: FORMAT_MSG }
  if (!/^[a-zA-Z'\-. ]+$/.test(trimmed)) return { valid: false, error: FORMAT_MSG }
  if (!trimmed.includes(' ')) return { valid: false, error: FORMAT_MSG }
  const lower = trimmed.toLowerCase()
  for (const word of PROFANITY) {
    if (lower.split(/\s+/).some(w => w === word || w.startsWith(word + "'") || w.startsWith(word + '-'))) {
      return { valid: false, error: 'Inappropriate name' }
    }
  }
  return { valid: true, error: null }
}

export function formatName(name) {
  return name.trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
