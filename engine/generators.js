// Spriteloom generators. Each generator is a small program with knobs:
// the same seed + knobs always produce the same sprite.
import { Grid, M, MAT, rng } from './core.js';

// Always consume the random draw so changing one knob never reshuffles the others.
function auto(value, draw) {
  const rolled = draw();
  return value === undefined || value === 'auto' ? rolled : value;
}
const hueKnob = { key: 'hue', label: 'Color', type: 'hue' };
const sel = (key, label, options) => ({ key, label, type: 'select', options: ['auto', ...options] });

// ---------- Characters ----------

const creature = {
  id: 'creature',
  name: 'Creature',
  category: 'Characters',
  params: [hueKnob, sel('size', 'Size', ['16', '24', '32']), sel('eyes', 'Eyes', ['1', '2', '3']), sel('extras', 'Extras', ['none', 'horns', 'ears', 'spikes', 'antennae'])],
  make(r, p) {
    const n = +auto(p.size, () => '16');
    const hue = +auto(p.hue, () => r.int(0, 359));
    const eyes = +auto(p.eyes, () => r.pick(['2', '2', '2', '1', '3']));
    const extras = auto(p.extras, () => r.pick(['none', 'horns', 'ears', 'spikes', 'antennae']));
    const g = new Grid(n, n);
    const sat = r.range(0.45, 0.75);
    const body = g.mat(M(hue, sat, r.range(0.45, 0.58)));
    const belly = g.mat(M((hue + r.pick([0, 30, -30, 180])) % 360, sat * 0.7, 0.72));
    const dark = g.mat(MAT.ink);
    const white = g.mat(MAT.white);
    const accent = g.mat(M((hue + 150) % 360, 0.6, 0.55));
    const k = n / 16;
    const cx = n / 2;
    const ry = r.range(4.2, 5.6) * k, rx = r.range(4.0, 6.0) * k;
    const cy = n - 2 * k - ry;
    g.disc(cx, cy, rx, ry, body);
    // Lumpy silhouette: bumps on the left, mirrored later.
    for (let b = 0; b < 3 + 2 * k; b++) {
      const a = r.range(Math.PI * 0.5, Math.PI * 1.5);
      g.disc(cx + Math.cos(a) * rx * 0.85, cy + Math.sin(a) * ry * 0.85, r.range(1, 2.2) * k, r.range(1, 2.2) * k, body);
    }
    // Legs
    const legs = r.int(1, 2);
    for (let l = 0; l < legs; l++) {
      const lx = Math.floor(cx - 1 - r.range(1, rx * 0.7));
      g.rect(lx, Math.floor(cy + ry * 0.6), Math.ceil(k), Math.ceil(n - 1 - (cy + ry * 0.6)), body);
    }
    // Arms
    if (r.chance(0.6)) {
      const ay = Math.floor(cy + r.range(-1, 2) * k);
      g.rect(Math.floor(cx - rx - 1.5 * k), ay, Math.ceil(2 * k), Math.ceil(k), body);
    }
    g.mirror();
    g.disc(cx, cy + ry * 0.4, rx * 0.5, ry * 0.45, belly);
    const top = Math.floor(cy - ry);
    if (extras === 'horns') {
      for (let i = 0; i < 2 * k; i++) g.set(Math.floor(cx - rx * 0.5) - Math.floor(i / 2), top - i, accent);
    } else if (extras === 'ears') {
      g.disc(cx - rx * 0.6, top + 1, 1.5 * k, 2 * k, body);
    } else if (extras === 'spikes') {
      for (let x = Math.floor(cx - rx * 0.6); x < cx; x += 2) g.set(x, top, accent);
    } else if (extras === 'antennae') {
      g.line(Math.floor(cx - 2 * k), top, Math.floor(cx - 3 * k), Math.max(1, top - 3 * k), dark);
      g.set(Math.floor(cx - 3 * k), Math.max(1, top - 3 * k), accent);
    }
    g.mirror();
    // Eyes
    const ey = Math.floor(cy - ry * 0.25);
    const es = k >= 1.5 ? 2 : 1;
    const eye = (x) => {
      g.rect(x, ey - es + 1, es + 1, es + 1, white, 3);
      g.rect(x + es, ey, 1, 1, dark, 0);
    };
    if (eyes === 1) eye(Math.floor(cx - 1));
    else {
      const ex = Math.floor(cx - 1 - r.int(1, Math.max(1, Math.floor(rx * 0.5))) - es);
      eye(ex);
      eye(n - 1 - ex - es);
      if (eyes === 3) eye(Math.floor(cx - 1));
    }
    // Mouth
    const my = Math.floor(cy + ry * 0.2);
    const mw = r.int(1, Math.max(1, Math.floor(rx * 0.5)));
    g.rect(Math.floor(cx) - mw, my, mw * 2, 1, dark, 0);
    if (r.chance(0.5)) g.set(Math.floor(cx) - mw + 1, my + 1, white, 3);
    g.keepLargest();
    return g;
  },
};

