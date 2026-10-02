#!/bin/bash

# 本地短视频播放器 - 运行脚本
# 支持 macOS/Linux

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  本地短视频播放器 - 启动脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到 Node.js${NC}"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js 版本: $NODE_VERSION${NC}"

# 检查 Rust/Cargo
if ! command -v cargo &> /dev/null; then
    echo -e "${YELLOW}警告: 未找到 Rust/Cargo${NC}"
    echo "正在尝试安装 Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

CARGO_VERSION=$(cargo --version)
echo -e "${GREEN}✓ Rust 版本: $CARGO_VERSION${NC}"

# 检查 video 目录
if [ ! -d "video" ]; then
    echo -e "${YELLOW}警告: 未找到 video 目录${NC}"
    mkdir -p video
    echo -e "${GREEN}✓ 已创建 video 目录${NC}"
    echo -e "${YELLOW}  请将视频文件放入 video 目录后重新运行${NC}"
    exit 0
fi

VIDEO_COUNT=$(find video -type f \( -name "*.mp4" -o -name "*.mov" -o -name "*.avi" -o -name "*.mkv" -o -name "*.webm" \) | wc -l)
echo -e "${GREEN}✓ 找到 $VIDEO_COUNT 个视频文件${NC}"

if [ "$VIDEO_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}警告: video 目录中没有视频文件${NC}"
    echo -e "${YELLOW}  支持的格式: mp4, mov, avi, mkv, webm${NC}"
    echo -e "${YELLOW}  请将视频文件放入 video 目录后重新运行${NC}"
    exit 0
fi

# 安装依赖
echo ""
echo -e "${YELLOW}正在安装依赖...${NC}"
npm install

# 启动开发服务器
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  正在启动短视频播放器...${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}操作说明:${NC}"
echo "  • 向上滑动/滚轮向下: 下一个视频"
echo "  • 向下滑动/滚轮向上: 上一个视频"
echo "  • 点击视频: 播放/暂停"
echo "  • 右侧按钮: 切换倍速"
echo ""

source "$HOME/.cargo/env"
npx tauri dev