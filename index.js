/**
 * dsh4phone — open this DeepSeek Harness from a phone on the same local
 * network, protected by a password the user chooses.
 *
 * Host half: a small HTTP/WebSocket gateway bound to the LAN that requires a
 * signed session cookie, proxies to this process's loopback Web GUI as the
 * local operator, and serves the desktop control API used by the sidebar
 * panel. The Client half lives in `client.js`.
 *
 * The gateway never exposes the admin API: that route exists only on the
 * loopback Web server, and every admin request is checked for a loopback
 * peer, a loopback Host, a same-authority Origin, and the private
 * `x-dsh4phone` header.
 */
import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { createServer, request as httpRequest } from 'node:http'
import { createRequire } from 'node:module'
import { homedir, networkInterfaces } from 'node:os'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import qrcode from './qr.js'

const scrypt = promisify(scryptCallback)
const manifest = createRequire(import.meta.url)('./package.json')

/** Stable Cordis plugin name. */
export const name = 'dsh4phone'

/** The loopback Web carrier and its browser-session owner. */
export const inject = ['webServer', 'connection']

const VERSION = typeof manifest.version === 'string' ? manifest.version : '0.0.1'
const DEFAULT_PORT = 3721
const ADMIN_PREFIX = '/dsh4phone/api'
const LOGIN_PATH = '/__dsh4phone/login'
const LOGOUT_PATH = '/__dsh4phone/logout'
const SESSION_COOKIE = 'dsh4phone_session'
const DEVICE_COOKIE = 'dsh4phone_device'
const DEVICE_COOKIE_MAX_AGE = 365 * 24 * 60 * 60
const DEVICE_LIMIT = 50
const DEVICE_TOUCH_MS = 15_000
const DEVICE_WRITE_DELAY_MS = 30_000
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const COOKIE_REFRESH_MS = 6 * 60 * 60 * 1000
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64, maxmem: 64 * 1024 * 1024 }
const MAX_LOGIN_FAILURES = 5
const FAILURE_WINDOW_MS = 10 * 60 * 1000
const BLOCK_MS = 10 * 60 * 1000
const PUBLIC_PATHS = new Set(['/manifest.webmanifest', '/favicon.svg', '/favicon-dark.svg', '/favicon.ico'])

const STATUS_TEXT = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  413: 'Payload Too Large',
  429: 'Too Many Requests',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
}

const PHONE_MARK = `<svg class="mark" viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">
  <rect x="2" y="2" width="60" height="60" rx="16" fill="#4d6bfe"/>
  <rect x="21" y="12" width="22" height="40" rx="6" fill="none" stroke="#fff" stroke-width="2.6"/>
  <path d="M28.5 15.5h7" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>
  <path d="M25.5 27l4 4-4 4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M32.5 35h6.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
</svg>`

const LOGIN_COPY = {
  zh: {
    title: '手机访问 DeepSeek Harness',
    lede: '输入电脑端「手机访问」面板里设置的密码。',
    label: '访问密码',
    placeholder: '请输入密码',
    submit: '进入',
    foot: '仅在同一局域网内可用 · 局域网内为明文 HTTP',
    errors: {
      wrong_password: '密码错误，请重试。',
      rate_limited: '尝试次数过多，请稍后再试。',
      no_password: '电脑端还没有设置访问密码。',
      bad_request: '请求格式不正确，请重试。',
    },
    noPassword: '还没有设置访问密码。请在电脑端 DeepSeek Harness 的「手机访问」面板里设置密码，再打开这个地址。',
  },
  en: {
    title: 'Phone access to DeepSeek Harness',
    lede: 'Enter the password set in the Phone Access panel on the computer.',
    label: 'Access password',
    placeholder: 'Password',
    submit: 'Continue',
    foot: 'Same local network only · plain HTTP on the LAN',
    errors: {
      wrong_password: 'Wrong password. Try again.',
      rate_limited: 'Too many attempts. Try again later.',
      no_password: 'No access password has been set on the computer.',
      bad_request: 'The request could not be read. Try again.',
    },
    noPassword: 'No access password is set yet. Set one in the Phone Access panel of DeepSeek Harness on the computer, then open this address again.',
  },
}

/**
 * Mount the gateway, its control API, and the lifecycle cleanup.
 * @param ctx - plugin context carrying the loopback Web carrier.
 */
