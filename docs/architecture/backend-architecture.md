# 后端架构 (Backend Architecture)

## 11.1 服务架构 (Service Architecture)

我们将采用一种 **面向服务的应用(App-based)架构**。整个后端项目按功能域拆分成多个独立的Django App。

* **应用(App)划分**:

```plaintext
apps/backend/
└── pagemaker/          # Django项目主目录
    ├── api/
    ├── users/
    │   └── ... (将遵循与pages App相同的内部结构)
    │
    ├── pages/  # <--- 对 pages App 进行细化展示
    │   ├── __init__.py
    │   ├── apps.py
    │   ├── models.py         # 存放 PageTemplate 模型
    │   ├── views.py          # 存放 PageDetailView 等API视图
    │   ├── urls.py           # 存放 pages App 内部的路由
    │   ├── serializers.py    # 存放 PageTemplate 的序列化器
    │   ├── repositories.py   # 存放 PageTemplateRepository
    │   ├── permissions.py    # 存放 IsOwnerOrAdmin 等权限类
    │   └── migrations/       # 数据库迁移文件目录
    │
    ├── configurations/
    │   └── ... (将遵循与pages App相同的内部结构)
    │
    ├── media/
    │   └── ... (将遵循与pages App相同的内部结构)
    │
    ├── settings.py
    └── manage.py
```

## 11.2 数据库架构与数据访问层 (Database Architecture & Data Access Layer)

* **核心设计模式 (Core Design Pattern):** 统一采用 **仓库模式 (Repository Pattern)**。
* **理由**: 提高可测试性、关注点分离和未来的灵活性。
* **代码模板与实现 (Code Templates & Implementation):**

    1.  **仓库类的实现 (于 `some_app/repositories.py`)**:

```python
# file: apps/backend/pagemaker/pages/repositories.py
from .models import PageTemplate
from uuid import UUID

class PageTemplateRepository:
    def get_page_by_id(self, page_id: UUID) -> PageTemplate | None:
        """根据ID获取单个页面模板"""
        try:
            return PageTemplate.objects.get(id=page_id)
        except PageTemplate.DoesNotExist:
            return None

    def get_all_pages_for_user(self, user_id: UUID) -> list[PageTemplate]:
        """获取某个用户的所有页面模板"""
        return list(PageTemplate.objects.filter(owner_id=user_id).order_by('-updated_at'))

    def create_page(self, name: str, owner_id: UUID, ... ) -> PageTemplate:
        """创建一个新的页面模板"""
        # ...创建逻辑
        pass
```

2.  **视图如何使用仓库 (于 `some_app/views.py`)**:

```python
# file: apps/backend/pagemaker/pages/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .repositories import PageTemplateRepository # 注入仓库

class PageDetailView(APIView):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.repo = PageTemplateRepository() # 实例化仓库

    def get(self, request, page_id):
        # 视图逻辑只负责调用，不关心如何实现
        page = self.repo.get_page_by_id(page_id)
        if not page:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        # ... 序列化并返回page数据
        return Response(...)
```

## 11.3 认证与授权 (Authentication & Authorization)

* **认证策略 (Authentication Strategy):**
    * **机制**: **JSON Web Tokens (JWT)**。
    * **推荐库**: `djangorestframework-simplejwt`。
    * **令牌流程**: 采用标准的 `access_token` 和 `refresh_token` 流程。

* **授权策略 (Authorization Strategy):**
    * **机制**: **基于角色的访问控制 (Role-Based Access Control - RBAC)**。
    * **角色权限定义**:
        * **`editor` (编辑)**: 只能管理自己创建的内容。
        * **`admin` (管理员)**: 可以管理所有用户的内容和系统配置。
    * **实现示例 (概念代码):**

```python
# file: some_app/permissions.py
from rest_framework import permissions

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # 管理员可以访问任何对象
        if request.user.role == 'admin':
            return True
        
        # 对象所有者可以访问自己的对象
        # 假设对象有一个 'owner' 字段
        return obj.owner == request.user
``` 