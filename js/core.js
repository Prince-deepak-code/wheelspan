/* Wheelspan core: helpers, CSV loading, data model, filtering, router. */
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$' + Math.round(n).toLocaleString('en-US');
const num = n => Math.round(n).toLocaleString('en-US');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const store = {
  get(k, d) { try { const v = localStorage.getItem('ws_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ws_' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
};
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ---------- CSV ---------- */
function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false;
  text = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); f = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = []; }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  if (!rows.length) return [];
  const head = rows.shift().map(h => h.trim());
  return rows.map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] == null ? '' : r[i]).trim()])));
}

/* ---------- data ---------- */
const DB = { vehicles: [], dealers: [], zips: {}, dById: {}, vById: {}, raw: { v: '', d: '', z: '' }, source: 'csv', loadedAt: null };

function ingest(vText, dText, zText) {
  const dealers = parseCSV(dText).filter(d => d.dealer_id).map(d => Object.assign({}, d, { rating: +d.rating || 0, review_count: +d.review_count || 0, lat: +d.lat, lng: +d.lng, established: +d.established || '' }));
  const dById = Object.fromEntries(dealers.map(d => [d.dealer_id, d]));
  const zips = {}; parseCSV(zText).forEach(z => { zips[z.zip] = { city: z.city, state: z.state, lat: +z.lat, lng: +z.lng }; });
  const vehicles = parseCSV(vText).filter(r => r.id && r.make).map(r => {
    const v = Object.assign({}, r);
    ['year', 'price', 'market_value', 'mileage', 'mpg_city', 'mpg_hwy', 'accidents', 'owners'].forEach(k => { v[k] = +r[k] || 0; });
    v.features = (r.features || '').split('|').map(s => s.trim()).filter(Boolean);
    v.title = v.year + ' ' + v.make + ' ' + v.model;
    v.mpg = Math.round(v.mpg_city * 0.55 + v.mpg_hwy * 0.45);
    v.dealer = dById[v.dealer_id] || null;
    const mv = v.market_value || v.price;
    v.ratio = v.price / mv; v.diff = mv - v.price;
    v.deal = v.ratio <= 0.93 ? 'Great Deal' : v.ratio <= 0.98 ? 'Good Deal' : v.ratio <= 1.04 ? 'Fair Deal' : 'High Price';
    v.listedTs = Date.parse(v.listed_date) || 0;
    return v;
  });
  DB.vehicles = vehicles; DB.dealers = dealers; DB.zips = zips; DB.dById = dById;
  DB.vById = Object.fromEntries(vehicles.map(v => [v.id, v]));
  DB.raw = { v: vText, d: dText, z: zText }; DB.loadedAt = new Date();
}

