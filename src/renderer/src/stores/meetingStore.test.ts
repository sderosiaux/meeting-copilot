import { describe, it, expect, beforeEach } from 'vitest'
import { useMeetingStore } from './meetingStore'

describe('MeetingStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useMeetingStore.setState({
      status: 'idle',
      startTime: null,
      transcriptionBuffer: [],
      fullTranscript: '',
      liveSummary: [],
      decisions: [],
      actions: [],
      openQuestions: [],
      loops: [],
      contradictions: [],
      implicitAssumptions: [],
      ambiguities: [],
      lastDirectResponse: null,
      detectedLanguage: 'en',
      lastUpdateTime: 0
    })
  })

  describe('state transitions', () => {
    it('Given idle state, When start() called, Then should transition to recording', () => {
      // Given
      expect(useMeetingStore.getState().status).toBe('idle')

      // When
      useMeetingStore.getState().start()

      // Then
      expect(useMeetingStore.getState().status).toBe('recording')
      expect(useMeetingStore.getState().startTime).not.toBeNull()
    })

    it('Given recording state, When pause() called, Then should transition to paused', () => {
      // Given
      useMeetingStore.getState().start()
      expect(useMeetingStore.getState().status).toBe('recording')

      // When
      useMeetingStore.getState().pause()

      // Then
      expect(useMeetingStore.getState().status).toBe('paused')
    })

    it('Given paused state, When resume() called, Then should transition to recording', () => {
      // Given
      useMeetingStore.getState().start()
      useMeetingStore.getState().pause()
      const startTime = useMeetingStore.getState().startTime

      // When
      useMeetingStore.getState().resume()

      // Then
      expect(useMeetingStore.getState().status).toBe('recording')
      expect(useMeetingStore.getState().startTime).toBe(startTime) // Preserved
    })

    it('Given any state, When reset() called, Then should clear all state', () => {
      // Given
      useMeetingStore.getState().start()
      useMeetingStore.getState().addTranscriptionChunk({
        text: 'Test transcription',
        timestamp: Date.now(),
        duration: 1000,
        confidence: 0.9,
        language: 'en'
      })

      // When
      useMeetingStore.getState().reset()

      // Then
      const state = useMeetingStore.getState()
      expect(state.status).toBe('idle')
      expect(state.startTime).toBeNull()
      expect(state.transcriptionBuffer).toHaveLength(0)
      expect(state.fullTranscript).toBe('')
    })
  })

  describe('data accumulation', () => {
    it('Given new transcription chunk, When added, Then should append to buffer', () => {
      // Given
      const chunk = {
        text: 'Hello world',
        timestamp: Date.now(),
        duration: 1000,
        confidence: 0.95,
        language: 'en' as const
      }

      // When
      useMeetingStore.getState().addTranscriptionChunk(chunk)

      // Then
      const state = useMeetingStore.getState()
      expect(state.transcriptionBuffer).toHaveLength(1)
      expect(state.transcriptionBuffer[0].text).toBe('Hello world')
      expect(state.fullTranscript).toContain('Hello world')
    })

    it('Given analysis results, When merged, Then should update entities correctly', () => {
      // Given
      const decision = {
        id: '1',
        text: 'Launch in Q2',
        owner: 'Alice',
        timestamp: Date.now(),
        priority: 2 as const
      }

      // When
      useMeetingStore.getState().updateAnalysis({
        decisions: [decision],
        liveSummary: ['Discussing Q2 launch']
      })

      // Then
      const state = useMeetingStore.getState()
      expect(state.decisions).toHaveLength(1)
      expect(state.decisions[0].text).toBe('Launch in Q2')
      expect(state.liveSummary).toContain('Discussing Q2 launch')
    })
  })
})
