# Wheelspan 2.0 — Accuracy-First Visual Prototype

**Image status:** 17/158 listings have new AI-generated photo-style images; the remaining 141 retain properly labeled vector illustrations. This is not yet an all-photographic catalogue.

Open `index.html` directly, or run `python3 -m http.server 8000` from this folder and visit `http://localhost:8000`. 

All original Wheelspan navigation, inventory, filters, comparison, saved items, finance, sell/research, dealer pages, voice and demo AI are preserved.

New files: `data/ai_image_manifest.csv`, `data/ai_image_prompts.csv`, `images/ai-studio/`, `images/brand/detroit-showroom.webp`, and `tools/generate_exact_ai.py`. Full image audit in the ZIP parent folder.

Important: AI vehicle images are illustrative and are not verified photographs of the listed VINs. Some synthetic records have invalid or conflicting model-year/trim data. Resolve these before any real marketplace launch.

---

# Wheelspan demo marketplace

A used-car marketplace demo (home, search with filters, vehicle pages, dealers, sell, finance, research, compare, saved, and a natural-language "Wheelspan AI" search). Everything is driven by CSV files and a folder of images. All vehicles, dealers, prices and phone numbers are synthetic.

```
index.html            page shell
css/app.css           styles
js/carart.js          draws a car illustration from a CSV row (used by the image builder and as an on-the-fly fallback)
js/core.js            CSV loading, filtering, router
js/views.js           all pages
js/ai.js              Wheelspan AI (rule-based demo, no API key)
data/vehicles.csv     inventory  (one row per car)
data/dealers.csv      dealers    (one row per dealer; vehicles link to it with dealer_id)
data/zipcodes.csv     ZIP -> lat/lng used for "distance from me"
data/data.js          offline snapshot of the CSVs (auto-generated, only used if fetch() is unavailable)
images/vehicles/      one image per vehicle, named in the CSV "image" column
images/dealers/       one logo per dealer, named in the CSV "logo" column
tools/                generate_data.js (seed data), build_images.js (images + snapshot), import_photos.js (real photos)
photos/               drop your own photos + manifest here
```

## Run it
```
./serve.sh            # or: python3 -m http.server 8000   ->  http://localhost:8000
```
Open the printed address. The page re-reads the CSV files every 6 seconds, so saving a CSV updates the site without a refresh.
(Opening index.html directly from disk also works, but browsers block reading the CSVs there, so you get the built-in snapshot; use the footer's "Load CSV files..." button to load your own.)

## Change the data
* **Add / edit / remove a car:** edit `data/vehicles.csv`. Required columns are `id, year, make, model, trim, body_style, price, market_value, mileage, exterior_color, dealer_id`; keep the others filled in too (see existing rows). Deal rating is computed from `price / market_value`. `features` is a `|` separated list. Body style must be one of SUV, Sedan, Truck, Coupe, Hatchback, Van; colours: White, Black, Silver, Gray, Blue, Red, Green, Orange, Brown, Yellow.
* **Add / edit a dealer:** edit `data/dealers.csv`; a vehicle's `dealer_id` must match a `dealer_id` there.
* **Images:** each row's `image` column is a path such as `images/vehicles/WS-1001.svg`. Run `node tools/build_images.js` to (re)draw illustrations for every row (it never overwrites `.jpg`/`.png` you add yourself: just put your photo in the folder and point the CSV at it). If an image file is missing the page draws the illustration on the fly, so new rows always get a matching picture.
* **Start over with fresh sample data:** `node tools/generate_data.js && node tools/build_images.js`

## About the images (and how to use real photos)
Out of the box the pictures are original side-view illustrations, not photographs. The silhouette comes from `body_style`, the paint from `exterior_color`, and the caption from the same row, so a picture always matches its listing's make, model, body style and colour.

To use **real photos** (ones you took, licensed, or that are openly licensed; please do not copy dealer or marketplace listing photos without permission):
1. `node tools/import_photos.js --template` writes `photos/manifest_template.csv` (one row per vehicle).
2. Put your photos in `photos/`, copy the template to `photos/manifest.csv`, and fill `file` (and `exterior_color_in_photo` if the car's real colour differs from the row).
3. `node tools/import_photos.js` copies each photo to `images/vehicles/<id>.<ext>`, updates the CSV `image` column and, when you gave a colour, the row's `exterior_color`, so the colour filter, swatches and AI search stay correct. Rows without a photo keep their illustration.
Photos of any shape are shown on the same 8:5 frame. Before importing, blur or replace licence plates in your photos if you want them anonymous.

## About Wheelspan AI
Type or speak a request ("red SUV under $30k with a third row and no accidents"). A rule-based parser in `js/ai.js` converts it to the same filters the sidebar uses and shows real matches; follow-ups such as "cheaper" or "only AWD" refine the last search. Voice uses the browser's Web Speech API (works in Chrome/Edge/Safari when the microphone is allowed). No API key and no network calls. To plug in a real LLM, replace `parseNL()` with a call that returns `{ f, keys, reset, rel }`.
