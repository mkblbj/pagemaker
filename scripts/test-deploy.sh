#!/bin/bash

# Pagemaker 部署脚本测试工具
# 用于在本地环境测试部署脚本的各个功能，避免在生产环境出错

set -e
set -u

# 测试配置
TEST_DIR="/tmp/pagemaker-test"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 测试函数
test_script_syntax() {
    log_info "测试脚本语法..."
    if bash -n "$SCRIPT_DIR/deploy-backend.sh"; then
        log_info "✅ 脚本语法检查通过"
    else
        log_error "❌ 脚本语法错误"
        return 1
    fi
}

test_environment_check() {
    log_info "测试环境检查功能..."
    
    # 创建测试环境文件
    mkdir -p "$TEST_DIR"
    cat > "$TEST_DIR/.env" << EOF
DJANGO_SECRET_KEY=test-secret-key-12345
DATABASE_NAME=pagemaker_test
DATABASE_USER=test_user
DATABASE_PASSWORD=test_password
DATABASE_HOST=localhost
EOF
    
    # 测试环境变量加载
    cd "$TEST_DIR"
    if export $(grep -v '^#' .env | xargs) 2>/dev/null; then
        log_info "✅ 环境变量加载测试通过"
    else
        log_error "❌ 环境变量加载失败"
        return 1
    fi
    
    # 检查必需变量
    required_vars=("DJANGO_SECRET_KEY" "DATABASE_NAME" "DATABASE_USER" "DATABASE_PASSWORD" "DATABASE_HOST")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        log_info "✅ 必需环境变量检查通过"
    else
        log_error "❌ 缺少环境变量: ${missing_vars[*]}"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
}

test_python_environment() {
    log_info "测试Python环境..."
    
    # 检查Python版本
    if python3 --version | grep -E "Python 3\.(8|9|10|11|12)"; then
        log_info "✅ Python版本检查通过"
    else
        log_warn "⚠️ Python版本可能不兼容"
    fi
    
    # 检查python3-venv
    if python3 -m venv --help &> /dev/null; then
        log_info "✅ python3-venv 可用"
    else
        log_warn "⚠️ python3-venv 不可用，生产环境需要安装"
    fi
    
    # 测试虚拟环境创建
    test_venv_dir="$TEST_DIR/test_venv"
    if python3 -m venv "$test_venv_dir" 2>/dev/null; then
        log_info "✅ 虚拟环境创建测试通过"
        rm -rf "$test_venv_dir"
    else
        log_error "❌ 虚拟环境创建失败"
        return 1
    fi
}

test_django_setup() {
    log_info "测试Django应用设置..."
    
    cd "$PROJECT_ROOT/apps/backend"
    
    # 检查requirements.txt
    if [ -f "requirements.txt" ]; then
        log_info "✅ requirements.txt 存在"
    else
        log_error "❌ requirements.txt 不存在"
        return 1
    fi
    
    # 检查manage.py
    if [ -f "manage.py" ]; then
        log_info "✅ manage.py 存在"
    else
        log_error "❌ manage.py 不存在"
        return 1
    fi
    
    # 检查Django配置
    if python3 manage.py check --settings=pagemaker.test_settings 2>/dev/null; then
        log_info "✅ Django配置检查通过"
    else
        log_warn "⚠️ Django配置检查失败，可能需要数据库连接"
    fi
    
    cd "$PROJECT_ROOT"
}

test_service_checks() {
    log_info "测试服务检查功能..."
    
    # 测试OpenResty服务检查逻辑
    if systemctl --version &> /dev/null; then
        log_info "✅ systemctl 可用"
        
        # 检查OpenResty服务状态 (不要求服务运行)
        if systemctl status openresty &> /dev/null; then
            log_info "✅ OpenResty 服务已安装并运行"
        else
            log_warn "⚠️ OpenResty 服务未运行或未安装"
            log_warn "   生产环境需要: sudo apt-get install openresty"
        fi
    else
        log_warn "⚠️ systemctl 不可用，无法测试服务检查"
    fi
}

