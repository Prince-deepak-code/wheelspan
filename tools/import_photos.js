#!/usr/bin/env node
/*
 * Swap the illustrations for real photos you have the rights to use.
 *
 *   1. node tools/import_photos.js --template
 *        writes photos/manifest_template.csv  (one row per vehicle: id, year, make, model, trim, body, current colour)
 *   2. Put your photos in the photos/ folder, copy the template to photos/manifest.csv and fill in two columns per row:
 *        file                    the photo's file name inside photos/ (jpg, jpeg, png, webp)
 *        exterior_color_in_photo the colour the car in the photo really is (White, Black, Silver, Gray, Blue, Red,
 *                                Green, Orange, Brown, Yellow). Leave blank if it already matches the row.
 *      Rows with no file are left alone (they keep their illustration).
 *   3. node tools/import_photos.js
 *        copies each photo to images/vehicles/<id>.<ext>, points the CSV "image" column at it and, if you gave a colour,
 *        updates exterior_color (+ the colour word in the description) so the colour filter, swatches and AI search
 *        stay correct. Then it refreshes data/data.js.
 *
 * Tip: for plates, use photos where the plate is already blurred/covered, or edit them before importing.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const COLORS = ['White', 'Black', 'Silver', 'Gray', 'Blue', 'Red', 'Green', 'Orange', 'Brown', 'Yellow'];
const OK_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); f = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = []; }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  const head = rows.shift().map(h => h.trim());
  return { head, rows: rows.map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()]))) };
}
const cell = v => { v = String(v == null ? '' : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const toCSV = (cols, rows) => [cols.join(','), ...rows.map(r => cols.map(c => cell(r[c])).join(','))].join('\n') + '\n';
const vPath = path.join(ROOT, 'data/vehicles.csv');
const { head, rows: vehicles } = parseCSV(fs.readFileSync(vPath, 'utf8'));
fs.mkdirSync(path.join(ROOT, 'photos'), { recursive: true });

if (process.argv.includes('--template')) {
  const cols = ['id', 'year', 'make', 'model', 'trim', 'body_style', 'exterior_color', 'file', 'exterior_color_in_photo'];
  fs.writeFileSync(path.join(ROOT, 'photos/manifest_template.csv'), toCSV(cols, vehicles.map(v => Object.assign({}, v, { file: '', exterior_color_in_photo: '' }))));
  console.log('Wrote photos/manifest_template.csv (' + vehicles.length + ' rows)'); process.exit(0);
}

const mPath = path.join(ROOT, 'photos/manifest.csv');
if (!fs.existsSync(mPath)) { console.error('photos/manifest.csv not found. Run with --template first (see header of this file).'); process.exit(1); }
const byId = Object.fromEntries(vehicles.map(v => [v.id, v]));
let done = 0, problems = [];
for (const m of parseCSV(fs.readFileSync(mPath, 'utf8')).rows) {
  if (!m.file) continue;
  const v = byId[m.id]; if (!v) { problems.push(m.id + ': unknown id'); continue; }
  const src = path.join(ROOT, 'photos', m.file), ext = path.extname(m.file).toLowerCase();
  if (!fs.existsSync(src)) { problems.push(m.id + ': photos/' + m.file + ' not found'); continue; }
  if (!OK_EXT.includes(ext)) { problems.push(m.id + ': unsupported file type ' + ext); continue; }
  const colour = m.exterior_color_in_photo;
  if (colour && !COLORS.includes(colour)) { problems.push(m.id + ': colour must be one of ' + COLORS.join('/')); continue; }
  const rel = 'images/vehicles/' + v.id + ext;
  fs.copyFileSync(src, path.join(ROOT, rel));
  if (v.image && v.image !== rel && v.image.endsWith('.svg') && fs.existsSync(path.join(ROOT, v.image))) fs.unlinkSync(path.join(ROOT, v.image));
  v.image = rel;
  if (colour && colour !== v.exterior_color) { v.description = v.description.replace(' in ' + v.exterior_color + ' ', ' in ' + colour + ' '); v.exterior_color = colour; }
  done++;
}
fs.writeFileSync(vPath, toCSV(head, vehicles));
execFileSync(process.execPath, [path.join(__dirname, 'build_images.js')], { stdio: 'inherit' });
console.log('Imported ' + done + ' photo(s).' + (problems.length ? '\nSkipped:\n  ' + problems.join('\n  ') : ''));
