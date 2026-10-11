'use client'

import { YStack, XStack, H1, Text, brandColors, neutralColors } from '@ella/ui'
import {
  Brain,
  Calculator,
  Orbit,
  Palette,
  Puzzle,
  type LucideIcon,
} from 'lucide-react'
import { ButtonLink } from '@/components/common/ButtonLink'

const ACTIVITIES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Palette,
    title: 'Knutselen',
    text: 'Tekenen, vouwen, schilderen en meer, met filmpjes om stap voor stap mee te doen.',
  },
  {
    icon: Calculator,
    title: 'Rekenen',
    text: 'De maaltafelpuzzel en rekenoefeningen op je eigen niveau.',
  },
  {
    icon: Brain,
    title: 'Dinoquiz en memory',
    text: 'Herken de dinosaurussen en train je geheugen met leuke thema’s.',
  },
  {
    icon: Orbit,
    title: 'Planeten',
    text: 'Puzzels met de planeten van ons zonnestelsel.',
  },
]

/**
 * The home page body. A client component (Tamagui); page.tsx wraps it so the
 * route can export metadata.
 */
export function LandingPage() {
  return (
    <YStack flexGrow={1} alignItems='center' padding='$6' paddingVertical='$10'>
      <YStack width='100%' maxWidth={1000} gap='$8'>
        <YStack alignItems='center' gap='$4'>
          <YStack
            width={88}
            height={88}
            borderRadius={44}
            backgroundColor={brandColors.primaryLight}
            alignItems='center'
            justifyContent='center'
          >
            <Puzzle size={44} color={brandColors.primary} />
          </YStack>
          <H1
            fontSize={48}
            lineHeight={56}
            fontWeight='800'
            textAlign='center'
            $sm={{ fontSize: 34, lineHeight: 42 }}
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Leren door te spelen
          </H1>
          <Text
            size='$5'
            textAlign='center'
            color={neutralColors.text.secondary}
            maxWidth={620}
          >
            Ella is een leerapp voor kinderen: knutselen, rekenen, dinosaurussen
            en de planeten, in korte spelletjes in de app. Ouders maken een
            account en een profiel per kind, en volgen de resultaten op de
            website.
          </Text>
          <XStack gap='$3' flexWrap='wrap' justifyContent='center'>
            <ButtonLink href='/sign-up' size='lg'>
              Account maken
            </ButtonLink>
            <ButtonLink href='/sign-in' size='lg' variant='outline'>
              Aanmelden
            </ButtonLink>
          </XStack>
        </YStack>

        <XStack flexWrap='wrap' gap='$4' justifyContent='center'>
          {ACTIVITIES.map(({ icon: Icon, title, text }) => (
            <YStack
              key={title}
              flexBasis={220}
              flexGrow={1}
              maxWidth={300}
              backgroundColor={neutralColors.background.elevated}
              borderRadius='$5'
              padding='$5'
              gap='$2'
            >
              <Icon size={28} color={brandColors.primary} aria-hidden />
              <Text size='$5' weight='semibold'>
                {title}
              </Text>
              <Text color={neutralColors.text.secondary}>{text}</Text>
            </YStack>
          ))}
        </XStack>
      </YStack>
    </YStack>
  )
}
