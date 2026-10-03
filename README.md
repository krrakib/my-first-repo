# Spriteloom

Pixel-art game sprites you can remix. Every sprite is a tiny program with knobs
(color, shape, size, outline, retro palette); the same seed and knobs always give the same sprite.

- **Website:** `index.html`, a free in-browser generator + pack shop. Static, no build step (host on GitHub Pages).
- **Packs:** `node scripts/build-packs.mjs` writes ready-to-sell zips to `dist/` (Node 22+, no dependencies).
- **Images:** `node scripts/build-images.mjs` regenerates the favicon and social image.
- **Business plan:** see [LAUNCH_PLAN.md](LAUNCH_PLAN.md).

## Layout

```
engine/core.js        seeded RNG, material grid, auto shading, outlines, palettes, sheets
engine/generators.js  the 12 sprite generators and their knobs
engine/packs.js       themed pack definitions + cover renderer
engine/node-io.js     PNG + ZIP writers (Node only)
assets/               website script, styles, config (store links and prices)
scripts/              pack and image build scripts
```

Preview locally with `python3 -m http.server` and open http://localhost:8000
(ES modules don't load from `file://`).
