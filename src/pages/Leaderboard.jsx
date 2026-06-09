import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const TABS = [
  { key: 'quiz',      label: 'Quiz Mode' },
  { key: 'all',       label: 'All Time'  },
]

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatAccuracy(acc) {
  return Number(acc).toFixed(1) + '%'
}

const RANK_COLORS = ['#F59E0B', '#94A3B8', '#B45309']
const RANK_LABELS = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('quiz')
  const [scores,    setScores]    = useState([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  const fetchScores = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const mode = activeTab === 'all' ? '' : activeTab
      const url  = `/api/leaderboard${mode ? `?mode=${mode}` : ''}`
      const res  = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch')
      setScores(await res.json())
    } catch (err) {
      setError('Could not load leaderboard. Is the server running?')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchScores()
    const interval = setInterval(fetchScores, 30000)
    return () => clearInterval(interval)
  }, [fetchScores])

  return (
    <div className="page-content flex-1 flex flex-col px-6 lg:px-12 pt-6 lg:pt-8 pb-24 lg:pb-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <button onClick={() => navigate('/')} className="text-white/40 hover:text-white transition-colors p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 className="text-2xl lg:text-3xl font-black">🏆 Leaderboard</h1>
        <button onClick={fetchScores} className="text-white/40 hover:text-white transition-colors p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6 lg:mb-8">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-150"
            style={activeTab === key
              ? { background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >{label}</button>
        ))}
      </div>

      {/* Content — flex-1 so it fills remaining height */}
      <div className="flex-1 flex flex-col min-h-0">

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-2 border-white/20 border-t-amber-400 rounded-full"
            />
          </div>
        )}

        {error && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="text-5xl">📡</div>
            <div className="text-white/40 text-base">{error}</div>
            <button onClick={fetchScores} className="glass px-5 py-2.5 rounded-xl text-sm font-semibold">Retry</button>
          </div>
        )}

        {!loading && !error && scores.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="text-5xl">🏅</div>
            <div className="text-white/40 text-base">No scores yet — be the first!</div>
            <button onClick={() => navigate('/quiz')} className="glass px-5 py-2.5 rounded-xl text-sm font-semibold">
              Take a Quiz
            </button>
          </div>
        )}

        {!loading && !error && scores.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-3"
            >
              {/* Column headers */}
              <div className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-white/30 uppercase tracking-widest">
                <span className="w-10 text-center">#</span>
                <span className="flex-1">Name</span>
                <span className="w-20 text-center hidden sm:block">Mode</span>
                <span className="w-16 text-center">Score</span>
                <span className="w-16 text-center">Acc.</span>
                <span className="w-14 text-center">Date</span>
              </div>

              {scores.map((row, i) => {
                const isTop3 = i < 3
                return (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass rounded-2xl px-4 py-4 lg:py-5 flex items-center gap-3"
                    style={isTop3 ? { borderColor: RANK_COLORS[i] + '44' } : {}}
                  >
                    <div className="w-10 text-center text-base font-black"
                      style={{ color: isTop3 ? RANK_COLORS[i] : 'rgba(255,255,255,0.3)' }}>
                      {isTop3 ? RANK_LABELS[i] : `#${i + 1}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base lg:text-lg truncate">{row.username}</div>
                      <div className="text-xs text-white/30 capitalize mt-0.5 sm:hidden">{row.mode} · {row.category}</div>
                    </div>
                    <div className="w-20 text-center hidden sm:block">
                      <div className="text-sm text-white/50 capitalize">{row.mode}</div>
                      <div className="text-xs text-white/30 truncate">{row.category}</div>
                    </div>
                    <div className="w-16 text-center">
                      <div className="text-base font-bold">{row.score}/{row.total}</div>
                    </div>
                    <div className="w-16 text-center">
                      <div className="text-base font-bold"
                        style={{ color: row.accuracy >= 80 ? '#10B981' : row.accuracy >= 60 ? '#F59E0B' : '#EF4444' }}>
                        {formatAccuracy(row.accuracy)}
                      </div>
                    </div>
                    <div className="w-14 text-center text-xs text-white/35">
                      {formatDate(row.created_at)}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        )}

      </div>
    </div>
  )
}
