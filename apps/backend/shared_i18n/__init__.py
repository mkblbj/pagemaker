"""
Django后端多语言支持模块
与前端@pagemaker/shared-i18n包保持一致
"""

from .error_messages import get_error_message, ERROR_SEVERITY_MAP
from .utils import get_client_language, format_message

__all__ = [
    'get_error_message',
    'ERROR_SEVERITY_MAP', 
    'get_client_language',
    'format_message'
] 