/**
 * JS Neurominds V1 — scripts/validate-schemas.js
 * Validates the shared schema definition is internally consistent before any
 * GAS setup runs. Catches duplicate columns, empty tabs, missing key columns,
 * and confirms the two-workbook tab counts match the documented design.
 *
 * Run: npm run validate  (this is the first half)
 */
import {
  CONFIG_CONTENT_WORKBOOK, OPERATIONS_AUDIT_WORKBOOK,
  CONFIG_CONTENT_TABS, OPERATIONS_AUDIT_TABS,
  SYSTEM_CONFIG_KEYS, ANALYTICS_CONFIG_KEYS
} from '../shared/schemas.js';

let errors = 0;
let warnings = 0;
const fail = (m) => { errors++; console.error('  ✗', m); };
const warn = (m) => { warnings++; console.warn('  !', m); };

const EXPECTED = {
  [CONFIG_CONTENT_WORKBOOK]: { tabs: CONFIG_CONTENT_TABS, count: 21 },
  [OPERATIONS_AUDIT_WORKBOOK]: { tabs: OPERATIONS_AUDIT_TABS, count: 14 }
};

console.log('Validating workbook schemas…');

for (const [workbook, { tabs, count }] of Object.entries(EXPECTED)) {
  const tabNames = Object.keys(tabs);
  console.log(`\n${workbook} — ${tabNames.length} tabs`);

  if (tabNames.length !== count) {
    fail(`${workbook} should have ${count} tabs, found ${tabNames.length}`);
  }

  for (const [tab, cols] of Object.entries(tabs)) {
    if (!Array.isArray(cols) || cols.length === 0) { fail(`${tab}: no columns defined`); continue; }
    const seen = new Set();
    for (const c of cols) {
      if (seen.has(c)) fail(`${tab}: duplicate column "${c}"`);
      seen.add(c);
      if (!/^[a-z][a-z0-9_]*$/.test(c)) warn(`${tab}: column "${c}" is not snake_case`);
    }
    // Every tab needs a stable first column (a key or natural identifier).
    if (!cols[0]) fail(`${tab}: missing key column`);
  }
}

// System/analytics config keys must be unique.
const dupCfg = SYSTEM_CONFIG_KEYS.filter((k, i) => SYSTEM_CONFIG_KEYS.indexOf(k) !== i);
if (dupCfg.length) fail(`Duplicate System_Config keys: ${dupCfg.join(', ')}`);
const dupAna = ANALYTICS_CONFIG_KEYS.filter((k, i) => ANALYTICS_CONFIG_KEYS.indexOf(k) !== i);
if (dupAna.length) fail(`Duplicate Analytics_Config keys: ${dupAna.join(', ')}`);

console.log('');
if (errors) {
  console.error(`Schema validation FAILED — ${errors} error(s), ${warnings} warning(s).`);
  process.exit(1);
}
console.log(`Schema validation passed — 35 tabs total, ${warnings} warning(s).`);
