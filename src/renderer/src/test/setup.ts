import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.api for tests
Object.defineProperty(window, 'api', {
  value: {
    startMeeting: vi.fn(),
    pauseMeeting: vi.fn(),
    resumeMeeting: vi.fn(),
    resetMeeting: vi.fn(),
    getAudioDevices: vi.fn(),
    setAudioDevice: vi.fn(),
    onMeetingStateUpdate: vi.fn(() => vi.fn()),
    onTranscriptionUpdate: vi.fn(() => vi.fn()),
    onAudioLevel: vi.fn(() => vi.fn()),
    onError: vi.fn(() => vi.fn()),
    sendAudioData: vi.fn()
  },
  writable: true
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})
