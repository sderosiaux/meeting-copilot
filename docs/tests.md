# Meeting Copilot - Test Plan (TDD)

## Testing Strategy

We follow Test-Driven Development (TDD):

1. Write tests first that define expected behavior
2. Implement code to pass tests
3. Refactor while keeping tests green

### Test Categories

| Category    | Purpose                      | Tools             |
| ----------- | ---------------------------- | ----------------- |
| Unit        | Individual functions/modules | Vitest            |
| Integration | Service interactions         | Vitest + mocks    |
| E2E         | Full user flows              | Playwright        |
| Performance | Latency & resource usage     | Custom benchmarks |

---

## Unit Tests

### Audio Capture Service

```typescript
describe('AudioCaptureService', () => {
  describe('initialization', () => {
    it(
      'Given macOS with microphone permission, When initialized, Then should connect to default input device'
    )
    // Given: macOS system with microphone permission granted
    // When: AudioCaptureService.initialize() is called
    // Then: Should return success and device info

    it('Given no microphone permission, When initialized, Then should throw PermissionDeniedError')
    // Given: macOS system without microphone permission
    // When: AudioCaptureService.initialize() is called
    // Then: Should throw PermissionDeniedError with message about settings

    it('Given no audio input device, When initialized, Then should throw NoDeviceError')
    // Given: System with no microphone connected
    // When: AudioCaptureService.initialize() is called
    // Then: Should throw NoDeviceError
  })

  describe('capture', () => {
    it(
      'Given active capture, When audio is received, Then should emit chunks at correct sample rate'
    )
    // Given: AudioCaptureService is capturing
    // When: Audio data flows from microphone
    // Then: Should emit Float32Array chunks at 16kHz

    it(
      'Given active capture, When device is disconnected, Then should emit DeviceDisconnected event'
    )
    // Given: AudioCaptureService is capturing
    // When: Microphone is unplugged
    // Then: Should emit DeviceDisconnected event and stop gracefully
  })

  describe('voice activity detection', () => {
    it('Given silence, When VAD runs, Then should not trigger transcription')
    // Given: Audio stream with only background noise (< -40dB)
    // When: VAD processes the audio
    // Then: Should not emit speech segments

    it('Given speech followed by 500ms silence, When VAD runs, Then should emit speech segment')
    // Given: Audio with speech then 500ms of silence
    // When: VAD processes the audio
    // Then: Should emit complete speech segment with timestamps
  })
})
```

### Whisper Service

```typescript
describe('WhisperService', () => {
  describe('initialization', () => {
    it('Given valid model path, When initialized, Then should load model successfully')
    // Given: Whisper model file exists at path
    // When: WhisperService.initialize(modelPath) is called
    // Then: Should load model and report ready

    it('Given missing model, When initialized, Then should throw ModelNotFoundError')
    // Given: Model file does not exist
    // When: WhisperService.initialize(modelPath) is called
    // Then: Should throw ModelNotFoundError
  })

  describe('transcription', () => {
    it(
      'Given English audio, When transcribed, Then should return accurate text with language detected'
    )
    // Given: Audio segment with clear English speech
    // When: WhisperService.transcribe(audioData) is called
    // Then: Should return text with language: 'en' and confidence > 0.8

    it('Given French audio, When transcribed, Then should return accurate French text')
    // Given: Audio segment with clear French speech
    // When: WhisperService.transcribe(audioData) is called
    // Then: Should return text with language: 'fr'

    it('Given mixed language audio, When transcribed, Then should handle language switches')
    // Given: Audio with English then French speech
    // When: WhisperService.transcribe(audioData) is called
    // Then: Should return segments with appropriate language tags

    it('Given noisy audio, When transcribed, Then should return text with lower confidence')
    // Given: Audio with speech + significant background noise
    // When: WhisperService.transcribe(audioData) is called
    // Then: Should return text with confidence < 0.7

    it('Given overlapping speakers, When transcribed, Then should mark as unclear')
    // Given: Audio with multiple people speaking simultaneously
    // When: WhisperService.transcribe(audioData) is called
    // Then: Should include [unclear] markers in text
  })
})
```

### Claude Analysis Service

