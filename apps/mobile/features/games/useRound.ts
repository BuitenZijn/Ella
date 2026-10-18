import { useEffect, useRef, useState } from 'react'
import { STAR_THRESHOLDS, starsFor, type Game } from '@ella/backend/types'
import { playSound, type Sound } from './sounds'
import { useSaveScore, type ScoreFields } from './useSaveScore'

const RIGHT_MS = 900
/** Longer after a mistake, so the right answer can be seen */
const WRONG_MS = 1800

/**
 * One round of a quiz-style game: answer each question once, see whether it
 * was right, then the next one comes by itself. The last answer ends the
 * round and saves the score with stars.
 */
export function useRound(
  game: Game,
  total: number,
  score: Pick<ScoreFields, 'difficulty' | 'subject'> = {},
) {
  const saveScore = useSaveScore(game)
  const [startedAt] = useState(() => Date.now())
  const [index, setIndex] = useState(0)
  const [right, setRight] = useState(0)
  /** Whether the current question was answered right; null while open */
  const [answered, setAnswered] = useState<boolean | null>(null)
  const [done, setDone] = useState<{ seconds: number; stars: number } | null>(
    null,
  )
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const answer = (
    ok: boolean,
    extra?: Pick<ScoreFields, 'mistakes'>,
    sound: Sound = ok ? 'right' : 'wrong',
  ) => {
    if (answered !== null || done) return
    playSound(sound)
    const nowRight = right + (ok ? 1 : 0)
    setAnswered(ok)
    setRight(nowRight)
    timer.current = setTimeout(
      () => {
        setAnswered(null)
        if (index + 1 < total) {
          setIndex(index + 1)
          return
        }
        playSound('done')
        const seconds = Math.round((Date.now() - startedAt) / 1000)
        const stars = starsFor(nowRight, total, STAR_THRESHOLDS)
        setDone({ seconds, stars })
        saveScore({
          timeSeconds: seconds,
          correct: nowRight,
          total,
          stars,
          ...score,
          ...extra,
        })
      },
      ok ? RIGHT_MS : WRONG_MS,
    )
  }

  return { index, right, answered, done, answer }
}
