"""
多语言工具函数
"""

from typing import Optional
from django.http import HttpRequest
from django.utils import translation
from django.conf import settings

def get_client_language(request: HttpRequest) -> Optional[str]:
    """
    从请求中获取客户端语言偏好
    
    优先级：
    1. HTTP头 Accept-Language-Override (自定义头)
    2. HTTP头 Accept-Language
    3. 默认语言
    
    Args:
        request: Django HTTP请求对象
    
    Returns:
        语言代码 ('zh-hans', 'ja', 'en')
    """
    # 检查自定义语言覆盖头
    override_lang = request.headers.get('Accept-Language-Override')
    if override_lang:
        # 映射前端语言代码到Django语言代码
        lang_mapping = {
            'zh-CN': 'zh-hans',
            'ja-JP': 'ja', 
            'en-US': 'en'
        }
        django_lang = lang_mapping.get(override_lang, override_lang)
        if django_lang in [lang[0] for lang in settings.LANGUAGES]:
            return django_lang
    
    # 检查标准Accept-Language头
    accept_language = request.headers.get('Accept-Language')
    if accept_language:
        # 解析Accept-Language头
        for lang_range in accept_language.split(','):
            lang = lang_range.split(';')[0].strip().lower()
            
            # 映射常见的语言代码
            if lang.startswith('zh'):
                return 'zh-hans'
            elif lang.startswith('ja'):
                return 'ja'
            elif lang.startswith('en'):
                return 'en'
    
    # 返回默认语言
    return getattr(settings, 'LANGUAGE_CODE', 'zh-hans')

def format_message(message_template: str, **kwargs) -> str:
    """
    格式化消息模板
    
    Args:
        message_template: 消息模板，支持 {param} 占位符
        **kwargs: 模板参数
    
    Returns:
        格式化后的消息
    """
    try:
        return message_template.format(**kwargs)
    except (KeyError, ValueError):
        # 如果格式化失败，返回原始模板
        return message_template

def set_language_for_request(request: HttpRequest, language: str) -> None:
    """
    为当前请求设置语言
    
    Args:
        request: Django HTTP请求对象
        language: 语言代码
    """
    translation.activate(language)
    request.LANGUAGE_CODE = language

def get_language_from_frontend_code(frontend_lang: str) -> str:
    """
    将前端语言代码转换为Django语言代码
    
    Args:
        frontend_lang: 前端语言代码 ('zh-CN', 'ja-JP', 'en-US')
    
    Returns:
        Django语言代码 ('zh-hans', 'ja', 'en')
    """
    mapping = {
        'zh-CN': 'zh-hans',
        'ja-JP': 'ja',
        'en-US': 'en'
    }
    return mapping.get(frontend_lang, 'zh-hans')

def get_frontend_code_from_django_lang(django_lang: str) -> str:
    """
    将Django语言代码转换为前端语言代码
    
    Args:
        django_lang: Django语言代码 ('zh-hans', 'ja', 'en')
    
    Returns:
        前端语言代码 ('zh-CN', 'ja-JP', 'en-US')
    """
    mapping = {
        'zh-hans': 'zh-CN',
        'ja': 'ja-JP', 
        'en': 'en-US'
    }
    return mapping.get(django_lang, 'zh-CN') 