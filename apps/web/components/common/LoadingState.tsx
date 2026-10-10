'use client'

import { CenteredContainer, LoadingSpinner, BodyText } from '@ella/ui'

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Laden…' }: LoadingStateProps) {
  return (
    <CenteredContainer>
      <LoadingSpinner size='$5' />
      <BodyText muted>{message}</BodyText>
    </CenteredContainer>
  )
}
