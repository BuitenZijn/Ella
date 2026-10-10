/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest'
import { api, internal } from '../convex/_generated/api'
import { userFixture } from './fixtures'

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
