'use client'

import { startTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useConvexAuth } from 'convex/react'
import { Button, ButtonText, XStack, neutralColors } from '@ella/ui'
import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import { StatusPage } from '@/components/layout/StatusPage'
import { describeAppError } from '@/lib/appError'
import { DEFAULT_APP_RETURN_PATH } from '@/lib/authRedirect'

/**
 * Catches whatever a page throws while rendering, most often a Convex query
 * that failed (`useQuery` rethrows server errors). The (app) layout sits
 * above this boundary, so the navbar and account menu stay usable.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const { isAuthenticated } = useConvexAuth()
  const { title, message, expected } = describeAppError(error)

  useEffect(() => {
    if (!expected) console.error(error)
  }, [error, expected])

  return (
    <StatusPage icon={AlertTriangle} title={title} message={message}>
      {/* Remounting the page re-subscribes its queries */}
      <Button variant='primary' onPress={reset}>
        <XStack gap='$2' alignItems='center'>
          <RotateCcw size={16} color={neutralColors.text.onFill} aria-hidden />
          <ButtonText>Opnieuw proberen</ButtonText>
        </XStack>
      </Button>
      <Button
        variant='outline'
        onPress={() =>
          // Home can be the page that failed (/quests): pushing the same URL
          // wouldn't clear this boundary, so reset it as well
          startTransition(() => {
            router.push(isAuthenticated ? DEFAULT_APP_RETURN_PATH : '/')
            reset()
          })
        }
      >
        <XStack gap='$2' alignItems='center'>
          <Home size={16} color={neutralColors.text.primary} aria-hidden />
          <ButtonText>Startpagina</ButtonText>
        </XStack>
      </Button>
    </StatusPage>
  )
}
