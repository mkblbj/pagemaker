# Pagemaker 部署脚本使用说明

## 概述

本目录包含 Pagemaker 项目的部署脚本，用于自动化部署后端应用到生产服务器。

## 脚本列表

- `deploy-backend.sh` - 后端部署脚本
- `monitor-deployment.sh` - 部署监控脚本
- `test-db-connection.py` - 数据库连接测试工具

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

4. **"数据库连接检查失败" 或 "(1049, 'Unknown database')"**
   - 原因：数据库配置错误、数据库不存在或服务未启动
   - 解决方案：
     ```bash
     # 1. 检查环境变量配置
     cat .env | grep DATABASE
     
     # 2. 运行数据库连接测试
     python3 scripts/test-db-connection.py
     
     # 3. 检查数据库是否存在
     mysql -h database.uoworld.co.jp -u pagemaker_cms_user -p
     SHOW DATABASES;
     
     # 4. 如果数据库不存在，创建数据库
     CREATE DATABASE pagemaker_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
     
     # 5. 确保 .env 文件存在且配置正确
     cp .env.example .env  # 如果 .env 不存在
     nano .env  # 编辑数据库配置
     ```

5. **"重启Gunicorn失败"**
   - 原因：Gunicorn 服务配置错误
   - 解决：检查 systemd 服务配置文件

6. **"缺少环境变量" 或 "环境变量读取失败"**
   - 原因：.env 文件不存在或格式错误
   - 解决方案：
     ```bash
     # 1. 检查 .env 文件是否存在
     ls -la .env
     
     # 2. 从示例文件创建 .env
     cp .env.example .env
     
     # 3. 编辑环境变量配置
     nano .env
     
     # 4. 验证环境变量格式
     source .env && echo "DATABASE_NAME: $DATABASE_NAME"
     
     # 5. 确保没有多余的空格或引号
     grep -n "=" .env | head -5
     ```

7. **"网络连接超时" 或 "Connection refused"**
   - 原因：无法连接到数据库服务器
   - 解决方案：
     ```bash
     # 1. 测试网络连接
     ping database.uoworld.co.jp
     
     # 2. 测试端口连接
     telnet database.uoworld.co.jp 3306
     # 或使用 nc 命令
     nc -zv database.uoworld.co.jp 3306
     
     # 3. 检查防火墙设置
     sudo ufw status
     
     # 4. 检查DNS解析
     nslookup database.uoworld.co.jp
     ```

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

## 数据库连接测试工具

`test-db-connection.py` 脚本用于诊断数据库连接问题，特别适用于部署时的故障排除。

### 使用方法

```bash
# 在项目根目录运行
python3 scripts/test-db-connection.py
```

该脚本会：
- 检查环境变量配置
- 测试MySQL服务器连接
- 验证数据库是否存在
- 检查用户权限
- 测试Django数据库连接

### 输出示例

```
==================================================
🔧 Pagemaker 数据库连接诊断工具
==================================================
📁 当前目录: /root/dev/pagemaker
✅ 找到环境变量文件: .env

🔍 开始数据库连接测试...
📋 数据库配置:
  - 主机: database.uoworld.co.jp
  - 端口: 3306
  - 数据库: pagemaker_cms
  - 用户: pagemaker_cms_user
  - 密码: ********************

🔌 测试MySQL服务器连接...
✅ MySQL服务器连接成功

🗄️ 检查数据库 'pagemaker_cms' 是否存在...
✅ 数据库 'pagemaker_cms' 存在

🎯 测试连接到数据库 'pagemaker_cms'...
✅ 数据库连接成功，MySQL版本: 8.4.3
📋 用户权限:
  - GRANT ALL PRIVILEGES ON `pagemaker_cms`.* TO `pagemaker_cms_user`@`%`

🎉 数据库连接测试全部通过！

🐍 测试Django数据库连接...
✅ Django数据库连接成功

==================================================
🎉 所有测试通过！数据库配置正确。
==================================================
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