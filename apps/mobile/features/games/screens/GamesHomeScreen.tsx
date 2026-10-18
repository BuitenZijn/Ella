import React from 'react'
import { ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import {
  GAME_CATEGORIES,
  GAME_EMOJI,
  GAME_LABELS,
  type Game,
} from '@ella/backend/types'
import {
  YStack,
  XStack,
  Text,
  Button,
  ButtonText,
  InfoCard,
  LoadingSpinner,
  neutralColors,
} from '@ella/ui'
import { AppShell } from '../../../components/shell'
import type { HomeStackParamList } from '../../../navigation/types'
import { useActiveChild } from '../ActiveChild'
import { ChoiceTile } from '../components/ChoiceTile'
import { Emoji } from '../components/Emoji'

type Nav = StackNavigationProp<HomeStackParamList>

const GAME_SCREENS: Record<Game, keyof HomeStackParamList> = {
  maaltafel_puzzel: 'Maaltafel',
  rekenoefeningen: 'Math',
  dino_quiz: 'DinoQuiz',
  memory: 'Memory',
  planeten_puzzel: 'PlanetPuzzle',
  splitsen: 'NumberBonds',
  klokkijken: 'Clock',
  geld_tellen: 'Money',
  woordjes_lezen: 'Reading',
  reeksen: 'Sequences',
}

/** A group of tiles under a heading: Rekenen, Taal, ... */
function Section({
  emoji,
  label,
  children,
}: {
  emoji: string
  label: string
  children: React.ReactNode
}) {
  return (
    <YStack gap='$2'>
      <XStack alignItems='center' gap='$2' paddingTop='$2'>
        <Emoji size={24}>{emoji}</Emoji>
        <Text size='$6' weight='bold'>
          {label}
        </Text>
      </XStack>
      <XStack flexWrap='wrap' gap='$3'>
        {children}
      </XStack>
    </YStack>
  )
}

/** Who is playing, and what. */
export function GamesHomeScreen() {
  const navigation = useNavigation<Nav>()
  const tabBarHeight = useBottomTabBarHeight()
  const { children, child, select } = useActiveChild()

  let content: React.ReactNode
  if (children === undefined) {
    content = <LoadingSpinner />
  } else if (children.length === 0) {
    content = (
      <YStack gap='$4' paddingVertical='$5' alignItems='center'>
        <Emoji size={64}>👋</Emoji>
        <Text size='$7' weight='bold' textAlign='center'>
          Welkom bij Ella!
        </Text>
        <Text textAlign='center' color={neutralColors.text.secondary}>
          Maak eerst een profiel voor je kind: een naam en een figuurtje. Zo
          houden we de scores per kind bij.
        </Text>
        <Button
          size='$5'
          alignSelf='stretch'
          onPress={() => navigation.navigate('AddChild')}
        >
          <ButtonText>Profiel maken</ButtonText>
        </Button>
      </YStack>
    )
  } else if (!child) {
    content = (
      <YStack gap='$4'>
        <Text size='$8' weight='bold' textAlign='center' paddingTop='$4'>
          Wie speelt er?
        </Text>
        <XStack flexWrap='wrap' gap='$3'>
          {children.map(c => (
            <ChoiceTile
              key={c._id}
              emoji={c.avatar}
              label={c.name}
              onPress={() => select(c._id)}
            />
          ))}
        </XStack>
        <Button
          variant='outline'
          onPress={() => navigation.navigate('AddChild')}
        >
          <ButtonText>Nog een kind toevoegen</ButtonText>
        </Button>
      </YStack>
    )
  } else {
    content = (
      <YStack gap='$4'>
        <XStack alignItems='center' justifyContent='space-between' gap='$3'>
          <XStack alignItems='center' gap='$3' flex={1}>
            <Emoji size={44}>{child.avatar}</Emoji>
            <Text size='$7' weight='bold' flexShrink={1}>
              Hoi {child.name}!
            </Text>
          </XStack>
          {children.length > 1 && (
            <Button size='$3' variant='outline' onPress={() => select(null)}>
              <ButtonText>Wissel</ButtonText>
            </Button>
          )}
        </XStack>
        {GAME_CATEGORIES.map(category => (
          <Section
            key={category.id}
            emoji={category.emoji}
            label={category.label}
          >
            {category.games.map(game => (
              <ChoiceTile
                key={game}
                emoji={GAME_EMOJI[game]}
                label={GAME_LABELS[game]}
                onPress={() =>
                  navigation.navigate(GAME_SCREENS[game] as 'Maaltafel')
                }
              />
            ))}
          </Section>
        ))}
        <Section emoji='🎨' label='Creatief'>
          <ChoiceTile
            emoji='✂️'
            label='Knutselen'
            onPress={() => navigation.navigate('Crafts')}
          />
        </Section>
        <Button
          size='$5'
          variant='outline'
          onPress={() => navigation.navigate('Results')}
        >
          <ButtonText>🏆 Mijn scores</ButtonText>
        </Button>
        <InfoCard variant='info' size='$3'>
          <Text size='$3'>
            Ouders: profielen en resultaten beheer je ook op de website.
          </Text>
        </InfoCard>
      </YStack>
    )
  }

  return (
    <AppShell title='Ella' showBack={false}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: tabBarHeight + 40,
        }}
      >
        {content}
      </ScrollView>
    </AppShell>
  )
}

export default GamesHomeScreen
