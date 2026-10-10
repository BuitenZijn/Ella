# Ella

An educational app for children: crafts, arithmetic games, a dinosaur quiz,
memory and planet puzzles. Built for our own children first, and meant to be
offered to other parents and to schools later.

It started inside the BuitenZijn app and is now its own product. The
foundation (Convex Auth, the Tamagui design system, CI) is shared with the
BuitenZijn repo; the games are ported from the old app one by one.

## Structure

| Path | What |
| --- | --- |
| `apps/web` | Next.js website: home, sign-in, account, admin |
| `apps/mobile` | Expo / React Native app |
| `packages/backend` | Convex functions and schema, shared by both apps |
| `packages/ui` | Tamagui design system shared by web and mobile |
| `packages/shared` | Dependency-free helpers and shared config |
| `docs/` | The inventory of the old implementation and the plan |
| `seed/` | Content exported from the old app (dinosaurs, planets, crafts, …) |

## Setup

```bash
pnpm install
cp .env.example .env    # points the apps at the dev deployment
```

The Convex deployment needs these environment variables
(`npx convex env set NAME value` in `packages/backend`):

| Variable | Value |
| --- | --- |
| `JWT_PRIVATE_KEY`, `JWKS` | Generate with `node packages/backend/scripts/generateKeys.mjs` |
| `SITE_URL` | The web app's URL (`http://localhost:3000` in development) |
| `AUTH_RESEND_KEY` | Resend API key, for verification and password-reset emails |
| `EMAIL_FROM` | Sender, e.g. `Ella <noreply@…>` |

## Running and checks

```bash
pnpm dev          # Convex + web
pnpm dev:all      # Convex + web + mobile (Expo)
pnpm check-types && pnpm lint && pnpm test
```

## Before the first public release

- **App ID and name:** `app.ella.learn` and "Ella" are working values
  (`apps/mobile/app.json`); there is no EAS project or app icon yet.
- **Support address and domain:** `SUPPORT_EMAIL` and `DEFAULT_SITE_URL` in
  `packages/shared/src/config.ts` are placeholders.
- **Privacy policy:** the page is a draft for the test version with our own
  children; have it reviewed before offering Ella to other families.

## Plan

- A parent signs up and adds child profiles; children don't get an email or
  password.
- Content (dinosaurs, planets, crafts, memory themes) is shared by everyone
  and managed only by the owner.
- Scores are saved per child.
- Classes and teacher accounts come later; the data model leaves room for them.
- Children's data: collect as little as possible, no third-party tracking, and
  meet the Google Play Families policy.

See `docs/ELLA_INVENTORY.md` for every game of the old implementation.
