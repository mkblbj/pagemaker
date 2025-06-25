# OpenResty 迁移说明

## 概述

本文档记录了从 Nginx 迁移到 OpenResty 的修改内容。根据用户需求，在云服务器 uoserver 上使用 OpenResty 进行反向代理，减少服务器上部署的 web 平台数量。

## 修改内容

### 1. 部署脚本修改

**文件**: `scripts/deploy-backend.sh`
- 将 nginx 服务检查替换为 openresty
- 修改服务重启逻辑，支持 OpenResty 配置重载
- 添加手动配置提示信息

### 2. 文档更新

以下文档已更新，将所有 Nginx 引用替换为 OpenResty：

- `scripts/README.md` - 部署脚本说明
- `DEPLOYMENT_FIX.md` - 部署修复指南
- `docs/architecture/high-level-architecture.md` - 高级架构文档
- `docs/architect-requirements.md` - 架构需求文档
- `docs/fullstack-architecture.md` - 全栈架构文档
- `docs/architecture/architect-checklist-validation-report.md` - 架构检查报告

### 3. 新增配置文件

**文件**: `scripts/openresty-config-example.conf`
- OpenResty 反向代理配置示例
- 包含完整的 upstream 和 location 配置
- 支持静态文件服务、API 代理、健康检查等

## 手动配置步骤

### 1. 配置反向代理
```bash
# 1. 编辑 OpenResty 配置文件
sudo nano /usr/local/openresty/nginx/conf/nginx.conf

# 2. 添加 pagemaker 配置
# 参考 scripts/openresty-config-example.conf

# 3. 测试配置
sudo openresty -t

# 4. 重载配置
sudo systemctl reload openresty
```

### 2. 验证配置
```bash
# 检查服务状态
systemctl status openresty

# 测试反向代理
curl -f http://localhost/api/health/
```

## 关键配置说明

### Upstream 配置
```nginx
upstream pagemaker_backend {
    server 127.0.0.1:8000;  # Django + Gunicorn
    keepalive 32;
}
```

### Location 配置
- `/api/` - 代理到 Django 后端
- `/admin/` - Django 管理页面
- `/static/` - 静态文件直接服务
- `/media/` - 媒体文件直接服务
- `/health/` - 健康检查端点

## 优势

1. **减少服务数量**: 使用现有的 OpenResty 服务，无需额外安装 Nginx
2. **手动控制**: 反向代理配置由用户手动管理，更灵活
3. **兼容性**: OpenResty 基于 Nginx，配置语法兼容
4. **性能**: OpenResty 提供更好的性能和扩展性

## 注意事项

1. **手动配置**: 部署脚本不会自动配置 OpenResty，需要手动设置反向代理
2. **配置检查**: 每次修改配置后需要测试和重载
3. **端口冲突**: 确保 OpenResty 和 Django 使用不同端口
4. **权限问题**: 静态文件路径需要正确的访问权限 