// Spaceship mask after Dave Bollinger's pixel spaceships.
// 0 empty, 1 body-or-empty, 2 body-or-trim, -1 always spine.
const SHIP_MASK = [
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1],
  [0, 0, 0, 0, 1, -1],
  [0, 0, 0, 1, 1, -1],
  [0, 0, 0, 1, 1, -1],
  [0, 0, 1, 1, 1, -1],
  [0, 1, 1, 1, 2, 2],
  [0, 1, 1, 1, 2, 2],
  [0, 1, 1, 1, 2, 2],
  [0, 1, 1, 1, 1, -1],
  [0, 0, 0, 1, 1, 1],
  [0, 0, 0, 0, 0, 0],
];

const spaceship = {
  id: 'spaceship',
  name: 'Spaceship',
  category: 'Characters',
  params: [hueKnob, sel('size', 'Size', ['16', '32']), sel('engine', 'Engine glow', ['on', 'off'])],
  make(r, p) {
    const n = +auto(p.size, () => '16');
    const hue = +auto(p.hue, () => r.int(0, 359));
    const engine = auto(p.engine, () => 'on');
    const k = n / 16;
    const g = new Grid(n, n);
    const hull = g.mat(M(hue, r.range(0.2, 0.6), r.range(0.5, 0.62)));
    const trim = g.mat(M((hue + r.pick([30, 180, 200])) % 360, 0.6, 0.48));
    const glass = g.mat(M(190, 0.7, 0.7));
    const flame = g.mat(M(30, 0.95, 0.58));
    const ox = Math.floor(n / 2) - 6 * k, oy = Math.floor((n - 12 * k) / 2);
    for (let y = 0; y < 12 * k; y++) {
      for (let x = 0; x < 6 * k; x++) {
        const v = SHIP_MASK[(y / k) | 0][(x / k) | 0];
        let mat = 0;
        if (v === -1) mat = hull;
        else if (v === 1) mat = r.chance(0.55) ? hull : 0;
        else if (v === 2) mat = r.chance(0.5) ? hull : trim;
        if (mat) g.set(ox + x, oy + y, mat);
      }
    }
    g.mirror();
    g.despeckle();
    g.keepLargest();
    // Cockpit along the spine.
    const cTop = oy + Math.floor(3 * k), cLen = Math.max(1, Math.floor(r.range(1, 3) * k));
    for (let y = cTop; y < cTop + cLen; y++) {
      g.set(n / 2 - 1, y, glass, y === cTop ? 3 : -1);
      g.set(n / 2, y, glass);
    }
    if (engine === 'on') {
      let base = 0;
      for (let y = n - 1; y >= 0 && !base; y--) if (g.get(n / 2, y)) base = y;
      for (let i = 1; i <= Math.ceil(k); i++) {
        g.set(n / 2 - 1, base + i, flame, i === 1 ? 2 : 1);
        g.set(n / 2, base + i, flame, i === 1 ? 2 : 1);
      }
    }
    return g;
  },
};

// ---------- Items ----------

