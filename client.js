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
.d4p-backdrop{--d4p-page:#FFFFFF;--d4p-text:#0F1115;--d4p-muted:#61666B;--d4p-input:#FFFFFF;--d4p-border:rgba(0,0,0,.10);--d4p-primary-bg:#0F1115;--d4p-primary-text:#FFFFFF;--d4p-disabled-bg:#FFFFFF;--d4p-disabled-text:#61666B;--d4p-success:#22C55E;--d4p-error:#EC1313;--d4p-hover:rgba(0,0,0,.04);--d4p-active:rgba(0,0,0,.07);--d4p-backdrop-fill:rgba(9,11,16,.44);--d4p-shadow:0 24px 70px rgba(9,11,16,.18);position:fixed;inset:0;z-index:1300;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--d4p-backdrop-fill)}
body[data-ds-dark-theme] .d4p-backdrop{--d4p-page:#151517;--d4p-text:#F9FAFB;--d4p-muted:#CFD3D6;--d4p-input:#232324;--d4p-border:rgba(255,255,255,.12);--d4p-primary-bg:#F9FAFB;--d4p-primary-text:#151517;--d4p-disabled-bg:#2C2C2E;--d4p-disabled-text:#CFD3D6;--d4p-success:#22C55E;--d4p-error:#F25A5A;--d4p-hover:rgba(255,255,255,.06);--d4p-active:rgba(255,255,255,.10);--d4p-backdrop-fill:rgba(0,0,0,.58);--d4p-shadow:0 24px 70px rgba(0,0,0,.55)}
.d4p-dialog{color-scheme:light;width:min(520px,100%);max-height:min(84vh,760px);display:flex;flex-direction:column;border:1px solid var(--d4p-border);border-radius:18px;background:var(--d4p-page);color:var(--d4p-text);box-shadow:var(--d4p-shadow);overflow:hidden;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif}
body[data-ds-dark-theme] .d4p-dialog{color-scheme:dark}
.d4p-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 18px;border-bottom:1px solid var(--d4p-border)}
.d4p-heading{display:flex;align-items:center;gap:9px;min-width:0}
.d4p-heading h2{margin:0;font-size:15px;font-weight:650;letter-spacing:.01em}
.d4p-dot{flex:none;width:8px;height:8px;border-radius:50%;background:var(--d4p-muted)}
.d4p-dot.is-on{background:var(--d4p-success);box-shadow:0 0 0 3px color-mix(in srgb,var(--d4p-success) 18%,transparent)}
.d4p-icon{flex:none;width:32px;height:32px;display:grid;place-items:center;border:0;border-radius:9px;background:transparent;color:var(--d4p-muted);font:20px/1 system-ui;cursor:pointer}
.d4p-icon:hover{background:var(--d4p-hover);color:var(--d4p-text)}
.d4p-icon:focus-visible{outline:2px solid var(--d4p-text);outline-offset:1px}
.d4p-body{display:flex;flex-direction:column;gap:12px;padding:14px 18px 18px;overflow:auto}
.d4p-section{padding:14px;border:1px solid var(--d4p-border);border-radius:14px;background:var(--d4p-page)}
.d4p-section-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.d4p-section-title{margin:0;font-size:13px;font-weight:650}
.d4p-muted{margin:6px 0 0;color:var(--d4p-muted);font-size:12px;line-height:1.55}
.d4p-switch{position:relative;flex:none;width:46px;height:28px;border:1px solid var(--d4p-border);border-radius:999px;background:var(--d4p-input);cursor:pointer;transition:background .16s,border-color .16s}
.d4p-switch.is-on{background:var(--d4p-text);border-color:var(--d4p-text)}
.d4p-switch:disabled{opacity:.45;cursor:default}
.d4p-switch:focus-visible{outline:2px solid var(--d4p-text);outline-offset:2px}
.d4p-knob{position:absolute;top:2px;left:2px;width:22px;height:22px;border-radius:50%;background:var(--d4p-muted);box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .16s,background .16s}
.d4p-switch.is-on .d4p-knob{transform:translateX(18px);background:var(--d4p-page)}
.d4p-urls{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.d4p-url{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--d4p-border);border-radius:10px;background:var(--d4p-input)}
.d4p-url-main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px}
.d4p-url-iface{color:var(--d4p-muted);font-size:10px;letter-spacing:.06em;text-transform:uppercase}
.d4p-url code{color:var(--d4p-text);font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.d4p-url button{flex:none;min-height:30px;padding:4px 10px;border:1px solid var(--d4p-border);border-radius:8px;background:transparent;color:var(--d4p-text);font:12px/1.2 inherit;cursor:pointer}
.d4p-url button:hover{background:var(--d4p-hover)}
.d4p-url-actions{display:flex;flex:none;align-items:center;gap:6px}
.d4p-url .d4p-qr-btn{display:grid;place-items:center;width:32px;min-width:32px;min-height:30px;padding:0;border:1px solid var(--d4p-border);border-radius:8px;background:transparent;color:var(--d4p-text);cursor:pointer}
.d4p-url .d4p-qr-btn:hover{background:var(--d4p-hover)}
.d4p-url .d4p-qr-btn.is-active{border-color:var(--d4p-text);background:var(--d4p-active);color:var(--d4p-text)}
.d4p-url .d4p-qr-btn:disabled{opacity:.45;cursor:default}
.d4p-qr{display:flex;align-items:center;gap:14px;margin-top:10px;padding:12px;border:1px solid var(--d4p-border);border-radius:12px;background:var(--d4p-input)}
.d4p-qr-code{flex:none;padding:8px;border-radius:10px;background:#fff}
.d4p-qr-code svg{display:block;width:152px;height:152px}
.d4p-qr-info{flex:1 1 auto;min-width:0}
.d4p-qr-title{margin:0;font-size:13px;font-weight:650}
.d4p-qr-info code{display:block;margin:4px 0 6px;color:var(--d4p-text);font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-wrap:anywhere}
.d4p-qr-info .d4p-muted{margin:0 0 10px}
.d4p-field{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.d4p-field label{color:var(--d4p-muted);font-size:12px;font-weight:600}
.d4p-field input{height:38px;padding:0 10px;border:1px solid var(--d4p-border);border-radius:9px;background:var(--d4p-input);color:var(--d4p-text);font:14px/1.4 inherit;outline:none}
.d4p-field input:focus{border-color:var(--d4p-text);box-shadow:0 0 0 3px var(--d4p-active)}
.d4p-field input:disabled{opacity:.6}
.d4p-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:12px}
.d4p-primary{min-height:36px;padding:7px 14px;border:1px solid transparent;border-radius:9px;background:var(--d4p-primary-bg);color:var(--d4p-primary-text);font:600 13px/1.2 inherit;cursor:pointer}
.d4p-primary:hover:not(:disabled){opacity:.9}
.d4p-primary:disabled{background:var(--d4p-disabled-bg);color:var(--d4p-disabled-text);border-color:var(--d4p-border);opacity:1;cursor:default}
.d4p-secondary{min-height:34px;padding:6px 12px;border:1px solid var(--d4p-border);border-radius:9px;background:transparent;color:var(--d4p-text);font:13px/1.2 inherit;cursor:pointer}
.d4p-secondary:hover{background:var(--d4p-hover)}
.d4p-secondary:disabled{opacity:.45;cursor:default}
.d4p-danger{color:var(--d4p-error)}
.d4p-danger:hover{background:color-mix(in srgb,var(--d4p-error) 8%,transparent)}
.d4p-devices{display:flex;flex-direction:column;margin-top:10px;border:1px solid var(--d4p-border);border-radius:10px;background:var(--d4p-input);max-height:220px;overflow-y:auto}
.d4p-device{display:flex;align-items:center;gap:10px;padding:9px 11px}
.d4p-device + .d4p-device{border-top:1px solid var(--d4p-border)}
.d4p-device-icon{flex:none;color:var(--d4p-muted)}
.d4p-device-main{display:flex;flex-direction:column;min-width:0;gap:1px}
.d4p-device-name{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.d4p-device-time{font-size:11px;color:var(--d4p-muted)}
.d4p-feedback{margin:10px 0 0;padding:8px 10px;border-radius:9px;font-size:12px;line-height:1.5}
.d4p-feedback.is-ok{background:color-mix(in srgb,var(--d4p-success) 12%,transparent);color:var(--d4p-success)}
.d4p-feedback.is-error{background:color-mix(in srgb,var(--d4p-error) 12%,transparent);color:var(--d4p-error)}
.d4p-row{display:flex;align-items:flex-end;gap:8px}
.d4p-row .d4p-field{flex:1 1 auto}
.d4p-foot{padding:0 18px 16px;color:var(--d4p-muted);font-size:11px;line-height:1.6}
@media (max-width:560px){.d4p-backdrop{padding:0;align-items:flex-end}.d4p-dialog{max-height:92vh;border-radius:18px 18px 0 0}}
`

    const MOBILE_STYLE = `
html[data-d4p-mobile],html[data-d4p-mobile] body{height:100%;overflow:hidden;overscroll-behavior:none}
html[data-d4p-mobile] body{height:var(--d4p-vv-height,100dvh);background:var(--dsw-alias-bg-base)}
html[data-d4p-mobile] #root{height:100%}
html[data-d4p-mobile] [data-d4p-frame]{height:100%!important;grid-template-columns:0 minmax(0,1fr) 0!important;grid-template-rows:minmax(0,1fr) auto!important;padding-top:0!important;--dsh-frame-leading-clearance:0px!important;--dsh-frame-top-clearance:0px!important;--dsh-frame-chrome-top:0px!important}
html[data-d4p-mobile] [data-d4p-frame]>[data-shell-leading],
html[data-d4p-mobile] [data-d4p-frame]>[class*="_handle"]{display:none!important}
html[data-d4p-mobile] [data-d4p-frame]>[data-d4p-sidebar]{position:fixed!important;top:0;bottom:0;left:0;z-index:950;display:flex;flex-direction:column;width:min(86vw,340px);max-width:100%;height:100%;box-sizing:border-box;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);background:var(--dsw-specific-sidebar-fill,var(--dsw-alias-bg-base));border-right:1px solid var(--dsw-alias-border-l1);box-shadow:0 0 44px rgba(0,0,0,.38);overflow:hidden;visibility:hidden;transform:translateX(-103%);transition:transform .2s var(--ds-ease-in-out,ease),visibility .2s}
html[data-d4p-mobile][data-d4p-drawer="open"] [data-d4p-frame]>[data-d4p-sidebar]{visibility:visible;transform:none}
html[data-d4p-mobile] [data-d4p-frame]>[data-d4p-sidebar]>*{flex:1 1 auto;min-height:0}
html[data-d4p-mobile] [data-d4p-frame]>[data-d4p-sidebar] [class*="_topStrip"]{display:none!important}
html[data-d4p-mobile] [data-d4p-frame]>[data-d4p-sidebar] [class*="_logoRow"]{height:44px;margin-bottom:4px}
html[data-d4p-mobile] [data-d4p-center]{grid-column:2;min-width:0;box-sizing:border-box;padding-top:env(safe-area-inset-top);border-left:0!important}
html[data-d4p-mobile] [data-d4p-center] [class*="_header"]{position:relative;padding-left:56px!important}
html[data-d4p-mobile] [data-d4p-center] [class*="_header"] [class*="_headerLeading"],
html[data-d4p-mobile] [data-d4p-center] [class*="_header"] [class*="_headerUtilities"]{display:none!important}
html[data-d4p-mobile] [data-d4p-center] [class*="_header"] [class*="_headerActions"]{position:absolute!important;right:12px;bottom:2px;z-index:2;display:flex;max-width:calc(100% - 150px);overflow:hidden}
html[data-d4p-mobile] [data-d4p-center] [class*="_header"] [class*="_headerActions"]>div>:not(:last-child){display:none!important}
html[data-d4p-mobile] [data-d4p-center] [class*="_header"] [class*="_tabs"]{gap:20px!important}
html[data-d4p-mobile] .Dws9Sa_overlay{align-items:stretch;justify-content:stretch}
html[data-d4p-mobile] .Dws9Sa_panel{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;margin:0;border-radius:0;flex-direction:column;background:var(--dsw-alias-bg-base)}
html[data-d4p-mobile] .Dws9Sa_nav{width:100%;padding:calc(env(safe-area-inset-top) + 10px) 12px 0;gap:8px}
html[data-d4p-mobile] .Dws9Sa_navTitle{padding:0 4px;font-size:18px;line-height:28px;min-height:36px;display:flex;align-items:center}
html[data-d4p-mobile] .Dws9Sa_navList{flex-direction:row;gap:6px;overflow-x:auto;overflow-y:hidden;padding-bottom:8px;scrollbar-width:none}
html[data-d4p-mobile] .Dws9Sa_navList::-webkit-scrollbar{display:none}
html[data-d4p-mobile] .Dws9Sa_navCell{flex:none;height:36px;padding:6px 12px;white-space:nowrap}
html[data-d4p-mobile] .Dws9Sa_navIcon{display:none}
html[data-d4p-mobile] .Dws9Sa_navLabel{flex:none;overflow:visible}
html[data-d4p-mobile] .Dws9Sa_content{flex:1;min-height:0}
html[data-d4p-mobile] .Dws9Sa_header{position:absolute;top:calc(env(safe-area-inset-top) + 8px);right:8px;height:36px;padding:0;z-index:3;align-items:center}
html[data-d4p-mobile] .Dws9Sa_actions{gap:6px}
html[data-d4p-mobile] .Dws9Sa_close{width:32px;height:32px}
html[data-d4p-mobile] .Dws9Sa_options{padding:0 14px calc(env(safe-area-inset-bottom) + 20px)}
html[data-d4p-mobile] [data-d4p-frame]:not([data-rightbar-collapsed]){grid-template-columns:0 0 minmax(0,1fr)!important}
html[data-d4p-mobile] [data-d4p-frame]:not([data-rightbar-collapsed])>[data-d4p-center]{display:none!important}
html[data-d4p-mobile] [data-d4p-frame]:not([data-rightbar-collapsed])>[data-d4p-rightbar]{grid-column:3;width:100%;min-width:0;height:100%;box-sizing:border-box;padding-top:calc(52px + env(safe-area-inset-top));overflow:hidden}
html[data-d4p-mobile] [data-d4p-mobile-layer]{position:fixed;inset:0;z-index:900;pointer-events:none}
html[data-d4p-mobile] .d4p-mobile-scrim{position:absolute;inset:0;background:rgba(0,0,0,.46);opacity:0;pointer-events:none;transition:opacity .18s}
html[data-d4p-mobile][data-d4p-drawer="open"] .d4p-mobile-scrim{opacity:1;pointer-events:auto}
html[data-d4p-mobile] .d4p-mobile-menu{position:fixed;top:calc(env(safe-area-inset-top) + 7px);left:8px;z-index:1;display:grid;place-items:center;width:40px;height:40px;padding:0;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-base);background:color-mix(in srgb,var(--dsw-alias-bg-base) 88%,transparent);color:var(--dsw-alias-label-primary);box-shadow:0 2px 12px rgba(0,0,0,.16);backdrop-filter:blur(12px);cursor:pointer;pointer-events:auto}
html[data-d4p-mobile] .d4p-mobile-menu:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,currentColor);outline-offset:2px}
html[data-d4p-mobile][data-d4p-drawer="open"] .d4p-mobile-menu{display:none}
html[data-d4p-mobile] .d4p-mobile-icon-back{display:none}
html[data-d4p-mobile][data-d4p-rightbar="open"] .d4p-mobile-icon-menu{display:none}
html[data-d4p-mobile][data-d4p-rightbar="open"] .d4p-mobile-icon-back{display:block}
html[data-d4p-mobile] [data-d4p-composer]{padding-bottom:calc(env(safe-area-inset-bottom) + 8px)!important}
html[data-d4p-mobile] [data-d4p-center] [class*="_composerSeat"]{padding-bottom:calc(env(safe-area-inset-bottom) + 8px)!important}
html[data-d4p-mobile] [data-d4p-center] [class*="_composerSeat"] button{min-width:32px;min-height:32px;touch-action:manipulation}
html[data-d4p-mobile] [data-d4p-center] textarea,
html[data-d4p-mobile] [data-d4p-center] [contenteditable="true"]{font-size:16px!important;line-height:24px!important}
html[data-d4p-mobile] [data-d4p-composer] button{min-width:32px;min-height:32px;touch-action:manipulation}
html[data-d4p-mobile] [data-d4p-center] pre,
html[data-d4p-mobile] [data-d4p-center] .md-table-wide{max-width:100%;overflow-x:auto}
html[data-d4p-mobile] [data-d4p-center] img{max-width:100%;height:auto}
html[data-d4p-mobile] [role="dialog"],
html[data-d4p-mobile] [aria-modal="true"]{max-width:calc(100vw - 24px)!important;max-height:calc(100dvh - 32px)!important}
html[data-d4p-mobile] [role="menu"],
html[data-d4p-mobile] [role="listbox"]{max-width:calc(100vw - 16px)!important}
html[data-d4p-mobile] button,
html[data-d4p-mobile] [role="button"]{touch-action:manipulation}
`

    const MOBILE_MENU_ICON = '<svg class="d4p-mobile-icon-menu" width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M3 5h10M3 8h10M3 11h10"/></svg><svg class="d4p-mobile-icon-back" width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 3.5 5 8l4.5 4.5"/></svg>'

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
      'qr.show': 'Show QR code',
      'qr.hide': 'Hide QR code',
      'qr.title': 'Scan to open',
      'qr.alt': 'QR code for',
      'qr.hint': 'Scan with the phone camera to open this address directly.',
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
      'devices.empty': 'No phone has connected yet.',
      'devices.lastSeen': 'Last connected {time}',
      'devices.justNow': 'just now',
      'devices.minutesAgo': '{count} min ago',
      'devices.hoursAgo': '{count} h ago',
      'devices.daysAgo': '{count} d ago',
      'devices.unknown': 'unknown',
      'mobile.menu': 'Open sidebar',
      'mobile.back': 'Back to chat',
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
      'error.invalid_text': 'The address could not be encoded.',
      'error.qr_failed': 'Could not generate the QR code.',
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
      'qr.show': '显示二维码',
      'qr.hide': '隐藏二维码',
      'qr.title': '扫码打开',
      'qr.alt': '二维码：',
      'qr.hint': '用手机相机扫描，直接打开这个地址。',
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
      'devices.empty': '还没有手机连接过。',
      'devices.lastSeen': '最后连接：{time}',
      'devices.justNow': '刚刚',
      'devices.minutesAgo': '{count} 分钟前',
      'devices.hoursAgo': '{count} 小时前',
      'devices.daysAgo': '{count} 天前',
      'devices.unknown': '未知',
      'mobile.menu': '打开侧栏',
      'mobile.back': '返回对话',
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
      'error.invalid_text': '这个地址无法生成二维码。',
      'error.qr_failed': '二维码生成失败。',
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

    const DEVICE_ICON = h('svg', {
      'aria-hidden': true,
      className: 'd4p-device-icon',
      width: 15,
      height: 15,
      viewBox: '0 0 16 16',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.4,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }, h('rect', { x: 4, y: 1.2, width: 8, height: 13.6, rx: 2 }), h('path', { d: 'M7 12.2h2' }))

    const QR_ICON = h('svg', {
      'aria-hidden': true,
      width: 15,
      height: 15,
      viewBox: '0 0 16 16',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.4,
    },
    h('rect', { x: 1.2, y: 1.2, width: 4.6, height: 4.6, rx: 0.9 }),
    h('rect', { x: 10.2, y: 1.2, width: 4.6, height: 4.6, rx: 0.9 }),
    h('rect', { x: 1.2, y: 10.2, width: 4.6, height: 4.6, rx: 0.9 }),
    h('path', {
      d: 'M10.4 10.4h1.6v1.6h-1.6zM13.2 10.4h1.6v1.6h-1.6zM10.4 13.2h1.6v1.6h-1.6zM13.2 13.2h1.6v1.6h-1.6z',
      fill: 'currentColor',
      stroke: 'none',
    }))

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
     * Hide the control panel only on the phone gateway. The gateway sets a
     * non-secret `dsh4phone_gateway=<port>` cookie on everything it serves;
     * matching the page's own port distinguishes the gateway page from the
     * desktop page on the same host. Without a matching marker the panel is
     * always mounted, so the desktop app's own host or protocol never hides
     * it. The gateway never exposes the admin API, so a hidden panel there is
     * the only correct state.
     */
    function isPhoneGatewaySurface() {
      if (typeof document === 'undefined' || typeof document.cookie !== 'string') return false
      const marker = `dsh4phone_gateway=${window.location.port}`
      return document.cookie.split(';').some((part) => part.trim() === marker)
    }

    /** One SVG path covering every dark module of a host-generated matrix. */
    function qrPath(qr) {
      let path = ''
      for (let row = 0; row < qr.size; row += 1) {
        const bits = qr.modules[row] ?? ''
        for (let column = 0; column < qr.size; column += 1) {
          if (bits[column] === '1') path += `M${column} ${row}h1v1h-1z`
        }
      }
      return path
    }

    /** Relative "last connected" text for one device record. */
    function lastSeenLabel(t, iso) {
      const time = Date.parse(iso)
      if (!Number.isFinite(time)) return t('devices.unknown')
      const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000))
      if (seconds < 60) return t('devices.justNow')
      const minutes = Math.floor(seconds / 60)
      if (minutes < 60) return t('devices.minutesAgo', { count: minutes })
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return t('devices.hoursAgo', { count: hours })
      const days = Math.floor(hours / 24)
      if (days < 30) return t('devices.daysAgo', { count: days })
      return new Date(time).toLocaleDateString()
    }

    const MOBILE_QUERY = '(max-width: 640px), (max-height: 520px)'

    /**
     * Keep a phone-sized gateway page in a drawer/full-width layout. The layer
     * is media-driven: rotation or a desktop-sized window removes it and the
     * stock DSH layout returns. A missing shell/layout service is fail-open.
     */
    function installMobileLayout(ctx) {
      if (typeof window.matchMedia !== 'function') return () => {}
      const media = window.matchMedia(MOBILE_QUERY)
      let cleanup = null
      const sync = () => {
        if (media.matches) {
          if (cleanup === null) {
            try {
              cleanup = activateMobileLayout(ctx)
            } catch (error) {
              console.error('[dsh4phone] mobile layout disabled', error)
              cleanup = () => {}
            }
          }
          return
        }
        if (cleanup !== null) {
          const dispose = cleanup
          cleanup = null
          dispose()
        }
      }
      const onChange = () => sync()
      if (typeof media.addEventListener === 'function') media.addEventListener('change', onChange)
      else if (typeof media.addListener === 'function') media.addListener(onChange)
      sync()
      return () => {
        if (typeof media.removeEventListener === 'function') media.removeEventListener('change', onChange)
        else if (typeof media.removeListener === 'function') media.removeListener(onChange)
        if (cleanup !== null) {
          const dispose = cleanup
          cleanup = null
          dispose()
        }
      }
    }

    function activateMobileLayout(ctx) {
      // The layout service can arrive after this plugin; resolve it at action
      // time so the mobile shell still mounts (the menu no-ops until the
      // service exists, then works without a reload).
      const layoutService = () => {
        const value = typeof ctx.get === 'function' ? ctx.get('layout') : undefined
        return value !== undefined && value !== null && typeof value.toggleSidebar === 'function' ? value : undefined
      }
      if (typeof document === 'undefined' || document.documentElement === undefined) return () => {}
      const root = document.documentElement
      if (root === undefined || root === null || root.dataset === undefined) return () => {}
      const t = typeof ctx.locale?.bind === 'function' ? ctx.locale.bind('dsh4phone') : (key) => key

      let installed = false
      let mountObserver = null
      let drawerObserver = null
      let settingsObserver = null
      let settingsModal = null
      let style = null
      let layer = null
      let menu = null
      let scrim = null
      let frame = null
      let sidebar = null
      let center = null
      let rightbar = null
      let composer = null
      let meta = null
      let previousMeta = null
      let unsubscribeLocale = null

      const findFrame = () => {
        const overlay = document.querySelector('[data-shell-overlay]')
        return overlay === null || overlay === undefined ? null : overlay.parentElement
      }

      const syncLabels = () => {
        if (menu === null || frame === null) return
        const back = !frame.hasAttribute('data-rightbar-collapsed')
        const label = back ? t('mobile.back') : t('mobile.menu')
        menu.setAttribute('aria-label', label)
        menu.setAttribute('title', label)
      }

      const syncState = () => {
        if (frame === null) return
        const drawerOpen = !frame.hasAttribute('data-sidebar-collapsed')
        const rightbarOpen = !frame.hasAttribute('data-rightbar-collapsed')
        root.dataset.d4pDrawer = drawerOpen ? 'open' : 'closed'
        root.dataset.d4pRightbar = rightbarOpen ? 'open' : 'closed'
        if (menu !== null) menu.setAttribute('aria-expanded', String(drawerOpen))
        syncLabels()
      }

      const onMenuClick = () => {
        if (frame === null) return
        const layout = layoutService()
        if (layout === undefined) return
        if (!frame.hasAttribute('data-rightbar-collapsed')) {
          if (typeof layout.closeRightbar === 'function') layout.closeRightbar()
          return
        }
        layout.toggleSidebar()
        window.setTimeout(() => {
          if (frame !== null && !frame.hasAttribute('data-sidebar-collapsed') && sidebar !== null) {
            const target = sidebar.querySelector('button, [href], [tabindex]')
            if (target !== null && target !== undefined && typeof target.focus === 'function') target.focus()
          }
        }, 80)
      }

      const onScrimClick = () => {
        const layout = layoutService()
        if (layout !== undefined && frame !== null && !frame.hasAttribute('data-sidebar-collapsed')) layout.toggleSidebar()
        if (menu !== null) menu.focus()
      }

      const fitSettingsPanel = () => {
        const modal = document.querySelector('[data-shortcut-modal="settings"]')
        if (modal === null) return false
        settingsModal = modal
        modal.style.setProperty('width', '100vw', 'important')
        modal.style.setProperty('max-width', '100vw', 'important')
        modal.style.setProperty('min-width', '100vw', 'important')
        modal.style.setProperty('height', '100dvh', 'important')
        modal.style.setProperty('max-height', '100dvh', 'important')
        modal.style.setProperty('min-height', '100dvh', 'important')
        modal.style.setProperty('flex', 'none', 'important')
        modal.style.setProperty('margin', '0', 'important')
        return true
      }

      const onSidebarClick = (event) => {
        const target = event.target
        if (target === null || target === undefined || typeof target.closest !== 'function') return
        if (frame === null || frame.hasAttribute('data-sidebar-collapsed')) return
        // Menus opened from row action icons should stay inside the drawer.
        if (target.closest('[class*="_iconButton"]') !== null && target.closest('[aria-label*="新建会话"]') === null) return
        const item = target.closest('[data-row-key^="session:"], [class*="_panelRow"], [class*="_newSession"], [aria-label*="新建会话"]')
        if (item === null) return
        const layout = layoutService()
        if (layout !== undefined) layout.toggleSidebar()
      }

      const onKeyDown = (event) => {
        if (event.key !== 'Escape' || frame === null) return
        const layout = layoutService()
        if (layout === undefined) return
        if (!frame.hasAttribute('data-sidebar-collapsed')) {
          layout.toggleSidebar()
          if (menu !== null) menu.focus()
          return
        }
        if (!frame.hasAttribute('data-rightbar-collapsed') && typeof layout.closeRightbar === 'function') {
          layout.closeRightbar()
        }
      }

      const onFocusIn = (event) => {
        const target = event.target
        if (target === null || target === undefined || typeof target.closest !== 'function') return
        if (target.closest('[data-d4p-composer]') === null) return
        window.setTimeout(() => {
          if (composer !== null && typeof composer.scrollIntoView === 'function') {
            composer.scrollIntoView({ block: 'nearest' })
          }
        }, 260)
      }

      const updateViewport = () => {
        const height = window.visualViewport?.height ?? window.innerHeight
        if (Number.isFinite(height)) root.style.setProperty('--d4p-vv-height', `${Math.round(height)}px`)
      }

      const decorate = () => {
        if (installed) return true
        const candidate = findFrame()
        if (candidate === null || candidate.children === undefined || candidate.children.length < 2) return false
        const sidebarCandidate = candidate.children[0]
        const centerCandidate = candidate.children[1]
        if (sidebarCandidate === undefined || centerCandidate === undefined) return false
        if (sidebarCandidate.nodeType !== 1 || centerCandidate.nodeType !== 1) return false
        if (typeof document.createElement !== 'function' || document.head === undefined || document.body === undefined) return false
        frame = candidate
        sidebar = sidebarCandidate
        center = centerCandidate
        rightbar = candidate.children[2] !== undefined && candidate.children[2].nodeType === 1 ? candidate.children[2] : null
        installed = true
        root.dataset.d4pMobile = 'true'
        root.dataset.d4pDrawer = 'closed'
        root.dataset.d4pRightbar = 'closed'
        frame.setAttribute('data-d4p-frame', '')
        sidebar.setAttribute('data-d4p-sidebar', '')
        sidebar.id = 'd4p-mobile-drawer'
        center.setAttribute('data-d4p-center', '')
        if (rightbar !== null) rightbar.setAttribute('data-d4p-rightbar', '')
        const editor = center.querySelector('[contenteditable="true"], textarea')
        if (editor !== null) {
          composer = editor.closest('[class*="_composerSeat"]') ?? editor.parentElement
          if (composer !== null) composer.setAttribute('data-d4p-composer', '')
        }
        meta = document.querySelector('meta[name="viewport"]')
        previousMeta = meta === null ? null : meta.getAttribute('content')
        if (meta !== null) meta.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover')
        style = document.createElement('style')
        style.setAttribute('data-d4p-mobile-style', '')
        style.textContent = MOBILE_STYLE
        document.head.append(style)
        layer = document.createElement('div')
        layer.setAttribute('data-d4p-mobile-layer', '')
        menu = document.createElement('button')
        menu.type = 'button'
        menu.className = 'd4p-mobile-menu'
        menu.setAttribute('aria-controls', 'd4p-mobile-drawer')
        menu.innerHTML = MOBILE_MENU_ICON
        scrim = document.createElement('div')
        scrim.className = 'd4p-mobile-scrim'
        scrim.setAttribute('aria-hidden', 'true')
        layer.append(menu, scrim)
        document.body.append(layer)
        menu.addEventListener('click', onMenuClick)
        scrim.addEventListener('click', onScrimClick)
        sidebar.addEventListener('click', onSidebarClick)
        document.addEventListener('keydown', onKeyDown)
        document.addEventListener('focusin', onFocusIn)
        if (typeof MutationObserver === 'function') {
          drawerObserver = new MutationObserver(syncState)
          drawerObserver.observe(frame, { attributes: true, attributeFilter: ['data-sidebar-collapsed', 'data-rightbar-collapsed'] })
          settingsObserver = new MutationObserver(() => {
            if (!fitSettingsPanel()) return
            if (frame === null || frame.hasAttribute('data-sidebar-collapsed')) return
            const layout = layoutService()
            if (layout !== undefined) layout.toggleSidebar()
          })
          settingsObserver.observe(document.body, { childList: true })
        }
        if (fitSettingsPanel() && !frame.hasAttribute('data-sidebar-collapsed')) {
          const layout = layoutService()
          if (layout !== undefined) layout.toggleSidebar()
        }
        syncState()
        updateViewport()
        if (typeof window.addEventListener === 'function') window.addEventListener('resize', updateViewport)
        window.visualViewport?.addEventListener?.('resize', updateViewport)
        window.visualViewport?.addEventListener?.('scroll', updateViewport)
        if (typeof ctx.locale?.subscribe === 'function') unsubscribeLocale = ctx.locale.subscribe(syncLabels)
        return true
      }

      const cleanup = () => {
        if (mountObserver !== null) { mountObserver.disconnect(); mountObserver = null }
        if (drawerObserver !== null) { drawerObserver.disconnect(); drawerObserver = null }
        if (settingsObserver !== null) { settingsObserver.disconnect(); settingsObserver = null }
        if (settingsModal !== null) {
          for (const property of ['width', 'max-width', 'min-width', 'height', 'max-height', 'min-height', 'flex', 'margin']) settingsModal.style.removeProperty(property)
          settingsModal = null
        }
        if (unsubscribeLocale !== null) { unsubscribeLocale(); unsubscribeLocale = null }
        if (typeof document.removeEventListener === 'function') {
          document.removeEventListener('keydown', onKeyDown)
          document.removeEventListener('focusin', onFocusIn)
        }
        if (typeof window.removeEventListener === 'function') window.removeEventListener('resize', updateViewport)
        window.visualViewport?.removeEventListener?.('resize', updateViewport)
        window.visualViewport?.removeEventListener?.('scroll', updateViewport)
        if (menu !== null) menu.removeEventListener('click', onMenuClick)
        if (scrim !== null) scrim.removeEventListener('click', onScrimClick)
        if (sidebar !== null) sidebar.removeEventListener('click', onSidebarClick)
        if (layer !== null) layer.remove()
        if (style !== null) style.remove()
        if (frame !== null) {
          frame.removeAttribute('data-d4p-frame')
          if (sidebar !== null) {
            sidebar.removeAttribute('data-d4p-sidebar')
            if (sidebar.id === 'd4p-mobile-drawer') sidebar.removeAttribute('id')
          }
          if (center !== null) center.removeAttribute('data-d4p-center')
          if (rightbar !== null) rightbar.removeAttribute('data-d4p-rightbar')
          if (composer !== null) composer.removeAttribute('data-d4p-composer')
        }
        if (installed) {
          delete root.dataset.d4pMobile
          delete root.dataset.d4pDrawer
          delete root.dataset.d4pRightbar
          root.style.removeProperty('--d4p-vv-height')
          if (meta !== null && previousMeta !== null) meta.setAttribute('content', previousMeta)
        }
        frame = null
        sidebar = null
        settingsModal = null
        center = null
        rightbar = null
        composer = null
        menu = null
        scrim = null
        layer = null
        style = null
        meta = null
        installed = false
      }

      const tryDecorate = () => {
        try {
          return decorate()
        } catch (error) {
          cleanup()
          throw error
        }
      }

      if (!tryDecorate() && typeof MutationObserver === 'function') {
        mountObserver = new MutationObserver(() => {
          try {
            if (!tryDecorate()) return
            if (mountObserver !== null) { mountObserver.disconnect(); mountObserver = null }
          } catch (error) {
            console.error('[dsh4phone] mobile layout mount failed', error)
            if (mountObserver !== null) { mountObserver.disconnect(); mountObserver = null }
          }
        })
        mountObserver.observe(root, { childList: true, subtree: true })
      }
      return cleanup
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
          const [qr, setQr] = useState(null)
          const [qrError, setQrError] = useState(null)
          const [qrBusy, setQrBusy] = useState(false)
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
            if (isOpen) return
            setQr(null)
            setQrError(null)
          }, [isOpen])

          useEffect(() => {
            if (qr === null || status === null) return
            const urls = Array.isArray(status.urls) ? status.urls : []
            if (!urls.some((entry) => entry.url === qr.url)) setQr(null)
          }, [status, qr])

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

          const toggleQr = useCallback(async (url) => {
            if (qr?.url === url) {
              setQr(null)
              return
            }
            setQrBusy(true)
            setQrError(null)
            try {
              const data = await request(`/qr?text=${encodeURIComponent(url)}`)
              if (data?.qr && Number.isInteger(data.qr.size) && Array.isArray(data.qr.modules)) {
                setQr({ url, size: data.qr.size, modules: data.qr.modules })
              } else {
                setQrError(t('error.qr_failed'))
              }
            } catch (error) {
              setQrError(errorText(t, error?.code))
            } finally {
              setQrBusy(false)
            }
          }, [qr, t])

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
          const devices = status !== null && Array.isArray(status.devices) ? status.devices : []

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
                  h('div', { className: 'd4p-url-actions' },
                    h('button', {
                      type: 'button',
                      onClick: () => { void copy(entry.url) },
                    }, copied === entry.url ? t('address.copied') : t('address.copy')),
                    h('button', {
                      type: 'button',
                      className: `d4p-qr-btn${qr?.url === entry.url ? ' is-active' : ''}`,
                      'aria-label': qr?.url === entry.url ? t('qr.hide') : t('qr.show'),
                      'aria-expanded': qr?.url === entry.url,
                      title: qr?.url === entry.url ? t('qr.hide') : t('qr.show'),
                      disabled: qrBusy,
                      onClick: () => { void toggleQr(entry.url) },
                    }, QR_ICON)))))
                : h('p', { className: 'd4p-muted' }, running ? t('address.empty') : hasPassword ? t('address.none') : t('status.noPassword')),

              qr !== null
                ? h('div', { className: 'd4p-qr' },
                  h('div', { className: 'd4p-qr-code' },
                    h('svg', {
                      viewBox: `${-4} ${-4} ${qr.size + 8} ${qr.size + 8}`,
                      width: 152,
                      height: 152,
                      role: 'img',
                      'aria-label': `${t('qr.alt')} ${qr.url}`,
                      shapeRendering: 'crispEdges',
                    },
                    h('rect', { x: -4, y: -4, width: qr.size + 8, height: qr.size + 8, fill: '#fff' }),
                    h('path', { d: qrPath(qr), fill: '#000' }))),
                  h('div', { className: 'd4p-qr-info' },
                    h('p', { className: 'd4p-qr-title' }, t('qr.title')),
                    h('code', null, qr.url),
                    h('p', { className: 'd4p-muted' }, t('qr.hint')),
                    h('button', {
                      type: 'button',
                      className: 'd4p-secondary',
                      onClick: () => { void copy(qr.url) },
                    }, copied === qr.url ? t('address.copied') : t('address.copy'))))
                : null,

              qrError !== null
                ? h('p', { className: 'd4p-feedback is-error', role: 'alert' }, qrError)
                : null,

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
              devices.length === 0
                ? h('p', { className: 'd4p-muted' }, t('devices.empty'))
                : h('div', { className: 'd4p-devices' }, devices.map((device) => h('div', { className: 'd4p-device', key: device.id },
                  DEVICE_ICON,
                  h('div', { className: 'd4p-device-main' },
                    h('span', { className: 'd4p-device-name' }, device.name),
                    h('span', {
                      className: 'd4p-device-time',
                      title: Number.isFinite(Date.parse(device.lastSeenAt)) ? new Date(device.lastSeenAt).toLocaleString() : undefined,
                    }, t('devices.lastSeen', { time: lastSeenLabel(t, device.lastSeenAt) })))))),
              h('p', { className: 'd4p-muted' }, t('signout.hint')),
              h('div', { className: 'd4p-actions' },
                h('button', {
                  type: 'button',
                  className: 'd4p-secondary d4p-danger',
                  disabled: busy || status === null,
                  onClick: signOutAll,
                }, t('signout.button'))))),

          h('p', { className: 'd4p-foot' }, t('security.note'))))
        }

        // Dictionaries exist before either surface: the phone menu and the
        // desktop panel both translate through this namespace.
        ctx.effect(() => {
          try {
            return ctx.locale.register('dsh4phone', { en: EN, zh: ZH })
          } catch {
            return () => {}
          }
        }, 'dsh4phone dictionaries')
        if (isPhoneGatewaySurface()) {
          ctx.effect(() => installMobileLayout(ctx), 'dsh4phone mobile layout')
          return
        }
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