```typescript
describe('ClaudeAnalysisService', () => {
  describe('analysis', () => {
    it(
      'Given transcription with clear decision, When analyzed, Then should extract decision with owner'
    )
    // Given: Transcription "Alice: Ok, we've decided to delay the launch to Q2"
    // When: ClaudeAnalysisService.analyze(transcript) is called
    // Then: decisions should include {text: "Delay launch to Q2", owner: "Alice"}

    it('Given transcription with action, When analyzed, Then should extract action with owner')
    // Given: Transcription "Bob will send the report by Friday"
    // When: ClaudeAnalysisService.analyze(transcript) is called
    // Then: actions should include {text: "Send report", owner: "Bob", deadline: "Friday"}

    it(
      'Given transcription with action but no owner, When analyzed, Then should flag for clarification'
    )
    // Given: Transcription "Someone needs to check the logs"
    // When: ClaudeAnalysisService.analyze(transcript) is called
    // Then: actions should include {text: "Check the logs", status: "needs-clarification"}

    it('Given transcription with open question, When analyzed, Then should extract question')
    // Given: Transcription "But who is going to handle the migration?"
    // When: ClaudeAnalysisService.analyze(transcript) is called
    // Then: openQuestions should include "Who handles the migration?"

    it('Given repeated topic discussion, When analyzed, Then should detect loop')
    // Given: Transcription discussing "budget" 3 times in 10 minutes without resolution
    // When: ClaudeAnalysisService.analyze(transcript) is called
    // Then: loops should include {topic: "budget", suggestion: "..."}

    it('Given contradicting statements, When analyzed, Then should detect contradiction')
    // Given: Transcription "Alice: We have budget. Bob: We don't have budget."
    // When: ClaudeAnalysisService.analyze(transcript) is called
    // Then: contradictions should include relevant conflict details

    it('Given implicit assumption, When analyzed, Then should surface it')
    // Given: Transcription "Since the client will obviously accept this..."
    // When: ClaudeAnalysisService.analyze(transcript) is called
    // Then: implicitAssumptions should include "Client will accept"

    it('Given direct question to copilot, When analyzed, Then should provide response')
    // Given: Transcription "Copilot, can you summarize what we decided?"
    // When: ClaudeAnalysisService.analyze(transcript) is called
    // Then: lastDirectResponse should contain summary of decisions
  })

  describe('error handling', () => {
    it('Given API timeout, When analyzing, Then should retry with backoff')
    // Given: Claude API times out on first attempt
    // When: ClaudeAnalysisService.analyze(transcript) is called
    // Then: Should retry up to 3 times with exponential backoff

    it('Given rate limit error, When analyzing, Then should queue and retry')
    // Given: Claude API returns 429 rate limit error
    // When: ClaudeAnalysisService.analyze(transcript) is called
    // Then: Should queue request and retry after delay
  })
})
```

### Meeting State Manager

```typescript
describe('MeetingStateManager', () => {
  describe('state transitions', () => {
    it('Given idle state, When start() called, Then should transition to recording')
    // Given: MeetingStateManager in 'idle' state
    // When: start() is called
    // Then: state.status should be 'recording'

    it('Given recording state, When pause() called, Then should transition to paused')
    // Given: MeetingStateManager in 'recording' state
    // When: pause() is called
    // Then: state.status should be 'paused', state preserved

    it('Given paused state, When resume() called, Then should transition to recording')
    // Given: MeetingStateManager in 'paused' state with existing data
    // When: resume() is called
    // Then: state.status should be 'recording', previous state preserved

    it('Given any state, When reset() called, Then should clear all state')
    // Given: MeetingStateManager with accumulated data
    // When: reset() is called
    // Then: All state should be cleared to initial values
  })

  describe('data accumulation', () => {
    it('Given new transcription chunk, When added, Then should append to buffer')
    // Given: MeetingStateManager with existing transcription
    // When: addTranscriptionChunk(chunk) is called
    // Then: chunk should be appended to transcriptionBuffer

    it('Given analysis results, When merged, Then should update entities correctly')
    // Given: MeetingStateManager with some decisions
    // When: mergeAnalysisResults(newResults) is called
    // Then: New decisions should be added, duplicates should be avoided

    it('Given duplicate decision, When merged, Then should not create duplicate')
    // Given: Decision "Launch in Q2" already exists
    // When: Analysis returns same decision
    // Then: Should not add duplicate, should update timestamp
  })

  describe('context management', () => {
    it('Given long meeting, When buffer exceeds limit, Then should summarize old content')
    // Given: Transcription buffer > 10 minutes
    // When: New chunk is added
    // Then: Older chunks should be summarized and compacted
  })
})
```

---

## Integration Tests

### Audio to Transcription Pipeline

```typescript
describe('Audio to Transcription Pipeline', () => {
  it('Given microphone audio, When pipeline runs, Then should produce transcription within 3s')
  // Given: Active microphone input with speech
  // When: Full pipeline (capture -> VAD -> Whisper) runs
  // Then: TranscriptionChunk should be emitted within 3 seconds of speech end

  it('Given language switch mid-meeting, When pipeline runs, Then should detect and handle switch')
  // Given: Meeting starts in English, switches to French
  // When: Pipeline processes both segments
  // Then: Each segment should have correct language tag
})
```

### Transcription to Analysis Pipeline

```typescript
describe('Transcription to Analysis Pipeline', () => {
  it('Given multiple chunks, When batched, Then should send efficient API request')
  // Given: 5 transcription chunks in 10 seconds
  // When: Analysis pipeline processes them
  // Then: Should batch into single Claude API request

  it('Given analysis result, When parsed, Then should update UI state correctly')
  // Given: Claude returns structured meeting analysis
  // When: Result is parsed and merged
  // Then: React state should update with new decisions/actions
})
```

### Full Meeting Flow

