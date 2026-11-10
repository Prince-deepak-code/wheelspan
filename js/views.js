/* Wheelspan 2.0 views: every page is a hash route, so every link is a real, shareable, new-tab-friendly <a href>. */
'use strict';

const ui = { expanded: {}, heroCond: '', makeFilterText: '' };
const PAGE_SIZE = 12;
const curParams = () => new URLSearchParams((curHash().split('?')[1]) || '');
const go = h => navigate(h);

const DEALER_PHOTOS = [
  'images/brand/dealer-1.webp',
  'images/brand/dealer-2.webp',
  'images/brand/dealer-3.webp',
  'images/brand/dealer-4.webp'
];
function dealerPhoto(d) {
  if (!d) return DEALER_PHOTOS[0];
  const idx = (parseInt(String(d.dealer_id).replace(/\D/g, ''), 10) || 1) - 1;
  return DEALER_PHOTOS[idx % DEALER_PHOTOS.length];
}

/* ---------- 6-item feature strip ---------- */
function featureStripHTML() {
  return `<section class="feature-strip"><div class="wrap">
    <a class="fstrip-item" href="#" data-act="ai-open" onclick="return false">
      <span class="fstrip-ico purple"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.6 9.4L22 12L14.6 14.6L12 22L9.4 14.6L2 12L9.4 9.4L12 2Z"/></svg></span>
      <div><b>Wheelspan AI</b><span>Natural language search</span></div>
    </a>
    <a class="fstrip-item" href="#" data-act="ai-open" onclick="return false">
      <span class="fstrip-ico purple"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg></span>
      <div><b>Voice Search</b><span>Search by speaking</span></div>
    </a>
    <a class="fstrip-item" href="#/compare">
      <span class="fstrip-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M3 9l9-4 9 4M6 9l-3 7h6l-3-7zm12 0l-3 7h6l-3-7z"/></svg></span>
      <div><b>Compare Vehicles</b><span>Side-by-side specs</span></div>
    </a>
    <a class="fstrip-item" href="#/saved">
      <span class="fstrip-ico purple"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></span>
      <div><b>Save Vehicles</b><span>Keep a shortlist</span></div>
    </a>
    <a class="fstrip-item" href="#/finance">
      <span class="fstrip-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg></span>
      <div><b>Financing</b><span>Estimate payments</span></div>
    </a>
    <a class="fstrip-item" href="#/research">
      <span class="fstrip-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span>
      <div><b>Research</b><span>Reviews, ratings &amp; more</span></div>
    </a>
  </div></section>`;
}

/* ---------- vehicle card ---------- */
function vcard(v) {
  const d = v.dealer, dist = v._d != null && v._d < 9000 ? (v._d < 10 ? v._d.toFixed(1) : Math.round(v._d)) + ' mi' : '';
  const saved = SAVED.has(v.id);
  let condClass = 'used', condText = esc(v.condition);
  if (v.condition === 'Certified') { condClass = 'cpo'; condText = 'Certified Pre-Owned'; }
  else if (v.condition === 'New') { condClass = 'new'; condText = 'New'; }
  else if (v.deal === 'Great Deal') { condClass = 'great-pill'; condText = '🔥 Great Deal'; }

  return `<article class="vcard">
    <a class="im" href="#/vehicle/${esc(v.id)}">
      ${imgTag(v)}
      <span class="cond ${condClass}">${condText}</span>
    </a>
    <button class="save ${saved ? 'on' : ''}" data-act="save" data-id="${esc(v.id)}" aria-label="Save vehicle" title="Save">${saved ? '♥' : '♡'}</button>
    <div class="body">
      <div class="title-row">
        <div>
          <h3><a href="#/vehicle/${esc(v.id)}">${esc(v.title)}</a></h3>
          <div class="vtrim">${esc(v.trim)}</div>
        </div>
        <span class="brand-badge">${esc(v.make)}</span>
      </div>
      <div class="pricerow">
        <span class="price">${money(v.price)}</span>
        ${dealTag(v)}
      </div>
      <div class="vspecs">${num(v.mileage)} mi <i>|</i> ${esc(v.exterior_color)} <i>|</i> ${esc(v.drivetrain)}</div>
      <div class="vdealer">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${d ? `<a href="#/dealer/${esc(d.dealer_id)}">${esc(d.name)}</a>` : '<span>Metro Detroit Dealer</span>'}
        ${dist ? `<span>(${dist})</span>` : ''}
      </div>
      <div class="foot">
        <label class="cmp"><input type="checkbox" data-act="cmp" data-id="${esc(v.id)}" ${COMPARE.includes(v.id) ? 'checked' : ''}> Compare</label>
        <div style="display:flex;align-items:center;gap:6px">
          <a class="btn-card-view" href="#/vehicle/${esc(v.id)}">View Details</a>
          <button class="foot-save ${saved ? 'on' : ''}" data-act="save" data-id="${esc(v.id)}" aria-label="Save">${saved ? '♥' : '♡'}</button>
        </div>
      </div>
    </div>
  </article>`;
}
const cards = list => list.map(vcard).join('');

