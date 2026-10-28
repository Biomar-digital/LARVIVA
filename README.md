# LARVIVA Interactive Hatchery Journey — prototype

A compact, interactive module for the LARVIVA landing page, styled to the **BioMar Brand Guidelines 2026**. Visitors switch between the **Fish** and **Shrimp** portfolios and select stages or products. A detail panel updates as they go.

It sits on a white (`#ffffff`) background so it blends into the page, and is about 540 px tall on desktop.
- **Journey:** a value-chain band taken from the BioMar corporate deck: joined chevrons running from light Sky Blue to deep navy, each carrying a LARVIVA icon.
- **Products:** "traceability" lines (as on the deck's Food Safety Value Chain slide) running beneath the stages each product covers. They are packed into as few rows as possible.
- **Fish activities:** a slim row for connected activities.
- **Detail panel:** a rounded Crisp Blue card styled like the deck's LARVIVA product slides: Ocean Blue label, large name, ticked hairline, bold italic feed type, and grey body text.

> **Content status.** Product facts come from the project brief and the supplied LARVIVA range sheets. Every particle size is flagged `verified: false` and shows a "Provisional" badge. They must be checked against approved technical documentation before publication. Stage descriptions are draft copy. No product URLs are set, so no "View product details" links appear yet.

## Run it

Open `index.html` in a browser. It needs no server and has no dependencies.

```bash
npm run build   # regenerate icons, JSON export and pre-rendered HTML after edits
```

```bash
npm test        # Playwright smoke test (desktop, keyboard, mobile, no-JS, height)
```

## Brand guidelines applied

| Guideline | Where |
| --- | --- |
| BioMar palette: BioMar Blue `#1f3e77`, Ocean Blue `#0471ad`, Sky Blue `#92cee8`, Crisp Blue `#c3e4ef`, Leafy Green `#97d130`, Wheat Yellow `#eab318`, Shrimp Orange `#dd6928`, Black-% greys | All colours are tokens at the top of `src/larviva-journey.css`. No off-palette colours are used. |
| Dark text is BioMar Blue; Black only where BioMar Blue can't be used | Text on Shrimp Orange is black, because BioMar Blue on orange fails contrast. |
| Avenir Next, Regular/Bold; Arial for digital when Avenir is unavailable | `--lj-font`. Headlines are bold with tracking 10, sub-headers bold with tracking 25. |
| Typography on white: headline and body BioMar Blue, accents Ocean Blue | Header, labels and panel. |
| Line detail | The ticked hairline under the module title and panel titles, as used on the corporate deck. |
| Corporate deck elements | The value-chain chevron band (slides 24 and 87), traceability lines (slide 87), the ticked title hairline, rounded Crisp Blue cards with BioMar Blue icon discs (slide 60), and the product-slide layout (slides 98–102). |
| Aquaculture iconography | The supplied LARVIVA icons, recoloured through `currentColor`. |

## Files

| File | What it is | Who edits it |
| --- | --- | --- |
| `data/larviva-journey.en.js` | **Product dataset**: stages, activities, products and UI strings. Pure JSON, with the field reference at the top of the file. | Marketing / content |
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
- **Selecting a stage** keeps its chevron at full strength with a "Selected" tag and fades the others. Related product lines stay coloured, while unrelated ones turn grey but remain visible and selectable. The panel shows the stage description and the related products.
- **Selecting a product** highlights its line, with a check mark and a thicker stroke. Its stages get a "Relevant" tag and the others fade.
- **The product panel** shows:
  - the name, feed type, particle size, stages, application and diets (empty fields are never shown)
  - a *particle size across the range* scale, which places the product among the rest of the portfolio
- **Switching Fish/Shrimp** resets the selection without reloading the page.
- **Responsive:**
  - **Desktop:** the panel sits to the right.
  - **Tablet:** the panel moves below.
  - **Mobile (< 760 px):** the chevron band becomes a swipeable strip, and the product lines become a list that names their stages. The panel goes below and scrolls into view on selection. The page never scrolls sideways.

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
