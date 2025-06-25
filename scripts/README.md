# Pagemaker 部署脚本使用说明

## 概述

本目录包含 Pagemaker 项目的部署脚本，用于自动化部署后端应用到生产服务器。

## 脚本列表

- `deploy-backend.sh` - 后端部署脚本
- `monitor-deployment.sh` - 部署监控脚本

## 后端部署脚本使用方法

### 前提条件

1. 服务器已安装 Python 3.12+
2. 服务器已安装 Git
3. 服务器已安装 Python 虚拟环境支持：
   ```bash
   apt update
   apt install python3-venv python3-pip
   ```
4. 服务器已配置 MySQL 数据库
5. 服务器已安装并配置 Nginx 和 Gunicorn

### 使用场景

#### 场景1: 首次部署（推荐方法）⭐

**手动克隆仓库**，这是最简单可靠的方法：

```bash
# 1. 在服务器上进入部署目录的父目录
cd /root/dev

# 2. 克隆你的仓库（替换为实际仓库地址）
git clone https://github.com/your-username/pagemaker.git

# 3. 进入项目目录
cd pagemaker

# 4. 运行部署脚本
./scripts/deploy-backend.sh
```

#### 场景2: 服务器上已有 Git 仓库

如果服务器上的部署目录已经是一个 Git 仓库，直接运行脚本：

```bash
cd /root/dev/pagemaker
./scripts/deploy-backend.sh
```

#### 场景3: 自动化部署（备选方法）

如果你更喜欢自动化方式，可以设置环境变量：

```bash
GIT_REPO_URL="https://github.com/your-username/pagemaker.git" ./deploy-backend.sh
```

### 配置说明

脚本中的默认配置：

```bash
DEPLOY_PATH="/root/dev/pagemaker"      # 部署目录
BACKUP_PATH="/root/backups/pagemaker"  # 备份目录
LOG_FILE="/var/log/pagemaker-deploy.log" # 日志文件
```

如需修改这些路径，请直接编辑脚本中的配置变量。

### 部署流程

脚本会按以下顺序执行：

1. **创建备份目录** - 确保备份目录存在
2. **备份当前版本** - 备份现有的部署文件
3. **拉取最新代码** - 从 Git 仓库获取最新代码
4. **安装依赖** - 安装/更新 Python 依赖包
5. **运行数据库迁移** - 执行 Django 数据库迁移
6. **收集静态文件** - 收集 Django 静态文件
7. **重启服务** - 重启 Gunicorn 和 Nginx 服务
8. **健康检查** - 验证部署是否成功
9. **清理旧备份** - 删除过期的备份文件

### 错误处理

- 如果部署过程中出现错误，脚本会自动回滚到之前的版本
- 所有操作都会记录到日志文件中
- 脚本会保留最近 5 个备份文件

### 故障排除

#### 常见错误及解决方案

1. **"ensurepip is not available" 或 "创建虚拟环境失败"**
   - 原因：缺少 `python3-venv` 包
   - 解决：`apt install python3-venv python3-pip`

2. **"fatal: not a git repository"**
   - 原因：服务器上的目录不是 Git 仓库
   - 解决：手动克隆仓库到 `/root/dev/pagemaker`

3. **"未设置GIT_REPO_URL环境变量"**
   - 原因：首次部署时未设置仓库URL
   - 解决：推荐手动克隆，或设置环境变量

4. **"数据库连接检查失败"**
   - 原因：数据库配置错误或数据库服务未启动
   - 解决：检查 Django 设置文件中的数据库配置

5. **"重启Gunicorn失败"**
   - 原因：Gunicorn 服务配置错误
   - 解决：检查 systemd 服务配置文件

### 日志查看

查看部署日志：

```bash
tail -f /var/log/pagemaker-deploy.log
```

查看最近的部署记录：

```bash
tail -100 /var/log/pagemaker-deploy.log
```

### 手动回滚

如果需要手动回滚到之前的版本：

```bash
# 查看可用的备份
ls -la /root/backups/pagemaker/

# 停止服务
systemctl stop pagemaker-gunicorn

# 恢复备份（替换为实际的备份目录名）
cp -r /root/backups/pagemaker/pagemaker_backup_YYYYMMDD_HHMMSS /root/dev/pagemaker

# 重启服务
systemctl start pagemaker-gunicorn
systemctl reload nginx
```

## 监控脚本

`monitor-deployment.sh` 脚本用于监控部署状态和应用健康状况。

### 使用方法

```bash
./monitor-deployment.sh
```

该脚本会：
- 检查应用服务状态
- 监控应用响应时间
- 检查日志中的错误信息
- 发送监控报告

## 安全注意事项

1. 确保脚本具有适当的执行权限：`chmod +x *.sh`
2. 定期检查和更新服务器上的 SSH 密钥
3. 使用 HTTPS 协议克隆私有仓库
4. 定期备份数据库和重要文件
5. 监控服务器资源使用情况

## 支持

如果在使用过程中遇到问题，请：

1. 检查日志文件中的错误信息
2. 确认服务器环境配置正确
3. 验证 Git 仓库访问权限
4. 联系技术支持团队 