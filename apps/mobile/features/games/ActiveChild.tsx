import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQuery } from 'convex/react'
import { api } from '@ella/backend/api'
import type { Id } from '@ella/backend/types'
import { logger } from '../../lib/logger'

const STORAGE_KEY = 'ella.activeChild'

type Child = { _id: Id<'children'>; name: string; avatar: string }

interface ActiveChildState {
  /** Undefined while loading */
  children: Child[] | undefined
  /** The child who is playing, or null when none is chosen */
  child: Child | null
  select: (childId: Id<'children'> | null) => void
}

const ActiveChildContext = createContext<ActiveChildState | null>(null)

/**
 * Which child is playing on this device. Remembered between app starts, so a
 * child's own tablet opens on their profile.
 */
export function ActiveChildProvider({
  children: content,
}: {
  children: React.ReactNode
}) {
  const children = useQuery(api.functions.family.listChildren, {})
  const [chosenId, setChosenId] = useState<string | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(id => setChosenId(current => current ?? id))
      .catch(error =>
        logger.warn('Games', 'Could not read the active child', { error }),
      )
  }, [])

  const value = useMemo<ActiveChildState>(() => {
    // A single child is always the one playing.
    const child =
      children?.find(c => c._id === chosenId) ??
      (children?.length === 1 ? children[0] : null)
    return {
      children,
      child,
      select: id => {
        setChosenId(id)
        const write = id
          ? AsyncStorage.setItem(STORAGE_KEY, id)
          : AsyncStorage.removeItem(STORAGE_KEY)
        write.catch(error =>
          logger.warn('Games', 'Could not save the active child', { error }),
        )
      },
    }
  }, [children, chosenId])

  return (
    <ActiveChildContext.Provider value={value}>
      {content}
    </ActiveChildContext.Provider>
  )
}

export function useActiveChild(): ActiveChildState {
  const state = useContext(ActiveChildContext)
  if (!state) throw new Error('useActiveChild needs an ActiveChildProvider')
  return state
}
