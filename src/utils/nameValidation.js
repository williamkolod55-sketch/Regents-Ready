const PROFANITY = [
  'ass', 'asshole', 'bitch', 'cock', 'cunt', 'dick', 'fag', 'faggot',
  'fuck', 'nigga', 'nigger', 'piss', 'pussy', 'retard', 'shit', 'slut', 'whore'
]

export function validateName(name) {
  const trimmed = name.trim()
  if (!trimmed) return { valid: false, error: 'Name required' }
  const parts = trimmed.split(/\s+/)
  if (parts.length < 2) return { valid: false, error: 'Enter first and last name' }
  if (!/^[a-zA-Z'\- ]+$/.test(trimmed)) return { valid: false, error: 'Letters only' }
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
