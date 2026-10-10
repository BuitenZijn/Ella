import React from 'react'
import { ScrollView } from 'react-native'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { YStack, Text, MicroLabel, InfoCard } from '@ella/ui'
import { useCurrentUser } from '../../../lib/useCurrentUser'
import { AppShell } from '../../../components/shell'

function greeting(hour: number): string {
  if (hour < 12) return 'Goedemorgen'
  if (hour < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

/**
 * HomeScreen - the member's start page.
 *
 * For now a greeting; each game that is ported from the old app adds its
 * card here.
 */
export function HomeScreen() {
  const tabBarHeight = useBottomTabBarHeight()
  const { displayName } = useCurrentUser()

  return (
    <AppShell title='Ella' showBack={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: tabBarHeight + 40 }}>
        <YStack flex={1} padding='$4' gap='$4'>
          <YStack gap='$1'>
            <MicroLabel>{greeting(new Date().getHours())}</MicroLabel>
            <Text size='$7' weight='bold'>
              {displayName}
            </Text>
          </YStack>
          <InfoCard variant='info' size='$4'>
            <Text>
              Welkom bij Ella. Hier vind je binnenkort alle spelletjes.
            </Text>
          </InfoCard>
        </YStack>
      </ScrollView>
    </AppShell>
  )
}

export default HomeScreen