const potion = {
  id: 'potion',
  name: 'Potion',
  category: 'Items',
  params: [hueKnob, sel('shape', 'Bottle', ['round', 'tall', 'flask', 'square']), sel('fill', 'Fill', ['full', 'half', 'low'])],
  make(r, p) {
    const hue = +auto(p.hue, () => r.int(0, 359));
    const shape = auto(p.shape, () => r.pick(['round', 'tall', 'flask', 'square']));
    const fill = auto(p.fill, () => r.pick(['full', 'full', 'half', 'low']));
    const g = new Grid(16, 16);
    const glass = g.mat(MAT.glass);
    const liquid = g.mat(M(hue, 0.75, 0.52));
    const cork = g.mat(MAT.wood);
    const neckW = r.pick([2, 4]);
    const neckH = r.int(2, 3);
    // Body
    let bodyTop;
    if (shape === 'round') {
      g.disc(8, 10, 5.5, 5, glass);
      bodyTop = 5;
    } else if (shape === 'tall') {
      g.rect(4, 5, 8, 10, glass);
      bodyTop = 5;
    } else if (shape === 'flask') {
      for (let y = 5; y < 15; y++) {
        const half = Math.min(6, 1 + Math.floor((y - 5) * 0.6) + neckW / 2);
        g.rect(8 - half, y, half * 2, 1, glass);
      }
      bodyTop = 5;
    } else {
      g.rect(3, 7, 10, 8, glass);
      bodyTop = 7;
    }
    const neckTop = bodyTop - neckH;
    g.rect(8 - neckW / 2, neckTop, neckW, neckH + 1, glass);
    g.rect(8 - neckW / 2 - 1, neckTop - 2, neckW + 2, 2, cork);
    // Liquid fills body pixels below the fill line.
    const level = { full: bodyTop + 1, half: 10, low: 12 }[fill];
    for (let y = level; y < 16; y++)
      for (let x = 0; x < 16; x++) if (g.get(x, y) === glass) g.set(x, y, liquid);
    for (let x = 0; x < 16; x++) g.shade(x, level, 2);
    // Glint and bubbles
    for (let y = bodyTop + 1; y < 16; y++) {
      const gx = [...Array(16).keys()].find((x) => g.get(x, y));
      if (gx !== undefined && y < bodyTop + 4) g.set(gx + 1, y, g.get(gx + 1, y), 3);
    }
    for (let b = 0; b < 2; b++) {
      const bx = r.int(6, 10), by = r.int(level + 1, 14);
      if (g.get(bx, by) === liquid) g.shade(bx, by, 3);
    }
    return g;
  },
};

