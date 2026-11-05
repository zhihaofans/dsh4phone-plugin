# 发布到 npm

面向维护者。发布是用户的决定：改版本号、切版本段、打 tag、`npm publish` 之前都要先征得用户同意；agent 不要自行执行这些操作。

## 当前状态

- `package.json` 已是 `0.0.3`，仍是 `private: true`；npm 上还没有 `dsh4phone`（`npm view dsh4phone` 返回 404）。
- 已推送 `0.0.2` 附注 tag，指向 `3881baa`；**不要移动或覆盖**。
- `0.0.3` 尚未打 tag、尚未发布；发布前按下面的检查清单补齐 `private`、`repository` 等字段。

## 版本规则

- 遵循[语义化版本 2.0.0](https://semver.org/lang/zh-CN/)：不兼容的公共 API 改动升 major，向后兼容的新功能升 minor，向后兼容的修复升 patch；进位时低位归零。
- 当前处于 `0.y.z` 初始开发阶段，公开 API 仍可能变；这不等于版本号可以随便跳，升级理由要对得上实际改动，且照样先问用户。
- 版本号要同步：`package.json`、`README.md`、`CHANGELOG.md` 的版本段、git tag。
- 功能合并后先留在 `[Unreleased]`，发版时再单独一次提交做版本变更。

## 发布前检查

- [ ] 用户已同意发布，并确认版本号
- [ ] `CHANGELOG.md` 已把 `[Unreleased]` 切到 `## [x.y.z] - YYYY-MM-DD`，没有空分类
- [ ] `package.json` 版本与 tag、README 一致
- [ ] `files` 含 `index.js`、`client.js`、`qr.js`、`cordis.patch.yml`、`locale/*.json`、`icon.svg`、README/CHANGELOG/LICENSE/THIRD_PARTY_NOTICES
- [ ] `exports` 含 `.`、`./client`、`./locale/*.json`、`./icon`
- [ ] `engines.dsh`、`dsh.bundle.patch`、`dsh.client` 仍在
- [ ] 补 `repository` / `homepage` / `bugs` / `keywords`（当前都没有）
- [ ] 去掉 `"private": true`
- [ ] `npm test` 通过
- [ ] `npm pack --dry-run` 核对文件数与体积；`test/`、`AGENTS.md`、`docs/` 不应进包

## 发布步骤

```bash
npm login          # 用户自己的账号；需要 2FA
npm pack --dry-run
npm publish        # scoped 包用 npm publish --access public
npm view dsh4phone version
```

## 发布后

- 在真实 DSH 里装一次：`dsh plugin --profile web add dsh4phone@x.y.z`，启用 bundle，验证桌面入口、手机登录、二维码。
- Desktop 用插件管理器 / 插件市场按包名安装，不要手改 profile。
- npm 可解析 ≠ 市场里能搜到：还需要 `dsh-plugin-catalog` 的索引条目（见 TODO）。
- 发布出错先停下来问用户；npm 的 unpublish 有时限与依赖限制，不要自行删包、改 tag 或重发。
