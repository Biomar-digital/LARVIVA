/*
 * LARVIVA Interactive Hatchery Journey — renderer and controller.
 *
 * Presentation logic only. Product content lives in data/larviva-journey.*.js
 * (or a CMS endpoint returning the same JSON), design tokens live at the top of
 * src/larviva-journey.css, and illustrations live in src/larviva-illustrations.js.
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

  // Interactive controls are real <button>s; the static (no-JS) render uses
  // plain elements so nothing looks clickable that isn't.
  function control(interactive, tag, attributes, inner) {
    if (interactive) {
      return "<button" + attrs(Object.assign({ type: "button" }, attributes)) + ">" + inner + "</button>";
    }
    var plain = Object.assign({}, attributes);
    delete plain["aria-pressed"];
    delete plain["aria-controls"];
    return "<" + tag + attrs(plain) + ">" + inner + "</" + tag + ">";
  }

  function accentStyle(product) {
    var token = String(product.colorToken || "default").replace(/[^a-z0-9-]/gi, "");
    return "--lj-accent: var(--lj-family-" + token + ", var(--lj-family-default));";
  }

  function hasText(value) {
    return value != null && String(value).trim() !== "";
  }

  // Splits "LARVIVA ProStart" into brand + name for the two-line product label.
  function splitName(name, prefix) {
    if (prefix && name.indexOf(prefix + " ") === 0) {
      return { brand: prefix, rest: name.slice(prefix.length + 1) };
    }
    return { brand: "", rest: name };
  }

  // Consecutive stage indices → [[start, end], ...] for spanning product bars.
  function toRuns(indices) {
    var runs = [];
    indices.forEach(function (i) {
      var last = runs[runs.length - 1];
      if (last && i === last[1] + 1) last[1] = i;
      else runs.push([i, i]);
    });
    return runs;
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

      return Object.assign({}, p, {
        stages: stages,
        activities: activities,
        lookup: lookup,
        products: products,
        productById: byId
      });
    }).filter(function (p) { return p.stages.length || p.products.length; });

    var defaultId = portfolios.some(function (p) { return p.id === data.defaultPortfolio; })
      ? data.defaultPortfolio
      : (portfolios[0] && portfolios[0].id);

    return { ui: ui, settings: settings, portfolios: portfolios, defaultPortfolio: defaultId, market: market };
  }

  /* ── Particle size formatting ────────────────────────────────────────── */

  function formatSize(spec) {
    if (!spec) return "";
    if (spec.type === "range") return spec.min + "–" + spec.max + " " + spec.unit;
    if (spec.type === "grades") return spec.values.join(", ") + " " + spec.unit;
    return spec.value;
  }

  function chartable(spec, chart) {
    if (!spec || !chart || spec.unit !== chart.unit) return false;
    if (spec.type === "range") return spec.min >= chart.min && spec.max <= chart.max;
    if (spec.type === "grades") {
      return spec.values.every(function (v) { return v >= chart.min && v <= chart.max; });
    }
    return false;
  }

  function pct(value, chart) {
    return ((value - chart.min) / (chart.max - chart.min) * 100).toFixed(2) + "%";
  }

  function provisionalBadge(spec, ui) {
    return spec && spec.verified === false
      ? ' <span class="lj-badge">' + esc(ui.provisional) + "</span>"
      : "";
  }

  /* ── Static markup (shared by browser and pre-render) ────────────────── */

  function renderModule(model, options) {
    options = options || {};
    var interactive = options.interactive !== false;
    var illustrations = options.illustrations || {};
    var uid = options.uid || "lj";
    var ui = model.ui;
    var active = model.defaultPortfolio;

    var html = '<div class="lj' + (interactive ? " lj--interactive" : " lj--static") + '">';
    html += '<header class="lj-header">';
    html += '<h2 class="lj-title">' + esc(ui.moduleTitle) + "</h2>";
    if (hasText(ui.moduleIntro)) html += '<p class="lj-intro">' + esc(ui.moduleIntro) + "</p>";

    if (interactive && model.portfolios.length > 1) {
      html += '<div class="lj-switch" role="tablist" aria-label="' + esc(ui.portfolioSwitchLabel) + '">';
      model.portfolios.forEach(function (p) {
        var selected = p.id === active;
        html += "<button" + attrs({
          type: "button",
          role: "tab",
          "class": "lj-switch__tab",
          id: uid + "-tab-" + p.id,
          "aria-selected": selected ? "true" : "false",
          "aria-controls": uid + "-panel-" + p.id,
          tabindex: selected ? null : "-1",
          "data-portfolio": p.id
        }) + ">" + esc(p.label) + "</button>";
      });
      html += "</div>";
    }
    if (interactive && hasText(ui.instruction)) {
      html += '<p class="lj-instruction">' + esc(ui.instruction) + "</p>";
    }
    html += "</header>";

    model.portfolios.forEach(function (p) {
      html += renderPortfolio(model, p, {
        interactive: interactive,
        illustrations: illustrations,
        uid: uid,
        hidden: interactive && p.id !== active
      });
    });

    if (interactive) {
      html += '<p class="lj-vh" role="status" aria-live="polite" data-lj-status></p>';
    }
    html += "</div>";
    return html;
  }

  function renderPortfolio(model, p, o) {
    var ui = model.ui;
    var html = "<section" + attrs({
      "class": "lj-portfolio",
      id: o.uid + "-panel-" + p.id,
      role: o.interactive ? "tabpanel" : null,
      "aria-labelledby": o.interactive ? o.uid + "-tab-" + p.id : o.uid + "-heading-" + p.id,
      "data-portfolio-panel": p.id,
      hidden: o.hidden
    }) + ">";

    html += '<div class="lj-portfolio__head">';
    html += '<h3 class="lj-portfolio__title" id="' + esc(o.uid + "-heading-" + p.id) + '">' + esc(p.title || p.label) + "</h3>";
    if (hasText(p.intro)) html += '<p class="lj-portfolio__intro">' + esc(p.intro) + "</p>";
    html += "</div>";

    html += '<div class="lj-portfolio__body">';
    html += '<div class="lj-portfolio__main">';
    html += renderStages(model, p, o);
    html += renderLanes(model, p, o);
    html += renderActivities(model, p, o);
    html += renderUnmapped(model, p, o);
    html += renderSizeChart(model, p, o);
    html += "</div>";

    if (o.interactive) {
      html += '<div class="lj-panel" id="' + esc(o.uid + "-detail-" + p.id) + '" data-lj-panel>' +
        renderPanel(model, p, { stage: null, product: null }, o) + "</div>";
    } else {
      html += renderProductIndex(model, p);
    }
    html += "</div></section>";
    return html;
  }

  function renderStages(model, p, o) {
    var ui = model.ui;
    if (!p.stages.length) return "";
    var html = '<h4 class="lj-section-title">' + esc(ui.stagesHeading) + "</h4>";
    html += '<ol class="lj-stages" style="--lj-cols: ' + p.stages.length + '">';
    p.stages.forEach(function (s, i) {
      html += '<li class="lj-stages__item">' + control(o.interactive, "div", {
        "class": "lj-stage",
        "data-stage-id": s.id,
        "aria-pressed": "false",
        "aria-controls": o.uid + "-detail-" + p.id
      },
        '<span class="lj-stage__bg" aria-hidden="true"></span>' +
        '<span class="lj-stage__art" aria-hidden="true">' + (o.illustrations[s.illustration] || "") + "</span>" +
        '<span class="lj-stage__step">' + esc(fmt(ui.stageNumber, { n: i + 1, total: p.stages.length })) + "</span>" +
        '<span class="lj-stage__label">' + esc(s.label) + "</span>" +
        '<span class="lj-stage__flag lj-stage__flag--related">' + esc(ui.relatedStage) + "</span>" +
        '<span class="lj-stage__flag lj-stage__flag--selected">' + checkIcon() + esc(ui.selectedState) + "</span>"
      ) + "</li>";
    });
    html += "</ol>";
    return html;
  }

  function checkIcon() {
    return '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">' +
      '<path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function productLabel(model, product) {
    var parts = splitName(product.name, model.settings.brandPrefix);
    return '<span class="lj-product__name">' +
      (parts.brand ? '<span class="lj-product__brand">' + esc(parts.brand) + "</span> " : "") +
      '<span class="lj-product__family">' + esc(parts.rest) + "</span></span>";
  }

  function stageNames(p, product) {
    return product.stageIds.map(function (id) { return p.lookup[id].label; });
  }

  function productControl(model, p, product, o, extraClass, gridColumn) {
    var ui = model.ui;
    var size = product.particleSize && product.particleSize.type === "range"
      ? '<span class="lj-product__size">' + esc(formatSize(product.particleSize)) + "</span>"
      : "";
    return control(o.interactive, "div", {
      "class": "lj-product" + (extraClass ? " " + extraClass : ""),
      style: accentStyle(product) + (gridColumn ? " grid-column: " + gridColumn + ";" : ""),
      "data-product-id": product.id,
      "aria-pressed": "false",
      "aria-controls": o.uid + "-detail-" + p.id
    },
      productLabel(model, product) +
      (hasText(product.productType) ? '<span class="lj-product__type">' + esc(product.productType) + "</span>" : "") +
      size +
      '<span class="lj-product__stages"><span class="lj-vh">' + esc(ui.stagesPrefix) + " </span>" +
      esc(stageNames(p, product).join(" · ")) + "</span>"
    );
  }

  function renderLanes(model, p, o) {
    var lanes = p.products.filter(function (pr) { return pr.stageIndices.length; });
    if (!lanes.length) return "";
    var html = '<h4 class="lj-section-title">' + esc(model.ui.productsHeading) + "</h4>";
    html += '<ul class="lj-lanes" style="--lj-cols: ' + p.stages.length + '">';
    lanes.forEach(function (product) {
      var runs = toRuns(product.stageIndices);
      html += '<li class="lj-lane">';
      runs.forEach(function (run, r) {
        var column = (run[0] + 1) + " / " + (run[1] + 2);
        if (r === 0) {
          html += productControl(model, p, product, o, "lj-product--bar", column);
        } else {
          // Extra segments for non-contiguous stages: visual only; the first
          // segment is the accessible control.
          html += '<span class="lj-product lj-product--bar lj-product--segment" aria-hidden="true"' +
            attrs({ style: accentStyle(product) + " grid-column: " + column + ";", "data-segment-of": product.id }) +
            ">" + productLabel(model, product) + "</span>";
        }
      });
      html += "</li>";
    });
    html += "</ul>";
    return html;
  }

  function renderActivities(model, p, o) {
    if (!p.activities.length) return "";
    var ui = model.ui;
    var html = '<div class="lj-activities">';
    html += '<h4 class="lj-section-title">' + esc(ui.activitiesHeading) + "</h4>";
    if (hasText(ui.activitiesNote)) html += '<p class="lj-note">' + esc(ui.activitiesNote) + "</p>";
    html += '<ul class="lj-activities__list">';
    p.activities.forEach(function (a) {
      var products = p.products.filter(function (pr) { return pr.activityIds.indexOf(a.id) !== -1; });
      html += '<li class="lj-activity">';
      html += control(o.interactive, "div", {
        "class": "lj-stage lj-stage--activity",
        "data-stage-id": a.id,
        "aria-pressed": "false",
        "aria-controls": o.uid + "-detail-" + p.id
      },
        '<span class="lj-stage__art" aria-hidden="true">' + (o.illustrations[a.illustration] || "") + "</span>" +
        '<span class="lj-stage__step">' + esc(ui.activityLabel) + "</span>" +
        '<span class="lj-stage__label">' + esc(a.label) + "</span>" +
        '<span class="lj-stage__flag lj-stage__flag--related">' + esc(ui.relatedStage) + "</span>" +
        '<span class="lj-stage__flag lj-stage__flag--selected">' + checkIcon() + esc(ui.selectedState) + "</span>"
      );
      if (products.length) {
        html += '<ul class="lj-activity__products">';
        products.forEach(function (pr) {
          html += "<li>" + productControl(model, p, pr, o, "lj-product--card") + "</li>";
        });
        html += "</ul>";
      }
      html += "</li>";
    });
    html += "</ul></div>";
    return html;
  }

  // Published products without a stage mapping yet (e.g. a new family whose
  // stages are still being confirmed) are listed rather than hidden.
  function renderUnmapped(model, p, o) {
    var products = p.products.filter(function (pr) { return !pr.stageIds.length; });
    if (!products.length) return "";
    var html = '<h4 class="lj-section-title">' + esc(model.ui.otherProductsHeading) + "</h4>";
    html += '<ul class="lj-unmapped">';
    products.forEach(function (pr) {
      html += "<li>" + productControl(model, p, pr, o, "lj-product--card") + "</li>";
    });
    return html + "</ul>";
  }

  function renderSizeChart(model, p, o) {
    var chart = p.sizeChart;
    if (!chart) return "";
    var rows = p.products.filter(function (pr) { return chartable(pr.particleSize, chart); });
    if (!rows.length) return "";
    var ui = model.ui;
    var provisional = rows.some(function (pr) { return pr.particleSize.verified === false; });
    var titleId = o.uid + "-chart-" + p.id;

    var html = '<figure class="lj-chart" aria-labelledby="' + esc(titleId) + '">';
    html += '<h4 class="lj-section-title" id="' + esc(titleId) + '">' + esc(chart.title) + "</h4>";
    html += '<ul class="lj-chart__rows">';
    rows.forEach(function (pr) {
      var spec = pr.particleSize;
      var marks = "";
      if (spec.type === "range") {
        marks = '<span class="lj-chart__range" style="left: ' + pct(spec.min, chart) +
          "; width: calc(" + pct(spec.max, chart) + " - " + pct(spec.min, chart) + ');"></span>';
      } else {
        marks = spec.values.map(function (v) {
          return '<span class="lj-chart__dot" style="left: ' + pct(v, chart) + ';"></span>';
        }).join("");
      }
      html += '<li class="lj-chart__row" data-chart-product="' + esc(pr.id) + '" style="' + accentStyle(pr) + '">' +
        '<span class="lj-chart__label">' + esc(pr.name) + "</span>" +
        '<span class="lj-chart__value">' + esc(formatSize(spec)) + "</span>" +
        '<span class="lj-chart__track" aria-hidden="true">' + marks + "</span></li>";
    });
    html += "</ul>";
    html += '<div class="lj-chart__axis" aria-hidden="true">';
    (chart.ticks || [chart.min, chart.max]).forEach(function (t) {
      html += '<span style="left: ' + pct(t, chart) + '">' + esc(t) + "</span>";
    });
    html += '<span class="lj-chart__unit">' + esc(chart.unit) + "</span></div>";
    if (provisional && hasText(ui.provisionalChartNote)) {
      html += '<figcaption class="lj-note">' + esc(ui.provisionalChartNote) + "</figcaption>";
    }
    return html + "</figure>";
  }

  /* ── Detail panel ────────────────────────────────────────────────────── */

  function renderPanel(model, p, state, o) {
    var ui = model.ui;
    var stage = state.stage ? p.lookup[state.stage] : null;
    var product = state.product ? p.productById[state.product] : null;
    var html = "";

    if (product) {
      if (stage) {
        html += '<button type="button" class="lj-backlink" data-action="back-to-stage">' +
          esc(fmt(ui.backToStage, { stage: stage.label })) + "</button>";
      }
      html += renderProductDetail(model, p, product, o);
    } else if (stage) {
      html += renderStageDetail(model, p, stage, o);
    } else {
      html += '<p class="lj-eyebrow">' + esc(p.title || p.label) + "</p>";
      html += '<h4 class="lj-panel__title" tabindex="-1">' + esc(ui.panelEmptyTitle) + "</h4>";
      html += '<p class="lj-panel__text">' + esc(ui.instruction) + "</p>";
    }

    if (stage || product) {
      html += '<button type="button" class="lj-clear" data-action="clear">' + esc(ui.clearSelection) + "</button>";
    }
    if (hasText(ui.disclaimer)) html += '<p class="lj-disclaimer">' + esc(ui.disclaimer) + "</p>";
    return html;
  }

  function stageEyebrow(model, p, stage) {
    return stage.kind === "stage"
      ? fmt(model.ui.stageNumber, { n: stage.index + 1, total: p.stages.length })
      : model.ui.activityLabel;
  }

  function renderStageDetail(model, p, stage, o) {
    var ui = model.ui;
    var products = p.products.filter(function (pr) { return pr.stageIds.indexOf(stage.id) !== -1; });
    var html = '<p class="lj-eyebrow">' + esc(stageEyebrow(model, p, stage)) + "</p>";
    html += '<h4 class="lj-panel__title" tabindex="-1">' + esc(stage.label) + "</h4>";
    if (hasText(stage.description)) html += '<p class="lj-panel__text">' + esc(stage.description) + "</p>";
    html += '<h5 class="lj-panel__subtitle">' + esc(ui.relatedProductsHeading) + "</h5>";
    if (!products.length) {
      html += '<p class="lj-panel__text">' + esc(ui.noRelatedProducts) + "</p>";
    } else {
      html += '<ul class="lj-chips">';
      products.forEach(function (pr) {
        html += "<li>" + productControl(model, p, pr, o, "lj-product--chip") + "</li>";
      });
      html += "</ul>";
    }
    return html;
  }

  function specRow(label, valueHtml) {
    return '<div class="lj-specs__row"><dt>' + esc(label) + "</dt><dd>" + valueHtml + "</dd></div>";
  }

  function renderProductDetail(model, p, product, o) {
    var ui = model.ui;
    var spec = product.particleSize;
    var html = '<div class="lj-detail" style="' + accentStyle(product) + '">';
    html += '<p class="lj-eyebrow">' + esc(fmt(ui.productEyebrow, { portfolio: p.label })) + "</p>";
    html += '<h4 class="lj-panel__title" tabindex="-1">' + esc(product.name) + "</h4>";
    if (hasText(product.description)) html += '<p class="lj-panel__text">' + esc(product.description) + "</p>";

    var rows = "";
    if (hasText(product.productType)) rows += specRow(ui.fieldProductType, esc(product.productType));
    if (product.stageIds.length) {
      rows += specRow(ui.fieldStages, '<ul class="lj-tags">' + stageNames(p, product).map(function (n) {
        return "<li>" + esc(n) + "</li>";
      }).join("") + "</ul>");
    }
    if (hasText(product.application)) rows += specRow(ui.fieldApplication, esc(product.application));
    if (product.variants.length) {
      rows += specRow(ui.fieldVariants, '<ul class="lj-tags">' + product.variants.map(function (v) {
        return "<li>" + esc(v) + "</li>";
      }).join("") + "</ul>");
    }
    if (spec) {
      var sizeHtml = (spec.type === "grades" && spec.label ? '<span class="lj-specs__sub">' + esc(spec.label) + "</span> " : "") +
        esc(formatSize(spec)) + provisionalBadge(spec, ui);
      if (spec.type === "range" && chartable(spec, p.sizeChart)) {
        sizeHtml += '<span class="lj-minibar" aria-hidden="true"><span style="left: ' + pct(spec.min, p.sizeChart) +
          "; width: calc(" + pct(spec.max, p.sizeChart) + " - " + pct(spec.min, p.sizeChart) + ');"></span></span>' +
          '<span class="lj-minibar__scale" aria-hidden="true"><span>' + esc(p.sizeChart.min) + "</span><span>" +
          esc(p.sizeChart.max + " " + p.sizeChart.unit) + "</span></span>";
      }
      rows += specRow(ui.fieldParticleSize, sizeHtml);
    }
    if (product.technicalNotes.length) {
      rows += specRow(ui.fieldTechnicalNotes, '<ul class="lj-list">' + product.technicalNotes.map(function (n) {
        return "<li>" + esc(n) + "</li>";
      }).join("") + "</ul>");
    }
    if (hasText(product.marketAvailability)) rows += specRow(ui.fieldMarkets, esc(product.marketAvailability));
    if (rows) html += '<dl class="lj-specs">' + rows + "</dl>";

    if (hasText(product.url)) {
      html += '<a class="lj-cta" href="' + esc(product.url) + '">' + esc(ui.viewDetails) +
        '<span class="lj-vh">: ' + esc(product.name) + "</span></a>";
    }
    return html + "</div>";
  }

  // No-JS / crawler fallback: every product's details as plain HTML.
  function renderProductIndex(model, p) {
    var html = '<div class="lj-index">';
    p.products.forEach(function (product) {
      html += '<article class="lj-index__item">' +
        renderProductDetail(model, p, product, {}).replace(' tabindex="-1"', "") + "</article>";
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

  Journey.prototype.panelEl = function () {
    return this.el.querySelector('[data-portfolio-panel="' + this.state.portfolio + '"]');
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
      if (action === "clear") this.clear();
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
    var uid = this.uid;
    Array.prototype.forEach.call(this.el.querySelectorAll('[role="tab"]'), function (tab) {
      var on = tab.getAttribute("data-portfolio") === id;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      if (on) tab.removeAttribute("tabindex"); else tab.setAttribute("tabindex", "-1");
    });
    Array.prototype.forEach.call(this.el.querySelectorAll("[data-portfolio-panel]"), function (panel) {
      panel.hidden = panel.getAttribute("data-portfolio-panel") !== id;
    });
    this.update();
    var p = this.portfolio();
    this.announce(fmt(this.model.ui.announcePortfolio, { portfolio: p.label }));
    if (typeof this.options.onChange === "function") this.options.onChange(Object.assign({ uid: uid }, this.state));
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
  };

  Journey.prototype.clear = function () {
    this.state.stage = null;
    this.state.product = null;
    this.update();
    this.announce(this.model.ui.announceCleared);
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
    var panelEl = this.panelEl();
    if (!p || !panelEl) return;
    var state = this.state;
    var stage = state.stage ? p.lookup[state.stage] : null;
    var product = state.product ? p.productById[state.product] : null;

    panelEl.classList.toggle("has-stage", !!stage);
    panelEl.classList.toggle("has-product", !!product);

    Array.prototype.forEach.call(panelEl.querySelectorAll("[data-stage-id]"), function (btn) {
      var id = btn.getAttribute("data-stage-id");
      btn.setAttribute("aria-pressed", id === state.stage ? "true" : "false");
      btn.classList.toggle("is-related", !!product && product.stageIds.indexOf(id) !== -1);
      btn.classList.toggle("is-dimmed", !!product && product.stageIds.indexOf(id) === -1 && id !== state.stage);
    });

    var detail = panelEl.querySelector("[data-lj-panel]");
    detail.innerHTML = renderPanel(this.model, p, state, { uid: this.uid, interactive: true });

    function productState(el, id) {
      var related = !!stage && p.productById[id].stageIds.indexOf(stage.id) !== -1;
      el.classList.toggle("is-related", related);
      el.classList.toggle("is-dimmed", (!!stage && !related && id !== state.product) || (!stage && !!product && id !== state.product));
      el.classList.toggle("is-selected", id === state.product);
    }
    Array.prototype.forEach.call(panelEl.querySelectorAll("[data-product-id]"), function (el) {
      var id = el.getAttribute("data-product-id");
      if (el.hasAttribute("aria-pressed")) el.setAttribute("aria-pressed", id === state.product ? "true" : "false");
      productState(el, id);
    });
    Array.prototype.forEach.call(panelEl.querySelectorAll("[data-segment-of]"), function (el) {
      productState(el, el.getAttribute("data-segment-of"));
    });
    Array.prototype.forEach.call(panelEl.querySelectorAll("[data-chart-product]"), function (el) {
      productState(el, el.getAttribute("data-chart-product"));
    });

    if (opts.focusPanel) {
      var heading = detail.querySelector(".lj-panel__title");
      if (heading) heading.focus({ preventScroll: true });
    }
    // On narrow screens the panel sits below the products: bring it into view.
    if ((opts.reveal || opts.focusPanel) && root.matchMedia && root.matchMedia(NARROW_QUERY).matches) {
      var rect = detail.getBoundingClientRect();
      if (rect.top > root.innerHeight * 0.75 || rect.top < 0) {
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