const weapon = {
  id: 'weapon',
  name: 'Weapon',
  category: 'Items',
  params: [hueKnob, sel('type', 'Type', ['sword', 'dagger', 'axe', 'staff', 'spear']), sel('metal', 'Metal', ['steel', 'gold', 'tinted'])],
  make(r, p) {
    const hue = +auto(p.hue, () => r.int(0, 359));
    const type = auto(p.type, () => r.pick(['sword', 'sword', 'dagger', 'axe', 'staff', 'spear']));
    const metalKind = auto(p.metal, () => r.pick(['steel', 'steel', 'gold', 'tinted']));
    const g = new Grid(16, 16);
    const metal = g.mat(metalKind === 'gold' ? MAT.gold : metalKind === 'tinted' ? M(hue, 0.45, 0.62) : MAT.steel);
    const grip = g.mat(M(r.pick([20, 28, hue]), 0.45, 0.32));
    const gem = g.mat(M(hue, 0.85, 0.55));
    const guardMat = g.mat(r.chance(0.5) ? MAT.gold : M(hue, 0.5, 0.45));
    // Points along the diagonal from bottom-left (handle) to top-right (tip).
    const P = (t) => [1 + t, 14 - t];
    const diag = (t0, t1, mat, wide = false) => {
      for (let t = t0; t <= t1; t++) {
        const [x, y] = P(t);
        g.set(x, y, mat);
        if (wide && t < t1) g.set(x + 1, y, mat);
      }
    };
    if (type === 'sword' || type === 'dagger') {
      const hilt = r.int(2, 3);
      const blade = type === 'sword' ? r.int(7, 9) : r.int(4, 5);
      const guard = r.int(1, 2);
      g.set(...P(0), gem, 2);
      diag(1, hilt, grip);
      const [gx, gy] = P(hilt + 1);
      for (let k = -guard - 1; k <= guard + 1; k++) g.set(gx + k, gy + k, guardMat);
      diag(hilt + 2, hilt + 1 + blade, metal, r.chance(0.6));
      // Edge highlight along the upper-left side of the blade.
      for (let t = hilt + 2; t <= hilt + 1 + blade; t++) g.shade(...P(t), 3);
    } else if (type === 'axe') {
      diag(0, 12, grip);
      // Crescent head sticks out perpendicular to the handle (down-right).
      const profile = r.pick([[2, 3, 4, 3, 2], [3, 4, 4, 3], [2, 4, 5, 4, 2]]);
      profile.forEach((depth, i) => {
        const [x, y] = P(8 + i);
        for (let k = 1; k <= depth; k++) {
          g.set(x + k, y + k - 1, metal, k === depth ? 3 : -1);
          g.set(x + k - 1, y + k - 1, metal, k === depth ? 3 : -1);
        }
      });
      if (r.chance(0.5)) {
        const [x, y] = P(10);
        g.set(x - 1, y - 1, metal);
        g.set(x - 2, y - 2, metal);
      }
      g.set(...P(13), metal);
    } else if (type === 'staff') {
      diag(0, 10, grip);
      const [ox, oy] = P(11);
      g.disc(ox + 1, oy, 2.4, 2.4, gem);
      g.shade(ox, oy - 1, 3);
      g.set(...P(9), guardMat);
      g.set(P(9)[0] + 1, P(9)[1] + 1, guardMat);
    } else {
      diag(0, 10, grip);
      g.set(...P(8), guardMat);
      diag(11, 13, metal, true);
      const [sx, sy] = P(11);
      g.set(sx - 1, sy, metal);
      g.set(sx, sy + 1, metal);
    }
    return g;
  },
};

const gem = {
  id: 'gem',
  name: 'Gem',
  category: 'Items',
  params: [hueKnob, sel('cut', 'Cut', ['diamond', 'round', 'emerald', 'heart', 'drop'])],
  make(r, p) {
    const hue = +auto(p.hue, () => r.int(0, 359));
    const cut = auto(p.cut, () => r.pick(['diamond', 'round', 'emerald', 'heart', 'drop']));
    const g = new Grid(16, 16);
    const stone = g.mat(M(hue, 0.8, 0.52));
    if (cut === 'diamond') {
      for (let y = 2; y < 14; y++) {
        const half = Math.round(y < 6 ? 2 + (y - 2) * 1.2 : 6 - (y - 6) * 0.8);
        if (half > 0) g.rect(8 - half, y, half * 2, 1, stone);
      }
    } else if (cut === 'round') {
      g.disc(8, 8, 6, 6, stone);
    } else if (cut === 'emerald') {
      g.rect(3, 4, 10, 8, stone);
      g.rect(4, 3, 8, 10, stone);
    } else if (cut === 'heart') {
      g.disc(5.5, 6.5, 3.2, 3.2, stone);
      g.disc(10.5, 6.5, 3.2, 3.2, stone);
      for (let y = 7; y < 14; y++) g.rect(8 - (14 - y), y, (14 - y) * 2, 1, stone);
    } else {
      g.disc(8, 10, 4.5, 4.5, stone);
      for (let y = 2; y < 9; y++) g.rect(8 - Math.ceil((y - 2) / 1.6), y, Math.ceil((y - 2) / 1.6) * 2, 1, stone);
    }
    // Facet shading by position: bright top-left, dark bottom-right.
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        if (!g.get(x, y)) continue;
        const u = x - 8 + (y - 8);
        g.shade(x, y, u < -5 ? 3 : u < 0 ? 2 : u < 5 ? 1 : 0);
      }
    const sx = r.int(5, 6), sy = r.int(5, 6);
    const spark = g.mat(MAT.white);
    g.set(sx, sy, spark, 3);
    return g;
  },
};

