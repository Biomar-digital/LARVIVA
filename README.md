# LARVIVA Interactive Hatchery Journey — prototype

A compact, interactive module for the LARVIVA landing page on biomar.com. Visitors switch between the **Fish** and **Shrimp** portfolios and select stages or products. A detail panel updates as they go.

The module follows BioMar's own LARVIVA range slide and is built to sit inside the LARVIVA page on biomar.com. It has no title of its own (the page provides it, for example "Explore the hatchery production cycle"). Its background is transparent, so it takes the page's light grey. The Fish/Shrimp switch uses the page's outlined filter buttons, and the tile band and detail card are flat white surfaces like the site's cards.
- **Chevron band:** stages run from light to dark blue, with white icons and labels underneath in sentence case. Fish follows the fish range slide: Broodstock › Live feed › Larval › Post-weaning › Nursery. Broodstock and Live feed lead the band as on the slide. They are marked "Supporting the hatchery" and announced as connected activities, not stages.
- **LARVIVA family tiles:** they use the official family logos (Broodstock, MultiGain, ProStart, ProWean, ProNurse, ORBIT, and INICIO Plus M, Focus, Maxio and Prime) on the slide's tints, under the stages each product covers. The shrimp LARVIVA tiles are navy with the white LARVIVA wordmark, as on the shrimp range slide. Product names stay in the HTML as text for screen readers and search. Tiles can start or end halfway through a stage (`startsMidStage` / `endsMidStage`), as ProStart, ProWean and INICIO Plus M do on the fish slide. The line under each logo is the feed type (or `tileSubtitle`), never the particle size; sizes appear in the detail card. Fish products have no links; shrimp products link to their biomar.com pages. Each shrimp product sits under its own stage only: Zoea under zoea, Mysis under mysis, PL under post-larvae, and INICIO Focus, Maxio and Prime under nursery. Bioremediation (SmartCare Balance H and P) leads the shrimp band as a connected activity, like Broodstock and Live feed for fish. The exact feeding windows (Z1–M2, M1–PL2 …) are shown in the product card.
- **Dimming stays readable:** unrelated tiles and stages lose their colour (grey logo, white tile, grey chevron) instead of fading with opacity, so all text stays at AA contrast.
- **Phones (< 760 px):** a stacked layout with one row per stage, each with the products used there directly beneath. Nothing scrolls sideways.
- **Details below, only when selected:** a compact card with the pack shot, description, attributes, colour-coded grades and the "View product details" button. When nothing is selected there is a single hint line, which keeps the module short (about 520 px for fish and 470 px for shrimp on desktop).
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
| Montserrat, navy text, product links | biomar.com |

The logo files in `assets/logos/` were extracted from the supplied BioMar PDFs (Hatchery Segment; particle sizes and colour code labels). They are 230–330 px raster images, sharp at their displayed size but slightly soft on high-density screens. Replace them with the vector logo files from the brand team for production; the dataset's `logo` / `wordmark` fields point to them.

## Files

| File | What it is | Who edits it |
| --- | --- | --- |
| `data/larviva-journey.en.js` | **Product dataset**: stages, activities, products (including `url` and `image`) and UI strings. Pure JSON, with the field reference at the top of the file. | Marketing / content |
| `data/larviva-journey.en.json` | Generated JSON copy for CMS import or a `data-src` endpoint. | Generated |
| `assets/icons/*.svg` | **Icons.** `Icon-*.svg` are the supplied LARVIVA icons. Two-tone icons keep their white details (eyes, yolk sac, bars, spots) as cut-outs in the surface colour behind them. | Design |
| `src/larviva-illustrations.js` | Icon registry, generated from `assets/icons/` by the build. | Generated |
| `src/larviva-journey.css` | Styles. **Design tokens** are in the first block. | Design / frontend |
| `src/larviva-journey.js` | Renderer and controller. Contains no content. | Frontend |
| `scripts/build.js` | Icons → registry, data → JSON, and pre-rendered HTML into `index.html`. | — |
| `scripts/smoke-test.js` | Browser test of all interactions. | — |

