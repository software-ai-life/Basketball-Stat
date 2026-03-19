import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function GameSetup({ onStartGame, onViewHistory, onViewAnalytics, gameDate, onGameDateChange }) {
  const [teamAName, setTeamAName] = useState('主隊')
  const [teamBName, setTeamBName] = useState('客隊')
  const [teamBMode, setTeamBMode] = useState('simple')
  const [teamAPlayers, setTeamAPlayers] = useState([''])
  const [teamBPlayers, setTeamBPlayers] = useState([''])
  const [selectedTeamAPlayers, setSelectedTeamAPlayers] = useState([])
  const [selectedTeamBPlayers, setSelectedTeamBPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)

  useEffect(() => {
    loadLastGamePlayers()
  }, [])

  const loadLastGamePlayers = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const { data: lastGame, error: gameError } = await supabase
        .from('games')
        .select('id, team_a_name, team_b_name')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (gameError || !lastGame) {
        setLoading(false)
        return
      }

      const { data: playerStats, error: statsError } = await supabase
        .from('player_stats')
        .select('player_name, team')
        .eq('game_id', lastGame.id)
        .order('player_name')

      if (statsError) throw statsError

      if (playerStats?.length) {
        const pickNames = (teamName) => [...new Set(
          playerStats
            .filter(stat => stat.team === teamName)
            .map(stat => stat.player_name)
        )]

        const lastTeamAPlayers = pickNames(lastGame.team_a_name)
        const lastTeamBPlayers = pickNames(lastGame.team_b_name)

        if (lastTeamAPlayers.length > 0) {
          setTeamAPlayers(lastTeamAPlayers)
        }

        if (lastTeamBPlayers.length > 0) {
          setTeamBPlayers(lastTeamBPlayers)
          setTeamBMode('detailed')
        }
      }
    } catch (error) {
      console.error('載入球員名單失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const addPlayer = (setter, players) => setter([...players, ''])

  const updatePlayer = (setter, players, index, name) => {
    const updated = [...players]
    updated[index] = name
    setter(updated)
  }

  const removePlayer = (setter, players, index) => {
    setter(players.filter((_, i) => i !== index))
  }

  const togglePlayerSelection = (selected, setter, index) => {
    if (selected.includes(index)) {
      setter(selected.filter(i => i !== index))
      return
    }

    if (selected.length >= 5) {
      alert('最多只能選擇 5 位上場球員')
      return
    }

    setter([...selected, index])
  }

  const handleNext = () => {
    const validTeamA = teamAPlayers.filter(name => name.trim())
    const validTeamB = teamBPlayers.filter(name => name.trim())

    if (validTeamA.length < 5) {
      alert('主隊至少需要註冊 5 位球員')
      return
    }

    if (teamBMode === 'detailed' && validTeamB.length < 5) {
      alert('客隊若要記錄球員數據，至少需要註冊 5 位球員')
      return
    }

    setStep(2)
  }

  const handleStart = () => {
    const validTeamA = teamAPlayers.filter(name => name.trim())
    const validTeamB = teamBPlayers.filter(name => name.trim())

    if (selectedTeamAPlayers.length !== 5) {
      alert('請選擇主隊 5 位上場球員')
      return
    }

    if (teamBMode === 'detailed' && selectedTeamBPlayers.length !== 5) {
      alert('請選擇客隊 5 位上場球員')
      return
    }

    const activeTeamAPlayers = selectedTeamAPlayers.map(index => validTeamA[index])
    const activeTeamBPlayers = selectedTeamBPlayers.map(index => validTeamB[index])

    const gameData = {
      teamA: {
        name: teamAName,
        color: 'team-a',
        trackPlayers: true,
        players: activeTeamAPlayers.map((name, i) => ({ id: `teamA-${i}`, name: name.trim() }))
      },
      teamB: {
        name: teamBName,
        color: 'team-b',
        trackPlayers: teamBMode === 'detailed',
        players: teamBMode === 'detailed'
          ? activeTeamBPlayers.map((name, i) => ({ id: `teamB-${i}`, name: name.trim() }))
          : []
      }
    }

    onStartGame(gameData, {
      teamA: validTeamA,
      teamB: teamBMode === 'detailed' ? validTeamB : [],
      teamBMode
    })
  }

  const renderPlayerInputs = (title, players, setter, placeholderPrefix) => (
    <div>
      <div className="mb-4">
        <label className="block text-sm text-dark/60 mb-3 uppercase tracking-wider">{title}</label>
      </div>

      <div className="space-y-3 mb-6">
        {players.map((player, index) => (
          <div key={`${title}-${index}`} className="flex gap-3">
            <input
              type="text"
              value={player}
              onChange={(e) => updatePlayer(setter, players, index, e.target.value)}
              className="flex-1 bg-cream/50 border border-gray-300 focus:border-accent rounded-lg px-4 py-3 text-dark placeholder-dark/30 focus:outline-none transition-colors"
              placeholder={`${placeholderPrefix} ${index + 1}`}
            />
            {players.length > 1 && (
              <button
                onClick={() => removePlayer(setter, players, index)}
                className="px-4 py-3 bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 text-dark/50 hover:text-red-500 rounded-lg transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => addPlayer(setter, players)}
        className="w-full py-3 btn-secondary text-sm uppercase tracking-wider"
      >
        + 新增球員
      </button>
    </div>
  )

  const renderSelectionCard = (title, description, players, selected, setter) => (
    <div className="card p-8">
      <div className="mb-4">
        <h3 className="text-xl font-serif text-dark mb-2">{title}</h3>
        <p className="text-sm text-dark/60">{description}（已選 {selected.length}/5）</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {players.map((name, index) => (
          <button
            key={`${title}-${index}`}
            onClick={() => togglePlayerSelection(selected, setter, index)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selected.includes(index)
                ? 'bg-accent text-white border-accent shadow-md'
                : 'bg-white text-dark border-gray-200 hover:border-accent/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{name}</span>
              {selected.includes(index) && <span>✓</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  const validTeamA = teamAPlayers.filter(name => name.trim())
  const validTeamB = teamBPlayers.filter(name => name.trim())

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 mt-8">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 mb-4">
            <span className="text-accent text-lg">★</span>
            <span className="text-xs text-dark/60 uppercase tracking-wider">籃球計分系統</span>
          </div>
          <h1 className="text-5xl font-serif font-bold mb-4 text-dark">🏀 Basketball Scoreboard</h1>
          <h2 className="text-4xl font-serif text-accent mb-4">籃球計分</h2>
          <p className="text-dark/60 text-sm max-w-md mx-auto">專為比賽設計的計分系統，讓您專注於球賽本身</p>

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

        <div className="space-y-8">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              step === 1 ? 'bg-accent text-white' : 'bg-white text-dark border border-gray-200'
            }`}>
              <span className="font-medium">1</span>
              <span className="text-sm">註冊球員</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              step === 2 ? 'bg-accent text-white' : 'bg-white text-dark border border-gray-200'
            }`}>
              <span className="font-medium">2</span>
              <span className="text-sm">選擇上場 5 人</span>
            </div>
          </div>

          {step === 1 ? (
            <>
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
                {renderPlayerInputs('主隊球員名單', teamAPlayers, setTeamAPlayers, '主隊球員')}
              </div>

              <div className="card p-8 bg-gradient-to-br from-white to-gray-50">
                <div className="mb-6">
                  <label className="block text-sm text-dark/60 mb-3 uppercase tracking-wider">客隊名稱</label>
                  <input
                    type="text"
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
                    className="w-full bg-cream/50 border-b-2 border-gray-300 focus:border-dark px-2 py-3 text-dark text-lg focus:outline-none transition-colors"
                    placeholder="輸入客隊名稱"
                  />
                </div>

                <div className="mb-6">
                  <div className="text-sm text-dark/60 mb-3 uppercase tracking-wider">客隊模式</div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTeamBMode('simple')}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        teamBMode === 'simple'
                          ? 'bg-dark text-white border-dark'
                          : 'bg-white text-dark border-gray-200 hover:border-dark/40'
                      }`}
                    >
                      <div className="font-medium mb-1">不記錄</div>
                      <div className={`text-xs ${teamBMode === 'simple' ? 'text-white/80' : 'text-dark/50'}`}>
                        只記錄客隊總分
                      </div>
                    </button>
                    <button
                      onClick={() => setTeamBMode('detailed')}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        teamBMode === 'detailed'
                          ? 'bg-accent text-white border-accent'
                          : 'bg-white text-dark border-gray-200 hover:border-accent/40'
                      }`}
                    >
                      <div className="font-medium mb-1">記錄球員</div>
                      <div className={`text-xs ${teamBMode === 'detailed' ? 'text-white/80' : 'text-dark/50'}`}>
                        建立客隊名單並記錄個人數據
                      </div>
                    </button>
                  </div>
                </div>

                {teamBMode === 'detailed' ? (
                  renderPlayerInputs('客隊球員名單', teamBPlayers, setTeamBPlayers, '客隊球員')
                ) : (
                  <div className="flex items-center gap-2 text-xs text-dark/50 mt-4 bg-accent/5 px-4 py-3 rounded-lg border border-accent/20">
                    <span className="text-accent">💡</span>
                    <span>此模式下客隊只記錄總分，不記錄個別球員數據</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleNext}
                disabled={loading}
                className="w-full py-4 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-xl transition-all text-lg font-medium uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95"
              >
                下一步 →
              </button>
            </>
          ) : (
            <>
              {renderSelectionCard('主隊上場球員', '從主隊名單中選擇 5 位先發', validTeamA, selectedTeamAPlayers, setSelectedTeamAPlayers)}

              {teamBMode === 'detailed' && renderSelectionCard('客隊上場球員', '從客隊名單中選擇 5 位先發', validTeamB, selectedTeamBPlayers, setSelectedTeamBPlayers)}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep(1)
                    setSelectedTeamAPlayers([])
                    setSelectedTeamBPlayers([])
                  }}
                  className="flex-1 py-4 bg-white border-2 border-gray-200 hover:border-accent text-dark hover:text-accent rounded-xl transition-all text-lg font-medium uppercase tracking-wider"
                >
                  ← 返回
                </button>
                <button
                  onClick={handleStart}
                  disabled={selectedTeamAPlayers.length !== 5 || (teamBMode === 'detailed' && selectedTeamBPlayers.length !== 5)}
                  className={`flex-1 py-4 rounded-xl transition-all text-lg font-medium uppercase tracking-wider shadow-md ${
                    selectedTeamAPlayers.length === 5 && (teamBMode === 'simple' || selectedTeamBPlayers.length === 5)
                      ? 'bg-accent hover:bg-accent/90 text-white hover:shadow-lg active:scale-95'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  開始比賽 →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
