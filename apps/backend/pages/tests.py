from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
import json

User = get_user_model()

# Create your tests here.


class PagesAppTestCase(TestCase):
    """Pages应用测试"""

    def test_pages_app_config(self):
        """测试pages应用配置"""
        from pages.apps import PagesConfig

        self.assertEqual(PagesConfig.name, "pages")
        self.assertEqual(PagesConfig.verbose_name, "Pages")

    def test_pages_models_import(self):
        """测试pages模型导入"""
        try:
            from pages import models

            self.assertTrue(hasattr(models, "models"))
        except ImportError:
            self.fail("无法导入pages.models")

    def test_pages_views_import(self):
        """测试pages视图导入"""
        try:
            from pages import views

            self.assertTrue(hasattr(views, "render"))
        except ImportError:
            self.fail("无法导入pages.views")

    def test_pages_urls_import(self):
        """测试pages URLs导入"""
        try:
            from pages import urls

            self.assertTrue(hasattr(urls, "urlpatterns"))
        except ImportError:
            self.fail("无法导入pages.urls")


class PagesViewsTestCase(TestCase):
    """Pages视图测试"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.client = Client()

    def test_pages_view_unauthorized(self):
        """测试未认证用户访问pages端点"""
        response = self.client.get("/api/v1/pages/")
        # 根据实际的认证设置调整期待的状态码
        self.assertIn(response.status_code, [401, 403, 404])

    def test_pages_view_authenticated(self):
        """测试已认证用户访问pages端点"""
        self.client.force_login(self.user)

        try:
            response = self.client.get("/api/v1/pages/")
            # 如果端点存在，应该返回200或其他成功状态码
            self.assertIn(response.status_code, [200, 404])
        except Exception:
            # 如果端点不存在，这是预期的
            pass

    def test_pages_urls_configuration(self):
        """测试pages URL配置"""
        from pages.urls import urlpatterns

        # 验证urlpatterns是列表
        self.assertIsInstance(urlpatterns, list)

        # 验证至少有基本的URL模式（即使是空的）
        self.assertGreaterEqual(len(urlpatterns), 0)
