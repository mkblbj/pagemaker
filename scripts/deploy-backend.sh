#!/bin/bash

# Pagemaker 后端部署脚本
# 用于自动化部署Django后端应用到生产服务器

set -e  # 遇到错误立即退出
set -u  # 使用未定义变量时退出

# 配置变量
DEPLOY_PATH="/root/dev/pagemaker"
BACKUP_PATH="/root/backups/pagemaker"
LOG_FILE="/var/log/pagemaker-deploy.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="pagemaker_backup_${TIMESTAMP}"

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
}

# 安装/更新依赖
install_dependencies() {
    log "安装/更新Python依赖..."
    cd "$DEPLOY_PATH/apps/backend" || error_exit "无法进入后端目录"
    
    # 检查虚拟环境
    if [ ! -d "venv" ]; then
        log "创建Python虚拟环境..."
        python3 -m venv venv || error_exit "创建虚拟环境失败"
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