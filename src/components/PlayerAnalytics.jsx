import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PlayerAnalytics({ onBack }) {
  const [playerStats, setPlayerStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupMode, setGroupMode] = useState('player')

  useEffect(() => {
    loadPlayerStats()
  }, [groupMode])

  const loadPlayerStats = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')

      if (error) throw error

      const aggregated = {}

      data.forEach(stat => {
        const playerKey = groupMode === 'team-player'
          ? `${stat.team}__${stat.player_name}`
          : stat.player_name

        if (!aggregated[playerKey]) {
          aggregated[playerKey] = {
            playerName: stat.player_name,
            teamName: stat.team,
            teams: new Set(),
            games: 0,
            totalPoints: 0,
            twoPointMade: 0,
            twoPointAttempted: 0,
            threePointMade: 0,
            threePointAttempted: 0,
            steals: 0,
            offensiveRebounds: 0,
            defensiveRebounds: 0,
            assists: 0,
            blocks: 0,
            turnovers: 0
          }
        }

        const player = aggregated[playerKey]
        player.teamName = stat.team
        player.teams.add(stat.team)
        player.games++
        player.twoPointMade += stat.two_point_made || 0
        player.twoPointAttempted += stat.two_point_attempted || 0
        player.threePointMade += stat.three_point_made || 0
        player.threePointAttempted += stat.three_point_attempted || 0
        player.totalPoints += (stat.two_point_made || 0) * 2 + (stat.three_point_made || 0) * 3
        player.steals += stat.steals || 0
        player.offensiveRebounds += stat.offensive_rebounds || 0
        player.defensiveRebounds += stat.defensive_rebounds || 0
        player.assists += stat.assists || 0
        player.blocks += stat.blocks || 0
        player.turnovers += stat.turnovers || 0
      })

      const statsArray = Object.values(aggregated)
        .map(player => ({
          ...player,
          teams: Array.from(player.teams)
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints)
      setPlayerStats(statsArray)
    } catch (error) {
      console.error('載入失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePercentage = (made, attempted) => {
    return attempted > 0 ? Math.round((made / attempted) * 100) : 0
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
          <span className="text-3xl">📊</span>
          <div>
            <h1 className="text-2xl font-serif font-bold text-dark">個人統計</h1>
            <p className="text-sm text-dark/50">累積表現數據</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            onClick={() => setGroupMode('player')}
            className={`py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
              groupMode === 'player'
                ? 'bg-accent text-white border-accent'
                : 'bg-white text-dark/60 border-gray-200 hover:border-accent/40'
            }`}
          >
            依球員姓名彙總
          </button>
          <button
            onClick={() => setGroupMode('team-player')}
            className={`py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
              groupMode === 'team-player'
                ? 'bg-dark text-white border-dark'
                : 'bg-white text-dark/60 border-gray-200 hover:border-dark/40'
            }`}
          >
            依球隊 + 球員姓名彙總
          </button>
        </div>

        <p className="text-xs text-dark/40 mt-3">
          {groupMode === 'player'
            ? '同一位朋友不論打主隊或客隊，都會合併成同一筆統計。'
            : '同名球員會依所在球隊拆開，方便分開比較不同角色表現。'}
        </p>
      </div>

      <div className="px-6 pt-6">
        {loading ? (
          <div className="text-center py-20 text-dark/40">載入中...</div>
        ) : playerStats.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📈</div>
            <div className="text-dark/60">尚無球員數據</div>
            <div className="text-sm text-dark/40 mt-2">完成比賽後即可查看統計</div>
          </div>
        ) : (
          <div className="space-y-4">
            {playerStats.map((player, index) => {
              const fgPercentage = calculatePercentage(
                player.twoPointMade + player.threePointMade,
                player.twoPointAttempted + player.threePointAttempted
              )
              const twoP = calculatePercentage(player.twoPointMade, player.twoPointAttempted)
              const threeP = calculatePercentage(player.threePointMade, player.threePointAttempted)
              const avgPoints = player.games > 0 ? (player.totalPoints / player.games).toFixed(1) : 0

              return (
                <div key={`${groupMode}-${player.teams.join('-')}-${player.playerName}`} className="card p-6">
                  {/* 排名徽章 */}
                  {index < 3 && (
                    <div className="inline-flex items-center gap-2 mb-3">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    </div>
                  )}

                  {/* 球員名稱與總分 */}
                  <div className="flex items-end justify-between mb-4 pb-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-xl font-bold text-dark mb-1">{player.playerName}</h3>
                      <div className="text-sm text-dark/50">
                        {groupMode === 'team-player'
                          ? `${player.teamName} · ${player.games} 場比賽 · 平均 ${avgPoints} 分`
                          : `${player.teams.join(' / ')} · ${player.games} 場比賽 · 平均 ${avgPoints} 分`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-serif font-bold text-accent">
                        {player.totalPoints}
                      </div>
                      <div className="text-xs text-dark/40">總得分</div>
                    </div>
                  </div>

                  {/* 投籃統計 */}
                  <div className="mb-4">
                    <div className="text-xs text-dark/40 mb-2 uppercase tracking-wider">投籃表現</div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-cream/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-dark/50 mb-1">總命中率</div>
                        <div className="text-2xl font-bold text-accent">{fgPercentage}%</div>
                        <div className="text-xs text-dark/40 mt-1">
                          {player.twoPointMade + player.threePointMade}/
                          {player.twoPointAttempted + player.threePointAttempted}
                        </div>
                      </div>
                      <div className="bg-cream/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-dark/50 mb-1">2分球</div>
                        <div className="text-2xl font-bold text-dark">{twoP}%</div>
                        <div className="text-xs text-dark/40 mt-1">
                          {player.twoPointMade}/{player.twoPointAttempted}
                        </div>
                      </div>
                      <div className="bg-cream/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-dark/50 mb-1">3分球</div>
                        <div className="text-2xl font-bold text-dark">{threeP}%</div>
                        <div className="text-xs text-dark/40 mt-1">
                          {player.threePointMade}/{player.threePointAttempted}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 其他數據 */}
                  <div>
                    <div className="text-xs text-dark/40 mb-2 uppercase tracking-wider">綜合數據</div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div>
                        <div className="text-dark/50 mb-1">籃板</div>
                        <div className="text-base font-bold text-dark">
                          {player.offensiveRebounds + player.defensiveRebounds}
                        </div>
                        <div className="text-dark/30">
                          {player.offensiveRebounds}/{player.defensiveRebounds}
                        </div>
                      </div>
                      <div>
                        <div className="text-dark/50 mb-1">助攻</div>
                        <div className="text-base font-bold text-dark">{player.assists}</div>
                      </div>
                      <div>
                        <div className="text-dark/50 mb-1">抄截</div>
                        <div className="text-base font-bold text-dark">{player.steals}</div>
                      </div>
                      <div>
                        <div className="text-dark/50 mb-1">阻攻</div>
                        <div className="text-base font-bold text-dark">{player.blocks}</div>
                      </div>
                    </div>
                  </div>

                  {/* 失誤 */}
                  {player.turnovers > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-dark/40">
                        失誤: {player.turnovers} 
                        <span className="ml-2">
                          (平均 {(player.turnovers / player.games).toFixed(1)}/場)
                        </span>
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
