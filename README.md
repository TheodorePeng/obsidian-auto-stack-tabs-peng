# Auto Stack Tabs Peng

Auto Stack Tabs Peng is a desktop-only Obsidian plugin that stacks the editor tab groups that exist when a Vault window or a new pop-out window initializes.

It does not enforce stacking afterward. Switching a group back to ordinary tabs remains entirely under your control.

## What it does

- Stacks existing editor tab groups once when a Vault window or a new pop-out window initializes.
- Leaves later layout choices to you: it never forces tabs back into a stacked state.
- Adds three commands: **Enable Auto Stack**, **Disable Auto Stack**, and **Stack Current Window Now**.
- Auto Stack is enabled by default.
- Enabling the plugin in an already initialized Vault, or reloading it during a session, does not restack existing windows.

## Install with BRAT

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Obsidian Community Plugins.
2. Enable BRAT.
3. In BRAT, choose the option to add a beta plugin.
4. Paste this repository URL:

   `https://github.com/TheodorePeng/obsidian-auto-stack-tabs-peng`

5. Confirm the install, then enable **Auto Stack Tabs Peng** in Obsidian.

BRAT installs the Obsidian plugin files from GitHub Releases: `main.js` and `manifest.json`.

## Commands

- **Enable Auto Stack** — turns on auto stacking for future window initialization.
- **Disable Auto Stack** — turns it off.
- **Stack Current Window Now** — immediately stacks existing editor tab groups in the focused window without changing the persistent setting.

## Settings

- **Auto Stack Enabled** (default on) — stack existing editor tab groups once when the Vault or a new window initializes.

## Notes

Obsidian does not expose a public API for setting a tab group's stacked state. This plugin uses the runtime `isStacked` and `setStacked(true)` members after checking that they exist. If a future Obsidian version removes them, the plugin reports the problem and skips the change. The Advanced URI plugin is not required.

## Development

```sh
npm install
npm run typecheck
npm test
npm run build
```

Install `manifest.json` and the generated `main.js` in `<vault>/.obsidian/plugins/auto-stack-tabs-peng/`, then enable the plugin in Obsidian. There is no `styles.css`.

Release assets for BRAT are generated in the repository root:

- `main.js`
- `manifest.json`

`data.json` is local Obsidian plugin state and must not be committed.

---

# Auto Stack Tabs Peng 中文说明

Auto Stack Tabs Peng 是一个 Obsidian 桌面端插件：当 Vault 窗口或新的弹出窗口初始化时，把已有的编辑器标签组堆叠一次。

它不会在此之后强制堆叠。把某个标签组切回普通标签，始终由你掌控。

## 主要功能

- 在 Vault 窗口或新的弹出窗口初始化时，把已有的编辑器标签组堆叠一次。
- 之后的布局完全由你决定：绝不会把标签强制切回堆叠状态。
- 提供三个命令：**Enable Auto Stack**、**Disable Auto Stack**、**Stack Current Window Now**。
- Auto Stack 默认开启。
- 在已经初始化的 Vault 中启用插件，或在会话中途重新加载，都不会重新堆叠已有窗口。

## 通过 BRAT 安装

1. 在 Obsidian 社区插件中安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat)。
2. 启用 BRAT。
3. 在 BRAT 中选择添加 beta 插件。
4. 粘贴本仓库地址：

   `https://github.com/TheodorePeng/obsidian-auto-stack-tabs-peng`

5. 确认安装，然后在 Obsidian 中启用 **Auto Stack Tabs Peng**。

BRAT 会从 GitHub Releases 下载 Obsidian 插件文件：`main.js` 和 `manifest.json`。

## 命令

- **Enable Auto Stack** — 为未来的窗口初始化开启自动堆叠。
- **Disable Auto Stack** — 关闭自动堆叠。
- **Stack Current Window Now** — 立即堆叠当前聚焦窗口中已有的编辑器标签组，但不改变持久化设置。

## 设置

- **Auto Stack Enabled**（默认开启）— 在 Vault 或新窗口初始化时，把已有的编辑器标签组堆叠一次。

## 说明

Obsidian 没有公开用于设置标签组堆叠状态的 API。本插件在确认运行时存在 `isStacked` 和 `setStacked(true)` 成员后才使用它们。如果未来的 Obsidian 版本移除了这些成员，插件会报告问题并跳过本次修改。无需安装 Advanced URI 插件。

## 开发

```sh
npm install
npm run typecheck
npm test
npm run build
```

把 `manifest.json` 和生成的 `main.js` 安装到 `<vault>/.obsidian/plugins/auto-stack-tabs-peng/`，然后在 Obsidian 中启用插件。本插件没有 `styles.css`。

用于 BRAT 的发布文件位于仓库根目录：

- `main.js`
- `manifest.json`

`data.json` 是 Obsidian 本地插件状态，不应提交到 Git。
