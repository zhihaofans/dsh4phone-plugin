/**
 * Isolated Host-half test: a fake DSH upstream, a fake Cordis context, and a
 * temporary DSH_HOME. No running Harness, profile, or real state is touched.
 *
 * Covers: admin status, password lifecycle, port restart, public manifest,
 * login redirect/render/rejection, session cookie, proxy header rewrite,
 * redirect rewrite, admin-path blocking, and the WebSocket upgrade proxy.
 */
import { createServer, request as httpRequest } from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const home = mkdtempSync(join(tmpdir(), 'dsh4phone-test-'))
process.env.DSH_HOME = home

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
}

async function freePort() {
  const server = createServer()
  await listen(server)
  const port = server.address().port
  await new Promise((resolve) => server.close(resolve))
  return port
}

let upstreamPort = 0
const upstream = createServer((req, res) => {
  const url = new URL(req.url, 'http://upstream.invalid')
  if (url.pathname === '/' && url.searchParams.get('token') === 'test-token') {
    res.writeHead(303, { location: './', 'set-cookie': 'dsh_upstream=ok; Path=/; HttpOnly; SameSite=Strict' })
    return res.end()
  }
  const cookie = req.headers.cookie ?? ''
  if (!cookie.includes('dsh_upstream=ok')) {
    res.writeHead(401, { 'content-type': 'text/plain' })
    return res.end('upstream: missing cookie')
  }
  if (url.pathname === '/manifest.webmanifest') {
    res.writeHead(200, { 'content-type': 'application/manifest+json' })
    return res.end('{"name":"test"}')
  }
  if (url.pathname === '/redirect') {
    res.writeHead(302, { location: `http://127.0.0.1:${upstreamPort}/target` })
    return res.end()
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  res.end(`host=${req.headers.host};origin=${req.headers.origin ?? ''};cookie=${req.headers.cookie ?? ''}`)
})
upstream.on('upgrade', (req, socket) => {
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: test\r\n\r\n')
  socket.write('hello-ws')
  setTimeout(() => socket.destroy(), 400)
})
await listen(upstream)
upstreamPort = upstream.address().port

const routes = []
const disposers = []
const ctx = {
  logger: { info: () => {}, warn: () => {} },
  webServer: {
    getOrigin: () => `http://127.0.0.1:${upstreamPort}`,
    register: (route) => { routes.push(route); return () => {} },
    port: upstreamPort,
  },
  connection: {
    authenticatedUrl: (base) => `${base}/?token=test-token`,
  },
  get: () => undefined,
  effect: (fn) => { const dispose = fn(); disposers.push(dispose); return dispose },
}

const { apply } = await import(`${new URL('../index.js', import.meta.url).href}?t=${Date.now()}`)
apply(ctx)

const admin = createServer((req, res) => {
  const route = routes.find((candidate) => req.url.startsWith(candidate.path))
  if (route === undefined) { res.writeHead(404); return res.end() }
  void route.handler(req, res)
})
await listen(admin)
const adminPort = admin.address().port

const results = []
function check(name, condition, detail = '') {
  results.push({ name, ok: Boolean(condition) })
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
}

async function adminCall(path, body) {
  const response = await fetch(`http://127.0.0.1:${adminPort}/dsh4phone/api${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'x-dsh4phone': '1', 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, data: await response.json() }
}

let status = null
for (let attempt = 0; attempt < 50; attempt++) {
  const result = await adminCall('/status')
  if (result.status === 200) { status = result.data.status; break }
  await sleep(100)
}
check('admin status reachable', status !== null)
check('starts disabled without password', status?.enabled === false && status?.running === false)

const portA = await freePort()
const portB = await freePort()
const initialPort = await adminCall('/port', { port: portA })
check('port persists before the gateway runs', initialPort.status === 200 && initialPort.data.status?.port === portA)

const setPassword = await adminCall('/password', { password: 'test-password-123' })
check('password accepted', setPassword.status === 200 && setPassword.data.status?.hasPassword === true)
check('gateway starts on the configured port', setPassword.data.status?.running === true && setPassword.data.status?.port === portA, setPassword.data.status?.error ?? '')

const movePort = await adminCall('/port', { port: portB })
check('gateway restarts on a new port', movePort.data.status?.running === true && movePort.data.status?.port === portB, movePort.data.status?.error ?? '')
const gateway = `http://127.0.0.1:${portB}`

const publicAsset = await fetch(`${gateway}/manifest.webmanifest`, { redirect: 'manual' })
check('public manifest needs no login', publicAsset.status === 200, String(publicAsset.status))

const unauthenticated = await fetch(`${gateway}/`, { redirect: 'manual', headers: { accept: 'text/html' } })
check('document without session redirects to login', unauthenticated.status === 303 && unauthenticated.headers.get('location')?.startsWith('/__dsh4phone/login'), String(unauthenticated.status))

const loginPage = await fetch(`${gateway}/__dsh4phone/login`, { headers: { 'accept-language': 'zh-CN' } })
const loginHtml = await loginPage.text()
check('login page renders Chinese', loginPage.status === 200 && loginHtml.includes('手机访问 DeepSeek Harness') && loginHtml.includes('访问密码'))

const wrong = await fetch(`${gateway}/__dsh4phone/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: 'password=wrong-password',
})
check('wrong password rejected', wrong.status === 401)

const login = await fetch(`${gateway}/__dsh4phone/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: 'password=test-password-123&next=%2F',
  redirect: 'manual',
})
const setCookie = login.headers.get('set-cookie') ?? ''
const sessionCookie = setCookie.split(';')[0]
check('correct password issues session', login.status === 303 && sessionCookie.startsWith('dsh4phone_session='))
check('session cookie is HttpOnly and SameSite', /HttpOnly/i.test(setCookie) && /SameSite=Lax/i.test(setCookie))

const proxied = await fetch(`${gateway}/`, {
  headers: { cookie: sessionCookie, accept: 'text/html', origin: gateway },
})
const proxiedBody = await proxied.text()
check('proxy reaches upstream', proxied.status === 200 && proxiedBody.includes('cookie=dsh_upstream=ok'))
check('proxy rewrites Host', proxiedBody.includes(`host=127.0.0.1:${upstreamPort}`), proxiedBody.slice(0, 120))
check('proxy rewrites Origin', proxiedBody.includes(`origin=http://127.0.0.1:${upstreamPort}`))

const redirect = await fetch(`${gateway}/redirect`, { headers: { cookie: sessionCookie }, redirect: 'manual' })
check('upstream redirect rewritten to relative', redirect.status === 302 && redirect.headers.get('location') === '/target', redirect.headers.get('location') ?? '')

const blockedAdmin = await fetch(`${gateway}/dsh4phone/api/status`, { headers: { cookie: sessionCookie, 'x-dsh4phone': '1' } })
check('admin api blocked on gateway', blockedAdmin.status === 404, String(blockedAdmin.status))

const wsResult = await new Promise((resolveRequest) => {
  const req = httpRequest({
    hostname: '127.0.0.1',
    port: portB,
    path: '/ws',
    headers: {
      connection: 'Upgrade',
      upgrade: 'websocket',
      'sec-websocket-key': 'dGhlIHNhbXBsZSBub25jZQ==',
      'sec-websocket-version': '13',
      cookie: sessionCookie,
    },
  })
  req.on('upgrade', (response, socket, head) => {
    let data = head?.toString('utf8') ?? ''
    socket.setEncoding('utf8')
    socket.on('data', (chunk) => { data += chunk })
    socket.on('close', () => resolveRequest({ status: response.statusCode, data }))
    socket.on('error', () => resolveRequest({ status: response.statusCode, data }))
  })
  req.on('response', (response) => resolveRequest({ status: response.statusCode, data: '' }))
  req.on('error', () => resolveRequest({ status: 0, data: '' }))
  req.end()
})
check('websocket upgrade proxied', wsResult.status === 101 && wsResult.data.includes('hello-ws'), JSON.stringify(wsResult))

const remove = await adminCall('/password', { remove: true })
check('password removal stops gateway', remove.data.status?.running === false && remove.data.status?.hasPassword === false)
const closed = await fetch(`${gateway}/`, { redirect: 'manual' }).then(() => false, () => true)
check('gateway port closed after removal', closed)

for (const dispose of disposers.reverse()) {
  try { await dispose() } catch {}
}
admin.close()
upstream.close()
rmSync(home, { recursive: true, force: true })
await sleep(200)

const failed = results.filter((result) => !result.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length === 0 ? 0 : 1)
