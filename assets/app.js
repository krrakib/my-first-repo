import { GENERATORS, byId, build } from '../engine/generators.js';
import { finalize, scale, sheet } from '../engine/core.js';
import { PACKS, expandPack, cover } from '../engine/packs.js';
import { CONFIG } from './config.js';

const $ = (sel) => document.querySelector(sel);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Rendering helpers ----------

function draw(canvas, img) {
  canvas.width = img.w;
  canvas.height = img.h;
  canvas.getContext('2d').putImageData(new ImageData(img.data, img.w, img.h), 0, 0);
}

function download(img, filename) {
  const c = document.createElement('canvas');
  draw(c, img);
  c.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, 'image/png');
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 1800);
}

const randomSeed = () => Math.random().toString(36).slice(2, 8);

// ---------- State (mirrored in the URL so links are shareable) ----------

const state = { gen: 'creature', seed: randomSeed(), params: {}, outline: 'dark', palette: 'none' };

function readUrl() {
  const q = new URLSearchParams(location.search);
  if (byId[q.get('g')]) state.gen = q.get('g');
  if (q.get('s')) state.seed = q.get('s');
  if (q.get('o')) state.outline = q.get('o');
  if (q.get('p')) state.palette = q.get('p');
  for (const p of byId[state.gen].params) if (q.has(p.key)) state.params[p.key] = q.get(p.key);
}

function writeUrl() {
  const q = new URLSearchParams({ g: state.gen, s: state.seed });
  for (const [k, v] of Object.entries(state.params)) if (v !== 'auto') q.set(k, v);
  if (state.outline !== 'dark') q.set('o', state.outline);
  if (state.palette !== 'none') q.set('p', state.palette);
  history.replaceState(null, '', `?${q}${location.hash}`);
}

const opts = () => ({ outline: state.outline, palette: state.palette });
const current = (seed = state.seed) => finalize(build(state.gen, seed, state.params), opts());

// ---------- Generator UI ----------

function renderGenList() {
  const list = $('#gen-list');
  list.innerHTML = '';
  let cat = '';
  for (const g of GENERATORS) {
    if (g.category !== cat) {
      cat = g.category;
      const h = document.createElement('div');
      h.className = 'cat';
      h.textContent = cat;
      list.append(h);
    }
    const b = document.createElement('button');
    b.className = 'chip';
    b.setAttribute('aria-pressed', g.id === state.gen);
    const c = document.createElement('canvas');
    draw(c, finalize(build(g.id, 'icon-3', { size: '16' })));
    b.append(c, g.name);
    b.onclick = () => {
      state.gen = g.id;
      state.params = {};
      list.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', x === b));
      renderKnobs();
      update();
    };
    list.append(b);
  }
}

function renderKnobs() {
  const box = $('#gen-knobs');
  box.innerHTML = '';
  for (const p of byId[state.gen].params) {
    const wrap = document.createElement('div');
    wrap.className = 'knob';
    const id = `knob-${p.key}`;
    const val = state.params[p.key] ?? 'auto';
    if (p.type === 'hue') {
      wrap.innerHTML = `<label for="${id}">${p.label}</label>
        <div class="hue-row">
          <input type="range" id="${id}" min="0" max="359" value="${val === 'auto' ? 200 : val}" ${val === 'auto' ? 'disabled' : ''}
            style="background:linear-gradient(90deg,hsl(0 70% 55%),hsl(60 70% 55%),hsl(120 70% 55%),hsl(180 70% 55%),hsl(240 70% 55%),hsl(300 70% 55%),hsl(359 70% 55%));border-radius:99px;height:8px">
          <label><input type="checkbox" ${val === 'auto' ? 'checked' : ''}> Auto</label>
        </div>`;
      const range = wrap.querySelector('input[type=range]');
      const auto = wrap.querySelector('input[type=checkbox]');
      range.oninput = () => { state.params[p.key] = range.value; update(); };
      auto.onchange = () => {
        range.disabled = auto.checked;
        state.params[p.key] = auto.checked ? 'auto' : range.value;
        update();
      };
    } else {
      wrap.innerHTML = `<label for="${id}">${p.label}</label><select id="${id}">${p.options
        .map((o) => `<option value="${o}" ${o === val ? 'selected' : ''}>${o === 'auto' ? 'Random' : o[0].toUpperCase() + o.slice(1)}</option>`)
        .join('')}</select>`;
      wrap.querySelector('select').onchange = (e) => { state.params[p.key] = e.target.value; update(); };
    }
    box.append(wrap);
  }
}

function update() {
  draw($('#big'), current());
  $('#seed').value = state.seed;
  const vars = $('#vars');
  vars.innerHTML = '';
  for (let i = 0; i < 24; i++) {
    const seed = i === 0 ? state.seed : `${state.seed}-${i}`;
    const b = document.createElement('button');
    b.className = 'var';
    b.setAttribute('aria-pressed', i === 0);
    b.setAttribute('aria-label', `Variation ${i + 1}`);
    const c = document.createElement('canvas');
    draw(c, current(seed));
    b.append(c);
    b.onclick = () => { state.seed = seed; update(); };
    vars.append(b);
  }
  writeUrl();
}

