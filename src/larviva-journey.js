/*
 * LARVIVA Interactive Hatchery Journey — renderer and controller.
 *
 * Presentation logic only. Product content lives in data/larviva-journey.*.js
 * (or a CMS endpoint returning the same JSON), design tokens live at the top of
 * src/larviva-journey.css, and icons are generated from assets/icons/ into
 * src/larviva-illustrations.js.
 *
 * The same render functions run in the browser and in Node (scripts/build.js),
 * so the module can be pre-rendered as crawlable HTML and then enhanced.
 *
 * Usage:
 *   <section data-larviva-journey
 *            data-dataset="LARVIVA_JOURNEY_DATA"   (global set by the data file)
 *            data-src="/api/larviva-journey?lang=en" (alternative: fetch JSON)
 *            data-market="VN">                     (optional market filter)
 *   </section>
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.LarvivaJourney = api;
    if (root.document) {
      if (root.document.readyState === "loading") {
        root.document.addEventListener("DOMContentLoaded", function () { api.initAll(); });
      } else {
        api.initAll();
      }
    }
  }
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  var NARROW_QUERY = "(max-width: 759px)";
  var instanceCount = 0;

  /* ── Helpers ─────────────────────────────────────────────────────────── */

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fmt(template, values) {
    return String(template || "").replace(/\{(\w+)\}/g, function (m, key) {
      return values[key] != null ? values[key] : m;
    });
  }

  function attrs(map) {
    return Object.keys(map).filter(function (k) {
      return map[k] != null && map[k] !== false;
    }).map(function (k) {
      return map[k] === true ? " " + k : " " + k + '="' + esc(map[k]) + '"';
    }).join("");
  }

  function hasText(value) {
    return value != null && String(value).trim() !== "";
  }

  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  // Interactive controls are real <button>s; the static (no-JS) render uses
  // plain elements so nothing looks clickable that isn't.
  function control(interactive, attributes, inner) {
    if (interactive) {
      return "<button" + attrs(Object.assign({ type: "button" }, attributes)) + ">" + inner + "</button>";
    }
    var plain = Object.assign({}, attributes);
    delete plain["aria-pressed"];
    delete plain["aria-controls"];
    return "<div" + attrs(plain) + ">" + inner + "</div>";
  }

  function colorToken(product) {
    return String(product.colorToken || "default").replace(/[^a-z0-9-]/gi, "");
  }

  function accentToken(product) {
    return "var(--lj-family-" + colorToken(product) + ", var(--lj-family-default))";
  }

  function accentStyle(product) {
    return "--lj-accent: " + accentToken(product) + ";" +
      " --lj-on-accent: var(--lj-on-family-" + colorToken(product) + ", var(--lj-on-family-default));" +
      " --lj-regional: var(--lj-regional-" + colorToken(product) + ", var(--lj-regional-line));";
  }

  function iconHtml(illustrations, keys, extraClass) {
    keys = [].concat(keys || []).filter(function (k) { return illustrations[k]; });
    if (!keys.length) return "";
    return '<span class="lj-icon' + (extraClass ? " " + extraClass : "") + '" aria-hidden="true">' +
      keys.map(function (k) { return '<span class="lj-icon__item">' + illustrations[k] + "</span>"; }).join("") +
      "</span>";
  }

  // Splits "LARVIVA ProStart" into brand + name for the product label.
  function splitName(name, prefix) {
    if (prefix && name.indexOf(prefix + " ") === 0) {
      return { brand: prefix, rest: name.slice(prefix.length + 1) };
    }
    return { brand: "", rest: name };
  }

  // Consecutive stage indices → [[start, end], ...].
  function toRuns(indices) {
    var runs = [];
    indices.forEach(function (i) {
      var last = runs[runs.length - 1];
      if (last && i === last[1] + 1) last[1] = i;
      else runs.push([i, i]);
    });
    return runs;
  }

  // Bars are laid out on half-stage columns, so a product can start or end
  // partway through a stage (startsMidStage / endsMidStage), as on the
  // LARVIVA range slides.
  function toHalves(pr) {
    var halves = [];
    pr.stageIndices.forEach(function (c) { halves.push(2 * c, 2 * c + 1); });
    if (halves.length > 2 && pr.startsMidStage) halves.shift();
    if (halves.length > 2 && pr.endsMidStage) halves.pop();
    return halves;
  }

  // Places product bars in as few rows as possible without overlaps, so the
  // module stays compact however many products a portfolio has.
  function packRows(products) {
    var rows = [];
    products.forEach(function (pr) {
      var r = 0;
      while (rows[r] && pr.halfIndices.some(function (c) { return rows[r][c]; })) r++;
      rows[r] = rows[r] || {};
      pr.halfIndices.forEach(function (c) { rows[r][c] = true; });
      pr.row = r;
    });
    return rows.length;
  }

  /* ── Data preparation ────────────────────────────────────────────────── */

  var DEFAULT_UI = {
    stageNumber: "Stage {n} of {total}",
    relatedStage: "Relevant"
  };

  function isInMarket(product, market) {
    if (!market || !product.markets || !product.markets.length) return true;
    return product.markets.indexOf(market) !== -1;
  }

  function visibleSpec(spec, settings) {
    if (!spec) return null;
    if (spec.verified === false && !settings.showUnverifiedSpecs) return null;
    if (spec.type === "range" && (spec.min == null || spec.max == null)) return null;
    if (spec.type === "grades" && !(spec.values && spec.values.length)) return null;
    if (spec.type === "text" && !hasText(spec.value)) return null;
    if (spec.type === "set" && !(spec.items && spec.items.length)) return null;
    return spec;
  }

  function prepare(data, options) {
    options = options || {};
    var market = options.market || null;
    var settings = Object.assign({ showUnverifiedSpecs: false, brandPrefix: "" }, data.settings);
    var ui = Object.assign({}, DEFAULT_UI, data.ui);

    var portfolios = (data.portfolios || []).map(function (p) {
      var stages = (p.stages || []).map(function (s, i) {
        return Object.assign({}, s, { kind: "stage", index: i });
      });
      var activities = (p.activities || []).map(function (s) {
        return Object.assign({}, s, { kind: "activity" });
      });
      var lookup = {};
      stages.concat(activities).forEach(function (s) { lookup[s.id] = s; });
      // Columns of the band. Connected activities can lead the band (as on
      // the LARVIVA range slide); they stay marked as activities, not stages.
      var columns = (p.activitiesInBand ? activities : []).concat(stages);
      columns.forEach(function (c, i) { c.col = i; });

      var products = (data.products || []).filter(function (pr) {
        return pr.portfolio === p.id && pr.published !== false && isInMarket(pr, market);
      }).map(function (pr) {
        var ids = (pr.stages || []).filter(function (id) { return lookup[id]; });
        return Object.assign({}, pr, {
          stageIds: ids,
          stageIndices: ids.filter(function (id) { return lookup[id].col != null; })
            .map(function (id) { return lookup[id].col; })
            .sort(function (a, b) { return a - b; }),
          activityIds: ids.filter(function (id) { return lookup[id].kind === "activity"; }),
          particleSize: visibleSpec(pr.particleSize, settings),
          variants: pr.variants || [],
          technicalNotes: (pr.technicalNotes || []).filter(hasText)
        });
      }).sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

      var byId = {};
      products.forEach(function (pr) { byId[pr.id] = pr; });
      var laneProducts = products.filter(function (pr) { return pr.stageIndices.length; });
      laneProducts.forEach(function (pr) { pr.halfIndices = toHalves(pr); });
      var rowCount = packRows(laneProducts);

      return Object.assign({}, p, {
        stages: stages,
        activities: activities,
        columns: columns,
        lookup: lookup,
        products: products,
        productById: byId,
        laneProducts: laneProducts,
        rowCount: rowCount
      });
    }).filter(function (p) { return p.stages.length || p.products.length; });

    var defaultId = portfolios.some(function (p) { return p.id === data.defaultPortfolio; })
      ? data.defaultPortfolio
      : (portfolios[0] && portfolios[0].id);

    return { ui: ui, settings: settings, portfolios: portfolios, defaultPortfolio: defaultId, market: market };
  }

  /* ── Particle size ───────────────────────────────────────────────────── */

  function formatSize(spec) {
    if (!spec) return "";
    if (spec.type === "range") return spec.min + "–" + spec.max + " " + spec.unit;
    if (spec.type === "grades") return spec.values.join(" · ") + " " + spec.unit;
    if (spec.type === "set") {
      return spec.items.map(function (it) { return it.label + ": " + itemSize(it, spec.unit); }).join(", ");
    }
    return spec.value;
  }

  // "40 µm (10–70 µm)" or "500 µm" for one grade.
  function itemSize(it, unit) {
    var main = it.average != null ? it.average + " " + unit : "";
    var range = it.min != null && it.max != null ? it.min + "–" + it.max + " " + unit : "";
    if (main && range) return main + " (" + range + ")";
    return main || range;
  }

  // One grade in the product panel: "PL 200  200 µm (150–250)  PL2 – PL6".
  // A numeric label that equals the size ("100") is shown as "100 µm" once.
  function gradeLine(it, unit) {
    var sameAsSize = String(it.label) === String(it.average) && it.min == null;
    var size = it.min != null && it.max != null
      ? (it.average != null ? it.average + " " + unit + " (" + it.min + "–" + it.max + ")" : it.min + "–" + it.max + " " + unit)
      : (it.average != null ? it.average + " " + unit : "");
    var detail = it.useFrom ? it.useFrom + " – " + it.useTo : (it.stageText || "");
    return '<span class="lj-grade__label">' + esc(sameAsSize ? it.label + " " + unit : it.label) + "</span>" +
      (sameAsSize ? "" : '<span class="lj-grade__size">' + esc(size) + "</span>") +
      (detail ? '<span class="lj-grade__use">' + esc(detail) + "</span>" : "");
  }

  function toMicrons(value, unit) {
    return unit === "mm" ? value * 1000 : value;
  }

  function onScale(spec, scale) {
    if (!spec || !scale) return false;
    if (spec.type === "set") {
      if (scale.unit !== "µm" || (spec.unit !== "µm" && spec.unit !== "mm")) return false;
      return spec.items.every(function (it) {
        var v = it.max != null ? it.max : it.average;
        return v != null && toMicrons(v, spec.unit) <= scale.max;
      });
    }
    if (spec.unit !== scale.unit) return false;
    if (spec.type === "range") return spec.min >= scale.min && spec.max <= scale.max;
    if (spec.type === "grades") {
      return spec.values.every(function (v) { return v >= scale.min && v <= scale.max; });
    }
    return false;
  }

  // Short line under a product name: `tileSubtitle`, or the feed type
  // ("Microencapsulated", "Enrichment formulation"). Never sizes.
  function cardMeta(product) {
    if (hasText(product.tileSubtitle)) return product.tileSubtitle;
    return hasText(product.productType) ? String(product.productType).replace(/\s+feed$/i, "") : "";
  }

  function pct(value, scale) {
    return ((value - scale.min) / (scale.max - scale.min) * 100).toFixed(2) + "%";
  }

  /* ── Markup (shared by browser and pre-render) ───────────────────────── */

  function moduleTitle(ui, p) {
    return fmt(ui.moduleTitle, { portfolio: p.titleLabel || String(p.label || "").toLowerCase() });
  }

  function renderModule(model, options) {
    options = options || {};
    var interactive = options.interactive !== false;
    var o = {
      interactive: interactive,
      illustrations: options.illustrations || {},
      uid: options.uid || "lj"
    };
    var ui = model.ui;
    var active = model.defaultPortfolio;

    var html = '<div class="lj' + (interactive ? " lj--interactive" : " lj--static") + '">';
    // The section title normally comes from the host page (CMS); the module
    // only renders one when `ui.moduleTitle` is set.
    html += '<div class="lj-header">';
    if (hasText(ui.moduleTitle)) {
      var activePortfolio = model.portfolios.filter(function (p) { return p.id === active; })[0] || {};
      html += '<div class="lj-header__text"><h2 class="lj-title" data-lj-title>' + esc(moduleTitle(ui, activePortfolio)) + "</h2></div>";
    }

    if (interactive && model.portfolios.length > 1) {
      html += '<div class="lj-switch" role="tablist" aria-label="' + esc(ui.portfolioSwitchLabel) +
        '">';
      model.portfolios.forEach(function (p) {
        var selected = p.id === active;
        html += "<button" + attrs({
          type: "button",
          role: "tab",
          "class": "lj-switch__tab",
          id: o.uid + "-tab-" + p.id,
          "aria-selected": selected ? "true" : "false",
          "aria-controls": o.uid + "-panel-" + p.id,
          tabindex: selected ? null : "-1",
          "data-portfolio": p.id
        }) + ">" + iconHtml(o.illustrations, p.icon, "lj-switch__icon") + esc(p.label) + "</button>";
      });
      html += "</div>";
    }
    html += "</div>";

    model.portfolios.forEach(function (p) {
      html += renderPortfolio(model, p, Object.assign({ hidden: interactive && p.id !== active }, o));
    });

    if (hasText(ui.disclaimer)) html += '<p class="lj-disclaimer">' + esc(ui.disclaimer) + "</p>";
    if (interactive) html += '<p class="lj-vh" role="status" aria-live="polite" data-lj-status></p>';
    return html + "</div>";
  }

  function renderPortfolio(model, p, o) {
    var html = "<section" + attrs({
      "class": "lj-portfolio",
      id: o.uid + "-panel-" + p.id,
      role: o.interactive ? "tabpanel" : null,
      "aria-labelledby": o.uid + "-heading-" + p.id,
      "data-portfolio-panel": p.id,
      hidden: o.hidden
    }) + ">";
    html += '<h3 class="' + (o.interactive ? "lj-vh" : "lj-portfolio__title") + '" id="' + esc(o.uid + "-heading-" + p.id) + '">' +
      esc(p.title || p.label) + "</h3>";
    html += renderStages(model, p, o);
    html += renderSteps(model, p, o);
    html += renderLanes(model, p, o);
    if (!p.activitiesInBand) html += renderActivities(model, p, o);
    html += renderUnmapped(model, p, o);
    if (p.stageChart) {
      if (o.interactive) {
        html += '<button type="button" class="lj-textbtn lj-chart-toggle" data-action="chart" aria-expanded="false" aria-controls="' +
          esc(o.uid + "-chart-" + p.id) + '">' + esc(model.ui.viewChart) + "</button>";
      }
      html += renderStageChart(model, p, o);
    }
    if (o.interactive) {
      html += '<div class="lj-panel" id="' + esc(o.uid + "-detail-" + p.id) + '" data-lj-panel>' +
        renderPanel(model, p, { stage: null, product: null }, o) + "</div>";
    } else {
      html += renderProductIndex(model, p, o);
    }
    return html + "</section>";
  }

  function stageFlags(ui) {
    return '<span class="lj-flag lj-flag--related">' + esc(ui.relatedStage) + "</span>";
  }

  // The band follows the LARVIVA range slide: joined chevrons running from
  // light to dark with white icons, labels underneath in sentence case.
  function renderStages(model, p, o) {
    if (!p.columns.length) return "";
    var ui = model.ui;
    var n = p.stages.length;
    var html = '<h4 class="lj-vh">' + esc(ui.stagesHeading) + "</h4>";
    html += '<ol class="lj-stages" style="--lj-cols: ' + p.columns.length + '">';
    p.columns.forEach(function (s, i) {
      var tone = s.kind === "activity" ? "a" + (p.activities.indexOf(s) + 1)
        : String(s.index + 1);
      html += '<li class="lj-stages__item' + (s.kind === "activity" ? " lj-stages__item--activity" : "") + '" style="--i: ' + i +
        "; --lj-chev: var(--lj-tone-" + tone + ');">' + control(o.interactive, {
        "class": "lj-stage",
        "data-stage-id": s.id,
        "aria-pressed": "false",
        "aria-controls": o.uid + "-detail-" + p.id
      },
        '<span class="lj-stage__chev" aria-hidden="true">' + iconHtml(o.illustrations, s.illustration, "lj-stage__icon") + "</span>" +
        '<span class="lj-vh">' + esc(s.kind === "activity" ? ui.activityLabel : fmt(ui.stageNumber, { n: s.index + 1, total: n })) + ": </span>" +
        '<span class="lj-stage__label">' + esc(s.label) + "</span>" +
        (s.kind === "activity" ? '<span class="lj-stage__kind" aria-hidden="true">' + esc(ui.activityShort) + "</span>" : "") +
        stageFlags(ui)
      ) + "</li>";
    });
    return html + "</ol>";
  }

  // Phone layout: one row per stage (or connected activity) with the products
  // used there directly beneath. Shown instead of the band + tiles below
  // 760px, so nothing scrolls sideways. A product used in several stages
  // appears in each of them.
  function renderSteps(model, p, o) {
    if (!p.columns.length) return "";
    var ui = model.ui;
    var n = p.stages.length;
    var html = '<ol class="lj-steps">';
    p.columns.forEach(function (s) {
      var tone = s.kind === "activity" ? "a" + (p.activities.indexOf(s) + 1) : String(s.index + 1);
      var products = p.products.filter(function (pr) { return pr.stageIds.indexOf(s.id) !== -1; });
      html += '<li class="lj-steps__item' + (s.kind === "activity" ? " lj-steps__item--activity" : "") +
        '" style="--lj-chev: var(--lj-tone-' + tone + ');">' + control(o.interactive, {
        "class": "lj-stage lj-step",
        "data-stage-id": s.id,
        "aria-pressed": "false",
        "aria-controls": o.uid + "-detail-" + p.id
      },
        '<span class="lj-step__chev" aria-hidden="true">' + iconHtml(o.illustrations, s.illustration, "lj-stage__icon") + "</span>" +
        '<span class="lj-step__text"><span class="lj-vh">' +
        esc(s.kind === "activity" ? ui.activityLabel : fmt(ui.stageNumber, { n: s.index + 1, total: n })) + ": </span>" +
        '<span class="lj-stage__label">' + esc(s.label) + "</span>" +
        (s.kind === "activity" ? '<span class="lj-stage__kind" aria-hidden="true">' + esc(ui.activityShort) + "</span>" : "") +
        stageFlags(ui) + "</span>"
      );
      if (products.length) {
        html += '<ul class="lj-steps__products">' + products.map(function (pr) {
          return "<li>" + productPill(model, p, pr, o, "step") + "</li>";
        }).join("") + "</ul>";
      }
      html += "</li>";
    });
    return html + "</ol>";
  }

  var ARROW = '<svg class="lj-arrow" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">' +
    '<path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // Tile label: the official family logo when there is one (the name stays
  // as hidden text), else a wordmark image over the family name, else text.
  function productLabel(model, product) {
    var parts = splitName(product.name, product.brand || model.settings.brandPrefix);
    if (hasText(product.logo)) {
      return '<span class="lj-pill__name lj-pill__name--logo"><img class="lj-logo" src="' + esc(product.logo) +
        '" alt="" decoding="async"><span class="lj-vh">' + esc(product.name) + "</span></span>";
    }
    var brand = "";
    if (parts.brand && hasText(product.wordmark)) {
      brand = '<img class="lj-wordmark" src="' + esc(product.wordmark) + '" alt="' + esc(parts.brand) + '" decoding="async">';
    } else if (parts.brand) {
      brand = '<span class="lj-pill__brand">' + esc(parts.brand) + "</span> ";
    }
    return '<span class="lj-pill__name">' + brand + '<span class="lj-pill__family">' + esc(parts.rest) + "</span></span>";
  }

  function stageNames(p, product) {
    return product.stageIds.map(function (id) { return p.lookup[id].label; });
  }

  function productPill(model, p, product, o, variant, style, kicker) {
    var meta = cardMeta(product);
    return control(o.interactive, {
      "class": "lj-pill" + (variant ? " lj-pill--" + variant : "") +
        (hasText(product.marketAvailability) ? " lj-pill--regional" : ""),
      style: accentStyle(product) + (style || ""),
      "data-product-id": product.id,
      "aria-pressed": "false",
      "aria-controls": o.uid + "-detail-" + p.id
    },
      (hasText(product.image) ? '<span class="lj-pill__thumb" aria-hidden="true"><img src="' + esc(product.image) +
        '" alt="" loading="lazy" decoding="async"></span>' : "") +
      '<span class="lj-pill__text">' +
      (hasText(kicker) ? '<span class="lj-pill__kicker">' + esc(kicker) + "</span>" : "") +
      productLabel(model, product) +
      (hasText(meta) ? '<span class="lj-pill__meta">' + esc(meta) + "</span>" : "") +
      '<span class="lj-pill__stages"><span class="lj-vh">' + esc(model.ui.stagesPrefix) + " </span>" +
      esc(stageNames(p, product).join(" · ")) + "</span></span>" +
      CHEVRON
    );
  }

  var CHEVRON = '<svg class="lj-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
    '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';



  function renderLanes(model, p, o) {
    if (!p.laneProducts.length) return "";
    var html = '<h4 class="lj-vh">' + esc(model.ui.productsHeading) + "</h4>";
    html += '<ul class="lj-lanes" style="--lj-cols: ' + p.columns.length + "; --lj-halves: " + 2 * p.columns.length +
      "; --lj-rows: " + p.rowCount + '">';
    p.laneProducts.forEach(function (product, i) {
      toRuns(product.halfIndices).forEach(function (run, r) {
        var place = "grid-column: " + (run[0] + 1) + " / " + (run[1] + 2) + "; grid-row: " + (product.row + 1) + "; --i: " + i + ";";
        if (r === 0) {
          html += '<li class="lj-lanes__item" style="' + place + '">' + productPill(model, p, product, o, "bar") + "</li>";
        } else {
          // Extra segment for non-contiguous stages: visual only; the first
          // segment is the accessible control.
          html += '<li class="lj-lanes__item" style="' + place + '" aria-hidden="true">' +
            '<span class="lj-pill lj-pill--bar lj-pill--segment" data-segment-of="' + esc(product.id) + '" style="' +
            accentStyle(product) + '"></span></li>';
        }
      });
    });
    return html + "</ul>";
  }

  // Interactive version of the "larval stage versus accepted feed particle
  // size" chart from the LARVIVA hatchery presentation: each grade is a box
  // spanning its target larval stages (x) and particle size (y).
  function renderStageChart(model, p, o) {
    var chart = p.stageChart;
    var ui = model.ui;
    var axis = chart.axis;
    var n = axis.length;
    function xPct(code) { return (axis.indexOf(code) / n * 100).toFixed(3) + "%"; }
    function wPct(from, to) { return ((axis.indexOf(to) - axis.indexOf(from) + 1) / n * 100).toFixed(3) + "%"; }
    function yPct(v) { return (v / chart.max * 100).toFixed(3) + "%"; }

    var html = '<figure class="lj-chart" id="' + esc(o.uid + "-chart-" + p.id) + '"' + (o.interactive ? " hidden" : "") + ">";
    html += '<h4 class="lj-chart__title">' + esc(ui.chartTitle) + "</h4>";
    html += '<div class="lj-chart__frame" aria-hidden="true"><div class="lj-chart__plot">';
    // Stage bands along the top.
    p.stages.forEach(function (s) {
      var span = chart.stageSpans && chart.stageSpans[s.id];
      if (!span) return;
      html += '<span class="lj-chart__band" data-chart-stage="' + esc(s.id) + '" style="left: ' + xPct(span[0]) +
        "; width: " + wPct(span[0], span[1]) + ';"><span class="lj-chart__band-label">' + esc(s.label) + "</span></span>";
    });
    (chart.ticks || []).forEach(function (t) {
      html += '<span class="lj-chart__grid" style="bottom: ' + yPct(t) + '"><span>' + esc(t) + "</span></span>";
    });
    p.products.forEach(function (pr) {
      var spec = pr.particleSize;
      if (!spec || spec.type !== "set") return;
      spec.items.forEach(function (it) {
        if (!it.useFrom || axis.indexOf(it.useFrom) === -1 || axis.indexOf(it.useTo) === -1) return;
        var lo = toMicrons(it.min != null ? it.min : it.average, spec.unit);
        var hi = toMicrons(it.max != null ? it.max : it.average, spec.unit);
        var mid = (lo + hi) / 2;
        var h = Math.max(hi - lo, chart.max * 0.045);
        html += '<span class="lj-chart__box" data-chart-product="' + esc(pr.id) + '" data-product-id="' + esc(pr.id) + '" style="' +
          "--lj-grade: var(--lj-grade-" + esc(it.color || "default") + "); left: " + xPct(it.useFrom) +
          "; width: " + wPct(it.useFrom, it.useTo) + "; bottom: " + yPct(Math.max(0, mid - h / 2)) + "; height: " + yPct(h) + ';">' +
          '<span class="lj-chart__box-label">' + esc((pr.family === "INICIO" ? "INICIO " : "") + (spec.items.length > 1 || pr.family === "INICIO" ? (pr.family === "INICIO" ? "Focus " : "") + it.label : pr.name.replace(/^LARVIVA\s+/, ""))) + "</span></span>";
      });
    });
    html += "</div>";
    html += '<div class="lj-chart__axis">' + axis.map(function (code) {
      return "<span>" + esc(code) + "</span>";
    }).join("") + "</div>";
    html += '<span class="lj-chart__unit">' + esc(chart.unit) + "</span></div>";
    // Text equivalent for screen readers.
    html += '<ul class="lj-vh">';
    p.products.forEach(function (pr) {
      var spec = pr.particleSize;
      if (!spec || spec.type !== "set") return;
      spec.items.forEach(function (it) {
        if (it.useFrom) html += "<li>" + esc(pr.name + " " + (spec.items.length > 1 ? it.label + " " : "") + itemSize(it, spec.unit) + ", " + it.useFrom + " – " + it.useTo) + "</li>";
      });
    });
    html += "</ul>";
    if (hasText(ui.chartNote)) html += '<figcaption class="lj-chart__note">' + esc(ui.chartNote) + "</figcaption>";
    return html + "</figure>";
  }

  // Broodstock nutrition and live-feed enrichment support the hatchery but are
  // not developmental stages, so their products sit in a separate row,
  // each labelled with its activity.
  function renderActivities(model, p, o) {
    if (!p.activities.length) return "";
    var ui = model.ui;
    var items = [];
    p.activities.forEach(function (a) {
      p.products.forEach(function (pr) {
        if (pr.activityIds.indexOf(a.id) !== -1) items.push({ activity: a, product: pr });
      });
    });
    if (!items.length) return "";
    var html = '<div class="lj-activities">';
    html += '<div class="lj-activities__intro"><h4 class="lj-section-title">' + esc(ui.activitiesHeading) + "</h4>";
    if (hasText(ui.activitiesNote)) html += '<p class="lj-activities__note">' + esc(ui.activitiesNote) + "</p>";
    html += '</div><ul class="lj-activities__list">';
    items.forEach(function (it, i) {
      html += '<li class="lj-lanes__item" style="--i: ' + (p.laneProducts.length + i) + ';">' +
        productPill(model, p, it.product, o, "activity", "", it.activity.label) + "</li>";
    });
    return html + "</ul></div>";
  }

  // Published products without a stage mapping yet (e.g. a family whose
  // stages are still being confirmed) are listed rather than hidden.
  function renderUnmapped(model, p, o) {
    var products = p.products.filter(function (pr) { return !pr.stageIds.length; });
    if (!products.length) return "";
    var html = '<div class="lj-activities"><div class="lj-activities__intro"><h4 class="lj-activities__title">' +
      esc(model.ui.otherProductsHeading) + '</h4></div><ul class="lj-activities__list">';
    products.forEach(function (pr) {
      html += '<li class="lj-activity">' + productPill(model, p, pr, o, "activity") + "</li>";
    });
    return html + "</ul></div>";
  }

  /* ── Detail panel ────────────────────────────────────────────────────── */

  // The panel is a feature card: a visual on top (portfolio photograph, stage
  // illustration or pack shot) and the matching content beneath.
  // Details open beneath the band: a one-line hint when nothing is selected,
  // otherwise a compact card for the stage or product.
  function renderPanel(model, p, state, o) {
    var ui = model.ui;
    var stage = state.stage ? p.lookup[state.stage] : null;
    var product = state.product ? p.productById[state.product] : null;
    if (product) return renderProductDetail(model, p, product, o, stage);
    if (stage) return renderStageDetail(model, p, stage, o);
    return '<p class="lj-panel__hint">' + ARROW + esc(ui.panelEmptyText) + "</p>";
  }

  function renderStageDetail(model, p, stage, o) {
    var ui = model.ui;
    var products = p.products.filter(function (pr) { return pr.stageIds.indexOf(stage.id) !== -1; });
    var eyebrow = stage.kind === "stage"
      ? fmt(ui.stageNumber, { n: stage.index + 1, total: p.stages.length })
      : ui.activityLabel;
    var html = '<div class="lj-card lj-card--stage">';
    html += '<div class="lj-card__body">';
    html += '<p class="lj-panel__eyebrow">' + esc(eyebrow) + "</p>";
    html += '<h4 class="lj-panel__title" tabindex="-1">' + esc(stage.label) + "</h4>";
    if (hasText(stage.description)) html += '<p class="lj-panel__text">' + esc(stage.description) + "</p>";
    html += "</div><div class=\"lj-card__side\">";
    html += '<h5 class="lj-panel__subtitle">' + esc(ui.relatedProductsHeading) + "</h5>";
    if (!products.length) {
      html += '<p class="lj-panel__text lj-panel__text--muted">' + esc(ui.noRelatedProducts) + "</p>";
    } else {
      html += '<ul class="lj-chips">';
      products.forEach(function (pr) {
        html += "<li>" + productPill(model, p, pr, o, "chip") + "</li>";
      });
      html += "</ul>";
    }
    html += '<button type="button" class="lj-textbtn lj-clear" data-action="clear">' + esc(ui.clearSelection) + "</button>";
    return html + "</div></div>";
  }


  function specRow(label, valueHtml, wide) {
    return '<div class="lj-specs__row' + (wide ? " lj-specs__row--wide" : "") + '"><dt>' + esc(label) + "</dt><dd>" + valueHtml + "</dd></div>";
  }

  function tags(list) {
    return '<ul class="lj-tags">' + list.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
  }

  // Shows where the selected product sits on the portfolio's particle-size
  // scale, with the rest of the range drawn faintly for comparison.
  function renderSizeScale(model, p, product) {
    var scale = p.sizeChart;
    if (!scale || !onScale(product.particleSize, scale)) return "";
    function bar(min, max, cls, style, label) {
      return '<span class="lj-scale__range' + cls + '" style="' + (style || "") + "left: " + pct(min, scale) +
        "; width: calc(" + pct(max, scale) + " - " + pct(min, scale) + ');">' +
        (label ? '<span class="lj-scale__tag">' + esc(label) + "</span>" : "") + "</span>";
    }
    function dot(v, style, label) {
      return '<span class="lj-scale__dot is-current" style="' + style + "left: " + pct(v, scale) + ';">' +
        (label ? '<span class="lj-scale__tag">' + esc(label) + "</span>" : "") + "</span>";
    }
    var marks = p.products.filter(function (pr) { return onScale(pr.particleSize, scale); }).map(function (pr) {
      var spec = pr.particleSize;
      var current = pr.id === product.id;
      if (spec.type !== "set") return "";
      return spec.items.map(function (it) {
        var style = "--lj-grade: var(--lj-grade-" + (it.color || "default") + ");";
        if (it.min != null && it.max != null) {
          return bar(toMicrons(it.min, spec.unit), toMicrons(it.max, spec.unit), current ? " is-current" : "", style,
            current && spec.items.length > 1 ? it.label : "");
        }
        return current ? dot(toMicrons(it.average, spec.unit), style, it.label) : "";
      }).join("");
    }).join("");
    return '<div class="lj-scale" aria-hidden="true"><span class="lj-scale__label">' + esc(model.ui.sizeScaleLabel) + "</span>" +
      '<span class="lj-scale__track">' + marks + "</span>" +
      '<span class="lj-scale__axis"><span>' + esc(scale.min) + "</span><span>" + esc(scale.max + " " + scale.unit) + "</span></span></div>";
  }


  // Compact product card: pack shot, name and attributes, then grades and
  // the link to the product page.
  function renderProductDetail(model, p, product, o, stage) {
    var ui = model.ui;
    var spec = product.particleSize;
    var parts = splitName(product.name, product.brand || model.settings.brandPrefix);
    var html = '<div class="lj-card lj-detail" style="' + accentStyle(product) + '">';
    if (hasText(product.image)) {
      html += '<div class="lj-card__media"><img src="' + esc(product.image) + '" alt="" loading="lazy" decoding="async"></div>';
    }
    html += '<div class="lj-card__body">';
    if (stage && o.interactive) {
      html += '<button type="button" class="lj-textbtn lj-back" data-action="back-to-stage">' +
        esc(fmt(ui.backToStage, { stage: stage.label })) + "</button>";
    }
    html += '<h4 class="lj-panel__title lj-detail__title" tabindex="-1">' + (hasText(product.logo)
      ? '<img class="lj-detail__logo" src="' + esc(product.logo) + '" alt="" decoding="async"><span class="lj-vh">' + esc(product.name) + "</span>"
      : (parts.brand ? '<span class="lj-detail__brand">' + esc(parts.brand) + "</span> " : "") +
        '<span class="lj-detail__name">' + esc(parts.rest) + "</span>") + "</h4>";
    if (hasText(product.description)) html += '<p class="lj-panel__text">' + esc(product.description) + "</p>";

    var rows = "";
    if (hasText(product.productType)) rows += specRow(ui.fieldProductType, esc(product.productType));
    if (product.stageIds.length) rows += specRow(ui.fieldStages, esc(stageNames(p, product).join(", ")));
    if (hasText(product.application)) rows += specRow(ui.fieldApplication, esc(product.application));
    if (product.variants.length) rows += specRow(ui.fieldVariants, esc(product.variants.join(", ")));
    if (hasText(product.packaging)) rows += specRow(ui.fieldPackaging, esc(product.packaging));
    if (hasText(product.health)) rows += specRow(ui.fieldHealth, esc(product.health));
    if (hasText(product.marketAvailability)) rows += specRow(ui.fieldMarkets, esc(product.marketAvailability));
    if (rows) html += '<dl class="lj-attrs">' + rows + "</dl>";
    if (product.technicalNotes.length) {
      html += '<ul class="lj-list">' + product.technicalNotes.map(function (n) {
        return "<li>" + esc(n) + "</li>";
      }).join("") + "</ul>";
    }
    html += "</div>";

    html += '<div class="lj-card__side">';
    if (spec) {
      html += '<h5 class="lj-panel__subtitle">' + esc(spec.label || ui.fieldParticleSize) +
        (spec.verified === false ? ' <span class="lj-badge">' + esc(ui.provisional) + "</span>" : "") + "</h5>";
      if (spec.type === "set") {
        html += '<ul class="lj-grades">' + spec.items.map(function (it) {
          return '<li class="lj-grade" style="--lj-grade: var(--lj-grade-' + esc(it.color || "default") + ');">' +
            gradeLine(it, spec.unit) + "</li>";
        }).join("") + "</ul>";
      } else {
        html += '<p class="lj-panel__text">' + esc(formatSize(spec)) + "</p>";
      }
    }
    if (hasText(product.url)) {
      html += '<a class="lj-cta" href="' + esc(product.url) + '">' + esc(ui.viewDetails) +
        '<span class="lj-vh">: ' + esc(product.name) + "</span>" + ARROW + "</a>";
    }
    if (o.interactive) {
      html += '<button type="button" class="lj-textbtn lj-clear" data-action="clear">' + esc(ui.clearSelection) + "</button>";
    }
    return html + "</div></div>";
  }

  // No-JS / crawler fallback: every product's details as plain HTML.
  function renderProductIndex(model, p, o) {
    var html = '<div class="lj-index">';
    p.products.forEach(function (product) {
      html += '<article class="lj-panel lj-index__item">' +
        renderProductDetail(model, p, product, o).replace(' tabindex="-1"', "") + "</article>";
    });
    return html + "</div>";
  }

  /* ── Controller (browser only) ───────────────────────────────────────── */

  function Journey(el, data, options) {
    this.el = el;
    this.options = options || {};
    this.uid = "lj" + (++instanceCount);
    this.model = prepare(data, { market: this.options.market });
    this.state = { portfolio: this.model.defaultPortfolio, stage: null, product: null };

    el.innerHTML = renderModule(this.model, {
      interactive: true,
      illustrations: this.options.illustrations || root.LARVIVA_ILLUSTRATIONS || {},
      uid: this.uid
    });
    el.setAttribute("data-larviva-ready", "");
    this.status = el.querySelector("[data-lj-status]");

    el.addEventListener("click", this.onClick.bind(this));
    var tablist = el.querySelector('[role="tablist"]');
    if (tablist) tablist.addEventListener("keydown", this.onTabKey.bind(this));
    this.update();
  }

  Journey.prototype.portfolio = function () {
    var id = this.state.portfolio;
    return this.model.portfolios.filter(function (p) { return p.id === id; })[0];
  };

  Journey.prototype.onClick = function (event) {
    var target = event.target.closest("[data-portfolio], [data-stage-id], [data-product-id], [data-segment-of], [data-action]");
    if (!target || !this.el.contains(target)) return;

    if (target.hasAttribute("data-portfolio")) {
      this.setPortfolio(target.getAttribute("data-portfolio"));
    } else if (target.hasAttribute("data-stage-id")) {
      this.selectStage(target.getAttribute("data-stage-id"));
    } else if (target.hasAttribute("data-product-id") || target.hasAttribute("data-segment-of")) {
      var fromPanel = !!target.closest("[data-lj-panel]");
      this.selectProduct(target.getAttribute("data-product-id") || target.getAttribute("data-segment-of"), fromPanel);
    } else {
      var action = target.getAttribute("data-action");
      if (action === "chart") {
        var open = target.getAttribute("aria-expanded") !== "true";
        target.setAttribute("aria-expanded", open ? "true" : "false");
        var chartEl = this.el.querySelector("#" + target.getAttribute("aria-controls"));
        if (chartEl) chartEl.hidden = !open;
      }
      if (action === "clear") this.clear(true);
      if (action === "back-to-stage") {
        this.state.product = null;
        this.update({ focusPanel: true });
        this.announce(this.model.ui.announceCleared);
      }
    }
  };

  // WAI-ARIA tabs pattern: arrow keys move between Fish / Shrimp.
  Journey.prototype.onTabKey = function (event) {
    var tabs = Array.prototype.slice.call(this.el.querySelectorAll('[role="tab"]'));
    var i = tabs.indexOf(document.activeElement);
    if (i === -1) return;
    var next = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (i + 1) % tabs.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (i - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    tabs[next].focus();
    this.setPortfolio(tabs[next].getAttribute("data-portfolio"));
  };

  Journey.prototype.setPortfolio = function (id) {
    if (id === this.state.portfolio) return;
    this.state = { portfolio: id, stage: null, product: null };
    each(this.el.querySelectorAll('[role="tab"]'), function (tab) {
      var on = tab.getAttribute("data-portfolio") === id;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      if (on) tab.removeAttribute("tabindex"); else tab.setAttribute("tabindex", "-1");
    });
    each(this.el.querySelectorAll("[data-portfolio-panel]"), function (panel) {
      panel.hidden = panel.getAttribute("data-portfolio-panel") !== id;
    });
    var title = this.el.querySelector("[data-lj-title]");
    if (title) title.textContent = moduleTitle(this.model.ui, this.portfolio());
    this.update();
    this.announce(fmt(this.model.ui.announcePortfolio, { portfolio: this.portfolio().label }));
    this.emit();
  };

  Journey.prototype.selectStage = function (id) {
    var p = this.portfolio();
    if (this.state.stage === id) {
      this.clear();
      return;
    }
    this.state.stage = id;
    var product = this.state.product && p.productById[this.state.product];
    if (product && product.stageIds.indexOf(id) === -1) this.state.product = null;
    this.update({ reveal: true });
    var count = p.products.filter(function (pr) { return pr.stageIds.indexOf(id) !== -1; }).length;
    this.announce(fmt(this.model.ui.announceStage, { stage: p.lookup[id].label, count: count }));
    this.emit();
  };

  Journey.prototype.selectProduct = function (id, fromPanel) {
    var p = this.portfolio();
    var product = p.productById[id];
    if (!product) return;
    if (this.state.product === id) {
      this.state.product = null;
      this.update();
      this.announce(this.model.ui.announceCleared);
      return;
    }
    this.state.product = id;
    if (this.state.stage && product.stageIds.indexOf(this.state.stage) === -1) this.state.stage = null;
    // Chips inside the panel are replaced on update, so move focus to the
    // new panel heading instead of losing it.
    this.update({ reveal: true, focusPanel: fromPanel });
    this.announce(fmt(this.model.ui.announceProduct, { product: product.name }));
    this.emit();
  };

  Journey.prototype.clear = function (fromPanel) {
    this.state.stage = null;
    this.state.product = null;
    this.update({ focusPanel: fromPanel });
    this.announce(this.model.ui.announceCleared);
  };

  Journey.prototype.emit = function () {
    if (typeof this.options.onChange === "function") this.options.onChange(Object.assign({}, this.state));
  };

  Journey.prototype.announce = function (message) {
    if (!this.status) return;
    var status = this.status;
    status.textContent = "";
    // Re-set on the next frame so repeated messages are announced again.
    (root.requestAnimationFrame || setTimeout)(function () { status.textContent = message; });
  };

  Journey.prototype.update = function (opts) {
    opts = opts || {};
    var p = this.portfolio();
    var section = this.el.querySelector('[data-portfolio-panel="' + this.state.portfolio + '"]');
    if (!p || !section) return;
    var state = this.state;
    var stage = state.stage ? p.lookup[state.stage] : null;
    var product = state.product ? p.productById[state.product] : null;

    section.classList.toggle("has-selection", !!(stage || product));

    each(section.querySelectorAll("[data-stage-id]"), function (btn) {
      var id = btn.getAttribute("data-stage-id");
      var related = !!product && product.stageIds.indexOf(id) !== -1;
      btn.setAttribute("aria-pressed", id === state.stage ? "true" : "false");
      btn.classList.toggle("is-related", related && id !== state.stage);
      btn.classList.toggle("is-dimmed", product ? !related : !!stage && id !== state.stage);
    });

    var detail = section.querySelector("[data-lj-panel]");
    detail.innerHTML = renderPanel(this.model, p, state, {
      uid: this.uid,
      interactive: true,
      illustrations: this.options.illustrations || root.LARVIVA_ILLUSTRATIONS || {}
    });

    function productState(el, id) {
      var selected = id === state.product;
      var related = !!stage && p.productById[id].stageIds.indexOf(stage.id) !== -1;
      el.classList.toggle("is-selected", selected);
      el.classList.toggle("is-dimmed", !selected && (stage ? !related : !!product));
    }
    each(section.querySelectorAll("[data-product-id]"), function (el) {
      var id = el.getAttribute("data-product-id");
      if (el.hasAttribute("aria-pressed")) el.setAttribute("aria-pressed", id === state.product ? "true" : "false");
      productState(el, id);
    });
    each(section.querySelectorAll("[data-chart-stage]"), function (el) {
      var id = el.getAttribute("data-chart-stage");
      el.classList.toggle("is-active", id === state.stage || (!!product && product.stageIds.indexOf(id) !== -1));
    });
    each(section.querySelectorAll("[data-segment-of]"), function (el) {
      productState(el, el.getAttribute("data-segment-of"));
    });

    // A pack shot that fails to load is removed rather than left as a gap.
    each(detail.querySelectorAll(".lj-detail__image"), function (img) {
      img.addEventListener("error", function () { img.remove(); });
    });

    if (opts.focusPanel) {
      var heading = detail.querySelector(".lj-panel__title");
      if (heading) heading.focus({ preventScroll: true });
    }
    // On narrow screens the panel sits below the products: bring it into view.
    if ((opts.reveal || opts.focusPanel) && root.matchMedia && root.matchMedia(NARROW_QUERY).matches) {
      var rect = detail.getBoundingClientRect();
      // Inside an auto-height iframe the module never scrolls itself: tell
      // the embedding page where the panel is (embed.html relays it).
      if (root.parent && root.parent !== root && typeof root.CustomEvent === "function") {
        detail.dispatchEvent(new root.CustomEvent("larviva-journey:reveal", {
          bubbles: true,
          detail: { top: Math.round(rect.top + (root.pageYOffset || 0)) }
        }));
        return;
      }
      if (rect.top > root.innerHeight * 0.7 || rect.top < 0) {
        var reduce = root.matchMedia("(prefers-reduced-motion: reduce)").matches;
        detail.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      }
    }
  };

  /* ── Bootstrapping ───────────────────────────────────────────────────── */

  function loadData(el) {
    var src = el.getAttribute("data-src");
    if (src) {
      return fetch(src, { credentials: "same-origin" }).then(function (r) {
        if (!r.ok) throw new Error("LARVIVA journey: failed to load " + src);
        return r.json();
      });
    }
    var name = el.getAttribute("data-dataset") || "LARVIVA_JOURNEY_DATA";
    return root[name]
      ? Promise.resolve(root[name])
      : Promise.reject(new Error("LARVIVA journey: dataset " + name + " not found"));
  }

  function init(el, options) {
    options = Object.assign({ market: el.getAttribute("data-market") || null }, options);
    return loadData(el).then(function (data) {
      return new Journey(el, data, options);
    }).catch(function (err) {
      // Leave any pre-rendered static content in place.
      if (root.console) root.console.error(err);
    });
  }

  function initAll() {
    return Promise.all(Array.prototype.map.call(
      root.document.querySelectorAll("[data-larviva-journey]:not([data-larviva-ready])"),
      function (el) { return init(el); }
    ));
  }

  return {
    prepare: prepare,
    renderModule: renderModule,
    formatSize: formatSize,
    init: init,
    initAll: initAll
  };
});
