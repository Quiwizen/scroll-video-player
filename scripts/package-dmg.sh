#!/usr/bin/env bash
set -e

# 在 `npm run tauri build` 之后调用，
# 为「本地短视频播放器」生成可分发的标准 macOS dmg（含 player-tauri.app 与 Applications 拖放链接）。
#
# 为什么需要这个脚本：
#   Tauri 2 内置的 create-dmg 1.2.1 在较新的 macOS（26 / Tahoe）上与 hdiutil 不兼容，
#   dmg 打包阶段会卡在挂载点查找而失败。本脚本绕过 create-dmg，
#   直接用 hdiutil 完成「创建可写镜像 → 挂载 → 复制 app + Applications 链接 → 压缩」流程。

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUNDLE="$ROOT/src-tauri/target/release/bundle"
MACOS="$BUNDLE/macos"
DMGDIR="$BUNDLE/dmg"
OUT="$DMGDIR/player-tauri_0.1.0_aarch64.dmg"
TMP="$DMGDIR/rw_manual.dmg"
MNT="/tmp/player_dmg_mnt"

if [ ! -d "$MACOS/player-tauri.app" ]; then
  echo "未找到 $MACOS/player-tauri.app，请先运行: npm run tauri build"
  exit 1
fi

# 清理可能残留的挂载与临时文件
hdiutil detach -force "$MNT" 2>/dev/null || true
hdiutil detach -force /dev/disk4 2>/dev/null || true
rm -f "$TMP" "$OUT"

SIZE_MB=$(du -sm "$MACOS" | cut -f1); SIZE_MB=$((SIZE_MB + 20))

echo "==> 创建可写镜像 (${SIZE_MB}MB)"
hdiutil create -size ${SIZE_MB}m -fs HFS+ -volname "player-tauri" "$TMP"

mkdir -p "$MNT"
echo "==> 挂载"
hdiutil attach -nobrowse -mountpoint "$MNT" "$TMP"

echo "==> 复制 app + Applications 链接"
cp -R "$MACOS/player-tauri.app" "$MNT/"
ln -s /Applications "$MNT/Applications"

echo "==> 卸载并压缩为 dmg"
hdiutil detach "$MNT"
hdiutil convert "$TMP" -format UDZO -o "$OUT"
rm -f "$TMP"

echo "==> 已生成: $OUT"
