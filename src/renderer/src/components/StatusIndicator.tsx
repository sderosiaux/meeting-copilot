import type { MeetingStatus } from '../stores/meetingStore'

interface StatusIndicatorProps {
  status: MeetingStatus
}

export function StatusIndicator({ status }: StatusIndicatorProps): React.JSX.Element {
  const config = getStatusConfig(status)

  return (
    <div className="flex items-center gap-2 no-drag">
      <div className={`w-2.5 h-2.5 rounded-full ${config.color} ${config.animation}`} />
      <span className="text-sm text-neutral-500 dark:text-neutral-400">{config.label}</span>
    </div>
  )
}

function getStatusConfig(status: MeetingStatus): {
  color: string
  animation: string
  label: string
} {
  switch (status) {
    case 'recording':
      return {
        color: 'bg-red-500',
        animation: 'animate-pulse-recording',
        label: 'Recording'
      }
    case 'paused':
      return {
        color: 'bg-yellow-500',
        animation: '',
        label: 'Paused'
      }
    case 'processing':
      return {
        color: 'bg-blue-500',
        animation: 'animate-pulse',
        label: 'Processing'
      }
    case 'idle':
    default:
      return {
        color: 'bg-neutral-400',
        animation: '',
        label: 'Ready'
      }
  }
}
