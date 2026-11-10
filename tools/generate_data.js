#!/usr/bin/env node
/*
 * Generates the SEED data for Wheelspan: data/vehicles.csv, data/dealers.csv, data/zipcodes.csv
 * Run once to create the sample inventory; after that, edit the CSV files directly.
 *   node tools/generate_data.js
 * Everything is synthetic. Dealer names, phone numbers (555-01xx) and addresses are fictional.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// ---------- deterministic RNG ----------
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(20261107);
const pick = a => a[Math.floor(rnd() * a.length)];
const between = (a, b) => a + rnd() * (b - a);
const chance = p => rnd() < p;
function weighted(items) { const total = items.reduce((s, i) => s + i[1], 0); let r = rnd() * total; for (const [v, w] of items) { if ((r -= w) <= 0) return v; } return items[0][0]; }
const roundTo = (n, s) => Math.round(n / s) * s;

// ---------- catalogue ----------
// make, model, body, msrp, fuel, cityMpg, hwyMpg, drivetrains, engine, trims, thirdRow, hybridChance, dieselChance, manualChance
const MODELS = [
  ['Toyota', 'Camry', 'Sedan', 27000, 'Gas', 28, 39, ['FWD'], '2.5L 4-Cyl', ['LE', 'SE', 'XSE', 'XLE'], 0, .25, 0, 0],
  ['Toyota', 'Corolla', 'Sedan', 22000, 'Gas', 32, 41, ['FWD'], '2.0L 4-Cyl', ['L', 'LE', 'SE', 'XSE'], 0, .1, 0, 0],
  ['Toyota', 'RAV4', 'SUV', 30000, 'Gas', 27, 35, ['AWD', 'FWD'], '2.5L 4-Cyl', ['LE', 'XLE', 'Adventure', 'Limited'], 0, .3, 0, 0],
  ['Toyota', 'Tacoma', 'Truck', 33000, 'Gas', 20, 23, ['4WD', 'RWD'], '3.5L V6', ['SR', 'SR5', 'TRD Sport', 'TRD Off-Road'], 0, 0, 0, .15],
  ['Toyota', 'Highlander', 'SUV', 40000, 'Gas', 21, 29, ['AWD', 'FWD'], '3.5L V6', ['L', 'LE', 'XLE', 'Limited'], 1, .2, 0, 0],
  ['Toyota', 'Prius', 'Hatchback', 28000, 'Hybrid', 57, 56, ['FWD'], '1.8L Hybrid', ['LE', 'XLE', 'Limited'], 0, 1, 0, 0],
  ['Honda', 'Civic', 'Sedan', 24000, 'Gas', 31, 40, ['FWD'], '2.0L 4-Cyl', ['LX', 'Sport', 'EX', 'Touring'], 0, 0, 0, .15],
  ['Honda', 'Accord', 'Sedan', 28000, 'Gas', 29, 37, ['FWD'], '1.5L Turbo', ['LX', 'Sport', 'EX-L', 'Touring'], 0, .25, 0, 0],
  ['Honda', 'CR-V', 'SUV', 30000, 'Gas', 28, 34, ['AWD', 'FWD'], '1.5L Turbo', ['LX', 'EX', 'EX-L', 'Touring'], 0, .25, 0, 0],
  ['Honda', 'Pilot', 'SUV', 40000, 'Gas', 19, 27, ['AWD', 'FWD'], '3.5L V6', ['LX', 'EX-L', 'Touring', 'Elite'], 1, 0, 0, 0],
  ['Honda', 'Odyssey', 'Van', 38000, 'Gas', 19, 28, ['FWD'], '3.5L V6', ['LX', 'EX-L', 'Touring', 'Elite'], 1, 0, 0, 0],
  ['Ford', 'F-150', 'Truck', 38000, 'Gas', 20, 26, ['4WD', 'RWD'], '3.5L V6 EcoBoost', ['XL', 'XLT', 'Lariat', 'King Ranch'], 0, 0, .08, 0],
  ['Ford', 'Mustang', 'Coupe', 32000, 'Gas', 18, 26, ['RWD'], '5.0L V8', ['EcoBoost', 'GT', 'GT Premium'], 0, 0, 0, .3],
  ['Ford', 'Explorer', 'SUV', 38000, 'Gas', 20, 27, ['AWD', 'RWD'], '2.3L Turbo', ['Base', 'XLT', 'Limited', 'ST'], 1, 0, 0, 0],
  ['Ford', 'Escape', 'SUV', 29000, 'Gas', 27, 33, ['AWD', 'FWD'], '1.5L Turbo', ['S', 'SE', 'SEL', 'Titanium'], 0, .3, 0, 0],
  ['Ford', 'Bronco', 'SUV', 40000, 'Gas', 20, 22, ['4WD'], '2.7L V6 EcoBoost', ['Big Bend', 'Black Diamond', 'Outer Banks', 'Badlands'], 0, 0, 0, .1],
  ['Chevrolet', 'Silverado 1500', 'Truck', 38000, 'Gas', 17, 23, ['4WD', 'RWD'], '5.3L V8', ['WT', 'LT', 'RST', 'LTZ'], 0, 0, .1, 0],
  ['Chevrolet', 'Equinox', 'SUV', 28000, 'Gas', 26, 31, ['AWD', 'FWD'], '1.5L Turbo', ['LS', 'LT', 'RS', 'Premier'], 0, 0, 0, 0],
  ['Chevrolet', 'Malibu', 'Sedan', 25000, 'Gas', 29, 36, ['FWD'], '1.5L Turbo', ['LS', 'LT', 'RS', 'Premier'], 0, 0, 0, 0],
  ['Chevrolet', 'Camaro', 'Coupe', 31000, 'Gas', 19, 29, ['RWD'], '6.2L V8', ['1LT', '2LT', 'SS'], 0, 0, 0, .3],
  ['Chevrolet', 'Tahoe', 'SUV', 55000, 'Gas', 16, 20, ['4WD', 'RWD'], '5.3L V8', ['LS', 'LT', 'RST', 'Premier'], 1, 0, 0, 0],
  ['Tesla', 'Model 3', 'Sedan', 42000, 'Electric', 138, 126, ['RWD', 'AWD'], 'Electric Motor', ['Standard Range', 'Long Range', 'Performance'], 0, 0, 0, 0],
  ['Tesla', 'Model Y', 'SUV', 48000, 'Electric', 129, 112, ['AWD', 'RWD'], 'Electric Motor', ['Long Range', 'Performance', 'Standard Range'], 0, 0, 0, 0],
  ['Tesla', 'Model S', 'Sedan', 85000, 'Electric', 120, 115, ['AWD'], 'Electric Motor', ['Long Range', 'Plaid'], 0, 0, 0, 0],
  ['BMW', '3 Series', 'Sedan', 44000, 'Gas', 26, 36, ['RWD', 'AWD'], '2.0L Turbo', ['330i', '330i xDrive', 'M340i'], 0, 0, 0, 0],
  ['BMW', 'X5', 'SUV', 66000, 'Gas', 21, 26, ['AWD'], '3.0L Turbo I6', ['sDrive40i', 'xDrive40i', 'M50i'], 0, 0, 0, 0],
  ['BMW', 'M4', 'Coupe', 78000, 'Gas', 16, 23, ['RWD'], '3.0L Twin-Turbo I6', ['Base', 'Competition'], 0, 0, 0, .2],
  ['Mercedes-Benz', 'C-Class', 'Sedan', 46000, 'Gas', 25, 34, ['RWD', 'AWD'], '2.0L Turbo', ['C 300', 'C 300 4MATIC', 'AMG C 43'], 0, 0, 0, 0],
  ['Mercedes-Benz', 'GLC', 'SUV', 48000, 'Gas', 22, 29, ['AWD', 'RWD'], '2.0L Turbo', ['GLC 300', 'GLC 300 4MATIC', 'AMG GLC 43'], 0, 0, 0, 0],
  ['Audi', 'A4', 'Sedan', 42000, 'Gas', 24, 31, ['AWD'], '2.0L Turbo', ['Premium', 'Premium Plus', 'Prestige'], 0, 0, 0, 0],
  ['Audi', 'Q5', 'SUV', 46000, 'Gas', 23, 28, ['AWD'], '2.0L Turbo', ['Premium', 'Premium Plus', 'Prestige'], 0, 0, 0, 0],
  ['Nissan', 'Altima', 'Sedan', 26000, 'Gas', 28, 39, ['FWD', 'AWD'], '2.5L 4-Cyl', ['S', 'SV', 'SR', 'Platinum'], 0, 0, 0, 0],
  ['Nissan', 'Rogue', 'SUV', 29000, 'Gas', 30, 37, ['AWD', 'FWD'], '1.5L Turbo', ['S', 'SV', 'SL', 'Platinum'], 0, 0, 0, 0],
  ['Nissan', 'Frontier', 'Truck', 32000, 'Gas', 18, 24, ['4WD', 'RWD'], '3.8L V6', ['S', 'SV', 'PRO-4X'], 0, 0, 0, 0],
  ['Hyundai', 'Elantra', 'Sedan', 22000, 'Gas', 33, 42, ['FWD'], '2.0L 4-Cyl', ['SE', 'SEL', 'N Line', 'Limited'], 0, .15, 0, 0],
  ['Hyundai', 'Tucson', 'SUV', 28000, 'Gas', 26, 33, ['AWD', 'FWD'], '2.5L 4-Cyl', ['SE', 'SEL', 'N Line', 'Limited'], 0, .2, 0, 0],
  ['Hyundai', 'Sonata', 'Sedan', 26000, 'Gas', 28, 38, ['FWD'], '2.5L 4-Cyl', ['SE', 'SEL', 'N Line', 'Limited'], 0, .2, 0, 0],
  ['Hyundai', 'Palisade', 'SUV', 38000, 'Gas', 19, 26, ['AWD', 'FWD'], '3.8L V6', ['SE', 'SEL', 'Limited', 'Calligraphy'], 1, 0, 0, 0],
  ['Kia', 'Telluride', 'SUV', 38000, 'Gas', 20, 26, ['AWD', 'FWD'], '3.8L V6', ['LX', 'EX', 'SX', 'SX-Prestige'], 1, 0, 0, 0],
  ['Kia', 'Sportage', 'SUV', 28000, 'Gas', 25, 32, ['AWD', 'FWD'], '2.5L 4-Cyl', ['LX', 'EX', 'SX', 'X-Line'], 0, .15, 0, 0],
  ['Kia', 'K5', 'Sedan', 26000, 'Gas', 29, 38, ['FWD', 'AWD'], '1.6L Turbo', ['LX', 'LXS', 'GT-Line', 'EX'], 0, 0, 0, 0],
  ['Subaru', 'Outback', 'SUV', 31000, 'Gas', 26, 33, ['AWD'], '2.5L Boxer', ['Base', 'Premium', 'Limited', 'Touring'], 0, 0, 0, 0],
  ['Subaru', 'Crosstrek', 'SUV', 26000, 'Gas', 27, 34, ['AWD'], '2.0L Boxer', ['Base', 'Premium', 'Sport', 'Limited'], 0, 0, 0, .1],
  ['Subaru', 'WRX', 'Sedan', 33000, 'Gas', 19, 26, ['AWD'], '2.4L Turbo Boxer', ['Base', 'Premium', 'Limited', 'GT'], 0, 0, 0, .5],
  ['Mazda', 'Mazda3', 'Hatchback', 24000, 'Gas', 28, 36, ['FWD', 'AWD'], '2.5L 4-Cyl', ['Base', 'Select', 'Preferred', 'Turbo'], 0, 0, 0, .15],
  ['Mazda', 'CX-5', 'SUV', 29000, 'Gas', 25, 31, ['AWD', 'FWD'], '2.5L 4-Cyl', ['S', 'Select', 'Preferred', 'Turbo Signature'], 0, 0, 0, 0],
  ['Jeep', 'Wrangler', 'SUV', 38000, 'Gas', 17, 23, ['4WD'], '3.6L V6', ['Sport', 'Sport S', 'Sahara', 'Rubicon'], 0, 0, 0, .25],
  ['Jeep', 'Grand Cherokee', 'SUV', 42000, 'Gas', 19, 26, ['4WD', 'RWD'], '3.6L V6', ['Laredo', 'Limited', 'Overland', 'Summit'], 0, 0, 0, 0],
  ['Ram', 'Ram 1500', 'Truck', 40000, 'Gas', 17, 23, ['4WD', 'RWD'], '5.7L HEMI V8', ['Tradesman', 'Big Horn', 'Laramie', 'Rebel'], 0, 0, .1, 0],
  ['Volkswagen', 'Jetta', 'Sedan', 22000, 'Gas', 30, 41, ['FWD'], '1.5L Turbo', ['S', 'Sport', 'SE', 'SEL'], 0, 0, 0, .1],
  ['Volkswagen', 'Tiguan', 'SUV', 29000, 'Gas', 22, 29, ['AWD', 'FWD'], '2.0L Turbo', ['S', 'SE', 'SEL', 'SEL R-Line'], 0, 0, 0, 0],
  ['Volkswagen', 'Golf GTI', 'Hatchback', 32000, 'Gas', 24, 33, ['FWD'], '2.0L Turbo', ['S', 'SE', 'Autobahn'], 0, 0, 0, .4],
  ['Lexus', 'RX', 'SUV', 50000, 'Gas', 20, 27, ['AWD', 'FWD'], '3.5L V6', ['RX 350', 'RX 350 Premium', 'RX 350 F Sport'], 0, 0, 0, 0],
  ['Lexus', 'ES', 'Sedan', 43000, 'Gas', 22, 33, ['FWD'], '3.5L V6', ['ES 350', 'ES 350 Luxury', 'ES 350 F Sport'], 0, 0, 0, 0],
  ['GMC', 'Sierra 1500', 'Truck', 40000, 'Gas', 17, 23, ['4WD', 'RWD'], '5.3L V8', ['SLE', 'Elevation', 'SLT', 'Denali'], 0, 0, .08, 0],
  ['Dodge', 'Charger', 'Sedan', 33000, 'Gas', 19, 30, ['RWD', 'AWD'], '3.6L V6', ['SXT', 'GT', 'R/T', 'Scat Pack'], 0, 0, 0, 0],
  ['Volvo', 'XC60', 'SUV', 46000, 'Gas', 23, 31, ['AWD'], '2.0L Turbo', ['Momentum', 'R-Design', 'Inscription'], 0, 0, 0, 0],
  ['Toyota', 'Sienna', 'Van', 38000, 'Hybrid', 36, 36, ['FWD', 'AWD'], '2.5L Hybrid', ['LE', 'XLE', 'Limited', 'Platinum'], 1, 1, 0, 0],
  ['Chrysler', 'Pacifica', 'Van', 40000, 'Gas', 19, 28, ['FWD', 'AWD'], '3.6L V6', ['Touring', 'Touring L', 'Limited', 'Pinnacle'], 1, 0, 0, 0],
  ['Chevrolet', 'Bolt EV', 'Hatchback', 31000, 'Electric', 127, 108, ['FWD'], 'Electric Motor', ['LT', 'Premier'], 0, 0, 0, 0],
  ['Nissan', 'Leaf', 'Hatchback', 30000, 'Electric', 123, 99, ['FWD'], 'Electric Motor', ['S', 'SV Plus', 'SL Plus'], 0, 0, 0, 0],
  ['Ford', 'Mustang Mach-E', 'SUV', 46000, 'Electric', 100, 94, ['AWD', 'RWD'], 'Electric Motor', ['Select', 'Premium', 'GT'], 0, 0, 0, 0],
  ['Hyundai', 'Ioniq 5', 'SUV', 43000, 'Electric', 114, 98, ['AWD', 'RWD'], 'Electric Motor', ['SE', 'SEL', 'Limited'], 0, 0, 0, 0]
];
const LUXURY = new Set(['BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Volvo', 'Tesla']);
const TRUCKY_SUVS = new Set(['Tahoe', 'Bronco', 'Wrangler', 'Grand Cherokee', 'Explorer', 'Pilot', 'Highlander', 'Telluride', 'Palisade', 'X5']);

// ---------- dealers & zips ----------
const ZIPS = [
  ['75201', 'Dallas', 'TX', 32.7876, -96.7994], ['75219', 'Dallas', 'TX', 32.8118, -96.8085], ['75024', 'Plano', 'TX', 33.0789, -96.8185],
  ['75093', 'Plano', 'TX', 33.0198, -96.7698], ['75034', 'Frisco', 'TX', 33.1285, -96.8236], ['75070', 'McKinney', 'TX', 33.1893, -96.7013],
  ['75013', 'Allen', 'TX', 33.1032, -96.6706], ['76102', 'Fort Worth', 'TX', 32.7555, -97.3308], ['76107', 'Fort Worth', 'TX', 32.7488, -97.3643],
  ['76011', 'Arlington', 'TX', 32.7557, -97.0848], ['75038', 'Irving', 'TX', 32.8573, -96.9420], ['75040', 'Garland', 'TX', 32.9126, -96.6389],
  ['75080', 'Richardson', 'TX', 32.9483, -96.7299], ['76201', 'Denton', 'TX', 33.2148, -97.1331], ['76701', 'Waco', 'TX', 31.5493, -97.1467],
  ['77002', 'Houston', 'TX', 29.7589, -95.3677], ['77056', 'Houston', 'TX', 29.7405, -95.4659], ['77449', 'Katy', 'TX', 29.8058, -95.7456],
  ['78701', 'Austin', 'TX', 30.2711, -97.7437], ['78664', 'Round Rock', 'TX', 30.5083, -97.6789], ['78205', 'San Antonio', 'TX', 29.4241, -98.4936]
];
const zipLL = Object.fromEntries(ZIPS.map(z => [z[0], [z[3], z[4]]]));
const DEALERS = [
  ['D01', 'Lone Star Auto Group', '1200 Demo Parkway', 'Dallas', 'TX', '75201', '(214) 555-0101', 4.7, 1860, 'Full-line used dealer', '#0b3d91', 1998],
  ['D02', 'Plano Premier Motors', '4500 Sample Drive', 'Plano', 'TX', '75024', '(972) 555-0112', 4.8, 1320, 'Luxury and import specialists', '#6a1b9a', 2004],
  ['D03', 'Frisco Family Auto', '880 Placeholder Lane', 'Frisco', 'TX', '75034', '(469) 555-0123', 4.6, 940, 'Family SUVs, minivans and trucks', '#00796b', 2011],
  ['D04', 'McKinney Motor Co.', '310 Example Street', 'McKinney', 'TX', '75070', '(972) 555-0134', 4.5, 610, 'Locally owned, no-haggle pricing', '#ef6c00', 2007],
  ['D05', 'Fort Worth Car Depot', '2750 Mockingbird Way', 'Fort Worth', 'TX', '76102', '(817) 555-0145', 4.4, 1475, 'Trucks and work vehicles', '#455a64', 1995],
  ['D06', 'Arlington Auto Plaza', '9100 Sandbox Blvd', 'Arlington', 'TX', '76011', '(817) 555-0156', 4.3, 788, 'Budget-friendly commuters', '#c62828', 2002],
  ['D07', 'Irving Import Center', '615 Fictional Court', 'Irving', 'TX', '75038', '(972) 555-0167', 4.7, 1102, 'Certified imports', '#1565c0', 2009],
  ['D08', 'Garland Value Motors', '1440 Testbed Road', 'Garland', 'TX', '75040', '(972) 555-0178', 4.2, 530, 'Value-priced used cars', '#2e7d32', 2000],
  ['D09', 'Richardson Auto Mall', '700 Demo Circle', 'Richardson', 'TX', '75080', '(972) 555-0189', 4.6, 1390, 'Multi-brand auto mall', '#ad1457', 2013],
  ['D10', 'Houston Gulf Autos', '5800 Prototype Ave', 'Houston', 'TX', '77002', '(713) 555-0190', 4.5, 2210, 'Gulf Coast volume dealer', '#00838f', 1993],
  ['D11', 'Austin Capital Cars', '1900 Staging Street', 'Austin', 'TX', '78701', '(512) 555-0141', 4.8, 1675, 'Hybrids, EVs and Subarus', '#558b2f', 2015],
  ['D12', 'Alamo City Motors', '3300 Dummy Drive', 'San Antonio', 'TX', '78205', '(210) 555-0152', 4.4, 960, 'Trucks, SUVs and family cars', '#6d4c41', 2006]
];
const HOURS = 'Mon-Sat 9:00 AM - 8:00 PM, Sun 12:00 PM - 6:00 PM';

// ---------- csv helpers ----------
const csvCell = v => { v = String(v == null ? '' : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const toCSV = (cols, rows) => [cols.join(','), ...rows.map(r => cols.map(c => csvCell(r[c])).join(','))].join('\n') + '\n';

// ---------- build dealers / zips ----------
const dealerRows = DEALERS.map(d => {
  const [lat, lng] = zipLL[d[5]];
  return {
    dealer_id: d[0], name: d[1], address: d[2], city: d[3], state: d[4], zip: d[5], phone: d[6],
    email: 'sales@' + d[1].toLowerCase().replace(/[^a-z]+/g, '') + '.example.com', rating: d[7], review_count: d[8],
    lat: (lat + between(-0.01, 0.01)).toFixed(4), lng: (lng + between(-0.01, 0.01)).toFixed(4),
    hours: HOURS, established: d[11], specialty: d[9], brand_color: d[10],
    description: d[1] + ' is a fictional demo dealership in ' + d[3] + ', ' + d[4] + '. ' + d[9] + '. Every listing includes a free vehicle history summary and a 7-day return window.',
    logo: 'images/dealers/' + d[0] + '.svg'
  };
});
const zipRows = ZIPS.map(z => ({ zip: z[0], city: z[1], state: z[2], lat: z[3], lng: z[4] }));

// ---------- build vehicles ----------
const NOW_YEAR = 2026;
const EXT = [['White', 22], ['Black', 20], ['Silver', 14], ['Gray', 18], ['Blue', 11], ['Red', 8], ['Green', 2], ['Orange', 2], ['Brown', 2], ['Yellow', 1]];
const INT_STD = [['Black', 60], ['Gray', 25], ['Tan', 15]];
const INT_LUX = [['Black', 45], ['Tan', 20], ['Brown', 18], ['Gray', 12], ['Red', 5]];
const BASE = ['Bluetooth', 'Backup Camera', 'USB Port', 'Cruise Control'];
const MID = ['Apple CarPlay', 'Android Auto', 'Keyless Entry', 'Alloy Wheels', 'Lane Departure Warning'];
const HIGH = ['Sunroof', 'Leather Seats', 'Heated Seats', 'Navigation', 'Blind Spot Monitor', 'Adaptive Cruise Control', 'Premium Audio', 'Remote Start', 'Ventilated Seats', 'Heated Steering Wheel'];

function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function vin() { const ch = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'; let s = 'WS'; for (let i = 0; i < 15; i++) s += ch[Math.floor(rnd() * ch.length)]; return s; }

const vehicles = [];
const PER_MODEL = 2;                       // every model gets >=2, then the rest are random
const queue = [];
MODELS.forEach(m => { for (let i = 0; i < PER_MODEL; i++) queue.push(m); });
const POPULAR = ['Camry', 'Civic', 'RAV4', 'CR-V', 'F-150', 'Silverado 1500', 'Model 3', 'Model Y', 'Accord', 'Explorer', 'Tacoma', 'Equinox', 'Wrangler', 'Mustang', 'Telluride', 'Highlander', 'Corolla', 'Tucson', 'Odyssey', 'Sienna', 'Bolt EV', 'Prius', 'Mazda3', 'Ioniq 5'];
MODELS.filter(m => POPULAR.includes(m[1])).forEach(m => queue.push(m));
MODELS.filter(m => POPULAR.slice(0, 8).includes(m[1])).forEach(m => queue.push(m));

let seq = 1001;
queue.forEach(m => {
  const [make, model, body, msrp, fuelBase, city0, hwy0, drives, engine0, trims, third, hybChance, dieselChance, manChance] = m;
  const year = weighted([[2026, 4], [2025, 8], [2024, 14], [2023, 14], [2022, 14], [2021, 13], [2020, 11], [2019, 9], [2018, 7], [2017, 6]]);
  const age = NOW_YEAR - year;
  const tier = Math.min(trims.length - 1, Math.floor(rnd() * trims.length));
  let trim = trims[tier], fuel = fuelBase, engine = engine0, city = city0, hwy = hwy0;
  if (fuelBase === 'Gas' && chance(hybChance)) { fuel = 'Hybrid'; engine = engine0.replace(/\dL .*/, m => m.split(' ')[0] + ' Hybrid'); city = Math.round(city0 * 1.45); hwy = Math.round(hwy0 * 1.1); trim += ' Hybrid'; }
  else if (fuelBase === 'Gas' && chance(dieselChance)) { fuel = 'Diesel'; engine = '3.0L Turbo Diesel'; city = 22; hwy = 29; }
  const drivetrain = pick(drives);

  // condition + mileage
  let condition = 'Used', miles;
  if ((year === 2026 && chance(0.85)) || (year === 2025 && chance(0.25))) { condition = 'New'; miles = Math.round(between(5, 60)); }
  else if (year >= 2019 && chance(0.3)) { condition = 'Certified'; }
  if (condition !== 'New') {
    miles = Math.max(900, Math.round((age === 0 ? between(800, 6000) : age * between(8500, 14500) + between(-1500, 3000)) / 10) * 10);
  }
  const expected = Math.max(0, age) * 11500;

  // market value, price
  let mv;
  if (condition === 'New') mv = msrp * [0.93, 1, 1.07, 1.15, 1.2][Math.min(4, tier)] * 1.02;
  else {
    const dep = 0.94 * Math.pow(0.92, age) * (LUXURY.has(make) ? Math.pow(0.965, age) : 1);
    mv = msrp * [0.93, 1, 1.07, 1.15, 1.2][Math.min(4, tier)] * Math.max(0.3, dep);
    mv -= (miles - expected) * 0.05;
    if (body === 'Truck') mv *= 1.06;
    if (condition === 'Certified') mv *= 1.04;
  }
  mv = Math.max(5500, roundTo(mv * 1.12, 50));
  const dealMult = weighted([[between(0.88, 0.93), 12], [between(0.93, 0.98), 28], [between(0.98, 1.04), 35], [between(1.04, 1.12), 25]]);
  const price = Math.max(4000, roundTo(mv * dealMult, 50));

  // history
  const accidents = condition === 'New' ? 0 : weighted([[0, 70], [1, 22], [2, 8]]);
  const owners = condition === 'New' ? 0 : weighted([[1, 50], [2, 35], [3, 15]]);

  // features
  const tierIdx = tier + (LUXURY.has(make) ? 1 : 0);
  const feats = [...BASE];
  if (year >= 2019 || tierIdx >= 1) MID.slice(0, 2 + Math.min(3, tierIdx + 1)).forEach(f => feats.push(f));
  shuffle(HIGH).slice(0, Math.min(HIGH.length, tierIdx * 2 + (year >= 2022 ? 1 : 0))).forEach(f => feats.push(f));
  if (year >= 2018 && tierIdx >= 1 && !feats.includes('Apple CarPlay')) feats.push('Apple CarPlay');
  if (third) feats.push('Third Row Seating');
  if (body === 'Truck' || TRUCKY_SUVS.has(model) && chance(0.6)) feats.push('Tow Package');
  if (fuel === 'Electric') { feats.push('Autopilot Assist', 'Over-the-Air Updates'); }
  const featList = [...new Set(feats)];

  const manual = body !== 'Truck' || model === 'Tacoma' ? chance(manChance) : false;
  const color = weighted(EXT);
  const interior = weighted(LUXURY.has(make) ? INT_LUX : INT_STD);
  const dealer = pick(DEALERS)[0];
  const days = Math.floor(between(1, 90));
  const listed = new Date(Date.UTC(2026, 10, 7) - days * 86400000).toISOString().slice(0, 10);
  const id = 'WS-' + (seq++);
  const keyFeats = featList.filter(f => ['Sunroof', 'Leather Seats', 'Heated Seats', 'Navigation', 'Third Row Seating', 'Tow Package', 'Apple CarPlay', 'Adaptive Cruise Control'].includes(f)).slice(0, 3);

  vehicles.push({
    id, vin: vin(), year, make, model, trim, body_style: body, condition, price, market_value: mv, mileage: miles,
    exterior_color: color, interior_color: interior, transmission: manual ? 'Manual' : 'Automatic', drivetrain, fuel_type: fuel, engine,
    mpg_city: city, mpg_hwy: hwy, accidents, owners, title_status: 'Clean', dealer_id: dealer, listed_date: listed,
    features: featList.join('|'),
    description: `${condition === 'New' ? 'Brand-new' : condition === 'Certified' ? 'Certified pre-owned' : 'Well-kept'} ${year} ${make} ${model} ${trim} in ${color} with ${interior.toLowerCase()} interior and ${miles.toLocaleString('en-US')} miles. ` +
      `${accidents === 0 ? 'No accidents reported' : accidents + ' accident(s) reported'}${owners === 1 ? ', one owner' : ''}. ` +
      `${keyFeats.length ? 'Highlights: ' + keyFeats.join(', ') + '. ' : ''}Powered by the ${engine}${drivetrain !== 'FWD' ? ' with ' + drivetrain : ''}.`,
    image: 'images/vehicles/' + id + '.svg'
  });
});

