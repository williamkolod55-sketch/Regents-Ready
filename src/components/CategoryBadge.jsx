import { CATEGORY_COLORS, CATEGORY_NAMES } from '../data/cards.js'

export default function CategoryBadge({ cat, small = false }) {
  const color = CATEGORY_COLORS[cat] || '#6B7280'
  const name  = CATEGORY_NAMES[cat]  || cat

  return (
    <span
      className={`inline-block font-bold rounded-full tracking-wide uppercase ${
        small ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'
      }`}
      style={{ background: color + '22', color, border: `1px solid ${color}44` }}
    >
      {name}
    </span>
  )
}
