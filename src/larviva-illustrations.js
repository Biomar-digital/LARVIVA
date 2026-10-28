/*
 * LARVIVA Interactive Hatchery Journey — placeholder stage illustrations.
 *
 * ILLUSTRATION ASSETS: every stage/activity in the dataset has an
 * `illustration` key that maps to an entry below. These are simple line
 * drawings for the prototype only. Replace each value with approved LARVIVA
 * artwork, either as inline SVG markup (keeps currentColor theming) or as an
 * <img> tag, e.g.
 *   "fish-nursery": '<img src="/assets/larviva/fish-nursery.svg" alt="">'
 * Illustrations are decorative (the stage label carries the meaning), so
 * keep alt="" / aria-hidden.
 *
 * All drawings use a 120 × 60 viewBox and `currentColor`.
 */
(function (root) {
  function svg(body) {
    return '<svg viewBox="0 0 120 60" width="120" height="60" focusable="false" aria-hidden="true" ' +
      'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
      body + '</svg>';
  }

  // Juvenile fish outline, head to the left; reused at different scales.
  var FISH =
    '<path d="M14 30 C28 15 66 13 88 25 L106 15 L101 30 L106 45 L88 35 C66 47 28 45 14 30 Z"/>' +
    '<path d="M46 18 Q57 8 70 17"/>' +
    '<path d="M38 34 Q44 41 51 38"/>' +
    '<path d="M32 22 Q36 30 32 38"/>' +
    '<circle cx="24" cy="27.5" r="2.2" fill="currentColor" stroke="none"/>';

  var ILLUSTRATIONS = {
    // Larva with remaining oil droplet, large eye and continuous fin fold.
    "fish-first-feeding": svg(
      '<path d="M22 30 C26 25 38 25 48 27.5 L94 29.2 L94 30.8 L48 32.5 C38 35 26 35 22 30 Z"/>' +
      '<path d="M44 26 C66 19 92 22 104 30 C92 38 66 41 44 34" stroke-width="1" opacity=".7"/>' +
      '<circle cx="27" cy="29.5" r="3" fill="currentColor" stroke="none"/>' +
      '<circle cx="37" cy="33" r="2.4"/>'
    ),
    // Larger larva with rotifers nearby (co-feeding).
    "fish-co-feeding": svg(
      '<path d="M30 30 C35 23 50 23 62 26.5 L100 28.5 L100 31.5 L62 33.5 C50 37 35 37 30 30 Z"/>' +
      '<path d="M58 25 C76 18 98 21 108 30 C98 39 76 42 58 35" stroke-width="1" opacity=".7"/>' +
      '<path d="M44 33 Q52 36 60 33" stroke-width="1"/>' +
      '<circle cx="36" cy="29" r="3" fill="currentColor" stroke="none"/>' +
      '<ellipse cx="12" cy="22" rx="3.5" ry="5"/><path d="M10 16.5 l-1 -2 M12 16 v-2.3 M14 16.5 l1 -2" stroke-width="1"/>' +
      '<ellipse cx="17" cy="42" rx="3.5" ry="5"/><path d="M15 36.5 l-1 -2 M17 36 v-2.3 M19 36.5 l1 -2" stroke-width="1"/>'
    ),
    // Small fry with fins forming.
    "fish-post-weaning": svg(
      '<g transform="translate(18 9) scale(0.72)">' + FISH + '</g>' +
      '<path d="M18 40 h4 M26 44 h3 M22 48 h3" stroke-width="1" opacity=".6"/>'
    ),
    // Juvenile fish.
    "fish-nursery": svg('<g transform="translate(2 1) scale(0.98)">' + FISH + '</g>'),
    // Adult fish with eggs.
    "fish-broodstock": svg(
      '<g transform="translate(14 0) scale(0.86)">' + FISH + '</g>' +
      '<circle cx="12" cy="44" r="3"/><circle cx="19" cy="49" r="3"/><circle cx="9" cy="52" r="2.6"/>' +
      '<circle cx="22" cy="42" r="2.4"/>'
    ),
    // Rotifer (left) and Artemia nauplius (right).
    "fish-live-feed": svg(
      '<ellipse cx="34" cy="30" rx="9" ry="13"/>' +
      '<path d="M27 18 l-3 -5 M31 16.5 l-1 -5.5 M37 16.5 l1 -5.5 M41 18 l3 -5"/>' +
      '<path d="M34 43 v8 M32 51 h4"/>' +
      '<path d="M66 30 C70 22 86 22 96 28 L106 30 L96 32 C86 38 70 38 66 30 Z"/>' +
      '<circle cx="70" cy="30" r="1.8" fill="currentColor" stroke="none"/>' +
      '<path d="M74 24 l-6 -9 M78 23 l-2 -10 M74 36 l-6 9 M78 37 l-2 10"/>'
    ),
    // Zoea: rounded carapace, compound eyes, long abdomen, feathery limbs.
    "shrimp-zoea": svg(
      '<ellipse cx="40" cy="28" rx="13" ry="10"/>' +
      '<circle cx="30" cy="23" r="3.2" fill="currentColor" stroke="none"/>' +
      '<path d="M53 29 L94 31 M94 31 l9 -6 M94 31 l9 6"/>' +
      '<path d="M28 21 l-14 -10 M30 19 l-6 -13"/>' +
      '<path d="M34 37 l-10 14 M28 46 l-5 -1 M40 38 l-4 16 M37 49 l-4 -1 M46 37 l2 15 M47 48 l-4 1"/>'
    ),
    // Mysis: segmented shrimp-like body held head-down, tail fan.
    "shrimp-mysis": svg(
      '<path d="M18 26 C28 16 56 15 76 22 C88 26 96 33 100 42"/>' +
      '<path d="M18 26 C28 34 56 34 74 32 C84 31 90 36 94 44"/>' +
      '<path d="M54 18 v15 M64 19.5 v13 M74 22 v10 M84 27 v8" stroke-width="1"/>' +
      '<path d="M97 43 l-4 9 M97 43 l3 9 M97 43 l8 6"/>' +
      '<circle cx="22" cy="24" r="2.8" fill="currentColor" stroke="none"/>' +
      '<path d="M16 24 l-8 -10 M18 22 l-2 -12"/>' +
      '<path d="M32 33 l-3 10 M40 34 l-2 10 M48 34 l-1 10" stroke-width="1"/>'
    ),
    // Post-larva: small shrimp with rostrum, long antennae and tail fan.
    "shrimp-post-larvae": svg(
      '<path d="M26 30 C34 20 54 19 72 22 C84 24 92 28 98 31 C92 34 84 37 72 38 C54 41 34 40 26 30 Z"/>' +
      '<path d="M26 28 L12 24"/>' +
      '<path d="M28 27 C20 16 10 12 2 14 M30 26 C26 14 22 8 14 4" stroke-width="1"/>' +
      '<path d="M98 31 l8 -7 M98 31 l9 0 M98 31 l8 7"/>' +
      '<path d="M48 21 v18 M60 21 v18 M72 22 v16 M84 25 v11" stroke-width="1"/>' +
      '<circle cx="31" cy="28" r="2.4" fill="currentColor" stroke="none"/>' +
      '<path d="M38 38 l-2 9 M44 39 l-1 9 M50 39 v9 M58 39 v8" stroke-width="1"/>'
    )
  };

  if (typeof module === "object" && module.exports) {
    module.exports = ILLUSTRATIONS;
  } else {
    root.LARVIVA_ILLUSTRATIONS = ILLUSTRATIONS;
  }
})(typeof window !== "undefined" ? window : globalThis);
