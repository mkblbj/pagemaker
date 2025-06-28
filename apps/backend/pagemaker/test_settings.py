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
os.environ.setdefault("DATABASE_NAME", "pagemaker_test")
# 注意：以下root用户配置仅用于CI/CD测试环境
# 生产环境绝对不可使用root用户！请使用专用的数据库用户
os.environ.setdefault("DATABASE_USER", "root")  # CI/CD测试环境专用
os.environ.setdefault("DATABASE_PASSWORD", "test_password")  # CI/CD测试环境专用
os.environ.setdefault("DATABASE_HOST", "localhost")
os.environ.setdefault("DATABASE_PORT", "3306")

from .settings import *  # noqa: F403,F401

# 使用专用的测试数据库配置
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": decouple_config("DATABASE_NAME"),
        "USER": decouple_config("DATABASE_USER"),
        "PASSWORD": decouple_config("DATABASE_PASSWORD"),
        "HOST": decouple_config("DATABASE_HOST"),
        "PORT": decouple_config("DATABASE_PORT", default="3306"),
        "OPTIONS": {
            "charset": "utf8mb4",
            "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
        },
        "TEST": {
            "NAME": "test_" + decouple_config("DATABASE_NAME"),  # 使用独立的测试数据库
            "CREATE_DB": True,  # 允许创建测试数据库
            "CHARSET": "utf8mb4",
            "COLLATION": "utf8mb4_unicode_ci",
        },
    }
}

# 测试环境设置
DEBUG = True

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
