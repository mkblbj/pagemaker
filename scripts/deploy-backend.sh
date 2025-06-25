#!/bin/bash

# Pagemaker 后端部署脚本
# 用于自动化部署Django后端应用到生产服务器
#
# 使用方法:
#   推荐: 手动克隆仓库后运行脚本
#     cd /root/dev && git clone https://github.com/your-username/pagemaker.git
#     cd pagemaker && ./scripts/deploy-backend.sh
#   
#   备选: 设置GIT_REPO_URL环境变量自动克隆
#     GIT_REPO_URL="https://github.com/your-username/pagemaker.git" ./deploy-backend.sh

set -e  # 遇到错误立即退出
set -u  # 使用未定义变量时退出

# 配置变量
DEPLOY_PATH="/root/dev/pagemaker"
BACKUP_PATH="/root/backups/pagemaker"
LOG_FILE="/var/log/pagemaker-deploy.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="pagemaker_backup_${TIMESTAMP}"

# Git仓库URL (如果目录不是git仓库时需要)
# 可以通过环境变量设置: export GIT_REPO_URL="https://github.com/your-username/pagemaker.git"
GIT_REPO_URL="${GIT_REPO_URL:-}"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 错误处理函数
error_exit() {
    log "ERROR: $1"
    exit 1
}

# 创建备份目录
create_backup_dir() {
    log "创建备份目录..."
    mkdir -p "$BACKUP_PATH"
}

# 备份当前版本
backup_current_version() {
    log "备份当前版本..."
    if [ -d "$DEPLOY_PATH" ]; then
        cp -r "$DEPLOY_PATH" "$BACKUP_PATH/$BACKUP_NAME" || error_exit "备份失败"
        log "备份完成: $BACKUP_PATH/$BACKUP_NAME"
    else
        log "警告: 部署目录不存在，跳过备份"
    fi
}

# 拉取最新代码
pull_latest_code() {
    log "拉取最新代码..."
    
    # 检查是否为git仓库
    if [ -d "$DEPLOY_PATH/.git" ]; then
        log "检测到git仓库，执行git pull..."
        cd "$DEPLOY_PATH" || error_exit "无法进入部署目录"
        
        # 保存当前分支
        CURRENT_BRANCH=$(git branch --show-current)
        log "当前分支: $CURRENT_BRANCH"
        
        # 拉取最新代码
        git fetch origin || error_exit "Git fetch 失败"
        git reset --hard origin/main || error_exit "Git reset 失败"
        
        # 显示最新提交信息
        LATEST_COMMIT=$(git log -1 --oneline)
        log "最新提交: $LATEST_COMMIT"
    else
        log "未检测到git仓库，执行git clone..."
        
        # 确保部署目录存在且为空
        if [ -d "$DEPLOY_PATH" ]; then
            log "移除现有目录..."
            rm -rf "$DEPLOY_PATH"
        fi
        
        # 创建父目录
        mkdir -p "$(dirname "$DEPLOY_PATH")"
        
        # 克隆仓库 (需要配置GIT_REPO_URL环境变量)
        if [ -z "${GIT_REPO_URL:-}" ]; then
            error_exit "未设置GIT_REPO_URL环境变量，无法克隆仓库"
        fi
        
        git clone "$GIT_REPO_URL" "$DEPLOY_PATH" || error_exit "Git clone 失败"
        
        cd "$DEPLOY_PATH" || error_exit "无法进入部署目录"
        
        # 切换到main分支
        git checkout main || error_exit "切换到main分支失败"
        
        # 显示最新提交信息
        LATEST_COMMIT=$(git log -1 --oneline)
        log "克隆完成，最新提交: $LATEST_COMMIT"
    fi
}

# 检查系统依赖
check_system_dependencies() {
    log "检查系统依赖..."
    
    # 检查 Python 3
    if ! command -v python3 &> /dev/null; then
        error_exit "Python 3 未安装，请先安装 Python 3.12+"
    fi
    
    # 检查 python3-venv 是否可用
    if ! python3 -m venv --help &> /dev/null; then
        log "检测到缺少 python3-venv 包，尝试安装..."
        
        # 检查是否为 root 用户或有 sudo 权限
        if [ "$EUID" -eq 0 ]; then
            # 以 root 身份运行
            apt update && apt install -y python3-venv python3-pip || error_exit "安装 python3-venv 失败"
        elif command -v sudo &> /dev/null; then
            # 有 sudo 权限
            sudo apt update && sudo apt install -y python3-venv python3-pip || error_exit "安装 python3-venv 失败"
        else
            error_exit "缺少 python3-venv 包，请运行: apt install python3-venv python3-pip"
        fi
        
        log "✅ python3-venv 安装完成"
    fi
    
    log "✅ 系统依赖检查通过"
}

