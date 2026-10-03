// Themed packs sold as downloads. Shared by the website (previews, counts)
// and scripts/build-packs.mjs (the actual files).
import { build } from './generators.js';
import { finalize } from './core.js';

const HUES = ['0', '25', '45', '90', '130', '165', '195', '220', '260', '290', '320', '345'];

export const PACKS = [
  {
    id: 'dungeon-loot',
    name: 'Dungeon Loot',
    tagline: 'Potions, weapons, gems, keys, chests and shields for RPGs and roguelikes.',
    sets: [
      { gen: 'potion', label: 'potions', vary: { shape: ['round', 'tall', 'flask', 'square'], fill: ['full', 'half'], hue: HUES } },
      { gen: 'weapon', label: 'weapons', vary: { type: ['sword', 'dagger', 'axe', 'staff', 'spear'], metal: ['steel', 'gold', 'tinted'] }, n: 6 },
      { gen: 'gem', label: 'gems', vary: { cut: ['diamond', 'round', 'emerald', 'heart', 'drop'], hue: HUES } },
      { gen: 'key', label: 'keys', vary: { bow: ['round', 'square', 'clover'], metal: ['gold', 'iron', 'tinted'] }, n: 4 },
      { gen: 'chest', label: 'chests', vary: { style: ['wood', 'royal', 'painted'], lid: ['round', 'flat'] }, n: 6 },
      { gen: 'shield', label: 'shields', vary: { shape: ['heater', 'round', 'kite'], emblem: ['none', 'cross', 'stripe', 'chevron', 'boss'] }, n: 4 },
    ],
  },
  {
    id: 'monster-mob',
    name: 'Monster Mob',
    tagline: 'Cute procedural creatures in 16px and 32px for platformers, RPGs and idle games.',
    sets: [
      { gen: 'creature', label: 'creatures-16', vary: { size: ['16'], extras: ['none', 'horns', 'ears', 'spikes', 'antennae'] }, n: 24 },
      { gen: 'creature', label: 'creatures-32', vary: { size: ['32'], extras: ['none', 'horns', 'ears', 'spikes', 'antennae'] }, n: 12 },
    ],
  },
  {
    id: 'space-fleet',
    name: 'Space Fleet',
    tagline: 'Player ships, enemies and bosses for shoot-em-ups and space games.',
    sets: [
      { gen: 'spaceship', label: 'ships-16', vary: { size: ['16'] }, n: 120 },
      { gen: 'spaceship', label: 'ships-32', vary: { size: ['32'] }, n: 60 },
    ],
  },
  {
    id: 'overworld',
    name: 'Overworld',
    tagline: 'Seamless terrain tiles plus trees, rocks and mushrooms to dress a map.',
    sets: [
      { gen: 'tile', label: 'tiles', vary: { kind: ['grass', 'dirt', 'sand', 'stone', 'brick', 'water', 'planks', 'lava'] }, n: 8 },
      { gen: 'tree', label: 'trees', vary: { kind: ['round', 'pine', 'bush', 'dead'] }, n: 15 },
      { gen: 'rock', label: 'rocks', vary: { ore: ['none', 'some', 'rich'] }, n: 12 },
      { gen: 'mushroom', label: 'mushrooms', vary: { cap: ['dome', 'flat', 'tall'], hue: HUES } },
    ],
  },
];

function combos(vary) {
  let out = [{}];
  for (const [key, values] of Object.entries(vary)) out = out.flatMap((c) => values.map((v) => ({ ...c, [key]: v })));
  return out;
}

/**
 * Every sprite in a pack, deduplicated by pixels.
 * Returns [{ set, name, img }] where img is finalized RGBA at 1x.
 */
export function expandPack(pack, opts = {}) {
  const seen = new Set();
  const out = [];
  for (const set of pack.sets) {
    let i = 0;
    for (const params of combos(set.vary)) {
      for (let k = 0; k < (set.n || 1); k++) {
        // A few retries per slot so duplicates get replaced rather than dropped.
        for (let attempt = 0; attempt < 5; attempt++) {
          const seed = `${pack.id}/${set.label}/${JSON.stringify(params)}/${k}/${attempt}`;
          const img = finalize(build(set.gen, seed, params), opts);
          let key = '';
          for (let j = 0; j < img.data.length; j += 4) key += img.data[j + 3] ? `${img.data[j]},${img.data[j + 1]},${img.data[j + 2]};` : '.';
          if (seen.has(key)) continue;
          seen.add(key);
          i++;
          out.push({ set: set.label, name: `${set.label}_${String(i).padStart(3, '0')}`, img, gen: set.gen, params, seed });
          break;
        }
      }
    }
  }
  return out;
}

function blit(dst, img, ox, oy, k) {
  for (let y = 0; y < img.h * k; y++)
    for (let x = 0; x < img.w * k; x++) {
      const si = (((y / k) | 0) * img.w + ((x / k) | 0)) * 4;
      if (!img.data[si + 3]) continue;
      const dx = ox + x, dy = oy + y;
      if (dx < 0 || dy < 0 || dx >= dst.w || dy >= dst.h) continue;
      const di = (dy * dst.w + dx) * 4;
      for (let c = 0; c < 4; c++) dst.data[di + c] = img.data[si + c];
    }
}

// 630x500 is itch.io's recommended cover size.
export function cover(sprites, w = 630, h = 500) {
  const img = { w, h, data: new Uint8ClampedArray(w * h * 4) };
  for (let i = 0; i < w * h; i++) {
    const checker = ((i % w >> 4) + ((i / w) >> 4)) % 2;
    img.data.set(checker ? [30, 28, 46, 255] : [26, 24, 40, 255], i * 4);
  }
  const cell = 70;
  const cols = Math.floor(w / cell), rows = Math.floor(h / cell);
  const ox = (w - cols * cell) / 2, oy = (h - rows * cell) / 2;
  const step = Math.max(1, Math.floor(sprites.length / (cols * rows)));
  for (let n = 0; n < cols * rows; n++) {
    const s = sprites[(n * step) % sprites.length].img;
    const k = Math.floor(60 / s.w);
    blit(img, s, Math.round(ox + (n % cols) * cell + (cell - s.w * k) / 2), Math.round(oy + Math.floor(n / cols) * cell + (cell - s.h * k) / 2), k);
  }
  return img;
}
