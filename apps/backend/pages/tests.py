from django.test import TestCase

# Create your tests here.

class PagesAppTestCase(TestCase):
    """Pages应用测试"""

    def test_pages_app_config(self):
        """测试pages应用配置"""
        from pages.apps import PagesConfig
        
        self.assertEqual(PagesConfig.name, 'pages')
        self.assertEqual(PagesConfig.verbose_name, 'Pages')

    def test_pages_models_import(self):
        """测试pages模型导入"""
        try:
            from pages import models
            self.assertTrue(hasattr(models, 'models'))
        except ImportError:
            self.fail("无法导入pages.models")

    def test_pages_views_import(self):
        """测试pages视图导入"""
        try:
            from pages import views
            self.assertTrue(hasattr(views, 'render'))
        except ImportError:
            self.fail("无法导入pages.views")

    def test_pages_urls_import(self):
        """测试pages URLs导入"""
        try:
            from pages import urls
            self.assertTrue(hasattr(urls, 'urlpatterns'))
        except ImportError:
            self.fail("无法导入pages.urls")
