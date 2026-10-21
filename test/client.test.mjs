/**
 * Client-half gate test: the desktop control panel must register only on a
 * loopback surface. A phone that opens the LAN gateway must not see a panel
 * whose Host requests the gateway blocks.
 */
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

function loadPlugin({ hostname, port, cookie }) {
  let registration = null
  const window = {
    __ModuleLoader__: { load: (value) => { registration = value } },
    location: { hostname, port },
  }
  const document = { cookie }
  const React = {
    createElement: (...args) => ({ args }),
    Fragment: 'Fragment',
    useState: () => [null, () => {}],
    useEffect: () => {},
    useRef: () => ({ current: null }),
    useCallback: (fn) => fn,
  }
  new Function('window', 'document', 'navigator', source)(window, document, {})
  if (registration === null) throw new Error('client module did not register')
  if (registration.id !== 'dsh4phone') throw new Error(`unexpected client module id: ${registration.id}`)
  return registration.factory(() => React)
}

function applyPlugin(surface) {
  const plugin = loadPlugin(surface)
  const injections = []
  const ctx = {
    effect: (fn) => { const dispose = fn(); return typeof dispose === 'function' ? dispose : () => {} },
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

let failures = 0
for (const [label, surface, expected] of cases) {
  const injections = applyPlugin(surface)
  const ok = injections.length === expected
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${injections.length} slot(s) ${JSON.stringify(injections)}`)
}
console.log(`\n${cases.length - failures}/${cases.length} checks passed`)
process.exit(failures === 0 ? 0 : 1)
