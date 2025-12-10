import { useEffect } from 'react'
import { useMeetingStore } from '../stores/meetingStore'

/**
 * Hook to sync meeting state from main process to renderer.
 */
export function useMeetingSync(): void {
  const updateAnalysis = useMeetingStore((state) => state.updateAnalysis)

  useEffect(() => {
    // Subscribe to state updates from main process
    const unsubscribeState = window.api?.onMeetingStateUpdate((state: unknown) => {
      const meetingState = state as {
        status: 'idle' | 'recording' | 'paused' | 'processing'
        startTime: number | null
        liveSummary: string[]
        decisions: Array<{
          id: string
          text: string
          owner?: string
          timestamp: number
          priority: 1 | 2 | 3
        }>
        actions: Array<{
          id: string
          text: string
          owner?: string
          deadline?: string
          status: 'identified' | 'needs-clarification'
          timestamp: number
          priority: 1 | 2 | 3
        }>
        openQuestions: Array<{ id: string; text: string; priority: 1 | 2 | 3 }>
        loops: Array<{
          id: string
          topic: string
          occurrences: number
          suggestion: string
          firstDetected: number
        }>
        contradictions: Array<{
          id: string
          earlier: string
          later: string
          topic: string
          suggestion: string
        }>
        implicitAssumptions: string[]
        ambiguities: Array<{
          id: string
          point: string
          clarifyingQuestion: string
        }>
        lastDirectResponse: string | null
        detectedLanguage: 'en' | 'fr' | 'mixed'
      }

      updateAnalysis({
        status: meetingState.status,
        startTime: meetingState.startTime,
        liveSummary: meetingState.liveSummary,
        decisions: meetingState.decisions,
        actions: meetingState.actions,
        openQuestions: meetingState.openQuestions,
        loops: meetingState.loops,
        contradictions: meetingState.contradictions,
        implicitAssumptions: meetingState.implicitAssumptions,
        ambiguities: meetingState.ambiguities,
        lastDirectResponse: meetingState.lastDirectResponse,
        detectedLanguage: meetingState.detectedLanguage
      })
    })

    return () => {
      unsubscribeState?.()
    }
  }, [updateAnalysis])
}
