# Ella's app: inventory of the old implementation

Source: `BuitenZijnApp` at tag `archive/pre-split-2026-10-10`. Paths below are relative to that repo.

## Content data (in `seed/`, images in `seed/images/`)

| File | Rows | Notes |
|---|---|---|
| `ella_dinosaurs.json` | 21 | nummer, nederlandseNaam, wetenschappelijkeNaam, korteBeschrijving, leukWeetje, imageFile. **8 dinosaurs have no image.** |
| `ella_planets.json` | 9 | Same fields; all 9 have an image |
| `ella_knutselen.json` | 21 | YouTube craft videos; categories: tekenen, vouwen, schilderen, verven, slijm maken, boetseren, stempelen. Also in code: `convex/populate_knutselen.ts` |
| `ella_memory_themes.json` | 5 | name, emoji, emojis[]. Defaults also in `convex/memoryGame.ts` (`seedThemes`) |
| `ella_puzzle_images.json` | 6 | Images for the multiplication-grid puzzle |
| `ella_game_settings.json` | 2 | Per-game settings, e.g. `multiplication_grid`: gridSize, blanksPerRound, bombChance |
| `ella_rekenoefeningen_settings.json` | 0 | Never saved; defaults live in `convex/rekenoefeningen.ts` |

Not carried over: `ella_game_scores` (test scores only).

## Static assets in the old repo (copied to `seed/assets/`)

- `public/ella/puzzle_images/1..10.png`
- `public/ella/sounds/`: completed.mp3, explosion.mp3, fail.mp3, succes.wav
- `mobile/assets/sounds/`: mixkit-completion-of-a-level-2063.wav, mixkit-winning-a-coin-video-game-2069.wav

## Features

| Feature | Mechanics | Web | Mobile | Backend |
|---|---|---|---|---|
| Knutselen | 7 categories, each with YouTube tutorial videos | `src/app/activiteiten/ella/knutselen/` | `EllaKnutselenScreen.tsx` | `knutselen.ts` |
| Maaltafel puzzel | Fill in the blanks of a multiplication grid; image revealed underneath; "bomb" on wrong answers; sounds | `src/app/activiteiten/ella/rekenen/maaltafel-puzzel/` | `EllaMaaltafelPuzzelScreen.tsx` | `rekenen.ts` |
| Rekenoefeningen | +, −, ×, ÷ and fractions; difficulty presets (range, questions per round, time limit, points, speed bonus, 1–3 star thresholds) | `src/app/activiteiten/ella/rekenen/oefeningen/` | `EllaRekenoefenScreen.tsx` | `rekenoefeningen.ts` |
| Dino quiz | Show a dinosaur image, pick the name from 3 options | none | `EllaDinoQuizScreen.tsx` | `dinosaurs.ts` |
| Memory | Emoji themes, pairs or triples, configurable grid | `src/app/activiteiten/ella/varia/memory/` | `EllaMemoryScreen.tsx` | `memoryGame.ts` |
| Planeten puzzel | Sliding (15-)puzzle with planet images, 3×3 to 7×7 | `src/app/activiteiten/ella/planeten/` | `EllaPlanetPuzzelScreen.tsx` | `planets.ts` |
| Resultaten | Per-game scores, personal stats, leaderboard | `src/app/activiteiten/ella/resultaten/` | `EllaResultatenScreen.tsx` | `ellaScores.ts` |
| Admin | Manage knutselen, rekenen settings and puzzle images, dinosaurs, planets, memory themes | `src/app/(dashboard)/admin/ella/*` | none | (same modules) |

Mobile screens are in `mobile/src/screens/main/`; backend modules are in `convex/`. The schema for all `ella_*` tables is in `convex/schema.ts`.

Score fields per game (`ella_game_scores`): timeSeconds, moves (planeten), mistakes (maaltafel), correctAnswers and totalQuestions (dino), stars, difficulty (e.g. "4x4"), subjectName.

## Decisions already made for the new app

- Own repo, own Expo project and app ID, own Convex project; built after BuitenZijn.
- Built for multiple families, with schools later: parent account → child profiles (no email or password for children); content is shared and managed only by the owner; scores per child.
- Children's data: collect as little as possible, no third-party tracking, plan for the Google Play Families policy (check the YouTube embeds against it).
- Email via Resend; auth via Convex Auth (same stack as XploreR).
