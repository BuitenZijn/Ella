import { useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@ella/backend/api'
import type { Game } from '@ella/backend/types'
import { logger } from '../../lib/logger'
import { useActiveChild } from './ActiveChild'

export interface ScoreFields {
  timeSeconds: number
  moves?: number
  mistakes?: number
  correct?: number
  total?: number
  points?: number
  stars?: number
  difficulty?: string
  subject?: string
}

/**
 * Save a finished game for the child who is playing. A score that can't be
 * saved (offline) is logged, never shown: the child just finished a game.
 */
export function useSaveScore(game: Game) {
  const { child } = useActiveChild()
  const save = useMutation(api.functions.family.saveScore)
  return useCallback(
    (score: ScoreFields) => {
      if (!child) return
      save({ childId: child._id, game, ...score }).catch(error =>
        logger.warn('Games', 'Could not save a score', { game, error }),
      )
    },
    [child, game, save],
  )
}