export function apply(ctx) {
  const statePath = join(resolveDshHome(), 'dsh4phone', 'state.json')
  /** @type {{ version: number, enabled: boolean, port: number, password: { salt: string, hash: string, N: number, r: number, p: number, updatedAt: string | null } | null, secret: string | null, devices: Array<{ id: string, name: string, createdAt: string, lastSeenAt: string, lastIp?: string }>, updatedAt: string | null }} */
  let state = defaultState()
  let gateway = null
  let starting = null
  let upstreamCookie = ''
  let upstream = null
  let lastError = null
  let disposed = false
  let queue = Promise.resolve()
  let writes = Promise.resolve()
  let devicePersistTimer = null

  const log = makeLogger(ctx)

  const ready = Promise.resolve()
    .then(() => awaitBootSettled(ctx))
    .then(() => loadState())
    .then(async () => {
      if (state.enabled && state.password) await startGateway().catch((error) => {
        lastError = codeOf(error)
        log.warn(`gateway did not start: ${describe(error)}`)
      })
    })
    .catch((error) => {
      lastError = codeOf(error)
      log.warn(`initialization failed: ${describe(error)}`)
    })

  const refreshTimer = setInterval(() => {
    if (gateway === null || disposed) return
    refreshUpstreamCookie().catch((error) => log.warn(`session refresh failed: ${describe(error)}`))
  }, COOKIE_REFRESH_MS)
  refreshTimer.unref?.()

  ctx.effect(() => {
    const removeRoute = ctx.webServer.register({
      kind: 'prefix',
      path: ADMIN_PREFIX,
      handler: (req, res) => {
        void handleAdmin(req, res).catch((error) => {
          if (!res.headersSent) sendJson(res, 500, { ok: false, error: codeOf(error) })
          else res.destroy()
        })
      },
    })
    return () => removeRoute()
  }, 'dsh4phone control api')

  ctx.effect(() => () => {
    disposed = true
    clearInterval(refreshTimer)
    if (devicePersistTimer !== null) {
      clearTimeout(devicePersistTimer)
      devicePersistTimer = null
      void persist()
    }
    void stopGateway()
  }, 'dsh4phone gateway')

  // ---------------------------------------------------------------- state --

  function defaultState() {
    return {
      version: 1,
      enabled: false,
      port: DEFAULT_PORT,
      password: null,
      secret: null,
      devices: [],
      updatedAt: null,
    }
  }

  function normalizeState(raw) {
    const next = defaultState()
    if (raw === null || typeof raw !== 'object') return next
    if (Number.isInteger(raw.port) && raw.port >= 1024 && raw.port <= 65535) next.port = raw.port
    if (typeof raw.secret === 'string' && /^[0-9a-f]{64}$/u.test(raw.secret)) next.secret = raw.secret
    const password = raw.password
    if (password !== null && typeof password === 'object'
      && typeof password.salt === 'string' && /^[0-9a-f]{16,128}$/u.test(password.salt)
      && typeof password.hash === 'string' && /^[0-9a-f]{64,256}$/u.test(password.hash)
      && Number.isInteger(password.N) && Number.isInteger(password.r) && Number.isInteger(password.p)) {
      next.password = {
        salt: password.salt,
        hash: password.hash,
        N: password.N,
        r: password.r,
        p: password.p,
        updatedAt: typeof password.updatedAt === 'string' ? password.updatedAt : null,
      }
    }
    next.enabled = raw.enabled === true
    next.devices = Array.isArray(raw.devices)
      ? raw.devices.map(normalizeDevice).filter((device) => device !== null).slice(-DEVICE_LIMIT)
      : []
    next.updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : null
    return next
  }

  async function loadState() {
    try {
      const raw = await readFile(statePath, 'utf8')
      state = normalizeState(JSON.parse(raw))
    } catch (error) {
      if (error?.code !== 'ENOENT') log.warn(`state file could not be read: ${describe(error)}`)
    }
    if (typeof state.secret !== 'string' || state.secret === '') {
      state.secret = randomBytes(32).toString('hex')
      await persist()
    }
  }

  function persist() {
    const snapshot = JSON.stringify(state, null, 2)
    const job = writes.then(async () => {
      await mkdir(dirname(statePath), { recursive: true, mode: 0o700 })
      const temporary = `${statePath}.${process.pid}.${Date.now()}.tmp`
      await writeFile(temporary, snapshot, { mode: 0o600 })
      await rename(temporary, statePath)
      await chmod(statePath, 0o600).catch(() => {})
    })
    writes = job.catch(() => {})
    return job
  }

  function exclusive(operation) {
    const run = queue.then(operation, operation)
    queue = run.catch(() => {})
    return run
  }

  // -------------------------------------------------------------- gateway --

  function upstreamUrl() {
    if (upstream !== null) return upstream
    try {
      upstream = new URL(ctx.webServer.getOrigin())
      return upstream
    } catch {}
    const port = ctx.webServer.port
    if (Number.isInteger(port)) {
      upstream = new URL(`http://127.0.0.1:${String(port)}`)
      return upstream
    }
    throw httpError(503, 'upstream_unavailable')
  }

  async function refreshUpstreamCookie() {
    let authenticated
    try {
      authenticated = ctx.connection.authenticatedUrl(upstreamUrl().origin)
    } catch (error) {
      throw httpError(503, 'upstream_unavailable')
    }
    if (typeof authenticated !== 'string' || authenticated === '') {
      throw httpError(503, 'upstream_auth_unavailable')
    }
    const url = new URL(authenticated)
    if (url.searchParams.get('token') === null) {
      // Another layer explicitly disabled browser authentication for this upstream.
      upstreamCookie = ''
      return
    }
    let response
    try {
      response = await fetch(authenticated, {
        redirect: 'manual',
        cache: 'no-store',
        headers: { accept: 'text/html' },
      })
    } catch {
      throw httpError(503, 'upstream_unavailable')
    }
    const cookies = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : []
    if (response.status !== 303 || cookies.length === 0) {
      throw httpError(502, 'upstream_auth_failed')
    }
    upstreamCookie = cookies
      .map((cookie) => cookie.split(';')[0].trim())
      .filter((cookie) => cookie !== '')
      .join('; ')
  }

  function startGateway() {
    if (gateway !== null) return Promise.resolve()
    if (starting !== null) return starting
    starting = doStartGateway().finally(() => { starting = null })
    return starting
  }

  async function doStartGateway() {
    if (disposed) throw httpError(503, 'disposed')
    if (state.password === null) throw httpError(400, 'password_required')
    if (upstreamCookie === '') await refreshUpstreamCookie()

    const sockets = new Set()
    const server = createServer((req, res) => {
      handleGatewayRequest(req, res)
    })
    server.on('connection', (socket) => {
      sockets.add(socket)
      socket.on('close', () => sockets.delete(socket))
    })
    server.on('upgrade', (req, socket, head) => {
      handleGatewayUpgrade(req, socket, head)
    })
    server.on('clientError', (_error, socket) => {
      try { socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n') } catch { socket.destroy() }
    })
    server.requestTimeout = 0
    server.headersTimeout = 60_000
    server.keepAliveTimeout = 65_000
    server.on('error', (error) => {
      lastError = codeOf(error)
      log.warn(`gateway error: ${describe(error)}`)
    })

    try {
      await listenOn(server, state.port)
    } catch (error) {
      try { server.close() } catch {}
      if (error?.code === 'EADDRINUSE') throw httpError(409, 'port_in_use')
      throw error
    }

    if (disposed) {
      await closeServer(server, sockets)
      throw httpError(503, 'disposed')
    }

    gateway = { server, sockets }
    lastError = null
    log.info(`listening on 0.0.0.0:${String(state.port)}`)
  }

  async function stopGateway() {
    const current = gateway
    gateway = null
    if (current === null) return
    await closeServer(current.server, current.sockets)
  }

  async function restartGateway() {
    await stopGateway()
    if (state.enabled && state.password !== null) await startGateway()
  }

  function statusSnapshot() {
    const running = gateway !== null && gateway.server.listening === true
    let upstreamOrigin = null
    try {
      upstreamOrigin = upstreamUrl().origin
    } catch {}
    return {
      version: VERSION,
      enabled: state.enabled,
      running,
      port: state.port,
      urls: running ? lanAddresses(state.port) : [],
      hasPassword: state.password !== null,
      passwordUpdatedAt: state.password?.updatedAt ?? null,
      upstream: upstreamOrigin,
      error: lastError,
      devices: devicesView(),
    }
  }

  // ------------------------------------------------------------- endpoints --

  /**
   * Non-secret marker read by the Client half. Its value is the gateway port,
   * so the desktop page on the same host (a different port) ignores a marker
   * minted by the gateway while the gateway page itself hides its panel.
   */
  function gatewayMarkerCookie() {
    const address = gateway?.server.address()
    const port = address !== null && typeof address === 'object' ? address.port : state.port
    return `dsh4phone_gateway=${String(port)}; Path=/; SameSite=Lax`
  }

  async function handleAdmin(req, res) {
    if (!adminRequestAllowed(req, res)) return
    const url = new URL(req.url ?? '/', 'http://admin.invalid')
    const pathname = url.pathname
    await ready

    if (pathname === `${ADMIN_PREFIX}/status`) {
      if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { ok: false, error: 'method_not_allowed' })
      return sendJson(res, 200, { ok: true, status: statusSnapshot() })
    }

    if (pathname === `${ADMIN_PREFIX}/qr`) {
      if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { ok: false, error: 'method_not_allowed' })
      const text = url.searchParams.get('text') ?? ''
      if (text === '' || text.length > 512) return sendJson(res, 400, { ok: false, error: 'invalid_text' })
      try {
        return sendJson(res, 200, { ok: true, qr: qrPayload(text) })
      } catch {
        return sendJson(res, 500, { ok: false, error: 'qr_failed' })
      }
    }

    if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'method_not_allowed' })

    let body
    try {
      body = await readJsonBody(req)
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: codeOf(error) })
    }

    if (pathname === `${ADMIN_PREFIX}/password`) return handlePassword(res, body)
    if (pathname === `${ADMIN_PREFIX}/enable`) return handleEnable(res, body)
    if (pathname === `${ADMIN_PREFIX}/port`) return handlePort(res, body)
    if (pathname === `${ADMIN_PREFIX}/logout-all`) return handleLogoutAll(res)
    return sendJson(res, 404, { ok: false, error: 'not_found' })
  }

  async function handlePassword(res, body) {
    if (body !== null && typeof body === 'object' && body.remove === true) {
      await exclusive(async () => {
        state.password = null
        state.enabled = false
        state.devices = []
        state.updatedAt = new Date().toISOString()
        await persist()
        await stopGateway()
        lastError = null
      })
      return sendJson(res, 200, { ok: true, status: statusSnapshot() })
    }

    const password = body !== null && typeof body === 'object' ? body.password : undefined
    const problem = validatePassword(password)
    if (problem !== null) return sendJson(res, 400, { ok: false, error: problem })

    const salt = randomBytes(16).toString('hex')
    const derived = await scrypt(password, salt, SCRYPT.keylen, scryptOptions())

    await exclusive(async () => {
      state.password = {
        salt,
        hash: Buffer.from(derived).toString('hex'),
        N: SCRYPT.N,
        r: SCRYPT.r,
        p: SCRYPT.p,
        updatedAt: new Date().toISOString(),
      }
      state.enabled = true
      state.devices = []
      state.updatedAt = new Date().toISOString()
      await persist()
      lastError = null
      if (gateway === null) {
        try {
          await startGateway()
        } catch (error) {
          lastError = codeOf(error)
          log.warn(`gateway did not start after password change: ${describe(error)}`)
        }
      }
    })
    return sendJson(res, 200, { ok: true, status: statusSnapshot() })
  }

  async function handleEnable(res, body) {
    const enabled = body !== null && typeof body === 'object' && body.enabled === true
    if (enabled && state.password === null) {
      return sendJson(res, 400, { ok: false, error: 'password_required' })
    }
    await exclusive(async () => {
      state.enabled = enabled
      state.updatedAt = new Date().toISOString()
      await persist()
      if (enabled) {
        try {
          await startGateway()
        } catch (error) {
          lastError = codeOf(error)
          log.warn(`gateway did not start: ${describe(error)}`)
        }
      } else {
        await stopGateway()
        lastError = null
      }
    })
    return sendJson(res, 200, { ok: true, status: statusSnapshot() })
  }

  async function handlePort(res, body) {
    const port = body !== null && typeof body === 'object' ? Number(body.port) : Number.NaN
    if (!Number.isInteger(port) || port < 1024 || port > 65535) {
      return sendJson(res, 400, { ok: false, error: 'port_invalid' })
    }
    await exclusive(async () => {
      state.port = port
      state.updatedAt = new Date().toISOString()
      await persist()
      if (state.enabled && state.password !== null) {
        await stopGateway()
        try {
          await startGateway()
        } catch (error) {
          lastError = codeOf(error)
          log.warn(`gateway did not restart on the new port: ${describe(error)}`)
        }
      }
    })
    return sendJson(res, 200, { ok: true, status: statusSnapshot() })
  }

  async function handleLogoutAll(res) {
    await exclusive(async () => {
      state.secret = randomBytes(32).toString('hex')
      state.devices = []
      state.updatedAt = new Date().toISOString()
      await persist()
    })
    return sendJson(res, 200, { ok: true, status: statusSnapshot() })
  }

  // ---------------------------------------------------------------- login --

  async function handleLogin(req, res, url) {
    const queryNext = safeNext(url.searchParams.get('next'))
    const locale = requestLocale(req)
    if (state.password === null) {
      return sendHtml(res, 503, renderMessagePage(locale, LOGIN_COPY[locale].noPassword))
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      if (isAuthenticated(req)) return redirect(res, queryNext)
      return sendHtml(res, 200, renderLoginPage({ locale, next: queryNext, error: null }))
    }
    if (req.method !== 'POST') {
      res.writeHead(405, { allow: 'GET, POST', 'content-type': 'text/plain; charset=utf-8' })
      return res.end('Method Not Allowed')
    }

    const address = normalizeAddress(req.socket.remoteAddress)
    if (loginBlocked(address)) {
      return sendHtml(res, 429, renderLoginPage({ locale, next: queryNext, error: 'rate_limited' }))
    }

    let body
    try {
      body = await readBody(req, 8 * 1024)
    } catch {
      return sendHtml(res, 413, renderLoginPage({ locale, next: queryNext, error: 'bad_request' }))
    }
    const form = new URLSearchParams(body)
    const submitted = form.get('password') ?? ''
    const next = safeNext(form.get('next') ?? queryNext)
    const matched = await verifyPassword(submitted).catch(() => false)
    if (!matched) {
      recordLoginFailure(address)
      await wait(350)
      return sendHtml(res, 401, renderLoginPage({ locale, next, error: 'wrong_password' }))
    }

    clearLoginFailures(address)
    const device = identifyDevice(req, address)
    await persist()
    res.writeHead(303, {
      location: next,
      'cache-control': 'no-store',
      'referrer-policy': 'no-referrer',
      'set-cookie': [
        sessionCookie(device.id),
        deviceCookie(device.id),
        gatewayMarkerCookie(),
      ],
    })
    res.end()
  }

  function handleLogout(req, res, url) {
    const next = safeNext(url.searchParams.get('next'))
    const session = authenticatedSession(req)
    if (session !== undefined && typeof session.did === 'string') {
      const before = state.devices.length
      state.devices = state.devices.filter((device) => device.id !== session.did)
      if (state.devices.length !== before) void persist()
    }
    res.writeHead(303, {
      location: next === '/' ? LOGIN_PATH : `${LOGIN_PATH}?next=${encodeURIComponent(next)}`,
      'cache-control': 'no-store',
      'set-cookie': [
        `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`,
        `${DEVICE_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`,
      ],
    })
    res.end()
  }

  async function verifyPassword(candidate) {
    const password = state.password
    if (password === null || typeof candidate !== 'string' || candidate === '') return false
    const derived = await scrypt(candidate, password.salt, SCRYPT.keylen, {
      N: password.N,
      r: password.r,
      p: password.p,
      maxmem: SCRYPT.maxmem,
    })
    const expected = Buffer.from(password.hash, 'hex')
    return derived.length === expected.length && timingSafeEqual(derived, expected)
  }

  function passwordFingerprint() {
    if (state.password === null) return ''
    return createHash('sha256').update(state.password.hash).digest('hex').slice(0, 16)
  }

  function issueToken(deviceId) {
    const payload = Buffer.from(JSON.stringify({
      v: 1,
      exp: Date.now() + SESSION_TTL_MS,
      fp: passwordFingerprint(),
      ...(typeof deviceId === 'string' ? { did: deviceId } : {}),
    })).toString('base64url')
    const signature = createHmac('sha256', state.secret ?? '').update(payload).digest('base64url')
    return `${payload}.${signature}`
  }

  function decodeSession(token) {
    if (typeof token !== 'string' || token.length < 8 || token.length > 512) return undefined
    const dot = token.lastIndexOf('.')
    if (dot <= 0) return undefined
    const payload = token.slice(0, dot)
    const signature = Buffer.from(token.slice(dot + 1), 'base64url')
    const expected = createHmac('sha256', state.secret ?? '').update(payload).digest()
    if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return undefined
    try {
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
      if (decoded === null || typeof decoded !== 'object') return undefined
      if (decoded.v !== 1 || typeof decoded.exp !== 'number' || decoded.exp <= Date.now()) return undefined
      if (decoded.fp !== passwordFingerprint()) return undefined
      return decoded
    } catch {
      return undefined
    }
  }

  function authenticatedSession(req) {
    return decodeSession(readCookie(req, SESSION_COOKIE))
  }

  function isAuthenticated(req) {
    return authenticatedSession(req) !== undefined
  }

  function sessionCookie(deviceId) {
    return `${SESSION_COOKIE}=${issueToken(deviceId)}; Max-Age=${String(Math.floor(SESSION_TTL_MS / 1000))}; Path=/; HttpOnly; SameSite=Lax`
  }

  function deviceCookie(deviceId) {
    return `${DEVICE_COOKIE}=${deviceId}; Max-Age=${String(DEVICE_COOKIE_MAX_AGE)}; Path=/; HttpOnly; SameSite=Lax`
  }

  function identifyDevice(req, address) {
    const now = new Date().toISOString()
    const cookieId = readCookie(req, DEVICE_COOKIE)
    const existing = typeof cookieId === 'string'
      ? state.devices.find((device) => device.id === cookieId)
      : undefined
    if (existing !== undefined) {
      existing.name = deviceNameFromRequest(req)
      existing.lastSeenAt = now
      existing.lastIp = address
      return existing
    }
    const device = {
      id: randomBytes(12).toString('hex'),
      name: deviceNameFromRequest(req),
      createdAt: now,
      lastSeenAt: now,
      lastIp: address,
    }
    state.devices.push(device)
    if (state.devices.length > DEVICE_LIMIT) state.devices.splice(0, state.devices.length - DEVICE_LIMIT)
    return device
  }

  function touchDevice(session, address) {
    if (session === undefined || typeof session.did !== 'string') return
    const device = state.devices.find((entry) => entry.id === session.did)
    if (device === undefined) return
    const now = Date.now()
    const last = Date.parse(device.lastSeenAt)
    if (Number.isFinite(last) && now - last < DEVICE_TOUCH_MS) return
    device.lastSeenAt = new Date(now).toISOString()
    device.lastIp = address
    scheduleDevicePersist()
  }

  function scheduleDevicePersist() {
    if (devicePersistTimer !== null || disposed) return
    devicePersistTimer = setTimeout(() => {
      devicePersistTimer = null
      persist().catch((error) => log.warn(`device state could not be saved: ${describe(error)}`))
    }, DEVICE_WRITE_DELAY_MS)
    devicePersistTimer.unref?.()
  }

  function devicesView() {
    return [...state.devices]
      .sort((left, right) => Date.parse(right.lastSeenAt) - Date.parse(left.lastSeenAt))
      .map((device) => ({ id: device.id, name: device.name, lastSeenAt: device.lastSeenAt }))
  }

  const failures = new Map()

  function loginBlocked(address) {
    const entry = failures.get(address)
    if (entry === undefined) return false
    const now = Date.now()
    if (now - entry.since > FAILURE_WINDOW_MS) {
      failures.delete(address)
      return false
    }
    return entry.blockedUntil > now
  }

  function recordLoginFailure(address) {
    const now = Date.now()
    let entry = failures.get(address)
    if (entry === undefined || now - entry.since > FAILURE_WINDOW_MS) {
      entry = { count: 0, since: now, blockedUntil: 0 }
      failures.set(address, entry)
    }
    entry.count += 1
    if (entry.count >= MAX_LOGIN_FAILURES) entry.blockedUntil = now + BLOCK_MS
    if (failures.size > 512) {
      for (const [key, value] of failures) {
        if (now - value.since > FAILURE_WINDOW_MS) failures.delete(key)
      }
    }
  }

  function clearLoginFailures(address) {
    failures.delete(address)
  }

  // ---------------------------------------------------------------- proxy --

  function handleGatewayRequest(req, res) {
    const address = normalizeAddress(req.socket.remoteAddress)
    if (!isLanAddress(address)) {
      return sendText(res, 403, 'This gateway only accepts connections from the local network.')
    }

    let url
    try {
      url = new URL(req.url ?? '/', 'http://dsh4phone.invalid')
    } catch {
      return sendText(res, 400, 'Bad Request')
    }
    const pathname = url.pathname

    if (pathname === LOGIN_PATH) {
      void handleLogin(req, res, url).catch(() => {
        if (!res.headersSent) sendText(res, 500, 'Login failed')
        else res.destroy()
      })
      return
    }
    if (pathname === LOGOUT_PATH) {
      handleLogout(req, res, url)
      return
    }
    if (pathname === '/__dsh4phone' || pathname.startsWith('/__dsh4phone/')) {
      return sendText(res, 404, 'Not Found')
    }
    // The control API is loopback-only. Never let a paired phone reach it.
    if (pathname === '/dsh4phone' || pathname.startsWith('/dsh4phone/')) {
      return sendText(res, 404, 'Not Found')
    }
    // Public static files the browser fetches without credentials (manifest
    // and favicons) must not bounce the PWA install check through the login.
    if ((req.method === 'GET' || req.method === 'HEAD') && PUBLIC_PATHS.has(pathname)) {
      return proxyHttp(req, res, url)
    }
    if (state.password === null) {
      return sendHtml(res, 503, renderMessagePage(requestLocale(req), LOGIN_COPY[requestLocale(req)].noPassword))
    }
    const session = authenticatedSession(req)
    if (session === undefined) {
      if (isDocumentRequest(req, pathname)) {
        const next = `${pathname}${url.search}`
        return redirect(res, `${LOGIN_PATH}?next=${encodeURIComponent(next)}`)
      }
      res.writeHead(401, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      })
      return res.end(JSON.stringify({ error: 'authentication_required' }))
    }
    let extraCookies = null
    if (typeof session.did !== 'string') {
      // One-time migration for sessions issued before device tracking: mint a
      // device identity now and hand the phone its device-bound session cookie.
      const device = identifyDevice(req, address)
      extraCookies = [sessionCookie(device.id), deviceCookie(device.id)]
      touchDevice({ ...session, did: device.id }, address)
      scheduleDevicePersist()
    } else {
      touchDevice(session, address)
    }
    proxyHttp(req, res, url, 0, extraCookies)
  }

  function proxyHttp(req, res, url, attempt = 0, extraCookies = null) {
    if (gateway === null) return sendText(res, 503, 'The gateway is stopped.')
    let target
    try {
      target = upstreamUrl()
    } catch (error) {
      return sendText(res, 503, 'DeepSeek Harness is not reachable.')
    }

    const upstreamReq = httpRequest({
      hostname: target.hostname,
      port: target.port === '' ? 80 : Number(target.port),
      method: req.method,
      path: `${url.pathname}${url.search}`,
      headers: upstreamHeaders(req),
    })

    upstreamReq.on('response', (upstreamRes) => {
      const status = upstreamRes.statusCode ?? 502
      if (status === 401 && attempt === 0 && (req.method === 'GET' || req.method === 'HEAD')) {
        upstreamRes.resume()
        refreshUpstreamCookie()
          .then(() => proxyHttp(req, res, url, 1, extraCookies))
          .catch(() => {
            if (res.headersSent) res.destroy()
            else {
              res.writeHead(401, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
              res.end(JSON.stringify({ error: 'authentication_required' }))
            }
          })
        return
      }

      const headers = {}
      for (const [key, value] of Object.entries(upstreamRes.headers)) {
        if (value === undefined) continue
        if (key === 'set-cookie' || key === 'connection' || key === 'keep-alive' || key === 'transfer-encoding') continue
        if (key === 'location' && typeof value === 'string') {
          try {
            const location = new URL(value, target.origin)
            if (location.origin === target.origin) {
              headers.location = `${location.pathname}${location.search}${location.hash}`
              continue
            }
          } catch {}
        }
        headers[key] = value
      }
      // This is the gateway serving a phone, not the desktop's loopback page.
      // Existing sessions get the marker on their first proxied response.
      headers['set-cookie'] = [
        ...(Array.isArray(extraCookies) ? extraCookies : []),
        gatewayMarkerCookie(),
      ]
      res.writeHead(status, headers)
      upstreamRes.pipe(res)
      upstreamRes.on('error', () => res.destroy())
    })

    upstreamReq.on('error', () => {
      if (!res.headersSent) sendText(res, 502, 'DeepSeek Harness upstream is unavailable.')
      else res.destroy()
    })

    req.on('aborted', () => upstreamReq.destroy())
    res.on('close', () => {
      if (!res.writableEnded) upstreamReq.destroy()
    })
    req.pipe(upstreamReq)
  }

  function upstreamHeaders(req) {
    /** @type {Record<string, string | string[]>} */
    const headers = {}
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) headers[key] = value
    }
    const target = upstreamUrl()
    headers.host = target.host
    if (typeof headers.origin === 'string') headers.origin = target.origin
    if (typeof headers.referer === 'string') {
      try {
        const referer = new URL(headers.referer)
        headers.referer = `${target.origin}${referer.pathname}${referer.search}`
      } catch {
        delete headers.referer
      }
    }
    if (upstreamCookie === '') delete headers.cookie
    else headers.cookie = upstreamCookie
    delete headers['x-forwarded-for']
    delete headers['x-forwarded-host']
    delete headers['x-forwarded-proto']
    delete headers.forwarded
    return headers
  }

  function handleGatewayUpgrade(req, socket, head) {
    const address = normalizeAddress(socket.remoteAddress)
    if (!isLanAddress(address)) return rejectUpgrade(socket, 403)

    let url
    try {
      url = new URL(req.url ?? '/', 'http://dsh4phone.invalid')
    } catch {
      return rejectUpgrade(socket, 400)
    }
    const pathname = url.pathname
    if (pathname === '/dsh4phone' || pathname.startsWith('/dsh4phone/')
      || pathname === '/__dsh4phone' || pathname.startsWith('/__dsh4phone/')) {
      return rejectUpgrade(socket, 404)
    }
    const session = authenticatedSession(req)
    if (state.password === null || session === undefined) return rejectUpgrade(socket, 401)
    if (typeof session.did === 'string') touchDevice(session, address)

    let target
    try {
      target = upstreamUrl()
    } catch {
      return rejectUpgrade(socket, 503)
    }

    const headers = upstreamHeaders(req)
    headers.connection = 'Upgrade'
    headers.upgrade = typeof req.headers.upgrade === 'string' ? req.headers.upgrade : 'websocket'

    const upstreamReq = httpRequest({
      hostname: target.hostname,
      port: target.port === '' ? 80 : Number(target.port),
      method: 'GET',
      path: `${pathname}${url.search}`,
      headers,
      agent: false,
    })

    let settled = false
    upstreamReq.on('upgrade', (response, upstreamSocket, upstreamHead) => {
      settled = true
      const lines = [`HTTP/1.1 101 ${response.statusMessage || 'Switching Protocols'}`]
      for (let index = 0; index < response.rawHeaders.length; index += 2) {
        lines.push(`${response.rawHeaders[index]}: ${response.rawHeaders[index + 1]}`)
      }
      socket.write(`${lines.join('\r\n')}\r\n\r\n`)
      if (upstreamHead !== undefined && upstreamHead.length > 0) socket.write(upstreamHead)
      if (head !== undefined && head.length > 0) upstreamSocket.write(head)
      upstreamSocket.on('error', () => socket.destroy())
      socket.on('error', () => upstreamSocket.destroy())
      upstreamSocket.on('close', () => socket.destroy())
      socket.on('close', () => upstreamSocket.destroy())
      upstreamSocket.pipe(socket)
      socket.pipe(upstreamSocket)
    })

    upstreamReq.on('response', (response) => {
      settled = true
      const lines = [`HTTP/1.1 ${String(response.statusCode)} ${response.statusMessage}`]
      for (let index = 0; index < response.rawHeaders.length; index += 2) {
        lines.push(`${response.rawHeaders[index]}: ${response.rawHeaders[index + 1]}`)
      }
      socket.write(`${lines.join('\r\n')}\r\n\r\n`)
      response.pipe(socket)
      response.on('error', () => socket.destroy())
    })

    upstreamReq.on('error', () => {
      if (settled) socket.destroy()
      else rejectUpgrade(socket, 502)
    })
    socket.on('error', () => upstreamReq.destroy())
    upstreamReq.end()
  }

  function rejectUpgrade(socket, status) {
    try {
      socket.end(`HTTP/1.1 ${String(status)} ${STATUS_TEXT[status] ?? 'Error'}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`)
    } catch {
      socket.destroy()
    }
  }

  // ------------------------------------------------------------------ misc --

  function adminRequestAllowed(req, res) {
    const address = normalizeAddress(req.socket.remoteAddress)
    if (!isLoopback(address)) {
      sendJson(res, 403, { ok: false, error: 'forbidden' })
      return false
    }
    const host = typeof req.headers.host === 'string' ? req.headers.host : ''
    let hostname = ''
    try {
      hostname = new URL(`http://${host}`).hostname.replace(/^\[|\]$/gu, '')
    } catch {
      hostname = ''
    }
    if (hostname !== '127.0.0.1' && hostname !== 'localhost' && hostname !== '::1') {
      sendJson(res, 403, { ok: false, error: 'forbidden_host' })
      return false
    }
    if (req.headers['x-dsh4phone'] !== '1') {
      sendJson(res, 403, { ok: false, error: 'forbidden' })
      return false
    }
    if (req.headers['sec-fetch-site'] === 'cross-site') {
      sendJson(res, 403, { ok: false, error: 'forbidden' })
      return false
    }
    const originHeader = req.headers.origin
    if (typeof originHeader === 'string') {
      try {
        if (new URL(originHeader).host !== host) throw new Error('origin mismatch')
      } catch {
        sendJson(res, 403, { ok: false, error: 'forbidden_origin' })
        return false
      }
    }
    return true
  }

  function validatePassword(value) {
    if (typeof value !== 'string') return 'password_invalid'
    if (value.length < 4 || value.length > 128) return 'password_invalid'
    if (/[\u0000-\u001f\u007f]/u.test(value)) return 'password_invalid'
    return null
  }
}

