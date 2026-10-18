import React, { useState } from 'react'
import { FlatList, Linking, Pressable } from 'react-native'
import { useQuery } from 'convex/react'
import { api } from '@ella/backend/api'
import {
  YStack,
  XStack,
  Text,
  LoadingSpinner,
  Theme,
  cardColors,
  neutralColors,
} from '@ella/ui'
import { AppShell } from '../../../components/shell'
import { logger } from '../../../lib/logger'
import { ChoiceTile } from '../components/ChoiceTile'
import { Emoji } from '../components/Emoji'

const CATEGORIES = [
  { id: 'tekenen', label: 'Tekenen', emoji: '✏️' },
  { id: 'vouwen', label: 'Vouwen', emoji: '📄' },
  { id: 'schilderen', label: 'Schilderen', emoji: '🖌️' },
  { id: 'verven', label: 'Verven', emoji: '🎨' },
  { id: 'slijm maken', label: 'Slijm maken', emoji: '🟢' },
  { id: 'boetseren', label: 'Boetseren', emoji: '🏺' },
  { id: 'stempelen', label: 'Stempelen', emoji: '🔖' },
] as const

type Category = (typeof CATEGORIES)[number]['id']

/**
 * Craft videos per category. A video opens in the YouTube app or browser
 * rather than playing inside Ella, and Ella loads nothing from YouTube itself
 * (no player, no thumbnails), so nothing tracks children inside the app.
 */
export function CraftsScreen() {
  const [category, setCategory] = useState<Category | null>(null)
  const crafts = useQuery(
    api.functions.content.listCrafts,
    category ? { category } : 'skip',
  )
  const current = CATEGORIES.find(c => c.id === category)

  if (!current) {
    return (
      <AppShell title='Knutselen'>
        <FlatList
          data={CATEGORIES}
          keyExtractor={c => c.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <ChoiceTile
              emoji={item.emoji}
              label={item.label}
              onPress={() => setCategory(item.id)}
            />
          )}
        />
      </AppShell>
    )
  }

  return (
    <AppShell title={current.label}>
      <YStack paddingHorizontal='$4' paddingTop='$3'>
        <Pressable onPress={() => setCategory(null)} accessibilityRole='button'>
          <Text color={neutralColors.text.secondary}>← Alle soorten</Text>
        </Pressable>
      </YStack>
      {crafts === undefined ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={crafts}
          keyExtractor={c => c._id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <Text textAlign='center' color={neutralColors.text.secondary}>
              Nog geen video&apos;s in deze soort.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole='link'
              accessibilityLabel={item.title}
              onPress={() =>
                Linking.openURL(item.youtubeUrl).catch(error =>
                  logger.warn('Crafts', 'Could not open a video', { error }),
                )
              }
            >
              <Theme name='card'>
                <XStack
                  gap='$3'
                  padding='$2'
                  borderRadius={12}
                  backgroundColor={cardColors.background}
                  alignItems='center'
                >
                  <YStack
                    width={56}
                    height={56}
                    borderRadius={12}
                    backgroundColor={cardColors.border}
                    alignItems='center'
                    justifyContent='center'
                  >
                    <Emoji size={26}>▶️</Emoji>
                  </YStack>
                  <YStack flex={1} gap='$1'>
                    <Text weight='bold'>{item.title}</Text>
                    <Text size='$3' variant='muted'>
                      ▶ Bekijk op YouTube
                    </Text>
                  </YStack>
                </XStack>
              </Theme>
            </Pressable>
          )}
        />
      )}
    </AppShell>
  )
}

export default CraftsScreen
