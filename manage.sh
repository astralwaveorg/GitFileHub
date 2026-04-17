#!/usr/bin/env bash
# =============================================================================
#  GitFileDock 停止 / 卸载脚本
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }

ACTION="${1:-stop}"
INSTALL_DIR="${INSTALL_DIR:-/opt/gitfiledock}"

case "$ACTION" in
  stop)
    info "停止 GitFileDock 服务..."
    pm2 stop gitfiledock 2>/dev/null && info "服务已停止" || warn "服务未在运行"
    ;;
  restart)
    info "重启 GitFileDock 服务..."
    cd "${INSTALL_DIR}"
    pm2 restart gitfiledock && info "服务已重启" || warn "服务未在运行"
    ;;
  logs)
    pm2 logs gitfiledock --lines 100
    ;;
  status)
    pm2 status
    ;;
  uninstall)
    warn "这将停止服务并删除所有数据，操作不可逆！"
    read -p "确定要卸载吗？(输入 yes 确认): " confirm
    if [ "$confirm" != "yes" ]; then
      echo "已取消"
      exit 0
    fi
    pm2 delete gitfiledock 2>/dev/null || true
    pm2 save
    rm -rf "${INSTALL_DIR}"
    info "GitFileDock 已卸载"
    ;;
  *)
    echo "用法: $0 {stop|restart|logs|status|uninstall}"
    echo ""
    echo "  stop      停止服务"
    echo "  restart   重启服务"
    echo "  logs      查看日志"
    echo "  status    查看状态"
    echo "  uninstall 卸载（删除所有数据）"
    ;;
esac
