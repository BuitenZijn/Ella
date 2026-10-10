/**
 * Seed the dinosaurs and planets from the old app (seed/*.json and their
 * images in seed/images/) into a Convex deployment.
 *
 *   cd packages/backend
 *   node scripts/seedContent.mjs          # the dev deployment
 *   node scripts/seedContent.mjs --prod   # production
 *
 * Each image is uploaded to file storage, then its card is inserted. A card
 * whose number already exists is refused, so rerunning after a failure only
 * adds what is missing.
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

for (const [table, file] of [
  ['dinosaurs', 'ella_dinosaurs.json'],
  ['planets', 'ella_planets.json'],
]) {
  const rows = JSON.parse(readFileSync(join(seedDir, file), 'utf8'))
  for (const row of rows.sort((a, b) => a.nummer - b.nummer)) {
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
