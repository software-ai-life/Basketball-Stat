import { useState } from 'react'
import GameSetup from './components/GameSetup'
import ScoreBoard from './components/ScoreBoard'
import PlayerStats from './components/PlayerStats'
import TeamBScorer from './components/TeamBScorer'
import GameHistory from './components/GameHistory'
import PlayerAnalytics from './components/PlayerAnalytics'
import GameDetail from './components/GameDetail'
import SubstitutionModal from './components/SubstitutionModal'
import { supabase } from './lib/supabase'

const createInitialPlayerStat = (name, team) => ({
  name,
  team,
  twoPointMade: 0,
  twoPointAttempted: 0,
  threePointMade: 0,
  threePointAttempted: 0,
  steals: 0,
  offensiveRebounds: 0,
  defensiveRebounds: 0,
  assists: 0,
  blocks: 0,
  turnovers: 0,
  fouls: 0
})

function App() {
  const [currentPage, setCurrentPage] = useState('setup') // 'setup', 'game', 'history', 'analytics', 'gameDetail'
  const [selectedGameId, setSelectedGameId] = useState(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameDate, setGameDate] = useState(new Date().toISOString().split('T')[0]) // 比賽日期
  const [teams, setTeams] = useState({
    teamA: { name: '主隊', color: 'team-a', players: [] },
    teamB: { name: '客隊', color: 'team-b', players: [] }
  })
  const [scores, setScores] = useState({
    teamA: 0,
    teamB: 0
  })
  const [stats, setStats] = useState({})
  const [view, setView] = useState('scoreboard') // 'scoreboard' or 'stats'
  const [allPlayers, setAllPlayers] = useState({ teamA: [], teamB: [], teamBMode: 'simple' })
  const [showSubstitution, setShowSubstitution] = useState(false) // 換人介面
  const [activeTeam, setActiveTeam] = useState('teamA')

  const handleStartGame = (teamData, allPlayersList) => {
    setAllPlayers(allPlayersList)
    setTeams(teamData)

    const initialStats = {}

    teamData.teamA.players.forEach(player => {
      initialStats[player.id] = createInitialPlayerStat(player.name, 'teamA')
    })

    if (teamData.teamB.trackPlayers) {
      teamData.teamB.players.forEach(player => {
        initialStats[player.id] = createInitialPlayerStat(player.name, 'teamB')
      })
    }

    setStats(initialStats)
    setActiveTeam('teamA')
    setGameStarted(true)
    setCurrentPage('game')
  }

  const handleScore = (playerId, statType, points = 0) => {
    setStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [statType]: prev[playerId][statType] + 1
      }
    }))
    
    if (points > 0) {
      const team = stats[playerId].team
      setScores(prev => ({
        ...prev,
        [team]: prev[team] + points
      }))
    }
  }

  const handleUndo = (playerId, statType, points = 0) => {
    if (stats[playerId][statType] > 0) {
      setStats(prev => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          [statType]: prev[playerId][statType] - 1
        }
      }))
      
      if (points > 0) {
        const team = stats[playerId].team
        setScores(prev => ({
          ...prev,
          [team]: Math.max(0, prev[team] - points)
        }))
      }
    }
  }

  const handleShot = (playerId, shotType, made) => {
    const madeKey = shotType === 2 ? 'twoPointMade' : 'threePointMade'
    const attemptedKey = shotType === 2 ? 'twoPointAttempted' : 'threePointAttempted'
    
    setStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [madeKey]: prev[playerId][madeKey] + (made ? 1 : 0),
        [attemptedKey]: prev[playerId][attemptedKey] + 1
      }
    }))
    
    if (made) {
      const team = stats[playerId].team
      setScores(prev => ({
        ...prev,
        [team]: prev[team] + shotType
      }))
    }
  }

  const handleUndoShot = (playerId, shotType, wasMade) => {
    const madeKey = shotType === 2 ? 'twoPointMade' : 'threePointMade'
    const attemptedKey = shotType === 2 ? 'twoPointAttempted' : 'threePointAttempted'
    
    if (stats[playerId][attemptedKey] > 0) {
      setStats(prev => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          [madeKey]: Math.max(0, prev[playerId][madeKey] - (wasMade ? 1 : 0)),
          [attemptedKey]: prev[playerId][attemptedKey] - 1
        }
      }))
      
      if (wasMade) {
        const team = stats[playerId].team
        setScores(prev => ({
          ...prev,
          [team]: Math.max(0, prev[team] - shotType)
        }))
      }
    }
  }

  const handleTeamBScore = (points) => {
    setScores(prev => ({
      ...prev,
      teamB: prev.teamB + points
    }))
  }

  const handleTeamBUndo = (points) => {
    setScores(prev => ({
      ...prev,
      teamB: Math.max(0, prev.teamB - points)
    }))
  }

  const handleSubstitution = (teamKey, outPlayerId, inPlayerName) => {
    const outPlayerIndex = teams[teamKey].players.findIndex(p => p.id === outPlayerId)
    if (outPlayerIndex === -1) return

    const existingEntry = Object.entries(stats).find(
      ([_, s]) => s.name === inPlayerName && s.team === teamKey
    )

    let playerId
    if (existingEntry) {
      playerId = existingEntry[0]
    } else {
      playerId = `${teamKey}-${Date.now()}`
      setStats(prev => ({
        ...prev,
        [playerId]: createInitialPlayerStat(inPlayerName, teamKey)
      }))
    }

    const newPlayers = [...teams[teamKey].players]
    newPlayers[outPlayerIndex] = {
      id: playerId,
      name: inPlayerName
    }

    setTeams(prev => ({
      ...prev,
      [teamKey]: {
        ...prev[teamKey],
        players: newPlayers
      }
    }))

    setShowSubstitution(false)
  }

  const handleSaveGame = async () => {
    if (!supabase) {
      alert('請先設定 Supabase 連線。請參考 SUPABASE_SETUP.md')
      return
    }

    try {
      // 保存比賽記錄
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          date: gameDate, // 使用自訂日期
          team_a_name: teams.teamA.name,
          team_b_name: teams.teamB.name,
          team_a_score: scores.teamA,
          team_b_score: scores.teamB
        })
        .select()
        .single()

      if (gameError) throw gameError

      // 保存球員統計
      const playerStatsData = Object.values(stats).map(playerStat => {
        const twoPoints = (playerStat.twoPointMade || 0) * 2
        const threePoints = (playerStat.threePointMade || 0) * 3
        const totalPoints = twoPoints + threePoints
        
        return {
          game_id: gameData.id,
          player_name: playerStat.name,
          team: playerStat.team === 'teamA' ? teams.teamA.name : teams.teamB.name,
          two_point_made: playerStat.twoPointMade || 0,
          two_point_attempted: playerStat.twoPointAttempted || 0,
          three_point_made: playerStat.threePointMade || 0,
          three_point_attempted: playerStat.threePointAttempted || 0,
          total_points: totalPoints,
          steals: playerStat.steals || 0,
          offensive_rebounds: playerStat.offensiveRebounds || 0,
          defensive_rebounds: playerStat.defensiveRebounds || 0,
          assists: playerStat.assists || 0,
          blocks: playerStat.blocks || 0,
          turnovers: playerStat.turnovers || 0,
          fouls: playerStat.fouls || 0
        }
      })

      const { error: statsError } = await supabase
        .from('player_stats')
        .insert(playerStatsData)

      if (statsError) throw statsError

      alert('✅ 比賽已成功保存！')
      
      // 重置遊戲
      setGameStarted(false)
      setScores({ teamA: 0, teamB: 0 })
      setStats({})
      setAllPlayers({ teamA: [], teamB: [], teamBMode: 'simple' })
      setActiveTeam('teamA')
      setView('scoreboard')
      setCurrentPage('setup')
      
    } catch (error) {
      console.error('保存失敗:', error)
      alert('❌ 保存失敗: ' + error.message)
    }
  }

  const handleReset = () => {
    if (window.confirm('確定要放棄此場比賽嗎？數據將不會被保存。')) {
      setGameStarted(false)
      setScores({ teamA: 0, teamB: 0 })
      setStats({})
      setAllPlayers({ teamA: [], teamB: [], teamBMode: 'simple' })
      setActiveTeam('teamA')
      setView('scoreboard')
      setGameDate(new Date().toISOString().split('T')[0]) // 重置日期
      setCurrentPage('setup')
    }
  }

  // 查看比賽詳情的處理函數
  const handleViewGameDetail = (gameId) => {
    setSelectedGameId(gameId)
    setCurrentPage('gameDetail')
  }

  // 頁面導航
  if (currentPage === 'history') {
    return <GameHistory onBack={() => setCurrentPage('setup')} onViewGame={handleViewGameDetail} />
  }

  if (currentPage === 'analytics') {
    return <PlayerAnalytics onBack={() => setCurrentPage('setup')} />
  }

  if (currentPage === 'gameDetail') {
    return <GameDetail gameId={selectedGameId} onBack={() => setCurrentPage('history')} />
  }

  if (!gameStarted) {
    return (
      <GameSetup 
        onStartGame={handleStartGame}
        onViewHistory={() => setCurrentPage('history')}
        onViewAnalytics={() => setCurrentPage('analytics')}
        gameDate={gameDate}
        onGameDateChange={setGameDate}
      />
    )
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Header with Scores - Sticky 在頂部，z-index 高於浮動欄 */}
      <div className="sticky top-0 z-[60] bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex-1 text-center">
            <div className="text-xs text-dark/50 mb-1 uppercase tracking-wider">{teams.teamA.name}</div>
            <div className="text-4xl font-serif font-bold text-accent tabular-nums">
              {scores.teamA}
            </div>
          </div>
          
          <div className="px-4 text-dark/20 text-xl font-serif">:</div>
          
          <div className="flex-1 text-center">
            <div className="text-xs text-dark/50 mb-1 uppercase tracking-wider">{teams.teamB.name}</div>
            <div className="text-4xl font-serif font-bold text-dark tabular-nums">
              {scores.teamB}
            </div>
          </div>
        </div>
        
        {/* View Toggle */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => setView('scoreboard')}
            className={`flex-1 py-4 text-sm uppercase tracking-wider transition-colors font-medium ${
              view === 'scoreboard' 
                ? 'bg-accent text-white' 
                : 'text-dark/50 hover:bg-gray-50'
            }`}
          >
            計分板
          </button>
          <button
            onClick={() => setView('stats')}
            className={`flex-1 py-4 text-sm uppercase tracking-wider transition-colors font-medium ${
              view === 'stats' 
                ? 'bg-accent text-white' 
                : 'text-dark/50 hover:bg-gray-50'
            }`}
          >
            統計數據
          </button>
        </div>

        {view === 'scoreboard' && teams.teamB.trackPlayers && (
          <div className="grid grid-cols-2 border-t border-gray-200 bg-cream/60">
            <button
              onClick={() => setActiveTeam('teamA')}
              className={`py-3 text-sm font-medium transition-colors ${
                activeTeam === 'teamA'
                  ? 'bg-accent text-white'
                  : 'text-dark/60 hover:bg-white'
              }`}
            >
              記錄 {teams.teamA.name}
            </button>
            <button
              onClick={() => setActiveTeam('teamB')}
              className={`py-3 text-sm font-medium transition-colors ${
                activeTeam === 'teamB'
                  ? 'bg-dark text-white'
                  : 'text-dark/60 hover:bg-white'
              }`}
            >
              記錄 {teams.teamB.name}
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={view === 'scoreboard' ? 'pt-16' : ''}>
      {view === 'scoreboard' ? (
        <>
          <ScoreBoard 
            team={teams[activeTeam]}
            teamKey={activeTeam}
            stats={stats}
            onShot={handleShot}
            onUndoShot={handleUndoShot}
            onScore={handleScore}
            onUndo={handleUndo}
            showFloatingBar={true}
          />

          {!teams.teamB.trackPlayers && (
            <TeamBScorer 
              teamName={teams.teamB.name}
              score={scores.teamB}
              onScore={handleTeamBScore}
              onUndo={handleTeamBUndo}
            />
          )}
        </>
      ) : (
        <PlayerStats 
          teams={teams}
          stats={stats}
          scores={scores}
        />
      )}
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-cream via-cream to-transparent">
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 py-4 btn-secondary text-sm uppercase tracking-wider"
          >
            放棄比賽
          </button>
          <button
            onClick={() => setShowSubstitution(true)}
            disabled={(allPlayers[activeTeam] || []).filter(
              name => !teams[activeTeam].players.some(player => player.name === name)
            ).length === 0}
            className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all text-sm uppercase tracking-wider shadow-lg"
          >
            🔄 換人
          </button>
          <button
            onClick={handleSaveGame}
            className="flex-1 py-4 btn-primary text-sm uppercase tracking-wider shadow-lg"
          >
            💾 保存比賽
          </button>
        </div>
      </div>

      {/* 換人介面 */}
      {showSubstitution && (
        <SubstitutionModal
          teamName={teams[activeTeam].name}
          currentPlayers={teams[activeTeam].players}
          allPlayers={allPlayers[activeTeam] || []}
          onSubstitute={(outPlayerId, inPlayerName) => handleSubstitution(activeTeam, outPlayerId, inPlayerName)}
          onClose={() => setShowSubstitution(false)}
        />
      )}
    </div>
  )
}

export default App