async function fetchText(p) {
  const r = await fetch(p + (p.includes('?') ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) throw new Error(p + ' -> HTTP ' + r.status);
  return r.text();
}
async function loadAll() {
  try {
    const [v, d, z] = await Promise.all([fetchText('data/vehicles.csv'), fetchText('data/dealers.csv'), fetchText('data/zipcodes.csv')]);
    DB.source = 'csv'; ingest(v, d, z);
  } catch (e) {
    if (window.WHEELSPAN_SNAPSHOT) { DB.source = 'snapshot'; const s = window.WHEELSPAN_SNAPSHOT; ingest(s.vehicles, s.dealers, s.zips); }
    else throw e;
  }
}
async function pollCSV() {            // reflect CSV edits without a manual refresh
  if (DB.source !== 'csv') return;
  try {
    const [v, d] = await Promise.all([fetchText('data/vehicles.csv'), fetchText('data/dealers.csv')]);
    if (v !== DB.raw.v || d !== DB.raw.d) { ingest(v, d, DB.raw.z); render(true); toast('Inventory updated from CSV (' + DB.vehicles.length + ' vehicles, ' + DB.dealers.length + ' dealers)'); }
  } catch (e) { /* offline: ignore */ }
}

/* ---------- geo ---------- */
function hav(a, b) {
  const R = 3958.8, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function userZip() { const z = store.get('zip', '48201'); return z === '75201' ? '48201' : z; }
function locOf(zip) { return DB.zips[zip] || DB.zips['48201'] || Object.values(DB.zips)[0] || { lat: 42.3314, lng: -83.0458, city: 'Detroit', state: 'MI' }; }
function dealerDist(d, zip) { return d && d.lat ? hav(locOf(zip), d) : 9999; }
function placeName(zip) { const l = DB.zips[zip]; return l ? l.city + ', ' + l.state : zip; }

/* ---------- filters ---------- */
const LIST_KEYS = ['make', 'model', 'body', 'fuel', 'trans', 'drive', 'color', 'deal', 'cond', 'feat'];
const NUM_KEYS = ['yearMin', 'yearMax', 'priceMin', 'priceMax', 'milesMax', 'mpgMin', 'dist', 'page'];
const SEP = '~';
const emptyF = () => { const f = { dealer: '', zip: '', q: '', sort: 'deal', noacc: false, one: false }; LIST_KEYS.forEach(k => f[k] = []); NUM_KEYS.forEach(k => f[k] = 0); return f; };
function parseF(p) {
  const f = emptyF();
  LIST_KEYS.forEach(k => { const v = p.get(k); f[k] = v ? v.split(SEP).filter(Boolean) : []; });
  NUM_KEYS.forEach(k => { f[k] = +p.get(k) || 0; });
  f.dealer = p.get('dealer') || ''; f.zip = p.get('zip') || ''; f.q = p.get('q') || ''; f.sort = p.get('sort') || 'deal';
  f.noacc = p.get('noacc') === '1'; f.one = p.get('one') === '1';
  return f;
}
function toQS(f) {
  const p = new URLSearchParams();
  LIST_KEYS.forEach(k => { if (f[k] && f[k].length) p.set(k, f[k].join(SEP)); });
  NUM_KEYS.forEach(k => { if (f[k]) p.set(k, f[k]); });
  if (f.dealer) p.set('dealer', f.dealer); if (f.zip) p.set('zip', f.zip); if (f.q) p.set('q', f.q);
  if (f.sort && f.sort !== 'deal') p.set('sort', f.sort);
  if (f.noacc) p.set('noacc', '1'); if (f.one) p.set('one', '1');
  return p.toString();
}
const searchHref = partial => '#/search?' + toQS(Object.assign(emptyF(), partial || {}));
const FIELD = { make: 'make', model: 'model', body: 'body_style', fuel: 'fuel_type', trans: 'transmission', drive: 'drivetrain', color: 'exterior_color', deal: 'deal', cond: 'condition' };

function matches(v, f, skip, dmap) {
  for (const k of Object.keys(FIELD)) if (k !== skip && f[k].length && !f[k].includes(v[FIELD[k]])) return false;
  if (skip !== 'feat' && f.feat.length && !f.feat.every(x => v.features.includes(x))) return false;
  if (skip !== 'year' && ((f.yearMin && v.year < f.yearMin) || (f.yearMax && v.year > f.yearMax))) return false;
  if (skip !== 'price' && ((f.priceMin && v.price < f.priceMin) || (f.priceMax && v.price > f.priceMax))) return false;
  if (skip !== 'miles' && f.milesMax && v.mileage > f.milesMax) return false;
  if (skip !== 'mpg' && f.mpgMin && v.mpg < f.mpgMin) return false;
  if (skip !== 'dealer' && f.dealer && v.dealer_id !== f.dealer) return false;
  if (skip !== 'dist' && f.dist && (dmap[v.dealer_id] == null || dmap[v.dealer_id] > f.dist)) return false;
  if (skip !== 'hist') { if (f.noacc && v.accidents > 0) return false; if (f.one && v.owners > 1) return false; }
  if (f.q) {
    const hay = (v.title + ' ' + v.trim + ' ' + v.body_style + ' ' + v.exterior_color + ' ' + v.fuel_type + ' ' + v.features.join(' ')).toLowerCase();
    if (!f.q.toLowerCase().split(/\s+/).every(w => hay.includes(w))) return false;
  }
  return true;
}
function distMap(zip) { const m = {}; DB.dealers.forEach(d => { m[d.dealer_id] = dealerDist(d, zip); }); return m; }
function applyF(f, skip) {
  const zip = f.zip || userZip(), dm = distMap(zip);
  return DB.vehicles.filter(v => matches(v, f, skip, dm)).map(v => { v._d = dm[v.dealer_id]; return v; });
}
const SORTS = {
  deal: ['Best deal', (a, b) => a.ratio - b.ratio],
  priceAsc: ['Price: low to high', (a, b) => a.price - b.price],
  priceDesc: ['Price: high to low', (a, b) => b.price - a.price],
  milesAsc: ['Mileage: lowest', (a, b) => a.mileage - b.mileage],
  yearDesc: ['Year: newest', (a, b) => b.year - a.year || a.mileage - b.mileage],
  newest: ['Recently listed', (a, b) => b.listedTs - a.listedTs],
  distance: ['Distance: nearest', (a, b) => a._d - b._d]
};
function sorted(list, key) { return list.slice().sort((SORTS[key] || SORTS.deal)[1]); }
function facet(f, key, getter) {
  const m = new Map();
  applyF(f, key).forEach(v => { const g = getter(v); (Array.isArray(g) ? g : [g]).forEach(x => m.set(x, (m.get(x) || 0) + 1)); });
  return m;
}
const uniqSorted = (arr, fn) => Array.from(new Set(arr)).sort(fn);

/* ---------- misc view helpers ---------- */
function imgTag(v, cls) {
  const src = v.image || ('images/vehicles/' + v.id + '.svg');
  // if the file is missing, draw the same illustration on the fly from the CSV row
  return '<img ' + (cls ? 'class="' + cls + '" ' : '') + 'loading="lazy" src="' + esc(src) + '" alt="' + esc(v.title + ' ' + v.trim) + '" data-vid="' + esc(v.id) + '">';
}
document.addEventListener('error', e => {
  const t = e.target;
  if (t && t.tagName === 'IMG' && t.dataset.vid && !t.dataset.fb) {
    t.dataset.fb = '1'; const v = DB.vById[t.dataset.vid];
    if (v && window.CarArt) t.src = CarArt.dataURI(v);
  } else if (t && t.tagName === 'IMG' && t.dataset.did && !t.dataset.fb) {
    t.dataset.fb = '1'; const d = DB.dById[t.dataset.did];
    if (d && window.CarArt) t.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(CarArt.dealerLogo(d));
  }
}, true);
const dealTag = v => '<span class="deal ' + { 'Great Deal': 'great', 'Good Deal': 'good', 'Fair Deal': 'fair', 'High Price': 'high' }[v.deal] + '">' + v.deal + '</span>';
const dealNote = v => v.diff > 0 ? money(v.diff) + ' below market' : v.diff < 0 ? money(-v.diff) + ' above market' : 'At market';
function pmt(principal, apr, months) {
  const r = apr / 1200; if (principal <= 0) return 0;
  return r === 0 ? principal / months : principal * r / (1 - Math.pow(1 + r, -months));
}
const stars = r => '<span class="stars">' + '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)) + '</span>';
const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '';
const COLOR_HEX = { White: '#f1f2f4', Black: '#1b1c20', Silver: '#b8bdc4', Gray: '#6c717a', Blue: '#1f4fa3', Red: '#b3202a', Green: '#2f6b4f', Orange: '#d9701f', Brown: '#6b4a2f', Yellow: '#e2b422' };

/* ---------- saved / compare ---------- */
const SAVED = new Set(store.get('saved', []));
let COMPARE = store.get('compare', []);
const persistSaved = () => { store.set('saved', Array.from(SAVED)); updateBadges(); };
function updateBadges() {
  const b = $('#savedBadge'); if (b) { b.textContent = '(' + SAVED.size + ')'; }
  const cb = $('#cmpBadge'); if (cb) { cb.textContent = '(' + COMPARE.length + ')'; }
  const bar = $('#cmpbar');
  if (bar) {
    COMPARE = COMPARE.filter(id => DB.vById[id]);
    bar.classList.toggle('show', COMPARE.length > 0);
    $('#cmpCount').textContent = COMPARE.length + ' selected (max 3)';
    $('#cmpGo').href = '#/compare?ids=' + COMPARE.join(',');
    $('#cmpGo').style.display = COMPARE.length >= 2 ? '' : 'none';
  }
}

/* ---------- router ---------- */
const ROUTES = [];
const route = (re, fn) => ROUTES.push([re, fn]);
let lastPath = '', lastRendered = null, FORCED = null;
const SECTION_PREF = {};   // sidebar sections the user explicitly opened/closed
const curHash = () => FORCED != null ? FORCED : (location.hash || '#/');
/* navigate(): sets location.hash (so URLs stay shareable / new-tab friendly). If a host frame blocks hash changes,
   the page still renders by remembering the target in memory. */
function navigate(h) {
  try { if ((location.hash || '#/') !== h) location.hash = h; } catch (e) { /* blocked */ }
  setTimeout(() => { FORCED = ((location.hash || '#/') === h) ? null : h; renderIfChanged(); }, 30);
}
function renderIfChanged() { if (curHash() !== lastRendered) render(false); }
function render(keepScroll) {
  lastRendered = curHash();
  const h = lastRendered.replace(/^#/, '') || '/';
  const qi = h.indexOf('?');
  const path = qi < 0 ? h : h.slice(0, qi), params = new URLSearchParams(qi < 0 ? '' : h.slice(qi + 1));
  let out = null;
  for (const [re, fn] of ROUTES) { const m = path.match(re); if (m) { out = fn(m, params); break; } }
  if (!out) out = { html: '<div class="wrap"><div class="empty" style="margin-top:30px"><h2>Page not found</h2><p><a href="#/">Back to Wheelspan home</a></p></div></div>' };
  if (typeof out === 'string') out = { html: out };
  // keep the filter sidebar's scroll position and any sections the user explicitly opened/closed
  const sideEl = $('#side'), sideTop = sideEl ? sideEl.scrollTop : 0;
  $('#app').innerHTML = out.html;
  const side2 = $('#side');
  if (side2 && sideEl && path === lastPath) {
    $$('summary', side2).forEach(x => { if (x.textContent in SECTION_PREF) x.parentElement.open = SECTION_PREF[x.textContent]; });
    side2.scrollTop = sideTop;
  }
  $$('nav.main a').forEach(a => { const t = a.getAttribute('data-nav'); a.classList.toggle('on', t === (out.nav || path.split('/')[1] || 'home')); });
  document.title = (out.title ? out.title + ' | ' : '') + 'Wheelspan';
  if (out.after) out.after();
  updateBadges();
  if (!keepScroll && (path !== lastPath || out.top)) window.scrollTo(0, 0);
  lastPath = path;
}
window.addEventListener('hashchange', () => { FORCED = null; renderIfChanged(); });
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a || a.dataset.act || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
  e.preventDefault(); navigate(a.getAttribute('href'));
});
document.addEventListener('click', e => {
  const sm = e.target.closest('.side summary'); if (sm) SECTION_PREF[sm.textContent] = !sm.parentElement.open;   // state after the click toggles it
});
