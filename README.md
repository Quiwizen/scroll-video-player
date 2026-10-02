# 本地短视频播放器 (player-tauri)

# Local Short-Video Player (player-tauri)

基于 **Tauri v2 + Rust + 原生 HTML/JS/CSS** 构建的本地短视频播放器，支持上下滑动切换视频与倍速播放。无前端框架依赖，体积小、启动快。  
A local short-video player built with **Tauri v2 + Rust + vanilla HTML/JS/CSS**, supporting swipe-up/down video switching and variable playback speed. No frontend framework — small footprint, fast startup.

> 目标平台 / Targets：macOS / Windows / Linux（基于 Tauri v2 跨平台 / cross-platform）。  
> 实测状态 / Tested status：**macOS 已实测编译打包**；Windows / Linux 为 Tauri v2 理论支持，作者尚未实测，可能存在平台相关依赖/权限问题。  
> macOS build is tested by the author. Windows / Linux are theoretically supported by Tauri v2 but untested here — platform-specific dependency/permission issues may exist.

## ✨ 功能特性 / Features

- **滑动切换视频**：支持触摸滑动、鼠标拖拽、滚轮三种方式切换上/下一个视频  
  Swipe to switch: touch swipe, mouse drag, or scroll wheel — all switch to the previous/next video.
- **倍速播放**：0.5x / 1x / 1.5x / 2x 四档速度  
  Playback speed: 0.5x / 1x / 1.5x / 2x.
- **智能随机播放**：采用「不重复随机」算法，完整轮播一遍前不会重复同一视频  
  Smart shuffle: no-repeat random algorithm — every video plays once before any repeats.
- **递归扫描**：自动扫描所选文件夹及其所有子目录中的视频  
  Recursive scan: automatically scans the chosen folder and all its subfolders.
- **自定义视频源**：可任意选择文件夹作为视频源（不再绑定固定 `video` 目录）  
  Custom source: pick any folder as the video source (no longer tied to a fixed `video` dir).
- **记住上次路径**：自动保存上次选择的文件夹，下次启动直接使用  
  Remembers last path: auto-saves the chosen folder for next launch.
- **进度条**：底部实时显示播放进度  
  Progress bar: live playback progress at the bottom.
- **点击播放 / 暂停**：点击视频区域即可切换  
  Click to play/pause: tap the video area to toggle.

## 🛠 技术栈 / Tech Stack

| 层 / Layer     | 技术 / Tech                                        |
| ------------- | ------------------------------------------------ |
| 后端 / Backend  | Rust + Tauri v2                                  |
| 前端 / Frontend | 原生 HTML5 + CSS3 + JavaScript（无框架 / no framework） |
| 播放 / Playback | HTML5 `<video>`                                  |

## 📁 项目结构 / Project Structure

```
player-tauri/
├── src/                  # 前端源代码 / Frontend source
│   ├── index.html        # 主页面 / Main page
│   ├── main.js           # 前端逻辑（播放 / 滑动交互 / 随机算法 / 路径管理）/ Frontend logic
│   └── styles.css        # 样式 / Styles
├── src-tauri/           # Tauri / Rust 后端 / Backend
│   ├── src/lib.rs        # Rust 逻辑（视频扫描、随机播放顺序、路径解析）/ Rust logic
│   ├── build.rs          # 构建脚本（监听前端变更以重新嵌入）/ Build script
│   ├── Cargo.toml        # Rust 依赖 / Rust deps
│   ├── tauri.conf.json   # Tauri 配置 / Tauri config
│   └── capabilities/     # 权限配置（dialog / fs / opener）/ Permissions
├── scripts/
│   └── package-dmg.sh    # macOS 下生成 dmg 的绕过脚本 / macOS dmg helper
├── run.sh               # 一键运行脚本（检查环境 + 启动 dev）/ Run script
├── package.json
└── README.md
```

> 仓库已通过 `.gitignore` 排除：`node_modules/`、`src-tauri/target/`、`dist/`（打包产物）、`video/`（示例视频，自行放置）、`.workbuddy/`（助手数据）。  
> Excluded via `.gitignore`: `node_modules/`, `src-tauri/target/`, `dist/` (build output), `video/` (sample videos, add your own), `.workbuddy/` (assistant data).

