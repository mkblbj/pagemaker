"""
Django Apps Structure Tests
"""
import pytest
from django.test import TestCase
from django.apps import apps
from django.conf import settings
import os


@pytest.mark.unit
class AppsStructureTestCase(TestCase):
    """Django应用结构测试"""
    
    def test_required_apps_are_installed(self):
        """测试必需的应用已安装"""
        required_local_apps = ['users', 'pages', 'media', 'api']
        
        for app_name in required_local_apps:
            self.assertIn(app_name, settings.INSTALLED_APPS, f"应用 {app_name} 未安装")
            
            # 测试应用能否正确加载
            app_config = apps.get_app_config(app_name)
            self.assertIsNotNone(app_config)
            self.assertEqual(app_config.name, app_name)
    
    def test_users_app_configuration(self):
        """测试users应用配置"""
        app_config = apps.get_app_config('users')
        
        self.assertEqual(app_config.name, 'users')
        self.assertEqual(app_config.verbose_name, 'Users')
        
        # 检查应用目录结构
        app_path = app_config.path
        self.assertTrue(os.path.exists(app_path))
        
        required_files = ['__init__.py', 'apps.py', 'models.py', 'views.py', 'urls.py']
        for file_name in required_files:
            file_path = os.path.join(app_path, file_name)
            self.assertTrue(os.path.exists(file_path), f"文件 {file_name} 在 users 应用中不存在")
    
    def test_pages_app_configuration(self):
        """测试pages应用配置"""
        app_config = apps.get_app_config('pages')
        
        self.assertEqual(app_config.name, 'pages')
        self.assertEqual(app_config.verbose_name, 'Pages')
        
        # 检查应用目录结构
        app_path = app_config.path
        self.assertTrue(os.path.exists(app_path))
        
        required_files = ['__init__.py', 'apps.py', 'models.py', 'views.py', 'urls.py']
        for file_name in required_files:
            file_path = os.path.join(app_path, file_name)
            self.assertTrue(os.path.exists(file_path), f"文件 {file_name} 在 pages 应用中不存在")
    
    def test_media_app_configuration(self):
        """测试media应用配置"""
        app_config = apps.get_app_config('media')
        
        self.assertEqual(app_config.name, 'media')
        self.assertEqual(app_config.verbose_name, 'Media')
        
        # 检查应用目录结构
        app_path = app_config.path
        self.assertTrue(os.path.exists(app_path))
        
        required_files = ['__init__.py', 'apps.py', 'models.py', 'views.py', 'urls.py']
        for file_name in required_files:
            file_path = os.path.join(app_path, file_name)
            self.assertTrue(os.path.exists(file_path), f"文件 {file_name} 在 media 应用中不存在")
    
    def test_api_app_configuration(self):
        """测试api应用配置"""
        app_config = apps.get_app_config('api')
        
        self.assertEqual(app_config.name, 'api')
        self.assertEqual(app_config.verbose_name, 'Api')
        
        # 检查应用目录结构
        app_path = app_config.path
        self.assertTrue(os.path.exists(app_path))
        
        required_files = ['__init__.py', 'apps.py', 'models.py', 'views.py', 'urls.py']
        for file_name in required_files:
            file_path = os.path.join(app_path, file_name)
            self.assertTrue(os.path.exists(file_path), f"文件 {file_name} 在 api 应用中不存在")
    
    def test_migrations_directories_exist(self):
        """测试迁移目录存在"""
        local_apps = ['users', 'pages', 'media', 'api']
        
        for app_name in local_apps:
            app_config = apps.get_app_config(app_name)
            migrations_path = os.path.join(app_config.path, 'migrations')
            
            self.assertTrue(os.path.exists(migrations_path), 
                          f"迁移目录在 {app_name} 应用中不存在")
            
            # 检查__init__.py文件存在
            init_file = os.path.join(migrations_path, '__init__.py')
            self.assertTrue(os.path.exists(init_file), 
                          f"__init__.py 文件在 {app_name}/migrations 中不存在")


