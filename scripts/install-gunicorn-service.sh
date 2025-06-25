#!/bin/bash

# Pagemaker Gunicorn 服务安装脚本
# 用于手动安装和配置 systemd 服务

set -e
set -u

# 配置变量 - 自动检测项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SERVICE_NAME="pagemaker-gunicorn"
SERVICE_TEMPLATE="$PROJECT_ROOT/scripts/${SERVICE_NAME}.service.template"
SERVICE_FILE="$PROJECT_ROOT/scripts/${SERVICE_NAME}.service"
SYSTEMD_SERVICE="/etc/systemd/system/${SERVICE_NAME}.service"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查权限
check_permissions() {
    if [ "$EUID" -ne 0 ]; then
        log_error "此脚本需要root权限运行"
        log_error "请使用: sudo $0"
        exit 1
    fi
}

# 检查文件
check_files() {
    log_info "检查必要文件..."
    
    if [ ! -f "$SERVICE_TEMPLATE" ]; then
        log_error "服务模板文件不存在: $SERVICE_TEMPLATE"
        exit 1
    fi
    
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        log_error "环境配置文件不存在: $PROJECT_ROOT/.env"
        log_error "请先创建 .env 文件"
        exit 1
    fi
    
    if [ ! -f "$PROJECT_ROOT/apps/backend/venv/bin/gunicorn" ]; then
        log_error "Gunicorn可执行文件不存在"
        log_error "请先运行部署脚本安装依赖"
        exit 1
    fi
    
    log_info "✅ 文件检查通过"
}

# 读取配置
read_config() {
    log_info "读取配置..."
    
    # 读取端口配置
    BACKEND_PORT=$(grep "^BACKEND_PORT=" "$PROJECT_ROOT/.env" 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "8456")
    
    # 检测当前用户和组
    CURRENT_USER=$(whoami)
    CURRENT_GROUP=$(id -gn)
    
    log_info "项目路径: $PROJECT_ROOT"
    log_info "后端端口: $BACKEND_PORT"
    log_info "运行用户: $CURRENT_USER"
    log_info "运行用户组: $CURRENT_GROUP"
}

# 生成服务文件
generate_service_file() {
    log_info "从模板生成服务文件..."
    
    # 使用sed替换模板中的占位符
    sed -e "s|{{PROJECT_ROOT}}|$PROJECT_ROOT|g" \
        -e "s|{{USER}}|$CURRENT_USER|g" \
        -e "s|{{GROUP}}|$CURRENT_GROUP|g" \
        "$SERVICE_TEMPLATE" > "$SERVICE_FILE"
    
    log_info "✅ 服务文件已生成: $SERVICE_FILE"
}

# 安装服务
install_service() {
    log_info "安装Gunicorn服务..."
    
    # 停止现有服务（如果存在）
    if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        log_info "停止现有服务..."
        systemctl stop "$SERVICE_NAME"
    fi
    
    # 复制生成的服务文件
    cp "$SERVICE_FILE" "$SYSTEMD_SERVICE"
    
    # 设置正确的权限
    chmod 644 "$SYSTEMD_SERVICE"
    
    log_info "✅ 服务文件已安装"
}

# 配置服务
configure_service() {
    log_info "配置systemd服务..."
    
    # 重载systemd配置
    systemctl daemon-reload
    
    # 启用服务
    systemctl enable "$SERVICE_NAME"
    
    log_info "✅ 服务已启用"
}

# 启动服务
start_service() {
    log_info "启动Gunicorn服务..."
    
    # 启动服务
    systemctl start "$SERVICE_NAME"
    
    # 等待服务启动
    sleep 3
    
    # 检查服务状态
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        log_info "✅ 服务启动成功"
    else
        log_error "❌ 服务启动失败"
        log_error "查看服务状态:"
        systemctl status "$SERVICE_NAME" --no-pager || true
        exit 1
    fi
}

# 验证服务
verify_service() {
    log_info "验证服务..."
    
    # 检查端口监听
    if netstat -tlnp | grep ":${BACKEND_PORT}" > /dev/null; then
        log_info "✅ 端口 $BACKEND_PORT 正在监听"
    else
        log_warn "⚠️ 端口 $BACKEND_PORT 未监听"
    fi
    
    # 健康检查
    local health_url="http://localhost:${BACKEND_PORT}/api/v1/health/"
    log_info "测试健康检查: $health_url"
    
    if curl -f -s "$health_url" > /dev/null; then
        log_info "✅ 健康检查通过"
    else
        log_warn "⚠️ 健康检查失败，可能需要配置数据库"
    fi
}

# 显示状态
show_status() {
    log_info "服务状态:"
    systemctl status "$SERVICE_NAME" --no-pager || true
    
    echo ""
    log_info "有用的命令:"
    echo "  查看状态: systemctl status $SERVICE_NAME"
    echo "  查看日志: journalctl -u $SERVICE_NAME -f"
    echo "  重启服务: systemctl restart $SERVICE_NAME"
    echo "  停止服务: systemctl stop $SERVICE_NAME"
    echo "  禁用服务: systemctl disable $SERVICE_NAME"
}

# 主函数
main() {
    log_info "开始安装 Pagemaker Gunicorn 服务..."
    
    check_permissions
    check_files
    read_config
    generate_service_file
    install_service
    configure_service
    start_service
    verify_service
    show_status
    
    log_info "🎉 Gunicorn 服务安装完成！"
}

# 显示帮助
show_help() {
    echo "Pagemaker Gunicorn 服务安装脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  install        安装服务 (默认)"
    echo "  status         显示服务状态"
    echo "  uninstall      卸载服务"
    echo ""
}

# 卸载服务
uninstall_service() {
    log_info "卸载 Gunicorn 服务..."
    
    # 停止服务
    if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        systemctl stop "$SERVICE_NAME"
    fi
    
    # 禁用服务
    if systemctl is-enabled --quiet "$SERVICE_NAME" 2>/dev/null; then
        systemctl disable "$SERVICE_NAME"
    fi
    
    # 删除服务文件
    if [ -f "$SYSTEMD_SERVICE" ]; then
        rm -f "$SYSTEMD_SERVICE"
    fi
    
    # 重载systemd配置
    systemctl daemon-reload
    
    log_info "✅ 服务已卸载"
}

# 处理命令行参数
case "${1:-install}" in
    -h|--help)
        show_help
        ;;
    install)
        main
        ;;
    status)
        check_permissions
        show_status
        ;;
    uninstall)
        check_permissions
        uninstall_service
        ;;
    *)
        log_error "未知选项: $1"
        show_help
        exit 1
        ;;
esac 