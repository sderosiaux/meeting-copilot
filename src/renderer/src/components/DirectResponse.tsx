import { useMeetingStore } from '../stores/meetingStore'

export function DirectResponse(): React.JSX.Element | null {
  const lastDirectResponse = useMeetingStore((state) => state.lastDirectResponse)
  const clearDirectResponse = useMeetingStore((state) => state.clearDirectResponse)

  // Don't show if null, empty, or the literal string "null"
  if (!lastDirectResponse || lastDirectResponse === 'null' || lastDirectResponse.trim() === '')
    return null

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/20 p-4 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-white/70 mb-1">Copilot Response</p>
              <p className="text-sm leading-relaxed">{lastDirectResponse}</p>
            </div>
          </div>
          <button
            onClick={clearDirectResponse}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
