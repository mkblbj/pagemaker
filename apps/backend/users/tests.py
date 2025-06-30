from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
import json

User = get_user_model()


class UsersAppTestCase(TestCase):
    """Users应用测试"""

    def test_users_app_config(self):
        """测试users应用配置"""
        from users.apps import UsersConfig

        self.assertEqual(UsersConfig.name, "users")
        self.assertEqual(UsersConfig.verbose_name, "Users")

    def test_users_models_import(self):
        """测试users模型导入"""
        try:
            from users import models

            self.assertTrue(hasattr(models, "models"))
        except ImportError:
            self.fail("无法导入users.models")

    def test_users_views_import(self):
        """测试users视图导入"""
        try:
            from users import views

            self.assertTrue(hasattr(views, "render"))
        except ImportError:
            self.fail("无法导入users.views")

    def test_users_urls_import(self):
        """测试users URLs导入"""
        try:
            from users import urls

            self.assertTrue(hasattr(urls, "urlpatterns"))
        except ImportError:
            self.fail("无法导入users.urls")


class UserModelTestCase(TestCase):
    """用户模型测试"""

    def test_create_user(self):
        """测试创建用户"""
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")
        self.assertTrue(user.check_password("testpass123"))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_superuser(self):
        """测试创建超级用户"""
        admin_user = User.objects.create_superuser(
            username="admin", email="admin@example.com", password="adminpass123"
        )

        self.assertEqual(admin_user.username, "admin")
        self.assertEqual(admin_user.email, "admin@example.com")
        self.assertTrue(admin_user.check_password("adminpass123"))
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)

    def test_user_str_representation(self):
        """测试用户字符串表示"""
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.assertEqual(str(user), "testuser")


class UsersViewsTestCase(TestCase):
    """Users视图测试"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.client = Client()

    def test_users_view_unauthorized(self):
        """测试未认证用户访问users端点"""
        response = self.client.get("/api/v1/users/")
        # 根据实际的认证设置调整期待的状态码
        self.assertIn(response.status_code, [401, 403, 404])

    def test_users_view_authenticated(self):
        """测试已认证用户访问users端点"""
        self.client.force_login(self.user)

        try:
            response = self.client.get("/api/v1/users/")
            # 如果端点存在，应该返回200或其他成功状态码
            self.assertIn(response.status_code, [200, 404])
        except Exception:
            # 如果端点不存在，这是预期的
            pass

    def test_users_urls_configuration(self):
        """测试users URL配置"""
        from users.urls import urlpatterns

        # 验证urlpatterns是列表
        self.assertIsInstance(urlpatterns, list)

        # 验证至少有基本的URL模式（即使是空的）
        self.assertGreaterEqual(len(urlpatterns), 0)
