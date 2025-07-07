# 管理员账号设置指南

## 概述

Pagemaker CMS 提供了多种方式来创建和管理超级管理员账号，确保你能够顺利进入系统。

## 🚀 快速开始

### 自动创建（推荐）

系统会在数据库迁移时自动创建默认管理员账号（仅在没有任何用户时）：

**默认账号信息：**
- 用户名: `admin`
- 密码: `admin123`
- 邮箱: `admin@pagemaker.local`
- 角色: 超级管理员

### 使用初始化脚本

```bash
# 在项目根目录运行
./scripts/init-database.sh
```

这个脚本会：
1. 运行数据库迁移
2. 创建默认管理员账号
3. 收集静态文件
4. 显示数据库状态报告

## 🔧 手动管理

### 使用管理命令

```bash
# 进入后端目录
cd apps/backend

# 创建默认管理员
python manage.py create_admin

# 创建自定义管理员
python manage.py create_admin --username myuser --password mypass --email my@email.com

# 强制重置现有管理员
python manage.py create_admin --force

# 查看帮助
python manage.py create_admin --help
```

### 使用Django shell

```bash
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
from users.models import UserProfile

User = get_user_model()

# 创建超级管理员
admin_user = User.objects.create_superuser(
    username='admin',
    email='admin@pagemaker.local',
    password='admin123'
)

# 创建用户配置文件
UserProfile.objects.create(
    user=admin_user,
    role='admin',
    full_name='Super Admin'
)
```

## 📋 部署时自动创建

### 新环境部署

当你在新环境中部署时，系统会自动：

1. **数据库迁移**: 运行所有必要的数据库迁移
2. **自动创建管理员**: 如果数据库中没有任何用户，自动创建默认管理员
3. **用户配置文件**: 同时创建对应的用户配置文件

### 部署脚本

```bash
# 运行部署脚本（会自动创建管理员）
./scripts/deploy-backend.sh
```

部署脚本会在数据库迁移后自动尝试创建管理员账号。

## 🔐 安全建议

### 生产环境

**⚠️ 重要：在生产环境中必须更改默认密码！**

```bash
# 方法1: 使用管理命令重置
python manage.py create_admin --force --password 强密码123

# 方法2: 通过Django管理界面修改
# 访问 http://your-domain/admin/ 登录后修改密码
```

### 密码要求

建议使用强密码，包含：
- 至少8个字符
- 大小写字母
- 数字
- 特殊字符

## 📊 验证管理员账号

### 检查现有用户

```bash
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
print('现有用户:')
for user in User.objects.all():
    print(f'  - {user.username} (超级用户: {user.is_superuser})')
"
```

### 测试登录

```bash
python manage.py shell -c "
from django.contrib.auth import authenticate
user = authenticate(username='admin', password='admin123')
print('登录测试:', '成功' if user else '失败')
if user:
    print(f'用户: {user.username}, 超级用户: {user.is_superuser}')
"
```

## 🛠️ 故障排除

### 常见问题

**1. 管理员账号已存在**
```bash
# 强制重置
python manage.py create_admin --force
```

**2. 找不到管理命令**
```bash
# 确保在正确目录
cd apps/backend
python manage.py create_admin
```

**3. 数据库连接错误**
```bash
# 检查数据库配置
python manage.py check --database default
```

**4. 权限问题**
```bash
# 检查用户配置文件
python manage.py shell -c "
from users.models import UserProfile
print('用户配置文件:')
for profile in UserProfile.objects.all():
    print(f'  - {profile.user.username}: {profile.role}')
"
```

## 🔄 数据库迁移详情

### 自动创建迁移

系统包含一个数据迁移 `users/migrations/0002_create_default_admin.py`：

- **触发条件**: 仅在数据库中没有任何用户时执行
- **创建内容**: 超级管理员用户 + 用户配置文件
- **回滚支持**: 支持迁移回滚，会删除创建的管理员

### 手动运行迁移

```bash
# 运行特定迁移
python manage.py migrate users 0002

# 回滚迁移
python manage.py migrate users 0001
```

## 📞 获取帮助

如果遇到问题，请检查：

1. **数据库连接**: 确保数据库服务正常运行
2. **环境变量**: 检查 `.env` 文件配置
3. **权限**: 确保有足够的文件和数据库权限
4. **日志**: 查看错误日志获取详细信息

```bash
# 查看Django日志
tail -f /var/log/pagemaker-deploy.log

# 查看系统服务状态
systemctl status pagemaker-gunicorn
``` 