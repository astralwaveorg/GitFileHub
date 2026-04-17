#!/usr/bin/env bash
# =============================================================================
#  GitFileDock 一键部署脚本
#  适用于 Ubuntu / Debian / CentOS / Rocky Linux
#
#  功能：
#    1. 检测并安装 Node.js 20（如未安装）
#    2. 安装 PM2（全局进程管理器）
#    3. 安装项目依赖
#    4. 初始化数据库（Prisma）
#    5. 创建默认管理员 admin/admin123
#    6. 构建 Next.js 生产版本
#    7. 启动服务（PM2 后台运行）
#    8. 配置开机自启
#
#  用法：
#    chmod +x deploy.sh
#    ./deploy.sh
#
#  或者从远程仓库直接部署到 /opt/gitfiledock：
#    curl -fsSL https://raw.githubusercontent.com/astralwaveorg/GitFileHub/main/deploy.sh | bash
# =============================================================================

set -e

# ─── 配置 ───────────────────────────────────────────────────────────────────────
INSTALL_DIR="${INSTALL_DIR:-/opt/gitfiledock}"
REPO_URL="${REPO_URL:-https://github.com/astralwaveorg/GitFileHub.git}"
BRANCH="${BRANCH:-main}"
NODE_VERSION="20"
PORT="${PORT:-3000}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ─── 前置检查 ───────────────────────────────────────────────────────────────────
info "GitFileDock 一键部署脚本"
echo "  安装目录: ${INSTALL_DIR}"
echo "  仓库地址: ${REPO_URL}"
echo "  分支: ${BRANCH}"
echo ""

# 检查是否为 root 用户
if [ "$(id -u)" -ne 0 ]; then
  warn "建议使用 root 用户运行此脚本"
  warn "部分操作（如安装 Node.js、配置开机自启）需要 root 权限"
  echo ""
fi

# ─── 1. 安装 Node.js ────────────────────────────────────────────────────────────
install_nodejs() {
  if command -v node &>/dev/null; then
    local current_version
    current_version=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$current_version" -ge "$NODE_VERSION" ] 2>/dev/null; then
      success "Node.js 已安装: $(node -v)"
      return
    else
      warn "Node.js 版本过低: $(node -v)，需要 v${NODE_VERSION}+"
    fi
  fi

  info "正在安装 Node.js ${NODE_VERSION}..."

  if command -v dnf &>/dev/null || command -v yum &>/dev/null; then
    # RHEL / CentOS / Rocky / Fedora
    if command -v dnf &>/dev/null; then
      dnf install -y curl
    else
      yum install -y curl
    fi
    curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash -
    if command -v dnf &>/dev/null; then
      dnf install -y nodejs
    else
      yum install -y nodejs
    fi
  elif command -v apt-get &>/dev/null; then
    # Debian / Ubuntu
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq curl ca-certificates
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y -qq nodejs
  else
    error "不支持的操作系统，请手动安装 Node.js ${NODE_VERSION}: https://nodejs.org/"
  fi

  success "Node.js 安装完成: $(node -v)"
}

# ─── 2. 安装 PM2 ────────────────────────────────────────────────────────────────
install_pm2() {
  if command -v pm2 &>/dev/null; then
    success "PM2 已安装: $(pm2 -v)"
    return
  fi

  info "正在安装 PM2..."
  npm install -g pm2
  success "PM2 安装完成: $(pm2 -v)"
}

# ─── 3. 安装 Git（如未安装）────────────────────────────────────────────────────
ensure_git() {
  if command -v git &>/dev/null; then
    success "Git 已安装"
    return
  fi

  info "正在安装 Git..."
  if command -v apt-get &>/dev/null; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get install -y -qq git
  elif command -v dnf &>/dev/null; then
    dnf install -y git
  elif command -v yum &>/dev/null; then
    yum install -y git
  fi
  success "Git 安装完成"
}

# ─── 4. 克隆 / 更新代码 ────────────────────────────────────────────────────────
setup_repo() {
  if [ -d "${INSTALL_DIR}/.git" ]; then
    info "项目目录已存在，拉取最新代码..."
    cd "${INSTALL_DIR}"
    git fetch origin "${BRANCH}"
    git reset --hard "origin/${BRANCH}"
    success "代码已更新"
  else
    info "克隆仓库到 ${INSTALL_DIR}..."
    mkdir -p "$(dirname "${INSTALL_DIR}")"
    git clone -b "${BRANCH}" "${REPO_URL}" "${INSTALL_DIR}"
    success "代码克隆完成"
  fi
}

