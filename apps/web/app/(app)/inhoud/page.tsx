'use client'

import { useState } from 'react'
import { YStack, XStack, Button, ButtonText } from '@ella/ui'
import { PermissionGate } from '@/components/admin'
import { PageHeader } from '@/components/common'
import { CraftsTab } from './CraftsTab'
import { EntriesTab } from './EntriesTab'
import { MemoryTab } from './MemoryTab'
import { PuzzleImagesTab } from './PuzzleImagesTab'
import { SettingsTab } from './SettingsTab'
import { WordsTab } from './WordsTab'

const TABS = {
  dinosaurs: 'Dinosaurussen',
  planets: 'Planeten',
  crafts: 'Knutselen',
  memory: 'Memory',
  words: 'Woordjes',
  images: 'Puzzelafbeeldingen',
  settings: 'Instellingen',
} as const

type Tab = keyof typeof TABS

function ContentManager() {
  const [tab, setTab] = useState<Tab>('dinosaurs')
  return (
    <YStack flex={1} alignItems='center' padding='$6'>
      <YStack width='100%' maxWidth={1000} gap='$5'>
        <PageHeader
          title='Inhoud'
          description='Wat alle gezinnen in de app zien: dinosaurussen, planeten, knutselvideo’s, memorythema’s, woordjes, puzzelafbeeldingen en instellingen.'
        />
        <XStack gap='$2' flexWrap='wrap' role='tablist'>
          {(Object.keys(TABS) as Tab[]).map(key => (
            <Button
              key={key}
              size='$3'
              role='tab'
              aria-selected={key === tab}
              variant={key === tab ? 'primary' : 'outline'}
              onPress={() => setTab(key)}
            >
              <ButtonText>{TABS[key]}</ButtonText>
            </Button>
          ))}
        </XStack>
        {tab === 'dinosaurs' && (
          <EntriesTab key='dinosaurs' table='dinosaurs' />
        )}
        {tab === 'planets' && <EntriesTab key='planets' table='planets' />}
        {tab === 'crafts' && <CraftsTab />}
        {tab === 'memory' && <MemoryTab />}
        {tab === 'words' && <WordsTab />}
        {tab === 'images' && <PuzzleImagesTab />}
        {tab === 'settings' && <SettingsTab />}
      </YStack>
    </YStack>
  )
}

export default function ContentPage() {
  return (
    <PermissionGate permission='content:manage'>
      <ContentManager />
    </PermissionGate>
  )
}
