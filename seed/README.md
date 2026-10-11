# Seed content

Exported from the old BuitenZijnApp (see `docs/ELLA_INVENTORY.md`).

All content (dinosaurs, planets, crafts, memory themes, the multiplication
grid's pictures and settings) is loaded into a Convex deployment with:

```bash
cd packages/backend
node scripts/seedContent.mjs          # dev deployment
node scripts/seedContent.mjs --prod   # production
```

The family photo among the grid pictures (`IMG-…`) comes in switched off, so
other families never see it; switch it on under Inhoud → Puzzelafbeeldingen
if you want it. The planet puzzle's old "gridSize 4" setting is the app's
default size. `ella_rekenoefeningen_settings.json` was empty: the levels use
the defaults in `convex/lib/games.ts`. The sounds in `assets/sounds` are
bundled with the mobile app.
