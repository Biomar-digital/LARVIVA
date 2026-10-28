# LARVIVA Interactive Hatchery Journey — prototype

A compact, interactive module for the LARVIVA landing page on biomar.com. Visitors switch between the **Fish** and **Shrimp** portfolios and select stages or products. A detail panel updates as they go.

It follows the approved reference design and the live biomar.com LARVIVA page. The background is white (`#ffffff`).
- **Title:** changes with the portfolio ("Explore the shrimp hatchery journey") and has a one-line instruction beneath it.
- **Stages:**
  - **Layout:** a small number, an uppercase label and a large light-blue circle with the LARVIVA icon.
  - **Timeline:** a stem drops from each circle to a shared timeline with one node per stage.
  - **Selection:** the selected stage's node fills and its circle gets a ring.
- **LARVIVA PRODUCTS:** light-blue cards sit under the stages they cover, each with a chevron and an underline. The selected card turns BioMar Blue with a Leafy Green underline.
  - **LARVIVA PL:** one card listing PL 200 / PL 300 / PL 400, with each grade's particle size in the detail panel.
- **Product thumbnails:** each product card carries its pack shot. Narrow cards drop the thumbnail so the name keeps its room.
- **Fish activities:** "Connected hatchery activities" cards for LARVIVA Broodstock and MultiGain, each labelled with its activity (Broodstock nutrition, Live-feed enrichment) and kept outside the stage timeline.
- **Feature card (right):**
  - **When nothing is selected:** a BioMar hatchery photograph (the fish or shrimp beaker image from the LARVIVA page) with the portfolio intro.
  - **For a stage:** a large stage illustration with its description and related products.
  - **For a product:** a product-page view with the pack shot, "LARVIVA" above the product name, a short description, the attribute list, a particle-size scale and a navy "View product details" button.

> **Content status.**
> - **Product facts** come from the project brief and the supplied LARVIVA range sheets.
> - **Particle sizes** are all flagged `verified: false` and show a "Provisional" badge. They must be checked against approved technical documentation.
> - **Stage descriptions** are draft copy.
> - **Product links:** LARVIVA Zoea, Mysis and PL link to their existing biomar.com product pages. The fish products' pages on biomar.com are per species (for example `larviva-prowean-sea-bass`), so no single link is set for them. Pick a target page per market, or add species to the module.
> - **Pack shots:** taken from biomar.com product pages and served through the site's own image resizer. There is none for ProNurse, as no page was found. The PL image is the site's PL 400 can.
> - **Shrimp Nursery stage:** added to match the reference design. No LARVIVA product is mapped to it, because the sources place LARVIVA PL at post-larvae only.

## Run it

Open `index.html` in a browser. It needs no server and has no dependencies.

```bash
npm run build   # regenerate icons, JSON export and pre-rendered HTML after edits
```

```bash
npm test        # Playwright smoke test (desktop, keyboard, mobile, no-JS, height)
```

## Design

| Element | Source |
| --- | --- |
| Stage circles, timeline, product cards with underline, selected card in BioMar Blue with a Leafy Green line | Approved reference design |
| Montserrat, navy text, 6px radii, flat surfaces | biomar.com |
| Product detail: pack shot, "LARVIVA" over the product name, attribute list, navy button | biomar.com product pages |
| Colours | BioMar palette (Brand Guidelines 2026) |

Motion is limited to a small lift on hover and a short fade-up on load. All of it is disabled under reduced motion.

## Files

| File | What it is | Who edits it |
| --- | --- | --- |
| `data/larviva-journey.en.js` | **Product dataset**: stages, activities, products (including `url` and `image`) and UI strings. Pure JSON, with the field reference at the top of the file. | Marketing / content |
| `data/larviva-journey.en.json` | Generated JSON copy for CMS import or a `data-src` endpoint. | Generated |
| `assets/icons/*.svg` | **Icons.** `Icon-*.svg` are the supplied LARVIVA icons. `placeholder-*.svg` (fry, juvenile, broodstock) are stand-ins for stages with no supplied icon and must be replaced with approved artwork. | Design |
| `src/larviva-illustrations.js` | Icon registry, generated from `assets/icons/` by the build. | Generated |
| `src/larviva-journey.css` | Styles. **Design tokens** are in the first block. | Design / frontend |
| `src/larviva-journey.js` | Renderer and controller. Contains no content. | Frontend |
| `scripts/build.js` | Icons → registry, data → JSON, and pre-rendered HTML into `index.html`. | — |
| `scripts/smoke-test.js` | Browser test of all interactions. | — |

## How it behaves

