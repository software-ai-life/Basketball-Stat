import { useState } from 'react'

export default function SubstitutionModal({ teamName, currentPlayers, allPlayers, onSubstitute, onClose }) {
  const [selectedOut, setSelectedOut] = useState('')
  const [selectedIn, setSelectedIn] = useState('')

  // 獲取場上球員名字
  const currentPlayerNames = currentPlayers.map(p => p.name)
  
  // 獲取可替換的球員（不在場上的）
  const availablePlayers = allPlayers.filter(name => !currentPlayerNames.includes(name))

  const handleConfirm = () => {
    if (!selectedOut || !selectedIn) {
      alert('請選擇要換下和換上的球員')
      return
    }

    onSubstitute(selectedOut, selectedIn)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-serif font-bold text-dark mb-2">🔄 球員替換</h2>
          <p className="text-sm text-dark/60">目前隊伍：{teamName}</p>
        </div>

        {/* 選擇換下的球員 */}
        <div className="mb-6">
          <label className="block text-sm text-dark/60 mb-3 uppercase tracking-wider">換下球員</label>
          <div className="space-y-2">
            {currentPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedOut(player.id)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  selectedOut === player.id
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-gray-50 border-gray-200 text-dark hover:border-gray-300'
                }`}
              >
                {player.name} {selectedOut === player.id && '⬇️'}
              </button>
            ))}
          </div>
        </div>

        {/* 選擇換上的球員 */}
        <div className="mb-6">
          <label className="block text-sm text-dark/60 mb-3 uppercase tracking-wider">換上球員</label>
          {availablePlayers.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availablePlayers.map((playerName, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIn(playerName)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    selectedIn === playerName
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'bg-gray-50 border-gray-200 text-dark hover:border-gray-300'
                  }`}
                >
                  {playerName} {selectedIn === playerName && '⬆️'}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-dark/40 bg-gray-50 rounded-lg">
              沒有可替換的球員
            </div>
          )}
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-200 text-dark rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedOut || !selectedIn}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              selectedOut && selectedIn
                ? 'bg-accent text-white hover:bg-accent/90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            確認替換
          </button>
        </div>
      </div>
    </div>
  )
}