const key = {
  id: 'key',
  name: 'Key',
  category: 'Items',
  params: [hueKnob, sel('metal', 'Metal', ['gold', 'iron', 'tinted']), sel('bow', 'Bow', ['round', 'square', 'clover'])],
  make(r, p) {
    const hue = +auto(p.hue, () => r.int(0, 359));
    const metalKind = auto(p.metal, () => r.pick(['gold', 'gold', 'iron', 'tinted']));
    const bow = auto(p.bow, () => r.pick(['round', 'square', 'clover']));
    const g = new Grid(16, 16);
    const metal = g.mat(metalKind === 'gold' ? MAT.gold : metalKind === 'iron' ? MAT.iron : M(hue, 0.55, 0.55));
    const gemM = g.mat(M(hue, 0.85, 0.5));
    const cy = 7;
    if (bow === 'round') g.disc(4.5, cy + 0.5, 3.5, 3.5, metal);
    else if (bow === 'square') g.rect(1, cy - 3, 7, 7, metal);
    else {
      g.disc(4.5, cy - 1.5, 2, 2, metal);
      g.disc(4.5, cy + 2.5, 2, 2, metal);
      g.disc(2.5, cy + 0.5, 2, 2, metal);
      g.disc(6.5, cy + 0.5, 2, 2, metal);
    }
    g.rect(3, cy - 1, 3, 3, 0);
    if (r.chance(0.4)) g.set(4, cy, gemM, 2);
    const len = r.int(12, 14);
    g.rect(8, cy, len - 7, 2, metal);
    // Teeth
    const teeth = r.int(1, 3);
    for (let t = 0; t < teeth; t++) {
      const tx = len - 1 - t * 2;
      g.rect(tx, cy + 2, 1, r.int(1, 3), metal);
    }
    return g;
  },
};

const chest = {
  id: 'chest',
  name: 'Chest',
  category: 'Items',
  params: [hueKnob, sel('style', 'Style', ['wood', 'royal', 'painted']), sel('lid', 'Lid', ['round', 'flat'])],
  make(r, p) {
    const hue = +auto(p.hue, () => r.int(0, 359));
    const style = auto(p.style, () => r.pick(['wood', 'wood', 'royal', 'painted']));
    const lid = auto(p.lid, () => r.pick(['round', 'flat']));
    const g = new Grid(16, 16);
    const body = g.mat(style === 'wood' ? MAT.wood : style === 'royal' ? M(hue, 0.6, 0.38) : M(hue, 0.55, 0.5));
    const band = g.mat(style === 'royal' ? MAT.gold : MAT.iron);
    const lock = g.mat(MAT.gold);
    g.rect(1, 8, 14, 7, body);
    if (lid === 'round') {
      g.rect(1, 5, 14, 3, body);
      g.rect(2, 4, 12, 1, body);
    } else g.rect(1, 4, 14, 4, body);
    g.rect(1, 8, 14, 1, band, 0);
    for (const bx of [2, 12]) g.rect(bx, 4, 2, 11, band);
    g.rect(7, 7, 2, 3, lock);
    g.set(7, 9, lock, 0);
    return g;
  },
};

const shield = {
  id: 'shield',
  name: 'Shield',
  category: 'Items',
  params: [hueKnob, sel('shape', 'Shape', ['heater', 'round', 'kite']), sel('emblem', 'Emblem', ['none', 'cross', 'stripe', 'chevron', 'boss'])],
  make(r, p) {
    const hue = +auto(p.hue, () => r.int(0, 359));
    const shape = auto(p.shape, () => r.pick(['heater', 'round', 'kite']));
    const emblem = auto(p.emblem, () => r.pick(['none', 'cross', 'stripe', 'chevron', 'boss']));
    const g = new Grid(16, 16);
    const rim = g.mat(r.chance(0.5) ? MAT.steel : MAT.gold);
    const field = g.mat(M(hue, 0.65, 0.45));
    const mark = g.mat(r.chance(0.5) ? MAT.white : M((hue + 180) % 360, 0.7, 0.55));
    const fill = (mat, inset) => {
      if (shape === 'round') g.disc(8, 8, 6.5 - inset, 6.5 - inset, mat);
      else if (shape === 'heater') {
        g.rect(2 + inset, 1 + inset, 12 - 2 * inset, 7 - inset, mat);
        for (let y = 8; y < 15 - inset; y++) {
          const half = Math.round(6 - inset - (y - 8) * 0.85);
          if (half > 0) g.rect(8 - half, y, half * 2, 1, mat);
        }
      } else {
        for (let y = 1 + inset; y < 15 - inset; y++) {
          const half = Math.round((y < 5 ? 3 + y : 7.5 - (y - 5) * 0.7) - inset);
          if (half > 0) g.rect(8 - half, y, half * 2, 1, mat);
        }
      }
    };
    fill(rim, 0);
    fill(field, 1);
    const inField = (x, y) => g.get(x, y) === field;
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        if (!inField(x, y)) continue;
        let on = false;
        if (emblem === 'cross') on = x === 7 || x === 8 || y === 6 || y === 7;
        if (emblem === 'stripe') on = x - y >= -1 && x - y <= 1;
        if (emblem === 'chevron') on = Math.abs(y - 4 - Math.abs(x - 7.5)) < 1.2;
        if (on) g.set(x, y, mark);
      }
    if (emblem === 'boss') g.disc(8, 7.5, 2, 2, rim);
    return g;
  },
};

