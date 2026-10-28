/**
 * Minimal globals so browser-oriented modules can be imported under node:test.
 * No DOM library is installed (no dependencies may be added); only what the
 * imported modules touch at module-evaluation time is stubbed.
 */
export function installBrowserStubs({ hostname = 'localhost' } = {}) {
  if (!globalThis.location) globalThis.location = { hostname, pathname: '/', search: '' };
  if (!globalThis.window) globalThis.window = globalThis;
  if (!globalThis.document) {
    globalThis.document = {
      addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
      getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; },
      createElement() { return { style: {}, classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, addEventListener() {}, appendChild() {} }; },
      head: { appendChild() {} }, body: { appendChild() {} }
    };
  }
}

/** A tiny element stand-in that records innerHTML. */
export function fakeMount() {
  const el = {
    innerHTML: '',
    querySelector() { return null; },
    querySelectorAll() { return []; },
    classList: { add() {}, remove() {}, toggle() {} }
  };
  return el;
}
