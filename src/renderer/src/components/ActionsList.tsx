import { useMeetingStore } from '../stores/meetingStore'

export function ActionsList(): React.JSX.Element {
  const actions = useMeetingStore((state) => state.actions)

  // Sort by priority (1=high first), then separate by status
  const sortedActions = [...actions].sort((a, b) => (a.priority || 2) - (b.priority || 2))
  const identifiedActions = sortedActions.filter((a) => a.status === 'identified')
  const needsClarification = sortedActions.filter((a) => a.status === 'needs-clarification')

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header flex-shrink-0">
        <h2 className="card-title">Actions</h2>
        {actions.length > 0 && <span className="badge badge-primary">{actions.length}</span>}
      </div>

      {actions.length === 0 ? (
        <p className="text-neutral-400 dark:text-neutral-500 text-sm italic">No actions yet</p>
      ) : (
        <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
          {identifiedActions.length > 0 && (
            <ul className="space-y-3">
              {identifiedActions.map((action) => (
                <li key={action.id} className="animate-fade-in">
                  <div className="flex items-start gap-2">
                    <PriorityIcon priority={action.priority} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        {action.owner && <span className="font-medium">{action.owner}: </span>}
                        {action.text}
                      </p>
                      {action.deadline && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          Due: {action.deadline}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {needsClarification.length > 0 && (
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
              <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                Needs clarification
              </p>
              <ul className="space-y-2">
                {needsClarification.map((action) => (
                  <li
                    key={action.id}
                    className="text-sm text-neutral-500 dark:text-neutral-400 italic animate-fade-in"
                  >
                    &ldquo;{action.text}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PriorityIcon({ priority }: { priority: number }): React.JSX.Element {
  if (priority === 1) {
    return (
      <span className="w-4 h-4 flex items-center justify-center text-red-500 font-bold text-xs mt-0.5">
        !!
      </span>
    )
  }
  if (priority === 3) {
    return (
      <span className="w-4 h-4 flex items-center justify-center text-neutral-400 text-xs mt-0.5">
        ○
      </span>
    )
  }
  return <ArrowIcon className="w-4 h-4 text-blue-500 mt-0.5" />
}

function ArrowIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7l5 5m0 0l-5 5m5-5H6"
      />
    </svg>
  )
}
