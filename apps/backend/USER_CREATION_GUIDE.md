# 用户创建指南

## 概述

本系统提供3种方式创建普通用户，分别适用于不同场景。

---

## 方法1：管理命令（推荐 ⭐）

### 交互式创建单个用户

```bash
cd apps/backend
source venv/bin/activate
python manage.py create_user
```

系统会提示输入：
```
请输入用户名: john
请输入密码: ******
请再次输入密码: ******
✅ 成功创建普通用户!
   用户名: john
   邮箱: john@pagemaker.local
   全名: john
   角色: editor
   超级用户: 否

💡 提示: 该用户只能看到自己创建的数据（页面、店铺配置等）
```

### 命令行参数创建

```bash
# 创建普通用户
python manage.py create_user --username john --password pass123

# 创建管理员
python manage.py create_user --username admin2 --password admin123 --role admin

# 指定完整信息
python manage.py create_user \
  --username jane \
  --password pass123 \
  --email jane@example.com \
  --full-name "Jane Smith" \
  --role editor

# 强制重置现有用户
python manage.py create_user --username john --password newpass --force
```

### 参数说明

| 参数 | 必填 | 默认值 | 说明 |
|-----|-----|--------|------|
| `--username` | 否* | - | 用户名（未提供则交互输入） |
| `--password` | 否* | - | 密码（未提供则交互输入） |
| `--email` | 否 | `{username}@pagemaker.local` | 邮箱 |
| `--full-name` | 否 | 同用户名 | 全名 |
| `--role` | 否 | `editor` | 角色（editor或admin） |
| `--force` | 否 | false | 强制重置现有用户 |

\* 如果不通过命令行提供，会进入交互式输入

---

## 方法2：批量创建测试用户

### 基本用法

```bash
# 创建5个测试用户（user1, user2, ..., user5）
python manage.py create_test_users

# 创建10个测试用户
python manage.py create_test_users --count 10

# 自定义前缀（创建 test1, test2, ...）
python manage.py create_test_users --count 5 --prefix test

# 创建管理员
python manage.py create_test_users --count 3 --role admin --prefix admin

# 自定义密码
python manage.py create_test_users --count 5 --password mypass123

# 强制重置现有用户
python manage.py create_test_users --force
```

### 输出示例

```
🚀 开始创建 5 个测试普通用户账号...

✅ 创建成功: user1 (user1@pagemaker.local)
✅ 创建成功: user2 (user2@pagemaker.local)
✅ 创建成功: user3 (user3@pagemaker.local)
✅ 创建成功: user4 (user4@pagemaker.local)
✅ 创建成功: user5 (user5@pagemaker.local)

============================================================

🎉 批量创建完成!

   用户类型: 普通用户
   创建数量: 5
   统一密码: test123

📋 账号列表:
   - user1 / test123
   - user2 / test123
   - user3 / test123
   - user4 / test123
   - user5 / test123

💡 提示: 这些用户只能看到自己创建的数据（数据隔离已生效）

⚠️  安全提示: 这些是测试账号，请勿在生产环境使用!
```

### 参数说明

| 参数 | 必填 | 默认值 | 说明 |
|-----|-----|--------|------|
| `--count` | 否 | 5 | 创建数量（1-50） |
| `--password` | 否 | `test123` | 统一密码 |
| `--role` | 否 | `editor` | 角色（editor或admin） |
| `--prefix` | 否 | `user` | 用户名前缀 |
| `--force` | 否 | false | 强制重置现有用户 |

---

## 方法3：REST API（需要认证）

### 用户注册接口

**端点**：`POST /api/v1/users/register/`  
**权限**：公开（AllowAny）

**请求体**：
```json
{
  "username": "john",
  "password": "securepass123",
  "email": "john@example.com",  // 可选
  "full_name": "John Doe"  // 可选
}
```

