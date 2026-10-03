// Spriteloom core: seeded randomness, a material grid, and the finalizer that
// turns materials into shaded, outlined, palette-mapped RGBA pixels.
// Pure ES module with no dependencies, so it runs in the browser and in Node.

// ---------- Randomness ----------

export function hashSeed(input) {
  const str = String(input);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function rng(seed) {
  let a = hashSeed(seed);
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (lo, hi) => lo + next() * (hi - lo),
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}

// ---------- Materials ----------

// A material is an HSL base color; the finalizer derives a 4-step ramp from it.
export const M = (h, s, l) => ({ h, s, l });

export const MAT = {
  wood: M(26, 0.45, 0.36),
  darkWood: M(20, 0.4, 0.24),
  steel: M(215, 0.12, 0.64),
  iron: M(220, 0.1, 0.42),
  gold: M(44, 0.85, 0.55),
  ink: M(250, 0.35, 0.12),
  white: M(50, 0.25, 0.93),
  glass: M(200, 0.25, 0.8),
  stone: M(220, 0.08, 0.5),
  leaf: M(110, 0.5, 0.42),
};

// ---------- Grid ----------

export class Grid {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.m = new Uint8Array(w * h); // material id, 0 = empty
    this.s = new Int8Array(w * h).fill(-1); // explicit shade 0..3, -1 = auto
    this.mats = [null];
    this.outline = true; // generators like tiles turn this off
  }
  mat(spec) {
    this.mats.push(spec);
    return this.mats.length - 1;
  }
  in(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }
  get(x, y) {
    return this.in(x, y) ? this.m[y * this.w + x] : 0;
  }
  set(x, y, mat, shade = -1) {
    x = Math.round(x);
    y = Math.round(y);
    if (!this.in(x, y)) return;
    const i = y * this.w + x;
    this.m[i] = mat;
    this.s[i] = shade;
  }
  shade(x, y, shade) {
    if (this.get(x, y)) this.s[y * this.w + x] = shade;
  }
  clear(x, y) {
    if (this.in(x, y)) this.set(x, y, 0);
  }
  rect(x, y, w, h, mat, shade = -1) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, mat, shade);
  }
  // Filled ellipse tested at pixel centres; cx/cy may be fractional.
  disc(cx, cy, rx, ry, mat, shade = -1) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, mat, shade);
      }
    }
  }
  line(x0, y0, x1, y1, mat, shade = -1) {
    let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, mat, shade);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  // Copy the left half onto the right half (symmetry about the vertical centre).
  mirror() {
    const half = Math.floor(this.w / 2);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < half; x++) {
        const i = y * this.w + x, j = y * this.w + (this.w - 1 - x);
        this.m[j] = this.m[i];
        this.s[j] = this.s[i];
      }
    }
  }
  // Remove filled pixels with no filled 4-neighbours (stray noise).
  despeckle() {
    const kill = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++)
        if (this.get(x, y) && !this.get(x - 1, y) && !this.get(x + 1, y) && !this.get(x, y - 1) && !this.get(x, y + 1))
          kill.push([x, y]);
    for (const [x, y] of kill) this.clear(x, y);
  }
  // Keep only the largest 4-connected island of filled pixels.
  keepLargest() {
    const seen = new Uint8Array(this.w * this.h);
    let best = [];
    for (let i = 0; i < seen.length; i++) {
      if (seen[i] || !this.m[i]) continue;
      const island = [], stack = [i];
      seen[i] = 1;
      while (stack.length) {
        const k = stack.pop();
        island.push(k);
        const x = k % this.w, y = (k / this.w) | 0;
        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
          if (!this.in(nx, ny)) continue;
          const n = ny * this.w + nx;
          if (!seen[n] && this.m[n]) { seen[n] = 1; stack.push(n); }
        }
      }
      if (island.length > best.length) best = island;
    }
    const keep = new Uint8Array(this.w * this.h);
    for (const k of best) keep[k] = 1;
    for (let i = 0; i < keep.length; i++) if (!keep[i]) { this.m[i] = 0; this.s[i] = -1; }
  }
}

// ---------- Colour ----------

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function hueToward(h, target, amount) {
  let d = ((target - h + 540) % 360) - 180;
  return (h + Math.sign(d) * Math.min(Math.abs(d), amount) + 360) % 360;
}

export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 1);
  l = clamp(l, 0, 1);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

// Pixel-art style ramp: shadows drift toward blue/purple, highlights toward warm yellow.
export function ramp(mat, shade) {
  const { h, s, l } = mat;
  switch (shade) {
    case 0: return hslToRgb(hueToward(h, 250, 16), s * 0.95 + 0.04, l - 0.19);
    case 2: return hslToRgb(hueToward(h, 55, 8), s * 0.95, l + 0.12);
    case 3: return hslToRgb(hueToward(h, 55, 16), s * 0.75, l + 0.25);
    default: return hslToRgb(h, s, l);
  }
}

