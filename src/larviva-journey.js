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
      " --lj-on-accent: var(--lj-on-family-" + colorToken(product) + ", var(--lj-on-family-default));";
  }

  function iconHtml(illustrations, keys, extraClass) {
    keys = [].concat(keys || []).filter(function (k) { return illustrations[k]; });
    if (!keys.length) return "";
    return '<span class="lj-icon' + (extraClass ? " " + extraClass : "") + '" aria-hidden="true">' +
      keys.map(function (k) { return '<span class="lj-icon__item">' + illustrations[k] + "</span>"; }).join("") +
      "</span>";
  }

  function checkIcon() {
    return '<svg class="lj-check" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">' +
      '<path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
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

  // Places product bars in as few rows as possible without overlaps, so the
  // module stays compact however many products a portfolio has.
  function packRows(products) {
    var rows = [];
    products.forEach(function (pr) {
      var r = 0;
      while (rows[r] && pr.stageIndices.some(function (c) { return rows[r][c]; })) r++;
      rows[r] = rows[r] || {};
      pr.stageIndices.forEach(function (c) { rows[r][c] = true; });
      pr.row = r;
    });
    return rows.length;
  }

  /* ── Data preparation ────────────────────────────────────────────────── */

  var DEFAULT_UI = {
    stageNumber: "Stage {n} of {total}",
    relatedStage: "Relevant",
    selectedState: "Selected"
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

      var products = (data.products || []).filter(function (pr) {
        return pr.portfolio === p.id && pr.published !== false && isInMarket(pr, market);
      }).map(function (pr) {
        var ids = (pr.stages || []).filter(function (id) { return lookup[id]; });
        return Object.assign({}, pr, {
          stageIds: ids,
          stageIndices: ids.filter(function (id) { return lookup[id].kind === "stage"; })
            .map(function (id) { return lookup[id].index; })
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
      var rowCount = packRows(laneProducts);

      return Object.assign({}, p, {
        stages: stages,
        activities: activities,
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
    return spec.value;
  }

  function onScale(spec, scale) {
    if (!spec || !scale || spec.unit !== scale.unit) return false;
    if (spec.type === "range") return spec.min >= scale.min && spec.max <= scale.max;
    if (spec.type === "grades") {
      return spec.values.every(function (v) { return v >= scale.min && v <= scale.max; });
    }
    return false;
  }

  function pct(value, scale) {
    return ((value - scale.min) / (scale.max - scale.min) * 100).toFixed(2) + "%";
  }

  /* ── Markup (shared by browser and pre-render) ───────────────────────── */

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
    html += '<div class="lj-header"><div class="lj-header__text">';
    if (hasText(ui.eyebrow)) html += '<p class="lj-eyebrow">' + esc(ui.eyebrow) + "</p>";
    html += '<h2 class="lj-title">' + esc(ui.moduleTitle) + "</h2>";
    if (interactive && hasText(ui.instruction)) html += '<p class="lj-lead">' + esc(ui.instruction) + "</p>";
    html += "</div>";

    if (interactive && model.portfolios.length > 1) {
      var activeIndex = Math.max(0, model.portfolios.map(function (p) { return p.id; }).indexOf(active));
      html += '<div class="lj-switch" role="tablist" aria-label="' + esc(ui.portfolioSwitchLabel) +
        '" style="--lj-tabs: ' + model.portfolios.length + "; --lj-tab: " + activeIndex + ';">' +
        '<span class="lj-switch__thumb" aria-hidden="true"></span>';
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
    html += '<div class="lj-body"><div class="lj-main">';
    html += renderStages(model, p, o);
    html += renderLanes(model, p, o);
    html += renderActivities(model, p, o);
    html += renderUnmapped(model, p, o);
    html += "</div>";
    if (o.interactive) {
      html += '<div class="lj-panel" id="' + esc(o.uid + "-detail-" + p.id) + '" data-lj-panel>' +
        renderPanel(model, p, { stage: null, product: null }, o) + "</div>";
    } else {
      html += renderProductIndex(model, p, o);
    }
    return html + "</div></section>";
  }

  function stageFlags(ui) {
    return '<span class="lj-flag lj-flag--related">' + esc(ui.relatedStage) + "</span>" +
      '<span class="lj-flag lj-flag--selected">' + checkIcon() + esc(ui.selectedState) + "</span>";
  }

  // The journey card: stage icons over a progress track. The track fills to
  // the selected stage and shows the selected product's span in its colour.
  function renderStages(model, p, o) {
    if (!p.stages.length) return "";
    var ui = model.ui;
    var n = p.stages.length;
    var html = '<div class="lj-journey" style="--lj-cols: ' + n + '" data-lj-journey><div class="lj-journey__inner">';
    html += '<h4 class="lj-vh">' + esc(ui.stagesHeading) + "</h4>";
    html += '<ol class="lj-stages">';
    p.stages.forEach(function (s, i) {
      html += '<li class="lj-stages__item" style="--i: ' + i + ';">' + control(o.interactive, {
        "class": "lj-stage",
        "data-stage-id": s.id,
        "aria-pressed": "false",
        "aria-controls": o.uid + "-detail-" + p.id
      },
        '<span class="lj-stage__visual" aria-hidden="true">' + iconHtml(o.illustrations, s.illustration, "lj-stage__icon") + "</span>" +
        '<span class="lj-stage__num" aria-hidden="true">' + (i < 9 ? "0" : "") + (i + 1) + "</span>" +
        '<span class="lj-vh">' + esc(fmt(ui.stageNumber, { n: i + 1, total: n })) + ": </span>" +
        '<span class="lj-stage__label">' + esc(s.label) + "</span>" +
        stageFlags(ui)
      ) + "</li>";
    });
    html += "</ol>";
    html += '<div class="lj-track" aria-hidden="true"><span class="lj-track__fill"></span><span class="lj-track__span"></span>';
    p.stages.forEach(function (s, i) {
      html += '<span class="lj-track__dot" style="left: ' + ((i + 0.5) / n * 100).toFixed(3) + '%"></span>';
    });
    html += "</div></div></div>";
    return html;
  }

  function productLabel(model, product) {
    var parts = splitName(product.name, model.settings.brandPrefix);
    return '<span class="lj-pill__name">' +
      (parts.brand ? '<span class="lj-pill__brand">' + esc(parts.brand) + "</span> " : "") +
      esc(parts.rest) + "</span>";
  }

  function stageNames(p, product) {
    return product.stageIds.map(function (id) { return p.lookup[id].label; });
  }

  function productPill(model, p, product, o, variant, style) {
    var spec = product.particleSize;
    var meta = spec && spec.type === "range" ? formatSize(spec) : (product.productType || "");
    return control(o.interactive, {
      "class": "lj-pill" + (variant ? " lj-pill--" + variant : ""),
      style: accentStyle(product) + (style || ""),
      "data-product-id": product.id,
      "aria-pressed": "false",
      "aria-controls": o.uid + "-detail-" + p.id
    },
      productLabel(model, product) +
      (hasText(meta) ? '<span class="lj-pill__meta">' + esc(meta) + "</span>" : "") +
      '<span class="lj-pill__stages"><span class="lj-vh">' + esc(model.ui.stagesPrefix) + " </span>" +
      esc(stageNames(p, product).join(" · ")) + "</span>" +
      checkIcon() +
      '<span class="lj-pill__track" aria-hidden="true"></span>'
    );
  }

  function renderLanes(model, p, o) {
    if (!p.laneProducts.length) return "";
    var html = '<h4 class="lj-vh">' + esc(model.ui.productsHeading) + "</h4>";
    html += '<ul class="lj-lanes" style="--lj-cols: ' + p.stages.length + "; --lj-rows: " + p.rowCount + '">';
    p.laneProducts.forEach(function (product, i) {
      toRuns(product.stageIndices).forEach(function (run, r) {
        var place = "grid-column: " + (run[0] + 1) + " / " + (run[1] + 2) + "; grid-row: " + (product.row + 1) + "; --i: " + i + ";";
        if (r === 0) {
          html += '<li class="lj-lanes__item" style="' + place + '">' + productPill(model, p, product, o, "bar") + "</li>";
        } else {
          // Extra segment for non-contiguous stages: visual only; the first
          // segment is the accessible control.
          html += '<li class="lj-lanes__item" style="' + place + '" aria-hidden="true">' +
            '<span class="lj-pill lj-pill--bar lj-pill--segment" data-segment-of="' + esc(product.id) + '" style="' +
            accentStyle(product) + '"><span class="lj-pill__track"></span></span></li>';
        }
      });
    });
    return html + "</ul>";
  }

  function renderActivities(model, p, o) {
    if (!p.activities.length) return "";
    var ui = model.ui;
    var html = '<div class="lj-activities">';
    html += '<div class="lj-activities__intro"><h4 class="lj-activities__title">' + esc(ui.activitiesHeading) + "</h4>";
    if (hasText(ui.activitiesNote)) html += '<p class="lj-activities__note">' + esc(ui.activitiesNote) + "</p>";
    html += '</div><ul class="lj-activities__list">';
    p.activities.forEach(function (a) {
      var products = p.products.filter(function (pr) { return pr.activityIds.indexOf(a.id) !== -1; });
      html += '<li class="lj-activity">';
      html += control(o.interactive, {
        "class": "lj-stage lj-stage--activity",
        "data-stage-id": a.id,
        "aria-pressed": "false",
        "aria-controls": o.uid + "-detail-" + p.id
      },
        '<span class="lj-stage__disc" aria-hidden="true">' + iconHtml(o.illustrations, a.illustration, "lj-stage__icon") + "</span>" +
        '<span class="lj-vh">' + esc(ui.activityLabel) + ": </span>" +
        '<span class="lj-stage__label">' + esc(a.label) + "</span>" +
        stageFlags(ui)
      );
      products.forEach(function (pr) {
        html += productPill(model, p, pr, o, "activity");
      });
      html += "</li>";
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

  function renderPanel(model, p, state, o) {
    var ui = model.ui;
    var stage = state.stage ? p.lookup[state.stage] : null;
    var product = state.product ? p.productById[state.product] : null;
    var html = "";

    if (product) {
      html += renderProductDetail(model, p, product, o, stage);
    } else if (stage) {
      html += renderStageDetail(model, p, stage, o);
    } else {
      html += '<p class="lj-panel__eyebrow">' + esc(p.title || p.label) + "</p>";
      html += '<h4 class="lj-panel__title" tabindex="-1">' + esc(ui.panelEmptyTitle) + "</h4>";
      if (hasText(p.intro)) html += '<p class="lj-panel__text lj-panel__intro">' + esc(p.intro) + "</p>";
      html += '<dl class="lj-stats">' +
        '<div class="lj-stats__item"><dt>' + esc(ui.statStages) + "</dt><dd>" + p.stages.length + "</dd></div>" +
        '<div class="lj-stats__item"><dt>' + esc(ui.statProducts) + "</dt><dd>" + p.products.length + "</dd></div></dl>";
      html += '<p class="lj-panel__hint">' + esc(ui.panelEmptyText) + "</p>";
    }

    if (stage || product) {
      html += '<button type="button" class="lj-textbtn lj-clear" data-action="clear">' + esc(ui.clearSelection) + "</button>";
    }
    return html;
  }

  function renderStageDetail(model, p, stage, o) {
    var ui = model.ui;
    var products = p.products.filter(function (pr) { return pr.stageIds.indexOf(stage.id) !== -1; });
    var eyebrow = stage.kind === "stage"
      ? fmt(ui.stageNumber, { n: stage.index + 1, total: p.stages.length })
      : ui.activityLabel;
    var html = '<p class="lj-panel__eyebrow">' + esc(eyebrow) + "</p>";
    html += '<h4 class="lj-panel__title" tabindex="-1">' + esc(stage.label) + "</h4>";
    if (hasText(stage.description)) html += '<p class="lj-panel__text">' + esc(stage.description) + "</p>";
    html += '<h5 class="lj-panel__subtitle">' + esc(ui.relatedProductsHeading) + "</h5>";
    if (!products.length) {
      html += '<p class="lj-panel__text">' + esc(ui.noRelatedProducts) + "</p>";
    } else {
      html += '<ul class="lj-chips">';
      products.forEach(function (pr) {
        html += "<li>" + productPill(model, p, pr, o, "chip") + "</li>";
      });
      html += "</ul>";
    }
    return html;
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
    if (!onScale(product.particleSize, scale)) return "";
    var marks = p.products.filter(function (pr) { return onScale(pr.particleSize, scale); }).map(function (pr) {
      var spec = pr.particleSize;
      var cls = pr.id === product.id ? " is-current" : "";
      var style = accentStyle(pr);
      if (spec.type === "range") {
        return '<span class="lj-scale__range' + cls + '" style="' + style + " left: " + pct(spec.min, scale) +
          "; width: calc(" + pct(spec.max, scale) + " - " + pct(spec.min, scale) + ');"></span>';
      }
      return pr.id === product.id ? spec.values.map(function (v) {
        return '<span class="lj-scale__dot is-current" style="' + style + " left: " + pct(v, scale) + ';"></span>';
      }).join("") : "";
    }).join("");
    return '<div class="lj-scale" aria-hidden="true"><span class="lj-scale__label">' + esc(model.ui.sizeScaleLabel) + "</span>" +
      '<span class="lj-scale__track">' + marks + "</span>" +
      '<span class="lj-scale__axis"><span>' + esc(scale.min) + "</span><span>" + esc(scale.max + " " + scale.unit) + "</span></span></div>";
  }

  function renderProductDetail(model, p, product, o, stage) {
    var ui = model.ui;
    var spec = product.particleSize;
    var html = '<div class="lj-detail" style="' + accentStyle(product) + '">';
    if (stage && o.interactive) {
      html += '<button type="button" class="lj-textbtn lj-back" data-action="back-to-stage">' +
        esc(fmt(ui.backToStage, { stage: stage.label })) + "</button>";
    }
    html += '<p class="lj-panel__eyebrow"><span class="lj-swatch" aria-hidden="true"></span>' +
      esc(fmt(ui.productEyebrow, { portfolio: p.label })) + "</p>";
    html += '<h4 class="lj-panel__title" tabindex="-1">' + esc(product.name) + "</h4>";
    if (hasText(product.productType)) {
      html += '<p class="lj-panel__tagline"><span class="lj-vh">' + esc(ui.fieldProductType) + ": </span>" + esc(product.productType) + "</p>";
    }
    if (hasText(product.description)) html += '<p class="lj-panel__text">' + esc(product.description) + "</p>";

    var rows = "";
    if (spec) {
      rows += specRow(ui.fieldParticleSize, esc(formatSize(spec)) +
        (spec.verified === false ? ' <span class="lj-badge">' + esc(ui.provisional) + "</span>" : ""));
    }
    if (product.stageIds.length) rows += specRow(ui.fieldStages, tags(stageNames(p, product)), true);
    if (hasText(product.application)) rows += specRow(ui.fieldApplication, esc(product.application), true);
    if (product.variants.length) rows += specRow(ui.fieldVariants, tags(product.variants), true);
    if (product.technicalNotes.length) {
      rows += specRow(ui.fieldTechnicalNotes, '<ul class="lj-list">' + product.technicalNotes.map(function (n) {
        return "<li>" + esc(n) + "</li>";
      }).join("") + "</ul>", true);
    }
    if (hasText(product.marketAvailability)) rows += specRow(ui.fieldMarkets, esc(product.marketAvailability), true);
    if (rows) html += '<dl class="lj-specs">' + rows + "</dl>";
    if (o.interactive) html += renderSizeScale(model, p, product);

    if (hasText(product.url)) {
      html += '<a class="lj-cta" href="' + esc(product.url) + '">' + esc(ui.viewDetails) +
        '<span class="lj-vh">: ' + esc(product.name) + "</span></a>";
    }
    return html + "</div>";
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
    var tablist = this.el.querySelector('[role="tablist"]');
    each(this.el.querySelectorAll('[role="tab"]'), function (tab, i) {
      var on = tab.getAttribute("data-portfolio") === id;
      if (on && tablist) tablist.style.setProperty("--lj-tab", i);
      tab.setAttribute("aria-selected", on ? "true" : "false");
      if (on) tab.removeAttribute("tabindex"); else tab.setAttribute("tabindex", "-1");
    });
    each(this.el.querySelectorAll("[data-portfolio-panel]"), function (panel) {
      panel.hidden = panel.getAttribute("data-portfolio-panel") !== id;
    });
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

    var journey = section.querySelector("[data-lj-journey]");
    if (journey) {
      var n = p.stages.length;
      var fill = stage && stage.kind === "stage" ? (stage.index + 0.5) / n * 100 : 0;
      var span = product && product.stageIndices.length ? product.stageIndices : null;
      journey.style.setProperty("--lj-fill", fill.toFixed(3) + "%");
      journey.classList.toggle("has-span", !!span);
      if (span) {
        journey.style.setProperty("--lj-span-start", (span[0] / n * 100).toFixed(3) + "%");
        journey.style.setProperty("--lj-span-end", ((span[span.length - 1] + 1) / n * 100).toFixed(3) + "%");
        journey.style.setProperty("--lj-accent", accentToken(product));
      }
    }

    var detail = section.querySelector("[data-lj-panel]");
    if (product) detail.style.setProperty("--lj-glow", "color-mix(in srgb, " + accentToken(product) + " 55%, transparent)");
    else detail.style.removeProperty("--lj-glow");
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
    each(section.querySelectorAll("[data-segment-of]"), function (el) {
      productState(el, el.getAttribute("data-segment-of"));
    });

    if (opts.focusPanel) {
      var heading = detail.querySelector(".lj-panel__title");
      if (heading) heading.focus({ preventScroll: true });
    }
    // On narrow screens the panel sits below the products: bring it into view.
    if ((opts.reveal || opts.focusPanel) && root.matchMedia && root.matchMedia(NARROW_QUERY).matches) {
      var rect = detail.getBoundingClientRect();
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
