#!/usr/bin/env bash
# =============================================================================
#  GitFileDock 更新脚本
#  拉取最新代码 → 安装依赖 → 更新数据库 → 构建 → 重启
# =============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }

INSTALL_DIR="${INSTALL_DIR:-/opt/gitfiledock}"
BRANCH="${BRANCH:-main}"

cd "${INSTALL_DIR}"

info "拉取最新代码..."
git fetch origin "${BRANCH}"
git reset --hard "origin/${BRANCH}"
success "代码已更新"

info "安装新依赖..."
npm install
success "依赖已更新"

info "更新数据库..."
npx prisma generate
npx prisma db push --skip-generate
success "数据库已更新"

info "重新构建..."
npm run build
success "构建完成"

info "重启服务..."
pm2 restart gitfiledock || pm2 start ecosystem.config.js
pm2 save
success "服务已重启"

echo ""
success "GitFileDock 更新完成!"
