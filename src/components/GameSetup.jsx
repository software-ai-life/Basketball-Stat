import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function GameSetup({ onStartGame, onViewHistory, onViewAnalytics, gameDate, onGameDateChange }) {
  const [teamAName, setTeamAName] = useState('主隊')
  const [teamBName, setTeamBName] = useState('客隊')
  const [teamAPlayers, setTeamAPlayers] = useState([''])
  const [loading, setLoading] = useState(true)

  // 從資料庫載入上次比賽的球員名單
  useEffect(() => {
    loadLastGamePlayers()
  }, [])

  const loadLastGamePlayers = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      // 查詢最近一場比賽
      const { data: lastGame, error: gameError } = await supabase
        .from('games')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (gameError || !lastGame) {
        setLoading(false)
        return
      }

      // 查詢該場比賽的球員名單
      const { data: playerStats, error: statsError } = await supabase
        .from('player_stats')
        .select('player_name')
        .eq('game_id', lastGame.id)
        .order('player_name')

      if (statsError) throw statsError

      if (playerStats && playerStats.length > 0) {
        const playerNames = playerStats.map(stat => stat.player_name)
        setTeamAPlayers(playerNames)
      }
    } catch (error) {
      console.error('載入球員名單失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const addPlayer = () => {
    setTeamAPlayers([...teamAPlayers, ''])
  }

  const updatePlayer = (index, name) => {
    const updated = [...teamAPlayers]
    updated[index] = name
    setTeamAPlayers(updated)
  }

  const removePlayer = (index) => {
    setTeamAPlayers(teamAPlayers.filter((_, i) => i !== index))
  }

  const handleStart = () => {
    const validTeamA = teamAPlayers.filter(name => name.trim())

    if (validTeamA.length === 0) {
      alert('主隊至少需要一位球員')
      return
    }

    const gameData = {
      teamA: {
        name: teamAName,
        color: 'team-a',
        players: validTeamA.map((name, i) => ({ 
          id: `teamA-${i}`, 
          name: name.trim() 
        }))
      },
      teamB: {
        name: teamBName,
        color: 'team-b',
        players: []
      }
    }

    onStartGame(gameData)
  }

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 mt-8">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 mb-4">
            <span className="text-accent text-lg">★</span>
            <span className="text-xs text-dark/60 uppercase tracking-wider">籃球計分系統</span>
          </div>
          <h1 className="text-5xl font-serif font-bold mb-4 text-dark">🏀 Basketball Scoreboard</h1>
          <h2 className="text-4xl font-serif text-accent mb-4">籃球計分</h2>
          <p className="text-dark/60 text-sm max-w-md mx-auto">
            專為比賽設計的計分系統，讓您專注於球賽本身
          </p>
          
          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6 justify-center">
            <button
              onClick={onViewHistory}
              className="px-6 py-2 bg-white border-2 border-gray-200 hover:border-accent text-dark hover:text-accent rounded-lg transition-all text-sm uppercase tracking-wider"
            >
              📅 歷史記錄
            </button>
            <button
              onClick={onViewAnalytics}
              className="px-6 py-2 bg-white border-2 border-gray-200 hover:border-accent text-dark hover:text-accent rounded-lg transition-all text-sm uppercase tracking-wider"
            >
              📊 個人統計
            </button>
          </div>
        </div>

        {/* Teams Setup */}
        <div className="space-y-8">
          {/* 比賽日期選擇 */}
          <div className="card p-8">
            <label className="block text-sm text-dark/60 mb-3 uppercase tracking-wider">比賽日期</label>
            <input
              type="date"
              value={gameDate}
              onChange={(e) => onGameDateChange(e.target.value)}
              className="w-full bg-cream/50 border-b-2 border-gray-300 focus:border-accent px-2 py-3 text-dark text-lg focus:outline-none transition-colors"
            />
            <p className="text-xs text-dark/40 mt-2">可選擇過去或未來的日期記錄比賽</p>
          </div>

          {/* Team A */}
          <div className="card p-8">
            <div className="mb-6">
              <label className="block text-sm text-dark/60 mb-3 uppercase tracking-wider">主隊名稱</label>
              <input
                type="text"
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                className="w-full bg-cream/50 border-b-2 border-gray-300 focus:border-accent px-2 py-3 text-dark text-lg focus:outline-none transition-colors"
                placeholder="輸入主隊名稱"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-dark/60 mb-3 uppercase tracking-wider">球員名單</label>
            </div>

            <div className="space-y-3 mb-6">
              {teamAPlayers.map((player, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={player}
                    onChange={(e) => updatePlayer(index, e.target.value)}
                    className="flex-1 bg-cream/50 border border-gray-300 focus:border-accent rounded-lg px-4 py-3 text-dark placeholder-dark/30 focus:outline-none transition-colors"
                    placeholder={`球員 ${index + 1}`}
                  />
                  {teamAPlayers.length > 1 && (
                    <button
                      onClick={() => removePlayer(index)}
                      className="px-4 py-3 bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 text-dark/50 hover:text-red-500 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addPlayer}
              className="w-full py-3 btn-secondary text-sm uppercase tracking-wider"
            >
              + 新增球員
            </button>
          </div>

          {/* Team B */}
          <div className="card p-8 bg-gradient-to-br from-white to-gray-50">
            <div className="mb-4">
              <label className="block text-sm text-dark/60 mb-3 uppercase tracking-wider">客隊名稱</label>
              <input
                type="text"
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                className="w-full bg-cream/50 border-b-2 border-gray-300 focus:border-dark px-2 py-3 text-dark text-lg focus:outline-none transition-colors"
                placeholder="輸入客隊名稱"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-dark/50 mt-4 bg-accent/5 px-4 py-3 rounded-lg border border-accent/20">
              <span className="text-accent">💡</span>
              <span>客隊只記錄總分，不記錄個別球員數據</span>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full mt-10 py-5 btn-primary text-base uppercase tracking-wider shadow-lg hover:shadow-xl"
        >
          開始比賽
        </button>
      </div>
    </div>
  )
}