# ─── 5. 安装依赖 ────────────────────────────────────────────────────────────────
install_deps() {
  info "安装项目依赖..."
  cd "${INSTALL_DIR}"
  npm install --production=false
  success "依赖安装完成"
}

# ─── 6. 配置环境变量 ────────────────────────────────────────────────────────────
setup_env() {
  cd "${INSTALL_DIR}"

  if [ -f .env ]; then
    info ".env 已存在，跳过配置"
    return
  fi

  info "生成 .env 配置文件..."

  # 生成随机密钥
  JWT_SECRET=$(openssl rand -hex 32)
  ENCRYPTION_KEY=$(openssl rand -hex 32)

  cat > .env << EOF
# Database
DATABASE_URL="file:./data/gitfiledock.db"

# App
PORT=${PORT}
BASE_URL=http://localhost:${PORT}

# JWT
JWT_SECRET=${JWT_SECRET}

# Encryption (for SSH keys)
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Git
GIT_USER_NAME=GitFileDock
GIT_USER_EMAIL=gitfiledock@local
EOF

  chmod 600 .env
  success ".env 已生成（JWT 和加密密钥为随机值）"
}

# ─── 7. 初始化数据库 ────────────────────────────────────────────────────────────
init_database() {
  cd "${INSTALL_DIR}"

  info "生成 Prisma Client..."
  npx prisma generate

  info "创建/更新数据库表..."
  npx prisma db push --skip-generate

  # 创建默认管理员
  info "检查默认管理员..."
  node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
async function main() {
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { username: 'admin' } });
    if (!existing) {
      const hash = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: { username: 'admin', passwordHash: hash, mustChangePwd: true },
      });
      console.log('[OK] 默认管理员已创建: admin / admin123');
    } else {
      console.log('[OK] 管理员已存在，跳过');
    }
  } finally {
    await prisma.\$disconnect();
  }
}
main().catch(e => { console.error('[ERROR]', e.message); process.exit(1); });
"

  success "数据库初始化完成"
}

# ─── 8. 构建 ────────────────────────────────────────────────────────────────────
build_app() {
  cd "${INSTALL_DIR}"

  info "构建 Next.js 生产版本..."
  npm run build

  success "构建完成"
}

# ─── 9. 启动服务 ────────────────────────────────────────────────────────────────
start_service() {
  cd "${INSTALL_DIR}"

  # 创建日志目录
  mkdir -p logs

  info "启动 GitFileDock 服务..."

  # 停止旧实例（如存在）
  pm2 delete gitfiledock 2>/dev/null || true

  # 启动新实例
  pm2 start ecosystem.config.js

  # 保存 PM2 进程列表
  pm2 save

  success "服务已启动"
}

# ─── 10. 配置开机自启 ────────────────────────────────────────────────────────────
setup_startup() {
  info "配置开机自启..."

  pm2 startup 2>/dev/null || {
    # pm2 startup 可能需要 sudo，尝试自动执行
    local startup_cmd
    startup_cmd=$(pm2 startup 2>&1 | grep "sudo" | head -1) || true
    if [ -n "$startup_cmd" ]; then
      warn "请手动执行以下命令以启用开机自启："
      echo ""
      echo "  $startup_cmd"
      echo "  pm2 save"
      echo ""
    fi
    return
  }

  pm2 save
  success "开机自启已配置"
}

# ─── 完成 ────────────────────────────────────────────────────────────────────────
print_summary() {
  echo ""
  echo -e "${GREEN}======================================================${NC}"
  echo -e "${GREEN}  GitFileDock 部署完成!${NC}"
  echo -e "${GREEN}======================================================${NC}"
  echo ""
  echo "  访问地址: http://localhost:${PORT}"
  echo "  管理员账号: admin"
  echo "  管理员密码: admin123"
  echo "  配置文件: ${INSTALL_DIR}/.env"
  echo "  数据库: ${INSTALL_DIR}/data/gitfiledock.db"
  echo ""
  echo "  常用命令:"
  echo "    pm2 logs gitfiledock    查看日志"
  echo "    pm2 restart gitfiledock 重启服务"
  echo "    pm2 stop gitfiledock    停止服务"
  echo "    pm2 status              查看状态"
  echo ""
  warn "请立即登录并在 设置 → 个人信息 中修改默认密码!"
  echo ""
}

# ─── 主流程 ──────────────────────────────────────────────────────────────────────
main() {
  echo ""
  install_nodejs
  install_pm2
  ensure_git
  setup_repo
  setup_env
  install_deps
  init_database
  build_app
  start_service
  setup_startup
  print_summary
}

main "$@"
