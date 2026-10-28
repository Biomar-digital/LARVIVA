# LARVIVA Interactive Hatchery Journey — prototype

A compact, interactive module for the LARVIVA landing page on biomar.com. Visitors switch between the **Fish** and **Shrimp** portfolios and select stages or products. A detail panel updates as they go.

The module follows BioMar's own LARVIVA range slide, on a white (`#ffffff`) background:
- **Chevron band:** stages run from light to dark blue, with white icons and labels underneath in sentence case. For fish, Broodstock nutrition and Live-feed enrichment lead the band as on the slide. They are marked "Supporting the hatchery" and announced as connected activities, not stages.
- **LARVIVA family tiles:** the LARVIVA wordmark sits above the family name in its family colour, on a light tint, under the stages each product covers. Shrimp tiles overlap the way the use ranges do: Zoea spans zoea and mysis, and Mysis spans mysis and post-larvae.
- **Details below, only when selected:** a compact card with the pack shot, description, attributes, colour-coded grades and the "View product details" button. When nothing is selected there is a single hint line, which keeps the module short (about 520 px for fish and 470 px for shrimp on desktop).
- **Particle size by larval stage (shrimp):** opens on demand with "Show particle size by larval stage".
- **No capitals** anywhere in the interface.

> **Content status.** Product data now comes from the supplied BioMar documents:
> - *LARVIVA particle sizes and colour code labels*
> - *2025-03 LARVIVA Hatchery presentation*
> - *Hatchery Segment*
>
> What that covers:
> - **Particle sizes:** fish grades (100–1100 µm, 8 mm broodstock, powder) and shrimp average sizes and ranges (zoea 40 µm / 10–70, mysis 90 µm / 70–150, PL 200/300/400).
> - **Use ranges:** Z1–M2, M1–PL2, PL2–PL6, PL6–PL11, PL10–PL15.
> - **Label colour codes per grade.**
> - **Packaging, and the Bactocell® / B-WYSE™ health additions.**
> - **INICIO Focus as the shrimp nursery feed.**
>
> Each particle-size block in the data names its `source`. INICIO Focus sizes differ between slides, so they stay flagged `verified: false`. Stage descriptions are still draft copy. Shrimp products link to their biomar.com pages. Fish product pages on biomar.com are per species, so no single link is set for them.

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
| Chevron band, white icons, labels beneath, family tiles with the LARVIVA wordmark | LARVIVA Marine Hatchery range slide |
| Family and grade colours | LARVIVA particle sizes and colour code labels (text colours darkened where needed for AA contrast) |
| Particle size by larval stage chart | LARVIVA Hatchery presentation 2025-03, slide 13 |
| Montserrat, navy text, product links | biomar.com |

The tile wordmark is set in text, not the real logo. For production, swap in the approved LARVIVA family logo files if the brand team prefers.

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