function wireControls() {
  $('#outline').value = state.outline;
  $('#palette').value = state.palette;
  $('#outline').onchange = (e) => { state.outline = e.target.value; update(); };
  $('#palette').onchange = (e) => { state.palette = e.target.value; update(); };
  $('#seed').onchange = (e) => { state.seed = e.target.value.trim() || randomSeed(); update(); };
  $('#reroll').onclick = () => { state.seed = randomSeed(); update(); };
  $('#dl-png').onclick = () => {
    const k = +$('#export-scale').value;
    download(scale(current(), k), `${CONFIG.brand.toLowerCase()}-${state.gen}-${state.seed}@${k}x.png`);
  };
  $('#dl-sheet').onclick = () => {
    const k = +$('#export-scale').value;
    const imgs = Array.from({ length: 24 }, (_, i) => current(i === 0 ? state.seed : `${state.seed}-${i}`));
    download(scale(sheet(imgs, 6), k), `${CONFIG.brand.toLowerCase()}-${state.gen}-sheet@${k}x.png`);
  };
  $('#copy-link').onclick = async () => {
    try { await navigator.clipboard.writeText(location.href); toast('Link copied'); } catch { toast('Copy the address bar to share'); }
  };
  $('#bg-toggle').onclick = (e) => {
    const light = $('#preview').classList.toggle('light');
    e.target.textContent = light ? 'Dark bg' : 'Light bg';
  };
}

// ---------- Hero mosaic ----------

function mosaic() {
  const canvas = $('#mosaic');
  const ctx = canvas.getContext('2d');
  const cell = 64, sprite = 48;
  let cols, rows;
  const paint = (x, y) => {
    const g = GENERATORS[Math.floor(Math.random() * (GENERATORS.length - 1))];
    const img = finalize(build(g.id, randomSeed(), { size: '16' }));
    const tmp = document.createElement('canvas');
    draw(tmp, img);
    ctx.clearRect(x * cell, y * cell, cell, cell);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, x * cell + (cell - sprite) / 2, y * cell + (cell - sprite) / 2, sprite, sprite);
  };
  const resize = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    cols = Math.ceil(canvas.width / cell);
    rows = Math.ceil(canvas.height / cell);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) paint(x, y);
  };
  resize();
  addEventListener('resize', () => { clearTimeout(mosaic.t); mosaic.t = setTimeout(resize, 200); });
  if (!reduceMotion) setInterval(() => paint(Math.floor(Math.random() * cols), Math.floor(Math.random() * rows)), 160);
}

// ---------- Packs, pricing, config ----------

function buyLink(el, key) {
  const url = CONFIG.buy[key];
  if (url) {
    el.href = url;
    el.target = '_blank';
    el.rel = 'noopener';
  } else {
    el.textContent = 'Coming soon';
    el.setAttribute('aria-disabled', 'true');
    el.removeAttribute('href');
  }
}

function renderPacks() {
  const grid = $('#pack-grid');
  let total = 0;
  for (const pack of PACKS) {
    const sprites = expandPack(pack);
    total += sprites.length;
    const card = document.createElement('article');
    card.className = 'panel pack';
    const c = document.createElement('canvas');
    draw(c, cover(sprites));
    card.append(c);
    const body = document.createElement('div');
    body.className = 'body';
    body.innerHTML = `<h3>${pack.name}</h3><p>${pack.tagline}</p>
      <div class="meta"><span class="count">${sprites.length} sprites &middot; $${CONFIG.prices.pack}</span><a class="btn small primary" href="#">Buy pack</a></div>`;
    buyLink(body.querySelector('a'), pack.id);
    card.append(body);
    grid.append(card);
  }
  const rounded = `${Math.floor(total / 100) * 100}+`;
  $('#stat-sprites').textContent = rounded;
  $('#all-count').textContent = rounded;
}

function applyConfig() {
  document.querySelectorAll('[data-brand]').forEach((el) => (el.textContent = CONFIG.brand));
  document.querySelectorAll('[data-price]').forEach((el) => (el.textContent = CONFIG.prices[el.dataset.price]));
  document.querySelectorAll('[data-buy]').forEach((el) => buyLink(el, el.dataset.buy));
  $('#stat-gens').textContent = GENERATORS.length;
  $('#year').textContent = new Date().getFullYear();
  const links = [['itch.io', CONFIG.itch], ['Twitter / X', CONFIG.twitter], ['Email', CONFIG.email && `mailto:${CONFIG.email}`]].filter(([, u]) => u);
  $('#social').innerHTML = links.map(([n, u]) => `<a href="${u}">${n}</a>`).join(' &middot; ');
  draw($('#logo'), finalize(build('creature', 'logo-7', { size: '16', hue: '45' })));
}

readUrl();
applyConfig();
renderGenList();
renderKnobs();
wireControls();
update();
mosaic();
(window.requestIdleCallback || setTimeout)(renderPacks);
