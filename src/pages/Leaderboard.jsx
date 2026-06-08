import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const TABS = [
  { key: 'quiz',      label: 'Quiz Mode' },
  { key: 'lightning', label: 'Lightning' },
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
    <div className="page-content min-h-screen flex flex-col px-4 lg:px-10 pt-8 pb-28 lg:pb-10 max-w-lg mx-auto lg:max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/')} className="text-white/40 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 className="text-xl font-black">🏆 Leaderboard</h1>
        <button onClick={fetchScores} className="text-white/40 hover:text-white transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-150"
            style={activeTab === key
              ? { background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >{label}</button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-white/20 border-t-amber-400 rounded-full"
          />
        </div>
      )}

      {error && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
          <div className="text-3xl">📡</div>
          <div className="text-white/40 text-sm">{error}</div>
          <button onClick={fetchScores} className="glass px-4 py-2 rounded-xl text-sm font-semibold">Retry</button>
        </div>
      )}

      {!loading && !error && scores.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
          <div className="text-3xl">🏅</div>
          <div className="text-white/40 text-sm">No scores yet — be the first!</div>
          <button onClick={() => navigate('/quiz')} className="glass px-4 py-2 rounded-xl text-sm font-semibold">
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
            className="space-y-2"
          >
            {/* Column headers */}
            <div className="flex items-center gap-2 px-3 py-1 text-[10px] font-bold text-white/30 uppercase tracking-widest">
              <span className="w-8 text-center">#</span>
              <span className="flex-1">Name</span>
              <span className="w-12 text-center">Score</span>
              <span className="w-14 text-center">Acc.</span>
              <span className="w-12 text-center">Date</span>
            </div>

            {scores.map((row, i) => {
              const isTop3 = i < 3
              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass rounded-xl p-3 flex items-center gap-2"
                  style={isTop3 ? { borderColor: RANK_COLORS[i] + '33' } : {}}
                >
                  <div className="w-8 text-center text-sm font-black"
                    style={{ color: isTop3 ? RANK_COLORS[i] : 'rgba(255,255,255,0.3)' }}>
                    {isTop3 ? RANK_LABELS[i] : `#${i + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{row.username}</div>
                    <div className="text-[10px] text-white/30 capitalize">{row.mode} · {row.category}</div>
                  </div>
                  <div className="w-12 text-center">
                    <div className="text-sm font-bold">{row.score}/{row.total}</div>
                  </div>
                  <div className="w-14 text-center">
                    <div className="text-sm font-bold"
                      style={{ color: row.accuracy >= 80 ? '#10B981' : row.accuracy >= 60 ? '#F59E0B' : '#EF4444' }}>
                      {formatAccuracy(row.accuracy)}
                    </div>
                  </div>
                  <div className="w-12 text-center text-[10px] text-white/30">
                    {formatDate(row.created_at)}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
