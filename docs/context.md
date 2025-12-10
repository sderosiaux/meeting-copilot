# Unasked - Project Context

## What is Unasked?

Unasked is a **macOS Electron desktop application** that listens to meetings in real-time via microphone, transcribes the audio, and provides structured, actionable insights to help participants stay focused and productive.

## Problem Statement

Meetings often suffer from:

- **Lack of clarity**: Decisions made verbally get lost or forgotten
- **Circular discussions**: Same topics rehashed without resolution
- **Missing accountability**: Actions mentioned but no clear owner or deadline
- **Hidden assumptions**: Implicit beliefs that go unchallenged
- **Information overload**: Hard to track what's important in long discussions

## Solution

A real-time AI assistant that:

1. Continuously transcribes meeting audio (Whisper)
2. Analyzes content with Claude to extract structure
3. Surfaces decisions, actions, open questions, and tensions live
4. Helps facilitators keep meetings on track

## Target Users

- **Meeting facilitators** who want to run more effective meetings
- **Team leads** who need to track decisions and actions
- **Remote workers** who want better meeting documentation
- **Anyone** tired of unproductive meetings

## Core Value Proposition

> "Never lose a decision, action, or insight from your meetings again."

## Scope

### In Scope (MVP)

- macOS Electron app
- Microphone audio capture
- Real-time transcription via Whisper
- Claude-powered analysis
- Structured output (decisions, actions, questions, tensions)
- French and English language support
- Ephemeral sessions (no persistence)

### Out of Scope (MVP)

- System audio capture
- Multi-platform support (Windows, Linux)
- Meeting persistence/history
- Export functionality
- Speaker diarization (nice-to-have, not blocking)
- Calendar integration
- Video recording

## Success Metrics

| Metric                       | Target                         |
| ---------------------------- | ------------------------------ |
| Transcription latency        | < 3 seconds from speech        |
| Analysis latency             | < 5 seconds from transcription |
| Decision extraction accuracy | > 90%                          |
| Action extraction accuracy   | > 85%                          |
| App stability                | < 1 crash per 10 hours of use  |

## Constraints

- **Platform**: macOS only (Ventura 13.0+)
- **Privacy**: Audio processed locally or via secure API, never stored
- **Cost**: Optimize API usage for cost-effective operation
- **Languages**: English and French (bilingual in same meeting supported)
