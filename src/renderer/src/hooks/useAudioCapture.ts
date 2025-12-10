import { useEffect, useRef, useState, useCallback } from 'react'

interface AudioCaptureState {
  isCapturing: boolean
  hasPermission: boolean | null
  audioLevel: number
  error: string | null
}

interface UseAudioCaptureReturn extends AudioCaptureState {
  startCapture: () => Promise<void>
  stopCapture: () => void
  requestPermission: () => Promise<boolean>
}

/**
 * Hook for capturing microphone audio using Web Audio API.
 * Sends audio data to the main process for transcription.
 */
export function useAudioCapture(): UseAudioCaptureReturn {
  const [state, setState] = useState<AudioCaptureState>({
    isCapturing: false,
    hasPermission: null,
    audioLevel: 0,
    error: null
  })

  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Check for existing permission
  useEffect(() => {
    const checkPermission = async (): Promise<void> => {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        setState((prev) => ({
          ...prev,
          hasPermission: result.state === 'granted'
        }))
      } catch {
        // Permissions API not fully supported, will check on capture attempt
      }
    }
    checkPermission()
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCapture()
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Got permission, clean up the test stream
      stream.getTracks().forEach((track) => track.stop())
      setState((prev) => ({ ...prev, hasPermission: true, error: null }))
      return true
    } catch (error) {
      setState((prev) => ({
        ...prev,
        hasPermission: false,
        error: 'Microphone permission denied'
      }))
      return false
    }
  }, [])

  const startCapture = useCallback(async (): Promise<void> => {
    if (state.isCapturing) return

    try {
      console.log('Starting audio capture...')

      // Get microphone access - use browser's native sample rate, we'll resample
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false, // Disable to avoid audio issues
          noiseSuppression: false,
          autoGainControl: true
        }
      })

      console.log(
        'Got media stream, tracks:',
        stream.getAudioTracks().map((t) => t.label)
      )
      mediaStreamRef.current = stream

      // Create audio context at native sample rate first
      const audioContext = new AudioContext()
      console.log('AudioContext sample rate:', audioContext.sampleRate)
      audioContextRef.current = audioContext

      // Create source from microphone
      const source = audioContext.createMediaStreamSource(stream)

      // Create analyser for visualization
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser
      source.connect(analyser)

      // Create script processor for capturing audio data
      // Note: ScriptProcessorNode is deprecated but AudioWorklet requires more setup
      const bufferSize = 4096
      const scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1)

      let sampleCount = 0
      scriptProcessor.onaudioprocess = (event): void => {
        const inputData = event.inputBuffer.getChannelData(0)

        // Downsample to 16kHz if needed
        const targetSampleRate = 16000
        const sourceSampleRate = audioContext.sampleRate
        const ratio = sourceSampleRate / targetSampleRate

        let samples: number[]
        if (ratio > 1) {
          // Downsample
          const newLength = Math.floor(inputData.length / ratio)
          samples = new Array(newLength)
          for (let i = 0; i < newLength; i++) {
            samples[i] = inputData[Math.floor(i * ratio)]
          }
        } else {
          samples = Array.from(inputData)
        }

        // Log first few sends to verify audio is flowing
        sampleCount++
        if (sampleCount <= 5) {
          const maxSample = Math.max(...samples.map(Math.abs))
          console.log(
            `Audio chunk ${sampleCount}: ${samples.length} samples, max amplitude: ${maxSample.toFixed(4)}`
          )
        }

        // Send to main process via preload API
        window.api?.sendAudioData({
          samples,
          timestamp: Date.now()
        })
      }

      source.connect(scriptProcessor)
      scriptProcessor.connect(audioContext.destination)

      // Start level monitoring
      const updateLevel = (): void => {
        if (!analyserRef.current) return

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)

        // Calculate average level
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        const normalizedLevel = average / 255

        setState((prev) => ({ ...prev, audioLevel: normalizedLevel }))
        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()

      setState((prev) => ({
        ...prev,
        isCapturing: true,
        hasPermission: true,
        error: null
      }))
    } catch (error) {
      console.error('Failed to start audio capture:', error)
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start capture',
        hasPermission: false
      }))
    }
  }, [state.isCapturing])

  const stopCapture = useCallback((): void => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    analyserRef.current = null
    workletNodeRef.current = null

    setState((prev) => ({
      ...prev,
      isCapturing: false,
      audioLevel: 0
    }))
  }, [])

  return {
    ...state,
    startCapture,
    stopCapture,
    requestPermission
  }
}
