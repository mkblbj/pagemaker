# 部署脚本使用指南

## 概述

本目录包含 Pagemaker 项目的部署脚本和相关工具。

### 脚本列表

- `deploy-backend.sh` - 主部署脚本
- `test-deploy.sh` - 完整的部署脚本测试工具
- `pre-deploy-check.sh` - 部署前快速检查脚本
- `install-gunicorn-service.sh` - Gunicorn 服务安装脚本
- `pagemaker-gunicorn.service` - systemd 服务配置文件
- `openresty-config-example.conf` - OpenResty 配置示例
- `monitor-deployment.sh` - 部署监控脚本
- `TROUBLESHOOTING.md` - 故障排除指南

## 前置条件

1. 服务器已安装 Python 3.8+
2. 服务器已安装 `python3-venv` 包：`apt install python3-venv python3-pip`
3. 服务器已安装 MySQL 数据库
4. 服务器已配置 `.env` 环境变量文件
5. 服务器已安装 OpenResty 和 Gunicorn，OpenResty 已手动配置反向代理

### OpenResty 配置

部署脚本不会自动配置 OpenResty，需要手动配置反向代理。参考配置文件：

- **配置示例**: `scripts/openresty-config-example.conf`
- **主要配置**:
  - API 请求(`/api/*`)代理到 Django 后端 (`http://127.0.0.1:8000`)
  - 静态文件直接由 OpenResty 服务
  - 健康检查端点配置

## 测试工具

### 完整测试 (`test-deploy.sh`)

在推送到 GitHub 之前，建议运行完整测试：

```bash
# 运行所有测试
./scripts/test-deploy.sh

# 运行特定测试
./scripts/test-deploy.sh --syntax    # 仅测试脚本语法
./scripts/test-deploy.sh --env       # 仅测试环境检查
./scripts/test-deploy.sh --python    # 仅测试Python环境
./scripts/test-deploy.sh --django    # 仅测试Django设置
./scripts/test-deploy.sh --services  # 仅测试服务检查
./scripts/test-deploy.sh --backup    # 仅测试备份逻辑
./scripts/test-deploy.sh --git       # 仅测试Git操作
./scripts/test-deploy.sh --health    # 仅测试健康检查
```

### 快速检查 (`pre-deploy-check.sh`)

用于 CI/CD 流程的快速检查：

```bash
./scripts/pre-deploy-check.sh
```

## 使用场景

### 场景 1: 开发环境部署测试

```bash
# 1. 运行完整测试
./scripts/test-deploy.sh

# 2. 如果测试通过，推送到 GitHub
git add .
git commit -m "feat: 迁移到OpenResty反向代理"
git push origin main
```

### 场景 2: 生产环境部署

```bash
# 在生产服务器上运行
cd /root/dev/pagemaker
./scripts/deploy-backend.sh
```

### 场景 3: CI/CD 集成

GitHub Actions 会自动运行 `pre-deploy-check.sh` 进行部署前检查。

## 部署流程

1. **系统依赖检查** - 检查 Python、pip、venv 等系统依赖
2. **备份当前版本** - 创建当前版本的备份
3. **拉取最新代码** - 从 Git 仓库拉取最新代码
4. **环境检查** - 验证 `.env` 文件和环境变量
5. **安装依赖** - 在虚拟环境中安装 Python 依赖
6. **运行数据库迁移** - 执行 Django 数据库迁移
7. **收集静态文件** - 收集 Django 静态文件
8. **重启服务** - 重启 Gunicorn 和 OpenResty 服务
9. **健康检查** - 验证部署是否成功
10. **清理旧备份** - 删除过期的备份文件

## 故障排除

### 常见问题

1. **Gunicorn 服务未找到**: 运行 `./scripts/install-gunicorn-service.sh` 安装服务
2. **权限问题**: 确保脚本有执行权限 (`chmod +x deploy-backend.sh`)
3. **Python 环境**: 确保安装了 `python3-venv` 包
4. **数据库连接**: 检查 `.env` 文件中的数据库配置
5. **端口配置**: 确保 `.env`、Gunicorn 服务、OpenResty 配置中的端口一致
6. **OpenResty 配置**: 手动配置反向代理后重载配置

详细的故障排除指南请参考: `scripts/TROUBLESHOOTING.md`

### 日志查看

```bash
# 查看部署日志
tail -f /var/log/pagemaker-deploy.log

# 查看服务状态
systemctl status pagemaker-gunicorn
systemctl status openresty
```

### 回滚

如果部署失败，脚本会自动回滚到备份版本。

### 手动操作

```bash
# 重启服务
systemctl start pagemaker-gunicorn
systemctl reload openresty
```

## 配置文件

- `.env` - 环境变量配置（需要手动创建）
- `requirements.txt` - Python 依赖列表
- `openresty-config-example.conf` - OpenResty 配置示例

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