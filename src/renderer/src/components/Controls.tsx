import { useMeetingStore, type MeetingStatus } from '../stores/meetingStore'
import { useEffect, useState } from 'react'

interface ControlsProps {
  status: MeetingStatus
  startTime: number | null
  audioLevel?: number
  isActive?: boolean
}

export function Controls({
  status,
  startTime,
  audioLevel = 0,
  isActive = false
}: ControlsProps): React.JSX.Element {
  const start = useMeetingStore((state) => state.start)
  const pause = useMeetingStore((state) => state.pause)
  const resume = useMeetingStore((state) => state.resume)
  const reset = useMeetingStore((state) => state.reset)
  const liveSummary = useMeetingStore((state) => state.liveSummary)
  const decisions = useMeetingStore((state) => state.decisions)
  const actions = useMeetingStore((state) => state.actions)
  const openQuestions = useMeetingStore((state) => state.openQuestions)
  const loops = useMeetingStore((state) => state.loops)
  const contradictions = useMeetingStore((state) => state.contradictions)
  const fullTranscript = useMeetingStore((state) => state.fullTranscript)

  const [copied, setCopied] = useState(false)

  const hasContent =
    liveSummary.length > 0 ||
    decisions.length > 0 ||
    actions.length > 0 ||
    openQuestions.length > 0 ||
    loops.length > 0 ||
    contradictions.length > 0 ||
    fullTranscript.trim().length > 0

  const handleCopyMarkdown = async (): Promise<void> => {
    const markdown = generateMarkdown({
      liveSummary,
      decisions,
      actions,
      openQuestions,
      loops,
      contradictions,
      fullTranscript
    })

    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {status === 'idle' && !hasContent && (
          <button onClick={start} className="btn btn-primary">
            <PlayIcon className="w-4 h-4 mr-2" />
            Start
          </button>
        )}

        {status === 'idle' && hasContent && (
          <>
            <button onClick={start} className="btn btn-primary">
              <PlayIcon className="w-4 h-4 mr-2" />
              New Meeting
            </button>
            <button onClick={handleCopyMarkdown} className="btn btn-secondary">
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <CopyIcon className="w-4 h-4 mr-2" />
                  Copy to Markdown
                </>
              )}
            </button>
          </>
        )}

        {/* Pause button visible during recording AND processing */}
        {(status === 'recording' || status === 'processing') && (
          <button onClick={pause} className="btn btn-secondary">
            <PauseIcon className="w-4 h-4 mr-2" />
            Pause
          </button>
        )}

        {status === 'paused' && (
          <>
            <button onClick={resume} className="btn btn-primary">
              <PlayIcon className="w-4 h-4 mr-2" />
              Resume
            </button>
            <button onClick={reset} className="btn btn-ghost btn-sm">
              Reset
            </button>
          </>
        )}

        {(status === 'recording' || status === 'processing') && (
          <button onClick={reset} className="btn btn-ghost btn-sm text-red-500 hover:text-red-600">
            <StopIcon className="w-4 h-4 mr-1" />
            Stop
          </button>
        )}
      </div>

      {/* Right side: Duration + Audio Level */}
      <div className="flex items-center gap-4">
        {startTime && (
          <Duration
            startTime={startTime}
            isRunning={status === 'recording' || status === 'processing'}
          />
        )}
        {isActive && <AudioLevelIndicator level={audioLevel} />}
      </div>
    </div>
  )
}

interface DurationProps {
  startTime: number
  isRunning: boolean
}

function Duration({ startTime, isRunning }: DurationProps): React.JSX.Element {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    // Set initial elapsed time
    setElapsed(Date.now() - startTime)

    if (!isRunning) return

    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, isRunning])

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m ${seconds % 60}s`
  }

  return (
    <div className="text-sm text-neutral-500 dark:text-neutral-400">
      <span className="font-mono">{formatDuration(elapsed)}</span>
    </div>
  )
}

function AudioLevelIndicator({ level }: { level: number }): React.JSX.Element {
  const bars = 5
  const activeBarCount = Math.ceil(level * bars)

  return (
    <div className="flex items-center gap-0.5" title={`Audio level: ${Math.round(level * 100)}%`}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-100 ${
            i < activeBarCount
              ? i < 2
                ? 'bg-green-500'
                : i < 4
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              : 'bg-neutral-300 dark:bg-neutral-600'
          }`}
          style={{ height: `${8 + i * 3}px` }}
        />
      ))}
    </div>
  )
}