// ---------- Nature ----------

const tree = {
  id: 'tree',
  name: 'Tree',
  category: 'Nature',
  params: [hueKnob, sel('kind', 'Kind', ['round', 'pine', 'bush', 'dead'])],
  make(r, p) {
    const hue = +auto(p.hue, () => r.pick([95, 110, 125, 140, 35, 20, 330]));
    const kind = auto(p.kind, () => r.pick(['round', 'round', 'pine', 'bush', 'dead']));
    const g = new Grid(16, 16);
    const trunk = g.mat(MAT.wood);
    const leaf = g.mat(M(hue, 0.55, 0.42));
    if (kind === 'round') {
      g.rect(7, 9, 2, 6, trunk);
      g.set(6, 14, trunk);
      g.set(9, 14, trunk);
      g.disc(8, 6.5, 6, 5, leaf);
      for (let i = 0; i < 6; i++) {
        const a = r.range(0, Math.PI * 2);
        g.disc(8 + Math.cos(a) * 4.5, 6.5 + Math.sin(a) * 3.5, r.range(1.6, 2.4), r.range(1.6, 2.4), leaf);
      }
      g.rect(0, 12, 16, 4, 0);
      g.rect(7, 9, 2, 6, trunk);
      g.set(6, 14, trunk);
      g.set(9, 14, trunk);
      // Darker leaf clusters give the canopy depth.
      for (let i = 0; i < 5; i++) {
        const x = r.int(5, 12), y = r.int(6, 10);
        if (g.get(x, y) === leaf) { g.shade(x, y, 0); if (g.get(x + 1, y) === leaf) g.shade(x + 1, y, 0); }
      }
    } else if (kind === 'pine') {
      g.rect(7, 12, 2, 3, trunk);
      const tiers = r.int(3, 4);
      for (let t = 0; t < tiers; t++) {
        const top = 1 + t * (11 / tiers);
        for (let y = 0; y < 5; y++) {
          const half = Math.round(Math.min(6, 1 + y * 0.9 + t * 0.8));
          g.rect(8 - half, Math.round(top + y), half * 2, 1, leaf);
        }
      }
    } else if (kind === 'bush') {
      g.disc(8, 11, 6.5, 3.5, leaf);
      g.disc(5, 9, 3, 3, leaf);
      g.disc(10.5, 8.5, 3.2, 3.5, leaf);
      g.disc(r.range(6, 9), 7, 2.5, 2.5, leaf);
      g.rect(0, 14, 16, 2, 0);
      if (r.chance(0.6)) {
        const berry = g.mat(M(r.pick([0, 350, 280, 210]), 0.8, 0.55));
        for (let b = 0; b < 4; b++) {
          const bx = r.int(4, 11), by = r.int(8, 13);
          if (g.get(bx, by)) g.set(bx, by, berry, 2);
        }
      }
    } else {
      g.rect(7, 4, 2, 11, trunk);
      for (const side of [-1, 1]) {
        for (let b = 0; b < 2; b++) {
          const by = r.int(4, 10), len = r.int(2, 4);
          g.line(side < 0 ? 7 : 8, by, (side < 0 ? 7 : 8) + side * len, by - len, trunk);
        }
      }
    }
    return g;
  },
};

