'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@ella/backend/api'
import type { Id } from '@ella/backend/dataModel'
import {
  CHILD_AVATARS,
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
  FormInput,
  brandColors,
  neutralColors,
  useToast,
} from '@ella/ui'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { ConfirmDialog, LoadingState, PageHeader } from '@/components/common'
import { getErrorMessage } from '@/lib/errorMessage'
import { formatDate } from '@/lib/formatDate'

type Child = { _id: Id<'children'>; name: string; avatar: string }

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')} min` : `${s} sec`
}

function ChildForm({
  child,
  onDone,
}: {
  child: Child | null
  onDone: () => void
}) {
  const addChild = useMutation(api.functions.family.addChild)
  const updateChild = useMutation(api.functions.family.updateChild)
  const { success, error: toastError } = useToast()
  const [name, setName] = useState(child?.name ?? '')
  const [avatar, setAvatar] = useState<string>(
    child?.avatar ?? CHILD_AVATARS[0],
  )
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      if (child) await updateChild({ childId: child._id, name, avatar })
      else await addChild({ name, avatar })
      success(child ? 'Profiel bewaard.' : 'Profiel toegevoegd.')
      onDone()
    } catch (err) {
      toastError(getErrorMessage(err, 'Het profiel kon niet bewaard worden.'))
      setBusy(false)
    }
  }

  return (
    <YStack
      gap='$3'
      padding='$4'
      borderRadius='$4'
      borderWidth={1}
      borderColor={neutralColors.border.subtle}
      backgroundColor={neutralColors.background.elevated}
    >
      <Text weight='semibold'>
        {child ? 'Profiel aanpassen' : 'Nieuw profiel'}
      </Text>
      <FormInput
        aria-label='Naam'
        placeholder='Voornaam of bijnaam'
        maxLength={30}
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <XStack gap='$2' flexWrap='wrap' role='radiogroup' aria-label='Figuurtje'>
        {CHILD_AVATARS.map(a => (
          <Button
            key={a}
            size='$4'
            variant={a === avatar ? 'secondary' : 'ghost'}
            role='radio'
            aria-checked={a === avatar}
            aria-label={a}
            onPress={() => setAvatar(a)}
          >
            <Text fontSize={22}>{a}</Text>
          </Button>
        ))}
      </XStack>
      <XStack gap='$2'>
        <Button disabled={busy || !name.trim()} onPress={() => void save()}>
          <ButtonText>{busy ? 'Bewaren…' : 'Bewaren'}</ButtonText>
        </Button>
        <Button variant='outline' onPress={onDone}>
          <ButtonText>Annuleren</ButtonText>
        </Button>
      </XStack>
    </YStack>
  )
}

