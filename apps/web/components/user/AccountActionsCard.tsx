'use client'

import { YStack, H3, Text, Card, Separator, Button, ButtonText } from '@ella/ui'

export interface AccountActionsCardProps {
  onSignOut: () => void
  onDeleteAccount: () => void
}

export function AccountActionsCard({
  onSignOut,
  onDeleteAccount,
}: AccountActionsCardProps) {
  return (
    <Card size='$5'>
      <YStack gap='$4'>
        <H3 fontSize={20} fontWeight='600'>
          Account
        </H3>
        <Separator />
        <YStack gap='$3'>
          <Text variant='subtle'>Afmelden op dit toestel</Text>
          <Button
            size='$4'
            variant='danger'
            onPress={onSignOut}
            alignSelf='flex-start'
          >
            <ButtonText>Afmelden</ButtonText>
          </Button>
        </YStack>
        <Separator />
        <YStack gap='$3'>
          <Text variant='subtle'>
            Verwijder je account en al je gegevens definitief. Dit kan niet
            ongedaan gemaakt worden.
          </Text>
          <Button
            size='$4'
            variant='outline-danger'
            onPress={onDeleteAccount}
            alignSelf='flex-start'
          >
            <ButtonText>Account verwijderen</ButtonText>
          </Button>
        </YStack>
      </YStack>
    </Card>
  )
}