/* ---------- HOME ---------- */
route(/^\/?$/, () => {
  const zip = userZip(), dm = distMap(zip);
  DB.vehicles.forEach(v => { v._d = dm[v.dealer_id]; });
  const makes = uniqSorted(DB.vehicles.map(v => v.make));
  const years = uniqSorted(DB.vehicles.map(v => v.year), (a, b) => b - a);

  // Curated 6 featured vehicles matching the screenshot showcase (BMW X5, Ford F-150, Honda Accord, Toyota RAV4, Chevrolet Tahoe, Audi A4)
  const featuredIds = ['WS-1009', 'WS-1040', 'WS-1050', 'WS-1141', 'WS-1026', 'WS-1001'];
  const featured = featuredIds.map(id => DB.vById[id]).filter(Boolean);
  if (featured.length < 6) {
    sorted(DB.vehicles, 'deal').forEach(v => { if (featured.length < 6 && !featured.includes(v)) featured.push(v); });
  }

  const bestDeals = sorted(DB.vehicles.filter(v => !featured.includes(v)), 'deal').slice(0, 4);
  const nearby = DB.dealers.slice().sort((a, b) => dealerDist(a, zip) - dealerDist(b, zip)).slice(0, 4);
  const cmpPair = (COMPARE.length >= 2 ? COMPARE : ['WS-1009', 'WS-1003']).join(',');

  const html = `
  <section class="hero">
    <div class="hero-bg-art" aria-hidden="true"></div>
    <div class="wrap">
      <div class="hero-inner">
        <h1>Find Your Next Vehicle<br>in <span class="hl-detroit">Detroit</span></h1>
        <p class="lead">Search ${num(DB.vehicles.length)} inspected new, used, and certified vehicles from ${DB.dealers.length} trusted Detroit-area dealers.</p>

        <div class="hero-tabs" id="heroTabs">
          <a href="#/search" data-act="hero-cond" data-c="" class="on">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 17h14v-5l-2-5H7L5 12v5z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>
            All Vehicles
          </a>
          <a href="#/search?cond=New" data-act="hero-cond" data-c="New">New</a>
          <a href="#/search?cond=Used" data-act="hero-cond" data-c="Used">Used</a>
          <a href="#/search?cond=Certified" data-act="hero-cond" data-c="Certified">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            Certified
          </a>
        </div>

        <div class="hero-searchbar" id="heroForm">
          <div class="sb-cell">
            <label class="sb-lbl" for="hMake">Make</label>
            <select id="hMake"><option value="">Any Make</option>${makes.map(m => `<option>${esc(m)}</option>`).join('')}</select>
          </div>
          <div class="sb-cell">
            <label class="sb-lbl" for="hModel">Model</label>
            <select id="hModel" disabled><option value="">Any Model</option></select>
          </div>
          <div class="sb-cell">
            <label class="sb-lbl" for="hPrice">Price</label>
            <select id="hPrice"><option value="">Any Price</option>${[15000, 20000, 25000, 30000, 35000, 40000, 50000, 75000].map(p => `<option value="${p}">Under ${money(p)}</option>`).join('')}</select>
          </div>
          <div class="sb-cell">
            <label class="sb-lbl" for="hYear">Year</label>
            <select id="hYear"><option value="">Any Year</option>${years.map(y => `<option value="${y}">${y} &amp; Newer</option>`).join('')}</select>
          </div>
          <input type="hidden" id="hZip" value="${esc(zip)}">
          <a class="btn-search-hero" id="hGo" href="#/search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span id="hGoText">Search Vehicles</span>
          </a>
        </div>

        <div class="hero-ai-row">
          <div class="hero-ai-box">
            <span class="ai-tag"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.6 9.4L22 12L14.6 14.6L12 22L9.4 14.6L2 12L9.4 9.4L12 2Z"/></svg> Ask Wheelspan AI</span>
            <input id="heroAI" placeholder='e.g., "A reliable AWD SUV under $30,000 with low miles"' aria-label="Ask Wheelspan AI">
            <button class="ai-mic-btn" data-act="mic" data-target="heroAI" title="Voice Search" aria-label="Voice Search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>
            </button>
            <button class="ai-go-btn" data-act="hero-ai">Search AI</button>
          </div>
          <div class="hero-pop-pills">
            <span>Popular searches:</span>
            ${[
              ['SUVs under $30k', 'SUV under $30000'],
              ['Trucks in Detroit', '4WD truck with tow package'],
              ['Hybrid vehicles', 'Fuel-efficient hybrid'],
              ['Certified pre-owned', 'Certified pre-owned'],
              ['Electric vehicles', 'Electric car under $35000']
            ].map(([label, q]) => `<a class="pop-pill" href="#" data-act="ai-chip" data-q="${esc(q)}" onclick="return false">${esc(label)}</a>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </section>

  ${featureStripHTML()}

  <section class="block">
    <div class="wrap">
      <div class="sec-h">
        <h2>Featured Vehicles in Detroit</h2>
        <a class="view-all" href="#/search">View All Inventory (${DB.vehicles.length}) →</a>
      </div>
      <div class="grid g6">${cards(featured)}</div>
    </div>
  </section>

  <section class="block" style="padding-top:4px">
    <div class="wrap grid g3">
      <div class="promo-card">
        <img src="images/brand/promo-compare.webp" alt="Compare Vehicles" loading="lazy">
        <div>
          <h3>Compare Vehicles</h3>
          <p>See specs, features, pricing, and market value side by side.</p>
          <a class="btn outline-blue" href="#/compare?ids=${cmpPair}">Start Comparing</a>
        </div>
      </div>
      <div class="promo-card">
        <img src="images/brand/promo-finance.webp" alt="Estimate Your Payments" loading="lazy">
        <div>
          <h3>Estimate Your Payments</h3>
          <p>Get a personalized monthly financing estimate in seconds.</p>
          <a class="btn outline-blue" href="#/finance">Calculate Payment</a>
        </div>
      </div>
      <div class="promo-card">
        <img src="images/brand/promo-research.webp" alt="Vehicle Research" loading="lazy">
        <div>
          <h3>Vehicle Research</h3>
          <p>Explore model pricing, MPG ratings, and live market trends.</p>
          <a class="btn outline-blue" href="#/research">Browse Research</a>
        </div>
      </div>
    </div>
  </section>

  <section class="block" style="padding-top:4px">
    <div class="wrap">
      <div class="sec-h">
        <h2>Shop by Category</h2>
        <a class="view-all" href="#/search">Explore All Body Styles →</a>
      </div>
      <div class="grid g4">
        <a class="cat-card" href="${searchHref({ body: ['Truck'] })}" aria-label="Shop Trucks">
          <img src="images/brand/cat-trucks.webp" alt="Shop Trucks" loading="lazy">
        </a>
        <a class="cat-card" href="${searchHref({ body: ['SUV'] })}" aria-label="Shop SUVs">
          <img src="images/brand/cat-suvs.webp" alt="Shop SUVs" loading="lazy">
        </a>
        <a class="cat-card" href="${searchHref({ body: ['Sedan', 'Coupe', 'Hatchback'] })}" aria-label="Shop Cars">
          <img src="images/brand/cat-cars.webp" alt="Shop Cars" loading="lazy">
        </a>
        <a class="cat-card" href="#/dealers" aria-label="Find a Dealer">
          <img src="images/brand/cat-dealers.webp" alt="Find a Dealer" loading="lazy">
        </a>
      </div>
    </div>
  </section>

  <section class="block" style="padding-top:4px">
    <div class="wrap">
      <div class="sec-h">
        <h2>Today’s Best Deals in Metro Detroit</h2>
        <a class="view-all" href="${searchHref({ deal: ['Great Deal'] })}">See All Great Deals →</a>
      </div>
      <div class="grid g4">${cards(bestDeals)}</div>
    </div>
  </section>

  <section class="block" style="padding-top:4px">
    <div class="wrap">
      <div class="sec-h">
        <h2>Top Detroit-Area Dealers</h2>
        <a class="view-all" href="#/dealers">View All ${DB.dealers.length} Dealers →</a>
      </div>
      <div class="grid g4">
        ${nearby.map((d, i) => `
          <a class="dealer-showcase-card" href="#/dealer/${esc(d.dealer_id)}">
            <img class="d-photo" src="${DEALER_PHOTOS[i % DEALER_PHOTOS.length]}" alt="${esc(d.name)}" loading="lazy">
            <div class="d-body">
              <h3>${esc(d.name)}</h3>
              <div class="d-rate"><span class="stars">★</span> ${d.rating.toFixed(1)} <span class="muted" style="font-weight:500">(${num(d.review_count)} reviews)</span></div>
              <div class="d-loc">📍 ${esc(d.city)}, ${esc(d.state)} · ${DB.vehicles.filter(v => v.dealer_id === d.dealer_id).length} vehicles in stock</div>
            </div>
          </a>
        `).join('')}
      </div>
    </div>
  </section>`;
  return { html, nav: 'home', after: bindHero };
});

function bindHero() {
  const mk = $('#hMake'), md = $('#hModel');
  if (!mk) return;
  const state = () => {
    const f = emptyF();
    if (mk.value) f.make = [mk.value];
    if (md.value) f.model = [md.value];
    if ($('#hPrice') && $('#hPrice').value) f.priceMax = +$('#hPrice').value;
    if ($('#hYear') && $('#hYear').value) f.yearMin = +$('#hYear').value;
    if (ui.heroCond) f.cond = [ui.heroCond];
    return f;
  };
  const refresh = () => {
    const f = state();
    $('#hGo').href = '#/search?' + toQS(f);
    const n = applyF(f).length;
    const gt = $('#hGoText');
    if (gt) gt.textContent = 'Search Vehicles (' + n + ')';
  };
  mk.addEventListener('change', () => {
    const models = uniqSorted(DB.vehicles.filter(v => v.make === mk.value).map(v => v.model));
    md.innerHTML = '<option value="">Any Model</option>' + models.map(m => `<option>${esc(m)}</option>`).join('');
    md.disabled = !mk.value;
    refresh();
  });
  ['hModel', 'hPrice', 'hYear'].forEach(id => {
    const el = $('#' + id);
    if (el) el.addEventListener('change', refresh);
  });
  const aiInp = $('#heroAI');
  if (aiInp) aiInp.addEventListener('keydown', e => { if (e.key === 'Enter') AI.open(aiInp.value); });
  refresh();
}

/* ---------- SEARCH ---------- */
const CONDS = ['New', 'Certified', 'Used'], BODIES = ['SUV', 'Sedan', 'Truck', 'Coupe', 'Hatchback', 'Van'];
function optList(f, key, label, entries, openDefault, withSearchBox) {
  const sel = f[key], limit = 6, exp = ui.expanded[key];
  const filterQ = withSearchBox ? (ui.makeFilterText || '').toLowerCase() : '';
  const rows = entries.filter(([v, n]) => (n > 0 || sel.includes(v)) && (!filterQ || String(v).toLowerCase().includes(filterQ)));
  const shown = (exp || filterQ) ? rows : rows.filter(([v], i) => i < limit || sel.includes(v));
  return `<details ${openDefault || sel.length ? 'open' : ''}><summary>${label}</summary><div class="opts">
    ${withSearchBox ? `<input class="field" id="makeFilterInput" value="${esc(ui.makeFilterText || '')}" placeholder="Search makes..." style="padding:6px 10px;font-size:13px;margin-bottom:4px">` : ''}
    ${shown.map(([v, n]) =>
      `<label class="opt ${n === 0 ? 'zero' : ''}"><input type="checkbox" data-fk="${key}" data-fv="${esc(v)}" ${sel.includes(v) ? 'checked' : ''}> ${esc(v)}<span class="n">(${n})</span></label>`).join('') || '<span class="muted small">No matches</span>'}
    ${rows.length > limit && !filterQ ? `<button class="more" data-act="expand" data-key="${key}">${exp ? 'Show fewer' : '+ Show more (' + rows.length + ')'}</button>` : ''}</div></details>`;
}
function selectNum(key, label, f, values, fmt) {
  return `<select class="field" data-fnum="${key}" aria-label="${label}"><option value="0">${label}</option>${values.map(v => `<option value="${v}" ${f[key] === v ? 'selected' : ''}>${fmt(v)}</option>`).join('')}</select>`;
}
function chipsFor(f) {
  const c = [];
  LIST_KEYS.forEach(k => f[k].forEach(v => c.push([v, k, v])));
  if (f.yearMin || f.yearMax) c.push(['Year ' + (f.yearMin || 'any') + ' – ' + (f.yearMax || 'any'), 'year', '']);
  if (f.priceMin || f.priceMax) c.push(['Price ' + (f.priceMin ? money(f.priceMin) : '$0') + ' – ' + (f.priceMax ? money(f.priceMax) : 'any'), 'price', '']);
  if (f.milesMax) c.push(['Under ' + num(f.milesMax) + ' mi', 'milesMax', '']);
  if (f.mpgMin) c.push([f.mpgMin + '+ MPG', 'mpgMin', '']);
  if (f.dist) c.push(['Within ' + f.dist + ' mi', 'dist', '']);
  if (f.dealer && DB.dById[f.dealer]) c.push([DB.dById[f.dealer].name, 'dealer', '']);
  if (f.noacc) c.push(['No accidents', 'noacc', '']);
  if (f.one) c.push(['1 owner', 'one', '']);
  if (f.q) c.push(['“' + f.q + '”', 'q', '']);
  return c.map(([l, k, v]) => `<span class="chip on">${esc(l)} <button data-act="rm" data-k="${k}" data-v="${esc(v)}" aria-label="Remove ${esc(l)}">×</button></span>`).join('');
}

route(/^\/search$/, (m, p) => {
  const f = parseF(p), zip = f.zip || userZip();
  const all = sorted(applyF(f), f.sort);
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE)), page = Math.min(Math.max(1, f.page || 1), pages);
  const slice = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const base = Object.assign({}, f);
  const pageHref = n => '#/search?' + toQS(Object.assign({}, base, { page: n > 1 ? n : 0 }));
  const cnt = (key, getter) => facet(f, key, getter);
  const makeC = cnt('make', v => v.make), modelC = cnt('model', v => v.model), bodyC = cnt('body', v => v.body_style), fuelC = cnt('fuel', v => v.fuel_type);
  const transC = cnt('trans', v => v.transmission), driveC = cnt('drive', v => v.drivetrain), colorC = cnt('color', v => v.exterior_color), dealC = cnt('deal', v => v.deal);
  const condC = cnt('cond', v => v.condition), featC = cnt('feat', v => v.features);
  const byCount = m => Array.from(m.entries()).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(b[0]));
  const allOf = fn => uniqSorted(DB.vehicles.map(fn));
  const withAll = (values, m) => values.map(v => [v, m.get(v) || 0]);
  const makeEntries = byCount(new Map(allOf(v => v.make).map(x => [x, makeC.get(x) || 0])));
  const modelPool = f.make.length ? uniqSorted(DB.vehicles.filter(v => f.make.includes(v.make)).map(v => v.model)) : [];
  const modelEntries = byCount(new Map(modelPool.map(x => [x, modelC.get(x) || 0])));
  const featEntries = byCount(new Map(uniqSorted(DB.vehicles.flatMap(v => v.features)).map(x => [x, featC.get(x) || 0])));
  const years = uniqSorted(DB.vehicles.map(v => v.year), (a, b) => b - a);
  const swatches = uniqSorted(DB.vehicles.map(v => v.exterior_color)).map(c => [c, colorC.get(c) || 0]);
  const chips = chipsFor(f);
  const topDealers = DB.dealers.slice().sort((a, b) => dealerDist(a, zip) - dealerDist(b, zip)).slice(0, 3);

  const side = `<aside class="side" id="side">
    <div class="sh">
      <b style="display:flex;align-items:center;gap:6px"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> Filter Vehicles</b>
      <span><a href="#/search" class="small" style="font-weight:700">Clear All</a> <button class="btn ghost sm mfilter" data-act="filters" style="margin-left:8px">Close</button></span>
    </div>
    ${optList(f, 'make', 'Make', makeEntries, true, true)}
    ${f.make.length ? optList(f, 'model', 'Model', modelEntries, true, false) : '<details><summary>Model</summary><div class="opts"><span class="muted small">Select a make first</span></div></details>'}
    <details open><summary>Year</summary><div class="opts"><div class="two">${selectNum('yearMin', 'Min Year', f, years, x => x)}${selectNum('yearMax', 'Max Year', f, years, x => x)}</div></div></details>
    <details open><summary>Price</summary><div class="opts">
      <input type="range" class="range" min="10000" max="80000" step="5000" value="${f.priceMax || 80000}" data-fnum="priceMax" style="accent-color:var(--blue)">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:4px"><span>$0</span><span>${f.priceMax ? 'Up to ' + money(f.priceMax) : '$100,000+'}</span></div>
      <div class="two">${selectNum('priceMin', 'Min', f, [5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000], money)}${selectNum('priceMax', 'Max', f, [15000, 20000, 25000, 30000, 40000, 50000, 75000], money)}</div>
    </div></details>
    ${optList(f, 'body', 'Body Style', withAll(BODIES, bodyC), true, false)}
    <details ${f.milesMax ? 'open' : ''}><summary>Mileage</summary><div class="opts">${selectNum('milesMax', 'Any Mileage', f, [10000, 25000, 50000, 75000, 100000, 150000], x => 'Under ' + num(x) + ' mi')}</div></details>
    ${optList(f, 'fuel', 'Fuel Type', byCount(new Map(allOf(v => v.fuel_type).map(x => [x, fuelC.get(x) || 0]))), false, false)}
    ${optList(f, 'cond', 'Condition', withAll(CONDS, condC), false, false)}
    ${optList(f, 'deal', 'Deal Rating', withAll(['Great Deal', 'Good Deal', 'Fair Deal', 'High Price'], dealC), false, false)}
    ${optList(f, 'drive', 'Drivetrain', byCount(new Map(allOf(v => v.drivetrain).map(x => [x, driveC.get(x) || 0]))), false, false)}
    <details ${f.color.length ? 'open' : ''}><summary>Exterior Color</summary><div class="opts"><div class="swatches">${swatches.map(([c, n]) => `<span class="sw ${f.color.includes(c) ? 'on' : ''} ${n === 0 && !f.color.includes(c) ? 'zero' : ''}" data-act="color" data-v="${c}" title="${c} (${n})" role="button" tabindex="0" aria-label="${c}" style="background:${COLOR_HEX[c] || '#999'}"></span>`).join('')}</div></div></details>
    ${optList(f, 'feat', 'Features', featEntries, false, false)}
    <details ${f.noacc || f.one ? 'open' : ''}><summary>Vehicle History</summary><div class="opts">
      <label class="opt"><input type="checkbox" data-fbool="noacc" ${f.noacc ? 'checked' : ''}> No accidents reported</label>
      <label class="opt"><input type="checkbox" data-fbool="one" ${f.one ? 'checked' : ''}> One owner or fewer</label></div></details>
    <details ${f.dealer ? 'open' : ''}><summary>Detroit Dealer</summary><div class="opts"><select class="field" data-fdealer aria-label="Dealer"><option value="">All Metro Detroit Dealers</option>${DB.dealers.map(d => `<option value="${esc(d.dealer_id)}" ${f.dealer === d.dealer_id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div></details>
  </aside>`;

  const rightSide = `<aside class="srp-right">
    <div class="panel" style="padding:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <b style="font-size:15px;color:var(--navy)">Featured Detroit Dealers</b>
        <a href="#/dealers" class="small" style="font-weight:700">View All</a>
      </div>
      ${topDealers.map((d, i) => `
        <a class="r-dealer-item" href="#/dealer/${esc(d.dealer_id)}">
          <img src="${DEALER_PHOTOS[i % DEALER_PHOTOS.length]}" alt="${esc(d.name)}" loading="lazy">
          <div>
            <b>${esc(d.name)}</b>
            <div class="r-sub"><span class="stars">★</span> <b>${d.rating.toFixed(1)}</b> (${num(d.review_count)} reviews)</div>
            <div class="r-sub">${esc(d.city)}, ${esc(d.state)} · ${dealerDist(d, zip).toFixed(1)} mi</div>
          </div>
          <span class="r-arr">›</span>
        </a>
      `).join('')}
    </div>
    <div class="r-promo-box">
      <h3>Get Pre-Qualified</h3>
      <p>See real monthly payments &amp; personalized APR rates in minutes.</p>
      <a class="btn sm" href="#/finance" style="border-radius:999px;padding:7px 16px">Check My Rate →</a>
    </div>
    <div class="r-promo-box" style="background:linear-gradient(135deg,#f8fafd 0%,#eef3fb 100%);border-color:#d8e2f0">
      <h3>Vehicle Research</h3>
      <p>Reviews, model specs, reliability, and market pricing across 63 models.</p>
      <a href="#/research" style="font-weight:700;font-size:13.5px">Start Research →</a>
    </div>
  </aside>`;

  const html = `
  <section class="hero hero-search" style="padding:26px 0 24px">
    <div class="hero-bg-art" aria-hidden="true"></div>
    <div class="wrap">
      <div class="hero-inner">
        <h1 style="font-size:clamp(1.9rem,3vw,2.65rem)">Find Your Next Vehicle<br>in <span class="hl-detroit">Detroit</span></h1>
        <p class="lead" style="margin:6px 0 12px;font-size:15px">New and used cars, trucks, and SUVs from trusted Detroit-area dealers.</p>
        <div class="hero-ai-row" style="margin-top:0">
          <div class="hero-ai-box">
            <span class="ai-tag"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.6 9.4L22 12L14.6 14.6L12 22L9.4 14.6L2 12L9.4 9.4L12 2Z"/></svg> Ask Wheelspan AI</span>
            <input id="searchHeroAI" value="${esc(f.q || '')}" placeholder='e.g., "A reliable AWD SUV under $30,000"' aria-label="Ask Wheelspan AI">
            <button class="ai-mic-btn" data-act="mic" data-target="searchHeroAI" title="Voice Search" aria-label="Voice Search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>
            </button>
            <button class="ai-go-btn" data-act="search-hero-ai">🔍 Search</button>
          </div>
          <div class="hero-pop-pills">
            <span>Popular searches:</span>
            ${[
              ['SUVs under $30k', { body: ['SUV'], priceMax: 30000 }],
              ['Trucks in Detroit', { body: ['Truck'] }],
              ['Hybrid vehicles', { fuel: ['Hybrid'] }],
              ['Certified pre-owned', { cond: ['Certified'] }],
              ['Electric vehicles', { fuel: ['Electric'] }]
            ].map(([label, filterObj]) => `<a class="pop-pill" href="${searchHref(filterObj)}">${esc(label)}</a>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </section>

  ${featureStripHTML()}

  <div class="wrap">
    <div class="srp">
      ${side}
      <main>
        <div class="resh">
          <div>
            <h1>${num(all.length)} Vehicle${all.length === 1 ? '' : 's'} Found</h1>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn ghost sm mfilter" data-act="filters">☰ Filters</button>
            <label class="small muted" for="sortSel">Sort by:</label>
            <select class="field" id="sortSel" data-fsort style="width:auto;font-weight:600">${Object.entries(SORTS).map(([k, [l]]) => `<option value="${k}" ${f.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
          </div>
        </div>
        <div class="chips" style="margin-bottom:14px">
          <span class="chip on">Detroit Area</span>
          ${!chips ? '<span class="chip">All Vehicles</span>' : chips + ' <a class="chip" href="#/search">Clear All</a>'}
        </div>
        ${slice.length ? `<div class="grid g3">${cards(slice)}</div>` : `<div class="empty"><h2>No vehicles match those filters</h2><p class="muted">Try removing a filter, widening your price range, or asking Wheelspan AI.</p><p><a class="btn" href="#/search">Clear all filters</a> <button class="btn ai" data-act="ai-open">Ask Wheelspan AI</button></p></div>`}
        ${pages > 1 ? `<nav class="pager" aria-label="Pagination">${page > 1 ? `<a href="${pageHref(page - 1)}">‹ Prev</a>` : '<span class="dis">‹ Prev</span>'}${Array.from({ length: pages }, (_, i) => i + 1).map(n => n === page ? `<span class="cur">${n}</span>` : `<a href="${pageHref(n)}">${n}</a>`).join('')}${page < pages ? `<a href="${pageHref(page + 1)}">Next ›</a>` : '<span class="dis">Next ›</span>'}</nav>` : ''}
      </main>
      ${rightSide}
    </div>
  </div>`;
  return {
    html,
    nav: 'search',
    title: all.length + ' Vehicles in Detroit',
    top: p.has('page'),
    after: () => {
      const mfi = $('#makeFilterInput');
      if (mfi) {
        mfi.addEventListener('input', e => {
          ui.makeFilterText = e.target.value;
          const pos = e.target.selectionStart;
          render(true);
          const mfi2 = $('#makeFilterInput');
          if (mfi2) { mfi2.focus(); mfi2.setSelectionRange(pos, pos); }
        });
      }
      const shAI = $('#searchHeroAI');
      if (shAI) shAI.addEventListener('keydown', e => { if (e.key === 'Enter') AI.open(shAI.value); });
    }
  };
});

/* ---------- VEHICLE DETAIL (AUTOTRADER KIOSK GALLERY) ---------- */

const MOTORROW_PLATE_CACHE = new Map();

function processImaginWithMotorRowPlate(url, fallbackUrl) {
  if (!url || !url.startsWith('https://cdn.imagin.studio/')) return Promise.resolve(url);
  if (MOTORROW_PLATE_CACHE.has(url)) return MOTORROW_PLATE_CACHE.get(url);

  const p = new Promise(resolve => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.referrerPolicy = 'no-referrer';
    im.onload = () => {
      try {
        const w = im.naturalWidth || im.width;
        const h = im.naturalHeight || im.height;
        const off = document.createElement('canvas');
        off.width = w;
        off.height = h;
        const octx = off.getContext('2d', { willReadFrequently: true });
        octx.drawImage(im, 0, 0);
        const imgData = octx.getImageData(0, 0, w, h);
        const d = imgData.data;

        // 1. Find non-transparent car bounding box and detect white license plate in lower 72%
        let minX = w, minY = h, maxX = 0, maxY = 0;
        const isWhite = new Uint8Array(w * h);
        const isDark = new Uint8Array(w * h);
        for (let y = 0; y < h; y++) {
          const row = y * w;
          for (let x = 0; x < w; x++) {
            const idx = (row + x) * 4;
            const a = d[idx + 3];
            if (a > 25) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
            if (a > 210) {
              const r = d[idx], g = d[idx + 1], b = d[idx + 2];
              const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
              const lum = (r + g + b) / 3;
              if (mx - mn < 26 && lum > 168) isWhite[row + x] = 1;
              else if (lum < 115) isDark[row + x] = 1;
            }
          }
        }

        // Horizontal closing (bridge up to 16px across dark "* carwow" letters inside white plate)
        const closed = new Uint8Array(w * h);
        const yStart = Math.floor(minY + (maxY - minY) * 0.28);
        for (let y = yStart; y <= maxY; y++) {
          const row = y * w;
          let lastW = -999;
          for (let x = minX; x <= maxX; x++) {
            if (isWhite[row + x]) {
              if (x - lastW <= 16 && x - lastW > 1) {
                for (let k = lastW + 1; k < x; k++) closed[row + k] = 1;
              }
              closed[row + x] = 1;
              lastW = x;
            }
          }
        }

        // Connected components (BFS) on closed in [yStart..maxY]
        const visited = new Uint8Array(w * h);
        const carW = Math.max(1, maxX - minX + 1);
        let bestComp = null;
        let bestScore = -1;
        const q = new Int32Array(w * h);

        for (let y = yStart; y <= maxY; y++) {
          const row = y * w;
          for (let x = minX; x <= maxX; x++) {
            const startPos = row + x;
            if (!closed[startPos] || visited[startPos]) continue;
            let head = 0, tail = 0;
            q[tail++] = startPos;
            visited[startPos] = 1;
            let bx0 = x, bx1 = x, by0 = y, by1 = y;
            let darkCnt = 0, whiteCnt = 0;
            let sumX = 0, sumY = 0;

            while (head < tail) {
              const cur = q[head++];
              const cy = Math.floor(cur / w);
              const cx = cur - cy * w;
              if (cx < bx0) bx0 = cx;
              if (cx > bx1) bx1 = cx;
              if (cy < by0) by0 = cy;
              if (cy > by1) by1 = cy;
              sumX += cx;
              sumY += cy;
              if (isDark[cur]) darkCnt++;
              if (isWhite[cur]) whiteCnt++;

              const nbs = [cur - 1, cur + 1, cur - w, cur + w];
              for (let ni = 0; ni < 4; ni++) {
                const nb = nbs[ni];
                if (nb >= 0 && nb < w * h && closed[nb] && !visited[nb]) {
                  visited[nb] = 1;
                  q[tail++] = nb;
                }
              }
            }

            const area = tail;
            const bw = bx1 - bx0 + 1;
            const bh = by1 - by0 + 1;
            const aspect = bw / Math.max(1, bh);
            const rectFill = area / (bw * bh);
            const darkRatio = darkCnt / Math.max(1, area);
            const compCy = sumY / area;

            // License plate width never exceeds 36% of car width (rejects wide front grilles)
            // Prefer the lowest vertical component (bumper level)
            if (area >= 320 && area <= 18000 && bw >= 34 && bw <= carW * 0.36 && bh >= 10 &&
                aspect >= 1.8 && aspect <= 6.8 && rectFill >= 0.42 &&
                darkRatio >= 0.05 && darkRatio <= 0.62 && compCy > bestScore) {
              bestScore = compCy;
              bestComp = { pixels: q.slice(0, tail), cx: sumX / area, cy: compCy, bx0, bx1, by0, by1 };
            }
          }
        }

        if (bestComp) {
          const pts = bestComp.pixels;
          const cx = bestComp.cx, cy = bestComp.cy;
          let cxx = 0, cyy = 0, cxy = 0;
          for (let i = 0; i < pts.length; i++) {
            const pIdx = pts[i];
            const py = Math.floor(pIdx / w);
            const px = pIdx - py * w;
            const dx = px - cx, dy = py - cy;
            cxx += dx * dx;
            cyy += dy * dy;
            cxy += dx * dy;
            // Erase "* carwow" inside the plate to clean plate white
            const di = pIdx * 4;
            d[di] = 238;
            d[di + 1] = 240;
            d[di + 2] = 244;
          }
          octx.putImageData(imgData, 0, 0);

          let theta = 0.5 * Math.atan2(2 * cxy, cxx - cyy);
          if (theta > Math.PI / 2) theta -= Math.PI;
          if (theta < -Math.PI / 2) theta += Math.PI;

          const cosT = Math.cos(theta), sinT = Math.sin(theta);
          let uMin = 1e9, uMax = -1e9, vMin = 1e9, vMax = -1e9;
          for (let i = 0; i < pts.length; i += 3) {
            const pIdx = pts[i];
            const py = Math.floor(pIdx / w);
            const px = pIdx - py * w;
            const dx = px - cx, dy = py - cy;
            const u = dx * cosT + dy * sinT;
            const v = -dx * sinT + dy * cosT;
            if (u < uMin) uMin = u;
            if (u > uMax) uMax = u;
            if (v < vMin) vMin = v;
            if (v > vMax) vMax = v;
          }
          const plateW = Math.max(36, uMax - uMin);
          const plateH = Math.max(12, vMax - vMin);

          // Draw "MotorRow" centered and rotated along the plate's PCA axis
          octx.save();
          octx.translate(cx, cy);
          octx.rotate(theta);
          const fontSize = Math.max(10, Math.round(plateH * 0.54));
          octx.font = `800 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
          octx.fillStyle = '#0e1a30';
          octx.textAlign = 'center';
          octx.textBaseline = 'middle';
          octx.fillText('MotorRow', 0, 1);
          octx.restore();
        }

        // Composite onto 1200x800 studio backdrop matching WS-1058
        const cw = 1200, ch = 800;
        const st = document.createElement('canvas');
        st.width = cw;
        st.height = ch;
        const sctx = st.getContext('2d');
        const horizon = Math.round(ch * 0.68);
        const skyGrad = sctx.createLinearGradient(0, 0, 0, horizon);
        skyGrad.addColorStop(0, '#eef3f9');
        skyGrad.addColorStop(1, '#d8e2ee');
        sctx.fillStyle = skyGrad;
        sctx.fillRect(0, 0, cw, horizon);
        const floorGrad = sctx.createLinearGradient(0, horizon, 0, ch);
        floorGrad.addColorStop(0, '#ced6e0');
        floorGrad.addColorStop(1, '#f0f4f8');
        sctx.fillStyle = floorGrad;
        sctx.fillRect(0, horizon, cw, ch - horizon);

        const cropW = Math.max(1, maxX - minX + 1);
        const cropH = Math.max(1, maxY - minY + 1);
        const scale = Math.min((cw * 0.86) / cropW, (ch * 0.74) / cropH);
        const nw = Math.round(cropW * scale);
        const nh = Math.round(cropH * scale);
        const dx = Math.round((cw - nw) / 2);
        const dy = Math.round(ch * 0.53 - nh / 2);

        // Soft contact shadow under tyres
        sctx.save();
        sctx.fillStyle = 'rgba(12, 22, 38, 0.28)';
        sctx.filter = 'blur(14px)';
        sctx.beginPath();
        sctx.ellipse(cw / 2, dy + nh - 4, nw * 0.44, 18, 0, 0, Math.PI * 2);
        sctx.fill();
        sctx.restore();

        sctx.drawImage(off, minX, minY, cropW, cropH, dx, dy, nw, nh);
        resolve(st.toDataURL('image/webp', 0.90));
      } catch (err) {
        resolve(url);
      }
    };
    im.onerror = () => resolve(fallbackUrl || url);
    im.src = url;
  });

  MOTORROW_PLATE_CACHE.set(url, p);
  return p;
}

const VDP_PAINT_MAP = {
  White: ['imagin-white', 'white'],
  Black: ['imagin-black', 'black'],
  Silver: ['imagin-silver', 'silver'],
  Gray: ['pspc0023', 'grey'],
  Blue: ['imagin-blue', 'blue'],
  Red: ['imagin-red', 'red'],
  Green: ['imagin-green', 'green'],
  Orange: ['imagin-orange', 'orange'],
  Brown: ['imagin-brown', 'brown'],
  Yellow: ['imagin-yellow', 'yellow']
};

function imaginAngleUrl(v, angle) {
  const make = (v.make || '').toLowerCase();
  let model = (v.model || '').toLowerCase();
  const [pid, pdesc] = VDP_PAINT_MAP[v.exterior_color] || ['imagin-silver', 'silver'];
  const params = new URLSearchParams({
    customer: 'carwow',
    make: make,
    modelFamily: model,
    modelYear: String(v.year || 2023),
    angle: String(angle),
    paintId: pid,
    paintDescription: pdesc,
    width: '1200',
    zoomType: 'fullscreen'
  });
  if (model === 'q5') params.set('modelVariant', 'suv');
  else if (['3 series', 'civic', 'corolla', 'c-class', 'a4', 'malibu', 'accord', 'camry', 'elantra', 'sonata', 'k5', 'es', 'altima', 'wrx', 'jetta', 'charger', 'model 3', 'model s'].includes(model)) {
    params.set('modelVariant', 'saloon');
  } else if (model === 'golf gti') {
    params.set('modelFamily', 'golf');
    params.set('modelVariant', 'hatchback');
    params.set('trim', 'gti');
  } else if (model === 'mazda3') {
    params.set('modelVariant', 'hatchback');
  } else if (v.body_style === 'Truck') {
    params.set('bodySize', '4');
  }
  return 'https://cdn.imagin.studio/getImage?' + params.toString();
}

function buildVehicleGallery(v) {
  const is1058 = v.id === 'WS-1058';
  const extDefs = [
    ['01', 'ext-01.webp', 'Passenger Front 3/4 Hero View'],
    ['28', 'ext-02.webp', 'Driver Front 3/4 View'],
    ['22', 'ext-03.webp', 'Driver Side Profile'],
    ['05', 'ext-04.webp', 'Passenger Side Profile'],
    ['09', 'ext-05.webp', 'Passenger Rear 3/4 View'],
    ['17', 'ext-06.webp', 'Elevated Rear-Left 3/4 & Sunroof'],
    ['29', 'ext-07.webp', 'Front Grille & LED Headlamps'],
    ['13', 'ext-08.webp', 'Rear Liftgate & Exhaust'],
    ['23', 'ext-09.webp', 'Low Front-Left Stance'],
    ['21', 'ext-10.webp', 'Elevated Side Roofline Profile'],
    ['27', 'ext-11.webp', 'Overhead Sunroof & Hood View']
  ];
  const exterior = extDefs.map(([ang, fn, label], idx) => ({
    src: is1058 ? `images/gallery/WS-1058/${fn}` : (ang === '22' ? v.image : imaginAngleUrl(v, ang)),
    fallback: v.image,
    isSvg: !is1058 && ang === '22',
    cat: 'exterior',
    catLabel: 'Exterior',
    angle: ang,
    title: `${v.year} ${v.make} ${v.model} — ${label}`,
    shortTitle: label
  }));

  const baseDir = is1058 ? 'images/gallery/WS-1058' : 'images/gallery/common';
  const interiorDefs = [
    ['int-01-cabin.webp', 'Full Front Cabin & Dashboard Panorama'],
    ['int-02-front-seats.webp', `Heated Front Bucket Seats (${v.interior_color} Interior)`],
    ['int-03-infotainment.webp', 'Touchscreen Infotainment (Apple CarPlay & Android Auto)'],
    ['int-04-climate.webp', 'Dual-Zone Automatic Climate Control System'],
    ['int-05-shifter.webp', `${v.transmission} Console Shifter & Drive Mode Select`],
    ['int-06-console.webp', 'Configurable Center Console & Storage Compartment'],
    ['int-07-rear-seats.webp', 'Spacious 60/40 Split Folding Rear Passenger Seating'],
    ['int-08-rear-armrest.webp', 'Rear Center Armrest & Integrated Cupholders'],
    ['int-09-rear-vents.webp', 'Rear Passenger Air Vents & Dual USB Charging Ports'],
    ['int-10-cargo-view.webp', 'Full Cabin & Roofline View from Rear Cargo Bay']
  ];
  const interior = interiorDefs.map(([fn, label]) => ({
    src: `${baseDir}/${fn}`,
    fallback: v.image,
    cat: 'interior',
    catLabel: 'Interior',
    title: `${v.year} ${v.make} ${v.model} — ${label}`,
    shortTitle: label
  }));

  const detailDefs = [
    ['det-01-cargo.webp', 'Rear Cargo Bay & Retractable Tonneau Cover'],
    ['det-02-wheel.webp', '18-Inch Machine-Finished Alloy Wheel & All-Season Tire'],
    ['det-03-engine.webp', `${v.engine} Powertrain & Engine Compartment`]
  ];
  const details = detailDefs.map(([fn, label]) => ({
    src: `${baseDir}/${fn}`,
    fallback: v.image,
    cat: 'details',
    catLabel: 'Mechanical & Details',
    title: `${v.year} ${v.make} ${v.model} — ${label}`,
    shortTitle: label
  }));

  const photos = [...exterior, ...interior, ...details].map((item, i) => Object.assign({}, item, { index: i }));

  // Order exterior frames in continuous 360-degree walkaround sequence
  const spinOrder = ['29', '28', '23', '22', '21', '17', '13', '09', '05', '01', '27'];
  const spinFrames = spinOrder.map(a => exterior.find(x => x.angle === a)).filter(Boolean);

  return { photos, exterior, interior, details, spinFrames };
}

route(/^\/vehicle\/(.+)$/, m => {
  const v = DB.vById[decodeURIComponent(m[1])];
  if (!v) return { html: '<div class="wrap"><div class="empty" style="margin-top:30px"><h2>That vehicle is no longer listed</h2><p><a class="btn" href="#/search">Browse all cars</a></p></div></div>' };
  const zip = userZip(), d = v.dealer, dist = d ? Math.round(dealerDist(d, zip)) : null;
  const pos = Math.max(2, Math.min(98, ((v.ratio - 0.85) / 0.30) * 100));
  const monthly = pmt(v.price * 0.9, 7.0, 60);
  const similar = sorted(DB.vehicles.filter(x => x.id !== v.id && (x.body_style === v.body_style) && Math.abs(x.price - v.price) < Math.max(5000, v.price * 0.3)), 'deal').sort((a, b) => Math.abs(a.price - v.price) - Math.abs(b.price - v.price)).slice(0, 4);
  const spec = (k, val) => `<div><span>${k}</span><b>${esc(val)}</b></div>`;
  const gal = buildVehicleGallery(v);
  const totalPhotos = gal.photos.length;
  // Curated 4 bento preview indices: Rear 3/4 (4), Cabin Panorama (11), Infotainment (13), Cargo/Engine (21)
  const bentoIndices = [4, 11, 13, 21];

  const html = `<div class="wrap">
    <div class="crumbs" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <div><a href="#/search">‹ Back to Results</a> &nbsp;|&nbsp; <a href="#/">Home</a> › <a href="#/search">Inventory</a> › <a href="${searchHref({ make: [v.make] })}">${esc(v.make)}</a> › <a href="${searchHref({ make: [v.make], model: [v.model] })}">${esc(v.model)}</a> › <b>${esc(v.title)} ${esc(v.trim)}</b></div>
      <div style="display:flex;gap:8px">
        <button class="btn ghost sm" data-act="save" data-id="${esc(v.id)}" data-text="1">${SAVED.has(v.id) ? '♥ Saved' : '♡ Save Vehicle'}</button>
        <button class="btn ghost sm" data-act="cmp-add" data-id="${esc(v.id)}">⇄ Compare</button>
        <button class="btn ghost sm" data-act="copylink">🔗 Share</button>
      </div>
    </div>

    <!-- Autotrader-Style Top Vehicle Title & Price Header -->
    <div class="vdp-header-card">
      <div class="vdp-title-block">
        <div class="vdp-badges">
          <span class="vdp-cond-pill">${esc(v.condition)}</span>
          ${dealTag(v)}
          <span class="chip" style="padding:3px 9px;font-size:11.5px">Stock #${esc(v.id)}</span>
          <span class="chip" style="padding:3px 9px;font-size:11.5px">VIN: ${esc(v.vin)}</span>
        </div>
        <h1>${esc(v.year)} ${esc(v.make)} ${esc(v.model)} ${esc(v.trim)}</h1>
        <div class="vdp-submeta">
          <span><b>${num(v.mileage)} miles</b></span> ·
          <span>${esc(v.exterior_color)} Exterior / ${esc(v.interior_color)} Interior</span> ·
          <span>${esc(v.drivetrain)} · ${esc(v.engine)}</span>
          ${d ? `· <span>📍 <a href="#/dealer/${esc(d.dealer_id)}" style="font-weight:700">${esc(d.name)}</a> (${esc(d.city)}, ${esc(d.state)} · ${dist} mi)</span>` : ''}
        </div>
      </div>
      <div class="vdp-price-Cluster">
        <div class="vdp-price-main">
          <div class="big-p">${money(v.price)}</div>
          <div class="est-p">Est. <b>${money(monthly)}/mo</b> · <a href="#/finance?price=${v.price}&vid=${esc(v.id)}">Payment Calculator</a></div>
        </div>
        <a class="btn lg" href="#/finance?price=${v.price}&vid=${esc(v.id)}">Get Pre-Qualified</a>
      </div>
    </div>

    <div class="vdp">
      <div class="stack">
        <!-- AUTOTRADER KIOSK PHOTO & 360 GALLERY -->
        <section class="at-kiosk" id="atKiosk" aria-label="Vehicle Media Gallery">
          <div class="at-kiosk-bar">
            <div class="at-kiosk-tabs">
              <button type="button" class="at-tab on" data-kcat="all">📷 All Photos (${totalPhotos})</button>
              <button type="button" class="at-tab" data-kcat="exterior">🚗 Exterior (${gal.exterior.length})</button>
              <button type="button" class="at-tab" data-kcat="interior">🛋 Interior (${gal.interior.length})</button>
              <button type="button" class="at-tab" data-kcat="details">⚙ Mechanical &amp; Details (${gal.details.length})</button>
              <button type="button" class="at-tab spin-tab" data-kmode="spin">🔄 360° Walkaround Spin</button>
            </div>
            <button type="button" class="at-view-all-btn" data-kopen="grid">⊞ View All ${totalPhotos} Photos</button>
          </div>

          <div class="at-kiosk-stage">
            <!-- Left Main Stage -->
            <div class="at-main-stage" id="atMainStage">
              <div id="atPhotoView" style="width:100%;height:100%;position:relative">
                <div class="at-stage-top">
                  <span class="at-stage-badge" id="atStageBadge">${esc(gal.photos[0].catLabel)} · ${esc(gal.photos[0].shortTitle)}</span>
                  <div class="at-stage-counter">
                    <span id="atStageCount">1 / ${totalPhotos}</span>
                    <button type="button" class="at-expand-btn" data-kopen="slide" title="Open Fullscreen Lightbox">⛶ Fullscreen</button>
                  </div>
                </div>
                <button type="button" class="at-nav-arr prev" id="atPrevBtn" aria-label="Previous photo">‹</button>
                <img class="at-stage-img" id="atMainImg" src="${esc(gal.photos[0].src)}" alt="${esc(gal.photos[0].title)}" referrerpolicy="no-referrer" data-kopen="slide">
                <button type="button" class="at-nav-arr next" id="atNextBtn" aria-label="Next photo">›</button>
                <div class="at-stage-bottom">
                  <div class="at-quick-pills">
                    <button type="button" class="at-qpill" data-kmode="spin">🔄 Interactive 360° Spin</button>
                    <button type="button" class="at-qpill" data-kjump="11">🛋 Inside Cabin</button>
                    <button type="button" class="at-qpill" data-kjump="13">📱 Infotainment</button>
                    <button type="button" class="at-qpill" data-kjump="23">⚙ Engine Bay</button>
                  </div>
                  <button type="button" class="at-qpill" data-kopen="grid">⊞ Grid View (${totalPhotos})</button>
                </div>
              </div>

              <!-- Interactive 360 Walkaround Spin View (hidden until toggled) -->
              <div id="atSpinView" class="at-spin-stage" style="display:none">
                <div class="at-stage-top">
                  <span class="at-stage-badge" id="atSpinBadge">🔄 360° Walkaround · Drag Left or Right to Rotate</span>
                  <div class="at-stage-counter">
                    <span id="atSpinCount">Angle 1 / ${gal.spinFrames.length}</span>
                    <button type="button" class="at-expand-btn" data-kcat="all">✕ Exit 360°</button>
                  </div>
                </div>
                <img class="at-stage-img" id="atSpinImg" src="${esc(gal.spinFrames[0].src)}" alt="360 Walkaround View" referrerpolicy="no-referrer" draggable="false" style="cursor:grab">
                <div class="at-spin-controls">
                  <button type="button" class="at-spin-btn" id="atAutoSpinBtn">▶ Auto-Spin</button>
                  <input type="range" class="at-spin-slider" id="atSpinSlider" min="0" max="${gal.spinFrames.length - 1}" value="0" aria-label="360 rotation angle">
                  <span class="at-spin-hint">↔ Drag vehicle or slider to inspect all ${gal.spinFrames.length} studio angles</span>
                </div>
              </div>
            </div>

            <!-- Right 2x2 Bento Preview Grid -->
            <div class="at-side-grid">
              ${bentoIndices.map((pIdx, slot) => {
                const p = gal.photos[pIdx] || gal.photos[0];
                const isLast = slot === 3;
                return `<div class="at-bento-tile" data-bento="${p.index}" ${isLast ? 'data-kopen="grid"' : ''}>
                  <img src="${esc(p.src)}" alt="${esc(p.title)}" referrerpolicy="no-referrer" loading="lazy">
                  ${isLast ? `<div class="at-bento-more"><span>⊞ View All ${totalPhotos} Photos</span><span class="sub">Exterior · Interior · 360°</span></div>` : `<span class="bento-cap">${esc(p.catLabel)}: ${esc(p.shortTitle)}</span>`}
                </div>`;
              }).join('')}
            </div>
          </div>

          <!-- Horizontal Filmstrip Thumbnail Scrubber -->
          <div class="at-thumb-wrap">
            <button type="button" class="at-strip-arr" id="atStripLeft" aria-label="Scroll thumbnails left">‹</button>
            <div class="at-thumb-strip" id="atThumbStrip">
              ${gal.photos.map((p, idx) => `
                <button type="button" class="at-thumb ${idx === 0 ? 'on' : ''}" data-kthumb="${idx}" data-cat="${p.cat}" title="${esc(p.title)}">
                  <img src="${esc(p.src)}" alt="${esc(p.shortTitle)}" referrerpolicy="no-referrer" loading="lazy">
                  <span class="t-num">${idx + 1}</span>
                  <span class="t-cat">${esc(p.shortTitle)}</span>
                </button>
              `).join('')}
            </div>
            <button type="button" class="at-strip-arr" id="atStripRight" aria-label="Scroll thumbnails right">›</button>
          </div>
        </section>

        <div class="vdp-kpis">
          <div><span>Body Style</span><b>${esc(v.body_style)}</b></div>
          <div><span>Mileage</span><b>${num(v.mileage)} mi</b></div>
          <div><span>MPG (City/Hwy)</span><b>${v.mpg_city} / ${v.mpg_hwy}</b></div>
          <div><span>Drivetrain</span><b>${esc(v.drivetrain)}</b></div>
          <div><span>Transmission</span><b>${esc(v.transmission)}</b></div>
          <div><span>Fuel Type</span><b>${esc(v.fuel_type)}</b></div>
        </div>
        <div class="panel"><h2 style="font-size:19px;margin-bottom:14px">Vehicle Specifications</h2><div class="specs">
          ${spec('Year', v.year)}${spec('Make', v.make)}${spec('Model', v.model)}${spec('Trim', v.trim)}${spec('Body Style', v.body_style)}${spec('Condition', v.condition)}
          ${spec('Mileage', num(v.mileage) + ' mi')}${spec('Fuel Type', v.fuel_type)}${spec(v.fuel_type === 'Electric' ? 'Efficiency' : 'MPG City / Hwy', v.mpg_city + ' / ' + v.mpg_hwy + (v.fuel_type === 'Electric' ? ' MPGe' : ''))}
          ${spec('Engine', v.engine)}${spec('Transmission', v.transmission)}${spec('Drivetrain', v.drivetrain)}
          ${spec('Exterior Color', v.exterior_color)}${spec('Interior Color', v.interior_color)}${spec('VIN', v.vin)}</div></div>
        <div class="panel"><h2 style="font-size:19px;margin-bottom:12px">Highlighted Features</h2><ul class="featlist">${v.features.map(x => `<li><a href="${searchHref({ feat: [x] })}" style="color:inherit">${esc(x)}</a></li>`).join('')}</ul></div>
        <div class="panel"><h2 style="font-size:19px;margin-bottom:8px">Dealer Notes</h2><p style="margin:0">${esc(v.description)}</p></div>
        <div class="panel"><h2 style="font-size:19px;margin-bottom:12px">Vehicle History &amp; Title</h2><div class="specs">${spec('Accidents', v.accidents === 0 ? 'None reported' : v.accidents + ' reported')}${spec('Previous Owners', v.condition === 'New' ? 'New (0)' : v.owners)}${spec('Title Status', v.title_status || 'Clean')}</div></div>
      </div>

      <aside class="stack" style="position:sticky;top:78px">
        <div class="panel">
          <div class="muted small">Stock #${esc(v.id)} &nbsp;|&nbsp; VIN: ${esc(v.vin)}</div>
          <h2 style="font-size:22px;margin:4px 0 8px">${esc(v.title)} <span class="muted" style="font-weight:600">${esc(v.trim)}</span></h2>
          <div class="pricerow"><span class="price" style="font-size:34px">${money(v.price)}</span>${dealTag(v)}</div>
          <div class="small" style="margin-top:4px"><b>${esc(dealNote(v))}</b> · Est. market value ${money(v.market_value)}</div>
          <div class="gauge"><div class="mark"><b style="left:${pos}%"></b></div><div class="bar"><i style="flex:8;background:var(--green)"></i><i style="flex:5;background:var(--lgreen)"></i><i style="flex:6;background:var(--amber)"></i><i style="flex:11;background:var(--red)"></i></div><div class="lbl"><span>Great Price</span><span>Good</span><span>Fair</span><span>High</span></div></div>
          <div class="small muted" style="margin-top:10px">Est. finance payment <b style="color:var(--navy)">${money(monthly)}/mo</b> (60 mo, 7% APR, 10% down) · <a href="#/finance?price=${v.price}&vid=${esc(v.id)}">Customize</a></div>
          <div style="margin-top:14px">
            <a class="btn lg" href="#/finance?price=${v.price}&vid=${esc(v.id)}" style="width:100%">Get Pre-Qualified</a>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:10px">
            <button class="btn ghost sm" data-act="save" data-id="${esc(v.id)}" data-text="1">${SAVED.has(v.id) ? '♥ Saved' : '♡ Save'}</button>
            <button class="btn ghost sm" data-act="cmp-add" data-id="${esc(v.id)}">⇄ Compare</button>
            <button class="btn ghost sm" data-act="copylink">🔗 Share</button>
          </div>
        </div>
        ${d ? `<div class="panel">
          <div class="dealer-mini">
            <img src="${dealerPhoto(d)}" alt="${esc(d.name)}">
            <div>
              <b><a href="#/dealer/${esc(d.dealer_id)}" style="font-size:16px">${esc(d.name)}</a></b>
              <div class="small">${stars(d.rating)} <b>${d.rating.toFixed(1)}</b> <span class="muted">(${num(d.review_count)} reviews)</span></div>
              <div class="small muted">${esc(d.address)}, ${esc(d.city)}, ${esc(d.state)} ${esc(d.zip)} (${dist} mi)</div>
            </div>
          </div>
          <div style="margin-top:8px"><a href="#/dealer/${esc(d.dealer_id)}" class="small" style="font-weight:700">View Dealer Inventory (${DB.vehicles.filter(x => x.dealer_id === d.dealer_id).length}) ›</a></div>
          <form class="form" data-form="lead" data-vid="${esc(v.id)}">
            <label for="lN">Your Name</label><input class="field" id="lN" placeholder="Full Name" required>
            <label for="lE">Email Address</label><input class="field" id="lE" type="email" placeholder="you@example.com" required>
            <label for="lM">Message Dealer</label><textarea class="field" id="lM">Hi ${esc(d.name)}, I'm interested in the ${esc(v.title)} ${esc(v.trim)} (${money(v.price)}). Is it available for a test drive today?</textarea>
            <button class="btn acc" style="width:100%;margin-top:12px">Schedule Test Drive / Contact Dealer</button>
          </form>
          <div id="leadOk"></div>
        </div>` : ''}
      </aside>
    </div>

    ${similar.length ? `<div class="sec-h"><h2>Similar ${esc(v.body_style)}s in Detroit</h2><a class="view-all" href="${searchHref({ body: [v.body_style] })}">See More →</a></div><div class="grid g4" style="margin-bottom:30px">${cards(similar)}</div>` : ''}
  </div>

  <!-- FULL-SCREEN AUTOTRADER KIOSK LIGHTBOX MODAL -->
  <div class="kiosk-modal" id="vdpKioskModal" role="dialog" aria-modal="true" aria-label="All Vehicle Photos">
    <div class="kiosk-modal-hd">
      <div class="kiosk-modal-title">
        <b>${esc(v.year)} ${esc(v.make)} ${esc(v.model)} ${esc(v.trim)}</b>
        <span>${money(v.price)}</span>
      </div>
      <div class="kiosk-modal-tabs">
        <button type="button" class="km-tab on" data-mview="grid" data-mcat="all">⊞ All Photos Grid (${totalPhotos})</button>
        <button type="button" class="km-tab" data-mview="grid" data-mcat="exterior">🚗 Exterior (${gal.exterior.length})</button>
        <button type="button" class="km-tab" data-mview="grid" data-mcat="interior">🛋 Interior (${gal.interior.length})</button>
        <button type="button" class="km-tab" data-mview="grid" data-mcat="details">⚙ Details (${gal.details.length})</button>
        <button type="button" class="km-tab" data-mview="slide">▣ Large Kiosk Slideshow</button>
      </div>
      <div class="kiosk-modal-actions">
        <a class="btn sm" href="#/finance?price=${v.price}&vid=${esc(v.id)}">Get Pre-Qualified</a>
        <button type="button" class="km-close" id="kmCloseBtn">✕ Close (Esc)</button>
      </div>
    </div>

    <div class="kiosk-modal-body">
      <!-- Categorized Multi-Column Grid View -->
      <div id="kmGridContainer">
        ${[
          ['exterior', `Exterior Studio Angles (${gal.exterior.length})`, gal.exterior],
          ['interior', `Interior & Cabin Details (${gal.interior.length})`, gal.interior],
          ['details', `Cargo, Wheels & Mechanical (${gal.details.length})`, gal.details]
        ].map(([catKey, secTitle, list]) => `
          <div class="km-grid-section" data-msec="${catKey}">
            <h3>${esc(secTitle)}</h3>
            <div class="km-photo-grid">
              ${list.map(item => {
                const pIdx = gal.photos.findIndex(x => x.src === item.src);
                return `<div class="km-grid-card" data-mslide="${pIdx}">
                  <img src="${esc(item.src)}" alt="${esc(item.title)}" referrerpolicy="no-referrer" loading="lazy">
                  <div class="km-cap"><span>${esc(item.shortTitle)}</span><b>#${pIdx + 1}</b></div>
                </div>`;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Large Single-Image Kiosk Slideshow View -->
      <div id="kmSlideContainer" class="km-slide-view" style="display:none">
        <div class="km-slide-stage">
          <button type="button" class="at-nav-arr prev" id="kmPrevBtn" aria-label="Previous image">‹</button>
          <img id="kmSlideImg" src="${esc(gal.photos[0].src)}" alt="${esc(gal.photos[0].title)}" referrerpolicy="no-referrer" title="Click to toggle zoom">
          <button type="button" class="at-nav-arr next" id="kmNextBtn" aria-label="Next image">›</button>
        </div>
        <div class="km-slide-caption" id="kmSlideCap">Photo 1 of ${totalPhotos} · ${esc(gal.photos[0].catLabel)} — ${esc(gal.photos[0].shortTitle)} (Click photo to zoom)</div>
        <div class="km-thumb-bar" id="kmThumbBar">
          ${gal.photos.map((p, idx) => `
            <button type="button" class="at-thumb ${idx === 0 ? 'on' : ''}" data-kmthumb="${idx}">
              <img src="${esc(p.src)}" alt="${esc(p.shortTitle)}" referrerpolicy="no-referrer" loading="lazy">
              <span class="t-num">${idx + 1}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  </div>`;

  return {
    html,
    nav: 'search',
    title: v.title + ' ' + v.trim,
    after: () => bindVdpKiosk(v, gal)
  };
});

function bindVdpKiosk(v, gal) {
  const kiosk = $('#atKiosk');
  if (!kiosk) return;

  let curIdx = 0;
  let spinIdx = 0;
  let spinTimer = null;
  let isSpinMode = false;

  const mainStage = $('#atMainStage');
  const photoView = $('#atPhotoView');
  const spinView = $('#atSpinView');
  const mainImg = $('#atMainImg');
  const stageBadge = $('#atStageBadge');
  const stageCount = $('#atStageCount');
  const thumbStrip = $('#atThumbStrip');

  // Attach fallback handler for any external angle image
  $$('#atKiosk img, #vdpKioskModal img').forEach(img => {
    img.addEventListener('error', () => {
      if (img.src !== v.image) img.src = v.image;
    });
  });

  function showPhoto(idx, exitSpin = true) {
    if (exitSpin && isSpinMode) setSpinMode(false);
    curIdx = (idx + gal.photos.length) % gal.photos.length;
    const p = gal.photos[curIdx];
    mainImg.src = p.src;
    mainImg.alt = p.title;
    mainStage.classList.toggle('is-svg', !!p.isSvg);
    stageBadge.textContent = `${p.catLabel} · ${p.shortTitle}`;
    stageCount.textContent = `${curIdx + 1} / ${gal.photos.length}`;

    $$('#atThumbStrip .at-thumb').forEach((btn, i) => {
      btn.classList.toggle('on', i === curIdx);
      if (i === curIdx) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
    $$('.at-bento-tile').forEach(tile => {
      tile.classList.toggle('active', +tile.dataset.bento === curIdx);
    });
  }

  function setSpinMode(on) {
    isSpinMode = on;
    photoView.style.display = on ? 'none' : 'block';
    spinView.style.display = on ? 'flex' : 'none';
    $$('#atKiosk .at-tab').forEach(t => {
      t.classList.toggle('on', on ? t.dataset.kmode === 'spin' : t.dataset.kcat === 'all');
    });
    if (!on && spinTimer) {
      clearInterval(spinTimer);
      spinTimer = null;
      const ab = $('#atAutoSpinBtn');
      if (ab) ab.textContent = '▶ Auto-Spin';
    }
  }

  function updateSpinFrame(idx) {
    spinIdx = (idx + gal.spinFrames.length) % gal.spinFrames.length;
    const f = gal.spinFrames[spinIdx];
    const sImg = $('#atSpinImg');
    const sBadge = $('#atSpinBadge');
    const sCount = $('#atSpinCount');
    const sSlider = $('#atSpinSlider');
    if (sImg) sImg.src = f.src;
    if (sBadge) sBadge.textContent = `🔄 360° Walkaround · ${f.shortTitle}`;
    if (sCount) sCount.textContent = `Angle ${spinIdx + 1} / ${gal.spinFrames.length}`;
    if (sSlider) sSlider.value = String(spinIdx);
  }

  // Automatically process any dynamic imagin.studio URLs to replace CarWow plates with MotorRow
  gal.photos.forEach((p, idx) => {
    if (p.src && p.src.startsWith('https://cdn.imagin.studio/')) {
      processImaginWithMotorRowPlate(p.src, p.fallback).then(cleanDataUrl => {
        p.src = cleanDataUrl;
        if (p.angle) {
          const extItem = gal.exterior.find(x => x.angle === p.angle);
          if (extItem) extItem.src = cleanDataUrl;
          const sf = gal.spinFrames.find(x => x.angle === p.angle);
          if (sf) sf.src = cleanDataUrl;
          if (gal.spinFrames[spinIdx] && gal.spinFrames[spinIdx].angle === p.angle) {
            const sImg = $('#atSpinImg');
            if (sImg) sImg.src = cleanDataUrl;
          }
        }
        if (curIdx === idx && mainImg) mainImg.src = cleanDataUrl;
        const kmSlideImg = $('#kmSlideImg');
        if (kmSlideImg && curIdx === idx) kmSlideImg.src = cleanDataUrl;
        $$(`[data-kthumb="${idx}"] img, [data-kmthumb="${idx}"] img, [data-bento="${idx}"] img, [data-mslide="${idx}"] img`).forEach(el => { el.src = cleanDataUrl; });
      });
    }
  });

  $('#atPrevBtn')?.addEventListener('click', e => { e.stopPropagation(); showPhoto(curIdx - 1); });
  $('#atNextBtn')?.addEventListener('click', e => { e.stopPropagation(); showPhoto(curIdx + 1); });
  $('#atStripLeft')?.addEventListener('click', () => { thumbStrip?.scrollBy({ left: -380, behavior: 'smooth' }); });
  $('#atStripRight')?.addEventListener('click', () => { thumbStrip?.scrollBy({ left: 380, behavior: 'smooth' }); });

  // Category & Spin tabs
  $$('#atKiosk [data-kcat]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.kcat;
      setSpinMode(false);
      $$('#atKiosk .at-tab').forEach(t => t.classList.toggle('on', t === btn));
      $$('#atThumbStrip .at-thumb').forEach(th => {
        th.style.display = (cat === 'all' || th.dataset.cat === cat) ? '' : 'none';
      });
      const firstIdx = cat === 'all' ? 0 : gal.photos.findIndex(p => p.cat === cat);
      if (firstIdx >= 0) showPhoto(firstIdx, false);
    });
  });

  $$('#atKiosk [data-kmode="spin"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      setSpinMode(true);
      updateSpinFrame(spinIdx);
    });
  });

  $$('#atKiosk [data-kjump]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      showPhoto(+btn.dataset.kjump);
    });
  });

  $$('#atThumbStrip .at-thumb').forEach(btn => {
    btn.addEventListener('click', () => showPhoto(+btn.dataset.kthumb));
  });

  $$('.at-bento-tile').forEach(tile => {
    tile.addEventListener('click', e => {
      if (tile.dataset.kopen) {
        openModal('grid', curIdx);
      } else {
        showPhoto(+tile.dataset.bento);
      }
    });
  });

  // 360 Drag-to-Rotate & Slider Interaction
  const spinImg = $('#atSpinImg');
  let dragging = false, startX = 0;
  const startDrag = x => { dragging = true; startX = x; };
  const moveDrag = x => {
    if (!dragging) return;
    const dx = x - startX;
    if (Math.abs(dx) > 22) {
      updateSpinFrame(spinIdx + (dx > 0 ? 1 : -1));
      startX = x;
    }
  };
  const endDrag = () => { dragging = false; };
  spinImg?.addEventListener('mousedown', e => startDrag(e.clientX));
  window.addEventListener('mousemove', e => moveDrag(e.clientX));
  window.addEventListener('mouseup', endDrag);
  spinImg?.addEventListener('touchstart', e => { if (e.touches[0]) startDrag(e.touches[0].clientX); }, { passive: true });
  spinImg?.addEventListener('touchmove', e => { if (e.touches[0]) moveDrag(e.touches[0].clientX); }, { passive: true });
  spinImg?.addEventListener('touchend', endDrag);

  $('#atSpinSlider')?.addEventListener('input', e => updateSpinFrame(+e.target.value));
  $('#atAutoSpinBtn')?.addEventListener('click', e => {
    const btn = e.currentTarget;
    if (spinTimer) {
      clearInterval(spinTimer);
      spinTimer = null;
      btn.textContent = '▶ Auto-Spin';
    } else {
      btn.textContent = '⏸ Pause Spin';
      spinTimer = setInterval(() => updateSpinFrame(spinIdx + 1), 650);
    }
  });

  // Lightbox Modal Controls
  const modal = $('#vdpKioskModal');
  const gridCont = $('#kmGridContainer');
  const slideCont = $('#kmSlideContainer');
  const slideImg = $('#kmSlideImg');
  const slideCap = $('#kmSlideCap');

  function updateModalSlide(idx) {
    curIdx = (idx + gal.photos.length) % gal.photos.length;
    const p = gal.photos[curIdx];
    slideImg.classList.remove('zoomed');
    slideImg.src = p.src;
    slideCap.textContent = `Photo ${curIdx + 1} of ${gal.photos.length} · ${p.catLabel} — ${p.shortTitle} (Click photo to zoom)`;
    $$('#kmThumbBar .at-thumb').forEach((th, i) => {
      th.classList.toggle('on', i === curIdx);
      if (i === curIdx) th.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
    showPhoto(curIdx, false);
  }

  function openModal(viewMode = 'grid', idx = curIdx) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (viewMode === 'slide') {
      gridCont.style.display = 'none';
      slideCont.style.display = 'flex';
      $$('#vdpKioskModal .km-tab').forEach(t => t.classList.toggle('on', t.dataset.mview === 'slide'));
      updateModalSlide(idx);
    } else {
      gridCont.style.display = 'block';
      slideCont.style.display = 'none';
      $$('#vdpKioskModal .km-tab').forEach(t => t.classList.toggle('on', t.dataset.mview === 'grid' && t.dataset.mcat === 'all'));
      $$('#kmGridContainer .km-grid-section').forEach(sec => sec.style.display = 'block');
    }
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  $$('[data-kopen]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      openModal(el.dataset.kopen, curIdx);
    });
  });

  $('#kmCloseBtn')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  $$('#vdpKioskModal .km-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('#vdpKioskModal .km-tab').forEach(t => t.classList.toggle('on', t === tab));
      if (tab.dataset.mview === 'slide') {
        gridCont.style.display = 'none';
        slideCont.style.display = 'flex';
        updateModalSlide(curIdx);
      } else {
        const cat = tab.dataset.mcat || 'all';
        gridCont.style.display = 'block';
        slideCont.style.display = 'none';
        $$('#kmGridContainer .km-grid-section').forEach(sec => {
          sec.style.display = (cat === 'all' || sec.dataset.msec === cat) ? 'block' : 'none';
        });
      }
    });
  });

  $$('#kmGridContainer [data-mslide]').forEach(card => {
    card.addEventListener('click', () => openModal('slide', +card.dataset.mslide));
  });

  $$('#kmThumbBar [data-kmthumb]').forEach(th => {
    th.addEventListener('click', () => updateModalSlide(+th.dataset.kmthumb));
  });

  $('#kmPrevBtn')?.addEventListener('click', () => updateModalSlide(curIdx - 1));
  $('#kmNextBtn')?.addEventListener('click', () => updateModalSlide(curIdx + 1));
  slideImg?.addEventListener('click', () => slideImg.classList.toggle('zoomed'));

  // Keyboard navigation for both inline kiosk and fullscreen modal
  const onKey = e => {
    if (!document.body.contains(kiosk)) {
      window.removeEventListener('keydown', onKey);
      return;
    }
    if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (modal.classList.contains('open')) {
      if (e.key === 'Escape') closeModal();
      else if (e.key === 'ArrowLeft') updateModalSlide(curIdx - 1);
      else if (e.key === 'ArrowRight') updateModalSlide(curIdx + 1);
    } else {
      if (e.key === 'ArrowLeft') isSpinMode ? updateSpinFrame(spinIdx - 1) : showPhoto(curIdx - 1);
      else if (e.key === 'ArrowRight') isSpinMode ? updateSpinFrame(spinIdx + 1) : showPhoto(curIdx + 1);
    }
  };
  window.addEventListener('keydown', onKey);
}

/* ---------- DEALERS ---------- */
function dealerCard(d, zip, idx) {
  const n = DB.vehicles.filter(v => v.dealer_id === d.dealer_id).length;
  return `<div class="dealer-showcase-card">
    <a href="#/dealer/${esc(d.dealer_id)}"><img class="d-photo" src="${dealerPhoto(d)}" alt="${esc(d.name)}" style="height:135px"></a>
    <div class="d-body" style="display:flex;flex-direction:column;flex:1">
      <h3><a href="#/dealer/${esc(d.dealer_id)}" style="color:var(--navy)">${esc(d.name)}</a></h3>
      <div class="d-rate"><span class="stars">★</span> ${d.rating.toFixed(1)} <span class="muted" style="font-weight:500">(${num(d.review_count)} reviews)</span></div>
      <div class="d-loc">📍 ${esc(d.address)}, ${esc(d.city)}, ${esc(d.state)} · ${dealerDist(d, zip).toFixed(1)} mi</div>
      <p class="small muted" style="margin:8px 0 12px">${esc(d.specialty)}</p>
      <div style="margin-top:auto;display:flex;gap:8px">
        <a class="btn sm" href="#/dealer/${esc(d.dealer_id)}">View Showroom (${n})</a>
        <a class="btn ghost sm" href="${searchHref({ dealer: d.dealer_id })}">Filter Cars</a>
      </div>
    </div>
  </div>`;
}
route(/^\/dealers$/, (m, p) => {
  const zip = userZip(), q = (p.get('q') || '').toLowerCase(), sort = p.get('sort') || 'distance';
  let list = DB.dealers.filter(d => !q || (d.name + ' ' + d.city + ' ' + d.zip + ' ' + d.specialty).toLowerCase().includes(q));
  const inv = d => DB.vehicles.filter(v => v.dealer_id === d.dealer_id).length;
  list = list.sort(sort === 'rating' ? (a, b) => b.rating - a.rating : sort === 'inventory' ? (a, b) => inv(b) - inv(a) : (a, b) => dealerDist(a, zip) - dealerDist(b, zip));
  const html = `<div class="wrap"><div class="crumbs"><a href="#/">Home</a> › Detroit-Area Dealers</div><div class="resh" style="margin-top:12px"><div><h1>Trusted Detroit-Area Dealerships</h1><div class="muted small">${list.length} verified Metro Detroit dealers</div></div>
    <form data-form="dealersearch" style="display:flex;gap:8px"><input class="field" name="q" value="${esc(p.get('q') || '')}" placeholder="Search dealer, city or specialty" style="width:240px"><select class="field" name="sort" style="width:auto">${[['distance', 'Nearest to Detroit'], ['rating', 'Highest Rated'], ['inventory', 'Most Inventory']].map(([k, l]) => `<option value="${k}" ${sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select><button class="btn">Search</button></form></div>
    <div class="grid g4" style="margin-bottom:40px">${list.map((d, i) => dealerCard(d, zip, i)).join('') || '<div class="empty" style="grid-column:1/-1">No dealers match.</div>'}</div></div>`;
  return { html, nav: 'dealers', title: 'Detroit-Area Dealers' };
});
route(/^\/dealer\/(.+)$/, m => {
  const d = DB.dById[decodeURIComponent(m[1])];
  if (!d) return { html: '<div class="wrap"><div class="empty" style="margin-top:30px"><h2>Dealer not found</h2><a class="btn" href="#/dealers">All dealers</a></div></div>', nav: 'dealers' };
  const zip = userZip(); const dm = distMap(zip);
  const inv = sorted(DB.vehicles.filter(v => v.dealer_id === d.dealer_id).map(v => { v._d = dm[v.dealer_id]; return v; }), 'deal');
  const html = `<div class="wrap"><div class="crumbs"><a href="#/">Home</a> › <a href="#/dealers">Dealers</a> › ${esc(d.name)}</div>
    <div class="panel" style="margin:14px 0 22px;display:flex;gap:22px;align-items:center;flex-wrap:wrap">
      <img src="${dealerPhoto(d)}" alt="${esc(d.name)}" style="width:180px;height:115px;object-fit:cover;border-radius:12px">
      <div style="flex:1;min-width:260px"><h1>${esc(d.name)}</h1><div style="margin-top:4px">${stars(d.rating)} <b>${d.rating.toFixed(1)}</b> <span class="muted">(${num(d.review_count)} verified reviews)</span> · Est. ${esc(d.established)}</div>
      <p class="muted" style="margin:6px 0 0">${esc(d.description)}</p></div>
      <div class="small"><b>${esc(d.address)}</b><br>${esc(d.city)}, ${esc(d.state)} ${esc(d.zip)}<br>☎ ${esc(d.phone)}<br><span class="muted">${esc(d.email)}</span><br><span class="muted">${esc(d.hours)}</span><br><a href="https://www.google.com/maps?q=${d.lat},${d.lng}" target="_blank" rel="noopener">Directions on Google Maps ↗</a></div></div>
    <div class="sec-h"><h2>${inv.length} Vehicles in Stock at ${esc(d.name)}</h2><a class="view-all" href="${searchHref({ dealer: d.dealer_id })}">Filter in Search →</a></div>
    <div class="grid g4" style="margin-bottom:40px">${cards(inv)}</div></div>`;
  return { html, nav: 'dealers', title: d.name };
});

/* ---------- SELL ---------- */
route(/^\/sell$/, (m, p) => {
  const makes = uniqSorted(DB.vehicles.map(v => v.make));
  const html = `<div class="wrap"><div class="crumbs"><a href="#/">Home</a> › Sell or Trade Your Vehicle</div>
  <div class="grid g2" style="margin:14px 0 40px;align-items:start"><div class="panel"><h1 style="font-size:26px;margin-bottom:6px">What’s Your Vehicle Worth in Detroit?</h1><p class="muted" style="margin-top:0">Get an instant trade-in &amp; private-party valuation computed from comparable live Metro Detroit listings.</p>
    <form class="form" data-form="sell"><div class="two"><div><label for="sMake">Make</label><select class="field" id="sMake" required><option value="">Select Make</option>${makes.map(x => `<option>${esc(x)}</option>`).join('')}</select></div>
      <div><label for="sModel">Model</label><select class="field" id="sModel" required disabled><option value="">Select make first</option></select></div></div>
      <div class="two"><div><label for="sYear">Year</label><select class="field" id="sYear">${Array.from({ length: 12 }, (_, i) => 2026 - i).map(y => `<option>${y}</option>`).join('')}</select></div>
      <div><label for="sMiles">Mileage</label><input class="field" id="sMiles" type="number" min="0" value="45000"></div></div>
      <div class="two"><div><label for="sCond">Condition</label><select class="field" id="sCond"><option value="1.05">Excellent</option><option value="1" selected>Good</option><option value="0.93">Fair</option><option value="0.85">Needs work</option></select></div>
      <div><label for="sZip">Detroit Area ZIP</label><input class="field" id="sZip" value="${esc(userZip())}" maxlength="5"></div></div>
      <button class="btn acc lg" style="margin-top:16px">Get Instant Valuation</button></form></div>
    <div id="sellOut" class="panel"><h3>Your valuation will appear here</h3><p class="muted">We compare live Metro Detroit listings for the same make &amp; model (±2 model years) and adjust for mileage and condition.</p></div></div></div>`;
  return { html, nav: 'sell', title: 'Sell or Trade Your Car' };
});
function sellEstimate() {
  const make = $('#sMake').value, model = $('#sModel').value, year = +$('#sYear').value, miles = +$('#sMiles').value || 0, cf = +$('#sCond').value;
  let pool = DB.vehicles.filter(v => v.make === make && v.model === model && Math.abs(v.year - year) <= 2);
  let basis = 'same model within 2 model years';
  if (!pool.length) { pool = DB.vehicles.filter(v => v.make === make && v.model === model); basis = 'all years of this model'; }
  if (!pool.length) { $('#sellOut').innerHTML = '<h3>Not enough data</h3><p class="muted">No comparable listings found.</p>'; return; }
  const adj = pool.map(v => v.market_value + (v.mileage - miles) * 0.065 + (year - v.year) * 1100);
  const avg = adj.reduce((a, b) => a + b, 0) / adj.length * cf;
  const lo = Math.max(500, avg * 0.94), hi = avg * 1.06, offer = avg * 0.9;
  const sim = sorted(pool, 'priceAsc').slice(0, 3);
  $('#sellOut').innerHTML = `<h3>Estimated Detroit Market Value</h3><div class="price" style="font-size:36px;margin:6px 0">${money(lo)} – ${money(hi)}</div>
    <p class="muted small" style="margin:0 0 12px">Based on ${pool.length} comparable Metro Detroit listing${pool.length > 1 ? 's' : ''} (${basis}).</p>
    <div class="kpis" style="grid-template-columns:1fr 1fr"><div class="kpi"><span>Private-Party Value</span><b>${money(avg)}</b></div><div class="kpi"><span>Dealer Trade-In Offer</span><b>${money(offer)}</b></div></div>
    <h3 style="margin:18px 0 8px;font-size:16px">Comparable Detroit Listings</h3>${sim.map(v => `<a class="panel" style="display:flex;gap:12px;align-items:center;margin-bottom:8px;padding:8px;text-decoration:none" href="#/vehicle/${esc(v.id)}"><img src="${esc(v.image)}" data-vid="${esc(v.id)}" style="width:110px;aspect-ratio:16/9;object-fit:cover;object-position:center top;border-radius:8px" alt=""><span><b style="color:var(--navy)">${esc(v.title)} ${esc(v.trim)}</b><br><span class="muted small">${num(v.mileage)} mi · ${money(v.price)}</span></span></a>`).join('')}`;
}

/* ---------- FINANCE ---------- */
route(/^\/finance$/, (m, p) => {
  const price = +p.get('price') || 32000, v = DB.vById[p.get('vid')];
  const html = `<div class="wrap"><div class="crumbs"><a href="#/">Home</a> › Financing &amp; Payment Calculator</div>
  <div class="grid g2" style="margin:14px 0 40px;align-items:start"><div class="panel"><h1 style="font-size:26px;margin-bottom:6px">Auto Loan &amp; Payment Calculator</h1>${v ? `<p class="small">Financing estimate for <a href="#/vehicle/${esc(v.id)}"><b>${esc(v.title)} ${esc(v.trim)}</b></a></p>` : '<p class="muted small">Estimate your monthly payment across Detroit partner lenders.</p>'}
    <div class="form"><label>Vehicle Price ($)</label><input class="field" id="fPrice" type="number" value="${price}" min="0">
      <div class="two"><div><label>Down Payment ($)</label><input class="field" id="fDown" type="number" value="${Math.round(price * 0.1)}" min="0"></div><div><label>Trade-In Value ($)</label><input class="field" id="fTrade" type="number" value="0" min="0"></div></div>
      <div class="two"><div><label>Credit Score Tier</label><select class="field" id="fCredit"><option value="5.4">Excellent (740+ · 5.4% APR)</option><option value="6.9" selected>Good (680–739 · 6.9% APR)</option><option value="9.9">Fair (620–679 · 9.9% APR)</option><option value="14.5">Rebuilding (&lt;620 · 14.5% APR)</option></select></div><div><label>APR (%)</label><input class="field" id="fApr" type="number" value="6.9" step="0.1" min="0"></div></div>
      <div class="two"><div><label>Loan Term</label><select class="field" id="fTerm">${[36, 48, 60, 72, 84].map(t => `<option ${t === 60 ? 'selected' : ''} value="${t}">${t} months</option>`).join('')}</select></div><div><label>Michigan Sales Tax (%)</label><input class="field" id="fTax" type="number" value="6.0" step="0.05" min="0"></div></div></div></div>
    <div class="panel" id="fOut"></div></div></div>`;
  return { html, nav: 'finance', title: 'Financing Calculator', after: bindFinance };
});
function bindFinance() {
  const ids = ['fPrice', 'fDown', 'fTrade', 'fApr', 'fTerm', 'fTax'];
  const calc = () => {
    const price = +$('#fPrice').value || 0, down = +$('#fDown').value || 0, trade = +$('#fTrade').value || 0, apr = +$('#fApr').value || 0, term = +$('#fTerm').value, tax = +$('#fTax').value || 0;
    const taxAmt = Math.max(0, price - trade) * tax / 100, loan = Math.max(0, price + taxAmt - down - trade), mo = pmt(loan, apr, term), total = mo * term;
    $('#fOut').innerHTML = `<h3>Estimated Monthly Payment</h3><div class="price" style="font-size:46px;margin:6px 0;color:var(--blue)">${money(mo)}<span class="muted" style="font-size:18px;font-weight:600"> /mo</span></div>
      <div class="kpis" style="grid-template-columns:1fr 1fr;margin-top:12px"><div class="kpi"><span>Amount Financed</span><b>${money(loan)}</b></div><div class="kpi"><span>Total Interest</span><b>${money(total - loan)}</b></div><div class="kpi"><span>Michigan Sales Tax (6%)</span><b>${money(taxAmt)}</b></div><div class="kpi"><span>Total of Payments</span><b>${money(total)}</b></div></div>
      <div style="margin-top:16px"><a class="btn" href="${searchHref({ priceMax: Math.round(price) })}">Shop Vehicles Under ${money(price)} →</a></div>`;
  };
  ids.forEach(i => $('#' + i).addEventListener('input', calc));
  $('#fCredit').addEventListener('change', e => { $('#fApr').value = e.target.value; calc(); });
  calc();
}

/* ---------- RESEARCH ---------- */
route(/^\/research$/, (m, p) => {
  const make = p.get('make'), model = p.get('model');
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  let html;
  if (make && model) {
    const pool = DB.vehicles.filter(v => v.make === make && v.model === model);
    if (!pool.length) html = '<div class="wrap"><div class="empty">No listings for that model.</div></div>';
    else {
      const byYear = uniqSorted(pool.map(v => v.year)).map(y => [y, avg(pool.filter(v => v.year === y).map(v => v.price))]);
      const mx = Math.max(...byYear.map(x => x[1]));
      const s0 = pool[0], deals = sorted(pool, 'deal').slice(0, 4);
      html = `<div class="wrap"><div class="crumbs"><a href="#/">Home</a> › <a href="#/research">Research</a> › <a href="#/research?make=${encodeURIComponent(make)}">${esc(make)}</a> › ${esc(model)}</div>
      <div class="resh" style="margin-top:12px"><h1>${esc(make)} ${esc(model)} – Market Research &amp; Pricing</h1><a class="btn" href="${searchHref({ make: [make], model: [model] })}">Shop ${pool.length} Listings →</a></div>
      <div class="kpis"><div class="kpi"><span>Average Price</span><b>${money(avg(pool.map(v => v.price)))}</b></div><div class="kpi"><span>Price Range</span><b>${money(Math.min(...pool.map(v => v.price)))}–${money(Math.max(...pool.map(v => v.price)))}</b></div><div class="kpi"><span>Avg Mileage</span><b>${num(avg(pool.map(v => v.mileage)))} mi</b></div><div class="kpi"><span>Fuel Economy</span><b>${Math.round(avg(pool.map(v => v.mpg)))} ${s0.fuel_type === 'Electric' ? 'MPGe' : 'MPG'}</b></div></div>
      <div class="panel" style="margin:16px 0"><h3>Average Asking Price by Model Year</h3><div class="bars">${byYear.map(([y, a]) => `<div class="b"><em>${money(a / 1000)}k</em><i style="height:${Math.max(6, a / mx * 100)}%"></i><span>${y}</span></div>`).join('')}</div></div>
      <div class="sec-h"><h2>Available ${esc(make)} ${esc(model)} Inventory</h2></div><div class="grid g4" style="margin-bottom:40px">${cards(deals)}</div></div>`;
    }
  } else if (make) {
    const models = uniqSorted(DB.vehicles.filter(v => v.make === make).map(v => v.model));
    html = `<div class="wrap"><div class="crumbs"><a href="#/">Home</a> › <a href="#/research">Research</a> › ${esc(make)}</div><h1 style="margin:12px 0 16px">${esc(make)} Models &amp; Market Guide</h1>
    <table class="tbl"><thead><tr><th>Model</th><th>Body Style</th><th>Detroit Listings</th><th>Avg Price</th><th>Avg Mileage</th><th>Combined MPG</th><th></th></tr></thead><tbody>${models.map(md => { const pool = DB.vehicles.filter(v => v.make === make && v.model === md); return `<tr><td><b><a href="#/research?make=${encodeURIComponent(make)}&model=${encodeURIComponent(md)}">${esc(md)}</a></b></td><td>${esc(pool[0].body_style)}</td><td>${pool.length}</td><td>${money(avg(pool.map(v => v.price)))}</td><td>${num(avg(pool.map(v => v.mileage)))} mi</td><td>${Math.round(avg(pool.map(v => v.mpg)))}</td><td><a class="btn sm outline-blue" href="${searchHref({ make: [make], model: [md] })}">Shop →</a></td></tr>`; }).join('')}</tbody></table><div style="height:40px"></div></div>`;
  } else {
    const makes = uniqSorted(DB.vehicles.map(v => v.make));
    html = `<div class="wrap"><div class="crumbs"><a href="#/">Home</a> › Vehicle Research</div><h1 style="margin:12px 0 6px">Vehicle Research, Specs &amp; Market Pricing</h1><p class="muted" style="margin-top:0">Compare average prices, mileage, and fuel economy across all ${makes.length} brands and 63 models in Detroit.</p>
    <div class="grid g4" style="margin:16px 0 40px">${makes.map(mk => { const pool = DB.vehicles.filter(v => v.make === mk); const rep = pool[0]; return `<a class="vcard" style="text-decoration:none" href="#/research?make=${encodeURIComponent(mk)}"><div class="im">${imgTag(rep)}</div><div class="body"><h3 style="font-size:18px">${esc(mk)}</h3><div class="muted small">${uniqSorted(pool.map(v => v.model)).length} models · ${pool.length} listings</div><div style="margin-top:6px;color:var(--blue);font-weight:700">Avg Price: ${money(avg(pool.map(v => v.price)))} →</div></div></a>`; }).join('')}</div></div>`;
  }
  return { html, nav: 'research', title: 'Vehicle Research' };
});

/* ---------- SAVED & COMPARE ---------- */
route(/^\/saved$/, () => {
  const zip = userZip(), dm = distMap(zip);
  const list = Array.from(SAVED).map(id => DB.vById[id]).filter(Boolean).map(v => { v._d = dm[v.dealer_id]; return v; });
  return { nav: 'saved', title: 'Saved Vehicles', html: `<div class="wrap"><div class="crumbs"><a href="#/">Home</a> › Saved Vehicles</div><div class="resh" style="margin:12px 0 16px"><h1>Saved Vehicles (${list.length})</h1>${list.length >= 2 ? `<a class="btn" href="#/compare?ids=${list.slice(0, 3).map(v => v.id).join(',')}">Compare Saved Vehicles</a>` : ''}</div>${list.length ? `<div class="grid g4" style="margin-bottom:40px">${cards(list)}</div>` : '<div class="empty"><h2>No saved vehicles yet</h2><p class="muted">Click the heart icon (♡) on any vehicle card to save it to your shortlist.</p><a class="btn" href="#/search">Browse Inventory</a></div>'}</div>` };
});

route(/^\/compare$/, (m, p) => {
  let ids = (p.get('ids') || '').split(',').filter(Boolean);
  if (!ids.length && COMPARE.length >= 2) ids = COMPARE.slice();
  if (ids.length < 2) ids = ['WS-1009', 'WS-1003', 'WS-1100'];
  const list = ids.map(id => DB.vById[id]).filter(Boolean);
  const row = (l, fn) => `<tr><th style="width:190px">${l}</th>${list.map(v => `<td>${fn(v)}</td>`).join('')}</tr>`;
  const feats = uniqSorted(list.flatMap(v => v.features));
  const html = `<div class="wrap"><div class="crumbs"><a href="#/">Home</a> › Compare Vehicles</div>
    <div class="resh" style="margin:12px 0 16px">
      <div><h1>Compare Vehicles</h1><div class="muted small">Compare specs, features, and market value side-by-side</div></div>
      <div style="display:flex;gap:10px">
        <a class="btn ghost" href="#/search">+ Add Vehicle</a>
        <button class="btn" data-act="copylink">Share Comparison</button>
      </div>
    </div>
    <div style="overflow:auto;margin-bottom:40px"><table class="tbl">
    ${row('Vehicle', v => `<div style="max-width:280px"><a class="im" style="display:block;aspect-ratio:16/9;overflow:hidden;border-radius:10px;margin-bottom:8px" href="#/vehicle/${esc(v.id)}"><img src="${esc(v.image)}" style="width:100%;height:118.5%;object-fit:cover;object-position:center top" alt=""></a><b style="font-size:16px"><a href="#/vehicle/${esc(v.id)}">${esc(v.title)} ${esc(v.trim)}</a></b><div style="font-size:20px;font-weight:800;color:var(--navy);margin-top:4px">${money(v.price)} ${dealTag(v)}</div></div>`)}
    ${row('Market Value', v => `${money(v.market_value)} (${esc(dealNote(v))})`)}
    ${row('Mileage', v => num(v.mileage) + ' mi')}
    ${row('Engine', v => esc(v.engine))}
    ${row('Drivetrain', v => esc(v.drivetrain))}
    ${row('Transmission', v => esc(v.transmission))}
    ${row('MPG (City / Hwy)', v => v.mpg_city + ' / ' + v.mpg_hwy + (v.fuel_type === 'Electric' ? ' MPGe' : ' MPG'))}
    ${row('Body Style', v => esc(v.body_style))}
    ${row('Fuel Type', v => esc(v.fuel_type))}
    ${row('Exterior / Interior', v => esc(v.exterior_color + ' / ' + v.interior_color))}
    ${row('Condition & History', v => `${esc(v.condition)} · ${v.accidents === 0 ? 'No accidents' : v.accidents + ' accident(s)'} · ${v.owners} owner(s)`)}
    ${row('Detroit Dealer', v => v.dealer ? `<a href="#/dealer/${esc(v.dealer.dealer_id)}"><b>${esc(v.dealer.name)}</b></a> (${esc(v.dealer.city)}, ${esc(v.dealer.state)})` : '')}
    ${feats.map(f => row(esc(f), v => v.features.includes(f) ? '<span style="color:var(--green);font-weight:800">✓ Included</span>' : '<span class="muted">–</span>')).join('')}</table></div></div>`;
  return { html, nav: 'compare', title: 'Compare Vehicles' };
});

/* ---------- global events ---------- */
function navFilter(mut) { const f = parseF(curParams()); mut(f); f.page = 0; go('#/search?' + toQS(f)); }
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const act = t.dataset.act;
  if (act === 'save') {
    e.preventDefault(); const id = t.dataset.id; SAVED.has(id) ? SAVED.delete(id) : SAVED.add(id); persistSaved();
    const on = SAVED.has(id);
    $$(`[data-act="save"][data-id="${id}"]`).forEach(btn => {
      btn.classList.toggle('on', on);
      btn.textContent = btn.dataset.text ? (on ? '♥ Saved' : '♡ Save') : (on ? '♥' : '♡');
    });
    if (curHash().startsWith('#/saved')) render(true); else toast(on ? 'Saved to your shortlist' : 'Removed from saved');
  } else if (act === 'cmp-add') {
    const id = t.dataset.id; if (!COMPARE.includes(id)) { if (COMPARE.length >= 3) { toast('You can compare up to 3 vehicles'); return; } COMPARE.push(id); store.set('compare', COMPARE); updateBadges(); } toast('Added to comparison');
  } else if (act === 'cmp-clear') { COMPARE = []; store.set('compare', COMPARE); updateBadges(); $$('input[data-act=cmp]').forEach(c => c.checked = false); }
  else if (act === 'expand') { ui.expanded[t.dataset.key] = !ui.expanded[t.dataset.key]; render(true); }
  else if (act === 'filters') { $('#side').classList.toggle('open'); }
  else if (act === 'rm') {
    const k = t.dataset.k, v = t.dataset.v;
    navFilter(f => {
      if (LIST_KEYS.includes(k)) f[k] = f[k].filter(x => x !== v);
      else if (k === 'year') { f.yearMin = 0; f.yearMax = 0; } else if (k === 'price') { f.priceMin = 0; f.priceMax = 0; }
      else if (['noacc', 'one'].includes(k)) f[k] = false; else if (['dealer', 'q'].includes(k)) f[k] = ''; else f[k] = 0;
      if (k === 'make') f.model = [];
    });
  } else if (act === 'color') { const v = t.dataset.v; navFilter(f => { f.color = f.color.includes(v) ? f.color.filter(x => x !== v) : f.color.concat(v); }); }
  else if (act === 'hero-cond') { e.preventDefault(); ui.heroCond = t.dataset.c; $$('#heroTabs a').forEach(a => a.classList.toggle('on', a === t)); if ($('#hMake')) $('#hMake').dispatchEvent(new Event('change')); }
  else if (act === 'hero-ai') AI.open($('#heroAI') ? $('#heroAI').value : '');
  else if (act === 'search-hero-ai') AI.open($('#searchHeroAI') ? $('#searchHeroAI').value : '');
  else if (act === 'ai-chip') AI.open(t.dataset.q);
  else if (act === 'ai-open') AI.open();
  else if (act === 'mic') AI.mic(t);
  else if (act === 'copylink') { const u = location.href; (navigator.clipboard && navigator.clipboard.writeText(u).then(() => toast('Link copied to clipboard'), () => toast(u))) || toast(u); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.act === 'cmp') {
    const id = t.dataset.id;
    if (t.checked) { if (COMPARE.length >= 3) { t.checked = false; toast('You can compare up to 3 vehicles'); return; } COMPARE.push(id); } else COMPARE = COMPARE.filter(x => x !== id);
    store.set('compare', COMPARE); updateBadges(); return;
  }
  if ('fk' in t.dataset) navFilter(f => { const k = t.dataset.fk, v = t.dataset.fv; f[k] = t.checked ? f[k].concat(v) : f[k].filter(x => x !== v); if (k === 'make') f.model = f.model.filter(md => DB.vehicles.some(x => x.model === md && f.make.includes(x.make))); });
  else if ('fnum' in t.dataset) navFilter(f => { f[t.dataset.fnum] = +t.value || 0; });
  else if ('fbool' in t.dataset) navFilter(f => { f[t.dataset.fbool] = t.checked; });
  else if ('fdealer' in t.dataset) navFilter(f => { f.dealer = t.value; });
  else if ('fsort' in t.dataset) navFilter(f => { f.sort = t.value; });
  else if ('fzip' in t.dataset) { const z = t.value.trim(); if (/^\d{5}$/.test(z)) { store.set('zip', z); navFilter(f => { f.zip = z; }); } else toast('Enter a 5-digit ZIP'); }
  else if (t.id === 'sMake') { const md = $('#sModel'); md.innerHTML = '<option value="">Select Model</option>' + uniqSorted(DB.vehicles.filter(v => v.make === t.value).map(v => v.model)).map(x => `<option>${esc(x)}</option>`).join(''); md.disabled = !t.value; }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
  const kind = f.dataset.form;
  if (kind === 'lead') { $('#leadOk').innerHTML = '<div class="ok-box"><b>Message sent to dealer, ' + esc($('#lN').value) + '!</b> A Detroit showroom specialist will follow up shortly.</div>'; }
  else if (kind === 'sell') { const z = $('#sZip').value.trim(); if (DB.zips[z]) store.set('zip', z); sellEstimate(); }
  else if (kind === 'dealersearch') { const d = new FormData(f); go('#/dealers?q=' + encodeURIComponent(d.get('q') || '') + '&sort=' + d.get('sort')); }
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('sw')) { e.preventDefault(); e.target.click(); } });
