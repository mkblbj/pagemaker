"""
Test Django settings configuration
"""
import pytest
from django.test import TestCase
from django.conf import settings


class SettingsTest(TestCase):
    """Test Django settings configuration"""

    def test_database_configuration(self):
        """Test that database is configured correctly"""
        db_config = settings.DATABASES["default"]
        self.assertEqual(db_config["ENGINE"], "django.db.backends.mysql")
        self.assertIn("NAME", db_config)
        self.assertIn("USER", db_config)
        self.assertIn("HOST", db_config)

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