- **On load**, Fish is selected. The panel shows a short welcome and the instruction.
- **Journey:** stage tiles run in a row, linked by a hashed line. Product pills sit beneath the stages they cover and grow in when a portfolio appears. Pills are packed into as few rows as possible, so adding products keeps the module short. A product can span several stages.
- **Connected activities:** Broodstock nutrition and Live-feed enrichment sit in a dashed row labelled "not developmental stages". Each has its product: LARVIVA Broodstock and MultiGain.
- **Selecting a stage** fills its timeline node, rings its circle and fades the other stages and the unrelated product cards (still selectable). The panel below shows the stage description and the related products.
- **Selecting a product** turns its card BioMar Blue with a green underline. Its stages get a filled node and a "Relevant" tag, and the panel shows the product page view.
- **The product panel** shows:
  - the name, feed type, particle size, stages, application and diets (empty fields are never shown)
  - a *particle size across the range* scale, which places the product among the rest of the portfolio
- **Switching Fish/Shrimp** resets the selection without reloading the page.
- **Responsive:**
  - **Desktop (≥ 1024 px):** the feature card sits to the right and stays in view while scrolling.
  - **Tablet:** the feature card moves below.
  - **Mobile (< 760 px):** the timeline scrolls sideways inside the module, and the product cards stack and name their stages. The panel scrolls into view on selection. The page never scrolls sideways.

### Accessibility
- **Controls:** the Fish/Shrimp switch follows the WAI-ARIA tabs pattern, with arrow keys, Home and End. Stages and products are `<button aria-pressed>`.
- **Screen readers:** a live region announces changes. Product pills include their stage names as text.
- **Non-colour cues:** the "Selected" and "Relevant" labels, the check mark and the outline-vs-filled pill styles all carry meaning without colour.
- **Focus and motion:** focus states are visible (Ocean Blue). Motion is limited to entrance, hover and selection, and reduced motion turns all of it off. Forced-colours mode is supported.
- **Headings:** the module starts at `h2`.

### SEO
`npm run build` writes a static version of the module between the `LARVIVA:START/END` markers in `index.html`. It contains both portfolios and every product's details in plain HTML. The script then swaps in the interactive version.

## Editing content (no code changes)

- **Product text:** `name`, `description`, `application`, `productType`.
- **Add a product:** add an object to `products`. Set `colorToken` to an existing family colour, or add `--lj-family-<token>` (and `--lj-on-family-<token>` if dark text fails contrast) using a BioMar palette colour.
- **Hide or remove a product:** set `"published": false`, or delete it. LARVIVA ZM is already in the data, unpublished and unmapped.
- **Stage associations:** edit `stages` (ids of stages and/or activities).
- **Particle sizes:** edit `particleSize` and set `"verified": true` once confirmed. For production, set `settings.showUnverifiedSpecs` to `false`.
- **Product link:** set `url`. The "View product details" link appears only when it is set.
- **Markets:** `markets: ["VN"]` together with `data-market="VN"` on the module. `null` means all markets.
- **Icons:** drop an SVG into `assets/icons/`, reference its file name in a stage's `illustration` (an array, so several icons can be combined), then run `npm run build`.
- **Translations:** copy the dataset per locale and translate the values, keeping every `id`. All interface strings are in `ui`.

## CMS integration notes

1. **Model three content types:**
   - **Portfolio:** label, title, intro, icon, size scale, ordered stages and activities.
   - **Stage/Activity:** label, description, icon(s).
   - **LARVIVA Product:** fields as in the dataset header. Stages is a multi-reference, Markets a multi-select and url a link.

   Use the CMS's localisation for translations, and a settings entry for `ui`.
2. **Serve the JSON** in the shape of `data/larviva-journey.en.json`, then mount it with `<section data-larviva-journey data-src="…" data-market="…">`.
3. **Server-render:** `LarvivaJourney.renderModule(LarvivaJourney.prepare(data, {market}), {interactive: false, illustrations})` is pure and runs in Node. Other stacks can reproduce the static markup in a template.
4. **Assets:** ship the CSS and JS through the site pipeline and map the tokens to the site's design-system variables. Everything is namespaced `.lj` / `lj-`. `LarvivaJourney.init(el, {market, illustrations, onChange})` exposes state changes for analytics.
5. **Before go-live:**
   - verify the particle sizes and set `showUnverifiedSpecs: false`
   - add the product URLs
   - replace the `placeholder-*` icons with approved artwork
   - get the copy approved
   - remove the prototype banner

## Not included (deliberately)

The range sheets also show Inicio Plus M, Inicio Focus/Maxio, Balance and Prime Perform. The brief didn't specify their mappings or specifications, so none are invented. They can be added through the dataset. The supplied shrimp *juvenile* icon is in `assets/icons/` but unused, because the brief's shrimp journey ends at post-larvae.