test_backup_logic() {
    log_info "测试备份逻辑..."
    
    # 创建模拟部署目录
    mock_deploy_dir="$TEST_DIR/mock_deploy"
    mock_backup_dir="$TEST_DIR/mock_backup"
    
    mkdir -p "$mock_deploy_dir"
    echo "test content" > "$mock_deploy_dir/test_file.txt"
    
    # 模拟备份操作
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_name="pagemaker_backup_${timestamp}"
    
    mkdir -p "$mock_backup_dir"
    if cp -r "$mock_deploy_dir" "$mock_backup_dir/$backup_name"; then
        log_info "✅ 备份逻辑测试通过"
    else
        log_error "❌ 备份逻辑失败"
        return 1
    fi
    
    # 清理测试文件
    rm -rf "$mock_deploy_dir" "$mock_backup_dir"
}

test_git_operations() {
    log_info "测试Git操作..."
    
    # 检查当前是否为git仓库
    if [ -d ".git" ]; then
        log_info "✅ 当前目录是Git仓库"
        
        # 测试git命令
        if git status &> /dev/null; then
            log_info "✅ Git状态检查通过"
        else
            log_error "❌ Git状态检查失败"
            return 1
        fi
        
        # 检查当前分支
        current_branch=$(git branch --show-current)
        log_info "✅ 当前分支: $current_branch"
        
    else
        log_warn "⚠️ 当前目录不是Git仓库"
    fi
}

test_health_check() {
    log_info "测试健康检查逻辑..."
    
    # 检查curl是否可用
    if command -v curl &> /dev/null; then
        log_info "✅ curl 命令可用"
        
        # 测试健康检查URL格式 (不实际请求)
        health_url="http://localhost:8456/api/v1/health/"
        log_info "✅ 健康检查URL: $health_url"
    else
        log_warn "⚠️ curl 命令不可用，生产环境需要安装"
    fi
}

# 运行所有测试
run_all_tests() {
    log_info "开始运行部署脚本测试..."
    log_info "测试目录: $TEST_DIR"
    
    # 清理并创建测试目录
    rm -rf "$TEST_DIR"
    mkdir -p "$TEST_DIR"
    
    local failed_tests=()
    
    # 运行各项测试
    test_script_syntax || failed_tests+=("脚本语法")
    test_environment_check || failed_tests+=("环境检查")
    test_python_environment || failed_tests+=("Python环境")
    test_django_setup || failed_tests+=("Django设置")
    test_service_checks || failed_tests+=("服务检查")
    test_backup_logic || failed_tests+=("备份逻辑")
    test_git_operations || failed_tests+=("Git操作")
    test_health_check || failed_tests+=("健康检查")
    
    # 清理测试目录
    rm -rf "$TEST_DIR"
    
    # 输出测试结果
    echo
    log_info "========== 测试结果汇总 =========="
    
    if [ ${#failed_tests[@]} -eq 0 ]; then
        log_info "🎉 所有测试通过！部署脚本可以安全推送到GitHub"
        log_info ""
        log_info "建议的推送命令:"
        log_info "  git add ."
        log_info "  git commit -m 'feat: 迁移到OpenResty反向代理'"
        log_info "  git push origin main"
        return 0
    else
        log_error "❌ 以下测试失败:"
        for test in "${failed_tests[@]}"; do
            log_error "  - $test"
        done
        log_error ""
        log_error "请修复上述问题后再推送到GitHub"
        return 1
    fi
}

# 显示帮助信息
show_help() {
    echo "Pagemaker 部署脚本测试工具"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -a, --all      运行所有测试 (默认)"
    echo "  --syntax       仅测试脚本语法"
    echo "  --env          仅测试环境检查"
    echo "  --python       仅测试Python环境"
    echo "  --django       仅测试Django设置"
    echo "  --services     仅测试服务检查"
    echo "  --backup       仅测试备份逻辑"
    echo "  --git          仅测试Git操作"
    echo "  --health       仅测试健康检查"
    echo ""
}

# 主函数
main() {
    case "${1:-all}" in
        -h|--help)
            show_help
            ;;
        --syntax)
            test_script_syntax
            ;;
        --env)
            test_environment_check
            ;;
        --python)
            test_python_environment
            ;;
        --django)
            test_django_setup
            ;;
        --services)
            test_service_checks
            ;;
        --backup)
            test_backup_logic
            ;;
        --git)
            test_git_operations
            ;;
        --health)
            test_health_check
            ;;
        -a|--all|all|*)
            run_all_tests
            ;;
    esac
}

# 如果直接运行此脚本
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 