// guarantee a handful of EVs with low price & a few cheap commuters for demo queries
vehicles.sort((a, b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model) || b.year - a.year);
vehicles.forEach((v, i) => { v.id = 'WS-' + (1001 + i); v.image = 'images/vehicles/' + v.id + '.svg'; });

const VCOLS = ['id', 'vin', 'year', 'make', 'model', 'trim', 'body_style', 'condition', 'price', 'market_value', 'mileage', 'exterior_color', 'interior_color', 'transmission', 'drivetrain', 'fuel_type', 'engine', 'mpg_city', 'mpg_hwy', 'accidents', 'owners', 'title_status', 'dealer_id', 'listed_date', 'features', 'description', 'image'];
const DCOLS = ['dealer_id', 'name', 'address', 'city', 'state', 'zip', 'phone', 'email', 'rating', 'review_count', 'lat', 'lng', 'hours', 'established', 'specialty', 'brand_color', 'description', 'logo'];
const ZCOLS = ['zip', 'city', 'state', 'lat', 'lng'];

fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/vehicles.csv'), toCSV(VCOLS, vehicles));
fs.writeFileSync(path.join(ROOT, 'data/dealers.csv'), toCSV(DCOLS, dealerRows));
fs.writeFileSync(path.join(ROOT, 'data/zipcodes.csv'), toCSV(ZCOLS, zipRows));
console.log(`vehicles.csv: ${vehicles.length} rows | dealers.csv: ${dealerRows.length} rows | zipcodes.csv: ${zipRows.length} rows`);