// ------------------------------------------------------------------ helpers --

function resolveDshHome() {
  const home = process.env.DSH_HOME
  return typeof home === 'string' && home !== '' ? home : join(homedir(), '.dsh')
}

function makeLogger(ctx) {
  const write = (level, message) => {
    try {
      ctx.logger?.[level]?.(`dsh4phone: ${message}`)
    } catch {}
  }
  return {
    info: (message) => write('info', message),
    warn: (message) => write('warn', message),
  }
}

async function awaitBootSettled(ctx) {
  let loader
  try {
    loader = ctx.get('loader')
  } catch {
    loader = undefined
  }
  if (loader === undefined || loader === null || typeof loader.await !== 'function') return
  try {
    await loader.await()
  } catch {}
}

function listenOn(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.removeListener('listening', onListening)
      reject(error)
    }
    const onListening = () => {
      server.removeListener('error', onError)
      resolve()
    }
    server.once('error', onError)
    server.once('listening', onListening)
    server.listen(port, '0.0.0.0')
  })
}

async function closeServer(server, sockets) {
  for (const socket of sockets) {
    try { socket.destroy() } catch {}
  }
  await new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }
    try {
      server.close(finish)
    } catch {
      finish()
      return
    }
    setTimeout(finish, 1000).unref?.()
  })
}

