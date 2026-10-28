/*
 * LARVIVA Interactive Hatchery Journey — editable product dataset (English).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS FILE IS CONTENT, NOT CODE. Edit it to change what the module shows.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The object below is plain JSON (no functions, no comments inside the object),
 * so a CMS can serve the same shape from an API endpoint instead
 * (see README.md › "CMS integration"). `npm run build` also exports it to
 * data/larviva-journey.en.json.
 *
 * Translations: copy this file to e.g. larviva-journey.es.js, translate the
 * text values (keep every `id` unchanged) and point the module at it with
 * data-dataset / data-src. The interface code never needs editing.
 *
 * Field reference (products[]):
 *   id                 Stable identifier. Never translate or change once live.
 *   name               Product name exactly as it should be displayed.
 *   portfolio          "fish" | "shrimp" (must match a portfolios[].id).
 *   family             Product family name (used for grouping and screen readers).
 *   colorToken         Key of a --lj-family-<token> colour in src/larviva-journey.css
 *                      (all family colours come from the BioMar colour palette).
 *   productType        Feed type, e.g. "Microencapsulated feed". null = hidden.
 *   stages             Ids of stages and/or activities this product is relevant to.
 *                      Empty = product is listed under "Other products" without a mapping.
 *   application        Primary application (one sentence). null = hidden.
 *   description        Short description (one or two sentences). null = hidden.
 *   variants           Named diets/variants, e.g. ["Maintenance", "Maturation"].
 *   particleSize       null, or one of:
 *                        { type: "range",  min, max, unit, verified }
 *                        { type: "grades", values: [..], unit, label, verified }
 *                        { type: "text",   value, verified }
 *                      verified:false values are only shown while
 *                      settings.showUnverifiedSpecs is true, and are labelled
 *                      "Provisional" in the interface.
 *   technicalNotes     Array of short strings. Empty = hidden.
 *   url                Product detail page. null = the "View product details" link is omitted.
 *   markets            null = all markets, or e.g. ["NO", "VN"] to restrict.
 *   marketAvailability Free text shown to visitors, e.g. "Available in Vietnam". null = hidden.
 *   published          false = never shown (use for products not yet mapped).
 *   order              Sort order within the portfolio.
 *
 * CONTENT STATUS: product facts below come from the project brief and the
 * supplied LARVIVA range sheets. Particle sizes are PROVISIONAL and must be
 * verified against approved technical documentation before publication.
 * Stage descriptions are draft copy for marketing/technical approval.
 */
