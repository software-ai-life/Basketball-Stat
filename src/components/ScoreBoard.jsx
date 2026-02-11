import { useState } from 'react'

export default function ScoreBoard({ teams, stats, onShot, onUndoShot, onScore, onUndo }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  const statButtons = [
    { key: 'steals', label: '抄截', points: 0, emoji: '✋' },
    { key: 'offensiveRebounds', label: '進攻籃板', points: 0, emoji: '⬆️' },
    { key: 'defensiveRebounds', label: '防守籃板', points: 0, emoji: '⬇️' },
    { key: 'assists', label: '助攻', points: 0, emoji: '🤝' },
    { key: 'blocks', label: '阻攻', points: 0, emoji: '🚫' },
    { key: 'turnovers', label: '失誤', points: 0, emoji: '⚠️' },    { key: 'fouls', label: '犯規', points: 0, emoji: '🚨' },  ]

  const handleStatClick = (statKey, points) => {
    if (selectedPlayer) {
      onScore(selectedPlayer, statKey, points)
    }
  }

  const handleStatUndo = (statKey, points) => {
    if (selectedPlayer) {
      onUndo(selectedPlayer, statKey, points)
    }
  }

  const handleShootClick = (shotType, made) => {
    if (selectedPlayer) {
      onShot(selectedPlayer, shotType, made)
    }
  }

  const calculateTotalPoints = (playerStats) => {
    return (playerStats?.twoPointMade || 0) * 2 + (playerStats?.threePointMade || 0) * 3
  }

  return (
    <div className="px-6 pt-6 pb-6">
      {/* 主隊標題 */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200">
          <span className="text-accent text-base">★</span>
          <span className="text-sm font-medium text-dark">{teams.teamA.name}</span>
        </div>
      </div>

      {/* Player Selection */}
      <div className="mb-8">
        <div className="text-xs text-dark/50 mb-4 uppercase tracking-wider">選擇球員</div>
        <div className="grid grid-cols-3 gap-3">
          {teams.teamA.players.map((player) => {
            const playerStats = stats[player.id]
            const totalPoints = calculateTotalPoints(playerStats)
            
            return (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player.id)}
                className={`p-5 rounded-xl transition-all border-2 ${
                  selectedPlayer === player.id
                    ? 'bg-accent text-white border-accent shadow-md scale-95'
                    : 'bg-white text-dark border-gray-200 hover:border-accent/50 active:scale-95'
                }`}
              >
                <div className="font-medium text-sm mb-2 truncate">{player.name}</div>
                <div className={`text-xs font-mono tabular-nums ${
                  selectedPlayer === player.id ? 'text-white/90' : 'text-dark/50'
                }`}>
                  {totalPoints} 分
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Stats Input */}
      {selectedPlayer ? (
        <div>
          <div className="text-xs text-dark/50 mb-4 uppercase tracking-wider">
            記錄數據 - {stats[selectedPlayer]?.name}
          </div>
          
          {/* 投籃區域 */}
          <div className="mb-6">
            <div className="text-xs text-dark/40 mb-3 uppercase tracking-wider">投籃</div>
            <div className="grid grid-cols-2 gap-4">
              {/* 2分球 */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-lg font-medium text-dark mb-1">🏀 2分球</div>
                    <div className="text-xs text-dark/40">
                      {stats[selectedPlayer]?.twoPointMade || 0}/{stats[selectedPlayer]?.twoPointAttempted || 0}
                      {stats[selectedPlayer]?.twoPointAttempted > 0 && (
                        <span className="ml-2 text-accent">
                          {Math.round((stats[selectedPlayer]?.twoPointMade || 0) / (stats[selectedPlayer]?.twoPointAttempted || 1) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShootClick(2, false)}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-dark/70 rounded-lg transition-colors text-sm font-medium"
                    >
                      未進
                    </button>
                    <button
                      onClick={() => handleShootClick(2, true)}
                      className="flex-1 py-3 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors text-sm font-medium"
                    >
                      ✓ 進球
                    </button>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => onUndoShot(selectedPlayer, 2, false)}
                      disabled={stats[selectedPlayer]?.twoPointAttempted === stats[selectedPlayer]?.twoPointMade}
                      className="flex-1 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-30 disabled:hover:bg-red-50 text-red-600 rounded-lg transition-colors font-medium"
                    >
                      ← 撒銷未進
                    </button>
                    <button
                      onClick={() => onUndoShot(selectedPlayer, 2, true)}
                      disabled={stats[selectedPlayer]?.twoPointMade === 0}
                      className="flex-1 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-30 disabled:hover:bg-red-50 text-red-600 rounded-lg transition-colors font-medium"
                    >
                      ← 撒銷進球
                    </button>
                  </div>
                </div>
              </div>

              {/* 3分球 */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-lg font-medium text-dark mb-1">🎯 3分球</div>
                    <div className="text-xs text-dark/40">
                      {stats[selectedPlayer]?.threePointMade || 0}/{stats[selectedPlayer]?.threePointAttempted || 0}
                      {stats[selectedPlayer]?.threePointAttempted > 0 && (
                        <span className="ml-2 text-accent">
                          {Math.round((stats[selectedPlayer]?.threePointMade || 0) / (stats[selectedPlayer]?.threePointAttempted || 1) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShootClick(3, false)}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-dark/70 rounded-lg transition-colors text-sm font-medium"
                    >
                      未進
                    </button>
                    <button
                      onClick={() => handleShootClick(3, true)}
                      className="flex-1 py-3 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors text-sm font-medium"
                    >
                      ✓ 進球
                    </button>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => onUndoShot(selectedPlayer, 3, false)}
                      disabled={stats[selectedPlayer]?.threePointAttempted === stats[selectedPlayer]?.threePointMade}
                      className="flex-1 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-30 disabled:hover:bg-red-50 text-red-600 rounded-lg transition-colors font-medium"
                    >
                      ← 撒銷未進
                    </button>
                    <button
                      onClick={() => onUndoShot(selectedPlayer, 3, true)}
                      disabled={stats[selectedPlayer]?.threePointMade === 0}
                      className="flex-1 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-30 disabled:hover:bg-red-50 text-red-600 rounded-lg transition-colors font-medium"
                    >
                      ← 撒銷進球
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 其他數據 */}
          <div>
            <div className="text-xs text-dark/40 mb-3 uppercase tracking-wider">其他數據</div>
            <div className="grid grid-cols-2 gap-4">
            {statButtons.map((stat) => {
              const currentValue = stats[selectedPlayer]?.[stat.key] || 0
              
              return (
                <div key={stat.key} className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{stat.emoji}</span>
                      <div>
                        <div className="text-sm font-medium text-dark">{stat.label}</div>
                      </div>
                    </div>
                    <div className="text-3xl font-serif font-bold tabular-nums text-accent">
                      {currentValue}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatUndo(stat.key, stat.points)}
                      disabled={currentValue === 0}
                      className="flex-1 py-2 bg-gray-100 hover:bg-red-100 disabled:opacity-30 disabled:hover:bg-gray-100 text-dark/70 hover:text-red-500 disabled:text-dark/30 rounded-lg transition-colors text-sm font-medium"
                    >
                      −
                    </button>
                    <button
                      onClick={() => handleStatClick(stat.key, stat.points)}
                      className="flex-1 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors text-sm font-medium"
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-dark/30">
          <div className="text-5xl mb-4">👆</div>
          <div className="text-sm uppercase tracking-wider">選擇一位球員開始記錄</div>
        </div>
      )}
    </div>
  )
}
