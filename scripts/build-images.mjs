#!/usr/bin/env node
// Regenerates assets/favicon.png and assets/og.png (the social share image).
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../engine/generators.js';
import { finalize, scale } from '../engine/core.js';
import { encodePNG } from '../engine/node-io.js';
import { PACKS, expandPack, cover } from '../engine/packs.js';

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

const logo = finalize(build('creature', 'logo-7', { size: '16', hue: '45' }));
writeFileSync(join(ASSETS, 'favicon.png'), encodePNG(scale(logo, 2)));

// 1200x630 mosaic drawn from every pack.
const sprites = PACKS.flatMap((p) => expandPack(p).filter((s) => s.img.w === 16));
const mixed = sprites.filter((_, i) => i % 7 === 0).sort((a, b) => (a.seed > b.seed ? 1 : -1));
writeFileSync(join(ASSETS, 'og.png'), encodePNG(cover(mixed, 1200, 630)));
console.log('Wrote assets/favicon.png and assets/og.png');
