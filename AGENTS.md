# AGENTS.md

本文件写给在本仓库工作的 coding agent；面向用户的说明见 [README.md](README.md)。

## 项目

`dsh4phone` 是一个 DeepSeek Harness（DSH）Desktop 插件：在同一个局域网里，用手机浏览器打开这台电脑上的 DSH，使用**用户自己设置**的密码，而不是每次随机生成密码。

- 目标版本：DSH Desktop `0.2.1-rc.2`（macOS）
- 当前版本：`0.0.2`；作者：zhihaofans；License：MIT
- 只监听私有局域网，不做公网穿透；局域网内是明文 HTTP
- 手机和电脑共用同一份 DSH 页面、会话、工作区和工具；插件只做反向代理
- 手机端和电脑端是两个 surface：电脑端显示「手机访问」管理面板，手机端只显示登录页/DSH 页面

## 目录与架构

```text
index.js          Host 半：LAN 网关、登录页、密码、会话、管理 API、DSH 上游会话换取
client.js         Client 半：电脑端侧栏按钮/面板；手机端小屏布局层、设置页适配、侧栏自动收起
qr.js             内置 qrcode-generator 1.4.4（MIT，见 THIRD_PARTY_NOTICES.md）
cordis.patch.yml  插入 id=dsh4phone、name=dsh4phone 的插件行
locale/*.json     中英文文案（含 meta.title / meta.description）
icon.svg          插件图标
test/             隔离 Host 测试 + 假 DOM Client 测试
```

数据流：

```text
手机浏览器 ──HTTP/WebSocket──▶ 0.0.0.0:3721 网关
                                  │ 校验 dsh4phone 会话 Cookie
                                  ▼
                        反向代理（改写 Host/Origin，注入 DSH 本机会话）
                                  ▼
                      DSH Web (127.0.0.1:<DSH 端口>) 同一份会话与工具
```

运行数据在 `$DSH_HOME/dsh4phone/state.json`：端口、开关、scrypt 盐/哈希、会话签名密钥、设备列表。**不要提交、打印或删除用户的 state 文件**；删除它等于重置密码和所有手机登录。

## 常用命令

```bash
npm run check   # index.js / client.js 语法检查
npm test        # 隔离 Host 测试 + Client 门禁测试
npm pack --dry-run
```

修改 `index.js` 后需要重启 DSH 或重新启用插件才会加载新的 Host 模块；`client.js` 通常随客户端图/HMR 更新。若热更新后桌面窗口丢失「手机访问」入口，刷新页面（Cmd+R）即可。

## 安装

### 结论：裸包名安装需要 npm

要让用户使用下面这种**裸包名**安装：

```bash
dsh plugin --profile web add dsh4phone
# 或 pnpm add dsh4phone
```

`dsh4phone` 必须能从 npm registry（或当前配置的 registry）解析到。**当前仓库的 `package.json` 是 `private: true`，且 `npm view dsh4phone` 返回 404，所以现在不能这样装。**

但 npm 不是唯一方式：`pnpm add` 也接受本地目录、tarball、git，所以不发布 npm 也能给自己/开发者装，只是安装参数不是裸包名：

```bash
# 本地目录
dsh plugin --profile web add /absolute/path/to/dsh4phone-plugin

# 先打包，再装 tarball
npm pack
dsh plugin --profile web add ./dsh4phone-0.0.2.tgz

# Git
dsh plugin --profile web add github:zhihaofans/dsh4phone-plugin
```

`dsh plugin --profile <name> add <spec>` 只是把参数转发给 profile 目录里的 `pnpm add`。它**只安装依赖，不会自动启用 bundle**：装完后还必须在 DSH 插件管理器里启用 `dsh4phone`，或者由 `plugin_manager install_bundle` 完成 bundle 选择和启用。Desktop 的 profile 由应用管理，不要手改它的 `package.json` / `cordis.patch.yml`。

### Desktop 本机开发安装

在 DSH 里让插件管理器安装本目录（绝对路径），再启用 bundle：

```text
plugin_manager install_bundle  target=/absolute/path/to/dsh4phone-plugin
plugin_manager set_bundle      target=dsh4phone enabled=true
```

`install_bundle` 会完成包安装 + bundle 选择；本地目录是链接方式，修改 `client.js` 后通常刷新/HMR 即可，修改 `index.js` 后重启或重新启用。不要用 `dsh plugin --profile desktop add` 手改 Desktop profile。

### npm 发布后的用户安装

1. 发布包（见下一节）。
2. CLI/Web/TUI profile：

   ```bash
   dsh plugin --profile web add dsh4phone@0.0.2
   ```

   然后在 DSH 插件管理器里启用 `dsh4phone` bundle，再启动/刷新页面。

3. Desktop：在 DSH 的插件管理器/插件市场按包名安装并启用；不要手动改 Desktop profile。

### 包名规则

- `package.json` 的 `name` 就是 npm 包名，也就是 `dsh plugin add` / `pnpm add` 后面的裸名。
- `dsh-xxx`、`@作者/插件名` 是社区命名习惯/示例，不是 pnpm 的硬性规则；市场/目录可能有自己的收录规则。当前 `dsh4phone` 是一个可用的唯一 npm 名（已查 404，未被占用）。
- 如果改名，必须同步修改：`package.json.name`、`cordis.patch.yml` 的 `name`、profile 的 `dsh.profile.bundles`、README 的安装命令。不要只改 README。
- 插件要成为 bundle，`package.json` 必须有 `dsh.bundle.patch`；Client 半还需要 `dsh.client`。当前两项都已具备。

## 发布到 npm

当前状态（2026-10-26）：

