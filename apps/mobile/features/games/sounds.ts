import { createAudioPlayer, type AudioPlayer } from 'expo-audio'
import { ensureAudioPlaybackMode } from '../../lib/audio'
import { logger } from '../../lib/logger'

const SOURCES = {
  right: require('../../assets/sounds/succes.wav'),
  wrong: require('../../assets/sounds/fail.mp3'),
  bomb: require('../../assets/sounds/explosion.mp3'),
  done: require('../../assets/sounds/completed.mp3'),
} as const

export type Sound = keyof typeof SOURCES

const players = new Map<Sound, AudioPlayer>()

/** Play a game sound; a sound that fails never interrupts the game. */
export function playSound(sound: Sound) {
  void (async () => {
    try {
      await ensureAudioPlaybackMode()
      let player = players.get(sound)
      if (!player) {
        player = createAudioPlayer(SOURCES[sound])
        players.set(sound, player)
      }
      await player.seekTo(0)
      player.play()
    } catch (error) {
      logger.warn('Games', 'Could not play a sound', { sound, error })
    }
  })()
}
