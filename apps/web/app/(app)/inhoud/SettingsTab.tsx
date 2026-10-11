'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@ella/backend/api'
import {
  DEFAULT_MATH_LEVELS,
  type MathLevel,
  type MaaltafelSettings,
} from '@ella/backend/types'
import {
  YStack,
  XStack,
  Text,
  Button,
  ButtonText,
  neutralColors,
  useToast,
} from '@ella/ui'
import { LoadingState } from '@/components/common'
import { getErrorMessage } from '@/lib/errorMessage'
import { Field, fieldStyle } from './shared'

function MaaltafelForm({ initial }: { initial: MaaltafelSettings }) {
  const save = useMutation(api.functions.contentAdmin.saveMaaltafelSettings)
  const { success, error: toastError } = useToast()
  const [form, setForm] = useState({
    gridSize: String(initial.gridSize),
    blanksPerRound: String(initial.blanksPerRound),
    bombChance: String(Math.round(initial.bombChance * 100)),
  })
  const [busy, setBusy] = useState(false)
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const submit = async () => {
    setBusy(true)
    try {
      await save({
        gridSize: Number(form.gridSize),
        blanksPerRound: Number(form.blanksPerRound),
        bombChance: Number(form.bombChance) / 100,
      })
      success('Bewaard.')
    } catch (err) {
      toastError(getErrorMessage(err, 'Bewaren is niet gelukt.'))
    }
    setBusy(false)
  }

  return (
    <YStack gap='$3'>
      <Text size='$5' weight='semibold'>
        🧩 Maaltafelpuzzel
      </Text>
      <XStack gap='$3' flexWrap='wrap'>
        <Field label='Grootte (3–12)'>
          <input
            type='number'
            min={3}
            max={12}
            value={form.gridSize}
            onChange={set('gridSize')}
            style={fieldStyle}
          />
        </Field>
        <Field label='Vragen per ronde'>
          <input
            type='number'
            min={1}
            value={form.blanksPerRound}
            onChange={set('blanksPerRound')}
            style={fieldStyle}
          />
        </Field>
        <Field label='Kans op een bom (%)'>
          <input
            type='number'
            min={0}
            max={100}
            value={form.bombChance}
            onChange={set('bombChance')}
            style={fieldStyle}
          />
        </Field>
      </XStack>
      <XStack>
        <Button disabled={busy} onPress={() => void submit()}>
          <ButtonText>Bewaren</ButtonText>
        </Button>
      </XStack>
    </YStack>
  )
}

const OPERATIONS: { key: keyof MathLevel; label: string }[] = [
  { key: 'addition', label: '+' },
  { key: 'subtraction', label: '−' },
  { key: 'multiplication', label: '×' },
  { key: 'division', label: '÷' },
  { key: 'fractions', label: 'breuken' },
]

const NUMBERS: { key: keyof MathLevel; label: string }[] = [
  { key: 'minNumber', label: 'Van' },
  { key: 'maxNumber', label: 'Tot' },
  { key: 'questionsPerRound', label: 'Vragen' },
  { key: 'timeLimitSeconds', label: 'Seconden (0 = geen limiet)' },
  { key: 'pointsPerCorrect', label: 'Punten' },
  { key: 'speedBonus', label: 'Snelheidsbonus' },
]

function MathLevelsForm({ initial }: { initial: MathLevel[] }) {
  const save = useMutation(api.functions.contentAdmin.saveMathLevels)
  const { success, error: toastError } = useToast()
  const [levels, setLevels] = useState(initial)
  const [busy, setBusy] = useState(false)
  const update = (i: number, patch: Partial<MathLevel>) =>
    setLevels(ls => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)))

  const submit = async (next = levels) => {
    setBusy(true)
    try {
      await save({ levels: next })
      success('Bewaard.')
    } catch (err) {
      toastError(getErrorMessage(err, 'Bewaren is niet gelukt.'))
    }
    setBusy(false)
  }

  return (
    <YStack gap='$3'>
      <Text size='$5' weight='semibold'>
        ➕ Rekenoefeningen
      </Text>
      {levels.map((level, i) => (
        <YStack
          key={level.id}
          gap='$3'
          padding='$3'
          borderRadius='$3'
          borderWidth={1}
          borderColor={neutralColors.border.subtle}
        >
          <XStack gap='$3' flexWrap='wrap'>
            <Field label='Niveau'>
              <input
                value={level.label}
                onChange={e => update(i, { label: e.target.value })}
                style={fieldStyle}
              />
            </Field>
            <Field label='Icoon'>
              <input
                value={level.emoji}
                onChange={e => update(i, { emoji: e.target.value })}
                style={fieldStyle}
              />
            </Field>
          </XStack>
          <XStack gap='$3' flexWrap='wrap'>
            {NUMBERS.map(({ key, label }) => (
              <Field key={key} label={label}>
                <input
                  type='number'
                  min={0}
                  value={String(level[key])}
                  onChange={e => update(i, { [key]: Number(e.target.value) })}
                  style={fieldStyle}
                />
              </Field>
            ))}
          </XStack>
          <XStack gap='$4' flexWrap='wrap'>
            {OPERATIONS.map(({ key, label }) => (
              <label
                key={key}
                style={{ display: 'flex', gap: 6, alignItems: 'center' }}
              >
                <input
                  type='checkbox'
                  checked={Boolean(level[key])}
                  onChange={e => update(i, { [key]: e.target.checked })}
                />
                <Text>{label}</Text>
              </label>
            ))}
          </XStack>
        </YStack>
      ))}
      <XStack gap='$2'>
        <Button disabled={busy} onPress={() => void submit()}>
          <ButtonText>Bewaren</ButtonText>
        </Button>
        <Button
          variant='outline'
          disabled={busy}
          onPress={() => {
            setLevels(DEFAULT_MATH_LEVELS)
            void submit(DEFAULT_MATH_LEVELS)
          }}
        >
          <ButtonText>Standaard terugzetten</ButtonText>
        </Button>
      </XStack>
    </YStack>
  )
}

/** Settings of the maaltafelpuzzel and the math levels. */
export function SettingsTab() {
  const settings = useQuery(api.functions.content.gameSettings, {})
  if (settings === undefined) return <LoadingState />
  return (
    <YStack gap='$6'>
      <MaaltafelForm initial={settings.maaltafel} />
      <MathLevelsForm initial={settings.mathLevels} />
    </YStack>
  )
}
