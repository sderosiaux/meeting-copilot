# Meeting Copilot - Architecture Decision Records

## ADR-001: Electron for Desktop Application

**Date**: 2024-12-09

**Decision**: Use Electron as the desktop application framework.

**Context**:
Need a desktop app that can access native audio APIs and provide a rich UI. Options considered:

- Electron (JS/TS)
- Tauri (Rust + web frontend)
- Native Swift/macOS

**Options Considered**:
| Option | Pros | Cons |
|--------|------|------|
| Electron | Large ecosystem, easier dev, web tech | Larger bundle, higher memory |
| Tauri | Smaller bundle, native perf | Smaller ecosystem, Rust learning curve |
| Native Swift | Best perf, smallest bundle | macOS only forever, different skillset |

**Reason**:
Electron chosen for faster development with existing web skills. Future-proofs for Windows/Linux expansion. Memory overhead acceptable for this use case.

**Consequences**:

- Bundle size ~150MB+
- Memory baseline ~100MB
- Access to npm ecosystem
- Familiar web development patterns

---

## ADR-002: Local Whisper for Transcription

**Date**: 2024-12-09

**Decision**: Use whisper.cpp running locally for speech-to-text transcription.

**Context**:
Need real-time speech transcription with good accuracy in English and French.

**Options Considered**:
| Option | Pros | Cons |
|--------|------|------|
| OpenAI Whisper API | Easy setup, great accuracy | Network latency, cost, privacy |
| Deepgram | Real-time optimized, low latency | Cost, requires internet |
| AssemblyAI | Good accuracy, real-time | Cost, requires internet |
| whisper.cpp (local) | Privacy, offline, no cost | CPU usage, setup complexity |

**Reason**:
Privacy is critical - meeting audio should never leave the device unless necessary. Local processing eliminates:

- Network latency concerns
- Per-minute API costs
- Privacy concerns about sensitive meeting content

**Consequences**:

- Higher CPU usage during transcription
- Need to bundle model files (~466MB for 'small')
- Slightly lower accuracy than cloud options
- Works offline

---

## ADR-003: Claude API for Meeting Analysis

**Date**: 2024-12-09

**Decision**: Use Claude API (Anthropic) for meeting analysis and entity extraction.

**Context**:
Need an LLM to analyze transcription and extract structured meeting insights (decisions, actions, loops, etc.).

**Options Considered**:
| Option | Pros | Cons |
|--------|------|------|
| Claude API | Best reasoning, long context, reliable | Cost per token, requires internet |
| GPT-4 API | Great reasoning | Cost, sometimes less reliable |
| Local LLM (Ollama) | Free, private | Lower quality, high resource usage |
| Fine-tuned small model | Fast, private | Development effort, limited capability |

**Reason**:
Claude excels at nuanced text analysis and following complex structured output instructions. The meeting analysis prompt requires sophisticated reasoning that local models cannot match reliably.

**Consequences**:

- Requires internet connection for analysis
- Per-token API costs (~$0.003 per 1k input tokens)
- Transcription is still local (privacy preserved)
- Dependent on Anthropic API availability

---

## ADR-004: Ephemeral Storage Only (MVP)

**Date**: 2024-12-09

**Decision**: No persistent storage in MVP. All meeting data is ephemeral.

**Context**:
Meeting data (transcription, decisions, actions) could be persisted for later review.

**Options Considered**:
| Option | Pros | Cons |
|--------|------|------|
| Full persistence | History, searchable | Privacy concerns, complexity |
| Optional export | User control | Still creates permanent records |
| Ephemeral only | Simple, private | No history |

**Reason**:
For MVP, simplicity wins. Avoids:

- Database setup and migrations
- Privacy policy complexity
- Data retention questions
- Export format decisions

Users who want records can screenshot or manually copy.

**Consequences**:

- All data lost on app close or reset
- No meeting history feature
- Simpler implementation
- Can add persistence later if needed

