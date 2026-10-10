# Seed content

Exported from the old BuitenZijnApp (see `docs/ELLA_INVENTORY.md`).

The dinosaurs and planets, with their images, are loaded into a Convex
deployment with:

```bash
cd packages/backend
node scripts/seedContent.mjs          # dev deployment
node scripts/seedContent.mjs --prod   # production
```

The other files (crafts, memory themes, puzzle images, game settings, sounds)
are loaded when their game is ported.
