import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function GameHistory({ onBack, onViewGame }) {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDates, setExpandedDates] = useState({}) // 追蹤哪些日期是展開的

  useEffect(() => {
    loadGames()
  }, [])

  const loadGames = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setGames(data || [])
    } catch (error) {
      console.error('載入失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  // 按日期分組
  const gamesByDate = games.reduce((acc, game) => {
    const date = game.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(game)
    return acc
  }, {})

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === today.toISOString().split('T')[0]) {
      return '今天'
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return '昨天'
    } else {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const toggleDate = (date) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }))
  }

  if (!supabase) {
    return (
      <div className="min-h-screen bg-cream p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onBack}
            className="mb-6 px-4 py-2 text-dark/60 hover:text-dark"
          >
            ← 返回
          </button>
          <div className="text-center py-20">
            <div className="text-5xl mb-4">⚠️</div>
            <div className="text-dark/60">請先設定 Supabase 連線</div>
            <div className="text-sm text-dark/40 mt-2">參考 SUPABASE_SETUP.md</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm p-6">
        <button
          onClick={onBack}
          className="mb-4 px-4 py-2 text-dark/60 hover:text-dark transition-colors"
        >
          ← 返回
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">📅</span>
          <div>
            <h1 className="text-2xl font-serif font-bold text-dark">比賽歷史</h1>
            <p className="text-sm text-dark/50">所有比賽記錄</p>
          </div>
        </div>
      </div>

      <div className="px-6 pt-6">
        {loading ? (
          <div className="text-center py-20 text-dark/40">載入中...</div>
        ) : games.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏀</div>
            <div className="text-dark/60">尚無比賽記錄</div>
            <div className="text-sm text-dark/40 mt-2">開始你的第一場比賽吧！</div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(gamesByDate).map(([date, dateGames]) => {
              const isExpanded = expandedDates[date]
              
              return (
                <div key={date} className="card overflow-hidden">
                  {/* 日期標題（可點擊展開/收合） */}
                  <button
                    onClick={() => toggleDate(date)}
                    className="w-full p-5 text-left hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-serif font-bold text-dark mb-1">
                          {formatDate(date)}
                        </div>
                        <div className="text-xs text-dark/40">
                          {dateGames.length} 場比賽
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-dark/60">
                          {dateGames.filter(g => g.team_a_score > g.team_b_score).length} 勝
                        </div>
                        <div className="text-2xl text-dark/40">
                          {isExpanded ? '▼' : '▶'}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* 展開的比賽列表 */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-cream/30">
                      <div className="p-3 space-y-3">
                        {dateGames.map((game) => (
                          <button
                            key={game.id}
                            onClick={() => onViewGame(game.id)}
                            className="card p-4 w-full text-left hover:shadow-md hover:scale-[1.01] transition-all duration-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs text-dark/40">
                                {formatTime(game.created_at)}
                              </div>
                              <div className={`text-xs px-2 py-1 rounded ${
                                game.team_a_score > game.team_b_score
                                  ? 'bg-accent/10 text-accent'
                                  : game.team_a_score < game.team_b_score
                                  ? 'bg-dark/10 text-dark'
                                  : 'bg-gray-100 text-dark/60'
                              }`}>
                                {game.team_a_score > game.team_b_score
                                  ? game.team_a_name + ' 勝'
                                  : game.team_a_score < game.team_b_score
                                  ? game.team_b_name + ' 勝'
                                  : '平手'}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-xs text-dark/60">{game.team_a_name}</div>
                                <div className="text-2xl font-serif font-bold text-accent">
                                  {game.team_a_score}
                                </div>
                              </div>
                              <div className="text-dark/20 text-lg font-serif px-3">:</div>
                              <div className="flex-1 text-right">
                                <div className="text-xs text-dark/60">{game.team_b_name}</div>
                                <div className="text-2xl font-serif font-bold text-dark">
                                  {game.team_b_score}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
