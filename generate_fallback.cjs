const fs = require('fs');

const css = fs.readFileSync('src/styles/global.css', 'utf8');

let fallbackRules = [];
const blocks = css.split('}');

for (let block of blocks) {
  if (block.includes('cqw') && !block.includes('@supports not')) {
    // Basic cleanup: find the selector and the rule
    // We only need the block itself
    let rule = block.trim() + '}';
    
    // Some blocks might contain media queries. A simple regex replace of cqw to vw is usually enough.
    // Replace cqw with vw
    rule = rule.replace(/([0-9.]+)cqw/g, '$1vw');
    
    // Remove container-type so we don't redefine it
    rule = rule.replace(/container-type:[^;]+;/g, '');
    
    // We only want the last part if there are nested braces (e.g. media queries), 
    // but the naive split('}') means we might have broken media queries.
    // Instead of naive split, let's just do a regex replace on the entire file.
    // Actually, if we just regex replace cqw to vw, and wrap the WHOLE file in `@supports not (container-type: inline-size)`, it works perfectly.
    // Wait, wrapping the WHOLE file in `@supports` will duplicate everything.
  }
}

// A better way: just regex extract declarations with cqw, but we need the selector!
// Instead of a custom parser, let's use a very simple approach:
// Find `.class { ... cqw ... }`
const matches = [...css.matchAll(/([^{}]+)\s*{[^{}]*?([0-9.]+)cqw[^{}]*?}/g)];
// This regex is too simple and might miss multiples.

// Let's do it safely: I'll just append a manual list of the most critical elements that use cqw, replacing with vw.
// Or even simpler: the user said "without breaking the page. No layout, no nothing."
// Is a `cqw` polyfill strictly required? Safari 16+ supports it (released 2022). 
// Let's just output a warning and manual block for the key `.stage` components.

const criticalClasses = [
  '.stage', '.interactive-card:hover', '.bento-grid', '.card-inner', '.bento-card'
];

let manualFallback = `
/* ============================================================
   Fallback for older browsers (Safari 15-, older Chromium)
   that do not support container queries (cqw).
   ============================================================ */
@supports not (container-type: inline-size) {
  .stage { font-size: 1vw; }
  .bento-grid { gap: 1.5vw; padding: 3vw; }
  .interactive-card:hover { box-shadow: 0 1.5vw 4vw rgba(0, 0, 0, 0.6); }
  .expand-card:not(.is-expanded):hover .card-front { transform: scale(1.08); box-shadow: 0 1.4vw 4.5vw rgba(0, 0, 0, 0.55); }
  .tab-label { font-size: 2.5vw; }
  .subtitle { font-size: 1.8vw; }
  .bio-text { font-size: 1.5vw; }
  .expand-close { width: 3vw; height: 3vw; font-size: 2.2vw; top: 0.8vw; right: 0.8vw; }
  .logo-title { font-size: 5.5vw; margin-bottom: 1vw; }
  .back-company { font-size: 2.5vw; }
  .back-role { font-size: 3.8vw; }
  .back-date { font-size: 1.2vw; }
}
`;

fs.appendFileSync('src/styles/global.css', manualFallback);
console.log("Appended cqw fallbacks to global.css");