function ChildResults({ child }: { child: Child }) {
  const results = useQuery(api.functions.family.childResults, {
    childId: child._id,
  })
  if (results === undefined) return <LoadingState />
  const played = results.games.filter(g => g.played > 0)
  if (played.length === 0) {
    return <Text variant='muted'>{child.name} heeft nog niets gespeeld.</Text>
  }
  return (
    <YStack gap='$4'>
      {GAME_CATEGORIES.map(category => {
        const games = played.filter(g => category.games.includes(g.game))
        if (games.length === 0) return null
        return (
          <YStack key={category.id} gap='$3'>
            <Text size='$5' weight='bold'>
              {category.emoji} {category.label}
            </Text>
            {games.map(({ game, recent }) => (
              <YStack key={game} gap='$1'>
                <Text weight='semibold'>
                  {GAME_EMOJI[game]} {GAME_LABELS[game]}
                </Text>
                {recent.slice(0, 5).map(s => (
                  <XStack key={s._id} gap='$3' flexWrap='wrap'>
                    <Text size='$3' variant='muted' minWidth={90}>
                      {formatDate(s.completedAt)}
                    </Text>
                    <Text size='$3'>
                      {[
                        formatTime(s.timeSeconds),
                        s.correct !== undefined &&
                          s.total !== undefined &&
                          `${s.correct}/${s.total} juist`,
                        s.moves !== undefined && `${s.moves} zetten`,
                        s.mistakes !== undefined && `${s.mistakes} foutjes`,
                        s.points !== undefined && `${s.points} punten`,
                        s.difficulty,
                        s.subject,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                    {s.stars !== undefined && (
                      <Text size='$3'>{'⭐'.repeat(s.stars)}</Text>
                    )}
                  </XStack>
                ))}
              </YStack>
            ))}
          </YStack>
        )
      })}
    </YStack>
  )
}

function FamilyBest() {
  const [game, setGame] = useState<Game>('memory')
  const best = useQuery(api.functions.family.familyBest, { game })
  return (
    <YStack gap='$3'>
      <XStack gap='$2' flexWrap='wrap'>
        {GAME_CATEGORIES.flatMap(c => c.games).map(g => (
          <Button
            key={g}
            size='$3'
            variant={g === game ? 'primary' : 'outline'}
            onPress={() => setGame(g)}
          >
            <ButtonText>
              {GAME_EMOJI[g]} {GAME_LABELS[g]}
            </ButtonText>
          </Button>
        ))}
      </XStack>
      {best === undefined ? (
        <LoadingState />
      ) : best.length === 0 ? (
        <Text variant='muted'>Nog geen scores voor dit spel.</Text>
      ) : (
        best.map(b => (
          <XStack
            key={`${b.childName}-${b.difficulty}`}
            gap='$3'
            alignItems='center'
          >
            <Text fontSize={20}>{b.avatar}</Text>
            <Text weight='semibold' minWidth={100}>
              {b.childName}
            </Text>
            <Text>{formatTime(b.timeSeconds)}</Text>
            {b.difficulty && <Text variant='muted'>{b.difficulty}</Text>}
            {b.stars !== undefined && <Text>{'⭐'.repeat(b.stars)}</Text>}
          </XStack>
        ))
      )}
    </YStack>
  )
}

/** Parents: the children's profiles and how they are doing. */
export default function ChildrenPage() {
  const children = useQuery(api.functions.family.listChildren, {})
  const removeChild = useMutation(api.functions.family.removeChild)
  const { success, error: toastError } = useToast()
  const [editing, setEditing] = useState<Child | 'new' | null>(null)
  const [removing, setRemoving] = useState<Child | null>(null)

  if (children === undefined) return <LoadingState />

  return (
    <YStack flex={1} alignItems='center' padding='$6'>
      <YStack width='100%' maxWidth={900} gap='$5'>
        <XStack
          justifyContent='space-between'
          alignItems='flex-end'
          gap='$4'
          flexWrap='wrap'
        >
          <PageHeader
            title='Mijn kinderen'
            description='Een profiel per kind: alleen een naam en een figuurtje. De spelletjes speel je in de Ella-app.'
          />
          {editing === null && children.length < 10 && (
            <Button icon={<Plus size={16} />} onPress={() => setEditing('new')}>
              <ButtonText>Kind toevoegen</ButtonText>
            </Button>
          )}
        </XStack>

        {editing !== null && (
          <ChildForm
            child={editing === 'new' ? null : editing}
            onDone={() => setEditing(null)}
          />
        )}

        {children.length === 0 && editing === null && (
          <Text variant='muted' textAlign='center' paddingVertical='$6'>
            Nog geen profielen. Voeg je eerste kind toe.
          </Text>
        )}

        {children.map(child => (
          <YStack
            key={child._id}
            gap='$3'
            padding='$4'
            borderRadius='$4'
            backgroundColor={neutralColors.background.elevated}
          >
            <XStack alignItems='center' gap='$3'>
              <Text fontSize={36}>{child.avatar}</Text>
              <Text size='$6' weight='semibold' flex={1}>
                {child.name}
              </Text>
              <Button
                size='$3'
                chromeless
                aria-label={`${child.name} aanpassen`}
                onPress={() => setEditing(child)}
                icon={<Pencil size={16} color={neutralColors.text.secondary} />}
              />
              <Button
                size='$3'
                chromeless
                aria-label={`${child.name} verwijderen`}
                onPress={() => setRemoving(child)}
                icon={<Trash2 size={16} color={brandColors.destructive} />}
              />
            </XStack>
            <ChildResults child={child} />
          </YStack>
        ))}

        {children.length > 1 && (
          <YStack gap='$3'>
            <Text size='$6' weight='semibold'>
              Beste tijden in de familie
            </Text>
            <FamilyBest />
          </YStack>
        )}
      </YStack>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={open => !open && setRemoving(null)}
        title='Profiel verwijderen'
        description={`Het profiel van ${removing?.name} en al de scores worden verwijderd.`}
        confirmLabel='Verwijderen'
        variant='danger'
        onConfirm={async () => {
          if (!removing) return
          try {
            await removeChild({ childId: removing._id })
            success('Profiel verwijderd.')
          } catch (err) {
            toastError(
              getErrorMessage(err, 'Het profiel kon niet verwijderd worden.'),
            )
          }
          setRemoving(null)
        }}
      />
    </YStack>
  )
}
