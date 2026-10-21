/**
 * Client-half tests:
 * - the desktop control panel registers only on the desktop surface;
 * - a phone-sized gateway surface installs the mobile shell instead;
 * - a wide gateway surface stays on the stock layout.
 */
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
const React = {
  createElement: (...args) => ({ args }),
  Fragment: 'Fragment',
  useState: () => [null, () => {}],
  useEffect: () => {},
  useRef: () => ({ current: null }),
  useCallback: (fn) => fn,
}

function loadPlugin({ hostname, port, cookie }, windowOverrides = {}, documentOverrides = {}) {
  let registration = null
  const window = {
    __ModuleLoader__: { load: (value) => { registration = value } },
    location: { hostname, port },
    ...windowOverrides,
  }
  const document = { cookie, ...documentOverrides }
  new Function('window', 'document', 'navigator', source)(window, document, {})
  if (registration === null) throw new Error('client module did not register')
  if (registration.id !== 'dsh4phone') throw new Error(`unexpected client module id: ${registration.id}`)
  return registration.factory(() => React)
}

function applyPlugin(surface, windowOverrides = {}, documentOverrides = {}) {
  const plugin = loadPlugin(surface, windowOverrides, documentOverrides)
  const injections = []
  const ctx = {
    effect: (fn) => { const dispose = fn(); return typeof dispose === 'function' ? dispose : () => {} },
    get: (name) => name === 'layout' ? { toggleSidebar() {}, closeRightbar() {} } : undefined,
    locale: {
      register: () => () => {},
      bind: () => (key) => key,
      subscribe: () => () => {},
    },
    slots: {
      inject: (key, callback) => { injections.push(key); callback(); return () => {} },
      register: () => () => {},
    },
  }
  plugin.apply(ctx)
  return injections
}

const results = []
function check(name, condition, detail = '') {
  results.push({ name, ok: Boolean(condition) })
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
}

const cases = [
  ['LAN IP, no marker yet', { hostname: '192.168.5.24', port: '3721', cookie: '' }, 2],
  ['LAN IP, matching marker', { hostname: '192.168.5.24', port: '3721', cookie: 'dsh4phone_gateway=3721' }, 0],
  ['LAN IP, unrelated cookie', { hostname: '192.168.5.24', port: '3721', cookie: 'theme=dark' }, 2],
  ['10.x gateway page', { hostname: '10.0.0.7', port: '3721', cookie: 'dsh4phone_gateway=3721' }, 0],
  ['172.20 hotspot gateway page', { hostname: '172.20.10.2', port: '3721', cookie: 'dsh4phone_gateway=3721' }, 0],
  ['100.64 CGNAT gateway page', { hostname: '100.64.0.1', port: '3721', cookie: 'dsh4phone_gateway=3721' }, 0],
  ['IPv6 link-local gateway page', { hostname: '[fe80::1]', port: '3721', cookie: 'dsh4phone_gateway=3721' }, 0],
  ['IPv6 ULA gateway page', { hostname: '[fd00::1]', port: '3721', cookie: 'dsh4phone_gateway=3721' }, 0],
  ['loopback desktop, no marker', { hostname: '127.0.0.1', port: '56630', cookie: '' }, 2],
  ['loopback desktop with gateway marker on another port', { hostname: '127.0.0.1', port: '56630', cookie: 'dsh4phone_gateway=3721' }, 2],
  ['loopback gateway page', { hostname: '127.0.0.1', port: '3721', cookie: 'dsh4phone_gateway=3721' }, 0],
  ['localhost desktop', { hostname: 'localhost', port: '56630', cookie: '' }, 2],
  ['IPv6 loopback desktop', { hostname: '[::1]', port: '56630', cookie: '' }, 2],
  ['custom protocol desktop', { hostname: '', port: '', cookie: '' }, 2],
  ['custom desktop host', { hostname: 'dsh.local', port: '56630', cookie: '' }, 2],
]

for (const [label, surface, expected] of cases) {
  const injections = applyPlugin(surface)
  check(label, injections.length === expected, `${injections.length} slot(s) ${JSON.stringify(injections)}`)
}

function createElement() {
  return {
    nodeType: 1,
    id: '',
    className: '',
    innerHTML: '',
    textContent: '',
    style: {},
    dataset: {},
    setAttribute() {},
    getAttribute() { return null },
    removeAttribute() {},
    append() {},
    remove() {},
    addEventListener() {},
    removeEventListener() {},
    querySelector() { return null },
    focus() {},
    hasAttribute() { return true },
  }
}

function runMobileCase({ matches, label }) {
  const sidebar = createElement()
  const center = createElement()
  const rightbar = createElement()
  const frame = createElement()
  frame.children = [sidebar, center, rightbar]
  const overlay = { parentElement: frame }
  const documentElement = {
    dataset: {},
    style: { setProperty() {}, removeProperty() {} },
  }
  const document = {
    cookie: 'dsh4phone_gateway=3721',
    documentElement,
    head: { append() {} },
    body: { append() {} },
    createElement,
    querySelector: (selector) => selector === '[data-shell-overlay]' ? overlay : null,
    addEventListener() {},
    removeEventListener() {},
  }
  const plugin = loadPlugin(
    { hostname: '192.168.5.24', port: '3721', cookie: 'dsh4phone_gateway=3721' },
    {
      matchMedia: () => ({ matches, addEventListener() {}, removeEventListener() {} }),
      innerHeight: 844,
      addEventListener() {},
      removeEventListener() {},
    },
    document,
  )
  const disposers = []
  const injections = []
  const ctx = {
    effect: (fn) => { const dispose = fn(); disposers.push(dispose); return dispose },
    get: (name) => name === 'layout' ? { toggleSidebar() {}, closeRightbar() {} } : undefined,
    locale: {
      register: () => () => {},
      bind: () => (key) => key,
      subscribe: () => () => {},
    },
    slots: {
      inject: (key, callback) => { injections.push(key); callback(); return () => {} },
      register: () => () => {},
    },
  }
  plugin.apply(ctx)
  if (matches) {
    check(`${label}: mobile layer installed`, documentElement.dataset.d4pMobile === 'true', String(documentElement.dataset.d4pMobile))
    check(`${label}: no desktop slots`, injections.length === 0, `${injections.length} slot(s)`)
    for (const dispose of disposers.reverse()) dispose()
    check(`${label}: cleanup removes the layer`, documentElement.dataset.d4pMobile === undefined)
  } else {
    check(`${label}: wide gateway stays stock`, documentElement.dataset.d4pMobile === undefined)
  }
}

runMobileCase({ matches: true, label: '390px gateway' })
runMobileCase({ matches: false, label: '1280px gateway' })

const failed = results.filter((result) => !result.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length === 0 ? 0 : 1)
