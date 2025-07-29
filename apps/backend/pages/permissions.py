from rest_framework import permissions
from users.models import get_user_profile


def get_user_role(user):
    """获取用户角色的辅助函数"""
    if not user or not user.is_authenticated:
        return None

    if user.is_superuser:
        return "admin"

    try:
        profile = get_user_profile(user)
        return profile.role
    except Exception:
        return "editor"  # 默认角色


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    自定义权限类：只有页面所有者或管理员可以访问页面

    - admin角色：可以访问所有页面
    - editor角色：只能访问自己创建的页面
    """

    def has_permission(self, request, view):
        """
        视图级权限检查

        Args:
            request: HTTP请求对象
            view: 视图对象

        Returns:
            bool: 是否有权限访问视图
        """
        # 必须是已认证用户
        if not request.user or not request.user.is_authenticated:
            return False

        # 检查用户是否有有效的角色
        user_role = get_user_role(request.user)
        if user_role not in ["admin", "editor"]:
            return False

        return True

    def has_object_permission(self, request, view, obj):
        """
        对象级权限检查

        Args:
            request: HTTP请求对象
            view: 视图对象
            obj: PageTemplate对象

        Returns:
            bool: 是否有权限访问该对象
        """
        # 必须是已认证用户
        if not request.user or not request.user.is_authenticated:
            return False

        # 获取用户角色
        user_role = get_user_role(request.user)

        # admin角色可以访问所有页面
        if user_role == "admin":
            return True

        # editor角色只能访问自己的页面
        if user_role == "editor":
            return obj.owner == request.user

        # 其他情况拒绝访问
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    自定义权限类：所有者可以读写，其他人只能读取

    注意：这个权限类主要用于特殊场景，一般情况下使用IsOwnerOrAdmin
    """

    def has_permission(self, request, view):
        """视图级权限检查"""
        # 必须是已认证用户
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """对象级权限检查"""
        # 读取权限对所有已认证用户开放
        if request.method in permissions.SAFE_METHODS:
            return True

        # 写入权限只给所有者或管理员
        user_role = get_user_role(request.user)
        if user_role == "admin":
            return True

        return obj.owner == request.user


class IsAdminOrOwnerReadOnly(permissions.BasePermission):
    """
    自定义权限类：管理员可以读写，所有者只能读取

    用于需要管理员权限才能修改的场景
    """

    def has_permission(self, request, view):
        """视图级权限检查"""
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """对象级权限检查"""
        user_role = get_user_role(request.user)

        # 管理员有完全权限
        if user_role == "admin":
            return True

        # 所有者只有读取权限
        if request.method in permissions.SAFE_METHODS and obj.owner == request.user:
            return True

        return False


class IsOwner(permissions.BasePermission):
    """
    自定义权限类：只有所有者可以访问

    严格的权限控制，连管理员也不能访问其他人的资源
    """

    def has_permission(self, request, view):
        """视图级权限检查"""
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """对象级权限检查"""
        return obj.owner == request.user


class CanCreatePage(permissions.BasePermission):
    """
    自定义权限类：检查用户是否可以创建页面

    可以在这里添加创建页面的业务限制，比如：
    - 用户页面数量限制
    - 用户等级限制
    - 时间限制等
    """

    def has_permission(self, request, view):
        """视图级权限检查"""
        if not request.user or not request.user.is_authenticated:
            return False

        # 检查用户角色
        user_role = get_user_role(request.user)
        if user_role not in ["admin", "editor"]:
            return False

        # 这里可以添加更多业务规则
        # 例如：检查用户是否达到页面创建上限
        # if user_role == 'editor':
        #     page_count = request.user.page_templates.count()
        #     if page_count >= 10:  # 假设editor最多创建10个页面
        #         return False

        return True


def get_permission_classes_for_action(action):
    """
    根据视图动作返回相应的权限类列表

    Args:
        action: 视图动作名称 ('list', 'create', 'retrieve', 'update', 'destroy')

    Returns:
        list: 权限类列表
    """
    permission_mapping = {
        "list": [permissions.IsAuthenticated],
        "create": [CanCreatePage],
        "retrieve": [IsOwnerOrAdmin],
        "update": [IsOwnerOrAdmin],
        "partial_update": [IsOwnerOrAdmin],
        "destroy": [IsOwnerOrAdmin],
    }

    return permission_mapping.get(action, [permissions.IsAuthenticated])


class PageTemplatePermissionMixin:
    """
    PageTemplate视图的权限混入类

    提供统一的权限管理方法
    """

    def get_permissions(self):
        """
        根据当前动作返回相应的权限实例
        """
        permission_classes = get_permission_classes_for_action(self.action)
        return [permission() for permission in permission_classes]

    def check_object_permissions(self, request, obj):
        """
        检查对象权限的辅助方法
        """
        for permission in self.get_permissions():
            if hasattr(permission, "has_object_permission"):
                if not permission.has_object_permission(request, self, obj):
                    self.permission_denied(
                        request,
                        message=getattr(permission, "message", None),
                        code=getattr(permission, "code", None),
                    )

    def filter_queryset_by_permissions(self, queryset):
        """
        根据用户权限过滤查询集

        Args:
            queryset: 原始查询集

        Returns:
            QuerySet: 过滤后的查询集
        """
        user = self.request.user

        if not user or not user.is_authenticated:
            return queryset.none()

        user_role = get_user_role(user)
        if user_role == "admin":
            # 管理员可以看到所有页面
            return queryset
        elif user_role == "editor":
            # 编辑者只能看到自己的页面
            return queryset.filter(owner=user)
        else:
            # 其他角色无权限
            return queryset.none()
