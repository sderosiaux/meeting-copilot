import { useMeetingStore } from '../stores/meetingStore'

export function LiveSummary(): React.JSX.Element {
  const liveSummary = useMeetingStore((state) => state.liveSummary)

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Resume Live</h2>
      </div>

      {liveSummary.length === 0 ? (
        <p className="text-neutral-400 dark:text-neutral-500 text-sm italic">
          Listening for conversation...
        </p>
      ) : (
        <ul className="space-y-2">
          {liveSummary.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm animate-fade-in">
              <span className="text-blue-500 mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