## 🚀 快速开始 / Quick Start

### 方式一：运行脚本（推荐）/ Option A: Run script (recommended)

```bash
cd player-tauri
./run.sh          # 自动检查 Node/Rust 环境、安装依赖并启动 / Checks env, installs deps, launches
```

### 方式二：手动运行 / Option B: Manual

**环境要求 / Requirements**

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/tools/install)（含 `cargo` / with `cargo`）

```bash
npm install        # 安装 @tauri-apps/cli 等 / Install deps
npm run tauri dev  # 开发模式（热更新）/ Dev mode (hot reload)
```

## 📦 构建与打包 / Build & Package

基础命令（所有平台通用）/ Base command (all platforms):

```bash
npm run tauri build
```

`tauri.conf.json` 中 `"targets": "all"`，会在各自平台上产出对应的安装包，产物位于 `src-tauri/target/release/bundle/`：  
With `"targets": "all"`, Tauri produces the platform-appropriate installer under `src-tauri/target/release/bundle/`:

| 平台 / Platform | 产物路径 / Artifact | 状态 / Status |
| --- | --- | --- |
| 🍎 macOS | `bundle/macos/player-tauri.app` | ✅ 已实测 / tested |
| 🪟 Windows | `bundle/msi/*.msi` 或 `bundle/nsis/*.exe` | ⚠️ 理论支持，未实测 / theoretical |
| 🐧 Linux | `bundle/deb/*.deb` 或 `bundle/appimage/*.AppImage` | ⚠️ 理论支持，未实测 / theoretical |

> 图标资源已按三平台准备（`icon.icns` / `icon.ico` / PNG），无需额外处理。  
> Icons for all three platforms are already prepared (`icon.icns` / `icon.ico` / PNGs).

### 🍎 macOS（已实测 / tested）

前置依赖 / Prerequisites:
- Xcode Command Line Tools：`xcode-select --install`
- Rust + Node.js（见「快速开始」/ see Quick Start）

```bash
npm run tauri build          # 正常生成 .app
npm run package:dmg          # dmg 步骤失败时，用此脚本生成 .dmg
```

`.app` 会正常生成；在 **macOS 26 (Tahoe)** 上 Tauri 内置 `create-dmg` 会失败（与系统不兼容），`npm run package:dmg` 用 `hdiutil` 直接产出标准 dmg（含「拖到 Applications」链接）：  
The `.app` builds fine. On **macOS 26 (Tahoe)** Tauri's built-in `create-dmg` fails; `npm run package:dmg` uses `hdiutil` instead:

```
src-tauri/target/release/bundle/dmg/player-tauri_0.1.0_aarch64.dmg
```

### 🪟 Windows（理论支持，未实测 / theoretical, untested）

前置依赖 / Prerequisites:
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) —— 安装时勾选「使用 C++ 的桌面开发」（提供 MSVC 工具链）/ select "Desktop development with C++"
- [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) —— Windows 10/11 通常已预装 / usually preinstalled
- Rust + Node.js

```bash
npm run tauri build
```

预期产物：`bundle/msi/*.msi` 或 `bundle/nsis/*.exe`。  
Expected: `bundle/msi/*.msi` or `bundle/nsis/*.exe`.

> ⚠️ 作者尚未在 Windows 上编译过本项目。Tauri v2 原生支持 Windows，但可能出现 WebView2 加载异常、杀软误报、UAC 权限等平台相关问题。如遇问题欢迎提 Issue。  
> ⚠️ The author has not compiled this on Windows. Tauri v2 supports Windows natively, but WebView2 loading errors, AV false-positives, UAC, etc. may arise — please open an Issue if you hit anything.

### 🐧 Linux（理论支持，未实测 / theoretical, untested）

以 Ubuntu / Debian 为例 / Example (Ubuntu/Debian). 前置依赖 / Prerequisites:

```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev pkg-config
```

- Rust + Node.js

```bash
npm run tauri build
```

