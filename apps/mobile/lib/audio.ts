import { setAudioModeAsync } from 'expo-audio'
import { logger } from './logger'

let audioModeConfigured = false
let pendingAudioModeConfiguration: Promise<void> | null = null

async function applyAudioPlaybackMode(): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: false,
    interruptionMode: 'mixWithOthers',
    interruptionModeAndroid: 'duckOthers',
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    shouldRouteThroughEarpiece: false,
  })
}

/**
 * Ensure the app uses a playback-first audio mode so short sound effects route
 * to the device speaker instead of getting stuck in an input/earpiece profile.
 */
export async function ensureAudioPlaybackMode(): Promise<void> {
  if (audioModeConfigured) {
    return
  }

  if (!pendingAudioModeConfiguration) {
    pendingAudioModeConfiguration = applyAudioPlaybackMode()
      .then(() => {
        audioModeConfigured = true
        logger.info('Audio', 'Audio playback mode configured')
      })
      .catch(error => {
        logger.warn('Audio', 'Failed to configure audio playback mode', {
          error,
        })
      })
      .finally(() => {
        pendingAudioModeConfiguration = null
      })
  }

  await pendingAudioModeConfiguration
}