function lanAddresses(port) {
  const entries = []
  for (const [name, infos] of Object.entries(networkInterfaces())) {
    for (const info of infos ?? []) {
      if (info.family !== 'IPv4' || info.internal) continue
      if (!isLanAddress(info.address)) continue
      entries.push({ interface: name, address: info.address, url: `http://${info.address}:${String(port)}` })
    }
  }
  entries.sort((left, right) => rankInterface(left.interface) - rankInterface(right.interface)
    || left.address.localeCompare(right.address))
  return entries
}

const QR_CACHE_LIMIT = 32
const qrCache = new Map()

/**
 * Encode one string as a QR matrix (ECC M, the smallest version that fits).
 * @param {string} text - short address text from the control panel.
 * @returns {{ size: number, modules: string[] }} Row bitstrings.
 */
function qrPayload(text) {
  const cached = qrCache.get(text)
  if (cached !== undefined) return cached
  const qr = qrcode(0, 'M')
  qr.addData(text)
  qr.make()
  const size = qr.getModuleCount()
  const modules = []
  for (let row = 0; row < size; row += 1) {
    let bits = ''
    for (let column = 0; column < size; column += 1) bits += qr.isDark(row, column) ? '1' : '0'
    modules.push(bits)
  }
  const payload = { size, modules }
  if (qrCache.size >= QR_CACHE_LIMIT) {
    const oldest = qrCache.keys().next().value
    if (oldest !== undefined) qrCache.delete(oldest)
  }
  qrCache.set(text, payload)
  return payload
}