预期产物：`bundle/deb/*.deb` 或 `bundle/appimage/*.AppImage`。  
Expected: `bundle/deb/*.deb` or `bundle/appimage/*.AppImage`.

> ⚠️ 作者尚未在 Linux 上编译过本项目。可能遇到 webkit2gtk 版本不匹配、AppImage 依赖 `libfuse2`、系统权限等平台相关问题。如遇问题欢迎提 Issue。  
> ⚠️ The author has not compiled this on Linux. webkit2gtk version mismatch, AppImage `libfuse2` dependency, permissions, etc. may arise — please open an Issue.

> 注：`npm run package:dmg` 为 **macOS 专用**，在 Windows / Linux 上无需也请勿运行。  
> Note: `npm run package:dmg` is **macOS-only** — don't run it on Windows/Linux.

## 🎬 使用说明 / Usage

### 选择视频文件夹 / Choose a video folder

首次启动会尝试查找项目下的 `video` 目录；若不存在或你想用别的目录，点击右上角 **⚙️ 设置按钮**（或首屏「选择文件夹」按钮）即可选取任意文件夹。路径会被记住，下次自动加载。  
On first launch it looks for a `video` folder under the project. If absent or you prefer another, click the **⚙️ settings button** (top-right) or the "选择文件夹 / Choose folder" button on the home screen to pick any folder. The path is remembered for next launch.

### 添加视频 / Add videos

将视频放入所选文件夹（支持子目录递归扫描），支持格式：  
Put videos in the chosen folder (subfolders are scanned recursively). Supported formats:

`MP4` · `MOV` · `AVI` · `MKV` · `WebM`

```
你的视频文件夹 / Your folder/
├── video1.mp4
├── 子目录A / SubA/
│   ├── video2.mp4
│   └── video3.mp4
└── 子目录B / SubB/
    └── video4.mp4
```

### 操作方式 / Controls

| 操作 / Action                            | 说明 / Description                            |
| -------------------------------------- | ------------------------------------------- |
| 向上滑动 / 鼠标向上拖拽 / Swipe up / drag up     | 下一个视频 / Next video                          |
| 向下滑动 / 鼠标向下拖拽 / Swipe down / drag down | 上一个视频 / Previous video                      |
| 向下滚动滚轮 / Scroll down                   | 下一个视频（需滚动一定距离触发）/ Next (after threshold)    |
| 向上滚动滚轮 / Scroll up                     | 上一个视频 / Previous                            |
| 点击视频 / Tap video                       | 播放 / 暂停 / Play / Pause                      |
| 右侧按钮 / Side button                     | 切换倍速 (0.5x / 1x / 1.5x / 2x) / Toggle speed |
| 右上角 ⚙️ / ⚙️ top-right                  | 更改视频文件夹 / Change folder                     |

### 智能随机播放 / Smart shuffle

1. 首次随机选一个视频开始；/ Start with one random video.
2. 每次切换从**未播放过**的视频中随机选择；/ Each switch picks from **unplayed** videos.
3. 全部播完才重新生成随机顺序；/ Reshuffle only after all have played.
4. 完整轮播一遍前不会重复同一视频。/ No repeats until a full round completes.

## ❓ 常见问题 / FAQ

**Q: 运行脚本提示权限不足？/ Script permission denied?**

```bash
chmod +x run.sh && ./run.sh
```

**Q: 滚轮切换太灵敏 / 不灵敏？/ Wheel too sensitive?**  
在 `src/main.js` 中调整 / Adjust in `src/main.js`:

```js
const WHEEL_THRESHOLD = 150;  // 累积阈值，越大越不灵敏 / threshold, higher = less sensitive
const WHEEL_COOLDOWN = 500;   // 冷却时间(ms) / cooldown ms
```

**Q: 如何重置保存的视频路径？/ Reset saved path?**  
清除浏览器 `localStorage` 中的 `player_video_path` 项即可。/ Clear the `player_video_path` key in `localStorage`.

**Q: 视频有标题但无画面？/ Video has title but no picture?**  
确认编码受浏览器支持（推荐 H.264 编码的 MP4）。/ Ensure the codec is browser-supported (H.264 MP4 recommended).

## 📄 许可证 / License

MIT
