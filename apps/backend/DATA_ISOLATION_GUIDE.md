# 多用户数据隔离功能

## 概述

本系统实现了完整的多用户数据隔离，确保不同用户的数据互不可见，同时保留管理员查看所有数据的能力。

## 功能特性

### 1. 权限模型

- **Admin（管理员）**：可以查看和管理所有用户的数据
- **Editor（普通用户）**：只能查看和管理自己创建的数据

### 2. 隔离范围

#### ✅ Pages (页面模板)
- **普通用户**：只能看到自己创建的页面
- **Admin**：可以看到所有页面
- **实现位置**：`pages/views.py` line 30-40

#### ✅ Media (媒体文件)
- **普通用户**：只能看到自己上传的媒体文件
- **Admin**：可以看到所有媒体文件
- **实现位置**：`media/views.py` line 257, 308

#### ✅ ShopConfiguration (店铺配置)
- **普通用户**：只能看到和管理自己创建的店铺配置
- **Admin**：可以看到和管理所有店铺配置
- **实现位置**：`configurations/views.py`

### 3. 关联限制

- **普通用户创建页面**：只能选择自己的店铺配置
- **Admin创建页面**：可以选择任何店铺配置
- **验证位置**：`pages/serializers.py` line 57-91

## API行为说明

### 店铺配置 API

#### `GET /api/v1/configurations/shops/`
- **普通用户**：返回自己创建的店铺列表
- **Admin**：返回所有店铺列表

#### `POST /api/v1/configurations/shops/`
- **所有用户**：可以创建店铺配置
- 自动设置 `owner` 为当前用户

#### `GET /api/v1/configurations/shops/{id}/`
- **普通用户**：只能访问自己的店铺
- **Admin**：可以访问任何店铺
- **其他用户访问**：返回 404

#### `PUT /api/v1/configurations/shops/{id}/`
- **普通用户**：只能修改自己的店铺
- **Admin**：可以修改任何店铺

#### `DELETE /api/v1/configurations/shops/{id}/`
- **普通用户**：只能删除自己的店铺
- **Admin**：可以删除任何店铺

### 页面模板 API

#### `POST /api/v1/pages/`
创建页面时的 `shop_id` 验证：
- **普通用户**：只能使用自己的店铺ID
- **Admin**：可以使用任何店铺ID
- **未提供 shop_id**：
  - 普通用户：使用自己的第一个店铺
  - Admin：使用系统第一个店铺

## 数据库变更

### ShopConfiguration 模型
新增字段：
```python
owner = models.ForeignKey(
    User,
    on_delete=models.CASCADE,
    related_name="shop_configurations",
    help_text="店铺配置的所有者",
)
```

### 迁移文件
- `configurations/migrations/0003_shopconfiguration_owner.py`
  - 添加 `owner` 字段
  - 将现有店铺配置分配给第一个admin用户

## 部署步骤

### 1. 运行迁移
```bash
cd apps/backend
python manage.py migrate configurations 0003_shopconfiguration_owner
```

### 2. 验证迁移
```python
from configurations.models import ShopConfiguration

# 检查所有店铺是否都有owner
shops_without_owner = ShopConfiguration.objects.filter(owner__isnull=True).count()
print(f"没有owner的店铺数量: {shops_without_owner}")
```

### 3. 运行测试
```bash
DJANGO_SETTINGS_MODULE=pagemaker.test_settings python -m pytest configurations/tests/test_isolation.py -v
```

### 4. 使用一键脚本
```bash
cd apps/backend
./scripts/deploy_data_isolation.sh
```

## 测试场景

### 场景1：普通用户创建店铺
```python
# 用户登录后创建店铺
POST /api/v1/configurations/shops/
{
    "shop_name": "我的店铺",
    "target_area": "my_shop",
    "api_service_secret": "secret",
    "api_license_key": "key",
    "ftp_host": "ftp.example.com",
    "ftp_port": 21,
    "ftp_user": "user",
    "ftp_password": "pass"
}

# 系统自动设置 owner 为当前用户
# 返回包含 owner_id 和 owner_username
```

### 场景2：普通用户查看店铺列表
```python
# 只返回该用户创建的店铺
GET /api/v1/configurations/shops/

Response:
{
    "success": true,
    "data": [
        {
            "id": "...",
            "shop_name": "我的店铺",
            "owner_id": 1,
            "owner_username": "user1",
            ...
        }
    ],
    "count": 1
}
```

### 场景3：普通用户尝试使用别人的店铺
```python
# 创建页面时使用其他用户的 shop_id
POST /api/v1/pages/
{
    "name": "测试页面",
    "content": [],
    "shop_id": "other-user-shop-id",  # 其他用户的店铺
    "device_type": "pc"
}

# 返回错误
Response (400):
{
    "shop_id": ["您没有权限使用该店铺配置"]
}
```

### 场景4：Admin查看所有店铺
```python
# Admin 登录后查看店铺列表
GET /api/v1/configurations/shops/

Response:
{
    "success": true,
    "data": [
        {
            "id": "...",
            "shop_name": "用户1的店铺",
            "owner_id": 2,
            "owner_username": "user1",
            ...
        },
        {
            "id": "...",
            "shop_name": "用户2的店铺",
            "owner_id": 3,
            "owner_username": "user2",
            ...
        }
    ],
    "count": 2
}
```

## 常见问题

### Q1: 如何将现有店铺分配给特定用户？
```python
from configurations.models import ShopConfiguration
from django.contrib.auth.models import User

shop = ShopConfiguration.objects.get(id="shop-uuid")
user = User.objects.get(username="target_user")
shop.owner = user
shop.save()
```

### Q2: 如何让多个用户共享一个店铺？
当前版本不支持多用户共享店铺。如需实现，需要：
1. 添加 `ManyToManyField` 或建立用户组概念
2. 修改权限验证逻辑

### Q3: Admin能修改店铺的owner吗？
通过API暂不支持修改owner。如需修改，使用Django Admin或shell。

### Q4: 用户删除后，其店铺配置会怎样？
由于使用 `on_delete=models.CASCADE`，用户删除后，其所有店铺配置也会被删除。

## 技术细节

### 权限检查顺序
1. 用户是否已认证（`IsAuthenticated`）
2. 检查用户角色（`check_user_role`）
3. 对象级权限检查（`IsOwnerOrAdmin`）

### 查询优化
使用 `select_related("owner")` 预加载owner数据，避免N+1查询：
```python
ShopConfiguration.objects.select_related("owner").all()
```

### Serializer验证流程
1. 字段级验证（`validate_shop_id`）
2. 对象级验证（`validate`）
3. 创建/更新时的业务逻辑验证

## 安全考虑

1. **敏感数据保护**：店铺配置包含API密钥和FTP密码，只有owner和admin能访问
2. **强制owner设置**：创建时自动设置owner，不允许用户指定
3. **严格的查询过滤**：在queryset层面就过滤数据，而不仅仅依赖权限检查
4. **对象级权限**：即使知道ID，也无法访问不属于自己的资源

## 相关文件

- 模型：`configurations/models.py`
- 视图：`configurations/views.py`
- 序列化器：`configurations/serializers.py`, `pages/serializers.py`
- 迁移：`configurations/migrations/0003_shopconfiguration_owner.py`
- 测试：`configurations/tests/test_isolation.py`
- 部署脚本：`scripts/deploy_data_isolation.sh`
