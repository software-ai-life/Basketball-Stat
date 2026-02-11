export default function PlayerStats({ teams, stats, scores }) {
  const calculateTotalPoints = (playerStats) => {
    return (playerStats?.twoPointMade || 0) * 2 + (playerStats?.threePointMade || 0) * 3
  }

  const calculateFGPercentage = (playerStats) => {
    const made = (playerStats?.twoPointMade || 0) + (playerStats?.threePointMade || 0)
    const attempted = (playerStats?.twoPointAttempted || 0) + (playerStats?.threePointAttempted || 0)
    return attempted > 0 ? Math.round((made / attempted) * 100) : 0
  }

  return (
    <div className="px-6 pt-6 pb-6">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200">
          <span className="text-accent text-base">★</span>
          <span className="text-sm font-medium text-dark">{teams.teamA.name} 完整統計</span>
        </div>
      </div>

      {/* 主隊統計 */}
      <div className="mb-8">
        <div className="space-y-3">
          {teams.teamA.players.map((player) => {
            const playerStats = stats[player.id]
            const totalPoints = calculateTotalPoints(playerStats)
            const fgPercentage = calculateFGPercentage(playerStats)
            const twoP = playerStats?.twoPointMade || 0
            const twoPA = playerStats?.twoPointAttempted || 0
            const threeP = playerStats?.threePointMade || 0
            const threePA = playerStats?.threePointAttempted || 0
            
            return (
              <div key={player.id} className="card p-5">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <div className="font-medium text-dark text-lg">{player.name}</div>
                    <div className="text-xs text-dark/40 mt-1">投籃命中率 {fgPercentage}%</div>
                  </div>
                  <div className="text-3xl font-serif font-bold tabular-nums text-accent">
                    {totalPoints} 分
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-xs mb-4">
                  <div className="text-center">
                    <div className="text-dark/40 mb-1 uppercase tracking-wider">2分</div>
                    <div className="font-mono tabular-nums text-dark text-base font-medium">
                      {twoP}/{twoPA}
                    </div>
                    {twoPA > 0 && (
                      <div className="text-xs text-accent mt-1">
                        {Math.round((twoP / twoPA) * 100)}%
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-dark/40 mb-1 uppercase tracking-wider">3分</div>
                    <div className="font-mono tabular-nums text-dark text-base font-medium">
                      {threeP}/{threePA}
                    </div>
                    {threePA > 0 && (
                      <div className="text-xs text-accent mt-1">
                        {Math.round((threeP / threePA) * 100)}%
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-dark/40 mb-1 uppercase tracking-wider">抄截</div>
                    <div className="font-mono tabular-nums text-dark text-base font-medium">
                      {playerStats?.steals || 0}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-dark/40 mb-1 uppercase tracking-wider">助攻</div>
                    <div className="font-mono tabular-nums text-dark text-base font-medium">
                      {playerStats?.assists || 0}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="text-center">
                    <div className="text-dark/40 mb-1 uppercase tracking-wider">進攻板</div>
                    <div className="font-mono tabular-nums text-dark text-base font-medium">
                      {playerStats?.offensiveRebounds || 0}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-dark/40 mb-1 uppercase tracking-wider">防守板</div>
                    <div className="font-mono tabular-nums text-dark text-base font-medium">
                      {playerStats?.defensiveRebounds || 0}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-dark/40 mb-1 uppercase tracking-wider">阻攻</div>
                    <div className="font-mono tabular-nums text-dark text-base font-medium">
                      {playerStats?.blocks || 0}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-dark/40 mb-1 uppercase tracking-wider">失誤</div>
                    <div className="font-mono tabular-nums text-dark text-base font-medium">
                      {playerStats?.turnovers || 0}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 客隊總分 */}
      <div className="card p-8 bg-gradient-to-br from-white to-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-dark/40 mb-2 uppercase tracking-wider">{teams.teamB.name}</div>
            <div className="text-sm text-dark/60 font-medium">總分</div>
          </div>
          <div className="text-5xl font-serif font-bold tabular-nums text-dark">
            {scores.teamB}
          </div>
        </div>
      </div>
    </div>
  )
}
