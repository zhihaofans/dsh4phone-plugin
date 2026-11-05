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

function loadPlugin({ hostname, port, cookie }, windowOverrides = {}, documentOverrides) {
  let registration = null
  const window = {
    __ModuleLoader__: { load: (value) => { registration = value } },
    location: { hostname, port },
    ...windowOverrides,
  }
  // Keep the caller's document object: mutation-heavy fakes (activeElement,
  // synthetic focus events, timers) must stay visible to the plugin.
  const document = documentOverrides ?? {}
  document.cookie = cookie
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

function createElement(tag = 'div') {
  const attributes = new Map()
  const listeners = new Map()
  const element = {
    nodeType: 1,
    tagName: tag.toUpperCase(),
    id: '',
    className: '',
    innerHTML: '',
    textContent: '',
    type: '',
    dataset: {},
    style: {
      values: new Map(),
      setProperty(key, value) { this.values.set(key, value) },
      removeProperty(key) { this.values.delete(key) },
    },
    children: [],
    parentElement: null,
    append(...nodes) {
      for (const node of nodes) {
        if (node === null || node === undefined) continue
        node.parentElement = element
        element.children.push(node)
      }
    },
    remove() {
      if (element.parentElement !== null) {
        element.parentElement.children = element.parentElement.children.filter((child) => child !== element)
      }
    },
    setAttribute(key, value = '') { attributes.set(key, String(value)) },
    getAttribute(key) { return attributes.has(key) ? attributes.get(key) : null },
    removeAttribute(key) { attributes.delete(key) },
    hasAttribute(key) { return attributes.has(key) },
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type).add(handler)
    },
    removeEventListener(type, handler) { listeners.get(type)?.delete(handler) },
    dispatch(type, event) { for (const handler of listeners.get(type) ?? []) handler(event) },
    querySelector(selector) {
      const walk = (node) => {
        for (const child of node.children) {
          if (selector === '[data-sidebar-mask]' && child.hasAttribute('data-sidebar-mask')) return child
          const nested = walk(child)
          if (nested !== null) return nested
        }
        return null
      }
      return walk(element)
    },
    querySelectorAll() { return [] },
    closest() { return null },
    focus() {},
    scrollIntoView() {},
  }
  return element
}

/**
 * Build the two useful frame shapes:
 * - DSH 0.2.2 drawer (<768px): mask, sidebar, center, rightbar;
 * - older DSH / landscape: sidebar, center, rightbar.
 * `withColumnClasses` stays on by default; the false variant exercises the
 * mask-aware index fallback.
 */
function makeDom({ nativeDrawer = false, withColumnClasses = true, matches = true }) {
  const sidebar = createElement()
  const center = createElement()
  const rightbar = createElement()
  const mask = nativeDrawer ? createElement() : null
  if (withColumnClasses) {
    sidebar.className = 'PIRFFq_sidebarCol'
    center.className = 'PIRFFq_centerCol'
    rightbar.className = 'PIRFFq_rightbarCol'
  }
  if (mask !== null) mask.setAttribute('data-sidebar-mask', '')
  const frame = createElement()
  frame.className = 'PIRFFq_frame'
  frame.children = nativeDrawer ? [mask, sidebar, center, rightbar] : [sidebar, center, rightbar]
  for (const child of frame.children) child.parentElement = frame
  frame.setAttribute('data-sidebar-collapsed', '')
  frame.setAttribute('data-rightbar-collapsed', '')
  if (nativeDrawer) frame.setAttribute('data-sidebar-drawer', '')
  const overlay = { parentElement: frame }
  const documentElement = {
    dataset: {},
    style: {
      values: new Map(),
      setProperty(key, value) { this.values.set(key, value) },
      removeProperty(key) { this.values.delete(key) },
    },
  }
  const head = createElement('head')
  const body = createElement('body')
  const listeners = new Map()
  const document = {
    cookie: 'dsh4phone_gateway=3721',
    documentElement,
    head,
    body,
    activeElement: body,
    createElement: (tag) => createElement(tag),
    querySelector: (selector) => selector === '[data-shell-overlay]' ? overlay : null,
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type).add(handler)
    },
    removeEventListener(type, handler) { listeners.get(type)?.delete(handler) },
    dispatch(type, event) { for (const handler of listeners.get(type) ?? []) handler(event) },
  }
  const window = {
    matchMedia: () => ({ matches, addEventListener() {}, removeEventListener() {} }),
    innerHeight: 844,
    addEventListener() {},
    removeEventListener() {},
    setTimeout: (callback) => { callback(); return 0 },
  }
  return { document, window, documentElement, frame, sidebar, center, rightbar, mask, body }
}

