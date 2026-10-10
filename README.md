# Ella

An educational app for children: crafts, arithmetic games, a dinosaur quiz,
memory and planet puzzles. Built for our own children first, and meant to be
offered to other parents and to schools later.

It started inside the BuitenZijn app and is now its own product, with its own
repo, app ID and Convex project. Development starts after the BuitenZijn
rebuild; until then this repo holds what must not get lost.

## Contents

| Path | What |
| --- | --- |
| `docs/ELLA_INVENTORY.md` | Every game and feature of the old implementation, where its code lives, and the decisions made for the new app |
| `seed/*.json` | Content exported from the old app: dinosaurs, planets, craft videos, memory themes, puzzle images, game settings |
| `seed/images/` | The images the seed files reference (`imageFile` / `storageFile`) |
| `seed/assets/` | Puzzle images and sound effects that were bundled with the old app |

The old code is in the `BuitenZijnApp` repo at tag
`archive/pre-split-2026-10-10`.

## Planned setup

Same stack as BuitenZijn (and XploreR): a turborepo with a Next.js web app, an
Expo mobile app and a Convex backend with Convex Auth, Resend for email and a
shared Tamagui design system.

- A parent signs up and adds child profiles; children don't get an email or
  password.
- Content (dinosaurs, planets, crafts, memory themes) is shared by everyone
  and managed only by the owner.
- Scores are saved per child.
- Classes and teacher accounts come later; the data model leaves room for them.
- Children's data: collect as little as possible, no third-party tracking, and
  meet the Google Play Families policy.