const rock = {
  id: 'rock',
  name: 'Rock',
  category: 'Nature',
  params: [hueKnob, sel('ore', 'Ore', ['none', 'some', 'rich'])],
  make(r, p) {
    const hue = +auto(p.hue, () => r.int(0, 359));
    const ore = auto(p.ore, () => r.pick(['none', 'none', 'some', 'rich']));
    const g = new Grid(16, 16);
    const stone = g.mat(M(r.pick([215, 30, 260]), r.range(0.05, 0.15), r.range(0.45, 0.55)));
    const vein = g.mat(M(hue, 0.85, 0.58));
    g.disc(8, 11, 6.5, 4, stone);
    for (let i = 0; i < 3; i++) g.disc(r.range(5, 11), r.range(7, 10), r.range(2, 3.5), r.range(2, 3), stone);
    g.rect(1, 14, 14, 1, 0);
    g.keepLargest();
    const count = { none: 0, some: 3, rich: 6 }[ore];
    for (let i = 0; i < count; i++) {
      const x = r.int(3, 12), y = r.int(6, 12);
      if (g.get(x, y) && g.get(x + 1, y)) {
        g.set(x, y, vein, 3);
        g.set(x + 1, y, vein, 1);
      }
    }
    return g;
  },
};

const mushroom = {
  id: 'mushroom',
  name: 'Mushroom',
  category: 'Nature',
  params: [hueKnob, sel('cap', 'Cap', ['dome', 'flat', 'tall']), sel('spots', 'Spots', ['on', 'off'])],
  make(r, p) {
    const hue = +auto(p.hue, () => r.pick([0, 0, 15, 35, 200, 280, 120]));
    const cap = auto(p.cap, () => r.pick(['dome', 'flat', 'tall']));
    const spots = auto(p.spots, () => r.pick(['on', 'on', 'off']));
    const g = new Grid(16, 16);
    const capM = g.mat(M(hue, 0.7, 0.5));
    const stem = g.mat(M(40, 0.3, 0.85));
    const dot = g.mat(MAT.white);
    g.rect(6, 9, 4, 6, stem);
    if (cap === 'dome') {
      g.disc(8, 9, 7, 6.5, capM);
      g.rect(0, 9, 16, 7, 0);
      g.rect(6, 9, 4, 6, stem);
    } else if (cap === 'flat') {
      g.disc(8, 8, 7, 3, capM);
    } else {
      g.disc(8, 8, 4.5, 6.5, capM);
      g.rect(0, 9, 16, 7, 0);
      g.rect(6, 9, 4, 6, stem);
    }
    g.rect(5, 9, 6, 1, stem, 0);
    if (spots === 'on') {
      const pts = [[5, 5], [10, 4], [8, 7], [3, 7], [12, 7]];
      for (const [x, y] of pts) if (g.get(x, y) === capM && r.chance(0.8)) g.set(x, y, dot, 3);
    }
    return g;
  },
};

// ---------- Tiles (seamless, no outline) ----------

