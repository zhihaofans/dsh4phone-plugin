/**
 * Client-half gate test: the desktop control panel must register only on a
 * loopback surface. A phone that opens the LAN gateway must not see a panel
 * whose Host requests the gateway blocks.
 */
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

function loadPlugin(hostname) {
  let registration = null
  const window = {
    __ModuleLoader__: { load: (value) => { registration = value } },
    location: { hostname },
  }
  const React = {
    createElement: (...args) => ({ args }),
    Fragment: 'Fragment',
    useState: () => [null, () => {}],
    useEffect: () => {},
    useRef: () => ({ current: null }),
    useCallback: (fn) => fn,
  }
  new Function('window', 'document', 'navigator', source)(window, {}, {})
  if (registration === null) throw new Error('client module did not register')
  if (registration.id !== 'dsh4phone') throw new Error(`unexpected client module id: ${registration.id}`)
  return registration.factory(() => React)
}

function applyPlugin(hostname) {
  const plugin = loadPlugin(hostname)
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
  ['192.168.5.24', 0],
  ['10.0.0.7', 0],
  ['127.0.0.1', 2],
  ['localhost', 2],
  ['[::1]', 2],
]

let failures = 0
for (const [hostname, expected] of cases) {
  const injections = applyPlugin(hostname)
  const ok = injections.length === expected
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${hostname}: ${injections.length} slot(s) ${JSON.stringify(injections)}`)
}
console.log(`\n${cases.length - failures}/${cases.length} checks passed`)
process.exit(failures === 0 ? 0 : 1)
