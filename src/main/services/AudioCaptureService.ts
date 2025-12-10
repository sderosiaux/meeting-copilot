import { BrowserWindow, ipcMain, systemPreferences } from 'electron'
import { EventEmitter } from 'events'

export interface AudioChunk {
  samples: Float32Array
  timestamp: number
  duration: number
}

export interface VADResult {
  isSpeech: boolean
  energy: number
}

/**
 * AudioCaptureService handles microphone capture in the main process.
 * Audio is actually captured in the renderer (Web Audio API) and sent via IPC.
 */
export class AudioCaptureService extends EventEmitter {
  private isCapturing = false
  private speechBuffer: Float32Array[] = []
  private silenceFrames = 0
  private readonly SILENCE_THRESHOLD = 0.01
  private readonly SILENCE_FRAMES_TO_END = 30 // ~500ms at 60fps
  private readonly MIN_SPEECH_FRAMES = 10

  constructor() {
    super()
    this.setupIPC()
  }

  private setupIPC(): void {
    let chunkCount = 0

    // Receive audio data from renderer
    ipcMain.on('audio:data', (_event, data: { samples: number[]; timestamp: number }) => {
      if (!this.isCapturing) return

      const samples = new Float32Array(data.samples)

      // Log first few chunks to verify data flow
      chunkCount++
      if (chunkCount <= 5) {
        const maxSample = Math.max(...Array.from(samples).map(Math.abs))
        console.log(
          `[Main] Audio chunk ${chunkCount}: ${samples.length} samples, max: ${maxSample.toFixed(4)}`
        )
      }

      const chunk: AudioChunk = {
        samples,
        timestamp: data.timestamp,
        duration: (samples.length / 16000) * 1000 // ms
      }

      // Emit raw audio data for real-time streaming to Deepgram
      this.emit('audioData', samples)

      // Calculate energy for VAD
      const energy = this.calculateEnergy(samples)
      this.emit('audioLevel', energy)

      // Voice Activity Detection (kept for potential future use)
      const vad = this.detectVoiceActivity(samples, energy)

      if (vad.isSpeech) {
        this.speechBuffer.push(samples)
        this.silenceFrames = 0
      } else {
        this.silenceFrames++

        // If we had speech and now have silence, emit the speech segment
        if (
          this.speechBuffer.length >= this.MIN_SPEECH_FRAMES &&
          this.silenceFrames >= this.SILENCE_FRAMES_TO_END
        ) {
          this.emitSpeechSegment()
        }
      }
    })

    // Handle permission check
    ipcMain.handle('audio:checkPermission', async () => {
      return this.checkMicrophonePermission()
    })

    // Handle permission request
    ipcMain.handle('audio:requestPermission', async () => {
      return this.requestMicrophonePermission()
    })
  }

  private calculateEnergy(samples: Float32Array): number {
    let sum = 0
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i]
    }
    return Math.sqrt(sum / samples.length)
  }

  private detectVoiceActivity(samples: Float32Array, energy: number): VADResult {
    // Simple energy-based VAD
    const isSpeech = energy > this.SILENCE_THRESHOLD
    return { isSpeech, energy }
  }

  private emitSpeechSegment(): void {
    // Concatenate all speech frames
    const totalLength = this.speechBuffer.reduce((acc, arr) => acc + arr.length, 0)
    const combined = new Float32Array(totalLength)

    let offset = 0
    for (const chunk of this.speechBuffer) {
      combined.set(chunk, offset)
      offset += chunk.length
    }

    this.emit('speechSegment', {
      samples: combined,
      timestamp: Date.now(),
      duration: (totalLength / 16000) * 1000
    })

    // Reset buffer
    this.speechBuffer = []
    this.silenceFrames = 0
  }

  async checkMicrophonePermission(): Promise<'granted' | 'denied' | 'not-determined'> {
    if (process.platform === 'darwin') {
      const status = systemPreferences.getMediaAccessStatus('microphone')
      return status as 'granted' | 'denied' | 'not-determined'
    }
    // On other platforms, assume granted (will fail at capture time if not)
    return 'granted'
  }

  async requestMicrophonePermission(): Promise<boolean> {
    if (process.platform === 'darwin') {
      return systemPreferences.askForMediaAccess('microphone')
    }
    return true
  }

  start(): void {
    this.isCapturing = true
    this.speechBuffer = []
    this.silenceFrames = 0
    this.emit('started')
  }

  stop(): void {
    // Emit any remaining speech
    if (this.speechBuffer.length >= this.MIN_SPEECH_FRAMES) {
      this.emitSpeechSegment()
    }

    this.isCapturing = false
    this.speechBuffer = []
    this.emit('stopped')
  }

  pause(): void {
    this.isCapturing = false
    this.emit('paused')
  }

  resume(): void {
    this.isCapturing = true
    this.emit('resumed')
  }

  isActive(): boolean {
    return this.isCapturing
  }
}

// Singleton instance
let instance: AudioCaptureService | null = null

export function getAudioCaptureService(): AudioCaptureService {
  if (!instance) {
    instance = new AudioCaptureService()
  }
  return instance
}
