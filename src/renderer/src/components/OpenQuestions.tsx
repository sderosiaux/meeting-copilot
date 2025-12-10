import { useMeetingStore } from '../stores/meetingStore'

export function OpenQuestions(): React.JSX.Element | null {
  const openQuestions = useMeetingStore((state) => state.openQuestions)

  // Don't render if no questions
  if (openQuestions.length === 0) {
    return null
  }

  // Sort by priority (1=high first)
  const sortedQuestions = [...openQuestions].sort((a, b) => (a.priority || 2) - (b.priority || 2))

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Questions Ouvertes</h2>
        <span className="badge badge-warning">{openQuestions.length}</span>
      </div>

      <ul className="space-y-2 max-h-40 overflow-y-auto">
        {sortedQuestions.map((question) => (
          <li key={question.id} className="flex items-start gap-2 text-sm animate-fade-in">
            <PriorityIcon priority={question.priority} />
            <span>{question.text}</span>
          </li>
        ))}
      </ul>
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
  return <QuestionIcon className="w-4 h-4 text-yellow-500 mt-0.5" />
}

function QuestionIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}
