import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function GameDetail({ gameId, onBack }) {
  const [game, setGame] = useState(null)
  const [playerStats, setPlayerStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGameDetail()
  }, [gameId])

  const loadGameDetail = async () => {
    try {
      setLoading(true)
      
      // 載入比賽資訊
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single()
      
      if (gameError) throw gameError
      setGame(gameData)
      
      // 載入球員數據
      const { data: statsData, error: statsError } = await supabase
        .from('player_stats')
        .select('*')
        .eq('game_id', gameId)
        .order('total_points', { ascending: false })
      
      if (statsError) throw statsError
      setPlayerStats(statsData || [])
      
    } catch (error) {
      console.error('載入比賽詳情錯誤:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePercentage = (made, attempted) => {
    if (attempted === 0) return '0'
    return ((made / attempted) * 100).toFixed(1)
  }

  const calculateTeamStats = () => {
    if (playerStats.length === 0) return null
    
    const totals = playerStats.reduce((acc, player) => ({
      twoPointMade: acc.twoPointMade + (player.two_point_made || 0),
      twoPointAttempted: acc.twoPointAttempted + (player.two_point_attempted || 0),
      threePointMade: acc.threePointMade + (player.three_point_made || 0),
      threePointAttempted: acc.threePointAttempted + (player.three_point_attempted || 0),
      assists: acc.assists + (player.assists || 0),
      steals: acc.steals + (player.steals || 0),
      blocks: acc.blocks + (player.blocks || 0),
      offensiveRebounds: acc.offensiveRebounds + (player.offensive_rebounds || 0),
      defensiveRebounds: acc.defensiveRebounds + (player.defensive_rebounds || 0),
      turnovers: acc.turnovers + (player.turnovers || 0),
      fouls: acc.fouls + (player.fouls || 0),
    }), {
      twoPointMade: 0,
      twoPointAttempted: 0,
      threePointMade: 0,
      threePointAttempted: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      offensiveRebounds: 0,
      defensiveRebounds: 0,
      turnovers: 0,
      fouls: 0,
    })
    
    const totalFieldGoalMade = totals.twoPointMade + totals.threePointMade
    const totalFieldGoalAttempted = totals.twoPointAttempted + totals.threePointAttempted
    const totalRebounds = totals.offensiveRebounds + totals.defensiveRebounds
    
    return {
      ...totals,
      totalFieldGoalMade,
      totalFieldGoalAttempted,
      totalRebounds,
      fg: calculatePercentage(totalFieldGoalMade, totalFieldGoalAttempted),
      twoP: calculatePercentage(totals.twoPointMade, totals.twoPointAttempted),
      threeP: calculatePercentage(totals.threePointMade, totals.threePointAttempted),
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream p-4 flex items-center justify-center">
        <div className="text-dark/60">載入中...</div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-cream p-4 flex items-center justify-center">
        <div className="text-dark/60">找不到比賽資料</div>
      </div>
    )
  }

  const teamStats = calculateTeamStats()
  const gameDate = new Date(game.created_at)

  return (
    <div className="min-h-screen bg-cream p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* 返回按鈕 */}
        <button
          onClick={onBack}
          className="mb-4 px-4 py-2 text-dark/60 hover:text-dark transition-colors flex items-center gap-2"
        >
          ← 返回
        </button>

        {/* 比賽標題 */}
        <div className="card p-6 mb-6">
          <div className="text-center">
            <div className="text-sm text-dark/40 mb-2">
              {gameDate.toLocaleDateString('zh-TW', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </div>
            <div className="text-3xl font-serif font-bold mb-4">
              {game.team_a_name} vs {game.team_b_name}
            </div>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-sm text-dark/60 mb-1">{game.team_a_name}</div>
                <div className="text-5xl font-serif font-bold text-accent">{game.team_a_score}</div>
              </div>
              <div className="text-2xl text-dark/40">-</div>
              <div className="text-center">
                <div className="text-sm text-dark/60 mb-1">{game.team_b_name}</div>
                <div className="text-5xl font-serif font-bold text-dark/60">{game.team_b_score}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 團隊統計 */}
        {teamStats && (
          <div className="card p-6 mb-6">
            <h3 className="text-xl font-serif font-bold mb-4 text-center">團隊統計</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-sm text-dark/60 mb-1">投籃命中率</div>
                <div className="text-2xl font-serif font-bold text-accent">{teamStats.fg}%</div>
                <div className="text-xs text-dark/40">{teamStats.totalFieldGoalMade}/{teamStats.totalFieldGoalAttempted}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-dark/60 mb-1">兩分球</div>
                <div className="text-2xl font-serif font-bold text-accent">{teamStats.twoP}%</div>
                <div className="text-xs text-dark/40">{teamStats.twoPointMade}/{teamStats.twoPointAttempted}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-dark/60 mb-1">三分球</div>
                <div className="text-2xl font-serif font-bold text-accent">{teamStats.threeP}%</div>
                <div className="text-xs text-dark/40">{teamStats.threePointMade}/{teamStats.threePointAttempted}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-dark/60 mb-1">總籃板</div>
                <div className="text-2xl font-serif font-bold text-dark">{teamStats.totalRebounds}</div>
                <div className="text-xs text-dark/40">進攻 {teamStats.offensiveRebounds} / 防守 {teamStats.defensiveRebounds}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-dark/60 mb-1">助攻</div>
                <div className="text-xl font-serif font-bold text-dark">{teamStats.assists}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-dark/60 mb-1">抄截</div>
                <div className="text-xl font-serif font-bold text-dark">{teamStats.steals}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-dark/60 mb-1">阻攻</div>
                <div className="text-xl font-serif font-bold text-dark">{teamStats.blocks}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-dark/60 mb-1">失誤</div>
                <div className="text-xl font-serif font-bold text-dark">{teamStats.turnovers}</div>
              </div>
            </div>
          </div>
        )}

        {/* 球員數據表格 */}
        <div className="card p-6">
          <h3 className="text-xl font-serif font-bold mb-4 text-center">球員數據</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark/10">
                  <th className="text-left py-3 px-2 text-sm font-medium text-dark/60">球員</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-dark/60">得分</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-dark/60">投籃%</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-dark/60">2P%</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-dark/60">3P%</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-dark/60">籃板</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-dark/60">助攻</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-dark/60">抄截</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-dark/60">阻攻</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-dark/60">失誤</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-dark/60">犯規</th>
                </tr>
              </thead>
              <tbody>
                {playerStats.map((player, index) => {
                  const totalFgMade = (player.two_point_made || 0) + (player.three_point_made || 0)
                  const totalFgAttempted = (player.two_point_attempted || 0) + (player.three_point_attempted || 0)
                  const totalRebounds = (player.offensive_rebounds || 0) + (player.defensive_rebounds || 0)
                  
                  return (
                    <tr key={index} className="border-b border-dark/5 hover:bg-accent/5 transition-colors">
                      <td className="py-3 px-2 font-medium text-dark">{player.player_name}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-lg font-serif font-bold text-accent">{player.total_points}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="font-medium">{calculatePercentage(totalFgMade, totalFgAttempted)}%</div>
                        <div className="text-xs text-dark/40">{totalFgMade}/{totalFgAttempted}</div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="font-medium">{calculatePercentage(player.two_point_made, player.two_point_attempted)}%</div>
                        <div className="text-xs text-dark/40">{player.two_point_made}/{player.two_point_attempted}</div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="font-medium">{calculatePercentage(player.three_point_made, player.three_point_attempted)}%</div>
                        <div className="text-xs text-dark/40">{player.three_point_made}/{player.three_point_attempted}</div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="font-medium">{totalRebounds}</div>
                        <div className="text-xs text-dark/40">{player.offensive_rebounds}/{player.defensive_rebounds}</div>
                      </td>
                      <td className="py-3 px-2 text-center font-medium">{player.assists || 0}</td>
                      <td className="py-3 px-2 text-center font-medium">{player.steals || 0}</td>
                      <td className="py-3 px-2 text-center font-medium">{player.blocks || 0}</td>
                      <td className="py-3 px-2 text-center font-medium">{player.turnovers || 0}</td>
                      <td className="py-3 px-2 text-center font-medium">{player.fouls || 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
