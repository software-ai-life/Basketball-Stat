import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function GameDetail({ gameId, onBack }) {
  const [game, setGame] = useState(null)
  const [playerStats, setPlayerStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedStats, setEditedStats] = useState([])
  const [editedTeamBScore, setEditedTeamBScore] = useState(0)

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
      setEditedTeamBScore(gameData.team_b_score || 0) // 初始化客隊分數
      
      // 載入球員數據
      const { data: statsData, error: statsError } = await supabase
        .from('player_stats')
        .select('*')
        .eq('game_id', gameId)
        .order('total_points', { ascending: false })
      
      if (statsError) throw statsError
      setPlayerStats(statsData || [])
      setEditedStats(statsData || []) // 初始化編輯數據
      
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

  const handleEditChange = (index, field, value) => {
    const newStats = [...editedStats]
    const numValue = parseInt(value) || 0
    newStats[index] = {
      ...newStats[index],
      [field]: numValue
    }
    
    // 自動計算 total_points
    if (field === 'two_point_made' || field === 'three_point_made') {
      const twoPoints = field === 'two_point_made' ? numValue : newStats[index].two_point_made
      const threePoints = field === 'three_point_made' ? numValue : newStats[index].three_point_made
      newStats[index].total_points = (twoPoints * 2) + (threePoints * 3)
    }
    
    setEditedStats(newStats)
  }

  const handleStartEdit = () => {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD
    
    if (!adminPassword) {
      alert('⚠️ 未設定管理員密碼，無法使用編輯功能。\n請在 .env 中設定 VITE_ADMIN_PASSWORD')
      return
    }
    
    const inputPassword = prompt('🔒 請輸入管理員密碼以進入編輯模式：')
    
    if (!inputPassword) return
    
    if (inputPassword !== adminPassword) {
      alert('❌ 密碼錯誤，無法編輯')
      return
    }
    
    setIsEditing(true)
  }

  const handleSaveChanges = async () => {
    try {
      // 更新每個球員的數據 (使用 upsert 確保寫入)
      for (const stat of editedStats) {
        const { error } = await supabase
          .from('player_stats')
          .upsert({
            id: stat.id,
            game_id: gameId,
            player_name: stat.player_name,
            team: stat.team,
            two_point_made: stat.two_point_made,
            two_point_attempted: stat.two_point_attempted,
            three_point_made: stat.three_point_made,
            three_point_attempted: stat.three_point_attempted,
            total_points: stat.total_points,
            steals: stat.steals,
            offensive_rebounds: stat.offensive_rebounds,
            defensive_rebounds: stat.defensive_rebounds,
            assists: stat.assists,
            blocks: stat.blocks,
            turnovers: stat.turnovers,
            fouls: stat.fouls
          })
        
        if (error) throw error
      }
      
      // 重新計算總分
      const teamAScore = editedStats.reduce((sum, stat) => sum + stat.total_points, 0)
      
      // 更新比賽分數 (使用 upsert)
      const { error: gameError } = await supabase
        .from('games')
        .upsert({
          id: gameId,
          date: game.date,
          team_a_name: game.team_a_name,
          team_b_name: game.team_b_name,
          team_a_score: teamAScore,
          team_b_score: editedTeamBScore,
          created_at: game.created_at
        })
      
      if (gameError) throw gameError
      
      alert('✅ 修改已保存！')
      setIsEditing(false)
      loadGameDetail() // 重新載入數據
      
    } catch (error) {
      console.error('保存失敗:', error)
      alert('❌ 保存失敗: ' + error.message)
    }
  }

  const handleCancelEdit = () => {
    setEditedStats([...playerStats]) // 恢復原始數據
    setEditedTeamBScore(game.team_b_score || 0) // 恢復客隊分數
    setIsEditing(false)
  }

  const handleDeleteGame = async () => {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD
    
    if (!adminPassword) {
      alert('⚠️ 未設定管理員密碼，無法使用刪除功能。\n請在 .env 中設定 VITE_ADMIN_PASSWORD')
      return
    }
    
    // 提示刪除操作
    if (!window.confirm('⚠️ 確定要刪除這場比賽嗎？\n此操作無法復原，將刪除比賽和所有球員數據。')) {
      return
    }
    
    // 要求輸入密碼
    const inputPassword = prompt('🔒 請輸入管理員密碼以確認刪除：')
    
    if (!inputPassword) {
      return // 用戶取消
    }
    
    if (inputPassword !== adminPassword) {
      alert('❌ 密碼錯誤，無法刪除')
      return
    }
    
    try {
      // 刪除比賽（會自動級聯刪除 player_stats，因為有 ON DELETE CASCADE）
      const { data, error, count } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId)
        .select()
      
      if (error) {
        console.error('刪除錯誤:', error)
        throw error
      }
      
      // 檢查是否真的刪除了
      if (!data || data.length === 0) {
        throw new Error('刪除失敗：沒有資料被刪除。可能是權限問題，請檢查 Supabase RLS 政策。')
      }
      
      console.log('成功刪除:', data)
      alert('✅ 比賽已刪除')
      onBack() // 返回歷史記錄頁面
      
    } catch (error) {
      console.error('刪除失敗:', error)
      alert('❌ 刪除失敗: ' + error.message)
    }
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
        {/* 返回按鈕和編輯按鈕 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="px-4 py-2 text-dark/60 hover:text-dark transition-colors flex items-center gap-2"
          >
            ← 返回
          </button>
          
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={handleStartEdit}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
                >
                  ✏️ 編輯數據
                </button>
                <button
                  onClick={handleDeleteGame}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                >
                  🗑️ 刪除比賽
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-200 text-dark rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
                >
                  💾 保存修改
                </button>
              </>
            )}
          </div>
        </div>

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
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={editedTeamBScore}
                    onChange={(e) => setEditedTeamBScore(parseInt(e.target.value) || 0)}
                    className="text-5xl font-serif font-bold text-dark/60 w-32 text-center border-2 border-accent/30 rounded-lg px-2 py-1"
                  />
                ) : (
                  <div className="text-5xl font-serif font-bold text-dark/60">{game.team_b_score}</div>
                )}
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
                {(isEditing ? editedStats : playerStats).map((player, index) => {
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
                        {isEditing ? (
                          <div className="space-y-1">
                            <div className="flex gap-1 justify-center">
                              <input
                                type="number"
                                min="0"
                                value={player.two_point_made}
                                onChange={(e) => handleEditChange(index, 'two_point_made', e.target.value)}
                                className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-sm"
                              />
                              <span className="text-xs self-center">/</span>
                              <input
                                type="number"
                                min="0"
                                value={player.two_point_attempted}
                                onChange={(e) => handleEditChange(index, 'two_point_attempted', e.target.value)}
                                className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-sm"
                              />
                            </div>
                            <div className="text-xs text-dark/60">{calculatePercentage(player.two_point_made, player.two_point_attempted)}%</div>
                          </div>
                        ) : (
                          <>
                            <div className="font-medium">{calculatePercentage(player.two_point_made, player.two_point_attempted)}%</div>
                            <div className="text-xs text-dark/40">{player.two_point_made}/{player.two_point_attempted}</div>
                          </>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {isEditing ? (
                          <div className="space-y-1">
                            <div className="flex gap-1 justify-center">
                              <input
                                type="number"
                                min="0"
                                value={player.three_point_made}
                                onChange={(e) => handleEditChange(index, 'three_point_made', e.target.value)}
                                className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-sm"
                              />
                              <span className="text-xs self-center">/</span>
                              <input
                                type="number"
                                min="0"
                                value={player.three_point_attempted}
                                onChange={(e) => handleEditChange(index, 'three_point_attempted', e.target.value)}
                                className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-sm"
                              />
                            </div>
                            <div className="text-xs text-dark/60">{calculatePercentage(player.three_point_made, player.three_point_attempted)}%</div>
                          </div>
                        ) : (
                          <>
                            <div className="font-medium">{calculatePercentage(player.three_point_made, player.three_point_attempted)}%</div>
                            <div className="text-xs text-dark/40">{player.three_point_made}/{player.three_point_attempted}</div>
                          </>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {isEditing ? (
                          <div className="space-y-1">
                            <div className="flex gap-1 justify-center">
                              <input
                                type="number"
                                min="0"
                                value={player.offensive_rebounds}
                                onChange={(e) => handleEditChange(index, 'offensive_rebounds', e.target.value)}
                                className="w-10 px-1 py-1 text-center border border-gray-300 rounded text-sm"
                              />
                              <span className="text-xs self-center">/</span>
                              <input
                                type="number"
                                min="0"
                                value={player.defensive_rebounds}
                                onChange={(e) => handleEditChange(index, 'defensive_rebounds', e.target.value)}
                                className="w-10 px-1 py-1 text-center border border-gray-300 rounded text-sm"
                              />
                            </div>
                            <div className="text-xs text-dark/60">總 {totalRebounds}</div>
                          </div>
                        ) : (
                          <>
                            <div className="font-medium">{totalRebounds}</div>
                            <div className="text-xs text-dark/40">{player.offensive_rebounds}/{player.defensive_rebounds}</div>
                          </>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={player.assists}
                            onChange={(e) => handleEditChange(index, 'assists', e.target.value)}
                            className="w-12 px-2 py-1 text-center border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          <span className="font-medium">{player.assists || 0}</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={player.steals}
                            onChange={(e) => handleEditChange(index, 'steals', e.target.value)}
                            className="w-12 px-2 py-1 text-center border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          <span className="font-medium">{player.steals || 0}</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={player.blocks}
                            onChange={(e) => handleEditChange(index, 'blocks', e.target.value)}
                            className="w-12 px-2 py-1 text-center border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          <span className="font-medium">{player.blocks || 0}</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={player.turnovers}
                            onChange={(e) => handleEditChange(index, 'turnovers', e.target.value)}
                            className="w-12 px-2 py-1 text-center border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          <span className="font-medium">{player.turnovers || 0}</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={player.fouls}
                            onChange={(e) => handleEditChange(index, 'fouls', e.target.value)}
                            className="w-12 px-2 py-1 text-center border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          <span className="font-medium">{player.fouls || 0}</span>
                        )}
                      </td>
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
