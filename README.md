# dsh4phone

在同一个局域网里，用手机浏览器打开这台电脑上的 DeepSeek Harness。密码由你自己设置，**不会每次随机生成**。

- 插件版本：`0.0.1`
- 作者：zhihaofans
- 目标：DeepSeek Harness Desktop `0.2.1-rc.2`（macOS）
- 参考：<https://github.com/saya-ch/dsh-mobile>（本插件只做局域网 + 自定义密码这一条最短路径）

## 能做什么

- 在 DeepSeek Harness 左下角加入「手机访问」入口。
- 在电脑上设置一个自定义密码，开启局域网访问后，用手机打开面板里显示的地址。
- 手机登录一次后 30 天内免登录；修改密码或点「让所有手机退出」会立刻让旧会话失效。
- 手机端和电脑端是同一份 DSH 页面、会话、工作区与工具；插件只做反向代理，不复制数据。
- 只监听私有局域网地址，不做公网穿透，也不会把手机流量转发到管理接口。

## 安装

### 通过插件管理器（本仓库开发模式）

在 DeepSeek Harness 里让插件管理器安装本目录（绝对路径），安装完成后重启或让 HMR 生效：

```text
plugin_manager install_bundle  target=/absolute/path/to/dsh4phone-plugin
```

### 通过 CLI（Web profile）

```bash
dsh plugin --profile web add /absolute/path/to/dsh4phone-plugin
dsh --profile web
```

> Desktop 的 profile 由应用管理，请在应用的插件页面安装或使用插件管理器；不要手动改 profile 的 `package.json` / `cordis.patch.yml`。

## 使用

1. 打开 DeepSeek Harness 左下角的「手机访问」。
2. 输入两次密码，点「设置密码并开启」。网关会自动在 `0.0.0.0:3721` 启动（端口可改）。
3. 让手机和电脑连接同一个 Wi-Fi / 热点。
4. 在面板里复制一个 `http://192.168.x.x:3721` 地址，用手机浏览器打开。
5. 输入刚才设置的密码即可进入。

切换 Wi-Fi 或 IP 变化后，面板里的地址会自动更新；已登录的手机如果换了地址，需要在新地址重新登录。

macOS 首次监听端口时可能弹出「是否允许接受传入网络连接」，选择允许。

「手机访问」面板只出现在电脑本机的回环页面（`127.0.0.1` / `localhost`）。手机通过局域网地址打开时不会看到这个管理面板，也无法调用管理接口。

## 安全边界

- **只接受私有网段来源**：`127.0.0.0/8`、`10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/16`、`169.254.0.0/16`、`100.64.0.0/10`、`fc00::/7`、`fe80::/10`。公网来源直接 403。
- **局域网内是明文 HTTP**：同一网段的设备理论上可以嗅探流量。只在可信 Wi-Fi/热点开启，不要在路由器上做端口转发，也不要把它当作公网远程方案。
- **密码存储**：内存中只有 scrypt 派生结果；磁盘上是随机盐 + scrypt 哈希，文件 `0600`，目录 `0700`。
- **会话**：HttpOnly + SameSite=Lax 的签名 Cookie，30 天有效；密码修改后指纹变化，旧 Cookie 自动失效。登录失败 5 次锁定该 IP 10 分钟。
- **管理接口**：`/dsh4phone/api/*` 只存在于 DSH 的 loopback Web 服务上，不经过局域网网关；并且要求请求来自回环地址、Host 为回环、带私有 `x-dsh4phone` 请求头、Origin 与 Host 同源。手机和网页跨站请求都无法调用。
- **公开静态文件**：只有 `manifest.webmanifest` 和 favicon 允许匿名访问，避免浏览器安装检查被登录页拦截；它们不包含会话或用户数据。

## 数据与卸载

运行数据保存在：

```text
$DSH_HOME/dsh4phone/state.json
```

包含端口、开关、密码盐/哈希、会话签名密钥。删除该目录即可完全重置（密码和登录状态一起清空）。卸载插件不会删除该目录。

## 已知限制（v0.0.1）

- 手机打开的是 DSH 的桌面网页，暂未提供专门的触屏布局；窄屏下部分区域可能偏挤。
- 没有 HTTPS 证书、二维码、mDNS 自动发现；请手动输入/复制地址。
- 管理面板只在电脑本机可见；手机端只有「输入密码进入 DSH」这一件事，不能远程改密码或开关网关。
- 上游使用 DSH 自己的 loopback 登录 token；DSH 重启后插件会自动重新换取会话，无需重新设置密码。
- 仅验证了 macOS Desktop；其他平台/版本未验证。

## 工作原理

```text
手机浏览器 ──HTTP/WebSocket──▶ 局域网网关 (0.0.0.0:3721)
                                   │  校验 dsh4phone 会话 Cookie
                                   ▼
                         反向代理（改写 Host/Origin，注入 DSH 本机会话）
                                   ▼
                       DSH Web (127.0.0.1:<DSH 端口>) 同一份会话与工具
```

- `index.js`：Host 半，网关、登录页、密码、会话、管理 API、DSH 上游会话换取。
- `client.js`：Client 半，侧栏按钮 + `shell.overlay` 面板（仅回环页面注册）。
- `cordis.patch.yml`：插入 `dsh4phone` 插件行。
- 无第三方运行时依赖。

## 开发与测试

```bash
npm run check   # 语法检查
npm test        # 隔离 Host 网关测试 + 客户端回环门禁测试
```

`test/host.test.mjs` 使用假 DSH 上游、假 Cordis ctx 和临时 `DSH_HOME`，不会读写正在运行的 profile 或真实密码；覆盖登录、Cookie、代理头改写、重定向、WebSocket、管理接口隔离和公开静态文件。`test/client.test.mjs` 验证手机来源不注册桌面面板、回环来源才注册。

修改 Host 半（`index.js`）后需要重启 DeepSeek Harness 才会加载新的模块；Client 半（`client.js`）在页面刷新/重启后加载。修改后请重新打开应用再验证手机访问。

## License

MIT © 2026 zhihaofans