- `private: true`，npm 未发布；`npm view dsh4phone` 404
- 本机 `npm whoami` 为 `ENEEDAUTH`，尚未登录
- `npm pack --dry-run` 会打出 12 个文件（约 47.8 kB）；`test/`、`AGENTS.md` 不会进包

发布步骤：

```bash
# 1. 登录（需要用户自己的 npm 账号/2FA）
npm login

# 2. 去掉 "private": true；建议补 repository / homepage / bugs / keywords
#    scoped 包用 npm publish --access public
npm pack --dry-run
npm publish

# 3. 验证
npm view dsh4phone version
dsh plugin --profile web add dsh4phone@0.0.2
```

发布前检查：

- `files` 含 `index.js`、`client.js`、`qr.js`、`cordis.patch.yml`、`locale/*.json`、`icon.svg`、README/CHANGELOG/LICENSE/THIRD_PARTY_NOTICES
- `exports` 含 `.`、`./client`、`./locale/*.json`、`./icon`
- `engines.dsh`、`dsh.bundle.patch`、`dsh.client` 仍在
- 版本号与 CHANGELOG、README、git tag 一致
- 发布后在真实 DSH 里装一次并验证入口/手机访问，而不是只看 `npm publish` 成功

**版本/tag 注意**：`0.0.2` 附注 tag 已推送，指向 `3881baa`。当前 `package.json` 仍是 `private: true`；发布 0.0.2 需要去掉 private（会产生一个新提交，npm tarball 与已推送的 tag 不再完全一致）。推荐下一次发布用一个新的版本/tag（例如 0.0.3）从干净的发布提交发布；不要未经确认移动/覆盖已推送的 tag。

npm 发布不等于进入插件市场：市场/目录（当前 profile 使用 `dsh-plugin-catalog` 索引）还需要收录/索引条目。要“按名字直接安装”只需 npm 可解析；要“在市场里被搜到”还要目录收录。

## 安全约束（不要破坏）

- **只接受私有网段来源**；公网来源 403。不要加公网监听、端口转发或 TLS 终止。
- **管理 API 只在 loopback**：`/dsh4phone/api/*` 只在 DSH 本机 Web 服务上；要求回环 Host/来源、`x-dsh4phone` 请求头、同源 Origin。不要把管理 API 暴露到网关。
- **密码**：scrypt 加盐哈希，state 文件 `0600`、目录 `0700`；不要改成随机密码或明文。
- **会话**：HttpOnly + SameSite=Lax 签名 Cookie，30 天；改密码/「让所有手机退出」必须让旧会话失效；登录失败限流。
- **手机/电脑 surface 区分**：依赖网关端口标记 Cookie，不要改成仅按 host/protocol 判断。
- 测试不要改用户真实密码、不要删除 state、不要新增真实设备记录；Host 测试用临时 `DSH_HOME`，UI 手测用测试设备/会话。

## 手机小屏布局

`client.js` 在网关页面且 `(max-width: 640px), (max-height: 520px)` 时安装移动层：

- 侧栏变成 off-canvas 抽屉；左上菜单按钮打开，遮罩/Esc/收起按钮关闭
- 菜单与会话标题同一行；后台任务状态在「对话/轨迹」标签行右侧
- Composer 全宽，编辑器 16px，`visualViewport`/安全区适配
- 设置弹窗全屏：`Dws9Sa_*` 导航改为横向标签，内容全宽
- 侧栏点击会话、插件/自动化任务/技能中心、新建会话后自动收起；行内操作菜单不收起
- 点设置/打开设置面板时抽屉自动收起
- 桌面端、641–1023 宽和平板保持 DSH 原生布局
- DOM 结构或 layout 服务不存在时 fail-open，不要为移动层破坏桌面

注意：`Dws9Sa_*` 和 `_header`/`_tabs`/`_panelRow` 等是当前 DSH 版本的 CSS Module 类名；升级 DSH 后要重新核对，不要假设永久稳定。改布局后至少检查 390×844、320×568、844×390、1280×900，并验证设置页和抽屉自动收起。

## 测试与验证

```bash
npm test
# 29/29 Host checks, 19/19 Client checks（0.0.2）
```

- `test/host.test.mjs`：假上游、假 Cordis ctx、临时 `DSH_HOME`；覆盖登录、Cookie、代理头、重定向、WebSocket、管理 API 隔离、公开静态文件、二维码。
- `test/client.test.mjs`：网关端口标记的 surface 矩阵、桌面面板注册、移动层安装/清理。
- UI 手测用无头 Chrome（CDP）或真实手机；不要提交截图/临时 token。
- 验证重点：手机登录、桌面入口、二维码、密码修改/退出所有手机、移动端会话/Composer、设置页、抽屉自动收起；Host 改动后必须重启验证。

## Git 与版本

- 分支 `master`，远端 `origin`；作者/提交邮箱 `zhihaofans <zhihaofans@hotmail.com>`
- 提交信息用 `feat:` / `fix:` / `docs:` 等前缀
- 已推送 `0.0.2` tag（指向 `3881baa`）；AGENTS.md/文档提交在其后是正常的
- 不要 force-push、不要移动已推送的 tag，除非用户明确要求

## 已知限制

- 只在 macOS Desktop 验证；其他平台/DSH 版本未验证
- 无 HTTPS、无 mDNS；手机需手动输入/扫码地址
- 管理面板只在电脑端显示；手机端不能远程改密码/开关网关
- 上游使用 DSH 的 loopback 登录 token；DSH 重启后插件自动重新换取
- 右栏/终端/软键盘/刘海安全区仍需真实手机点测
- 设置页/侧栏依赖 DSH 当前 CSS Module 类名，升级需回归
