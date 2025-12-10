# Unasked - Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Electron App (Main Process)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │   Audio      │───▶│  Whisper     │───▶│   Claude Analysis    │  │
│  │   Capture    │    │  (local)     │    │   (API)              │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│         │                   │                      │                │
│         ▼                   ▼                      ▼                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Meeting State Manager                      │  │
│  │  - Transcription buffer                                       │  │
│  │  - Extracted entities (decisions, actions, questions)         │  │
│  │  - Loop/tension detection state                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                      │
├──────────────────────────────┼──────────────────────────────────────┤
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Renderer Process (React)                   │  │
│  │  - Live summary panel                                         │  │
│  │  - Decisions/Actions lists                                    │  │
│  │  - Tension alerts                                             │  │
│  │  - Controls                                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer             | Technology                         | Rationale                            |
| ----------------- | ---------------------------------- | ------------------------------------ |
| Desktop Framework | Electron 28+                       | Cross-platform (future), native APIs |
| Frontend          | React 18 + TypeScript              | Component-based, type safety         |
| Styling           | Tailwind CSS                       | Rapid UI development, design system  |
| State Management  | Zustand                            | Lightweight, TypeScript-friendly     |
| Audio Capture     | Web Audio API + native node module | Low latency mic access               |
| Transcription     | Whisper.cpp (local)                | Privacy, no network dependency       |
| Analysis          | Claude API (Anthropic)             | Best reasoning for meeting analysis  |
| Build             | Vite + electron-builder            | Fast dev, reliable packaging         |

## Component Architecture

### Main Process

```typescript
// src/main/index.ts
├── AudioCaptureService     // Handles microphone input
├── WhisperService          // Local transcription
├── ClaudeService           // API calls for analysis
├── MeetingStateManager     // Central state orchestration
└── IPCBridge               // Main <-> Renderer communication
```

### Renderer Process

```typescript
// src/renderer/
├── App.tsx
├── components/
│   ├── LiveSummary.tsx
│   ├── DecisionsList.tsx
│   ├── ActionsList.tsx
│   ├── OpenQuestions.tsx
│   ├── TensionAlerts.tsx
│   ├── DirectResponse.tsx
│   ├── Controls.tsx
│   └── StatusIndicator.tsx
├── hooks/
│   ├── useMeetingState.ts
│   └── useAudioStatus.ts
├── stores/
│   └── meetingStore.ts
└── styles/
    └── theme.ts
```

## Data Flow

### 1. Audio Capture Pipeline

```
Microphone
    │
    ▼ (PCM 16kHz mono)
AudioWorklet (real-time processing)
    │
    ▼ (Float32Array chunks)
Ring Buffer (10 second window)
    │
    ▼ (when VAD detects speech end)
Whisper.cpp
    │
    ▼ (TranscriptionChunk)
Meeting State Manager
```

### 2. Analysis Pipeline

```
TranscriptionChunk
    │
    ▼ (accumulate 5-10 seconds)
Chunk Buffer
    │
    ▼ (batch when ready)
Claude API Request
    │
    ├── System prompt (meeting copilot instructions)
    ├── Conversation history (recent transcription)
    └── Current state (decisions, actions so far)
    │
    ▼ (structured response)
Response Parser
    │
    ▼ (validated entities)
Meeting State Manager
    │
    ▼ (IPC event)
React UI
```

## Key Interfaces

### Meeting State

