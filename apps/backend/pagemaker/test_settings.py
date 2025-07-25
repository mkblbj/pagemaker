"""
Test-specific Django settings
"""

import tempfile
import os
from decouple import config as decouple_config

# 设置测试环境的默认环境变量
os.environ.setdefault(
    "DJANGO_SECRET_KEY", "test-secret-key-for-testing-only-do-not-use-in-production"
)

# 使用 .env 文件中的数据库配置，但数据库名改为测试专用
# 不再硬编码 localhost，而是使用环境变量中的远程数据库
# os.environ.setdefault("DATABASE_NAME", "pagemaker_test")  # 移除，让它使用.env配置
# os.environ.setdefault("DATABASE_USER", "root")           # 移除，让它使用.env配置  
# os.environ.setdefault("DATABASE_PASSWORD", "test_password")  # 移除，让它使用.env配置
# os.environ.setdefault("DATABASE_HOST", "localhost")      # 移除，让它使用.env配置
# os.environ.setdefault("DATABASE_PORT", "3306")           # 移除，让它使用.env配置

from .settings import *  # noqa: F403,F401

# 使用 SQLite 作为测试数据库，避免远程数据库依赖
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",  # 使用内存数据库，测试更快且无需配置
        "OPTIONS": {
            "timeout": 20,
        },
    }
}

# 测试环境设置
DEBUG = True

# 明确标记这是测试环境
TESTING = True

# 在测试中禁用JWT blacklist以避免数据库依赖
# INSTALLED_APPS = INSTALLED_APPS + [
#     'rest_framework_simplejwt.token_blacklist',
# ]

# 禁用JWT blacklist功能用于测试
SIMPLE_JWT = {
    **globals().get("SIMPLE_JWT", {}),
    "BLACKLIST_AFTER_ROTATION": False,
    "ROTATE_REFRESH_TOKENS": False,
}

# 修改静态文件URL以匹配生产设置
STATIC_URL = "static/"

# 禁用缓存
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.dummy.DummyCache",
    }
}

# 测试时禁用日志
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "ERROR",
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
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
