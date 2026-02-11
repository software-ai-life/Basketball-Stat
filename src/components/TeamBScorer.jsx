export default function TeamBScorer({ teamName, score, onScore, onUndo }) {
  const scoreButtons = [
    { points: 1, label: '+1' },
    { points: 2, label: '+2' },
    { points: 3, label: '+3' },
  ]

  return (
    <div className="px-6 pt-8 pb-6 border-t-2 border-gray-200">
      {/* 客隊標題 */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200">
          <span className="text-dark text-base">●</span>
          <span className="text-sm font-medium text-dark">{teamName}</span>
        </div>
        <div className="text-xs text-dark/40 mt-3 uppercase tracking-wider">
          快速計分
        </div>
      </div>

      {/* 計分按鈕 */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {scoreButtons.map((btn) => (
          <button
            key={btn.points}
            onClick={() => onScore(btn.points)}
            className="bg-dark hover:bg-dark/90 active:bg-dark/80 text-white rounded-xl py-8 transition-colors font-serif font-bold text-2xl shadow-sm"
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* 減分按鈕 */}
      <div className="grid grid-cols-3 gap-3">
        {scoreButtons.map((btn) => (
          <button
            key={`undo-${btn.points}`}
            onClick={() => onUndo(btn.points)}
            disabled={score < btn.points}
            className="bg-gray-100 hover:bg-red-100 disabled:opacity-30 disabled:hover:bg-gray-100 text-dark/70 hover:text-red-500 disabled:text-dark/30 rounded-xl py-4 transition-colors text-sm font-medium"
          >
            −{btn.points}
          </button>
        ))}
      </div>
    </div>
  )
}