interface MeetingData {
  liveSummary: string[]
  decisions: Array<{
    id: string
    text: string
    owner?: string
    timestamp: number
    priority: number
  }>
  actions: Array<{
    id: string
    text: string
    owner?: string
    deadline?: string
    status: string
    timestamp: number
    priority: number
  }>
  openQuestions: Array<{ id: string; text: string; priority: number }>
  loops: Array<{ id: string; topic: string; occurrences: number; suggestion: string }>
  contradictions: Array<{
    id: string
    earlier: string
    later: string
    topic: string
    suggestion: string
  }>
  fullTranscript: string
}

function generateMarkdown(data: MeetingData): string {
  const lines: string[] = []
  const now = new Date()

  lines.push(`# Meeting Notes`)
  lines.push(`*${now.toLocaleDateString()} ${now.toLocaleTimeString()}*`)
  lines.push('')

  if (data.liveSummary.length > 0) {
    lines.push('## Summary')
    data.liveSummary.forEach((point) => {
      lines.push(`- ${point}`)
    })
    lines.push('')
  }

  if (data.decisions.length > 0) {
    lines.push('## Decisions')
    const sortedDecisions = [...data.decisions].sort((a, b) => a.priority - b.priority)
    sortedDecisions.forEach((decision) => {
      const priorityMark = decision.priority === 1 ? '🔴 ' : ''
      const owner = decision.owner ? ` *(${decision.owner})*` : ''
      lines.push(`- ${priorityMark}${decision.text}${owner}`)
    })
    lines.push('')
  }

  if (data.actions.length > 0) {
    lines.push('## Action Items')
    const sortedActions = [...data.actions].sort((a, b) => a.priority - b.priority)
    sortedActions.forEach((action) => {
      const priorityMark = action.priority === 1 ? '🔴 ' : ''
      const owner = action.owner ? `**${action.owner}**: ` : ''
      const deadline = action.deadline ? ` *(due: ${action.deadline})*` : ''
      const status = action.status === 'needs-clarification' ? ' ⚠️' : ''
      lines.push(`- [ ] ${priorityMark}${owner}${action.text}${deadline}${status}`)
    })
    lines.push('')
  }

  if (data.openQuestions.length > 0) {
    lines.push('## Open Questions')
    const sortedQuestions = [...data.openQuestions].sort((a, b) => a.priority - b.priority)
    sortedQuestions.forEach((question) => {
      const priorityMark = question.priority === 1 ? '🔴 ' : question.priority === 3 ? '' : ''
      lines.push(`- ${priorityMark}${question.text}`)
    })
    lines.push('')
  }

  if (data.loops.length > 0) {
    lines.push('## Recurring Topics (Loops)')
    data.loops.forEach((loop) => {
      lines.push(`### ${loop.topic}`)
      lines.push(`- Occurrences: ${loop.occurrences}`)
      lines.push(`- Suggestion: ${loop.suggestion}`)
      lines.push('')
    })
  }

  if (data.contradictions.length > 0) {
    lines.push('## Contradictions Detected')
    data.contradictions.forEach((c) => {
      lines.push(`### ${c.topic}`)
      lines.push(`- **Earlier:** "${c.earlier}"`)
      lines.push(`- **Later:** "${c.later}"`)
      lines.push(`- **Suggestion:** ${c.suggestion}`)
      lines.push('')
    })
  }

  if (data.fullTranscript.trim().length > 0) {
    lines.push('## Full Transcript')
    lines.push('')
    lines.push(data.fullTranscript.trim())
    lines.push('')
  }

  return lines.join('\n')
}

function PlayIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}

function StopIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 6h12v12H6z" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
