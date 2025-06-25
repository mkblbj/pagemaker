#!/bin/bash

# Pagemaker 部署前检查脚本
# 用于CI/CD流程中快速验证部署脚本的基本功能

set -e

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查脚本语法
check_script_syntax() {
    log_info "检查部署脚本语法..."
    if bash -n scripts/deploy-backend.sh; then
        log_info "✅ 部署脚本语法正确"
    else
        log_error "❌ 部署脚本语法错误"
        exit 1
    fi
}

# 检查必要文件
check_required_files() {
    log_info "检查必要文件..."
    
    required_files=(
        "scripts/deploy-backend.sh"
        "scripts/openresty-config-example.conf"
        "apps/backend/requirements.txt"
        "apps/backend/manage.py"
        "apps/backend/pagemaker/settings.py"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            log_info "✅ $file 存在"
        else
            log_error "❌ $file 不存在"
            exit 1
        fi
    done
}

# 检查Python依赖
check_python_deps() {
    log_info "检查Python依赖文件..."
    
    cd apps/backend
    
    # 检查requirements.txt格式
    if grep -q "Django" requirements.txt; then
        log_info "✅ Django 依赖存在"
    else
        log_error "❌ Django 依赖缺失"
        exit 1
    fi
    
    if grep -q "gunicorn" requirements.txt; then
        log_info "✅ Gunicorn 依赖存在"
    else
        log_error "❌ Gunicorn 依赖缺失"
        exit 1
    fi
    
    cd ../..
}

# 主函数
main() {
    log_info "开始部署前检查..."
    
    check_script_syntax
    check_required_files
    check_python_deps
    
    log_info "🎉 所有检查通过！可以继续部署"
}

# 运行检查
main "$@" 