**成功响应** (201):
```json
{
  "success": true,
  "message": "用户注册成功",
  "data": {
    "id": 5,
    "username": "john",
    "email": "john@example.com",
    "role": "editor",
    "full_name": "John Doe"
  }
}
```

**失败响应** (400):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "数据验证失败",
    "details": {
      "username": ["用户名已存在"]
    }
  }
}
```

### 获取当前用户信息

**端点**：`GET /api/v1/users/me/`  
**权限**：需要认证

**响应**：
```json
{
  "success": true,
  "data": {
    "id": 5,
    "username": "john",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "editor",
    "is_admin": false,
    "created_at": "2026-02-01T10:30:00Z"
  }
}
```

### 获取用户列表（仅admin）

**端点**：`GET /api/v1/users/`  
**权限**：仅admin

**响应**：
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@pagemaker.local",
        "full_name": "Admin",
        "role": "admin",
        "is_superuser": true,
        "created_at": "2026-01-01T10:00:00Z"
      },
      {
        "id": 5,
        "username": "john",
        "email": "john@example.com",
        "full_name": "John Doe",
        "role": "editor",
        "is_superuser": false,
        "created_at": "2026-02-01T10:30:00Z"
      }
    ],
    "total": 2
  }
}
```

---

## 使用场景建议

### 开发环境

```bash
# 快速创建测试用户
python manage.py create_test_users --count 5

# 创建特定测试用户
python manage.py create_user --username testuser --password test123
```

### 生产环境

```bash
# 交互式创建（更安全，密码不会显示在命令历史中）
python manage.py create_user

# 或通过API注册（需要前端界面）
curl -X POST http://your-domain/api/v1/users/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "securepass123",
    "email": "john@example.com",
    "full_name": "John Doe"
  }'
```

---

## 验证用户创建

### 检查用户是否创建成功

```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User
from users.models import UserProfile

# 查看所有用户
for user in User.objects.all():
    profile = user.userprofile
    print(f"{user.username} - {profile.role} - {profile.full_name}")

# 检查特定用户
user = User.objects.get(username="john")
print(f"用户: {user.username}")
print(f"角色: {user.userprofile.role}")
print(f"邮箱: {user.email}")
```

### 测试登录

```bash
# 使用curl测试
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "pass123"
  }'
```

---

## 常见问题

### Q1: 创建用户时提示"用户名已存在"？
使用 `--force` 参数强制重置：
```bash
python manage.py create_user --username john --password newpass --force
```

### Q2: 如何修改用户角色？
```bash
python manage.py shell
```
```python
from django.contrib.auth.models import User

user = User.objects.get(username="john")
user.userprofile.role = "admin"
user.userprofile.save()
```

### Q3: 如何删除用户？
```bash
python manage.py shell
```
```python
from django.contrib.auth.models import User

User.objects.get(username="john").delete()
```

### Q4: 批量创建的用户密码太简单，如何修改？
创建时指定复杂密码：
```bash
python manage.py create_test_users --password "Complex@Pass123"
```

### Q5: 如何在生产环境禁用公开注册？
修改 `users/views.py` 中 `register_user` 的权限：
```python
@permission_classes([IsAuthenticated, IsAdminRole])  # 改为仅admin可注册
```

---

## 安全建议

1. **生产环境**：
   - 使用交互式命令创建用户（密码不会记录在命令历史）
   - 关闭公开注册接口，或添加邀请码验证
   - 强制使用强密码（至少8位，包含大小写字母和数字）

2. **测试环境**：
   - 使用明显的测试账号前缀（如 `test_`）
   - 定期清理测试账号

3. **密码管理**：
   - 生产环境避免使用默认密码
   - 提醒用户首次登录后修改密码
   - 考虑实现密码过期策略

---

## 相关文件

- 创建用户命令：`users/management/commands/create_user.py`
- 批量创建命令：`users/management/commands/create_test_users.py`
- API视图：`users/views.py`
- 序列化器：`users/serializers.py`
- URL配置：`users/urls.py`
- 用户模型：`users/models.py`
