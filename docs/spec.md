# Unasked - Product Specification

## Overview

Unasked is a real-time meeting assistant that processes audio input and provides structured, actionable meeting insights.

---

## Input

### Audio Source

- **Type**: Microphone input only
- **Format**: PCM audio, 16kHz sample rate, mono
- **Capture**: macOS native audio APIs via Electron

### Transcription Chunks

After processing through Whisper, the system receives:

```typescript
interface TranscriptionChunk {
  text: string // Transcribed text
  timestamp: number // Unix timestamp (ms)
  duration: number // Segment duration (ms)
  confidence: number // 0-1 confidence score
  language: 'en' | 'fr' // Detected language
  speaker?: string // Optional speaker ID (if diarization available)
}
```

---

## Output Format

The system produces a structured response after each meaningful chunk or batch of chunks.

### 1. RESUME_LIVE (Live Summary)

2-4 bullet points describing:

- Current topics under discussion
- Recent changes (new ideas, direction shifts, new risks)

```
RESUME_LIVE:
- Le groupe discute de la priorisation des features pour Q1.
- Alice veut garder le scope initial, Bob pousse pour réduire.
- Le besoin métier principal: réduire le temps d'onboarding client.
```

### 2. DECISIONS

All explicit decisions heard since meeting start.

```
DECISIONS:
- [Decision] - [Person/team] - [Optional: date/impact]
```

If none: `DECISIONS: Aucune décision claire pour le moment.`

### 3. ACTIONS

Concrete actions with owner and deadline.

```
ACTIONS:
- [Owner] fera [action] pour [date/horizon].
- A clarifier: action mentionnée sans responsable ni échéance: "[text]"
```

### 4. QUESTIONS_OUVERTES (Open Questions)

Unresolved questions that risk circular discussion.

```
QUESTIONS_OUVERTES:
- [Question 1]
- [Question 2]
```

### 5. BOUCLES_ET_TENSIONS (Loops & Tensions)

Detects:

- **Loops**: Same topic discussed repeatedly without progress
- **Contradictions**: Conflicting statements between participants

```
BOUCLES_ET_TENSIONS:
- Boucle: [explanation]
  Suggestion: "[phrase for facilitator]"
- Contradiction: [A dit X], [B dit Y] à propos de [topic].
  Ce qui manque pour trancher: [info needed]
```

If nothing notable: `BOUCLES_ET_TENSIONS: Rien de particulier détecté.`

### 6. HYPOTHESES_ET_ZONE_DE_FLOU (Assumptions & Ambiguity)

Detects:

- **Implicit assumptions**: Unstated beliefs
- **Ambiguity**: Undefined terms or unclear objectives

```
HYPOTHESES_ET_ZONE_DE_FLOU:
- Hypothèse implicite: "[assumption]"
- Point flou: "[unclear point]" - Suggestion: "[clarifying question]"
```

### 7. REPONSE_EN_DIRECT (Direct Response)

Triggered when participants address the copilot directly.

```
REPONSE_EN_DIRECT:
- [Short, clear response in 3-6 lines max]
```

If no direct question: `REPONSE_EN_DIRECT: Aucune question directe reçue.`

---

## Processing Rules

### What the system MUST do:

1. Update state with each new transcription chunk
2. Maintain full meeting context for accurate analysis
3. Respond in the same language as the meeting (or mixed if bilingual)
4. Preserve exact quotes when attributing decisions/actions
5. Surface implicit information that helps clarify the meeting

### What the system MUST NOT do:

1. Invent decisions, actions, or agreements not explicitly stated
2. Judge or evaluate participants personally
3. Store audio or transcription beyond the session
4. Interrupt or speak (text-only output)

### Processing Triggers

- **Batch processing**: Accumulate chunks for ~5 seconds before analysis
- **Immediate processing**: When direct question detected ("Copilot, ...")
- **Summary refresh**: Every 30 seconds minimum, even if no new input

---

## User Interface

### Main Window

```
┌─────────────────────────────────────────────────────────────┐
│  Unasked                              ● Recording   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RESUME_LIVE                                                │
│  ────────────                                               │
│  • Current topic: Q1 feature prioritization                 │
│  • Tension between scope preservation vs reduction          │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  DECISIONS (2)           ACTIONS (3)                        │
│  ──────────────          ──────────                         │
│  • Feature X cut         • Alice: spec by Friday            │
│  • Q1 deadline firm      • Bob: budget review               │
│                          • TBD: customer interviews         │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  QUESTIONS OUVERTES (2)                                     │
│  ──────────────────────                                     │
│  • How to handle legacy customers?                          │
│  • Who owns the migration?                                  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ⚠ BOUCLES DETECTEES                                        │
│  ────────────────────                                       │
│  Budget discussion recurring (3x in 10 min)                 │
│  → Suggestion: "Peut-on trancher le budget maintenant       │
│    ou identifier ce qui manque pour décider?"               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Start] [Pause] [Reset]                     Duration: 45m  │
└─────────────────────────────────────────────────────────────┘
```

### States

| State      | Indicator       | Behavior                        |
| ---------- | --------------- | ------------------------------- |
| Idle       | Gray dot        | Waiting to start                |
| Recording  | Red pulsing dot | Capturing and processing        |
| Paused     | Yellow dot      | Capture paused, state preserved |
| Processing | Blue spinner    | Analyzing chunk                 |

### Controls

- **Start**: Begin audio capture and processing
- **Pause**: Pause capture, keep state
- **Reset**: Clear all state, start fresh

---

## Edge Cases

### Audio Issues

- **No audio detected**: Show "No audio detected. Check microphone permissions."
- **Poor quality**: Show "Audio quality low. Transcription may be affected."
- **Language switch**: Handle mid-meeting language changes gracefully

### Content Issues

- **Long silence**: Don't generate empty updates
- **Crosstalk**: Mark as "[unclear/overlapping speech]"
- **Technical jargon**: Preserve as-is, don't interpret

### System Issues

- **API timeout**: Retry with exponential backoff, show "Reconnecting..."
- **High latency**: Buffer and batch, show "Processing delay..."
- **Memory pressure**: Summarize and compact older context

---

## Localization

The UI supports:

- French (primary)
- English

Detection is automatic based on transcription language.
Mixed-language meetings show output in the dominant language.
