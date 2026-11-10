/*
 * Wheelspan car illustration module (shared by the browser app and the Node image builder).
 * Draws an original side-profile illustration from a vehicle record: body style, colour,
 * year / make / model caption. Because the caption and silhouette come straight from the
 * CSV row, an image can never disagree with its make, model or body style.
 */
(function (root) {
  'use strict';

  var COLORS = {
    White: '#f1f2f4', Black: '#1b1c20', Silver: '#b8bdc4', Gray: '#6c717a', Blue: '#1f4fa3',
    Red: '#b3202a', Green: '#2f6b4f', Orange: '#d9701f', Brown: '#6b4a2f', Yellow: '#e2b422'
  };

  function clamp(n) { return Math.max(0, Math.min(255, Math.round(n))); }
  function toRgb(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function shade(hex, amt) { // amt -1..1 (negative darkens)
    var c = toRgb(hex);
    var t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    return '#' + c.map(function (x) { return ('0' + clamp((t - x) * p + x).toString(16)).slice(-2); }).join('');
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // Shapes are drawn facing right (front of the car on the right). Coordinates in a 640x400 box.
  var STYLES = {
    Sedan: {
      body: 'M62 280 L58 242 Q58 226 74 224 L168 214 L232 160 Q238 152 252 152 L352 152 Q366 152 376 160 L440 214 L548 224 Q580 228 588 248 L592 280 Z',
      glass: ['M182 212 L240 168 L258 168 L258 212 Z', 'M270 168 L350 168 Q362 168 370 174 L424 212 L270 212 Z'],
      wheels: [170, 480], r: 40, cy: 282,
      seams: [[178, 214, 272], [264, 212, 274], [420, 214, 270]], handles: [[224, 226], [372, 226]],
      head: 'M560 236 L584 240 L586 250 L558 248 Z', tail: 'M60 232 L72 230 L72 244 L58 244 Z', mirror: [428, 212]
    },
    SUV: {
      body: 'M60 282 L54 232 Q54 214 70 212 L120 206 L136 160 Q142 150 156 150 L380 150 Q394 150 404 158 L452 212 L548 222 Q582 226 590 250 L592 282 Z',
      glass: ['M148 204 L158 166 L242 166 L242 204 Z', 'M254 166 L376 166 Q388 166 396 172 L436 204 L254 204 Z'],
      wheels: [165, 483], r: 42, cy: 290,
      seams: [[146, 206, 272], [248, 204, 274], [440, 210, 270]], handles: [[210, 218], [366, 218]],
      head: 'M558 236 L584 240 L587 252 L556 250 Z', tail: 'M56 224 L68 222 L68 240 L54 240 Z', mirror: [442, 206], rails: 'M150 145 L388 145'
    },
    Truck: {
      body: 'M40 284 L40 214 L262 214 L262 160 Q264 148 280 148 L372 148 Q386 148 396 158 L436 206 L556 214 Q586 218 594 242 L596 284 Z',
      glass: ['M276 164 L318 164 L318 204 L276 204 Z', 'M326 164 L366 164 Q376 164 382 170 L420 204 L326 204 Z'],
      wheels: [150, 490], r: 44, cy: 291,
      seams: [[272, 204, 276], [322, 204, 276], [424, 206, 274]], handles: [[292, 214], [342, 214]],
      head: 'M560 226 L586 230 L590 242 L558 240 Z', tail: 'M40 228 L47 228 L47 246 L40 246 Z', mirror: [404, 204],
      bed: true
    },
    Coupe: {
      body: 'M62 280 L58 246 Q58 232 74 230 L150 222 L240 168 Q250 160 266 160 L340 160 Q356 160 368 170 L442 220 L550 230 Q584 234 590 252 L592 280 Z',
      glass: ['M246 186 L262 170 L338 170 Q350 171 358 178 L414 218 L246 218 Z'],
      wheels: [168, 484], r: 40, cy: 282,
      seams: [[238, 218, 274], [396, 218, 272]], handles: [[326, 228]],
      head: 'M558 242 L584 246 L587 256 L556 254 Z', tail: 'M60 242 L72 240 L72 252 L58 254 Z', mirror: [420, 218],
      spoiler: 'M60 232 L56 222 L102 218 L104 226 Z'
    },
    Hatchback: {
      body: 'M80 282 L74 236 Q74 218 90 216 L140 208 L190 160 Q196 152 210 152 L340 152 Q354 152 364 160 L430 214 L528 224 Q558 228 564 250 L566 282 Z',
      glass: ['M154 206 L196 166 L236 166 L236 206 Z', 'M246 166 L338 166 Q350 166 358 172 L410 206 L246 206 Z'],
      wheels: [165, 462], r: 38, cy: 283,
      seams: [[148, 208, 274], [240, 206, 276], [404, 210, 272]], handles: [[204, 220], [328, 220]],
      head: 'M534 238 L558 242 L561 254 L532 252 Z', tail: 'M76 226 L86 224 L86 244 L74 244 Z', mirror: [412, 210]
    },
    Van: {
      body: 'M56 282 L50 220 Q50 204 66 200 L90 196 L120 160 Q126 152 140 152 L400 152 Q414 152 424 160 L470 206 L548 218 Q580 222 588 248 L590 282 Z',
      glass: ['M128 198 L148 166 L208 166 L208 198 Z', 'M218 166 L296 166 L296 198 L218 198 Z', 'M306 166 L396 166 Q408 166 416 172 L452 198 L306 198 Z'],
      wheels: [160, 482], r: 40, cy: 282,
      seams: [[118, 200, 274], [212, 198, 274], [300, 198, 274], [456, 206, 270]], handles: [[246, 216], [420, 214]],
      head: 'M556 232 L580 236 L585 248 L554 248 Z', tail: 'M52 214 L64 212 L64 238 L50 238 Z', mirror: [464, 204]
    }
  };

  function wheel(cx, cy, r) {
    var s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#1d1f24"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.64).toFixed(1) + '" fill="url(#rim)" stroke="#8b929c" stroke-width="1.2"/>';
    for (var i = 0; i < 5; i++) {
      var a = (i * 72 - 90) * Math.PI / 180, x = cx + Math.cos(a) * r * 0.58, y = cy + Math.sin(a) * r * 0.58;
      s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="#7a818b" stroke-width="3.2" stroke-linecap="round"/>';
    }
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.17).toFixed(1) + '" fill="#4b5058"/>';
    return s;
  }

  function buildSVG(v) {
    var style = STYLES[v.body_style] || STYLES.SUV;
    var base = COLORS[v.exterior_color] || '#808890';
    var dark = shade(base, -0.45), hi = shade(base, 0.22), lo = shade(base, -0.2);
    var dy = 322 - (style.cy + style.r);       // put the tyres on a common ground line
    var title = [v.year, v.make, v.model].join(' ');
    var sub = [v.trim, v.body_style, v.exterior_color, v.fuel_type].filter(Boolean).join('  ·  ');

    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="640" height="400" role="img" aria-label="' + esc(title + ' ' + (v.trim || '') + ', ' + v.exterior_color + ' ' + v.body_style) + '">';
    s += '<defs>' +
      '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f9fd"/><stop offset="1" stop-color="#dde5ef"/></linearGradient>' +
      '<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d2de"/><stop offset="1" stop-color="#e3e9f1"/></linearGradient>' +
      '<linearGradient id="paint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + hi + '"/><stop offset="0.55" stop-color="' + base + '"/><stop offset="1" stop-color="' + lo + '"/></linearGradient>' +
      '<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b9cde0"/><stop offset="1" stop-color="#5f7b96"/></linearGradient>' +
      '<radialGradient id="rim" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#eef1f5"/><stop offset="1" stop-color="#a5acb6"/></radialGradient>' +
      '<clipPath id="bc"><path d="' + style.body + '"/></clipPath></defs>';
    s += '<rect width="640" height="400" fill="url(#sky)"/>';
    s += '<rect y="300" width="640" height="100" fill="url(#floor)"/>';
    s += '<ellipse cx="320" cy="326" rx="262" ry="11" fill="#0b1f3a" opacity="0.22"/>';

    s += '<g transform="translate(0,' + dy + ')">';
    if (style.spoiler) s += '<path d="' + style.spoiler + '" fill="' + dark + '"/>';
    s += '<path d="' + style.body + '" fill="url(#paint)" stroke="' + dark + '" stroke-width="1.6" stroke-linejoin="round"/>';
    // wheel arches + lower trim (clipped to the body)
    s += '<g clip-path="url(#bc)">';
    style.wheels.forEach(function (x) { s += '<circle cx="' + x + '" cy="' + style.cy + '" r="' + (style.r + 8) + '" fill="#14151a"/>'; });
    s += '<rect x="30" y="266" width="600" height="30" fill="' + dark + '" opacity="0.28"/>';
    s += '</g>';
    if (style.bed) {
      s += '<rect x="40" y="214" width="222" height="8" fill="' + dark + '" opacity="0.55"/>';
      s += '<path d="M48 222 L48 272" stroke="' + dark + '" stroke-width="1.4"/>';
      s += '<rect x="286" y="268" width="136" height="6" rx="3" fill="#2b2d33"/>';
    }
    // glass
    style.glass.forEach(function (g) { s += '<path d="' + g + '" fill="url(#glass)" stroke="' + dark + '" stroke-width="1.4" stroke-linejoin="round"/>'; });
    if (style.rails) s += '<path d="' + style.rails + '" stroke="' + dark + '" stroke-width="3.5" stroke-linecap="round"/>';
    // door seams + handles
    style.seams.forEach(function (d) { s += '<line x1="' + d[0] + '" y1="' + d[1] + '" x2="' + d[0] + '" y2="' + d[2] + '" stroke="' + dark + '" stroke-width="1.2" opacity="0.7"/>'; });
    style.handles.forEach(function (h) { s += '<rect x="' + h[0] + '" y="' + h[1] + '" width="20" height="4" rx="2" fill="' + dark + '" opacity="0.8"/>'; });
    // lights, mirror, bumper line
    s += '<path d="' + style.head + '" fill="#fff6c9" stroke="' + dark + '" stroke-width="1"/>';
    s += '<path d="' + style.tail + '" fill="#c4141c" stroke="' + dark + '" stroke-width="1"/>';
    s += '<ellipse cx="' + style.mirror[0] + '" cy="' + style.mirror[1] + '" rx="9" ry="5" fill="' + base + '" stroke="' + dark + '" stroke-width="1.2"/>';
    s += '<g clip-path="url(#bc)"><path d="M' + (style.wheels[1] + 36) + ' 262 L620 262" stroke="' + dark + '" stroke-width="1.4" opacity="0.5"/></g>';
    // electric badge
    if (v.fuel_type === 'Electric') {
      var bx = style.wheels[1] + 6, by = style.cy - 62;
      s += '<circle cx="' + bx + '" cy="' + by + '" r="11" fill="#18a058" stroke="#fff" stroke-width="1.6"/>' +
        '<path d="M' + (bx + 1) + ' ' + (by - 7) + ' L' + (bx - 5) + ' ' + (by + 1) + ' L' + (bx - 1) + ' ' + (by + 1) + ' L' + (bx - 2) + ' ' + (by + 7) + ' L' + (bx + 5) + ' ' + (by - 2) + ' L' + (bx + 1) + ' ' + (by - 2) + ' Z" fill="#fff"/>';
    }
    // wheels on top
    style.wheels.forEach(function (x) { s += wheel(x, style.cy, style.r); });
    s += '</g>';

    // caption (derived from the same row, so picture and label always agree)
    s += '<rect y="348" width="640" height="52" fill="#ffffff" opacity="0.9"/>';
    s += '<text x="20" y="372" font-family="Helvetica,Arial,sans-serif" font-size="20" font-weight="700" fill="#0b1f3a">' + esc(title) + '</text>';
    s += '<text x="20" y="390" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#5b6778">' + esc(sub) + '</text>';
    s += '<text x="620" y="390" text-anchor="end" font-family="Helvetica,Arial,sans-serif" font-size="10" fill="#9aa5b4">Wheelspan illustration</text>';
    s += '</svg>';
    return s;
  }

  function dealerLogo(d) {
    var initials = String(d.name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
    var c = d.brand_color || '#0b1f3a';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="' + esc(d.name) + ' logo">' +
      '<rect width="120" height="120" rx="26" fill="' + c + '"/>' +
      '<path d="M-10 92 L130 56 L130 74 L-10 110 Z" fill="#ffffff" opacity="0.14"/>' +
      '<text x="60" y="72" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="40" font-weight="800" fill="#fff">' + esc(initials) + '</text></svg>';
  }

  function dataURI(v) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(buildSVG(v)); }

  var api = { buildSVG: buildSVG, dealerLogo: dealerLogo, dataURI: dataURI, COLORS: COLORS, STYLES: Object.keys(STYLES) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CarArt = api;
})(typeof window !== 'undefined' ? window : globalThis);
