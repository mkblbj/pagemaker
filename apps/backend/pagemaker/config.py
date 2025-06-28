"""
Pagemaker项目统一配置管理模块

该模块提供统一的环境变量获取和验证机制，遵循Django最佳实践。
所有应用应通过此模块获取配置，而不是直接使用os.getenv或decouple.config。

使用方式:
    from pagemaker.config import config
    
    # 获取数据库配置
    db_host = config.DATABASE_HOST
    
    # 获取乐天API配置
    rakuten_secret = config.RAKUTEN_SERVICE_SECRET
"""

import os
from typing import Any, Optional, Union, List
from decouple import config as decouple_config, Csv
from pathlib import Path


class ConfigError(Exception):
    """配置错误异常"""
    pass


class ConfigManager:
    """
    统一配置管理器
    
    提供类型安全的配置获取方法，支持默认值、类型转换和验证。
    """
    
    def __init__(self):
        """初始化配置管理器"""
        self._validate_environment()
    
    def _validate_environment(self) -> None:
        """验证关键环境变量是否存在"""
        required_vars = [
            'DJANGO_SECRET_KEY',
            'DATABASE_NAME',
            'DATABASE_USER',
            'DATABASE_PASSWORD',
            'DATABASE_HOST',
        ]
        
        missing_vars = []
        for var in required_vars:
            if not decouple_config(var, default=None):
                missing_vars.append(var)
        
        if missing_vars:
            raise ConfigError(
                f"缺少必需的环境变量: {', '.join(missing_vars)}. "
                f"请检查.env文件是否存在并正确配置。"
            )
    
    def get(self, key: str, default: Any = None, cast: type = str) -> Any:
        """
        获取配置值
        
        Args:
            key: 环境变量名
            default: 默认值
            cast: 类型转换函数
            
        Returns:
            配置值
        """
        return decouple_config(key, default=default, cast=cast)
    
    def get_bool(self, key: str, default: bool = False) -> bool:
        """获取布尔类型配置"""
        return decouple_config(key, default=default, cast=bool)
    
    def get_int(self, key: str, default: int = 0) -> int:
        """获取整数类型配置"""
        return decouple_config(key, default=default, cast=int)
    
    def get_list(self, key: str, default: Optional[List[str]] = None) -> List[str]:
        """获取列表类型配置（逗号分隔）"""
        if default is None:
            default = []
        return decouple_config(key, default=default, cast=Csv())
    
    # ==========================================
    # Django 核心配置
    # ==========================================
    
    @property
    def SECRET_KEY(self) -> str:
        """Django密钥"""
        return decouple_config('DJANGO_SECRET_KEY')
    
    @property
    def DEBUG(self) -> bool:
        """调试模式"""
        return decouple_config('DJANGO_DEBUG', default=True, cast=bool)
    
    @property
    def ALLOWED_HOSTS(self) -> List[str]:
        """允许的主机"""
        return decouple_config(
            'DJANGO_ALLOWED_HOSTS',
            default='localhost,127.0.0.1',
            cast=Csv()
        )
    
    # ==========================================
    # 数据库配置
    # ==========================================
    
    @property
    def DATABASE_NAME(self) -> str:
        """数据库名称"""
        return decouple_config('DATABASE_NAME')
    
    @property
    def DATABASE_USER(self) -> str:
        """数据库用户名"""
        return decouple_config('DATABASE_USER')
    
    @property
    def DATABASE_PASSWORD(self) -> str:
        """数据库密码"""
        return decouple_config('DATABASE_PASSWORD')
    
    @property
    def DATABASE_HOST(self) -> str:
        """数据库主机"""
        return decouple_config('DATABASE_HOST')
    
    @property
    def DATABASE_PORT(self) -> str:
        """数据库端口"""
        return decouple_config('DATABASE_PORT', default='3306')
    
    @property
    def DATABASE_URL(self) -> Optional[str]:
        """数据库URL（可选）"""
        return decouple_config('DATABASE_URL', default=None)
    
    # ==========================================
    # 乐天API配置
    # ==========================================
    
    @property
    def RAKUTEN_SERVICE_SECRET(self) -> Optional[str]:
        """乐天服务密钥"""
        return decouple_config('RAKUTEN_SERVICE_SECRET', default=None)
    
    @property
    def RAKUTEN_LICENSE_KEY(self) -> Optional[str]:
        """乐天许可密钥"""
        return decouple_config('RAKUTEN_LICENSE_KEY', default=None)
    
    @property
    def RAKUTEN_FTP_HOST(self) -> Optional[str]:
        """乐天FTP主机"""
        return decouple_config('RAKUTEN_FTP_HOST', default=None)
    
    @property
    def RAKUTEN_FTP_USERNAME(self) -> Optional[str]:
        """乐天FTP用户名"""
        return decouple_config('RAKUTEN_FTP_USERNAME', default=None)
    
    @property
    def RAKUTEN_FTP_PASSWORD(self) -> Optional[str]:
        """乐天FTP密码"""
        return decouple_config('RAKUTEN_FTP_PASSWORD', default=None)
    
    @property
    def RAKUTEN_API_TEST_MODE(self) -> str:
        """乐天API测试模式"""
        return decouple_config('RAKUTEN_API_TEST_MODE', default='mock')
    
    @property
    def RAKUTEN_API_BASE_URL(self) -> str:
        """乐天API基础URL"""
        return decouple_config(
            'RAKUTEN_API_BASE_URL', 
            default='https://api.rms.rakuten.co.jp'
        )
    
    @property
    def RAKUTEN_API_TIMEOUT(self) -> int:
        """乐天API超时时间"""
        return decouple_config('RAKUTEN_API_TIMEOUT', default=30, cast=int)
    
    # ==========================================
    # CORS配置
    # ==========================================
    
    @property
    def CORS_ALLOWED_ORIGINS(self) -> List[str]:
        """CORS允许的源"""
        return decouple_config(
            'DJANGO_CORS_ALLOWED_ORIGINS',
            default='http://localhost:3000,http://127.0.0.1:3000',
            cast=Csv()
        )
    
    # ==========================================
    # 媒体和静态文件配置
    # ==========================================
    
    @property
    def MEDIA_ROOT(self) -> str:
        """媒体文件根目录"""
        return decouple_config('MEDIA_ROOT', default='media_files/')
    
    @property
    def MEDIA_URL(self) -> str:
        """媒体文件URL"""
        return decouple_config('MEDIA_URL', default='/media/')
    
    @property
    def STATIC_URL(self) -> str:
        """静态文件URL"""
        return decouple_config('STATIC_URL', default='/static/')
    
    @property
    def STATIC_ROOT(self) -> str:
        """静态文件根目录"""
        return decouple_config('STATIC_ROOT', default='staticfiles/')
    
    # ==========================================
    # JWT配置
    # ==========================================
    
    @property
    def JWT_ACCESS_TOKEN_LIFETIME_MINUTES(self) -> int:
        """JWT访问令牌生命周期（分钟）"""
        return decouple_config('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', default=60, cast=int)
    
    @property
    def JWT_REFRESH_TOKEN_LIFETIME_DAYS(self) -> int:
        """JWT刷新令牌生命周期（天）"""
        return decouple_config('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=7, cast=int)
    
    # ==========================================
    # 开发和调试配置
    # ==========================================
    
    @property
    def LOG_LEVEL(self) -> str:
        """日志级别"""
        return decouple_config('LOG_LEVEL', default='INFO')
    
    @property
    def DJANGO_LOG_SQL(self) -> bool:
        """是否记录SQL查询"""
        return decouple_config('DJANGO_LOG_SQL', default=False, cast=bool)
    
    @property
    def TESTING(self) -> bool:
        """是否为测试环境"""
        return decouple_config('TESTING', default=False, cast=bool)
    
    # ==========================================
    # 安全配置
    # ==========================================
    
    @property
    def SESSION_COOKIE_SECURE(self) -> bool:
        """会话Cookie安全标志"""
        return decouple_config('SESSION_COOKIE_SECURE', default=False, cast=bool)
    
    @property
    def CSRF_COOKIE_SECURE(self) -> bool:
        """CSRF Cookie安全标志"""
        return decouple_config('CSRF_COOKIE_SECURE', default=False, cast=bool)
    
    def validate_rakuten_config(self) -> bool:
        """
        验证乐天API配置是否完整
        
        Returns:
            bool: 配置是否完整
        """
        if self.RAKUTEN_API_TEST_MODE == 'real':
            required_vars = [
                self.RAKUTEN_SERVICE_SECRET,
                self.RAKUTEN_LICENSE_KEY,
                self.RAKUTEN_FTP_HOST,
                self.RAKUTEN_FTP_USERNAME,
                self.RAKUTEN_FTP_PASSWORD,
            ]
            return all(var is not None for var in required_vars)
        return True  # 测试模式不需要真实配置
    
    def get_database_config(self) -> dict:
        """
        获取完整的数据库配置字典
        
        Returns:
            dict: 数据库配置
        """
        return {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': self.DATABASE_NAME,
            'USER': self.DATABASE_USER,
            'PASSWORD': self.DATABASE_PASSWORD,
            'HOST': self.DATABASE_HOST,
            'PORT': self.DATABASE_PORT,
            'OPTIONS': {
                'charset': 'utf8mb4',
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            },
        }


# 创建全局配置实例
config = ConfigManager()


# 向后兼容的函数接口
def get_config(key: str, default: Any = None, cast: type = str) -> Any:
    """
    获取配置值（向后兼容函数）
    
    Args:
        key: 环境变量名
        default: 默认值
        cast: 类型转换函数
        
    Returns:
        配置值
    """
    return config.get(key, default, cast)


def validate_environment() -> None:
    """验证环境配置（向后兼容函数）"""
    config._validate_environment() 