/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest'
import { api, internal } from '../convex/_generated/api'
import { expectPermanentError, userFixture } from './fixtures'

describe('family', () => {
  it('keeps each family to itself', async () => {
    const f = await userFixture()
    const ella = await f.authorClient.mutation(api.functions.family.addChild, {
      name: ' Ella ',
      avatar: '🦊',
    })
    expect(
      (await f.authorClient.query(api.functions.family.listChildren, {})).map(
        c => c.name,
      ),
    ).toEqual(['Ella'])
    expect(
      await f.playerClient.query(api.functions.family.listChildren, {}),
    ).toEqual([])

    await expectPermanentError(
      f.playerClient.mutation(api.functions.family.saveScore, {
        childId: ella,
        game: 'memory',
        timeSeconds: 10,
      }),
      'NOT_FOUND',
    )
    await expectPermanentError(
      f.playerClient.query(api.functions.family.childResults, {
        childId: ella,
      }),
      'NOT_FOUND',
    )
    await expectPermanentError(
      f.authorClient.mutation(api.functions.family.addChild, {
        name: 'X',
        avatar: '📷',
      }),
      'INVALID_ARGUMENT',
    )
  })

  it('saves scores, rejects nonsense and shows the best per child', async () => {
    const f = await userFixture()
    const ella = await f.authorClient.mutation(api.functions.family.addChild, {
      name: 'Ella',
      avatar: '🦊',
    })
    const tom = await f.authorClient.mutation(api.functions.family.addChild, {
      name: 'Tom',
      avatar: '🐻',
    })
    const save = (childId: typeof ella, timeSeconds: number) =>
      f.authorClient.mutation(api.functions.family.saveScore, {
        childId,
        game: 'memory',
        timeSeconds,
        difficulty: '4×4',
      })
    await save(ella, 50)
    await save(ella, 40)
    await save(tom, 45)
    await expectPermanentError(save(tom, -1), 'INVALID_ARGUMENT')
    await expectPermanentError(
      f.authorClient.mutation(api.functions.family.saveScore, {
        childId: tom,
        game: 'rekenoefeningen',
        timeSeconds: 30,
        stars: 4,
      }),
      'INVALID_ARGUMENT',
    )

    const best = await f.authorClient.query(api.functions.family.familyBest, {
      game: 'memory',
    })
    expect(best.map(b => [b.childName, b.timeSeconds])).toEqual([
      ['Ella', 40],
      ['Tom', 45],
    ])
    const results = await f.authorClient.query(
      api.functions.family.childResults,
      { childId: ella },
    )
    expect(results.games.find(g => g.game === 'memory')?.played).toBe(2)
  })

  it('removes a child with its scores, and the family with the account', async () => {
    const f = await userFixture()
    const ella = await f.authorClient.mutation(api.functions.family.addChild, {
      name: 'Ella',
      avatar: '🦊',
    })
    await f.authorClient.mutation(api.functions.family.addChild, {
      name: 'Tom',
      avatar: '🐻',
    })
    await f.authorClient.mutation(api.functions.family.saveScore, {
      childId: ella,
      game: 'dino_quiz',
      timeSeconds: 20,
    })
    await f.authorClient.mutation(api.functions.family.removeChild, {
      childId: ella,
    })
    expect(await f.t.run(ctx => ctx.db.query('scores').collect())).toEqual([])

    await f.t.mutation(internal.functions.users.processAccountDeletion, {
      userId: f.author,
    })
    expect(await f.t.run(ctx => ctx.db.query('children').collect())).toEqual([])
  })
})
