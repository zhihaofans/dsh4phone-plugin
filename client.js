window.__ModuleLoader__.load({
  id: 'dsh4phone',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useRef, useState } = React

    const API = '/dsh4phone/api'

    const ACTION_STYLE = `
.d4p-action{box-sizing:border-box;flex:1 1 auto;display:flex;align-items:center;gap:8px;width:100%;height:42px;margin:4px 0;padding:0 10px 0 8px;border:0;border-radius:12px;background:transparent;color:var(--dsw-alias-label-primary,#16181d);font-family:inherit;font-size:14px;line-height:22px;cursor:pointer;overflow:hidden}
.d4p-action:hover{background:var(--dsw-alias-interactive-bg-hover,#f1f3f6)}
.d4p-action:active,.d4p-action[aria-expanded="true"]{background:var(--dsw-alias-interactive-bg-active,#e8ebf0)}
.d4p-action:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,currentColor);outline-offset:2px}
.d4p-action.is-rail{flex:0 0 auto;width:36px;height:36px;margin:8px 0 10px;padding:0;justify-content:center;gap:0;border-radius:50%}
.d4p-action-icon{display:block;flex:none}
.d4p-action-label{min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
`

    const PANEL_STYLE = `
.d4p-backdrop{position:fixed;inset:0;z-index:1300;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(9,11,16,.44)}
.d4p-dialog{width:min(520px,100%);max-height:min(84vh,760px);display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1,#e3e6ec);border-radius:18px;background:var(--dsw-alias-bg-overlay,#fff);color:var(--dsw-alias-label-primary,#16181d);box-shadow:0 24px 70px rgba(9,11,16,.3);overflow:hidden;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif}
.d4p-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 18px;border-bottom:1px solid var(--dsw-alias-border-l1,#e3e6ec)}
.d4p-heading{display:flex;align-items:center;gap:9px;min-width:0}
.d4p-heading h2{margin:0;font-size:15px;font-weight:650;letter-spacing:.01em}
.d4p-dot{flex:none;width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-state-idle-primary,#9aa3b2)}
.d4p-dot.is-on{background:var(--dsw-alias-state-success-primary,#1a9f60);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-success-primary,#1a9f60) 18%,transparent)}
.d4p-icon{flex:none;width:32px;height:32px;display:grid;place-items:center;border:0;border-radius:9px;background:transparent;color:var(--dsw-alias-label-secondary,#646b78);font:20px/1 system-ui;cursor:pointer}
.d4p-icon:hover{background:var(--dsw-alias-interactive-bg-hover,#f1f3f6);color:var(--dsw-alias-label-primary,#16181d)}
.d4p-icon:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,currentColor);outline-offset:1px}
.d4p-body{display:flex;flex-direction:column;gap:12px;padding:14px 18px 18px;overflow:auto}
.d4p-section{padding:14px;border:1px solid var(--dsw-alias-border-l1,#e3e6ec);border-radius:14px;background:var(--dsw-alias-bg-layer-1,#f7f8fa)}
.d4p-section-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.d4p-section-title{margin:0;font-size:13px;font-weight:650}
.d4p-muted{margin:6px 0 0;color:var(--dsw-alias-label-secondary,#646b78);font-size:12px;line-height:1.55}
.d4p-switch{position:relative;flex:none;width:46px;height:28px;border:0;border-radius:999px;background:var(--dsw-alias-border-l2,#d4d8e0);cursor:pointer;transition:background .16s}
.d4p-switch.is-on{background:var(--dsw-alias-brand-primary,#4d6bfe)}
.d4p-switch:disabled{opacity:.45;cursor:default}
.d4p-switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,currentColor);outline-offset:2px}
.d4p-knob{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .16s}
.d4p-switch.is-on .d4p-knob{transform:translateX(18px)}
.d4p-urls{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.d4p-url{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1,#e3e6ec);border-radius:10px;background:var(--dsw-alias-bg-layer-2,#fff)}
.d4p-url-main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px}
.d4p-url-iface{color:var(--dsw-alias-label-secondary,#646b78);font-size:10px;letter-spacing:.06em;text-transform:uppercase}
.d4p-url code{font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.d4p-url button{flex:none;min-height:30px;padding:4px 10px;border:1px solid var(--dsw-alias-border-l2,#d4d8e0);border-radius:8px;background:transparent;color:inherit;font:12px/1.2 inherit;cursor:pointer}
.d4p-url button:hover{background:var(--dsw-alias-interactive-bg-hover,#f1f3f6)}
.d4p-field{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.d4p-field label{color:var(--dsw-alias-label-secondary,#646b78);font-size:12px;font-weight:600}
.d4p-field input{height:38px;padding:0 10px;border:1px solid var(--dsw-alias-border-l2,#d4d8e0);border-radius:9px;background:var(--dsw-alias-bg-layer-2,#fff);color:inherit;font:14px/1.4 inherit;outline:none}
.d4p-field input:focus{border-color:var(--dsw-alias-brand-primary,#4d6bfe);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary,#4d6bfe) 16%,transparent)}
.d4p-field input:disabled{opacity:.6}
.d4p-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:12px}
.d4p-primary{min-height:36px;padding:7px 14px;border:0;border-radius:9px;background:var(--dsw-alias-brand-primary,#4d6bfe);color:#fff;font:600 13px/1.2 inherit;cursor:pointer}
.d4p-primary:disabled{opacity:.45;cursor:default}
.d4p-secondary{min-height:34px;padding:6px 12px;border:1px solid var(--dsw-alias-border-l2,#d4d8e0);border-radius:9px;background:transparent;color:inherit;font:13px/1.2 inherit;cursor:pointer}
.d4p-secondary:hover{background:var(--dsw-alias-interactive-bg-hover,#f1f3f6)}
.d4p-secondary:disabled{opacity:.45;cursor:default}
.d4p-danger{color:var(--dsw-alias-state-error-primary,#c0392b);border-color:var(--dsw-alias-state-error-primary,#c0392b)}
.d4p-feedback{margin:10px 0 0;padding:8px 10px;border-radius:9px;font-size:12px;line-height:1.5}
.d4p-feedback.is-ok{background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#1a9f60) 12%,transparent);color:var(--dsw-alias-state-success-primary,#147a4a)}
.d4p-feedback.is-error{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#c0392b) 10%,transparent);color:var(--dsw-alias-state-error-primary,#b02a20)}
.d4p-row{display:flex;align-items:flex-end;gap:8px}
.d4p-row .d4p-field{flex:1 1 auto}
.d4p-foot{padding:0 18px 16px;color:var(--dsw-alias-label-secondary,#646b78);font-size:11px;line-height:1.6}
@media (max-width:560px){.d4p-backdrop{padding:0;align-items:flex-end}.d4p-dialog{max-height:92vh;border-radius:18px 18px 0 0}}
`

    const EN = {
      title: 'Phone Access',
      close: 'Close',
      'status.loading': 'Reading status…',
      'status.running': 'LAN access is on',
      'status.stopped': 'LAN access is off',
      'status.noPassword': 'Set a password to turn LAN access on.',
      'status.savedOn': 'LAN access is on.',
      'status.savedOff': 'LAN access is off.',
      'address.title': 'Phone address',
      'address.copy': 'Copy',
      'address.copied': 'Copied',
      'address.none': 'Turn LAN access on to see the addresses this phone can open.',
      'address.empty': 'No LAN address was detected. Check the Wi-Fi or Ethernet connection.',
      'address.hint': 'Connect the phone and the computer to the same Wi-Fi, then open one of these addresses in the phone browser.',
      'password.title': 'Access password',
      'password.label': 'New password',
      'password.confirm': 'Confirm password',
      'password.placeholder': 'At least 4 characters',
      'password.hint': 'You choose this password; it is stored on this computer as a salted hash. Changing it signs out phones that are already connected.',
      'password.mismatch': 'The two passwords do not match.',
      'password.save': 'Set password and enable',
      'password.update': 'Change password',
      'password.saved': 'Password saved.',
      'password.clear': 'Remove password',
      'password.clearConfirm': 'Remove the password and turn off LAN access?',
      'password.removed': 'Password removed; LAN access is off.',
      'port.title': 'Port',
      'port.label': 'LAN port',
      'port.apply': 'Apply',
      'port.hint': 'Defaults to 3721. Changing it restarts the gateway immediately; URLs change too.',
      'port.saved': 'Port saved.',
      'signout.title': 'Connected phones',
      'signout.hint': 'Sign every phone out by rotating the session signing key. The password stays the same.',
      'signout.button': 'Sign out all phones',
      'signout.confirm': 'Sign out every phone that is currently connected?',
      'signout.done': 'All phones were signed out.',
      'security.note': 'Private networks only. The LAN connection is plain HTTP, so enable this only on a trusted network and never forward this port from your router.',
      'error.password_required': 'Set a password first.',
      'error.password_invalid': 'Use a password between 4 and 128 characters.',
      'error.port_in_use': 'That port is already in use. Choose another one.',
      'error.port_invalid': 'The port must be between 1024 and 65535.',
      'error.upstream_unavailable': 'DeepSeek Harness is not reachable yet. Restart DSH and try again.',
      'error.upstream_auth_failed': 'Could not authenticate to this DeepSeek Harness. Restart DSH.',
      'error.upstream_auth_unavailable': 'This DeepSeek Harness does not expose a web session. Restart DSH.',
      'error.disposed': 'This plugin is shutting down.',
      'error.internal_error': 'The operation failed. Try again.',
      'error.load_failed': 'Could not read the gateway status.',
      'error.method_not_allowed': 'The operation failed. Try again.',
      'error.body_too_large': 'The request was too large.',
      'error.invalid_json': 'The request could not be read.',
    }

    const ZH = {
      title: '手机访问',
      close: '关闭',
      'status.loading': '正在读取状态…',
      'status.running': '局域网访问已开启',
      'status.stopped': '局域网访问已关闭',
      'status.noPassword': '设置密码后即可开启局域网访问。',
      'status.savedOn': '局域网访问已开启。',
      'status.savedOff': '局域网访问已关闭。',
      'address.title': '手机访问地址',
      'address.copy': '复制',
      'address.copied': '已复制',
      'address.none': '开启后，这里会显示手机可以打开的地址。',
      'address.empty': '没有检测到局域网地址，请检查 Wi-Fi 或有线网络。',
      'address.hint': '让手机和电脑连接同一个 Wi-Fi，然后在手机浏览器里打开上面的地址。',
      'password.title': '访问密码',
      'password.label': '新密码',
      'password.confirm': '确认密码',
      'password.placeholder': '至少 4 个字符',
      'password.hint': '密码由你自己设置，并以加盐哈希保存在这台电脑上。修改密码后，已经连接的手机需要重新登录。',
      'password.mismatch': '两次输入的密码不一致。',
      'password.save': '设置密码并开启',
      'password.update': '修改密码',
      'password.saved': '密码已保存。',
      'password.clear': '清除密码',
      'password.clearConfirm': '清除密码并关闭局域网访问？',
      'password.removed': '密码已清除，局域网访问已关闭。',
      'port.title': '端口',
      'port.label': '局域网端口',
      'port.apply': '应用',
      'port.hint': '默认 3721。修改后会立即重启网关，手机访问地址也会随之变化。',
      'port.saved': '端口已保存。',
      'signout.title': '已连接的手机',
      'signout.hint': '轮换会话签名密钥，让所有手机退出登录。密码保持不变。',
      'signout.button': '让所有手机退出',
      'signout.confirm': '让当前所有已连接的手机退出登录？',
      'signout.done': '所有手机已退出登录。',
      'security.note': '仅限私有局域网。局域网内使用明文 HTTP，请只在可信网络开启，也不要在路由器上把这个端口转发到公网。',
      'error.password_required': '请先设置密码。',
      'error.password_invalid': '密码长度需要在 4 到 128 个字符之间。',
      'error.port_in_use': '端口已被占用，请换一个。',
      'error.port_invalid': '端口需要在 1024 到 65535 之间。',
      'error.upstream_unavailable': '暂时连不上本机 DeepSeek Harness，请重启 DSH 后重试。',
      'error.upstream_auth_failed': '无法通过本机 DeepSeek Harness 的认证，请重启 DSH。',
      'error.upstream_auth_unavailable': '当前 DeepSeek Harness 没有可用的网页会话，请重启 DSH。',
      'error.disposed': '插件正在关闭。',
      'error.internal_error': '操作失败，请重试。',
      'error.load_failed': '无法读取网关状态。',
      'error.method_not_allowed': '操作失败，请重试。',
      'error.body_too_large': '请求内容过大。',
      'error.invalid_json': '无法读取请求。',
    }

    const PHONE_ICON = h('svg', {
      'aria-hidden': true,
      className: 'd4p-action-icon',
      width: 16,
      height: 16,
      viewBox: '0 0 16 16',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.5,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }, h('rect', { x: 4, y: 1, width: 8, height: 14, rx: 2 }), h('path', { d: 'M7 12h2' }))

    async function request(path, options) {
      const response = await fetch(`${API}${path}`, {
        method: options?.method ?? 'GET',
        headers: {
          'x-dsh4phone': '1',
          ...(options?.body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        body: options?.body === undefined ? undefined : JSON.stringify(options.body),
        credentials: 'same-origin',
        cache: 'no-store',
      })
      let data = {}
      try {
        data = await response.json()
      } catch {}
      if (!response.ok || data?.ok === false) {
        const error = new Error(typeof data?.error === 'string' ? data.error : `http_${response.status}`)
        error.code = typeof data?.error === 'string' ? data.error : `http_${response.status}`
        throw error
      }
      return data
    }

    function errorText(t, code) {
      if (typeof code !== 'string' || code === '') return t('error.internal_error')
      const key = `error.${code}`
      const text = t(key)
      return text === key ? t('error.internal_error') : text
    }

    function fallbackCopy(text) {
      try {
        const area = document.createElement('textarea')
        area.value = text
        area.setAttribute('readonly', '')
        area.style.position = 'fixed'
        area.style.opacity = '0'
        document.body.append(area)
        area.select()
        document.execCommand('copy')
        area.remove()
      } catch {}
    }

    /**
     * The control panel administers this computer, so it exists only on the
     * loopback surface. A phone that opened the gateway page must not see a
     * panel whose requests the gateway blocks.
     */
    function isDesktopSurface() {
      const host = window.location.hostname
      return host === '127.0.0.1' || host === 'localhost' || host === '[::1]' || host === '::1'
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        let open = false
        const openListeners = new Set()

        function setOpen(next) {
          if (open === next) return
          open = next
          for (const listener of openListeners) listener()
        }

        function useOpen() {
          const [, force] = useState(0)
          useEffect(() => {
            const listener = () => force((value) => value + 1)
            openListeners.add(listener)
            return () => { openListeners.delete(listener) }
          }, [])
          return open
        }

        function useT() {
          const [, force] = useState(0)
          useEffect(() => ctx.locale.subscribe(() => force((value) => value + 1)), [])
          return ctx.locale.bind('dsh4phone')
        }

        function PhoneAction({ wide }) {
          const t = useT()
          const isOpen = useOpen()
          return h(React.Fragment, null,
            h('style', null, ACTION_STYLE),
            h('button', {
              type: 'button',
              className: `d4p-action${wide ? '' : ' is-rail'}`,
              'aria-label': t('title'),
              'aria-expanded': isOpen,
              title: t('title'),
              onClick: () => setOpen(!isOpen),
            },
            PHONE_ICON,
            wide ? h('span', { className: 'd4p-action-label' }, t('title')) : null))
        }

        function PhonePanel() {
          const t = useT()
          const isOpen = useOpen()
          const [status, setStatus] = useState(null)
          const [loadError, setLoadError] = useState(null)
          const [busy, setBusy] = useState(false)
          const [feedback, setFeedback] = useState(null)
          const [password, setPassword] = useState('')
          const [confirmation, setConfirmation] = useState('')
          const [portDraft, setPortDraft] = useState('')
          const [copied, setCopied] = useState('')
          const passwordRef = useRef(null)
          const closeRef = useRef(null)
          const copyTimer = useRef(null)

          const refresh = useCallback(async () => {
            try {
              const data = await request('/status')
              setStatus(data.status ?? null)
              setLoadError(null)
            } catch (error) {
              setLoadError(error?.code ?? 'internal_error')
            }
          }, [])

          useEffect(() => {
            if (!isOpen) return undefined
            setFeedback(null)
            void refresh()
            const timer = window.setInterval(() => { void refresh() }, 5000)
            const onFocus = () => { void refresh() }
            window.addEventListener('focus', onFocus)
            return () => {
              window.clearInterval(timer)
              window.removeEventListener('focus', onFocus)
            }
          }, [isOpen, refresh])

          useEffect(() => {
            if (!isOpen) return undefined
            const onKeyDown = (event) => {
              if (event.key === 'Escape') setOpen(false)
            }
            window.addEventListener('keydown', onKeyDown)
            return () => window.removeEventListener('keydown', onKeyDown)
          }, [isOpen])

          useEffect(() => {
            if (!isOpen) return
            if (status !== null && !status.hasPassword) {
              passwordRef.current?.focus()
            } else {
              closeRef.current?.focus()
            }
          }, [isOpen, status === null, status?.hasPassword])

          useEffect(() => {
            if (status !== null) setPortDraft(String(status.port))
          }, [status?.port])

          useEffect(() => () => {
            if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
          }, [])

          const run = useCallback(async (operation, successKey) => {
            setBusy(true)
            setFeedback(null)
            try {
              const data = await operation()
              if (data?.status) setStatus(data.status)
              if (successKey) setFeedback({ kind: 'ok', text: t(successKey) })
              return true
            } catch (error) {
              setFeedback({ kind: 'error', text: errorText(t, error?.code) })
              return false
            } finally {
              setBusy(false)
            }
          }, [t])

          const copy = useCallback(async (text) => {
            try {
              await navigator.clipboard.writeText(text)
            } catch {
              fallbackCopy(text)
            }
            setCopied(text)
            if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
            copyTimer.current = window.setTimeout(() => setCopied(''), 1600)
          }, [])

          if (!isOpen) return null

          const hasPassword = status?.hasPassword === true
          const running = status?.running === true
          const mismatch = confirmation !== '' && password !== confirmation
          const canSave = !busy && password.length >= 4 && password === confirmation

          const savePassword = async () => {
            if (!canSave) return
            const saved = await run(
              () => request('/password', { method: 'POST', body: { password } }),
              'password.saved',
            )
            if (saved) {
              setPassword('')
              setConfirmation('')
            }
          }

          const toggle = () => {
            if (status === null || !hasPassword) return
            void run(
              () => request('/enable', { method: 'POST', body: { enabled: !running } }),
              running ? 'status.savedOff' : 'status.savedOn',
            )
          }

          const removePassword = () => {
            if (!window.confirm(t('password.clearConfirm'))) return
            void run(
              () => request('/password', { method: 'POST', body: { remove: true } }),
              'password.removed',
            )
          }

          const applyPort = () => {
            const value = Number(portDraft)
            if (!Number.isInteger(value) || value < 1024 || value > 65535) {
              setFeedback({ kind: 'error', text: t('error.port_invalid') })
              return
            }
            void run(
              () => request('/port', { method: 'POST', body: { port: value } }),
              'port.saved',
            )
          }

          const signOutAll = () => {
            if (!window.confirm(t('signout.confirm'))) return
            void run(
              () => request('/logout-all', { method: 'POST', body: {} }),
              'signout.done',
            )
          }

          const message = loadError !== null
            ? errorText(t, loadError)
            : status === null ? t('status.loading') : running ? t('status.running') : t('status.stopped')

          const urls = running && Array.isArray(status?.urls) ? status.urls : []

          return h('div', {
            className: 'd4p-backdrop',
            onMouseDown: (event) => {
              if (event.target === event.currentTarget) setOpen(false)
            },
          },
          h('section', {
            className: 'd4p-dialog',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-labelledby': 'd4p-title',
          },
          h('style', null, PANEL_STYLE),
          h('header', { className: 'd4p-head' },
            h('div', { className: 'd4p-heading' },
              h('span', { className: `d4p-dot${running ? ' is-on' : ''}` }),
              h('h2', { id: 'd4p-title' }, t('title')),
              h('span', { className: 'd4p-muted' }, message)),
            h('button', {
              ref: closeRef,
              type: 'button',
              className: 'd4p-icon',
              'aria-label': t('close'),
              title: t('close'),
              onClick: () => setOpen(false),
            }, '×')),

          h('div', { className: 'd4p-body' },
            h('section', { className: 'd4p-section' },
              h('div', { className: 'd4p-section-head' },
                h('h3', { className: 'd4p-section-title' }, t('address.title')),
                h('button', {
                  type: 'button',
                  role: 'switch',
                  'aria-checked': running,
                  'aria-label': t('address.title'),
                  className: `d4p-switch${running ? ' is-on' : ''}`,
                  disabled: busy || status === null || !hasPassword,
                  onClick: toggle,
                }, h('span', { className: 'd4p-knob' }))),

              urls.length > 0
                ? h('div', { className: 'd4p-urls' }, urls.map((entry) => h('div', { className: 'd4p-url', key: entry.url },
                  h('div', { className: 'd4p-url-main' },
                    h('span', { className: 'd4p-url-iface' }, entry.interface),
                    h('code', null, entry.url)),
                  h('button', {
                    type: 'button',
                    onClick: () => { void copy(entry.url) },
                  }, copied === entry.url ? t('address.copied') : t('address.copy')))))
                : h('p', { className: 'd4p-muted' }, running ? t('address.empty') : hasPassword ? t('address.none') : t('status.noPassword')),

              h('p', { className: 'd4p-muted' }, t('address.hint')),

              feedback !== null
                ? h('p', { className: `d4p-feedback${feedback.kind === 'ok' ? ' is-ok' : ' is-error'}`, role: 'status' }, feedback.text)
                : null),

            h('section', { className: 'd4p-section' },
              h('div', { className: 'd4p-section-head' },
                h('h3', { className: 'd4p-section-title' }, t('password.title'))),
              h('form', {
                onSubmit: (event) => {
                  event.preventDefault()
                  void savePassword()
                },
              },
              h('div', { className: 'd4p-field' },
                h('label', { htmlFor: 'd4p-password' }, t('password.label')),
                h('input', {
                  ref: passwordRef,
                  id: 'd4p-password',
                  type: 'password',
                  value: password,
                  autoComplete: 'new-password',
                  placeholder: t('password.placeholder'),
                  disabled: busy,
                  onChange: (event) => setPassword(event.target.value),
                })),
              h('div', { className: 'd4p-field' },
                h('label', { htmlFor: 'd4p-confirm' }, t('password.confirm')),
                h('input', {
                  id: 'd4p-confirm',
                  type: 'password',
                  value: confirmation,
                  autoComplete: 'new-password',
                  placeholder: t('password.placeholder'),
                  disabled: busy,
                  onChange: (event) => setConfirmation(event.target.value),
                })),
              mismatch ? h('p', { className: 'd4p-feedback is-error', role: 'alert' }, t('password.mismatch')) : null,
              h('div', { className: 'd4p-actions' },
                h('button', {
                  type: 'submit',
                  className: 'd4p-primary',
                  disabled: !canSave,
                }, hasPassword ? t('password.update') : t('password.save')),
                hasPassword
                  ? h('button', {
                    type: 'button',
                    className: 'd4p-secondary d4p-danger',
                    disabled: busy,
                    onClick: removePassword,
                  }, t('password.clear'))
                  : null)),
              h('p', { className: 'd4p-muted' }, t('password.hint'))),

            h('section', { className: 'd4p-section' },
              h('h3', { className: 'd4p-section-title' }, t('port.title')),
              h('div', { className: 'd4p-row' },
                h('div', { className: 'd4p-field' },
                  h('label', { htmlFor: 'd4p-port' }, t('port.label')),
                  h('input', {
                    id: 'd4p-port',
                    type: 'number',
                    min: 1024,
                    max: 65535,
                    inputMode: 'numeric',
                    value: portDraft,
                    disabled: busy || status === null,
                    onChange: (event) => setPortDraft(event.target.value),
                  })),
                h('button', {
                  type: 'button',
                  className: 'd4p-secondary',
                  disabled: busy || status === null || Number(portDraft) === status.port,
                  onClick: applyPort,
                }, t('port.apply'))),
              h('p', { className: 'd4p-muted' }, t('port.hint'))),

            h('section', { className: 'd4p-section' },
              h('h3', { className: 'd4p-section-title' }, t('signout.title')),
              h('p', { className: 'd4p-muted' }, t('signout.hint')),
              h('div', { className: 'd4p-actions' },
                h('button', {
                  type: 'button',
                  className: 'd4p-secondary',
                  disabled: busy || status === null,
                  onClick: signOutAll,
                }, t('signout.button'))))),

          h('p', { className: 'd4p-foot' }, t('security.note'))))
        }

        ctx.effect(() => ctx.locale.register('dsh4phone', { en: EN, zh: ZH }), 'dsh4phone dictionaries')
        if (!isDesktopSurface()) return
        ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
          name: 'sidebar.footer.action',
          id: 'dsh4phone',
          order: 30,
        }, PhoneAction))
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'dsh4phone-panel',
          order: 200,
        }, PhonePanel))
      },
    }
  },
})
