import { useMeetingStore } from '../stores/meetingStore'

export function DecisionsList(): React.JSX.Element {
  const decisions = useMeetingStore((state) => state.decisions)

  // Sort by priority (1=high first)
  const sortedDecisions = [...decisions].sort((a, b) => (a.priority || 2) - (b.priority || 2))

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header flex-shrink-0">
        <h2 className="card-title">Decisions</h2>
        {decisions.length > 0 && <span className="badge badge-success">{decisions.length}</span>}
      </div>

      {decisions.length === 0 ? (
        <p className="text-neutral-400 dark:text-neutral-500 text-sm italic">No decisions yet</p>
      ) : (
        <ul className="space-y-3 overflow-y-auto flex-1 min-h-0">
          {sortedDecisions.map((decision) => (
            <li key={decision.id} className="animate-fade-in">
              <div className="flex items-start gap-2">
                <PriorityIcon priority={decision.priority} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{decision.text}</p>
                  {decision.owner && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      by {decision.owner}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PriorityIcon({ priority }: { priority: number }): React.JSX.Element {
  if (priority === 1) {
    return (
      <span className="w-4 h-4 flex items-center justify-center text-red-500 font-bold text-xs">
        !!
      </span>
    )
  }
  if (priority === 3) {
    return (
      <span className="w-4 h-4 flex items-center justify-center text-neutral-400 text-xs">○</span>
    )
  }
  return <CheckIcon className="w-4 h-4 text-green-500" />
}

function CheckIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
