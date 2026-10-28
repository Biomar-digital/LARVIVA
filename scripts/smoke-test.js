#!/usr/bin/env node
/*
 * Browser smoke test for the prototype (requires Playwright + Chromium).
 *   node scripts/smoke-test.js [screenshotDir]
 */
"use strict";

var path = require("path");
var assert = require("assert");
var chromium = require("playwright").chromium;

var url = "file://" + path.resolve(__dirname, "..", "index.html");
var shotDir = process.argv[2];

async function run() {
  var browser = await chromium.launch();
  var errors = [];

  async function open(viewport) {
    var page = await browser.newPage({ viewport: viewport });
    page.on("pageerror", function (e) { errors.push(e.message); });
    page.on("console", function (m) { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(url);
    await page.waitForSelector("[data-larviva-ready]");
    return page;
  }

  // ── Desktop ──
  var page = await open({ width: 1366, height: 900 });
  var fish = page.locator('[data-portfolio-panel="fish"]');
  var shrimp = page.locator('[data-portfolio-panel="shrimp"]');

  assert.strictEqual(await page.getAttribute('[role="tab"][data-portfolio="fish"]', "aria-selected"), "true");
  assert.ok(await fish.isVisible(), "fish visible by default");
  assert.ok(!(await shrimp.isVisible()), "shrimp hidden by default");
  assert.strictEqual(await fish.locator(".lj-stages .lj-stage").count(), 4);
  assert.strictEqual(await page.locator("h1").count(), 1, "module adds no h1");
  assert.strictEqual(await page.locator(".lj-cta").count(), 0, "no invented product links");
  if (shotDir) await page.screenshot({ path: path.join(shotDir, "desktop-initial.png"), fullPage: true });

  // Select a stage: related products highlighted, others dimmed.
  await fish.locator('[data-stage-id="nursery"]').click();
  assert.strictEqual(await fish.locator('.lj-stages [data-stage-id="nursery"]').getAttribute("aria-pressed"), "true");
  assert.ok(await fish.locator('.lj-lanes [data-product-id="larviva-pronurse"]').evaluate(function (e) { return e.classList.contains("is-related"); }));
  assert.ok(await fish.locator('.lj-lanes [data-product-id="larviva-prostart"]').evaluate(function (e) { return e.classList.contains("is-dimmed"); }));
  assert.ok(await fish.locator('.lj-lanes [data-product-id="larviva-prostart"]').isVisible(), "dimmed product not removed");
  assert.match(await fish.locator("[data-lj-panel] .lj-panel__title").innerText(), /Nursery/);
  if (shotDir) await page.screenshot({ path: path.join(shotDir, "desktop-stage.png"), fullPage: true });

  // Select a product from the panel: details + its stages highlighted.
  await fish.locator('[data-lj-panel] [data-product-id="larviva-prowean"]').click();
  assert.match(await fish.locator("[data-lj-panel] .lj-panel__title").innerText(), /ProWean/);
  var related = await fish.locator(".lj-stages .lj-stage.is-related").evaluateAll(function (els) {
    return els.map(function (e) { return e.getAttribute("data-stage-id"); });
  });
  assert.deepStrictEqual(related, ["co-feeding-weaning", "post-weaning", "nursery"]);
  assert.ok(await page.evaluate(function () {
    return document.activeElement && document.activeElement.classList.contains("lj-panel__title");
  }), "focus moves to panel heading");
  if (shotDir) await page.screenshot({ path: path.join(shotDir, "desktop-product.png"), fullPage: true });

  // Activity: broodstock is not a journey stage.
  await fish.locator('.lj-activities [data-stage-id="broodstock-nutrition"]').click();
  assert.match(await fish.locator("[data-lj-panel]").innerText(), /Connected activity/i);
  await fish.locator('.lj-activities [data-product-id="larviva-broodstock"]').click();
  assert.match(await fish.locator("[data-lj-panel]").innerText(), /Maturation/);

  // Keyboard: arrow key on tabs switches to Shrimp and resets selection.
  await page.focus('[role="tab"][data-portfolio="fish"]');
  await page.keyboard.press("ArrowRight");
  assert.ok(await shrimp.isVisible(), "shrimp visible after switch");
  assert.ok(!(await fish.isVisible()), "fish hidden after switch");
  assert.strictEqual(await shrimp.locator('[aria-pressed="true"]').count(), 0, "selection reset");
  assert.strictEqual(await shrimp.locator(".lj-chart__row").count(), 5);

  // Keyboard activation of a product.
  await shrimp.locator('.lj-lanes [data-product-id="larviva-pl300"]').focus();
  await page.keyboard.press("Enter");
  var panelText = await shrimp.locator("[data-lj-panel]").innerText();
  assert.match(panelText, /250–375 µm/);
  assert.match(panelText, /Provisional/);
  assert.match(panelText, /Post-larvae/);
  if (shotDir) await page.screenshot({ path: path.join(shotDir, "desktop-shrimp.png"), fullPage: true });

  // Toggle off.
  await page.keyboard.press("Enter");
  assert.strictEqual(await shrimp.locator('.lj-lanes [aria-pressed="true"]').count(), 0);

  // ── Mobile ──
  var mobile = await open({ width: 375, height: 800 });
  var overflow = await mobile.evaluate(function () {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  assert.ok(overflow <= 0, "no horizontal page scroll on mobile (overflow " + overflow + "px)");
  if (shotDir) await mobile.screenshot({ path: path.join(shotDir, "mobile-initial.png"), fullPage: true });
  await mobile.locator('[data-portfolio-panel="fish"] .lj-lanes [data-product-id="larviva-prostart"]').click();
  if (shotDir) await mobile.screenshot({ path: path.join(shotDir, "mobile-product.png"), fullPage: true });
  await mobile.click('[role="tab"][data-portfolio="shrimp"]');
  overflow = await mobile.evaluate(function () {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  assert.ok(overflow <= 0, "no horizontal page scroll on mobile shrimp view");
  if (shotDir) await mobile.screenshot({ path: path.join(shotDir, "mobile-shrimp.png"), fullPage: true });

  // ── No-JS: pre-rendered content is crawlable ──
  var ctx = await browser.newContext({ javaScriptEnabled: false });
  var nojs = await ctx.newPage();
  await nojs.goto(url);
  var text = await nojs.locator("body").innerText();
  ["LARVIVA ProStart", "LARVIVA ORBIT", "LARVIVA PL 400", "Co-feeding / Weaning", "Post-larvae"].forEach(function (s) {
    assert.ok(text.indexOf(s) !== -1, "static HTML contains " + s);
  });
  assert.ok(text.indexOf("LARVIVA ZM") === -1, "unpublished products are not rendered");
  if (shotDir) await nojs.screenshot({ path: path.join(shotDir, "nojs.png"), fullPage: true });

  assert.deepStrictEqual(errors, [], "no console errors");
  await browser.close();
  console.log("smoke test passed");
}

run().catch(function (err) {
  console.error(err);
  process.exit(1);
});
