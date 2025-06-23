"""
Test Django settings configuration
"""
import pytest
from django.test import TestCase, override_settings
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.contrib.auth.models import User
from django.db import connection
from django.urls import reverse, resolve


class SettingsTest(TestCase):
    """Test Django settings configuration"""

    def test_database_configuration(self):
        """Test that database is configured correctly"""
        db_config = settings.DATABASES["default"]
        # 在测试环境中可能使用SQLite
        expected_engines = ["django.db.backends.mysql", "django.db.backends.sqlite3"]
        self.assertIn(db_config["ENGINE"], expected_engines)
        self.assertIn("NAME", db_config)

    def test_installed_apps(self):
        """Test that all required apps are installed"""
        required_apps = [
            "rest_framework",
            "rest_framework_simplejwt",
            "corsheaders",
            "users",
            "pages",
            "media",
            "api",
        ]
        for app in required_apps:
            self.assertIn(app, settings.INSTALLED_APPS)

    def test_middleware_configuration(self):
        """Test that required middleware is configured"""
        required_middleware = [
            "corsheaders.middleware.CorsMiddleware",
            "django.middleware.security.SecurityMiddleware",
        ]
        for middleware in required_middleware:
            self.assertIn(middleware, settings.MIDDLEWARE)

    def test_rest_framework_configuration(self):
        """Test that DRF is configured correctly"""
        self.assertIn("DEFAULT_AUTHENTICATION_CLASSES", settings.REST_FRAMEWORK)
        self.assertIn(
            "rest_framework_simplejwt.authentication.JWTAuthentication",
            settings.REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"],
        )


@pytest.mark.unit
class TestSettingsPytest:
    """Pytest version of settings tests"""

    def test_debug_mode(self):
        """Test debug mode setting"""
        assert isinstance(settings.DEBUG, bool)

    def test_secret_key_exists(self):
        """Test that secret key is configured"""
        assert settings.SECRET_KEY
        assert len(settings.SECRET_KEY) > 10 


