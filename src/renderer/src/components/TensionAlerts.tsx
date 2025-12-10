import { useMeetingStore } from '../stores/meetingStore'

export function TensionAlerts(): React.JSX.Element {
  const loops = useMeetingStore((state) => state.loops)
  const contradictions = useMeetingStore((state) => state.contradictions)

  const hasAlerts = loops.length > 0 || contradictions.length > 0

  // Don't render anything if no alerts - keep UI clean
  if (!hasAlerts) {
    return <></>
  }

  return (
    <div className="card border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/10">
      <div className="card-header">
        <h2 className="card-title text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
          <AlertIcon className="w-4 h-4" />
          Boucles & Tensions
        </h2>
        <span className="badge badge-warning">{loops.length + contradictions.length}</span>
      </div>

      <ul className="space-y-2 max-h-40 overflow-y-auto">
        {/* Loops */}
        {loops.map((loop) => (
          <li key={loop.id} className="flex items-start gap-2 animate-fade-in">
            <LoopIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{loop.topic}</span>
                <span className="text-yellow-600 dark:text-yellow-400 text-xs ml-2">
                  ×{loop.occurrences}
                </span>
                {loop.suggestion && (
                  <span className="text-neutral-500 dark:text-neutral-400 ml-2">
                    → {loop.suggestion}
                  </span>
                )}
              </p>
            </div>
          </li>
        ))}

        {/* Contradictions */}
        {contradictions.map((contradiction) => (
          <li key={contradiction.id} className="flex items-start gap-2 animate-fade-in">
            <ConflictIcon className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{contradiction.topic}:</span>
                <span className="text-neutral-500 dark:text-neutral-400 ml-1">
                  {contradiction.earlier} → {contradiction.later}
                </span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AlertIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )
}

function LoopIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  )
}

function ConflictIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}
