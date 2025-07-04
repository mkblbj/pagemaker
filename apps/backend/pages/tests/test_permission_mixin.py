"""
PageTemplatePermissionMixin测试
测试权限混入类的所有方法
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from rest_framework.exceptions import PermissionDenied
from unittest.mock import Mock

from pages.models import PageTemplate
from pages.permissions import PageTemplatePermissionMixin, IsOwnerOrAdmin
from users.models import UserProfile

User = get_user_model()


class MockView(PageTemplatePermissionMixin):
    """模拟视图类用于测试"""
    
    def __init__(self, action="list"):
        self.action = action
        self.request = None
    
    def permission_denied(self, request, message=None, code=None):
        """模拟权限拒绝方法"""
        raise PermissionDenied(message or "Permission denied")


class PageTemplatePermissionMixinTests(TestCase):
    """PageTemplatePermissionMixin测试"""

    def setUp(self):
        self.factory = APIRequestFactory()
        
        # 创建admin用户
        self.admin_user = User.objects.create_user(
            username="admin", email="admin@test.com", password="pass"
        )
        self.admin_user.is_superuser = True
        self.admin_user.save()
        UserProfile.objects.create(
            user=self.admin_user, role="admin", full_name="Admin User"
        )

        # 创建editor用户
        self.editor_user = User.objects.create_user(
            username="editor", email="editor@test.com", password="pass"
        )
        UserProfile.objects.create(
            user=self.editor_user, role="editor", full_name="Editor User"
        )

        # 创建另一个editor用户
        self.other_editor = User.objects.create_user(
            username="other", email="other@test.com", password="pass"
        )
        UserProfile.objects.create(
            user=self.other_editor, role="editor", full_name="Other Editor"
        )

        # 创建测试页面
        self.page = PageTemplate.objects.create(
            name="Test Page",
            content=[{"id": "1", "type": "title"}],
            target_area="pc",
            owner=self.editor_user,
        )

    def test_get_permissions_list_action(self):
        """测试list动作的权限获取"""
        view = MockView(action="list")
        permissions = view.get_permissions()
        
        self.assertEqual(len(permissions), 1)
        # 应该是IsAuthenticated权限
        self.assertEqual(permissions[0].__class__.__name__, "IsAuthenticated")

    def test_get_permissions_create_action(self):
        """测试create动作的权限获取"""
        view = MockView(action="create")
        permissions = view.get_permissions()
        
        self.assertEqual(len(permissions), 1)
        # 应该是CanCreatePage权限
        self.assertEqual(permissions[0].__class__.__name__, "CanCreatePage")

    def test_get_permissions_retrieve_action(self):
        """测试retrieve动作的权限获取"""
        view = MockView(action="retrieve")
        permissions = view.get_permissions()
        
        self.assertEqual(len(permissions), 1)
        # 应该是IsOwnerOrAdmin权限
        self.assertEqual(permissions[0].__class__.__name__, "IsOwnerOrAdmin")

    def test_get_permissions_update_action(self):
        """测试update动作的权限获取"""
        view = MockView(action="update")
        permissions = view.get_permissions()
        
        self.assertEqual(len(permissions), 1)
        self.assertEqual(permissions[0].__class__.__name__, "IsOwnerOrAdmin")

    def test_get_permissions_partial_update_action(self):
        """测试partial_update动作的权限获取"""
        view = MockView(action="partial_update")
        permissions = view.get_permissions()
        
        self.assertEqual(len(permissions), 1)
        self.assertEqual(permissions[0].__class__.__name__, "IsOwnerOrAdmin")

    def test_get_permissions_destroy_action(self):
        """测试destroy动作的权限获取"""
        view = MockView(action="destroy")
        permissions = view.get_permissions()
        
        self.assertEqual(len(permissions), 1)
        self.assertEqual(permissions[0].__class__.__name__, "IsOwnerOrAdmin")

    def test_get_permissions_unknown_action(self):
        """测试未知动作的权限获取"""
        view = MockView(action="unknown")
        permissions = view.get_permissions()
        
        self.assertEqual(len(permissions), 1)
        self.assertEqual(permissions[0].__class__.__name__, "IsAuthenticated")

    def test_check_object_permissions_success(self):
        """测试对象权限检查成功"""
        request = self.factory.get("/")
        request.user = self.editor_user
        
        view = MockView(action="retrieve")
        view.request = request
        
        # 应该不抛出异常
        try:
            view.check_object_permissions(request, self.page)
        except PermissionDenied:
            self.fail("check_object_permissions raised PermissionDenied unexpectedly")

    def test_check_object_permissions_denied(self):
        """测试对象权限检查被拒绝"""
        request = self.factory.get("/")
        request.user = self.other_editor  # 不是页面所有者
        
        view = MockView(action="retrieve")
        view.request = request
        
        # 应该抛出PermissionDenied异常
        with self.assertRaises(PermissionDenied):
            view.check_object_permissions(request, self.page)

    def test_check_object_permissions_no_object_permission_method(self):
        """测试权限类没有has_object_permission方法"""
        request = self.factory.get("/")
        request.user = self.editor_user
        
        view = MockView(action="list")  # IsAuthenticated没有has_object_permission
        view.request = request
        
        # 应该不抛出异常
        try:
            view.check_object_permissions(request, self.page)
        except PermissionDenied:
            self.fail("check_object_permissions raised PermissionDenied unexpectedly")

    def test_filter_queryset_by_permissions_admin(self):
        """测试管理员的查询集过滤"""
        request = self.factory.get("/")
        request.user = self.admin_user
        
        view = MockView()
        view.request = request
        
        queryset = PageTemplate.objects.all()
        filtered_queryset = view.filter_queryset_by_permissions(queryset)
        
        # 管理员应该能看到所有页面
        self.assertEqual(filtered_queryset.count(), queryset.count())

    def test_filter_queryset_by_permissions_editor(self):
        """测试编辑者的查询集过滤"""
        request = self.factory.get("/")
        request.user = self.editor_user
        
        view = MockView()
        view.request = request
        
        queryset = PageTemplate.objects.all()
        filtered_queryset = view.filter_queryset_by_permissions(queryset)
        
        # 编辑者只能看到自己的页面
        self.assertEqual(filtered_queryset.count(), 1)
        self.assertEqual(filtered_queryset.first(), self.page)

    def test_filter_queryset_by_permissions_unauthenticated(self):
        """测试未认证用户的查询集过滤"""
        request = self.factory.get("/")
        request.user = Mock()
        request.user.is_authenticated = False
        
        view = MockView()
        view.request = request
        
        queryset = PageTemplate.objects.all()
        filtered_queryset = view.filter_queryset_by_permissions(queryset)
        
        # 未认证用户看不到任何页面
        self.assertEqual(filtered_queryset.count(), 0)

    def test_filter_queryset_by_permissions_no_user(self):
        """测试没有用户的查询集过滤"""
        request = self.factory.get("/")
        request.user = None
        
        view = MockView()
        view.request = request
        
        queryset = PageTemplate.objects.all()
        filtered_queryset = view.filter_queryset_by_permissions(queryset)
        
        # 没有用户时看不到任何页面
        self.assertEqual(filtered_queryset.count(), 0)

    def test_filter_queryset_by_permissions_unknown_role(self):
        """测试未知角色的查询集过滤"""
        # 创建没有profile的用户
        unknown_user = User.objects.create_user(
            username="unknown", email="unknown@test.com", password="pass"
        )
        # 不创建UserProfile，让其返回默认角色
        
        request = self.factory.get("/")
        request.user = unknown_user
        
        view = MockView()
        view.request = request
        
        queryset = PageTemplate.objects.all()
        filtered_queryset = view.filter_queryset_by_permissions(queryset)
        
        # 默认角色是editor，应该能看到自己的页面（虽然没有）
        self.assertEqual(filtered_queryset.count(), 0) 