/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest'
import { api, internal } from '../convex/_generated/api'
import { expectPermanentError, userFixture } from './fixtures'

const dino = {
  table: 'dinosaurs' as const,
  number: 1,
  name: 'Tyrannosaurus Rex',
  scientificName: 'Tyrannosaurus rex',
  description: 'Een grote vleeseter.',
  funFact: 'Korte armpjes!',
}

describe('content', () => {
  it('shows the cards to signed-in users only, in order', async () => {
    const f = await userFixture()
    await f.t.mutation(internal.functions.content.seedEntry, {
      ...dino,
      number: 2,
      name: 'Triceratops',
    })
    await f.t.mutation(internal.functions.content.seedEntry, dino)
    const cards = await f.playerClient.query(
      api.functions.content.listDinosaurs,
      {},
    )
    expect(cards.map(c => c.name)).toEqual(['Tyrannosaurus Rex', 'Triceratops'])
    expect(cards[0].imageUrl).toBeNull()
    await expect(
      f.t.query(api.functions.content.listDinosaurs, {}),
    ).rejects.toThrow()
  })

  it('refuses to seed a number twice', async () => {
    const f = await userFixture()
    await f.t.mutation(internal.functions.content.seedEntry, dino)
    await expect(
      f.t.mutation(internal.functions.content.seedEntry, dino),
    ).rejects.toThrow(/already exists/)
  })
})

describe('content management', () => {
  it('needs content:manage', async () => {
    const f = await userFixture()
    await expect(
      f.playerClient.mutation(api.functions.contentAdmin.saveCraft, {
        category: 'tekenen',
        title: 'Een kat',
        youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
      }),
    ).rejects.toThrow(/content:manage/)
  })

  it('manages crafts with valid YouTube links only', async () => {
    const f = await userFixture()
    await f.adminClient.mutation(api.functions.contentAdmin.saveCraft, {
      category: 'tekenen',
      title: 'Een kat',
      youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
    })
    await expectPermanentError(
      f.adminClient.mutation(api.functions.contentAdmin.saveCraft, {
        category: 'vouwen',
        title: 'Een boot',
        youtubeUrl: 'https://example.com/video',
      }),
      'INVALID_ARGUMENT',
    )
    const crafts = await f.playerClient.query(
      api.functions.content.listCrafts,
      {
        category: 'tekenen',
      },
    )
    expect(crafts.map(c => c.title)).toEqual(['Een kat'])
  })

  it('shows active memory themes and falls back to default settings', async () => {
    const f = await userFixture()
    const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨']
    await f.adminClient.mutation(api.functions.contentAdmin.saveMemoryTheme, {
      name: 'Dieren',
      emoji: '🐶',
      emojis,
      active: true,
    })
    await f.adminClient.mutation(api.functions.contentAdmin.saveMemoryTheme, {
      name: 'Verborgen',
      emoji: '🙈',
      emojis,
      active: false,
    })
    await expectPermanentError(
      f.adminClient.mutation(api.functions.contentAdmin.saveMemoryTheme, {
        name: 'Te klein',
        emoji: '🐶',
        emojis: ['🐶', '🐶', '🐱'],
        active: true,
      }),
      'INVALID_ARGUMENT',
    )
    const themes = await f.playerClient.query(
      api.functions.content.listMemoryThemes,
      {},
    )
    expect(themes.map(t => t.name)).toEqual(['Dieren'])

    const defaults = await f.playerClient.query(
      api.functions.content.gameSettings,
      {},
    )
    expect(defaults.maaltafel.gridSize).toBe(10)
    expect(defaults.mathLevels).toHaveLength(3)
    await f.adminClient.mutation(
      api.functions.contentAdmin.saveMaaltafelSettings,
      {
        gridSize: 5,
        blanksPerRound: 4,
        bombChance: 0,
      },
    )
    const changed = await f.playerClient.query(
      api.functions.content.gameSettings,
      {},
    )
    expect(changed.maaltafel).toEqual({
      gridSize: 5,
      blanksPerRound: 4,
      bombChance: 0,
    })
  })

  it('uses the default word lists until lists are made', async () => {
    const f = await userFixture()
    const defaults = await f.playerClient.query(
      api.functions.content.listWordLists,
      {},
    )
    expect(defaults.map(l => l.name)).toEqual([
      'Dieren',
      'Eten',
      'Thuis',
      'Buiten',
    ])

    const words = [
      { word: 'kat', emoji: '🐱' },
      { word: 'Kat ', emoji: '🐈' }, // the same word twice counts once
      { word: 'hond', emoji: '🐶' },
      { word: 'vis', emoji: '🐟' },
    ]
    await expectPermanentError(
      f.adminClient.mutation(api.functions.contentAdmin.saveWordList, {
        name: 'Te kort',
        emoji: '🐾',
        words,
        active: true,
      }),
      'INVALID_ARGUMENT',
    )
    await f.adminClient.mutation(api.functions.contentAdmin.saveWordList, {
      name: 'Huisdieren',
      emoji: '🐾',
      words: [...words, { word: 'muis', emoji: '🐭' }],
      active: true,
    })
    await f.adminClient.mutation(api.functions.contentAdmin.saveWordList, {
      name: 'Verborgen',
      emoji: '🙈',
      words: [...words, { word: 'muis', emoji: '🐭' }],
      active: false,
    })
    const lists = await f.playerClient.query(
      api.functions.content.listWordLists,
      {},
    )
    expect(lists.map(l => l.name)).toEqual(['Huisdieren'])
    expect(lists[0].words.map(w => w.word)).toEqual([
      'kat',
      'hond',
      'vis',
      'muis',
    ])
    await expectPermanentError(
      f.adminClient.mutation(
        api.functions.contentAdmin.importDefaultWordLists,
        {},
      ),
      'INVALID_ARGUMENT',
    )
    await expect(
      f.playerClient.mutation(api.functions.contentAdmin.saveWordList, {
        name: 'Nee',
        emoji: '🐾',
        words,
        active: true,
      }),
    ).rejects.toThrow()
  })

  it('edits a card and refuses a taken number', async () => {
    const f = await userFixture()
    await f.t.mutation(internal.functions.content.seedEntry, dino)
    await f.t.mutation(internal.functions.content.seedEntry, {
      ...dino,
      number: 2,
      name: 'Triceratops',
    })
    const [rex] = await f.playerClient.query(
      api.functions.content.listDinosaurs,
      {},
    )
    await expectPermanentError(
      f.adminClient.mutation(api.functions.contentAdmin.saveEntry, {
        ...dino,
        id: rex._id,
        number: 2,
      }),
      'INVALID_ARGUMENT',
    )
    await f.adminClient.mutation(api.functions.contentAdmin.saveEntry, {
      ...dino,
      id: rex._id,
      name: 'T-Rex',
    })
    const cards = await f.playerClient.query(
      api.functions.content.listDinosaurs,
      {},
    )
    expect(cards[0].name).toBe('T-Rex')
  })
})