const tile = {
  id: 'tile',
  name: 'Terrain tile',
  category: 'Tiles',
  params: [sel('kind', 'Terrain', ['grass', 'dirt', 'sand', 'stone', 'brick', 'water', 'planks', 'lava']), hueKnob],
  make(r, p) {
    const kind = auto(p.kind, () => r.pick(['grass', 'dirt', 'sand', 'stone', 'brick', 'water', 'planks', 'lava']));
    const base = {
      grass: M(105, 0.5, 0.45), dirt: M(28, 0.4, 0.38), sand: M(42, 0.55, 0.68), stone: M(220, 0.08, 0.52),
      brick: M(8, 0.5, 0.45), water: M(205, 0.65, 0.5), planks: M(30, 0.45, 0.45), lava: M(18, 0.9, 0.5),
    }[kind];
    const hue = +auto(p.hue, () => base.h);
    const g = new Grid(16, 16);
    g.outline = false;
    const a = g.mat(M(hue, base.s, base.l));
    const seam = g.mat(M(hue, base.s * 0.8, base.l * 0.55));
    g.rect(0, 0, 16, 16, a, 1);
    const wrap = (v) => ((v % 16) + 16) % 16;
    const speckle = (n, shades) => {
      for (let i = 0; i < n; i++) g.set(r.int(0, 15), r.int(0, 15), a, r.pick(shades));
    };
    if (kind === 'grass') {
      speckle(30, [0, 2]);
      for (let i = 0; i < 7; i++) {
        const x = r.int(0, 15), y = r.int(0, 15);
        g.set(x, y, a, 3);
        g.set(x, wrap(y + 1), a, 2);
      }
    } else if (kind === 'dirt' || kind === 'sand') {
      speckle(kind === 'dirt' ? 34 : 22, [0, 2]);
      for (let i = 0; i < 3; i++) {
        const x = r.int(0, 15), y = r.int(0, 15);
        g.set(x, y, a, 3);
        g.set(wrap(x + 1), y, a, 0);
      }
    } else if (kind === 'stone') {
      // Wrapping Voronoi cobbles.
      const pts = Array.from({ length: 6 }, () => [r.range(0, 16), r.range(0, 16)]);
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          let d1 = Infinity, d2 = Infinity, best = null;
          for (const [px, py] of pts)
            for (const ox of [-16, 0, 16])
              for (const oy of [-16, 0, 16]) {
                const d = Math.hypot(x + 0.5 - px - ox, y + 0.5 - py - oy);
                if (d < d1) { d2 = d1; d1 = d; best = [px + ox, py + oy]; } else if (d < d2) d2 = d;
              }
          if (d2 - d1 < 1.1) g.set(x, y, seam, 1);
          else {
            const u = x + 0.5 - best[0] + (y + 0.5 - best[1]);
            g.set(x, y, a, u < -3 ? 3 : u < 0 ? 2 : u < 3 ? 1 : 0);
          }
        }
    } else if (kind === 'brick') {
      for (let row = 0; row < 4; row++) {
        const y = row * 4;
        g.rect(0, y + 3, 16, 1, seam, 1);
        const off = row % 2 ? 4 : 0;
        for (let x = off; x < 16 + off; x += 8) g.rect(wrap(x), y, 1, 3, seam, 1);
        for (let x = 0; x < 16; x++) if (g.get(x, y) === a) g.shade(x, y, 2);
        for (let x = 0; x < 16; x++) if (g.get(x, y + 2) === a) g.shade(x, y + 2, 0);
      }
      // Weathering: chipped and stained bricks so every tile differs.
      for (let i = 0; i < 10; i++) {
        const x = r.int(0, 15), y = r.int(0, 15);
        if (g.get(x, y) === a) g.shade(x, y, r.pick([0, 0, 2]));
      }
    } else if (kind === 'water' || kind === 'lava') {
      speckle(10, [0]);
      for (let i = 0; i < 5; i++) {
        const x = r.int(0, 15), y = r.int(0, 15), len = r.int(2, 4);
        for (let j = 0; j < len; j++) g.set(wrap(x + j), y, a, j === 0 || j === len - 1 ? 2 : 3);
      }
    } else {
      for (let x = 0; x < 16; x += 4) g.rect(x, 0, 1, 16, seam, 1);
      for (let col = 0; col < 4; col++) {
        const cut = r.int(0, 15);
        g.rect(col * 4 + 1, cut, 3, 1, seam, 1);
        g.set(col * 4 + 1, wrap(cut + 1), a, 3);
        g.set(col * 4 + 3, wrap(cut - 2), a, 0);
      }
    }
    return g;
  },
};

export const GENERATORS = [creature, spaceship, potion, weapon, gem, key, chest, shield, tree, rock, mushroom, tile];
export const byId = Object.fromEntries(GENERATORS.map((gen) => [gen.id, gen]));

/** Build a material grid for a generator id with knob values (missing knobs = 'auto'). */
export function build(id, seed, params = {}) {
  const gen = byId[id];
  if (!gen) throw new Error(`Unknown generator: ${id}`);
  return gen.make(rng(`${id}:${seed}`), params);
}
