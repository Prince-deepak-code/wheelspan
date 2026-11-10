/*
 * Wheelspan AI: natural-language (typed or spoken) car search.
 * DEMO: this is a rule-based parser that runs entirely in the browser (no API key, no network).
 * It turns a sentence into the same filter object the sidebar uses, so results are real and linkable.
 * To use a real LLM later, replace parseNL() with a call that returns the same shape: { f, keys, reset, rel }.
 */
'use strict';
const AI = (() => {
  let msgs = [], lastF = null, rec = null, lex = null, lexStamp = null;
  const FKEYS = ['make', 'model', 'body', 'fuel', 'trans', 'drive', 'color', 'deal', 'cond', 'feat'];
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const clone = f => JSON.parse(JSON.stringify(f));
  const maxYear = () => Math.max(...DB.vehicles.map(v => v.year), 2026);

  /* ----- lexicon built from the live CSV so new makes/models/dealers are understood automatically ----- */
  function buildLex() {
    const makes = uniqSorted(DB.vehicles.map(v => v.make)), models = [];
    const seen = new Set();
    DB.vehicles.forEach(v => {
      const key = v.make + '|' + v.model; if (seen.has(key)) return; seen.add(key);
      const name = v.model.toLowerCase(), variants = new Set();
      const flex = s => reEsc(s).replace(/(\\-|\s)+/g, '[\\s-]?');
      if (/^model [a-z0-9]$/.test(name)) variants.add('model\\s' + name.slice(-1));
      else {
        variants.add(flex(name));
        const noNum = name.replace(/\s1500$/, ''); if (noNum !== name) variants.add(flex(noNum));
        const noEv = name.replace(/\sev$/, ''); if (noEv !== name) variants.add(flex(noEv));
        if (/^golf gti$/.test(name)) variants.add('gti');
        if (/^mazda3$/.test(name)) variants.add('mazda\\s3');
        if (/^ram 1500$/.test(name)) variants.add('ram');
        if (/^mustang$/.test(name)) { /* "mustang mach-e" is a separate longer model, matched first */ }
      }
      models.push({ make: v.make, name: v.model, len: name.length, re: new RegExp('(^|[^a-z0-9])(' + Array.from(variants).join('|') + ')(?:s)?(?![a-z0-9])') });
    });
    models.sort((a, b) => b.len - a.len);
    const alias = { chevy: 'Chevrolet', vw: 'Volkswagen', benz: 'Mercedes-Benz', mercedes: 'Mercedes-Benz', merc: 'Mercedes-Benz', 'rolls': null };
    const makeRes = makes.map(m => ({ name: m, re: new RegExp('(^|[^a-z0-9])(' + reEsc(m.toLowerCase()).replace(/(\\-|\s)+/g, '[\\s-]?') + ')(?![a-z0-9])') }));
    Object.entries(alias).forEach(([a, m]) => { if (m && makes.includes(m)) makeRes.push({ name: m, re: new RegExp('(^|[^a-z0-9])(' + a + ')(?![a-z0-9])') }); });
    const cities = {}; Object.entries(DB.zips).forEach(([z, l]) => { if (!cities[l.city.toLowerCase()]) cities[l.city.toLowerCase()] = z; });
    const feats = new Set(DB.vehicles.flatMap(v => v.features));
    return { makes: makeRes, models, cities, feats };
  }
  const getLex = () => { if (lexStamp !== DB.loadedAt) { lex = buildLex(); lexStamp = DB.loadedAt; } return lex; };

  const COLORS = ['white', 'black', 'silver', 'gray', 'grey', 'blue', 'red', 'green', 'orange', 'brown', 'yellow'];
  const FEATS = [
    [/\b(sun ?roof|moon ?roof|panoramic roof)\b/, 'Sunroof'], [/\bheated (?:front )?seats?\b/, 'Heated Seats'], [/\b(?:ventilated|cooled) seats?\b/, 'Ventilated Seats'],
    [/\bleather\b/, 'Leather Seats'], [/\b(navigation|nav|gps)\b/, 'Navigation'], [/\b(apple )?car ?play\b/, 'Apple CarPlay'], [/\bandroid auto\b/, 'Android Auto'],
    [/\b(backup|back-up|rear[- ]?view|reverse) camera\b/, 'Backup Camera'], [/\bblind[- ]spot\b/, 'Blind Spot Monitor'], [/\badaptive cruise\b/, 'Adaptive Cruise Control'],
    [/\b(third|3rd)[- ]row\b|\b(three|3) rows\b|\b(7|seven|8|eight)[- ](?:seat|seater|passenger)s?\b/, 'Third Row Seating'], [/\btow(?:ing)?(?: package| capacity| hitch)?\b/, 'Tow Package'],
    [/\bremote start\b/, 'Remote Start'], [/\b(premium (?:audio|sound)|bose|harman|great sound)\b/, 'Premium Audio'], [/\bbluetooth\b/, 'Bluetooth'], [/\bheated steering\b/, 'Heated Steering Wheel'], [/\bautopilot\b/, 'Autopilot Assist']
  ];
  const K = (n, suf) => { n = parseFloat(String(n).replace(/,/g, '')); if (suf && /^(k|thousand|grand)/.test(suf)) n *= 1000; return n; };

  function parseNL(raw) {
    const out = { f: emptyF(), keys: new Set(), reset: false, rel: [] };
    const f = out.f, mark = (...ks) => ks.forEach(k => out.keys.add(k));
    const L = getLex();
    let t = ' ' + String(raw).toLowerCase().replace(/[’]/g, "'").replace(/\$\s+/g, '$') + ' ';
    const take = (re, fn) => { const m = t.match(re); if (m) { fn(m); t = t.replace(re, ' '); return true; } return false; };

    if (take(/\b(start over|reset|new search|clear (?:everything|all|filters))\b/, () => { out.reset = true; })) { /* handled by merge */ }

    // --- models then makes (longest first, each match blanked so it can't be matched twice) ---
    const modelHits = [];
    for (const m of L.models) { const mm = t.match(m.re); if (mm) { modelHits.push(m); t = t.replace(m.re, '$1 '); } }
    const makeHits = new Set();
    for (const m of L.makes) { if (t.match(m.re)) { makeHits.add(m.name); t = t.replace(m.re, '$1 '); } }
    if (modelHits.length) { f.model = uniqSorted(modelHits.map(m => m.name)); mark('model'); modelHits.forEach(m => makeHits.add(m.make)); }
    if (makeHits.size) { f.make = uniqSorted(Array.from(makeHits)); mark('make'); }

    // --- dealer by name ---
    DB.dealers.forEach(d => { const n = d.name.toLowerCase(); if (t.includes(n) || (n.split(' ').slice(0, 2).join(' ').length > 9 && t.includes(n.split(' ').slice(0, 2).join(' ')))) { f.dealer = d.dealer_id; mark('dealer'); } });
    // --- city / zip ---
    take(/\b(?:in|near|around|close to|by)\s+([a-z]+(?: [a-z]+)?)\b/, m => { const c = m[1].trim(); if (L.cities[c]) { f.zip = L.cities[c]; mark('zip'); if (!f.dist) { f.dist = 25; mark('dist'); } } else if (L.cities[c.split(' ')[0]]) { f.zip = L.cities[c.split(' ')[0]]; mark('zip'); if (!f.dist) { f.dist = 25; mark('dist'); } } else t += ' ' + m[0]; });
    take(/\b(\d{5})\b/, m => { if (DB.zips[m[1]]) { f.zip = m[1]; mark('zip'); } else t += ' ' + m[1]; });

    // --- distance & mileage ---
    take(/\bwithin\s+(\d+)\s*(?:miles?|mi)\b/, m => { f.dist = +m[1]; mark('dist'); });
    take(/\b(near me|nearby|close to me|local)\b/, () => { if (!f.dist) { f.dist = 50; mark('dist'); } });
    take(/(?:under|below|less than|fewer than|max(?:imum)?|at most|up to|no more than)\s*(\d[\d,.]*)\s*(k)?\s*(?:miles|mi|mileage)\b/, m => { f.milesMax = K(m[1], m[2]); mark('milesMax'); });
    take(/(\d[\d,.]*)\s*(k)?\s*(?:miles|mi)\s*(?:or less|or fewer|max)\b/, m => { f.milesMax = K(m[1], m[2]); mark('milesMax'); });
    take(/\blow[- ]mile(?:age|s)\b/, () => { f.milesMax = 40000; mark('milesMax'); });
    take(/\b(?:lower|fewer|less) (?:miles|mileage)\b/, () => out.rel.push('lowMiles'));
    take(/\b(?:high|any) mileage ok(?:ay)?\b/, () => { });

    // --- years ---
    const yr = '(19[89]\\d|20[0-3]\\d)';
    if (!take(new RegExp('(?:between|from)\\s*' + yr + '\\s*(?:and|to|-)\\s*' + yr), m => { f.yearMin = +m[1]; f.yearMax = +m[2]; mark('yearMin', 'yearMax'); })
      && !take(new RegExp(yr + '\\s*(?:-|to)\\s*' + yr), m => { f.yearMin = +m[1]; f.yearMax = +m[2]; mark('yearMin', 'yearMax'); })
      && !take(new RegExp(yr + '\\s*(?:or|and)?\\s*(?:newer|later|and up|\\+|and above|or after|onwards?)'), m => { f.yearMin = +m[1]; mark('yearMin'); })
      && !take(new RegExp('(?:newer than|after)\\s*' + yr), m => { f.yearMin = +m[1] + 1; mark('yearMin'); })
      && !take(new RegExp('(?:since|from)\\s*' + yr), m => { f.yearMin = +m[1]; mark('yearMin'); })
      && !take(new RegExp(yr + '\\s*(?:or|and)?\\s*(?:older|earlier|or before)'), m => { f.yearMax = +m[1]; mark('yearMax'); })
      && !take(new RegExp('(?:before|older than|prior to)\\s*' + yr), m => { f.yearMax = +m[1] - 1; mark('yearMax'); })
      && !take(/(?:last|past)\s*(\d+)\s*years?/, m => { f.yearMin = maxYear() - +m[1]; mark('yearMin'); })
      && !take(new RegExp('\\b' + yr + '\\b'), m => { f.yearMin = f.yearMax = +m[1]; mark('yearMin', 'yearMax'); })) {
      take(/\b(late[- ]model|nearly new|almost new|recent(?:ly made)?)\b/, () => { f.yearMin = maxYear() - 3; mark('yearMin'); });
      take(/\b(newer|more recent)\b/, () => out.rel.push('newer'));
    }

    // --- price ---
    const guard = '(?!\\s*(?:mpg|miles|mi\\b|seats?|passengers?|rows?|years?|doors?))';
    const pn = (a, s) => { const n = K(a, s); return (!s && n > 0 && n < 1000) ? n * 1000 : n; };
    if (!take(new RegExp('between\\s*\\$?(\\d[\\d,.]*)\\s*(k|thousand|grand)?\\s*(?:and|to|-)\\s*\\$?(\\d[\\d,.]*)\\s*(k|thousand|grand)?' + guard), m => { const a = pn(m[1], m[2] || m[4]), b = pn(m[3], m[4]); f.priceMin = Math.min(a, b); f.priceMax = Math.max(a, b); mark('priceMin', 'priceMax'); })
      && !take(new RegExp('\\$?(\\d[\\d,.]*)\\s*(k|thousand|grand)\\s*(?:-|to)\\s*\\$?(\\d[\\d,.]*)\\s*(k|thousand|grand)?' + guard), m => { const a = pn(m[1], m[2]), b = pn(m[3], m[4] || m[2]); f.priceMin = Math.min(a, b); f.priceMax = Math.max(a, b); mark('priceMin', 'priceMax'); })
      && !take(new RegExp('(?:around|about|roughly|approximately|~)\\s*\\$?(\\d[\\d,.]*)\\s*(k|thousand|grand)?' + guard), m => { const a = pn(m[1], m[2]); f.priceMin = Math.round(a * 0.85 / 500) * 500; f.priceMax = Math.round(a * 1.15 / 500) * 500; mark('priceMin', 'priceMax'); })
      && !take(new RegExp('(?:under|below|less than|up to|max(?:imum)?|no more than|at most|budget(?: of| is)?|<)\\s*\\$?(\\d[\\d,.]*)\\s*(k|thousand|grand)?' + guard), m => { f.priceMax = pn(m[1], m[2]); mark('priceMax'); })
      && !take(new RegExp('(?:over|above|more than|at least|min(?:imum)?|starting at)\\s*\\$(\\d[\\d,.]*)\\s*(k|thousand|grand)?'), m => { f.priceMin = pn(m[1], m[2]); mark('priceMin'); })
      && !take(/\$\s?(\d[\d,.]*)\s*(k|thousand|grand)?/, m => { f.priceMax = pn(m[1], m[2]); mark('priceMax'); })
      && !take(/\b(\d{2,3})\s?k\b/, m => { f.priceMax = +m[1] * 1000; mark('priceMax'); })) { /* no price */ }
    if (/\b(cheap|affordable|inexpensive|budget|economical)\b/.test(t) && !out.keys.has('priceMax')) { f.priceMax = 18000; mark('priceMax'); f.sort = 'priceAsc'; mark('sort'); }
    take(/\b(cheaper|less expensive|lower price)\b/, () => out.rel.push('cheaper'));

    // --- fuel economy & fuel ---
    take(/(\d{2})\s*\+?\s*mpg/, m => { f.mpgMin = +m[1]; mark('mpgMin'); });
    take(/\b(fuel[- ]efficient|good gas mileage|great gas mileage|good mpg|great mpg|high mpg|economical|sips gas)\b/, () => { if (!f.mpgMin) { f.mpgMin = 30; mark('mpgMin'); } });
    const fuels = []; if (/\b(electric|evs?|battery|zero[- ]emission)\b/.test(t)) fuels.push('Electric'); if (/\b(hybrid)s?\b/.test(t)) fuels.push('Hybrid'); if (/\bdiesel\b/.test(t)) fuels.push('Diesel'); if (/\b(gas|gasoline|petrol)\b(?!\s*(?:mileage|mpg|efficien))/.test(t)) fuels.push('Gas');
    if (/\b(eco[- ]friendly|green|low emissions?)\b/.test(t) && !fuels.length) fuels.push('Electric', 'Hybrid');
    if (fuels.length) { f.fuel = fuels; mark('fuel'); }

    // --- use-case phrases ---
    if (take(/\b(first car|new driver|student|teen(?:ager)?|college)\b/, () => { })) { if (!out.keys.has('priceMax')) { f.priceMax = 15000; mark('priceMax'); } if (!makeHits.size) { f.body = ['Sedan', 'Hatchback']; mark('body'); } }
    if (take(/\b(commut(?:e|er|ing)|daily driver)\b/, () => { })) { if (!f.mpgMin) { f.mpgMin = 30; mark('mpgMin'); } }
    let offroad = false; take(/\b(off[- ]?road(?:ing)?|adventure|camping|snow|winter|mountain|trail)\b/, () => { offroad = true; });
    let family = false; take(/\b(family|families|kids?|children|carpool|road ?trip)\b/, () => { family = true; });
    let lux = false; take(/\b(luxury|luxurious|upscale|premium brand)\b/, () => { lux = true; });
    take(/\bsporty|sports? car|two[- ]door|fast\b/, () => { f.body = ['Coupe']; mark('body'); });

    // --- body style ---
    const bodies = new Set(f.body);
    if (/\b(suvs?|crossovers?|cuvs?)\b/.test(t)) bodies.add('SUV'); if (/\b(trucks?|pick-?ups?)\b/.test(t)) bodies.add('Truck'); if (/\bsedans?\b/.test(t)) bodies.add('Sedan');
    if (/\bcoupes?\b/.test(t)) bodies.add('Coupe'); if (/\bhatch(?:back)?s?\b/.test(t)) bodies.add('Hatchback'); if (/\b(mini-?vans?|vans?)\b/.test(t)) bodies.add('Van');
    if (bodies.size) { f.body = Array.from(bodies); mark('body'); }

    // --- drivetrain / transmission / condition / history / colours ---
    const drv = []; if (/\b(awd|all[- ]wheel)\b/.test(t)) drv.push('AWD'); if (/\b(4x4|4wd|four[- ]wheel|4[- ]wheel)\b/.test(t)) drv.push('4WD'); if (/\b(fwd|front[- ]wheel)\b/.test(t)) drv.push('FWD'); if (/\b(rwd|rear[- ]wheel)\b/.test(t)) drv.push('RWD');
    if (drv.length) { f.drive = drv; mark('drive'); }
    if (/\b(manual|stick(?: shift)?)\b/.test(t)) { f.trans = ['Manual']; mark('trans'); } else if (/\bautomatic\b/.test(t)) { f.trans = ['Automatic']; mark('trans'); }
    const cond = []; if (/\b(certified|cpo)\b/.test(t)) cond.push('Certified'); if (/\b(brand[- ]new|new)\b/.test(t)) cond.push('New'); if (/\b(used|pre-?owned|second[- ]hand)\b/.test(t)) cond.push('Used');
    if (cond.length) { f.cond = cond; mark('cond'); }
    if (/\b(no accidents?|accident[- ]free|never (?:been )?in an accident|clean (?:history|carfax|record|title))\b/.test(t)) { f.noacc = true; mark('noacc'); }
    if (/\b(1|one|single|first)[- ]owner\b/.test(t)) { f.one = true; mark('one'); }
    const cols = COLORS.filter(c => new RegExp('\\b' + c + '\\b').test(t)).map(c => cap(c === 'grey' ? 'gray' : c));
    if (cols.length) { f.color = uniqSorted(cols); mark('color'); }

    // --- deals & sorting ---
    if (/\b(great deals?|best deals?|bargains?|steals?)\b/.test(t)) { f.deal = ['Great Deal']; mark('deal'); f.sort = 'deal'; mark('sort'); }
    else if (/\b(good deals?|good price|fair price|well priced)\b/.test(t)) { f.deal = ['Great Deal', 'Good Deal']; mark('deal'); }
    if (/\b(cheapest|lowest price|least expensive)\b/.test(t)) { f.sort = 'priceAsc'; mark('sort'); }
    else if (/\b(most expensive|highest price)\b/.test(t)) { f.sort = 'priceDesc'; mark('sort'); }
    else if (/\b(lowest mileage|fewest miles)\b/.test(t)) { f.sort = 'milesAsc'; mark('sort'); }
    else if (/\b(newest|latest model)\b/.test(t)) { f.sort = 'yearDesc'; mark('sort'); }
    else if (/\b(closest|nearest)\b/.test(t)) { f.sort = 'distance'; mark('sort'); }

    // --- features ---
    const feats = [];
    FEATS.forEach(([re, name]) => { if (re.test(t) && L.feats.has(name)) feats.push(name); });
    if (feats.length) { f.feat = uniqSorted(feats); mark('feat'); }
    if (feats.includes('Third Row Seating') && !f.body.length) { f.body = ['SUV', 'Van']; mark('body'); }
    if (feats.includes('Tow Package') && !f.body.length && !makeHits.size) { f.body = ['Truck', 'SUV']; mark('body'); }

    // --- derived intents (only when the user did not state the thing explicitly) ---
    if (family && !out.keys.has('body')) { f.body = ['SUV', 'Van']; mark('body'); }
    if (offroad) { if (!out.keys.has('drive')) { f.drive = ['AWD', '4WD']; mark('drive'); } if (!out.keys.has('body')) { f.body = ['SUV', 'Truck']; mark('body'); } }
    if (lux && !out.keys.has('make')) { f.make = ['Audi', 'BMW', 'Lexus', 'Mercedes-Benz', 'Volvo'].filter(m => DB.vehicles.some(v => v.make === m)); mark('make'); }
    if (/\b(hybrid|electric|ev)\b/.test(t) && f.fuel.includes('Gas') && f.fuel.length > 1) f.fuel = f.fuel.filter(x => x !== 'Gas');
    return out;
  }

  /* ----- merge follow-ups with the previous search ----- */
  function mergeCriteria(prev, cur) {
    let f;
    const newTopic = prev && ['make', 'model', 'body', 'fuel'].some(k => cur.keys.has(k) && JSON.stringify(prev[k]) !== JSON.stringify(cur.f[k]));
    f = (!prev || cur.reset || newTopic) ? emptyF() : clone(prev);
    if (newTopic && prev.zip) f.zip = prev.zip;
    cur.keys.forEach(k => {
      if (k === 'feat') f.feat = uniqSorted(f.feat.concat(cur.f.feat));
      else if (k === 'model' && !cur.keys.has('make')) f.model = cur.f.model;
      else f[k] = cur.f[k];
    });
    if (cur.keys.has('make') && !cur.keys.has('model') && prev && !newTopic) { /* same make, keep model */ } else if (cur.keys.has('make') && !cur.keys.has('model')) f.model = [];
    cur.rel.forEach(r => {
      if (r === 'cheaper') { const base = f.priceMax || Math.round((sorted(applyF(f), 'priceAsc').slice(-1)[0] || { price: 30000 }).price); f.priceMax = Math.max(4000, Math.round(base * 0.8 / 500) * 500); }
      if (r === 'newer') f.yearMin = f.yearMin ? Math.min(maxYear(), f.yearMin + 2) : maxYear() - 3;
      if (r === 'lowMiles') f.milesMax = Math.max(10000, Math.round((f.milesMax || 100000) * 0.6 / 5000) * 5000);
    });
    if (f.model.length && !f.make.length) f.make = uniqSorted(DB.vehicles.filter(v => f.model.includes(v.model)).map(v => v.make));
    if (f.make.length && f.model.length) f.model = f.model.filter(md => DB.vehicles.some(v => v.model === md && f.make.includes(v.make)));
    return f;
  }
  const meaningful = f => { const e = emptyF(); return JSON.stringify(Object.assign({}, f, { sort: 'deal', zip: '', page: 0 })) !== JSON.stringify(Object.assign({}, e, { sort: 'deal' })); };

  function relax(f) {
    const order = [['feat'], ['color'], ['dealer'], ['one'], ['noacc'], ['trans'], ['drive'], ['deal'], ['dist'], ['mpgMin'], ['milesMax'], ['cond'], ['fuel'], ['yearMin', 'yearMax'], ['priceMin', 'priceMax'], ['body']];
    const g = clone(f), dropped = [];
    for (const keys of order) {
      if (applyF(g).length) break;
      let had = false; keys.forEach(k => { if (Array.isArray(g[k]) ? g[k].length : g[k]) { had = true; g[k] = Array.isArray(g[k]) ? [] : (typeof g[k] === 'boolean' ? false : (typeof g[k] === 'number' ? 0 : '')); } });
      if (had) dropped.push(keys[0].replace('Min', '').replace('Max', ''));
    }
    return { g, dropped };
  }
  const LABEL = { feat: 'features', color: 'color', dealer: 'dealer', one: 'owner count', noacc: 'accident history', trans: 'transmission', drive: 'drivetrain', deal: 'deal rating', dist: 'distance', mpgMin: 'fuel economy', milesMax: 'mileage', cond: 'condition', fuel: 'fuel type', year: 'year', price: 'price', body: 'body style' };

  function describe(f) {
    const c = [];
    if (f.cond.length) c.push(f.cond.join('/')); if (f.yearMin || f.yearMax) c.push(f.yearMin && f.yearMax ? (f.yearMin === f.yearMax ? '' + f.yearMin : f.yearMin + '–' + f.yearMax) : f.yearMin ? f.yearMin + '+' : 'up to ' + f.yearMax);
    if (f.color.length) c.push(f.color.join('/')); if (f.make.length) c.push(f.make.join('/')); if (f.model.length) c.push(f.model.join('/')); if (f.body.length) c.push(f.body.join('/')); if (f.fuel.length) c.push(f.fuel.join('/'));
    if (f.priceMin && f.priceMax) c.push(money(f.priceMin) + '–' + money(f.priceMax)); else if (f.priceMax) c.push('under ' + money(f.priceMax)); else if (f.priceMin) c.push('over ' + money(f.priceMin));
    if (f.milesMax) c.push('under ' + num(f.milesMax) + ' mi'); if (f.mpgMin) c.push(f.mpgMin + '+ MPG'); if (f.drive.length) c.push(f.drive.join('/')); if (f.trans.length) c.push(f.trans[0]);
    f.feat.forEach(x => c.push(x)); if (f.noacc) c.push('no accidents'); if (f.one) c.push('1 owner'); if (f.deal.length) c.push(f.deal.join('/'));
    if (f.dealer && DB.dById[f.dealer]) c.push(DB.dById[f.dealer].name); if (f.dist) c.push('within ' + f.dist + ' mi of ' + (f.zip || userZip()));
    return c.filter(Boolean);
  }

  /* ----- UI ----- */
  const box = () => $('#aiMsgs');
  function push(role, html) {
    const d = document.createElement('div'); d.className = 'msg ' + (role === 'u' ? 'u' : 'a'); d.innerHTML = html; box().appendChild(d); box().scrollTop = box().scrollHeight; return d;
  }
  function greet() {
    push('a', `<b>Hi, I’m Wheelspan AI ✦</b><br>Tell me what you’re looking for in plain English – type it or tap the mic. You can keep refining (“make it red”, “cheaper”, “only AWD”).
      <div class="chips" style="margin-top:10px">${['Family SUV under $30k with third row', 'Electric car under $35,000', 'Red Ford Mustang manual', 'Truck 4x4 with tow package, no accidents', 'Fuel-efficient hybrid sedan 2020 or newer', 'Luxury SUV with heated seats within 25 miles'].map(t => `<span class="chip" data-act="ai-chip" data-q="${esc(t)}">${esc(t)}</span>`).join('')}</div>`);
  }
  function respond(text) {
    const cur = parseNL(text);
    if (!cur.keys.size && !cur.rel.length && !cur.reset) {
      return `I couldn’t find any car details in that. Try something like <i>“blue Toyota SUV under $30k with low miles”</i> or <i>“AWD truck, no accidents, within 50 miles”</i>.`;
    }
    const f = mergeCriteria(lastF, cur);
    if (cur.reset && !meaningful(f)) { lastF = null; return 'Cleared! What are you looking for now?'; }
    let list = applyF(f), note = '', shown = f;
    if (!list.length) {
      const r = relax(f); shown = r.g; list = applyF(shown);
      note = list.length ? `<p class="small" style="margin:6px 0">No exact matches, so I loosened <b>${esc(Array.from(new Set(r.dropped.map(k => LABEL[k] || k))).join(', '))}</b> to show the closest cars.</p>` : '';
    }
    lastF = f;
    const sorted_ = sorted(list, shown.sort), top = sorted_.slice(0, 3);
    const chips = describe(shown).map(c => `<span class="chip on">${esc(c)}</span>`).join('');
    const href = '#/search?' + toQS(shown);
    if (!list.length) return `Here’s what I understood:<div class="chips" style="margin:8px 0">${chips}</div><p>Nothing in inventory matches yet, even after loosening filters. Try a different make, body style or budget.</p>`;
    return `Here’s what I understood:<div class="chips" style="margin:8px 0">${chips}</div>${note}
      <p style="margin:6px 0"><b>${list.length}</b> car${list.length === 1 ? '' : 's'} found – top ${top.length} by ${(SORTS[shown.sort] || SORTS.deal)[0].toLowerCase()}:</p>
      ${top.map(v => `<a class="mini" href="#/vehicle/${esc(v.id)}"><img src="${esc(v.image)}" data-vid="${esc(v.id)}" alt=""><span><b>${esc(v.title)} ${esc(v.trim)}</b>${money(v.price)} · ${num(v.mileage)} mi<br>${dealTag(v)}</span></a>`).join('')}
      <p style="margin:10px 0 0"><a class="btn sm" href="${href}">See all ${list.length} results →</a> <span class="tiny muted">Say “cheaper”, “make it blue” or “start over” to refine.</span></p>`;
  }
  function send(text) {
    text = String(text || '').trim(); if (!text) return;
    push('u', esc(text)); $('#aiInput').value = '';
    const typing = push('a', '<span class="typing"><i></i><i></i><i></i></span>');
    setTimeout(() => { typing.innerHTML = respond(text); box().scrollTop = box().scrollHeight; }, 420);
  }
  function open(text) {
    $('#aiDrawer').classList.add('open'); $('#aiScrim').classList.add('show');
    if (!msgs.length) { msgs.push(1); greet(); }
    if (text && String(text).trim()) { const h = $('#heroAI'); if (h) h.value = ''; send(text); }
    setTimeout(() => $('#aiInput').focus(), 250);
  }
  function close() { $('#aiDrawer').classList.remove('open'); $('#aiScrim').classList.remove('show'); if (rec) { try { rec.stop(); } catch (e) { /* ignore */ } } }

  function mic(btn) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('Voice input isn’t supported in this browser – please type your request.'); return; }
    if (rec) { try { rec.stop(); } catch (e) { /* ignore */ } return; }
    const targetId = btn.dataset.target || 'aiInput', input = document.getElementById(targetId);
    let failed = false;
    try {
      rec = new SR(); rec.lang = 'en-US'; rec.interimResults = true; rec.maxAlternatives = 1;
      rec.onresult = e => { let s = ''; for (const r of e.results) s += r[0].transcript; input.value = s; };
      rec.onerror = e => { failed = true; toast(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'Microphone is blocked in this view – type your request instead, or open the page in its own tab.' : 'Voice input stopped (' + e.error + ').'); };
      rec.onend = () => { btn.classList.remove('rec'); rec = null; const v = input.value.trim(); if (v && !failed) { if (targetId === 'aiInput') send(v); else open(v); } };
      rec.start(); btn.classList.add('rec'); toast('Listening… describe the car you want');
    } catch (e) { rec = null; btn.classList.remove('rec'); toast('Could not start voice input – please type instead.'); }
  }

  function init() {
    $('#aiClose').addEventListener('click', close); $('#aiScrim').addEventListener('click', close);
    $('#aiForm').addEventListener('submit', e => { e.preventDefault(); send($('#aiInput').value); });
    $('#aiReset').addEventListener('click', () => { lastF = null; box().innerHTML = ''; msgs = []; greet(); msgs.push(1); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    box().addEventListener('click', e => { if (e.target.closest('a[href^="#/"]') && window.innerWidth < 1200) close(); });
  }
  return { open, close, mic, send, init, parseNL, mergeCriteria };
})();
