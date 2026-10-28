#!/usr/bin/env node
/*
 * Pre-renders the module into index.html (between the LARVIVA markers) and
 * exports each dataset as JSON for CMS import or a data-src endpoint.
 *
 *   node scripts/build.js
 *
 * No dependencies. In production the CMS template would call the same
 * LarvivaJourney.renderModule() server-side (Node) or reproduce its markup.
 */
"use strict";

var fs = require("fs");
var path = require("path");

var rootDir = path.resolve(__dirname, "..");
var journey = require(path.join(rootDir, "src/larviva-journey.js"));
var illustrations = require(path.join(rootDir, "src/larviva-illustrations.js"));

// Export every data/larviva-journey.<locale>.js as JSON.
var dataDir = path.join(rootDir, "data");
fs.readdirSync(dataDir).filter(function (f) { return /^larviva-journey\.[\w-]+\.js$/.test(f); }).forEach(function (file) {
  var data = require(path.join(dataDir, file));
  var out = path.join(dataDir, file.replace(/\.js$/, ".json"));
  fs.writeFileSync(out, JSON.stringify(data, null, 2) + "\n");
  console.log("wrote " + path.relative(rootDir, out));
});

// Pre-render the English dataset into index.html.
var data = require(path.join(dataDir, "larviva-journey.en.js"));
var html = journey.renderModule(journey.prepare(data), {
  interactive: false,
  illustrations: illustrations,
  uid: "lj-static"
});

var indexPath = path.join(rootDir, "index.html");
var page = fs.readFileSync(indexPath, "utf8");
var pattern = /(<!-- LARVIVA:START -->)[\s\S]*?(<!-- LARVIVA:END -->)/;
if (!pattern.test(page)) {
  console.error("index.html is missing the LARVIVA:START / LARVIVA:END markers");
  process.exit(1);
}
fs.writeFileSync(indexPath, page.replace(pattern, function (m, start, end) {
  return start + "\n" + html + "\n" + end;
}));
console.log("pre-rendered module into index.html");