function mount(dom) {
  const plugin = loadPlugin(
    { hostname: '192.168.5.24', port: '3721', cookie: 'dsh4phone_gateway=3721' },
    dom.window,
    dom.document,
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
  return { disposers, injections }
}

function runViewportCase({ matches, label }) {
  const dom = makeDom({ matches })
  const { disposers, injections } = mount(dom)
  if (matches) {
    check(`${label}: mobile layer installed`, dom.documentElement.dataset.d4pMobile === 'true', String(dom.documentElement.dataset.d4pMobile))
    check(`${label}: no desktop slots`, injections.length === 0, `${injections.length} slot(s)`)
    for (const dispose of disposers.reverse()) dispose()
    check(`${label}: cleanup removes the layer`, dom.documentElement.dataset.d4pMobile === undefined)
    return
  }
  check(`${label}: wide gateway stays stock`, dom.documentElement.dataset.d4pMobile === undefined)
}

/**
 * The 0.2.2 regression: the frame's first child is the empty drawer mask, so
 * index-only lookup used to mark the mask as the sidebar and open a blank
 * drawer. Every column must be found by its class suffix, or by index after
 * removing the mask.
 */
function runDrawerCase({ label, nativeDrawer, withColumnClasses = true }) {
  const dom = makeDom({ nativeDrawer, withColumnClasses })
  const { disposers, injections } = mount(dom)
  check(`${label}: mobile layer installed`, dom.documentElement.dataset.d4pMobile === 'true')
  check(`${label}: real sidebar marked`, dom.sidebar.hasAttribute('data-d4p-sidebar'))
  check(`${label}: center marked`, dom.center.hasAttribute('data-d4p-center'))
  check(`${label}: rightbar marked`, dom.rightbar.hasAttribute('data-d4p-rightbar'))
  if (dom.mask !== null) {
    check(`${label}: native mask stays unmarked`, !dom.mask.hasAttribute('data-d4p-sidebar'))
  }
  const layer = dom.body.children.find((child) => child.hasAttribute('data-d4p-mobile-layer'))
  const scrim = layer === undefined ? undefined : layer.children.find((child) => child.className === 'd4p-mobile-scrim')
  check(`${label}: ${nativeDrawer ? 'native mask reused' : 'fallback scrim installed'}`, nativeDrawer ? scrim === undefined : scrim !== undefined)
  check(`${label}: no desktop slots`, injections.length === 0)
  for (const dispose of disposers.reverse()) dispose()
  check(`${label}: cleanup removes the markers`,
    !dom.sidebar.hasAttribute('data-d4p-sidebar')
    && !dom.center.hasAttribute('data-d4p-center')
    && (dom.mask === null || !dom.mask.hasAttribute('data-d4p-sidebar'))
    && dom.documentElement.dataset.d4pMobile === undefined)
}

/**
 * Rotation can cross DSH's 768px native-drawer boundary while the phone media
 * query still matches. The observer must swap the scrim to follow the frame.
 */
class FakeMutationObserver {
  static all = []
  constructor(callback) {
    this.callback = callback
    this.target = null
    this.options = {}
    FakeMutationObserver.all.push(this)
  }
  observe(target, options = {}) {
    this.target = target
    this.options = options
  }
  disconnect() {
    this.target = null
  }
  static reset() {
    FakeMutationObserver.all = []
  }
}

function runDrawerModeSwitchCase() {
  const previous = globalThis.MutationObserver
  globalThis.MutationObserver = FakeMutationObserver
  FakeMutationObserver.reset()
  const dom = makeDom({ nativeDrawer: true })
  const { disposers } = mount(dom)
  try {
    const layer = dom.body.children.find((child) => child.hasAttribute('data-d4p-mobile-layer'))
    const scrimOf = () => layer.children.find((child) => child.className === 'd4p-mobile-scrim')
    const observer = FakeMutationObserver.all.find((entry) =>
      entry.target === dom.frame && entry.options.attributeFilter?.includes('data-sidebar-drawer'))
    check('rotation: drawer observer watches the native mode', observer !== undefined)
    check('rotation: native mode starts without a scrim', scrimOf() === undefined)
    dom.frame.removeAttribute('data-sidebar-drawer')
    observer.callback([])
    check('rotation: leaving native mode installs the scrim', scrimOf() !== undefined)
    check('rotation: fallback mode is not duplicated', layer.children.filter((child) => child.className === 'd4p-mobile-scrim').length === 1)
    dom.frame.setAttribute('data-sidebar-drawer', '')
    observer.callback([])
    check('rotation: returning to native mode removes the scrim', scrimOf() === undefined)
  } finally {
    for (const dispose of disposers.reverse()) dispose()
    globalThis.MutationObserver = previous
  }
}

/**
 * iOS keyboard state machine: shrink and follow visualViewport while a text
 * field has focus, then ignore stale iOS 26 numbers once it loses focus. The
 * short hold after focusout keeps toolbar buttons under the finger.
 */
function runKeyboardViewportCase() {
  const dom = makeDom({ nativeDrawer: true })
  const viewportListeners = new Map()
  const viewport = {
    height: 844,
    offsetTop: 0,
    scale: 1,
    addEventListener(type, handler) {
      if (!viewportListeners.has(type)) viewportListeners.set(type, new Set())
      viewportListeners.get(type).add(handler)
    },
    removeEventListener(type, handler) { viewportListeners.get(type)?.delete(handler) },
    emit(type) { for (const handler of viewportListeners.get(type) ?? []) handler({ type }) },
  }
  const timers = new Map()
  let timerId = 0
  Object.assign(dom.window, {
    visualViewport: viewport,
    setTimeout(callback) {
      timers.set(timerId += 1, callback)
      return timerId
    },
    clearTimeout(id) { timers.delete(id) },
    scrollX: 0,
    scrollY: 0,
    scrollTo() {},
  })
  const { disposers } = mount(dom)
  const cssVar = (name) => dom.documentElement.style.values.get(name) ?? null
  const input = createElement('textarea')
  const focus = (target) => {
    dom.document.activeElement = target
    dom.document.dispatch('focusin', { target })
  }
  const blur = (target) => {
    dom.document.activeElement = dom.document.body
    dom.document.dispatch('focusout', { target })
  }
  const runTimers = () => {
    const callbacks = [...timers.values()]
    timers.clear()
    for (const callback of callbacks) callback()
  }
  check('keyboard: starts at the layout height',
    cssVar('--d4p-vv-height') === '844px' && cssVar('--d4p-vv-top') === '0px',
    `${cssVar('--d4p-vv-top')} / ${cssVar('--d4p-vv-height')}`)
  focus(input)
  viewport.height = 500
  viewport.emit('resize')
  check('keyboard: open shrinks the app', cssVar('--d4p-vv-height') === '500px' && cssVar('--d4p-vv-top') === '0px')
  viewport.offsetTop = 100
  viewport.emit('scroll')
  check('keyboard: pan aligns the app top', cssVar('--d4p-vv-top') === '100px' && cssVar('--d4p-vv-height') === '500px')
  blur(input)
  viewport.height = 640
  viewport.offsetTop = 0
  viewport.emit('resize')
  check('keyboard: close holds the tap target', cssVar('--d4p-vv-top') === '100px' && cssVar('--d4p-vv-height') === '500px')
  runTimers()
  check('keyboard: close restores the layout height', cssVar('--d4p-vv-top') === '0px' && cssVar('--d4p-vv-height') === '844px')
  focus(input)
  viewport.height = 500
  viewport.emit('resize')
  check('keyboard: reopens immediately', cssVar('--d4p-vv-height') === '500px' && cssVar('--d4p-vv-top') === '0px')
  const button = createElement('button')
  focus(button)
  dom.document.dispatch('focusout', { target: input })
  viewport.height = 620
  viewport.offsetTop = 0
  viewport.emit('resize')
  check('keyboard: toolbar focus keeps the target steady', cssVar('--d4p-vv-height') === '500px')
  runTimers()
  check('keyboard: toolbar focus then restores the layout', cssVar('--d4p-vv-top') === '0px' && cssVar('--d4p-vv-height') === '844px')
  for (const dispose of disposers.reverse()) dispose()
}

/**
 * Composer toolbar taps must not move focus out of the editor: doing so
 * collapses the iOS keyboard before click arrives.
 */
function runComposerTapCase() {
  const dom = makeDom({ nativeDrawer: true })
  const { disposers } = mount(dom)
  const seat = createElement('div')
  const editor = createElement('div')
  editor.isContentEditable = true
  editor.parentElement = seat
  editor.closest = (selector) => selector.includes('_composerSeat') ? seat : null
  const button = createElement('button')
  button.closest = (selector) => selector.includes('button') ? button : null
  dom.document.activeElement = editor
  dom.document.dispatch('focusin', { target: editor })
  check('composer: binds the toolbar container', seat.hasAttribute('data-d4p-composer'))
  const buttonEvent = { target: button, prevented: false, preventDefault() { this.prevented = true } }
  seat.dispatch('mousedown', buttonEvent)
  check('composer: toolbar mousedown keeps the editor focus', buttonEvent.prevented)
  const editorEvent = { target: editor, prevented: false, preventDefault() { this.prevented = true } }
  seat.dispatch('mousedown', editorEvent)
  check('composer: editor mousedown is left alone', !editorEvent.prevented)
  for (const dispose of disposers.reverse()) dispose()
}

runViewportCase({ matches: true, label: '390px gateway' })
runViewportCase({ matches: false, label: '1280px gateway' })
runDrawerCase({ label: '0.2.2 drawer frame', nativeDrawer: true })
runDrawerCase({ label: '0.2.2 drawer frame without column classes', nativeDrawer: true, withColumnClasses: false })
runDrawerCase({ label: '0.2.1 frame', nativeDrawer: false })
runDrawerModeSwitchCase()
runKeyboardViewportCase()
runComposerTapCase()

const failed = results.filter((result) => !result.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length === 0 ? 0 : 1)