(function (root) {
  var data = {
    "version": 1,
    "locale": "en",
    "defaultPortfolio": "fish",

    "settings": {
      "showUnverifiedSpecs": true,
      "brandPrefix": "LARVIVA"
    },

    "ui": {
      "moduleTitle": "Explore the hatchery journey",
      "portfolioSwitchLabel": "Choose a hatchery portfolio",
      "instruction": "Select a stage or a product to explore the range.",
      "stagesHeading": "Development stages",
      "stageNumber": "Stage {n} of {total}",
      "activityLabel": "Connected activity",
      "productsHeading": "LARVIVA products by stage",
      "activitiesHeading": "Connected activities",
      "activitiesNote": "Run alongside the larval journey – not developmental stages.",
      "otherProductsHeading": "Other products",
      "relatedStage": "Relevant",
      "selectedState": "Selected",
      "stagesPrefix": "Stages:",
      "panelEmptyTitle": "Start strong at every stage",
      "statStages": "Development stages",
      "statProducts": "LARVIVA products",
      "panelEmptyText": "Select a stage to see the related LARVIVA products, or select a product for its details.",
      "relatedProductsHeading": "Related LARVIVA products",
      "noRelatedProducts": "No products are currently mapped to this stage.",
      "backToStage": "Back to {stage}",
      "clearSelection": "Clear selection",
      "productEyebrow": "{portfolio} hatchery",
      "fieldProductType": "Feed type",
      "fieldStages": "Stages",
      "fieldApplication": "Application",
      "fieldVariants": "Diets",
      "fieldParticleSize": "Particle size",
      "fieldTechnicalNotes": "Technical notes",
      "fieldMarkets": "Market availability",
      "sizeScaleLabel": "Particle size across the range",
      "viewDetails": "View product details",
      "provisional": "Provisional",
      "announceStage": "{stage} selected. {count} related products highlighted.",
      "announceProduct": "{product} selected. Product details updated.",
      "announcePortfolio": "{portfolio} portfolio shown.",
      "announceCleared": "Selection cleared.",
      "disclaimer": "Product selection depends on species, rearing system and local conditions – not on stage alone. Contact your BioMar representative for feeding recommendations."
    },

    "portfolios": [
      {
        "id": "fish",
        "label": "Fish",
        "icon": ["Icon-LARVIVA-fish-larvae-02"],
        "title": "Marine fish hatchery",
        "intro": "From first feeding to nursery, with broodstock nutrition and live-feed enrichment supporting the hatchery.",
        "stages": [
          {
            "id": "first-feeding",
            "label": "First feeding",
            "illustration": ["Icon-LARVIVA-fish-larvae-02"],
            "description": "Larvae begin feeding externally as their yolk reserves are used up. Live feed is typically used at this stage, and microdiets can be introduced alongside it."
          },
          {
            "id": "co-feeding-weaning",
            "label": "Co-feeding / Weaning",
            "illustration": ["Icon-LARVIVA-fish-larvae-02", "Icon-Fish-LARVIVA-rotifer"],
            "description": "Live feed and formulated feed are offered together while larvae are gradually weaned onto a formulated diet."
          },
          {
            "id": "post-weaning",
            "label": "Post-weaning",
            "illustration": ["placeholder-fish-fry"],
            "description": "Larvae and early fry are fully weaned onto formulated feed, with feed particle size increasing as they grow."
          },
          {
            "id": "nursery",
            "label": "Nursery",
            "illustration": ["placeholder-fish-juvenile"],
            "description": "Juveniles are grown on in nursery systems, including recirculating aquaculture systems (RAS), before transfer to on-growing."
          }
        ],
        "activities": [
          {
            "id": "broodstock-nutrition",
            "label": "Broodstock nutrition",
            "illustration": ["placeholder-fish-broodstock"],
            "description": "Nutrition for the broodstock that produce the hatchery's eggs, with diets for maintenance and maturation."
          },
          {
            "id": "live-feed-enrichment",
            "label": "Live-feed enrichment",
            "illustration": ["Icon-Fish-LARVIVA-rotifer", "Icon-Fish-LARVIVA-artemia"],
            "description": "Enrichment of rotifers and Artemia before they are fed to larvae."
          }
        ],
        "sizeChart": {
          "unit": "µm",
          "min": 0,
          "max": 1200,
          "ticks": [0, 200, 400, 600, 800, 1000, 1200]
        }
      },
      {
        "id": "shrimp",
        "label": "Shrimp",
        "icon": ["Icon-Shrimp-LARVIVA-PL"],
        "title": "Shrimp hatchery",
        "intro": "From the first feeding larval stages to post-larvae, with feed particle size increasing through the range.",
        "stages": [
          {
            "id": "zoea",
            "label": "Zoea",
            "illustration": ["Icon-Shrimp-LARVIVA-zoea"],
            "description": "The first feeding larval stage after the nauplius. Zoea take very fine feed particles."
          },
          {
            "id": "mysis",
            "label": "Mysis",
            "illustration": ["Icon-Shrimp-LARVIVA-mysis"],
            "description": "Larvae develop a more shrimp-like form and take larger feed particles than at the zoea stage."
          },
          {
            "id": "post-larvae",
            "label": "Post-larvae",
            "illustration": ["Icon-Shrimp-LARVIVA-PL"],
            "description": "Post-larvae resemble small shrimp and move on to progressively larger feed particles as they grow."
          }
        ],
        "activities": [],
        "sizeChart": {
          "unit": "µm",
          "min": 0,
          "max": 500,
          "ticks": [0, 100, 200, 300, 400, 500]
        }
      }
    ],

    "products": [
      {
        "id": "larviva-prostart",
        "name": "LARVIVA ProStart",
        "portfolio": "fish",
        "family": "ProStart",
        "colorToken": "prostart",
        "productType": "Microencapsulated feed",
        "stages": ["first-feeding", "co-feeding-weaning"],
        "application": "First feeding, co-feeding with live feed and early weaning.",
        "description": "Microencapsulated, high-protein larval feed for co-feeding with live feed and for early weaning.",
        "variants": [],
        "particleSize": { "type": "grades", "values": [100, 200, 300, 400], "unit": "µm", "label": "Average particle size grades", "verified": false },
        "technicalNotes": [],
        "url": null,
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "order": 10
      },
      {
        "id": "larviva-prowean",
        "name": "LARVIVA ProWean",
        "portfolio": "fish",
        "family": "ProWean",
        "colorToken": "prowean",
        "productType": "Extruded granules",
        "stages": ["co-feeding-weaning", "post-weaning", "nursery"],
        "application": "Weaning and early feeding of larvae and fry.",
        "description": "Extruded granulates for early feeding of larvae and marine fry.",
        "variants": [],
        "particleSize": { "type": "grades", "values": [100, 300, 500, 700, 900], "unit": "µm", "label": "Average particle size grades", "verified": false },
        "technicalNotes": [],
        "url": null,
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "order": 20
      },
      {
        "id": "larviva-pronurse",
        "name": "LARVIVA ProNurse",
        "portfolio": "fish",
        "family": "ProNurse",
        "colorToken": "pronurse",
        "productType": "Extruded mini-pellets",
        "stages": ["nursery"],
        "application": "Nursery stage in marine hatcheries and nurseries.",
        "description": "Premium extruded mini-pellets for marine hatcheries and nurseries.",
        "variants": [],
        "particleSize": { "type": "grades", "values": [500, 800, 1100], "unit": "µm", "label": "Average particle size grades", "verified": false },
        "technicalNotes": [],
        "url": null,
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "order": 30
      },
      {
        "id": "larviva-orbit",
        "name": "LARVIVA ORBIT",
        "portfolio": "fish",
        "family": "ORBIT",
        "colorToken": "orbit",
        "productType": null,
        "stages": ["nursery"],
        "application": "Nursery feeding in recirculating aquaculture systems (RAS).",
        "description": "Nursery feed for recirculating aquaculture systems (RAS).",
        "variants": [],
        "particleSize": null,
        "technicalNotes": [],
        "url": null,
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "order": 40
      },
      {
        "id": "larviva-broodstock",
        "name": "LARVIVA Broodstock",
        "portfolio": "fish",
        "family": "Broodstock",
        "colorToken": "broodstock",
        "productType": "Broodstock diet",
        "stages": ["broodstock-nutrition"],
        "application": "Broodstock nutrition.",
        "description": "Enhanced marine broodstock diets for maintenance and maturation.",
        "variants": ["Maintenance", "Maturation"],
        "particleSize": { "type": "grades", "values": [8], "unit": "mm", "label": "Pellet size", "verified": false },
        "technicalNotes": [],
        "url": null,
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "order": 50
      },
      {
        "id": "larviva-multigain",
        "name": "LARVIVA MultiGain",
        "portfolio": "fish",
        "family": "MultiGain",
        "colorToken": "multigain",
        "productType": "Enrichment formulation",
        "stages": ["live-feed-enrichment"],
        "application": "Enrichment of rotifers and Artemia.",
        "description": "Enrichment formulation that boosts the nutritional value of rotifers and Artemia.",
        "variants": [],
        "particleSize": { "type": "text", "value": "Powder", "verified": false },
        "technicalNotes": [],
        "url": null,
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "order": 60
      },

      {
        "id": "larviva-zoea",
        "name": "LARVIVA Zoea",
        "portfolio": "shrimp",
        "family": "LARVIVA",
        "colorToken": "zoea",
        "productType": "Microencapsulated feed",
        "stages": ["zoea"],
        "application": "Early feeding and co-feeding at the zoea stage.",
        "description": "Microencapsulated larval feed for early feeding and co-feeding.",
        "variants": [],
        "particleSize": { "type": "range", "min": 10, "max": 70, "unit": "µm", "verified": false },
        "technicalNotes": [],
        "url": null,
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "order": 10
      },
      {
        "id": "larviva-mysis",
        "name": "LARVIVA Mysis",
        "portfolio": "shrimp",
        "family": "LARVIVA",
        "colorToken": "mysis",
        "productType": "Microencapsulated feed",
        "stages": ["mysis"],
        "application": "Early feeding and co-feeding at the mysis stage.",
        "description": "Microencapsulated larval feed for early feeding and co-feeding.",
        "variants": [],
        "particleSize": { "type": "range", "min": 70, "max": 150, "unit": "µm", "verified": false },
        "technicalNotes": [],
        "url": null,
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "order": 20
      },
      {
        "id": "larviva-pl200",
        "name": "LARVIVA PL 200",
        "portfolio": "shrimp",
        "family": "LARVIVA PL",
        "colorToken": "pl200",
        "productType": "Extruded granules",
        "stages": ["post-larvae"],
        "application": "Post-larval shrimp feeding.",
        "description": "Extruded and granulated post-larval shrimp feed.",
        "variants": [],
        "particleSize": { "type": "range", "min": 150, "max": 250, "unit": "µm", "verified": false },
        "technicalNotes": [],
        "url": null,
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "order": 30
      },
      {
        "id": "larviva-pl300",
        "name": "LARVIVA PL 300",
        "portfolio": "shrimp",
        "family": "LARVIVA PL",
        "colorToken": "pl300",
        "productType": "Extruded granules",
        "stages": ["post-larvae"],
        "application": "Post-larval shrimp feeding.",
        "description": "Extruded and granulated post-larval shrimp feed.",
        "variants": [],
        "particleSize": { "type": "range", "min": 250, "max": 375, "unit": "µm", "verified": false },
        "technicalNotes": [],
        "url": null,
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "order": 40
      },
      {
        "id": "larviva-pl400",
        "name": "LARVIVA PL 400",
        "portfolio": "shrimp",
        "family": "LARVIVA PL",
        "colorToken": "pl400",
        "productType": "Extruded granules",
        "stages": ["post-larvae"],
        "application": "Post-larval shrimp feeding.",
        "description": "Extruded and granulated post-larval shrimp feed.",
        "variants": [],
        "particleSize": { "type": "range", "min": 375, "max": 500, "unit": "µm", "verified": false },
        "technicalNotes": [],
        "url": null,
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "order": 50
      },
      {
        "id": "larviva-zm",
        "name": "LARVIVA ZM",
        "portfolio": "shrimp",
        "family": "LARVIVA ZM",
        "colorToken": "zm",
        "productType": null,
        "stages": [],
        "application": null,
        "description": null,
        "variants": [],
        "particleSize": null,
        "technicalNotes": [],
        "url": null,
        "markets": null,
        "marketAvailability": null,
        "published": false,
        "order": 60
      }
    ]
  };

  if (typeof module === "object" && module.exports) {
    module.exports = data;
  } else {
    root.LARVIVA_JOURNEY_DATA = data;
  }
})(typeof window !== "undefined" ? window : globalThis);
