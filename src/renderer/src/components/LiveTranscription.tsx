import { useState, useEffect, useRef } from 'react'
import { useMeetingStore } from '../stores/meetingStore'

export function LiveTranscription(): React.JSX.Element {
  const transcriptionBuffer = useMeetingStore((state) => state.transcriptionBuffer)
  const addTranscriptionChunk = useMeetingStore((state) => state.addTranscriptionChunk)
  const [interim, setInterim] = useState<string>('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = window.api?.onTranscriptionUpdate((chunk: unknown) => {
      const result = chunk as {
        text: string
        timestamp: number
        isFinal: boolean
        language: 'en' | 'fr'
      }
      if (result.isFinal) {
        addTranscriptionChunk({
          text: result.text,
          timestamp: result.timestamp,
          duration: 0,
          confidence: 1,
          language: result.language
        })
        setInterim('')
      } else {
        setInterim(result.text)
      }
    })
    return () => unsubscribe?.()
  }, [addTranscriptionChunk])

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [transcriptionBuffer, interim])

  const hasContent = transcriptionBuffer.length > 0 || interim

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
          Transcription
        </h3>
      </div>

      <div
        ref={containerRef}
        className="h-32 overflow-y-auto text-sm text-neutral-700 dark:text-neutral-300 space-y-1"
      >
        {!hasContent ? (
          <p className="text-neutral-400 dark:text-neutral-500 italic">Waiting for speech...</p>
        ) : (
          <>
            {transcriptionBuffer.map((segment, idx) => (
              <span
                key={`${segment.timestamp}-${idx}`}
                className={segment.language === 'fr' ? 'text-blue-600 dark:text-blue-400' : ''}
              >
                {segment.text}{' '}
              </span>
            ))}
            {interim && (
              <span className="text-neutral-400 dark:text-neutral-500 italic">{interim}</span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