```typescript
describe('Full Meeting Flow', () => {
  it('Given 5-minute mock meeting, When processed, Then should extract all entities')
  // Given: Pre-recorded 5-minute meeting audio with known decisions/actions
  // When: Full system processes the audio
  // Then: Should extract expected decisions, actions, questions

  it('Given meeting with Copilot question, When processed, Then should respond appropriately')
  // Given: Meeting audio with "Copilot, summarize the decisions"
  // When: Full system processes the audio
  // Then: UI should show direct response with decision summary
})
```

---

## End-to-End Tests (Playwright)

```typescript
describe('Meeting Copilot E2E', () => {
  describe('application lifecycle', () => {
    it('Given app launch, When loaded, Then should show idle state with Start button')
    // Given: Fresh app launch
    // When: Main window loads
    // Then: Should show "Start" button, gray status dot, empty panels

    it('Given Start clicked, When permission granted, Then should show recording state')
    // Given: App in idle state
    // When: User clicks "Start" and grants mic permission
    // Then: Should show red pulsing dot, "Pause" button visible

    it('Given recording, When Pause clicked, Then should pause and preserve state')
    // Given: App recording with some data displayed
    // When: User clicks "Pause"
    // Then: Should show yellow dot, data preserved, "Resume" visible

    it('Given recording, When Reset clicked, Then should clear all and return to idle')
    // Given: App recording with decisions/actions displayed
    // When: User clicks "Reset"
    // Then: Should clear all panels, return to idle state
  })

  describe('real-time updates', () => {
    it('Given speech detected, When transcribed, Then should update live summary')
    // Given: App recording
    // When: User speaks into microphone
    // Then: RESUME_LIVE panel should update within 5 seconds

    it('Given decision spoken, When analyzed, Then should appear in Decisions panel')
    // Given: App recording
    // When: User says "Ok, we've decided to launch next week"
    // Then: Decisions panel should show new decision within 10 seconds
  })

  describe('error handling', () => {
    it('Given microphone disconnected, When recording, Then should show error and recover')
    // Given: App actively recording
    // When: Microphone is disconnected
    // Then: Should show error message, attempt to reconnect

    it('Given API failure, When analyzing, Then should show retry message')
    // Given: App sending analysis request
    // When: Claude API fails
    // Then: Should show "Reconnecting..." and retry
  })
})
```

---

## Performance Tests

```typescript
describe('Performance', () => {
  describe('latency', () => {
    it('Should transcribe speech within 3 seconds of speech end')
    // Measure: Time from speech end to transcription callback
    // Target: p95 < 3000ms

    it('Should update UI within 5 seconds of transcription')
    // Measure: Time from transcription to React state update
    // Target: p95 < 5000ms
  })

  describe('resources', () => {
    it('Should use less than 500MB RAM during 2-hour meeting')
    // Measure: Memory usage over simulated 2-hour session
    // Target: Peak < 500MB, no memory leaks

    it('Should use less than 30% CPU during active processing')
    // Measure: CPU usage during transcription + analysis
    // Target: Sustained < 30%

    it('Should use less than 5% CPU when paused')
    // Measure: CPU usage in paused state
    // Target: < 5%
  })

  describe('scalability', () => {
    it('Should handle meetings up to 4 hours without degradation')
    // Measure: Latency and memory at 1h, 2h, 3h, 4h marks
    // Target: No significant degradation
  })
})
```

---

## Test Data

### Mock Audio Files

| File                          | Content                 | Purpose             |
| ----------------------------- | ----------------------- | ------------------- |
| `clear-english-5min.wav`      | Clear English meeting   | Basic transcription |
| `clear-french-5min.wav`       | Clear French meeting    | French support      |
| `mixed-language-5min.wav`     | English + French        | Language switching  |
| `noisy-meeting-5min.wav`      | Office background noise | Noise handling      |
| `overlapping-speech-1min.wav` | Multiple speakers       | Overlap detection   |

### Mock Transcriptions

```typescript
// fixtures/transcriptions.ts
export const decisionMeeting = [
  { text: "Ok, so we've decided to push the launch to Q2", speaker: 'Alice', timestamp: 0 },
  { text: 'Bob will prepare the updated timeline by Friday', speaker: 'Alice', timestamp: 5000 },
  { text: "Who's handling the customer communication?", speaker: 'Carol', timestamp: 10000 }
]

export const loopMeeting = [
  { text: 'We need to talk about the budget', speaker: 'Alice', timestamp: 0 },
  { text: 'The budget is the main issue here', speaker: 'Bob', timestamp: 60000 },
  { text: 'Can we get back to the budget question?', speaker: 'Alice', timestamp: 180000 },
  { text: 'I think budget is blocking us', speaker: 'Carol', timestamp: 300000 }
]
```

---

## Test Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run performance tests
npm run test:perf

# Run with coverage
npm run test:coverage
```

---

## Acceptance Criteria

A feature is complete when:

1. All unit tests pass
2. All integration tests pass
3. E2E tests cover the happy path
4. Performance targets are met
5. No regressions in existing tests