function rankInterface(name) {
  if (/^en\d/u.test(name)) return 0
  if (/^bridge\d/u.test(name)) return 2
  if (/^(utun|awdl|llw|anpi|gif|stf)\d/u.test(name)) return 4
  return 1
}

function normalizeDevice(raw) {
  if (raw === null || typeof raw !== 'object') return null
  if (typeof raw.id !== 'string' || !/^[0-9a-f]{16,64}$/u.test(raw.id)) return null
  if (typeof raw.name !== 'string' || raw.name.trim() === '' || raw.name.length > 80) return null
  const createdAt = typeof raw.createdAt === 'string' ? Date.parse(raw.createdAt) : Number.NaN
  const lastSeenAt = typeof raw.lastSeenAt === 'string' ? Date.parse(raw.lastSeenAt) : Number.NaN
  if (!Number.isFinite(createdAt) || !Number.isFinite(lastSeenAt)) return null
  return {
    id: raw.id,
    name: raw.name,
    createdAt: new Date(createdAt).toISOString(),
    lastSeenAt: new Date(lastSeenAt).toISOString(),
    lastIp: typeof raw.lastIp === 'string' ? raw.lastIp : undefined,
  }
}

function deviceNameFromRequest(req) {
  const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : ''
  if (userAgent === '') return 'Unknown device'
  let device = 'Browser'
  if (/iPhone/u.test(userAgent)) device = 'iPhone'
  else if (/iPad/u.test(userAgent)) device = 'iPad'
  else if (/Android/u.test(userAgent)) device = 'Android'
  else if (/Macintosh|Mac OS X/u.test(userAgent)) device = 'Mac'
  else if (/Windows/u.test(userAgent)) device = 'Windows'
  else if (/Linux/u.test(userAgent)) device = 'Linux'
  let browser = ''
  if (/MicroMessenger/u.test(userAgent)) browser = 'WeChat'
  else if (/EdgiOS|EdgA?\//u.test(userAgent)) browser = 'Edge'
  else if (/CriOS|Chrome\//u.test(userAgent)) browser = 'Chrome'
  else if (/FxiOS|Firefox\//u.test(userAgent)) browser = 'Firefox'
  else if (/Safari\//u.test(userAgent)) browser = 'Safari'
  return browser === '' ? device : `${device} · ${browser}`
}

function normalizeAddress(value) {
  if (typeof value !== 'string' || value === '') return ''
  let address = value
  const zone = address.indexOf('%')
  if (zone !== -1) address = address.slice(0, zone)
  if (address.startsWith('::ffff:') && address.includes('.')) address = address.slice(7)
  if (address === '::1') return '127.0.0.1'
  return address
}

function isLoopback(address) {
  return address === '127.0.0.1' || address.startsWith('127.')
}

function isLanAddress(address) {
  if (address === '') return false
  if (isLoopback(address)) return true
  if (/^10\./u.test(address)) return true
  if (/^192\.168\./u.test(address)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./u.test(address)) return true
  if (/^169\.254\./u.test(address)) return true
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./u.test(address)) return true
  if (/^fe80:/iu.test(address)) return true
  if (/^f[cd][0-9a-f]{2}:/iu.test(address)) return true
  return false
}

function isDocumentRequest(req, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false
  const destination = req.headers['sec-fetch-dest']
  if (destination === 'document' || destination === 'iframe' || destination === 'embed') return true
  const accept = req.headers.accept
  if (typeof accept === 'string' && accept.includes('text/html')) return true
  return pathname === '/'
}

function readCookie(req, name) {
  const header = req.headers.cookie
  if (typeof header !== 'string' || header === '') return undefined
  for (const part of header.split(';')) {
    const equals = part.indexOf('=')
    if (equals <= 0) continue
    if (part.slice(0, equals).trim() !== name) continue
    return part.slice(equals + 1).trim()
  }
  return undefined
}

function safeNext(value) {
  if (typeof value !== 'string' || value === '') return '/'
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/'
  if (/[\u0000-\u001f\u007f]/u.test(value)) return '/'
  if (value === LOGIN_PATH || value.startsWith(`${LOGIN_PATH}?`)) return '/'
  if (value === ADMIN_PREFIX || value.startsWith(`${ADMIN_PREFIX}/`)) return '/'
  return value
}

function requestLocale(req) {
  const header = req.headers['accept-language']
  if (typeof header === 'string' && /^zh\b|,zh\b|zh-/iu.test(header)) return 'zh'
  return 'en'
}

function renderLoginPage({ locale, next, error }) {
  const copy = LOGIN_COPY[locale] ?? LOGIN_COPY.en
  const message = error === null ? '' : copy.errors[error] ?? ''
  return `<!doctype html>
<html lang="${locale === 'zh' ? 'zh-CN' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(copy.title)}</title>
<style>${LOGIN_STYLE}</style>
</head>
<body>
<main class="card">
  ${PHONE_MARK}
  <h1>${escapeHtml(copy.title)}</h1>
  <p class="lede">${escapeHtml(copy.lede)}</p>
  <form method="post" action="${LOGIN_PATH}">
    <input type="hidden" name="next" value="${escapeAttribute(next)}">
    <label for="password">${escapeHtml(copy.label)}</label>
    <input id="password" name="password" type="password" autocomplete="current-password" placeholder="${escapeAttribute(copy.placeholder)}" required autofocus>
    <button type="submit">${escapeHtml(copy.submit)}</button>
  </form>
  ${message === '' ? '' : `<p class="error" role="alert">${escapeHtml(message)}</p>`}
  <p class="foot">${escapeHtml(copy.foot)}</p>
</main>
</body>
</html>`
}

function renderMessagePage(locale, message) {
  const copy = LOGIN_COPY[locale] ?? LOGIN_COPY.en
  return `<!doctype html>
<html lang="${locale === 'zh' ? 'zh-CN' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(copy.title)}</title>
<style>${LOGIN_STYLE}</style>
</head>
<body>
<main class="card">
  ${PHONE_MARK}
  <h1>${escapeHtml(copy.title)}</h1>
  <p class="lede">${escapeHtml(message)}</p>
</main>
</body>
</html>`
}

const LOGIN_STYLE = `
:root{color-scheme:light dark;--bg:#f2f4f8;--card:#fff;--text:#16181d;--muted:#646b78;--line:#e3e6ec;--brand:#4d6bfe;--danger:#c0392b;--shadow:0 18px 50px rgba(22,24,29,.10)}
@media (prefers-color-scheme:dark){:root{--bg:#0d0f14;--card:#171a21;--text:#e8eaf0;--muted:#9aa3b2;--line:#2a2f3a;--brand:#7c93ff;--danger:#f87171;--shadow:0 18px 50px rgba(0,0,0,.35)}}
*{box-sizing:border-box}
html,body{min-height:100%}
body{margin:0;padding:24px;display:grid;place-items:center;background:linear-gradient(160deg,var(--bg),var(--bg));color:var(--text);font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;-webkit-text-size-adjust:100%}
.card{width:min(420px,100%);padding:32px 28px 24px;border:1px solid var(--line);border-radius:20px;background:var(--card);box-shadow:var(--shadow)}
.mark{display:block;margin:0 auto 18px;border-radius:16px}
h1{margin:0 0 8px;font-size:22px;line-height:1.3;text-align:center;letter-spacing:.01em}
.lede{margin:0 0 24px;color:var(--muted);font-size:14px;text-align:center}
label{display:block;margin:0 0 8px;color:var(--muted);font-size:13px;font-weight:600}
input[type=password]{width:100%;height:48px;padding:0 14px;border:1px solid var(--line);border-radius:12px;background:transparent;color:var(--text);font-size:16px;outline:none;transition:border-color .15s,box-shadow .15s}
input[type=password]:focus{border-color:var(--brand);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 18%,transparent)}
button[type=submit]{width:100%;height:48px;margin-top:14px;border:0;border-radius:12px;background:var(--brand);color:#fff;font-size:16px;font-weight:600;cursor:pointer}
button[type=submit]:active{filter:brightness(.94)}
.error{margin:14px 0 0;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--danger) 10%,transparent);color:var(--danger);font-size:13px;text-align:center}
.foot{margin:22px 0 0;color:var(--muted);font-size:11px;line-height:1.6;text-align:center}
`

function sendJson(res, status, value) {
  if (res.headersSent) return res.end()
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  res.end(JSON.stringify(value))
}

function sendHtml(res, status, html) {
  if (res.headersSent) return res.end()
  res.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
  })
  res.end(html)
}

function sendText(res, status, text) {
  if (res.headersSent) return res.end()
  res.writeHead(status, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  res.end(text)
}

function redirect(res, location) {
  if (res.headersSent) return res.end()
  res.writeHead(303, { location, 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' })
  res.end()
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        req.pause()
        reject(httpError(413, 'body_too_large'))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function readJsonBody(req) {
  const text = await readBody(req, 16 * 1024)
  if (text.trim() === '') return {}
  let value
  try {
    value = JSON.parse(text)
  } catch {
    throw httpError(400, 'invalid_json')
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw httpError(400, 'invalid_json')
  return value
}

function httpError(statusCode, code) {
  const error = new Error(code)
  error.statusCode = statusCode
  error.code = code
  return error
}

function codeOf(error) {
  if (error !== null && typeof error === 'object') {
    if (error.code === 'EADDRINUSE') return 'port_in_use'
    if (typeof error.code === 'string' && /^[a-z][a-z0-9_]*$/u.test(error.code)) return error.code
  }
  return 'internal_error'
}

function describe(error) {
  if (error instanceof Error) return error.message
  return String(error)
}

function scryptOptions() {
  return { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: SCRYPT.maxmem }
}

function wait(milliseconds) {
  return new Promise((resolve) => { setTimeout(resolve, milliseconds).unref?.() })
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeAttribute(value) {
  return escapeHtml(value)
}
