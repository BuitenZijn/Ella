/**
 * Seed the content from the old app (seed/*.json and their images in
 * seed/images/) into a Convex deployment: dinosaurs, planets, craft videos,
 * memory themes, the multiplication grid's pictures and its settings.
 *
 *   cd packages/backend
 *   node scripts/seedContent.mjs          # the dev deployment
 *   node scripts/seedContent.mjs --prod   # production
 *
 * Each image is uploaded to file storage, then its row is inserted. A row
 * that already exists is refused, so rerunning after a failure only adds
 * what is missing.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const prod = process.argv.includes('--prod')
const seedDir = join(import.meta.dirname, '../../../seed')
// The CLI's entry point, run with this Node: no shell, so the JSON arguments
// reach it unchanged on Windows too.
const convexCli = join(
  dirname(createRequire(import.meta.url).resolve('convex/package.json')),
  'bin/main.js',
)

function convexRun(fn, args) {
  const out = execFileSync(
    process.execPath,
    [convexCli, 'run', ...(prod ? ['--prod'] : []), fn, JSON.stringify(args)],
    { encoding: 'utf8' },
  )
  return out.trim()
}

async function upload(file) {
  const url = JSON.parse(convexRun('functions/content:seedUploadUrl', {}))
  const type = file.endsWith('.png') ? 'image/png' : 'image/jpeg'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': type },
    body: readFileSync(join(seedDir, 'images', file)),
  })
  if (!res.ok) throw new Error(`Upload of ${file} failed: ${res.status}`)
  return (await res.json()).storageId
}

/** Run a seed mutation; a row that is already there is skipped. */
async function seed(label, insert) {
  try {
    await insert()
    console.log(label)
  } catch (error) {
    const message = String(error.stderr ?? error.message)
    if (!message.includes('already exists')) throw error
    console.log(`${label}: already there, skipped`)
  }
}

const readSeed = file => JSON.parse(readFileSync(join(seedDir, file), 'utf8'))

const seeded = JSON.parse(convexRun('functions/content:seedState', {}))

for (const [table, file] of [
  ['dinosaurs', 'ella_dinosaurs.json'],
  ['planets', 'ella_planets.json'],
]) {
  const rows = JSON.parse(readFileSync(join(seedDir, file), 'utf8'))
  for (const row of rows.sort((a, b) => a.nummer - b.nummer)) {
    if (seeded[table].includes(row.nummer)) continue
    const entry = {
      table,
      number: row.nummer,
      name: row.nederlandseNaam,
      scientificName: row.wetenschappelijkeNaam,
      description: row.korteBeschrijving,
      funFact: row.leukWeetje,
    }
    try {
      const image = row.imageFile ? await upload(row.imageFile) : undefined
      convexRun('functions/content:seedEntry', image ? { ...entry, image } : entry)
      console.log(`${table} #${row.nummer} ${row.nederlandseNaam}`)
    } catch (error) {
      const message = String(error.stderr ?? error.message)
      if (message.includes('already exists')) {
        console.log(`${table} #${row.nummer} already there, skipped`)
      } else {
        throw error
      }
    }
  }
}

for (const craft of readSeed('ella_knutselen.json')) {
  await seed(`craft ${craft.titel}`, () =>
    convexRun('functions/content:seedCraft', {
      category: craft.categorie,
      title: craft.titel,
      youtubeUrl: craft.youtube_url,
    }),
  )
}

for (const theme of readSeed('ella_memory_themes.json')) {
  await seed(`memory theme ${theme.name}`, () =>
    convexRun('functions/content:seedMemoryTheme', {
      name: theme.name,
      emoji: theme.emoji,
      emojis: theme.emojis,
      active: theme.isActive,
    }),
  )
}

// Family photos (the old app's WhatsApp picture) are not shown to other
// families: they come in switched off.
const isPhoto = name => /^IMG[-_]/i.test(name)
for (const picture of readSeed('ella_puzzle_images.json')) {
  if (seeded.puzzleImages.includes(picture.name.replace(/.w+$/, ''))) continue
  const added = convexRun('functions/content:seedPuzzleImage', {
    name: picture.name.replace(/.w+$/, ''),
    image: await upload(picture.storageFile),
    active: picture.isActive && !isPhoto(picture.name),
  })
  console.log(`puzzle image ${picture.name}${added === 'true' ? '' : ': already there, skipped'}`)
}

const grid = readSeed('ella_game_settings.json').find(s => s.game === 'multiplication_grid')
if (grid) {
  convexRun('functions/content:seedMaaltafelSettings', grid.settings)
  console.log('maaltafel settings')
}