# 安装/更新依赖
install_dependencies() {
    log "安装/更新Python依赖..."
    cd "$DEPLOY_PATH/apps/backend" || error_exit "无法进入后端目录"
    
    # 检查虚拟环境
    if [ ! -d "venv" ]; then
        log "创建Python虚拟环境..."
        if ! python3 -m venv venv; then
            log "创建虚拟环境失败，可能的解决方案："
            log "1. 安装 python3-venv: apt install python3-venv"
            log "2. 安装 python3-pip: apt install python3-pip" 
            log "3. 确保 Python 版本 >= 3.8"
            error_exit "创建虚拟环境失败"
        fi
        log "✅ Python虚拟环境创建成功"
    else
        log "使用现有的Python虚拟环境"
    fi
    
    # 激活虚拟环境
    source venv/bin/activate || error_exit "激活虚拟环境失败"
    
    # 升级pip
    pip install --upgrade pip || error_exit "升级pip失败"
    
    # 安装依赖
    pip install -r requirements.txt || error_exit "安装依赖失败"
    
    log "依赖安装完成"
}

# 运行数据库迁移
run_migrations() {
    log "运行数据库迁移..."
    cd "$DEPLOY_PATH/apps/backend" || error_exit "无法进入后端目录"
    
    # 激活虚拟环境
    source venv/bin/activate || error_exit "激活虚拟环境失败"
    
    # 检查数据库连接
    python manage.py check --database default || error_exit "数据库连接检查失败"
    
    # 运行迁移
    python manage.py migrate || error_exit "数据库迁移失败"
    
    log "数据库迁移完成"
}

# 收集静态文件
collect_static() {
    log "收集静态文件..."
    cd "$DEPLOY_PATH/apps/backend" || error_exit "无法进入后端目录"
    
    # 激活虚拟环境
    source venv/bin/activate || error_exit "激活虚拟环境失败"
    
    # 收集静态文件
    python manage.py collectstatic --noinput || error_exit "收集静态文件失败"
    
    log "静态文件收集完成"
}

# 重启应用服务
restart_services() {
    log "重启应用服务..."
    
    # 检查并重启Gunicorn服务
    if systemctl is-active --quiet pagemaker-gunicorn; then
        systemctl restart pagemaker-gunicorn || error_exit "重启Gunicorn失败"
        log "Gunicorn服务重启完成"
    else
        log "警告: Gunicorn服务未运行，尝试启动..."
        systemctl start pagemaker-gunicorn || log "警告: 启动Gunicorn失败"
    fi
    
    # 检查并重启Nginx服务
    if systemctl is-active --quiet nginx; then
        systemctl reload nginx || error_exit "重载Nginx配置失败"
        log "Nginx配置重载完成"
    else
        log "警告: Nginx服务未运行"
    fi
}

# 健康检查
health_check() {
    log "执行健康检查..."
    
    # 等待服务启动
    sleep 5
    
    # 检查应用是否响应
    if curl -f -s http://localhost:8000/api/health/ > /dev/null; then
        log "✅ 健康检查通过"
        return 0
    else
        log "❌ 健康检查失败"
        return 1
    fi
}

# 回滚函数
rollback() {
    log "开始回滚到之前版本..."
    
    if [ -d "$BACKUP_PATH/$BACKUP_NAME" ]; then
        # 停止服务
        systemctl stop pagemaker-gunicorn || true
        
        # 恢复备份
        rm -rf "$DEPLOY_PATH"
        cp -r "$BACKUP_PATH/$BACKUP_NAME" "$DEPLOY_PATH" || error_exit "回滚失败"
        
        # 重启服务
        restart_services
        
        log "回滚完成"
    else
        error_exit "找不到备份文件，无法回滚"
    fi
}

# 清理旧备份
cleanup_old_backups() {
    log "清理旧备份..."
    
    # 保留最近5个备份
    cd "$BACKUP_PATH" || return
    ls -t | tail -n +6 | xargs -r rm -rf
    
    log "旧备份清理完成"
}

# 主部署流程
main() {
    log "========== 开始部署 Pagemaker 后端 =========="
    
    # 检查系统依赖
    check_system_dependencies
    
    # 创建备份目录
    create_backup_dir
    
    # 备份当前版本
    backup_current_version
    
    # 拉取最新代码
    pull_latest_code
    
    # 安装依赖
    install_dependencies
    
    # 运行数据库迁移
    run_migrations
    
    # 收集静态文件
    collect_static
    
    # 重启服务
    restart_services
    
    # 健康检查
    if health_check; then
        log "✅ 部署成功完成"
        cleanup_old_backups
    else
        log "❌ 部署失败，开始回滚..."
        rollback
        error_exit "部署失败并已回滚"
    fi
    
    log "========== 部署流程结束 =========="
}

# 如果直接运行此脚本
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 