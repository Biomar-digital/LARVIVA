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
 *   tileSubtitle       Line under the logo on the tile. null = the feed type.
 *   stages             Ids of stages and/or activities this product is relevant to.
 *                      Empty = product is listed under "Other products" without a mapping.
 *   startsMidStage,    true = the tile starts / ends halfway through its first /
 *   endsMidStage       last stage, as on the LARVIVA range slides.
 *   application        Primary application (one sentence). null = hidden.
 *   description        Short description (one or two sentences). null = hidden.
 *   variants           Named diets/variants, e.g. ["Maintenance", "Maturation"].
 *   particleSize       null, or one of:
 *                        { type: "range",  min, max, unit, verified }
 *                        { type: "grades", values: [..], unit, label, verified }
 *                        { type: "text",   value, verified }
 *                        { type: "set", unit, label, verified, source,
 *                          items: [{ label, average, min, max, useFrom, useTo, stageText, color }, ..] }
 *                      (one entry per grade; min/max/use* optional)
 *   use                Target larval stages as text, e.g. "Z1 – M2".
 *   packaging, health  Short texts shown in the product panel. null = hidden.
 *                      verified:false values are only shown while
 *                      settings.showUnverifiedSpecs is true, and are labelled
 *                      "Provisional" in the interface.
 *   technicalNotes     Array of short strings. Empty = hidden.
 *   url                Product detail page. null = the "View product details" link is omitted.
 *   image              Pack shot shown in the detail panel. null = no image.
 *   logo               Family logo (LARVIVA wordmark + family name) used on the
 *                      tile and in the detail card. The product name stays in
 *                      the HTML as text for screen readers and search.
 *   wordmark           Alternative to `logo`: a LARVIVA wordmark image shown
 *                      above the family name in text (used on the navy shrimp tiles).
 *   markets            null = all markets, or e.g. ["NO", "VN"] to restrict.
 *   marketAvailability Free text shown to visitors, e.g. "Available in Vietnam". null = hidden.
 *                      Tiles with a value get a dashed outline (regional product).
 *   published          false = never shown (use for products not yet mapped).
 *   order              Sort order within the portfolio.
 *
 * CONTENT STATUS: product facts below come from the supplied BioMar documents:
 * "LARVIVA particle sizes and colour code labels", the 2025-03 LARVIVA
 * Hatchery presentation and the Hatchery Segment overview. Each particle-size
 * block names its `source`. Values marked verified:false conflict between
 * sources (INICIO Focus sizes) and need technical confirmation.
 * Grade `color` values are the label colour codes (see --lj-grade-* in CSS).
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
      "moduleTitle": "",
      "portfolioSwitchLabel": "Choose a hatchery portfolio",
      "instruction": "Select a development stage or product to explore the LARVIVA range.",
      "stagesHeading": "Development stages",
      "stageNumber": "Stage {n} of {total}",
      "activityLabel": "Connected activity",
      "activityShort": "Supporting the hatchery",
      "productsHeading": "LARVIVA products",
      "activitiesHeading": "Connected hatchery activities",
      "activitiesNote": "Run alongside the larval journey – not developmental stages.",
      "otherProductsHeading": "Other products",
      "relatedStage": "Relevant",
      "stagesPrefix": "Stages:",
      "panelEmptyTitle": "Start strong at every stage",
      "panelEyebrow": "LARVIVA hatchery range",
      "panelEmptyText": "Select a stage or a product to see the details.",
      "relatedProductsHeading": "Related LARVIVA products",
      "noRelatedProducts": "No products are currently mapped to this stage.",
      "backToStage": "Back to {stage}",
      "clearSelection": "Clear selection",
      "productEyebrow": "{portfolio} hatchery",
      "fieldPortfolio": "Hatchery",
      "fieldProductType": "Feed type",
      "fieldStages": "Stages",
      "fieldApplication": "Application",
      "fieldVariants": "Diets",
      "fieldParticleSize": "Particle size",
      "fieldTechnicalNotes": "Technical notes",
      "fieldUse": "Use",
      "fieldPackaging": "Packaging",
      "fieldHealth": "Health",
      "viewProducts": "Products",
      "viewChart": "Show particle size by larval stage",
      "chartTitle": "Larval stage versus accepted feed particle size",
      "chartNote": "Boxes show each feed's particle size and target larval stages.",
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
        "titleLabel": "fish",
        "image": "https://www.biomar.com/media/ifnlox4f/larviva-fish-hatchery-beaker.jpg?width=720&format=webp&quality=80",
        "imageAlt": "Fish larvae in a laboratory beaker",
        "icon": ["Icon-Fish-LARVIVA-juvenile"],
        "title": "Marine fish hatchery",
        "activitiesInBand": true,
        "intro": "From first feeding to nursery, with broodstock nutrition and live-feed enrichment supporting the hatchery.",
        "stages": [
          {
            "id": "larval",
            "label": "Larval",
            "illustration": ["Icon-Fish-LARVIVA-larva-yolk"],
            "description": "Larvae begin feeding externally as their yolk reserves are used up – first on live feed, then on formulated feed offered alongside it while they are weaned."
          },
          {
            "id": "post-weaning",
            "label": "Post-weaning",
            "illustration": ["Icon-Fish-LARVIVA-fry"],
            "description": "Larvae and early fry are fully weaned onto formulated feed, with feed particle size increasing as they grow."
          },
          {
            "id": "nursery",
            "label": "Nursery",
            "illustration": ["Icon-Fish-LARVIVA-juvenile"],
            "description": "Juveniles are grown on in nursery systems, including recirculating aquaculture systems (RAS), before transfer to on-growing."
          }
        ],
        "activities": [
          {
            "id": "broodstock-nutrition",
            "label": "Broodstock",
            "illustration": ["Icon-Fish-LARVIVA-adult"],
            "description": "Nutrition for the broodstock that produce the hatchery's eggs, with diets for maintenance and maturation."
          },
          {
            "id": "live-feed-enrichment",
            "label": "Live feed",
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
        "titleLabel": "shrimp",
        "image": "https://www.biomar.com/media/0sugyz2l/larviva-shrimp-hatchery-beaker.jpg?width=720&format=webp&quality=80",
        "imageAlt": "Shrimp post-larvae in a laboratory beaker",
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
          },
          {
            "id": "shrimp-nursery",
            "label": "Nursery",
            "illustration": ["Icon-Shrimp-LARVIVA-juvenile"],
            "description": "Juvenile shrimp are grown on in nursery systems before transfer to on-growing."
          }
        ],
        "activitiesInBand": true,
        "activities": [
          {
            "id": "bioremediation",
            "label": "Bioremediation",
            "illustration": ["Icon-Shrimp-LARVIVA-water"],
            "description": "Probiotic treatments that keep water and pond soil in balance, breaking down organic matter and reducing ammonia and other toxic compounds."
          }
        ],
        "sizeChart": {
          "unit": "µm",
          "min": 0,
          "max": 500,
          "ticks": [0, 100, 200, 300, 400, 500]
        },
        "stageChart": {
          "unit": "µm",
          "max": 1200,
          "ticks": [
            0,
            200,
            400,
            600,
            800,
            1000,
            1200
          ],
          "axis": [
            "Z1",
            "Z2",
            "Z3",
            "M1",
            "M2",
            "M3",
            "PL1",
            "PL2",
            "PL3",
            "PL4",
            "PL5",
            "PL6",
            "PL7",
            "PL8",
            "PL9",
            "PL10",
            "PL11",
            "PL12",
            "PL13",
            "PL14",
            "PL15",
            "PL16",
            "PL17",
            "PL18",
            "PL19",
            "PL20",
            "PL21",
            "PL22",
            "PL23",
            "PL24",
            "PL25",
            "PL26"
          ],
          "stageSpans": {
            "zoea": [
              "Z1",
              "Z3"
            ],
            "mysis": [
              "M1",
              "M3"
            ],
            "post-larvae": [
              "PL1",
              "PL15"
            ],
            "shrimp-nursery": [
              "PL16",
              "PL26"
            ]
          },
          "source": "LARVIVA Hatchery presentation 2025-03, slide 13"
        }
      }
    ],

    "products": [
      {
        "variants": [],
        "technicalNotes": [],
        "url": null,
        "image": "https://www.biomar.com/media/qn3lc3de/larviva_alubags_25kg_prostart-200.png?width=480&format=webp&quality=80",
        "use": null,
        "packaging": null,
        "health": "With Bactocell®",
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "id": "larviva-prostart",
        "name": "LARVIVA ProStart",
        "logo": "assets/logos/larviva-prostart.png",
        "portfolio": "fish",
        "family": "ProStart",
        "colorToken": "prostart",
        "productType": "Microencapsulated feed",
        "stages": [
          "larval",
          "post-weaning"
        ],
        "endsMidStage": true,
        "application": "Co-feeding with live feed and early weaning.",
        "description": "Microencapsulated, high-protein larval feed for co-feeding with live feed and for early weaning.",
        "particleSize": {
          "type": "set",
          "unit": "µm",
          "label": "Average particle size",
          "verified": true,
          "source": "LARVIVA particle sizes and colour code labels (2025)",
          "items": [
            {
              "label": "100",
              "average": 100,
              "color": "cyan"
            },
            {
              "label": "200",
              "average": 200,
              "color": "lightgreen"
            },
            {
              "label": "300",
              "average": 300,
              "color": "orange"
            },
            {
              "label": "400",
              "average": 400,
              "color": "green"
            }
          ]
        },
        "order": 10
      },
      {
        "variants": [],
        "technicalNotes": [],
        "url": null,
        "image": "https://www.biomar.com/media/ds4d0fbl/larviva_bucket_prowean-300.png?width=480&format=webp&quality=80",
        "use": null,
        "packaging": null,
        "health": "With Bactocell® & B-WYSE™",
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "id": "larviva-prowean",
        "name": "LARVIVA ProWean",
        "logo": "assets/logos/larviva-prowean.png",
        "portfolio": "fish",
        "family": "ProWean",
        "colorToken": "prowean",
        "productType": "Extruded granules",
        "stages": [
          "larval",
          "post-weaning",
          "nursery"
        ],
        "startsMidStage": true,
        "application": "Early feeding of larvae and marine fry.",
        "description": "Extruded granulates for early feeding of larvae and marine fry.",
        "particleSize": {
          "type": "set",
          "unit": "µm",
          "label": "Average particle size",
          "verified": true,
          "source": "LARVIVA particle sizes and colour code labels (2025)",
          "items": [
            {
              "label": "100",
              "average": 100,
                "stageText": "Larval / post-weaning",
              "color": "cyan"
            },
            {
              "label": "300",
              "average": 300,
                "stageText": "Larval / post-weaning",
              "color": "orange"
            },
            {
              "label": "500",
              "average": 500,
                "stageText": "Nursery",
              "color": "darkgreen"
            },
            {
              "label": "700",
              "average": 700,
                "stageText": "Nursery",
              "color": "blue"
            },
            {
              "label": "900",
              "average": 900,
                "stageText": "Nursery",
              "color": "purple"
            }
          ]
        },
        "order": 20
      },
      {
        "variants": [],
        "technicalNotes": [],
        "url": null,
        "image": "https://www.biomar.com/media/rikercay/hatchery-hatchery-top-performance-inicio-plus-m.png?cc=0.26,0.1,0.26,0.12&width=320&format=webp&quality=80",
        "use": null,
        "packaging": null,
        "health": "With Bactocell® & B-WYSE™",
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "id": "inicio-plus-m",
        "name": "INICIO Plus M",
        "logo": "assets/logos/inicio-plus-m.svg",
        "brand": "INICIO",
        "portfolio": "fish",
        "family": "INICIO",
        "colorToken": "inicio-plus",
        "productType": "Extruded mini-pellets",
        "stages": [
          "post-weaning",
          "nursery"
        ],
        "startsMidStage": true,
        "application": "Fry, during the early life stages.",
        "description": "Premium extruded mini-pellets formulated for fry, based on highly digestible, palatable marine raw materials, for maximum growth, conversion and survival.",
        "particleSize": null,
        "order": 25
      },
      {
        "variants": [],
        "technicalNotes": [],
        "url": null,
        "image": "https://www.biomar.com/media/wt0brk3r/larviva-pronurse-alubag-800.png?width=480&format=webp&quality=80",
        "use": null,
        "packaging": null,
        "health": "With Bactocell® & B-WYSE™",
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "id": "larviva-pronurse",
        "name": "LARVIVA ProNurse",
        "logo": "assets/logos/larviva-pronurse.png",
        "portfolio": "fish",
        "family": "ProNurse",
        "colorToken": "pronurse",
        "productType": "Extruded mini-pellets",
        "stages": [
          "nursery"
        ],
        "application": "Marine hatcheries and nurseries.",
        "description": "Premium extruded mini-pellets for marine hatcheries and nurseries.",
        "particleSize": {
          "type": "set",
          "unit": "µm",
          "label": "Average particle size",
          "verified": true,
          "source": "LARVIVA particle sizes and colour code labels (2025)",
          "items": [
            {
              "label": "500",
              "average": 500,
              "color": "darkgreen"
            },
            {
              "label": "800",
              "average": 800,
              "color": "purple"
            },
            {
              "label": "1100",
              "average": 1100,
              "color": "navy"
            }
          ]
        },
        "order": 30
      },
      {
        "variants": [],
        "technicalNotes": [],
        "url": null,
        "image": "https://www.biomar.com/media/kbpnev30/fish-starter-top-performance-larviva-orbit.png?cc=0.26,0.1,0.26,0.12&width=320&format=webp&quality=80",
        "use": null,
        "packaging": null,
        "health": null,
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "id": "larviva-orbit",
        "tileSubtitle": "Recirculating aquaculture systems (RAS)",
        "name": "LARVIVA ORBIT",
        "logo": "assets/logos/larviva-orbit.png",
        "portfolio": "fish",
        "family": "ORBIT",
        "colorToken": "orbit",
        "productType": "Nursery feed concept",
        "stages": [
          "nursery"
        ],
        "application": "Marine nurseries operating recirculating aquaculture systems (RAS).",
        "description": "Feed concept designed for marine nurseries operating in RAS, for long-term performance, efficient use of space and water, and quality, robust juveniles.",
        "particleSize": null,
        "order": 40
      },
      {
        "variants": [
          "Maintenance",
          "Maturation"
        ],
        "technicalNotes": [],
        "url": null,
        "image": "https://www.biomar.com/media/q2kdp0j1/larviva-broodstock-maintenance-bucket.png?width=480&format=webp&quality=80",
        "use": null,
        "packaging": null,
        "health": "With Bactocell® & B-WYSE™",
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "id": "larviva-broodstock",
        "tileSubtitle": "Maintenance and maturation",
        "name": "LARVIVA Broodstock",
        "logo": "assets/logos/larviva-broodstock.png",
        "portfolio": "fish",
        "family": "Broodstock",
        "colorToken": "broodstock",
        "productType": "Broodstock diet",
        "stages": [
          "broodstock-nutrition"
        ],
        "application": "Broodstock maintenance and maturation.",
        "description": "Enhanced marine broodstock diets.",
        "particleSize": {
          "type": "set",
          "unit": "mm",
          "label": "Pellet size",
          "verified": true,
          "source": "LARVIVA particle sizes and colour code labels (2025)",
          "items": [
            {
              "label": "Maintenance",
              "average": 8,
              "color": "cyan"
            },
            {
              "label": "Maturation",
              "average": 8,
              "color": "lightgreen"
            }
          ]
        },
        "order": 50
      },
      {
        "variants": [],
        "technicalNotes": [],
        "url": null,
        "image": "https://www.biomar.com/media/jinltwtq/larviva-multigain-alubag.png?width=480&format=webp&quality=80",
        "use": null,
        "packaging": null,
        "health": "With Bactocell®",
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "id": "larviva-multigain",
        "name": "LARVIVA MultiGain",
        "logo": "assets/logos/larviva-multigain.png",
        "portfolio": "fish",
        "family": "MultiGain",
        "colorToken": "multigain",
        "productType": "Enrichment formulation",
        "stages": [
          "live-feed-enrichment"
        ],
        "application": "Enrichment of rotifers and Artemia.",
        "description": "Enrichment formulation that boosts the nutritional value of rotifers and Artemia.",
        "particleSize": {
          "type": "text",
          "value": "Powder",
          "verified": true,
          "source": "LARVIVA particle sizes and colour code labels (2025)",
          "color": "red"
        },
        "order": 60
      },
      {
        "variants": [],
        "technicalNotes": [],
        "url": "https://www.biomar.com/feed-services/all-feed/smartcare-balance-h-shrimp",
        "image": "https://www.biomar.com/media/i05djv5x/shrimp-bioremediation-water-treatment-smartcare-balance-h.png?cc=0.2,0.08,0.21,0.07&width=320&format=webp&quality=80",
        "use": null,
        "packaging": null,
        "health": null,
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "id": "smartcare-balance-h",
        "name": "SmartCare Balance H",
        "logo": "assets/logos/smartcare-balance-h.svg",
        "brand": "SmartCare",
        "portfolio": "shrimp",
        "family": "SmartCare Balance",
        "colorToken": "balance",
        "productType": "Probiotic mixture",
        "tileSubtitle": "Water treatment",
        "stages": [
          "bioremediation"
        ],
        "application": "Cultivation of shrimp larvae and juveniles.",
        "description": "Probiotic mixture of scientifically proven strains that improves water quality by degrading organic matter and reducing ammonium. An ideal complement to LARVIVA diets that inhibits the growth of vibrios.",
        "particleSize": null,
        "order": 1
      },
      {
        "variants": [],
        "technicalNotes": [],
        "url": "https://www.biomar.com/feed-services/all-feed/smartcare-balance-p-shrimp",
        "image": "https://www.biomar.com/media/qxnlatl4/shrimp-bioremediation-soil-treatment-smartcare-balance-h.png?cc=0.2,0.08,0.21,0.07&width=320&format=webp&quality=80",
        "use": null,
        "packaging": null,
        "health": null,
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "id": "smartcare-balance-p",
        "name": "SmartCare Balance P",
        "logo": "assets/logos/smartcare-balance-p.svg",
        "brand": "SmartCare",
        "portfolio": "shrimp",
        "family": "SmartCare Balance",
        "colorToken": "balance",
        "productType": "Probiotic mixture",
        "tileSubtitle": "Water and soil treatment",
        "stages": [
          "bioremediation"
        ],
        "application": "Water and soil treatment in shrimp ponds.",
        "description": "Probiotic mixture for pond water and soil. It degrades organic matter, reduces ammonia and other toxic compounds, and helps control pathogens and stabilise the microbial flora.",
        "particleSize": null,
        "order": 2
      },
      {
        "variants": [],
        "technicalNotes": [],
        "url": "https://www.biomar.com/feed-services/all-feed/larviva-zoea-shrimp",
        "image": "https://www.biomar.com/media/qrahdotw/larviva-zoea-can.png?width=480&format=webp&quality=80",
        "use": "Z1 – M2",
        "packaging": "Can 500 g · minimum order 1 box of 10 cans",
        "health": "With Bactocell®",
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "id": "larviva-zoea",
        "name": "LARVIVA Zoea",
        "wordmark": "assets/logos/larviva-wordmark-white.png",
        "portfolio": "shrimp",
        "family": "LARVIVA",
        "colorToken": "zoea",
        "productType": "Microencapsulated feed",
        "stages": ["zoea"],
        "application": "Early feeding and co-feeding.",
        "description": "Microencapsulated larval feed for early feeding and co-feeding.",
        "particleSize": {
          "type": "set",
          "unit": "µm",
          "label": "Particle size",
          "verified": true,
          "source": "LARVIVA Hatchery presentation 2025-03, slide 11; particle sizes and colour code labels",
          "items": [
            {
              "label": "Zoea",
              "average": 40,
              "min": 10,
              "max": 70,
              "useFrom": "Z1",
              "useTo": "M2",
              "color": "cyan"
            }
          ]
        },
        "order": 10
      },
      {
        "variants": [],
        "technicalNotes": [],
        "url": "https://www.biomar.com/feed-services/all-feed/larviva-mysis-shrimp",
        "image": "https://www.biomar.com/media/ztbbkybd/larviva-mysis-can.png?width=480&format=webp&quality=80",
        "use": "M1 – PL2",
        "packaging": "Can 500 g · minimum order 1 box of 10 cans",
        "health": "With Bactocell®",
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "id": "larviva-mysis",
        "name": "LARVIVA Mysis",
        "wordmark": "assets/logos/larviva-wordmark-white.png",
        "portfolio": "shrimp",
        "family": "LARVIVA",
        "colorToken": "mysis",
        "productType": "Microencapsulated feed",
        "stages": ["mysis"],
        "application": "Early feeding and co-feeding.",
        "description": "Microencapsulated larval feed for early feeding and co-feeding.",
        "particleSize": {
          "type": "set",
          "unit": "µm",
          "label": "Particle size",
          "verified": true,
          "source": "LARVIVA Hatchery presentation 2025-03, slide 11; particle sizes and colour code labels",
          "items": [
            {
              "label": "Mysis",
              "average": 90,
              "min": 70,
              "max": 150,
              "useFrom": "M1",
              "useTo": "PL2",
              "color": "lightgreen"
            }
          ]
        },
        "order": 20
      },
      {
        "variants": [],
        "technicalNotes": [],
        "url": "https://www.biomar.com/feed-services/all-feed/larviva-pl-shrimp",
        "image": "https://www.biomar.com/media/xgwk022k/larviva-pl-can-larval-shrimp-feed-400.png?width=480&format=webp&quality=80",
        "use": "PL2 – PL15",
        "packaging": "Can 1 kg · minimum order 1 box of 5 alu cans",
        "health": "With Bactocell® & B-WYSE™",
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "id": "larviva-pl",
        "name": "LARVIVA PL",
        "wordmark": "assets/logos/larviva-wordmark-white.png",
        "portfolio": "shrimp",
        "family": "LARVIVA PL",
        "colorToken": "pl",
        "productType": "Extruded granules",
        "stages": [
          "post-larvae"
        ],
        "application": "Post-larval feeding, from PL2 to PL15.",
        "description": "Extruded and granulated post-larval shrimp feed.",
        "particleSize": {
          "type": "set",
          "unit": "µm",
          "label": "Particle size",
          "verified": true,
          "source": "LARVIVA Hatchery presentation 2025-03, slide 11; particle sizes and colour code labels",
          "items": [
            {
              "label": "PL 200",
              "average": 200,
              "min": 150,
              "max": 250,
              "useFrom": "PL2",
              "useTo": "PL6",
              "color": "cyan"
            },
            {
              "label": "PL 300",
              "average": 300,
              "min": 250,
              "max": 375,
              "useFrom": "PL6",
              "useTo": "PL11",
              "color": "lightgreen"
            },
            {
              "label": "PL 400",
              "average": 400,
              "min": 375,
              "max": 500,
              "useFrom": "PL10",
              "useTo": "PL15",
              "color": "orange"
            }
          ]
        },
        "order": 30
      },
      {
        "variants": [],
        "technicalNotes": [],
        "url": "https://www.biomar.com/feed-services/all-feed/inicio-focus-shrimp",
        "image": "https://www.biomar.com/media/s0rlrsub/shrimp-starter-health-inicio-focus.png?cc=0.26,0.1,0.26,0.12&width=320&format=webp&quality=80",
        "use": "PL13 onwards",
        "packaging": "Bag 10 kg / 25 kg · minimum order 1 bag",
        "health": "With Bactocell® & B-WYSE™",
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "id": "inicio-focus",
        "name": "INICIO Focus",
        "logo": "assets/logos/inicio-focus.png",
        "brand": "INICIO",
        "portfolio": "shrimp",
        "family": "INICIO",
        "colorToken": "inicio",
        "brandNote": "BioMar nursery feed",
        "productType": "Extruded mini-pellets",
        "stages": [
          "shrimp-nursery"
        ],
        "application": "Hatchery and nursery systems, from around PL13.",
        "description": "Extruded mini-pellets from the SmartCare® programme that promote healthy, resilient juveniles. Ideal for intensive pre-breeding and raceway crops.",
        "particleSize": {
          "type": "set",
          "unit": "mm",
          "label": "Particle size",
          "verified": false,
          "source": "LARVIVA Hatchery presentation 2025-03, slides 9, 10 and 18 (sizes differ between slides)",
          "items": [
            {
              "label": "0.5",
              "average": 0.5,
              "useFrom": "PL13",
              "useTo": "PL19",
              "color": "cyan"
            },
            {
              "label": "0.8",
              "average": 0.8,
              "useFrom": "PL17",
              "useTo": "PL23",
              "color": "lightgreen"
            },
            {
              "label": "1.1",
              "average": 1.1,
              "useFrom": "PL22",
              "useTo": "PL26",
              "color": "orange"
            }
          ]
        },
        "order": 40
      },
      {
        "variants": [],
        "technicalNotes": [],
        "url": "https://www.biomar.com/feed-services/all-feed/inicio-maxio-shrimp",
        "image": "https://www.biomar.com/media/lfdeidph/shrimp-starter-top-performance-inicio-maxio.png?cc=0.26,0.1,0.26,0.12&width=320&format=webp&quality=80",
        "use": null,
        "packaging": null,
        "health": null,
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "id": "inicio-maxio",
        "name": "INICIO Maxio",
        "logo": "assets/logos/inicio-maxio.svg",
        "brand": "INICIO",
        "portfolio": "shrimp",
        "family": "INICIO",
        "colorToken": "inicio-maxio",
        "productType": "Extruded mini-pellets",
        "stages": [
          "shrimp-nursery"
        ],
        "application": "All types of pre-rearing, in semi-intensive and intensive systems.",
        "description": "Part of EXIA’s smart nutrition range. Formulated to maximise growth from the start of the rearing cycle, for strong, uniform juveniles.",
        "particleSize": null,
        "order": 50
      },
      {
        "variants": [],
        "technicalNotes": [],
        "url": "https://www.biomar.com/feed-services/all-feed/inicio-prime-shrimp",
        "image": "https://www.biomar.com/media/u1pon4xs/shrimp-starter-high-performance-inicio-prime.png?cc=0.26,0.1,0.26,0.12&width=320&format=webp&quality=80",
        "use": null,
        "packaging": null,
        "health": null,
        "markets": null,
        "marketAvailability": null,
        "published": true,
        "id": "inicio-prime",
        "tileSubtitle": "Pre-rearing feed",
        "name": "INICIO Prime",
        "logo": "assets/logos/inicio-prime.svg",
        "brand": "INICIO",
        "portfolio": "shrimp",
        "family": "INICIO",
        "colorToken": "inicio-prime",
        "productType": null,
        "stages": [
          "shrimp-nursery"
        ],
        "application": "Pre-rearing.",
        "description": "Pre-rearing feed range developed for consistently high profitability and productivity, with a high growth rate and optimal feed conversion.",
        "particleSize": null,
        "order": 55
      },
      {
        "variants": [],
        "technicalNotes": [],
        "url": null,
        "image": null,
        "use": null,
        "packaging": null,
        "health": null,
        "markets": null,
        "marketAvailability": null,
        "published": false,
        "id": "larviva-zm",
        "name": "LARVIVA ZM",
        "portfolio": "shrimp",
        "family": "LARVIVA ZM",
        "colorToken": "zm",
        "productType": null,
        "stages": [],
        "application": null,
        "description": null,
        "particleSize": null,
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