---

## ADR-005: React + Zustand for Frontend

**Date**: 2024-12-09

**Decision**: Use React with Zustand for state management in the renderer process.

**Context**:
Need a reactive UI that updates in real-time as meeting analysis arrives.

**Options Considered**:
| Option | Pros | Cons |
|--------|------|------|
| React + Redux | Industry standard | Boilerplate heavy |
| React + Zustand | Simple, TypeScript-friendly | Less ecosystem |
| Vue 3 + Pinia | Great DX | Team less familiar |
| Svelte | Small bundle, great DX | Less ecosystem |

**Reason**:
React is familiar and well-supported in Electron. Zustand provides simple, type-safe state management without Redux boilerplate. Meeting state is straightforward enough that Redux's power isn't needed.

**Consequences**:

- Standard React patterns
- Simple store setup
- Easy to test
- Good TypeScript integration

---

## ADR-006: Batch Analysis with 5-10 Second Windows

**Date**: 2024-12-09

**Decision**: Batch transcription chunks and analyze every 5-10 seconds rather than per-utterance.

**Context**:
Could analyze after each transcription chunk or batch multiple chunks together.

**Options Considered**:
| Option | Pros | Cons |
|--------|------|------|
| Per-chunk analysis | More real-time | More API calls, higher cost |
| 5-10 second batching | Cost efficient, better context | Slight delay |
| 30+ second batching | Very cost efficient | Too much delay |

**Reason**:
5-10 second batching provides good balance:

- Reduces API calls by ~80%
- Provides enough context for accurate analysis
- Still feels "real-time" to users
- Matches natural conversation rhythm

**Consequences**:

- UI updates every 5-10 seconds during active speech
- Lower API costs
- Need buffer management logic
- Acceptable latency for meeting context

---

## ADR-007: Whisper 'small' Model as Default

**Date**: 2024-12-09

**Decision**: Use the 'small' whisper model (466MB) as the default.

**Context**:
Whisper offers multiple model sizes with accuracy/speed tradeoffs.

**Options Considered**:
| Model | Size | Speed | Accuracy |
|-------|------|-------|----------|
| tiny | 75MB | Very fast | Basic |
| base | 142MB | Fast | Good |
| small | 466MB | Medium | Better |
| medium | 1.5GB | Slow | Best |

**Reason**:
'small' provides the best balance for meeting transcription:

- Accurate enough for decision/action extraction
- Fast enough for near-real-time
- Reasonable bundle size
- Handles French and English well

**Consequences**:

- 466MB model bundled with app
- Good accuracy for most meetings
- May struggle with heavy accents
- Can offer model selection for power users later

---

## ADR-008: macOS Only for MVP

**Date**: 2024-12-09

**Decision**: Target macOS only for the initial release.

**Context**:
Electron supports Windows, macOS, and Linux. Cross-platform adds complexity.

**Options Considered**:
| Option | Pros | Cons |
|--------|------|------|
| macOS only | Simpler audio APIs, focused testing | Limited audience |
| macOS + Windows | Larger audience | More testing, audio differences |
| All platforms | Maximum reach | Complex audio handling per platform |

**Reason**:
macOS first because:

- Core Audio APIs are well-documented
- Single platform for focused QA
- Target audience (remote workers, tech teams) heavily uses macOS
- Can expand to Windows after MVP validation

**Consequences**:

- Windows/Linux users cannot use yet
- Simpler CI/CD pipeline
- Faster time to first release
- Must abstract audio layer for future platforms

---

## Decision Template

```markdown
## ADR-XXX: [Title]

**Date**: YYYY-MM-DD

**Decision**: [One sentence describing the decision]

**Context**:
[Why is this decision needed? What's the problem?]

**Options Considered**:
| Option | Pros | Cons |
|--------|------|------|

**Reason**:
[Why was this option chosen?]

**Consequences**:
[What are the results of this decision?]
```
