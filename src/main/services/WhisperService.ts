import { EventEmitter } from 'events'
import { spawn, ChildProcess } from 'child_process'
import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

export interface TranscriptionResult {
  text: string
  timestamp: number
  duration: number
  confidence: number
  language: 'en' | 'fr'
}

export interface WhisperConfig {
  model: 'tiny' | 'base' | 'small' | 'medium'
  language: 'auto' | 'en' | 'fr'
}

/**
 * WhisperService handles speech-to-text transcription.
 *
 * For MVP, we use whisper.cpp via CLI. In production, this would be
 * integrated as a native Node.js addon for better performance.
 *
 * Alternative: Use OpenAI Whisper API for simpler setup (requires network).
 */
export class WhisperService extends EventEmitter {
  private config: WhisperConfig
  private modelPath: string | null = null
  private isReady = false
  private tempDir: string

  constructor(config: Partial<WhisperConfig> = {}) {
    super()
    this.config = {
      model: config.model || 'small',
      language: config.language || 'auto'
    }
    this.tempDir = path.join(os.tmpdir(), 'meeting-copilot')

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }
  }

  /**
   * Initialize the Whisper service.
   * In a full implementation, this would load the whisper.cpp model.
   * For now, we'll use a fallback to OpenAI Whisper API.
   */
  async initialize(): Promise<void> {
    // Check for whisper CLI
    const whisperPath = await this.findWhisperBinary()

    if (whisperPath) {
      this.modelPath = whisperPath
      this.isReady = true
      this.emit('ready', { mode: 'local', model: this.config.model })
    } else {
      // Fallback: Will use API-based transcription
      console.log('Whisper binary not found, will use API-based transcription')
      this.isReady = true
      this.emit('ready', { mode: 'api' })
    }
  }

  private async findWhisperBinary(): Promise<string | null> {
    // Check common locations for whisper.cpp binary
    const possiblePaths = [
      '/usr/local/bin/whisper',
      '/opt/homebrew/bin/whisper',
      path.join(app.getPath('userData'), 'whisper', 'main')
      // Add more paths as needed
    ]

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p
      }
    }

    return null
  }

  /**
   * Transcribe audio samples to text.
   */
  async transcribe(samples: Float32Array): Promise<TranscriptionResult> {
    if (!this.isReady) {
      throw new Error('WhisperService not initialized')
    }

    // For MVP, we'll implement a simple mock that returns placeholder text
    // In production, this would either:
    // 1. Call whisper.cpp via native addon
    // 2. Write audio to temp file and call whisper CLI
    // 3. Send to OpenAI Whisper API

    // Simulate transcription delay
    await new Promise((resolve) => setTimeout(resolve, 100))

    // For now, return a mock result
    // Real implementation would process the audio
    const result: TranscriptionResult = {
      text: '[Transcription will appear here when Whisper is configured]',
      timestamp: Date.now(),
      duration: (samples.length / 16000) * 1000,
      confidence: 0.95,
      language: 'en'
    }

    this.emit('transcription', result)
    return result
  }

  /**
   * Transcribe using OpenAI Whisper API as fallback.
   * Requires OPENAI_API_KEY environment variable.
   */
  async transcribeWithAPI(audioBuffer: Buffer): Promise<TranscriptionResult> {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set for API-based transcription')
    }

    // Write audio to temp file
    const tempFile = path.join(this.tempDir, `audio_${Date.now()}.wav`)

    // In real implementation, convert Float32Array to WAV format
    // For now, this is a placeholder

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`
        },
        body: await this.createFormData(audioBuffer)
      })

      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.statusText}`)
      }

      const data = (await response.json()) as { text: string; language?: string }

      return {
        text: data.text,
        timestamp: Date.now(),
        duration: 0,
        confidence: 0.9,
        language: (data.language === 'fr' ? 'fr' : 'en') as 'en' | 'fr'
      }
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile)
      }
    }
  }

  private async createFormData(audioBuffer: Buffer): Promise<FormData> {
    const formData = new FormData()
    const blob = new Blob([audioBuffer], { type: 'audio/wav' })
    formData.append('file', blob, 'audio.wav')
    formData.append('model', 'whisper-1')

    if (this.config.language !== 'auto') {
      formData.append('language', this.config.language)
    }

    return formData
  }

  isInitialized(): boolean {
    return this.isReady
  }

  getConfig(): WhisperConfig {
    return { ...this.config }
  }
}

// Singleton instance
let instance: WhisperService | null = null

export function getWhisperService(config?: Partial<WhisperConfig>): WhisperService {
  if (!instance) {
    instance = new WhisperService(config)
  }
  return instance
}