```typescript
interface MeetingState {
  status: 'idle' | 'recording' | 'paused' | 'processing'
  startTime: number | null

  // Transcription
  transcriptionBuffer: TranscriptionChunk[]
  fullTranscript: string

  // Extracted entities
  liveSummary: string[]
  decisions: Decision[]
  actions: Action[]
  openQuestions: string[]

  // Tension detection
  loops: Loop[]
  contradictions: Contradiction[]

  // Assumptions
  implicitAssumptions: string[]
  ambiguities: Ambiguity[]

  // Direct Q&A
  lastDirectResponse: string | null

  // Metadata
  detectedLanguage: 'en' | 'fr' | 'mixed'
  lastUpdateTime: number
}

interface Decision {
  id: string
  text: string
  owner?: string
  timestamp: number
  impact?: string
}

interface Action {
  id: string
  text: string
  owner?: string
  deadline?: string
  status: 'identified' | 'needs-clarification'
  timestamp: number
}

interface Loop {
  id: string
  topic: string
  occurrences: number
  suggestion: string
  firstDetected: number
}

interface Contradiction {
  id: string
  personA: string
  statementA: string
  personB: string
  statementB: string
  topic: string
  resolution: string
}

interface Ambiguity {
  id: string
  point: string
  clarifyingQuestion: string
}
```

## Whisper Integration

### Local Whisper Setup

Using `whisper.cpp` via Node.js native addon for:

- Privacy (audio never leaves device)
- Low latency (no network round-trip)
- Offline capability

```typescript
interface WhisperConfig {
  model: 'tiny' | 'base' | 'small' | 'medium' // Default: 'small'
  language: 'auto' | 'en' | 'fr' // Default: 'auto'
  translateToEnglish: boolean // Default: false
  vadThreshold: number // Default: 0.5
  maxSegmentLength: number // Default: 30 (seconds)
}
```

### Model Selection

| Model  | Size  | Speed     | Accuracy | Recommended For   |
| ------ | ----- | --------- | -------- | ----------------- |
| tiny   | 75MB  | Very fast | Basic    | Testing only      |
| base   | 142MB | Fast      | Good     | Quick meetings    |
| small  | 466MB | Medium    | Better   | Default choice    |
| medium | 1.5GB | Slow      | Best     | Critical meetings |

## Claude API Integration

### Request Structure

```typescript
interface ClaudeRequest {
  model: 'claude-sonnet-4-20250514'
  max_tokens: 2000
  system: string // Meeting copilot system prompt
  messages: Message[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}
```

### System Prompt Strategy

The system prompt includes:

1. Role definition (Unasked behavior)
2. Output format specification (all 7 sections)
3. Current meeting state (decisions, actions so far)
4. Style rules (concise, action-oriented)

### Token Optimization

- Sliding window for transcription (last 10 minutes)
- Summarize older content to reduce tokens
- Batch multiple chunks before API call
- Target: < 4000 input tokens per request

## Audio Capture Details

### macOS Permissions

Required entitlements:

```xml
<key>com.apple.security.device.audio-input</key>
<true/>
```

### Voice Activity Detection (VAD)

Simple energy-based VAD:

1. Calculate RMS energy per frame
2. Compare to adaptive threshold
3. Trigger transcription on speech end + 500ms silence

## Error Handling

### Graceful Degradation

| Failure           | Behavior                                       |
| ----------------- | ---------------------------------------------- |
| Whisper crash     | Restart, show "Transcription restarting..."    |
| Claude API error  | Retry 3x with backoff, then queue locally      |
| Audio device lost | Show "Microphone disconnected", auto-reconnect |
| Memory pressure   | Compact history, reduce buffer size            |

### Recovery

- Auto-save state every 30 seconds (in-memory checkpoint)
- On crash recovery, offer to restore last session

## Security Considerations

- Audio processed locally (Whisper)
- Transcription sent to Claude API over HTTPS
- No audio stored to disk
- API key stored in system keychain (not config files)
- Transcription buffer cleared on app close

## Performance Targets

| Metric                | Target  | Measurement                  |
| --------------------- | ------- | ---------------------------- |
| Audio capture latency | < 50ms  | Time from speech to buffer   |
| Transcription latency | < 2s    | Time from speech end to text |
| Analysis latency      | < 5s    | Time from text to UI update  |
| Memory usage          | < 500MB | During 2-hour meeting        |
| CPU usage (idle)      | < 5%    | When paused                  |
| CPU usage (active)    | < 30%   | During processing            |