@pytest.mark.unit
class ProjectStructureTestCase(TestCase):
    """项目结构测试"""
    
    def test_project_root_files_exist(self):
        """测试项目根目录文件存在"""
        base_dir = settings.BASE_DIR
        
        required_files = [
            'manage.py',
            'requirements.txt',
            'pytest.ini',
            'pyproject.toml',
            '.flake8'
        ]
        
        for file_name in required_files:
            file_path = os.path.join(base_dir, file_name)
            self.assertTrue(os.path.exists(file_path), f"文件 {file_name} 在项目根目录中不存在")
    
    def test_pagemaker_package_structure(self):
        """测试pagemaker包结构"""
        base_dir = settings.BASE_DIR
        pagemaker_dir = os.path.join(base_dir, 'pagemaker')
        
        self.assertTrue(os.path.exists(pagemaker_dir), "pagemaker目录不存在")
        
        required_files = [
            '__init__.py',
            'settings.py',
            'urls.py',
            'wsgi.py',
            'asgi.py'
        ]
        
        for file_name in required_files:
            file_path = os.path.join(pagemaker_dir, file_name)
            self.assertTrue(os.path.exists(file_path), 
                          f"文件 {file_name} 在 pagemaker 包中不存在")
    
    def test_tests_directory_structure(self):
        """测试tests目录结构"""
        base_dir = settings.BASE_DIR
        tests_dir = os.path.join(base_dir, 'tests')
        
        self.assertTrue(os.path.exists(tests_dir), "tests目录不存在")
        
        # 检查__init__.py文件存在
        init_file = os.path.join(tests_dir, '__init__.py')
        self.assertTrue(os.path.exists(init_file), "__init__.py 文件在 tests 目录中不存在")


@pytest.mark.unit
class ThirdPartyAppsTestCase(TestCase):
    """第三方应用测试"""
    
    def test_rest_framework_installed(self):
        """测试Django REST Framework已安装"""
        self.assertIn('rest_framework', settings.INSTALLED_APPS)
        
        # 测试能否导入
        try:
            import rest_framework
            self.assertTrue(True)
        except ImportError:
            self.fail("无法导入 rest_framework")
    
    def test_rest_framework_simplejwt_installed(self):
        """测试Django REST Framework SimpleJWT已安装"""
        self.assertIn('rest_framework_simplejwt', settings.INSTALLED_APPS)
        
        # 测试能否导入
        try:
            import rest_framework_simplejwt
            self.assertTrue(True)
        except ImportError:
            self.fail("无法导入 rest_framework_simplejwt")
    
    def test_corsheaders_installed(self):
        """测试django-cors-headers已安装"""
        self.assertIn('corsheaders', settings.INSTALLED_APPS)
        
        # 测试能否导入
        try:
            import corsheaders
            self.assertTrue(True)
        except ImportError:
            self.fail("无法导入 corsheaders")
        
        # 测试中间件已配置
        self.assertIn('corsheaders.middleware.CorsMiddleware', settings.MIDDLEWARE)
    
    def test_pymysql_configuration(self):
        """测试PyMySQL配置"""
        # 测试能否导入
        try:
            import pymysql
            self.assertTrue(True)
        except ImportError:
            self.fail("无法导入 pymysql")
        
        # 测试数据库引擎配置 - 在测试环境中可能使用SQLite
        db_engine = settings.DATABASES['default']['ENGINE']
        expected_engines = ['django.db.backends.mysql', 'django.db.backends.sqlite3']
        self.assertIn(db_engine, expected_engines)


@pytest.mark.integration
class AppsIntegrationTestCase(TestCase):
    """应用集成测试"""
    
    def test_all_apps_can_be_imported(self):
        """测试所有应用都能被正确导入"""
        local_apps = ['users', 'pages', 'media', 'api']
        
        for app_name in local_apps:
            try:
                app_module = __import__(app_name)
                self.assertIsNotNone(app_module)
            except ImportError as e:
                self.fail(f"无法导入应用 {app_name}: {e}")
    
    def test_apps_ready_state(self):
        """测试应用准备状态"""
        self.assertTrue(apps.ready, "Django应用未准备就绪")
        
        # 测试所有应用都已加载
        local_apps = ['users', 'pages', 'media', 'api']
        for app_name in local_apps:
            self.assertTrue(apps.is_installed(app_name), f"应用 {app_name} 未正确安装")
    
    def test_url_patterns_loadable(self):
        """测试URL模式可加载"""
        try:
            from django.urls import get_resolver
            resolver = get_resolver()
            self.assertIsNotNone(resolver)
            
            # 测试能获取URL模式
            url_patterns = resolver.url_patterns
            self.assertGreater(len(url_patterns), 0, "没有找到URL模式")
            
        except Exception as e:
            self.fail(f"无法加载URL模式: {e}") 