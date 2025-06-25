from django.test import TestCase


class MediaAppTestCase(TestCase):
    """Media应用测试"""

    def test_media_app_config(self):
        """测试media应用配置"""
        from media.apps import MediaConfig
        
        self.assertEqual(MediaConfig.name, 'media')
        self.assertEqual(MediaConfig.verbose_name, 'Media')

    def test_media_models_import(self):
        """测试media模型导入"""
        try:
            from media import models
            self.assertTrue(hasattr(models, 'models'))
        except ImportError:
            self.fail("无法导入media.models")

    def test_media_views_import(self):
        """测试media视图导入"""
        try:
            from media import views
            self.assertTrue(hasattr(views, 'render'))
        except ImportError:
            self.fail("无法导入media.views")

    def test_media_urls_import(self):
        """测试media URLs导入"""
        try:
            from media import urls
            self.assertTrue(hasattr(urls, 'urlpatterns'))
        except ImportError:
            self.fail("无法导入media.urls")
