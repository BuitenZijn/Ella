'use client'

import type { CardColor, Team } from '@ella/backend/types'
import { brandColors, cardColors } from '@ella/ui'

export const TEAM_COLORS: Record<Team, string> = {
  red: brandColors.destructive,
  blue: cardColors.background,
}

const FILL: Record<CardColor, { background: string; text: string }> = {
  red: { background: TEAM_COLORS.red, text: '#FFFFFF' },
  blue: { background: TEAM_COLORS.blue, text: '#FFFFFF' },
  neutral: { background: '#E7E4D2', text: '#4D4766' },
  assassin: { background: '#1F1B2E', text: '#FFFFFF' },
}

const SELECTED = '#FFC531'

export const COLOR_LABELS: Record<CardColor, string> = {
  red: 'rood',
  blue: 'blauw',
  neutral: 'neutraal',
  assassin: 'moordenaar',
}

export interface BoardCard {
  word: string
  revealed: boolean
  /** Known colour: revealed, or the key for spymasters */
  color: CardColor | null
}

/**
 * The 5×5 board. Turned cards show their colour; with the key (spymasters,
 * or once a game is over) the other cards are tinted by theirs. `onPick`
 * makes the closed cards tappable.
 */
export function Board({
  cards,
  selected,
  onPick,
  size = 'large',
}: {
  cards: BoardCard[]
  selected: number | null
  onPick?: (index: number) => void
  /** Large on the big screen, small on a phone */
  size?: 'large' | 'small'
}) {
  const large = size === 'large'
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: large ? 'clamp(6px, 1vw, 14px)' : 4,
        width: '100%',
      }}
    >
      {cards.map((card, i) => {
        const fill = card.color ? FILL[card.color] : null
        const open = card.revealed && fill
        const isSelected = selected === i
        const canPick = !!onPick && !card.revealed
        return (
          <button
            key={i}
            type='button'
            disabled={!canPick}
            onClick={() => onPick?.(i)}
            aria-pressed={isSelected}
            aria-label={
              card.color
                ? `${card.word}, ${COLOR_LABELS[card.color]}`
                : card.word
            }
            style={{
              aspectRatio: large ? '1.6' : '1.25',
              borderRadius: large ? 12 : 6,
              border: `${isSelected ? (large ? 6 : 3) : 2}px solid ${
                isSelected ? SELECTED : (fill?.background ?? TEAM_COLORS.blue)
              }`,
              background: open
                ? fill.background
                : fill
                  ? `color-mix(in srgb, ${fill.background} 22%, white)`
                  : '#FFFFFF',
              color: open ? fill.text : '#1F1B2E',
              opacity: card.revealed && !large ? 0.85 : 1,
              cursor: canPick ? 'pointer' : 'default',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              fontWeight: 800,
              letterSpacing: large ? '0.04em' : 0,
              fontSize: large
                ? 'clamp(11px, 1.7vw, 30px)'
                : 'clamp(8px, 2.5vw, 15px)',
              lineHeight: 1.1,
              overflowWrap: 'anywhere',
              hyphens: 'auto',
              transform: isSelected ? 'scale(1.04)' : undefined,
              transition: 'transform 120ms, background 200ms',
              boxShadow: isSelected ? `0 0 0 3px ${SELECTED}55` : undefined,
            }}
          >
            {card.word}
          </button>
        )
      })}
    </div>
  )
}
