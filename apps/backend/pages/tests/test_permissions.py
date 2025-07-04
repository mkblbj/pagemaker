"""
PageTemplate权限系统测试
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from rest_framework import permissions
from unittest.mock import Mock, patch

from pages.models import PageTemplate
from pages.permissions import (
    IsOwnerOrAdmin,
    IsOwnerOrReadOnly,
    IsAdminOrOwnerReadOnly,
    IsOwner,
    CanCreatePage,
    get_user_role,
    get_permission_classes_for_action,
)
from users.models import UserProfile

User = get_user_model()


class GetUserRoleTests(TestCase):
    """测试get_user_role辅助函数"""

    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="admin", email="admin@test.com", password="pass"
        )
        self.admin_user.is_superuser = True
        self.admin_user.save()

        self.editor_user = User.objects.create_user(
            username="editor", email="editor@test.com", password="pass"
        )
        UserProfile.objects.create(
            user=self.editor_user, role="editor", full_name="Editor User"
        )

        self.no_profile_user = User.objects.create_user(
            username="noprofile", email="noprofile@test.com", password="pass"
        )

    def test_get_user_role_unauthenticated(self):
        """测试未认证用户"""
        user = Mock()
        user.is_authenticated = False
        self.assertIsNone(get_user_role(user))

    def test_get_user_role_none_user(self):
        """测试None用户"""
        self.assertIsNone(get_user_role(None))

    def test_get_user_role_superuser(self):
        """测试超级用户"""
        self.assertEqual(get_user_role(self.admin_user), "admin")

    def test_get_user_role_editor(self):
        """测试编辑者用户"""
        self.assertEqual(get_user_role(self.editor_user), "editor")

    def test_get_user_role_no_profile(self):
        """测试没有profile的用户"""
        self.assertEqual(get_user_role(self.no_profile_user), "editor")


class IsOwnerOrAdminTests(TestCase):
    """测试IsOwnerOrAdmin权限类"""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.permission = IsOwnerOrAdmin()

        self.admin_user = User.objects.create_user(
            username="admin", email="admin@test.com", password="pass"
        )
        self.admin_user.is_superuser = True
        self.admin_user.save()

        self.editor_user = User.objects.create_user(
            username="editor", email="editor@test.com", password="pass"
        )
        UserProfile.objects.create(
            user=self.editor_user, role="editor", full_name="Editor User"
        )

        self.other_user = User.objects.create_user(
            username="other", email="other@test.com", password="pass"
        )
        UserProfile.objects.create(
            user=self.other_user, role="editor", full_name="Other User"
        )

        self.page = PageTemplate.objects.create(
            name="Test Page",
            content=[],
            target_area="test",
            owner=self.editor_user,
        )

    def test_has_permission_unauthenticated(self):
        """测试未认证用户的视图级权限"""
        request = self.factory.get("/")
        request.user = Mock()
        request.user.is_authenticated = False
        self.assertFalse(self.permission.has_permission(request, None))

    def test_has_permission_authenticated_editor(self):
        """测试认证的编辑者用户的视图级权限"""
        request = self.factory.get("/")
        request.user = self.editor_user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_has_permission_authenticated_admin(self):
        """测试认证的管理员用户的视图级权限"""
        request = self.factory.get("/")
        request.user = self.admin_user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_has_object_permission_owner(self):
        """测试所有者的对象级权限"""
        request = self.factory.get("/")
        request.user = self.editor_user
        self.assertTrue(self.permission.has_object_permission(request, None, self.page))

    def test_has_object_permission_admin(self):
        """测试管理员的对象级权限"""
        request = self.factory.get("/")
        request.user = self.admin_user
        self.assertTrue(self.permission.has_object_permission(request, None, self.page))

    def test_has_object_permission_other_user(self):
        """测试其他用户的对象级权限"""
        request = self.factory.get("/")
        request.user = self.other_user
        self.assertFalse(
            self.permission.has_object_permission(request, None, self.page)
        )

    def test_has_object_permission_unauthenticated(self):
        """测试未认证用户的对象级权限"""
        request = self.factory.get("/")
        request.user = Mock()
        request.user.is_authenticated = False
        self.assertFalse(
            self.permission.has_object_permission(request, None, self.page)
        )


class IsOwnerOrReadOnlyTests(TestCase):
    """测试IsOwnerOrReadOnly权限类"""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.permission = IsOwnerOrReadOnly()

        self.admin_user = User.objects.create_user(
            username="admin", email="admin@test.com", password="pass"
        )
        self.admin_user.is_superuser = True
        self.admin_user.save()

        self.editor_user = User.objects.create_user(
            username="editor", email="editor@test.com", password="pass"
        )
        UserProfile.objects.create(
            user=self.editor_user, role="editor", full_name="Editor User"
        )

        self.other_user = User.objects.create_user(
            username="other", email="other@test.com", password="pass"
        )
        UserProfile.objects.create(
            user=self.other_user, role="editor", full_name="Other User"
        )

        self.page = PageTemplate.objects.create(
            name="Test Page",
            content=[],
            target_area="test",
            owner=self.editor_user,
        )

    def test_has_permission_authenticated(self):
        """测试认证用户的视图级权限"""
        request = self.factory.get("/")
        request.user = self.editor_user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_has_permission_unauthenticated(self):
        """测试未认证用户的视图级权限"""
        request = self.factory.get("/")
        request.user = Mock()
        request.user.is_authenticated = False
        self.assertFalse(self.permission.has_permission(request, None))

    def test_has_object_permission_read_access(self):
        """测试读取权限"""
        request = self.factory.get("/")
        request.user = self.other_user
        self.assertTrue(self.permission.has_object_permission(request, None, self.page))

    def test_has_object_permission_write_owner(self):
        """测试所有者的写入权限"""
        request = self.factory.post("/")
        request.user = self.editor_user
        self.assertTrue(self.permission.has_object_permission(request, None, self.page))

    def test_has_object_permission_write_admin(self):
        """测试管理员的写入权限"""
        request = self.factory.post("/")
        request.user = self.admin_user
        self.assertTrue(self.permission.has_object_permission(request, None, self.page))

    def test_has_object_permission_write_other(self):
        """测试其他用户的写入权限"""
        request = self.factory.post("/")
        request.user = self.other_user
        self.assertFalse(
            self.permission.has_object_permission(request, None, self.page)
        )


class IsAdminOrOwnerReadOnlyTests(TestCase):
    """测试IsAdminOrOwnerReadOnly权限类"""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.permission = IsAdminOrOwnerReadOnly()

        self.admin_user = User.objects.create_user(
            username="admin", email="admin@test.com", password="pass"
        )
        self.admin_user.is_superuser = True
        self.admin_user.save()

        self.editor_user = User.objects.create_user(
            username="editor", email="editor@test.com", password="pass"
        )
        UserProfile.objects.create(
            user=self.editor_user, role="editor", full_name="Editor User"
        )

        self.page = PageTemplate.objects.create(
            name="Test Page",
            content=[],
            target_area="test",
            owner=self.editor_user,
        )

    def test_has_object_permission_admin_write(self):
        """测试管理员的写入权限"""
        request = self.factory.post("/")
        request.user = self.admin_user
        self.assertTrue(self.permission.has_object_permission(request, None, self.page))

    def test_has_object_permission_owner_read(self):
        """测试所有者的读取权限"""
        request = self.factory.get("/")
        request.user = self.editor_user
        self.assertTrue(self.permission.has_object_permission(request, None, self.page))

    def test_has_object_permission_owner_write(self):
        """测试所有者的写入权限（应该被拒绝）"""
        request = self.factory.post("/")
        request.user = self.editor_user
        self.assertFalse(
            self.permission.has_object_permission(request, None, self.page)
        )


class IsOwnerTests(TestCase):
    """测试IsOwner权限类"""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.permission = IsOwner()

        self.admin_user = User.objects.create_user(
            username="admin", email="admin@test.com", password="pass"
        )
        self.admin_user.is_superuser = True
        self.admin_user.save()

        self.editor_user = User.objects.create_user(
            username="editor", email="editor@test.com", password="pass"
        )
        UserProfile.objects.create(
            user=self.editor_user, role="editor", full_name="Editor User"
        )

        self.page = PageTemplate.objects.create(
            name="Test Page",
            content=[],
            target_area="test",
            owner=self.editor_user,
        )

    def test_has_object_permission_owner(self):
        """测试所有者权限"""
        request = self.factory.get("/")
        request.user = self.editor_user
        self.assertTrue(self.permission.has_object_permission(request, None, self.page))

    def test_has_object_permission_admin(self):
        """测试管理员权限（应该被拒绝）"""
        request = self.factory.get("/")
        request.user = self.admin_user
        self.assertFalse(
            self.permission.has_object_permission(request, None, self.page)
        )


class CanCreatePageTests(TestCase):
    """测试CanCreatePage权限类"""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.permission = CanCreatePage()

        self.admin_user = User.objects.create_user(
            username="admin", email="admin@test.com", password="pass"
        )
        self.admin_user.is_superuser = True
        self.admin_user.save()

        self.editor_user = User.objects.create_user(
            username="editor", email="editor@test.com", password="pass"
        )
        UserProfile.objects.create(
            user=self.editor_user, role="editor", full_name="Editor User"
        )

    def test_has_permission_admin(self):
        """测试管理员创建权限"""
        request = self.factory.post("/")
        request.user = self.admin_user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_has_permission_editor(self):
        """测试编辑者创建权限"""
        request = self.factory.post("/")
        request.user = self.editor_user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_has_permission_unauthenticated(self):
        """测试未认证用户创建权限"""
        request = self.factory.post("/")
        request.user = Mock()
        request.user.is_authenticated = False
        self.assertFalse(self.permission.has_permission(request, None))


class GetPermissionClassesForActionTests(TestCase):
    """测试get_permission_classes_for_action函数"""

    def test_list_action(self):
        """测试list动作的权限类"""
        permission_classes = get_permission_classes_for_action("list")
        self.assertEqual(permission_classes, [permissions.IsAuthenticated])

    def test_create_action(self):
        """测试create动作的权限类"""
        permission_classes = get_permission_classes_for_action("create")
        self.assertEqual(permission_classes, [CanCreatePage])

    def test_retrieve_action(self):
        """测试retrieve动作的权限类"""
        permission_classes = get_permission_classes_for_action("retrieve")
        self.assertEqual(permission_classes, [IsOwnerOrAdmin])

    def test_update_action(self):
        """测试update动作的权限类"""
        permission_classes = get_permission_classes_for_action("update")
        self.assertEqual(permission_classes, [IsOwnerOrAdmin])

    def test_partial_update_action(self):
        """测试partial_update动作的权限类"""
        permission_classes = get_permission_classes_for_action("partial_update")
        self.assertEqual(permission_classes, [IsOwnerOrAdmin])

    def test_destroy_action(self):
        """测试destroy动作的权限类"""
        permission_classes = get_permission_classes_for_action("destroy")
        self.assertEqual(permission_classes, [IsOwnerOrAdmin])

    def test_unknown_action(self):
        """测试未知动作的权限类"""
        permission_classes = get_permission_classes_for_action("unknown")
        self.assertEqual(permission_classes, [permissions.IsAuthenticated])
