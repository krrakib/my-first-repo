#!/usr/bin/env node
// Builds every pack in engine/packs.js into dist/<pack>.zip, ready to upload to
// itch.io / Gumroad / Lemon Squeezy, plus a cover image per pack.
//   node scripts/build-packs.mjs            -> all packs + all-packs bundle
//   node scripts/build-packs.mjs overworld  -> one pack
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scale, sheet } from '../engine/core.js';
import { encodePNG, zip } from '../engine/node-io.js';
import { PACKS, expandPack, cover } from '../engine/packs.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const BRAND = 'Spriteloom';

const LICENSE = `${BRAND} Asset License

You may:
  - Use these sprites in unlimited personal and commercial projects
    (games, apps, videos, websites), including paid ones.
  - Edit, recolor, crop and combine them however you like.
  - No attribution required (a credit is appreciated!).

You may not:
  - Resell or redistribute the sprites on their own, or as part of
    another asset pack, sprite library or template.
  - Claim you created the original sprites.

Questions: see the website the pack came from.
`;

function readme(pack, sprites) {
  const sets = {};
  for (const s of sprites) sets[s.set] = (sets[s.set] || 0) + 1;
  return `${BRAND} - ${pack.name}
${pack.tagline}

${sprites.length} sprites:
${Object.entries(sets).map(([k, v]) => `  - ${k}: ${v}`).join('\n')}

Folders
  sprites/      every sprite as its own PNG at original pixel size
  sprites@4x/   the same sprites scaled 4x (crisp, no blur)
  sheets/       one spritesheet per set at 1x and 4x, with a .json atlas
                (TexturePacker "hash" format: works with Phaser, PixiJS,
                Godot/Unity atlas importers)

Engine tips
  - Use "nearest" / "point" / "no filter" texture filtering so pixels stay sharp.
  - Godot: Project Settings > Rendering > Textures > Default Texture Filter = Nearest.
  - Unity: set Filter Mode = Point, Compression = None, Pixels Per Unit = 16.
`;
}

function atlas(sh, names, image) {
  const frames = {};
  sh.frames.forEach((f, i) => {
    frames[`${names[i]}.png`] = {
      frame: f, rotated: false, trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h }, sourceSize: { w: f.w, h: f.h },
    };
  });
  return JSON.stringify({ frames, meta: { app: BRAND, image, size: { w: sh.w, h: sh.h }, scale: '1' } }, null, 1);
}

function buildPack(pack) {
  const sprites = expandPack(pack);
  const files = [
    { name: 'LICENSE.txt', data: LICENSE },
    { name: 'README.txt', data: readme(pack, sprites) },
  ];
  for (const s of sprites) {
    files.push({ name: `sprites/${s.set}/${s.name}.png`, data: encodePNG(s.img) });
    files.push({ name: `sprites@4x/${s.set}/${s.name}.png`, data: encodePNG(scale(s.img, 4)) });
  }
  const bySet = {};
  for (const s of sprites) (bySet[s.set] ||= []).push(s);
  for (const [set, list] of Object.entries(bySet)) {
    const sh = sheet(list.map((s) => s.img), 12);
    const names = list.map((s) => s.name);
    files.push({ name: `sheets/${set}.png`, data: encodePNG(sh) });
    files.push({ name: `sheets/${set}.json`, data: atlas(sh, names, `${set}.png`) });
    const big = scale(sh, 4);
    files.push({ name: `sheets/${set}@4x.png`, data: encodePNG(big) });
    files.push({ name: `sheets/${set}@4x.json`, data: atlas({ ...sheet(list.map((s) => scale(s.img, 4)), 12) }, names, `${set}@4x.png`) });
  }
  const coverPng = encodePNG(cover(sprites));
  files.push({ name: 'cover.png', data: coverPng });
  return { sprites, files, coverPng };
}

mkdirSync(DIST, { recursive: true });
const only = process.argv[2];
const all = [];
for (const pack of PACKS) {
  if (only && pack.id !== only) continue;
  const { sprites, files, coverPng } = buildPack(pack);
  const data = zip(files.map((f) => ({ ...f, name: `${BRAND}-${pack.name.replace(/\s+/g, '')}/${f.name}` })));
  writeFileSync(join(DIST, `${BRAND.toLowerCase()}-${pack.id}.zip`), data);
  writeFileSync(join(DIST, `${pack.id}-cover.png`), coverPng);
  all.push(...files.map((f) => ({ ...f, name: `${BRAND}-AllPacks/${pack.name.replace(/\s+/g, '')}/${f.name}` })));
  console.log(`${pack.id}: ${sprites.length} sprites, ${(data.length / 1024 / 1024).toFixed(1)} MB`);
}
if (!only) {
  const data = zip(all);
  writeFileSync(join(DIST, `${BRAND.toLowerCase()}-all-packs.zip`), data);
  console.log(`all-packs bundle: ${(data.length / 1024 / 1024).toFixed(1)} MB`);
}
console.log(`Done. Files are in ${DIST}`);
