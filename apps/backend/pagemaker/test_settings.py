"""
Test-specific Django settings
"""
from .settings import *
import tempfile
import os

# 使用SQLite内存数据库进行测试
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# 禁用数据库迁移以加快测试速度
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# 测试环境设置
DEBUG = True
SECRET_KEY = 'test-secret-key-for-testing-only'

# 在测试中禁用JWT blacklist以避免数据库依赖
# INSTALLED_APPS = INSTALLED_APPS + [
#     'rest_framework_simplejwt.token_blacklist',
# ]

# 禁用JWT blacklist功能用于测试
SIMPLE_JWT = {
    **globals().get('SIMPLE_JWT', {}),
    'BLACKLIST_AFTER_ROTATION': False,
    'ROTATE_REFRESH_TOKENS': False,
}

# 修改静态文件URL以匹配生产设置
STATIC_URL = "static/"

# 禁用缓存
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# 测试时禁用日志
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'ERROR',
        },
    },
}

# 测试媒体文件存储
MEDIA_ROOT = tempfile.mkdtemp()
STATIC_ROOT = tempfile.mkdtemp()

# 禁用CORS检查
CORS_ALLOW_ALL_ORIGINS = True

# 简化密码验证
AUTH_PASSWORD_VALIDATORS = []

# 加快测试速度的设置
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
] 