## How it behaves

- **On load**, Fish is selected. The panel shows a short welcome and the instruction.
- **Journey:** stage tiles run in a row, linked by a hashed line. Product pills sit beneath the stages they cover and grow in when a portfolio appears. Pills are packed into as few rows as possible, so adding products keeps the module short. A product can span several stages.
- **Connected activities:** Broodstock and Live feed lead the band, marked "Supporting the hatchery" and announced as connected activities, not stages. Each has its product: LARVIVA Broodstock and MultiGain.
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
- **Non-colour cues:** the "Relevant" label and the outline-vs-filled pill styles carry meaning without colour. The selected stage is announced through `aria-pressed`.
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

## Embedding on biomar.com (Umbraco)

- **Placement:** put the module in a block or partial on the LARVIVA page, inside the page's normal content container (the same width as the species picker). The section heading is ordinary page content above it. Point the module at it with `aria-labelledby`:

  ```html
  <h2 id="journey-heading">Explore the hatchery production cycle</h2>
  <section data-larviva-journey data-src="/api/larviva-journey?culture=en" aria-labelledby="journey-heading"></section>
  ```

- **No title or background of its own:** set `ui.moduleTitle` only if the module is ever used where the page gives no heading.
- **Fonts and colours:** Montserrat and the page colours are already on biomar.com. The demo page loads Montserrat itself only to stand in for the site.
- **Assets:** serve `assets/logos/*` and the icons from the Umbraco media library, and point the dataset's `logo` / `wordmark` / `image` fields at those media URLs.
- **Demo page:** `index.html` reproduces the page context (grey background, container gutters, intro text and section heading) so the module can be reviewed in place.

## Embedding with an iframe

`embed.html` is published with GitHub Pages at https://biomar-digital.github.io/LARVIVA/embed.html and updates automatically on every push to the branch Pages serves. It is the module on its own: transparent background, no page chrome, and `noindex`. It sends its height to the parent page so the iframe resizes without scrollbars. Add this to the host page (for example as an Umbraco rich-text/HTML block):

```html
<iframe id="larviva-journey" src="https://biomar-digital.github.io/LARVIVA/embed.html" title="LARVIVA hatchery production cycle"
        style="width:100%;border:0;display:block" height="600" loading="lazy"></iframe>
<script>
  window.addEventListener("message", function (e) {
    var frame = document.getElementById("larviva-journey");
    if (!e.data || e.source !== frame.contentWindow) return;
    if (e.data.type === "larviva-journey:height") frame.style.height = e.data.height + "px";
    // Phones: scroll to the product card the visitor just opened.
    if (e.data.type === "larviva-journey:scroll") {
      var y = frame.getBoundingClientRect().top + e.data.top;
      if (y < 0 || y > window.innerHeight * 0.7) window.scrollTo({ top: window.pageYOffset + y - 16, behavior: "smooth" });
    }
  });
</script>
```

Two limits of the iframe route:
- **Search engines:** content inside an iframe isn't counted as part of the LARVIVA page.
- **Fonts and styles:** the iframe loads its own copy of Montserrat.

For the final site, embedding the module directly (see the Umbraco section above) is better. The iframe is a quick way to preview it on the page.

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
   - get the copy approved
   - remove the prototype banner

## Not included (deliberately)

The shrimp range slide also shows LARVIVA ZM. It is left out on request (Zoea and Mysis stay separate products) and is in the data, unpublished. Pack shots with wide empty margins (INICIO, ORBIT, Balance) are cropped by the biomar.com image server with its `cc` parameter. The bioremediation wave icon (`Icon-Shrimp-LARVIVA-water.svg`) was drawn for this module after the slide; replace it with an official icon when one exists. The INICIO pack shots, links and descriptions come from their biomar.com product pages, and particle sizes for Plus M, Maxio and Prime are still to be added. The INICIO Plus M, Maxio and Prime and SmartCare Balance H and P logos come from the *Product brand guidelines 2025* (pages 46, 58, 57, 152 and 153) as vector SVGs.