export const PALETTES = {
  none: null,
  pico8: ['000000', '1d2b53', '7e2553', '008751', 'ab5236', '5f574f', 'c2c3c7', 'fff1e8', 'ff004d', 'ffa300', 'ffec27', '00e436', '29adff', '83769c', 'ff77a8', 'ffccaa'],
  sweetie16: ['1a1c2c', '5d275d', 'b13e53', 'ef7d57', 'ffcd75', 'a7f070', '38b764', '257179', '29366f', '3b5dc9', '41a6f6', '73eff7', 'f4f4f4', '94b0c2', '566c86', '333c57'],
  gameboy: ['0f380f', '306230', '8bac0f', '9bbc0f'],
};

const hexRgb = (hex) => [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
const luma = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;

function quantizer(name) {
  const pal = PALETTES[name];
  if (!pal) return (c) => c;
  const cols = pal.map(hexRgb);
  if (name === 'gameboy') {
    // Map by brightness so shading survives a 4-colour palette.
    return (c) => cols[clamp(Math.floor((luma(c) / 256) * 4), 0, 3)];
  }
  return (c) => {
    let best = cols[0], bd = Infinity;
    for (const p of cols) {
      const dr = c[0] - p[0], dg = c[1] - p[1], db = c[2] - p[2];
      const d = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  };
}

// ---------- Finalize ----------

/**
 * Turn a material grid into RGBA pixels.
 * opts.outline: 'dark' (tinted per material) | 'black' | 'none'
 * opts.palette: key of PALETTES
 */
export function finalize(grid, opts = {}) {
  const { w, h } = grid;
  const outline = grid.outline ? opts.outline || 'dark' : 'none';
  const quant = quantizer(opts.palette || 'none');
  const data = new Uint8ClampedArray(w * h * 4);
  const edge = (x, y, m) => {
    const n = grid.get(x, y);
    return n === 0 || n !== m;
  };
  const empty = (x, y) => grid.get(x, y) === 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const m = grid.m[i];
      let rgb = null;
      if (m) {
        let s = grid.s[i];
        if (s < 0) {
          // Light comes from the top-left.
          const up = edge(x, y - 1, m), left = edge(x - 1, y, m);
          const down = empty(x, y + 1) || (edge(x, y + 1, m) && !up);
          const right = empty(x + 1, y);
          if (up && left) s = 3;
          else if (up || left) s = 2;
          else if (down || right) s = 0;
          else s = 1;
        }
        rgb = ramp(grid.mats[m], s);
      } else if (outline !== 'none') {
        // Outline empty pixels that touch a filled pixel.
        let touch = 0;
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const n = grid.get(x + dx, y + dy);
          if (n) { touch = n; break; }
        }
        if (touch) {
          if (outline === 'black') rgb = [20, 12, 28];
          else {
            const mat = grid.mats[touch];
            rgb = hslToRgb(hueToward(mat.h, 255, 30), Math.min(0.5, mat.s * 0.6 + 0.15), 0.1);
          }
        }
      }
      if (rgb) {
        const q = quant(rgb);
        data[i * 4] = q[0];
        data[i * 4 + 1] = q[1];
        data[i * 4 + 2] = q[2];
        data[i * 4 + 3] = 255;
      }
    }
  }
  return { w, h, data };
}

// Nearest-neighbour upscale of an RGBA image.
export function scale(img, k) {
  if (k === 1) return img;
  const w = img.w * k, h = img.h * k;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (((y / k) | 0) * img.w + ((x / k) | 0)) * 4;
      const di = (y * w + x) * 4;
      data[di] = img.data[si];
      data[di + 1] = img.data[si + 1];
      data[di + 2] = img.data[si + 2];
      data[di + 3] = img.data[si + 3];
    }
  }
  return { w, h, data };
}

// Pack equally-sized images into a sheet; returns the image plus frame rects.
export function sheet(images, cols, pad = 0) {
  const cw = images[0].w + pad, ch = images[0].h + pad;
  const rows = Math.ceil(images.length / cols);
  const w = cols * cw, h = rows * ch;
  const data = new Uint8ClampedArray(w * h * 4);
  const frames = [];
  images.forEach((img, n) => {
    const ox = (n % cols) * cw, oy = ((n / cols) | 0) * ch;
    frames.push({ x: ox, y: oy, w: img.w, h: img.h });
    for (let y = 0; y < img.h; y++) {
      for (let x = 0; x < img.w; x++) {
        const si = (y * img.w + x) * 4, di = ((oy + y) * w + ox + x) * 4;
        for (let c = 0; c < 4; c++) data[di + c] = img.data[si + c];
      }
    }
  });
  return { w, h, data, frames };
}
