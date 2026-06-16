/**
 * JS Neurominds V1 — scripts/check-env.js
 * Reports the current API/env mode resolution and warns if live mode is
 * selected without the matching GAS URLs. Never prints secret values.
 */
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env');

const env = {};
if (existsSync(envPath)) {
  readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
  });
  console.log('.env found');
} else {
  console.log('.env not found — defaults apply (mock mode on localhost). Copy .env.example to .env to override.');
}

const mode = (env.VITE_API_MODE || 'mock').toLowerCase();
const environment = (env.VITE_ENV || 'local').toLowerCase();
console.log(`API_MODE = ${mode}`);
console.log(`ENV      = ${environment}`);

let warn = 0;
if (mode === 'live') {
  if (!env.VITE_PUBLIC_API_URL) { console.warn('! live mode but VITE_PUBLIC_API_URL is empty'); warn++; }
  if (!env.VITE_ADMIN_API_URL) { console.warn('! live mode but VITE_ADMIN_API_URL is empty'); warn++; }
}
if (env.VITE_GA4_MEASUREMENT_ID) console.log(`GA4 measurement ID present (${env.VITE_GA4_MEASUREMENT_ID.slice(0,4)}…)`);

console.log(warn ? `\ncheck-env: ${warn} warning(s).` : '\ncheck-env: ok');