@pytest.mark.unit
class SettingsTestCase(TestCase):
    """Django设置配置测试"""
    
    def test_installed_apps_configuration(self):
        """测试已安装应用配置"""
        required_apps = [
            'django.contrib.admin',
            'django.contrib.auth',
            'django.contrib.contenttypes',
            'django.contrib.sessions',
            'django.contrib.messages',
            'django.contrib.staticfiles',
            'rest_framework',
            'rest_framework_simplejwt',
            'corsheaders',
            'users',
            'pages',
            'media',
            'api',
        ]
        
        for app in required_apps:
            self.assertIn(app, settings.INSTALLED_APPS, f"应用 {app} 未在INSTALLED_APPS中配置")
    
    def test_middleware_configuration(self):
        """测试中间件配置"""
        required_middleware = [
            'corsheaders.middleware.CorsMiddleware',
            'django.middleware.security.SecurityMiddleware',
            'django.contrib.sessions.middleware.SessionMiddleware',
            'django.middleware.common.CommonMiddleware',
            'django.middleware.csrf.CsrfViewMiddleware',
            'django.contrib.auth.middleware.AuthenticationMiddleware',
            'django.contrib.messages.middleware.MessageMiddleware',
            'django.middleware.clickjacking.XFrameOptionsMiddleware',
        ]
        
        for middleware in required_middleware:
            self.assertIn(middleware, settings.MIDDLEWARE, f"中间件 {middleware} 未在MIDDLEWARE中配置")
    
    def test_database_configuration(self):
        """测试数据库配置"""
        self.assertIn('default', settings.DATABASES)
        db_config = settings.DATABASES['default']
        
        # 在测试环境中可能使用SQLite
        expected_engines = ['django.db.backends.mysql', 'django.db.backends.sqlite3']
        self.assertIn(db_config['ENGINE'], expected_engines)
        self.assertIn('NAME', db_config)
        
    def test_rest_framework_configuration(self):
        """测试Django REST Framework配置"""
        self.assertIn('DEFAULT_AUTHENTICATION_CLASSES', settings.REST_FRAMEWORK)
        self.assertIn('rest_framework_simplejwt.authentication.JWTAuthentication', 
                     settings.REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES'])
        
        self.assertIn('DEFAULT_PERMISSION_CLASSES', settings.REST_FRAMEWORK)
        self.assertIn('rest_framework.permissions.IsAuthenticated', 
                     settings.REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES'])
    
    def test_jwt_configuration(self):
        """测试JWT配置"""
        self.assertIn('ACCESS_TOKEN_LIFETIME', settings.SIMPLE_JWT)
        self.assertIn('REFRESH_TOKEN_LIFETIME', settings.SIMPLE_JWT)
        self.assertIn('ROTATE_REFRESH_TOKENS', settings.SIMPLE_JWT)
        self.assertIn('BLACKLIST_AFTER_ROTATION', settings.SIMPLE_JWT)
        
        # 验证JWT配置值 - 在测试环境中可能被禁用
        self.assertIsInstance(settings.SIMPLE_JWT['ROTATE_REFRESH_TOKENS'], bool)
        self.assertIsInstance(settings.SIMPLE_JWT['BLACKLIST_AFTER_ROTATION'], bool)
        self.assertEqual(settings.SIMPLE_JWT['ALGORITHM'], 'HS256')
    
    def test_internationalization_settings(self):
        """测试国际化设置"""
        self.assertEqual(settings.LANGUAGE_CODE, 'zh-hans')
        self.assertEqual(settings.TIME_ZONE, 'Asia/Tokyo')
        self.assertTrue(settings.USE_I18N)
        self.assertTrue(settings.USE_TZ)
    
    def test_static_and_media_settings(self):
        """测试静态文件和媒体文件设置"""
        # Django可能会自动添加前导斜杠
        self.assertIn(settings.STATIC_URL, ['static/', '/static/'])
        self.assertIn(settings.MEDIA_URL, ['media/', '/media/'])
        self.assertIsNotNone(settings.STATIC_ROOT)
        self.assertIsNotNone(settings.MEDIA_ROOT)


@pytest.mark.unit
class URLConfigurationTestCase(TestCase):
    """URL配置测试"""
    
    def test_admin_url_exists(self):
        """测试管理员URL存在"""
        url = reverse('admin:index')
        self.assertTrue(url.startswith('/admin/'))
    
    def test_jwt_token_urls_exist(self):
        """测试JWT令牌URL存在"""
        token_url = reverse('token_obtain_pair')
        refresh_url = reverse('token_refresh')
        
        self.assertEqual(token_url, '/api/v1/auth/token/')
        self.assertEqual(refresh_url, '/api/v1/auth/token/refresh/')
    
    def test_jwt_token_url_resolves(self):
        """测试JWT令牌URL解析"""
        resolver = resolve('/api/v1/auth/token/')
        self.assertEqual(resolver.view_name, 'token_obtain_pair')
        
        resolver = resolve('/api/v1/auth/token/refresh/')
        self.assertEqual(resolver.view_name, 'token_refresh')


@pytest.mark.integration
class DatabaseConnectionTestCase(TestCase):
    """数据库连接集成测试"""
    
    def test_database_connection(self):
        """测试数据库连接"""
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            self.assertEqual(result[0], 1)
    
    def test_user_model_creation(self):
        """测试用户模型创建"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('testpass123'))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
    
    def test_user_model_query(self):
        """测试用户模型查询"""
        # 创建测试用户
        User.objects.create_user(
            username='testuser1',
            email='test1@example.com',
            password='testpass123'
        )
        User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123'
        )
        
        # 测试查询
        users = User.objects.filter(username__startswith='testuser')
        self.assertEqual(users.count(), 2)
        
        user = User.objects.get(username='testuser1')
        self.assertEqual(user.email, 'test1@example.com')


@pytest.mark.unit
class SecuritySettingsTestCase(TestCase):
    """安全设置测试"""
    
    def test_secret_key_exists(self):
        """测试SECRET_KEY存在且不为空"""
        self.assertIsNotNone(settings.SECRET_KEY)
        self.assertNotEqual(settings.SECRET_KEY, '')
        self.assertGreater(len(settings.SECRET_KEY), 20)
    
    def test_debug_setting(self):
        """测试DEBUG设置"""
        # 在测试环境中DEBUG应该为True或根据环境变量设置
        self.assertIsInstance(settings.DEBUG, bool)
    
    def test_allowed_hosts_configuration(self):
        """测试ALLOWED_HOSTS配置"""
        self.assertIsInstance(settings.ALLOWED_HOSTS, list)
        # 在开发环境中应该包含localhost
        if settings.DEBUG:
            self.assertTrue(
                any(host in ['localhost', '127.0.0.1', '*'] for host in settings.ALLOWED_HOSTS)
            )
    
    def test_cors_configuration(self):
        """测试CORS配置"""
        # 检查CORS相关设置是否存在
        cors_settings = [
            'CORS_ALLOWED_ORIGINS',
            'CORS_ALLOW_ALL_ORIGINS',
            'CORS_ALLOW_CREDENTIALS'
        ]
        
        # 至少应该有一个CORS设置被配置
        has_cors_setting = any(hasattr(settings, setting) for setting in cors_settings)
        self.assertTrue(has_cors_setting, "至少应该配置一个CORS设置") 