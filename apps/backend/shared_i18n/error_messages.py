"""
错误消息多语言支持
与前端shared-i18n包保持消息一致性
"""

from typing import Dict, Optional
from django.utils.translation import gettext as _

# 支持的语言类型
SupportedLanguage = str  # 'zh-hans', 'ja', 'en'

# 错误严重程度
class ErrorSeverity:
    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'
    CRITICAL = 'critical'

# 错误严重程度映射表 (与前端保持一致)
ERROR_SEVERITY_MAP: Dict[str, str] = {
    # 网络错误
    'NETWORK_ERROR': ErrorSeverity.MEDIUM,
    'NETWORK_TIMEOUT': ErrorSeverity.MEDIUM,
    'NETWORK_OFFLINE': ErrorSeverity.HIGH,

    # 认证错误
    'AUTH_TOKEN_EXPIRED': ErrorSeverity.HIGH,
    'AUTH_INVALID_CREDENTIALS': ErrorSeverity.MEDIUM,
    'AUTH_UNAUTHORIZED': ErrorSeverity.HIGH,

    # 验证错误
    'VALIDATION_REQUIRED_FIELD': ErrorSeverity.LOW,
    'VALIDATION_INVALID_FORMAT': ErrorSeverity.LOW,
    'VALIDATION_FILE_TOO_LARGE': ErrorSeverity.MEDIUM,

    # 服务器错误
    'SERVER_INTERNAL_ERROR': ErrorSeverity.HIGH,
    'SERVER_MAINTENANCE': ErrorSeverity.HIGH,
    'SERVER_OVERLOAD': ErrorSeverity.MEDIUM,

    # 数据冲突
    'CONFLICT_VERSION': ErrorSeverity.MEDIUM,
    'CONFLICT_DUPLICATE': ErrorSeverity.MEDIUM,

    # 页面编辑器特定错误
    'EDITOR_SAVE_FAILED': ErrorSeverity.HIGH,
    'EDITOR_LOAD_FAILED': ErrorSeverity.HIGH,
    'EDITOR_MODULE_INVALID': ErrorSeverity.MEDIUM,

    # 通用错误
    'GENERIC_ERROR': ErrorSeverity.MEDIUM,
    'NOT_FOUND': ErrorSeverity.MEDIUM
}

# 错误消息映射表 (多语言)
ERROR_MESSAGES: Dict[str, Dict[str, str]] = {
    # 网络错误
    'NETWORK_ERROR': {
        'zh-hans': '网络连接失败，请检查您的网络连接后重试',
        'ja': 'ネットワーク接続に失敗しました。ネットワーク接続を確認してから再試行してください',
        'en': 'Network connection failed. Please check your network connection and try again'
    },
    'NETWORK_TIMEOUT': {
        'zh-hans': '请求超时，请稍后重试',
        'ja': 'リクエストがタイムアウトしました。しばらくしてから再試行してください',
        'en': 'Request timed out. Please try again later'
    },
    'NETWORK_OFFLINE': {
        'zh-hans': '网络已断开，请检查网络连接',
        'ja': 'ネットワークが切断されています。ネットワーク接続を確認してください',
        'en': 'Network is offline. Please check your network connection'
    },

    # 认证错误
    'AUTH_TOKEN_EXPIRED': {
        'zh-hans': '登录已过期，请重新登录',
        'ja': 'ログインの有効期限が切れました。再度ログインしてください',
        'en': 'Login has expired. Please log in again'
    },
    'AUTH_INVALID_CREDENTIALS': {
        'zh-hans': '用户名或密码错误，请重试',
        'ja': 'ユーザー名またはパスワードが間違っています。再試行してください',
        'en': 'Invalid username or password. Please try again'
    },
    'AUTH_UNAUTHORIZED': {
        'zh-hans': '您没有权限访问此资源',
        'ja': 'このリソースにアクセスする権限がありません',
        'en': "You don't have permission to access this resource"
    },

    # 验证错误
    'VALIDATION_REQUIRED_FIELD': {
        'zh-hans': '请填写必填字段',
        'ja': '必須フィールドを入力してください',
        'en': 'Please fill in the required fields'
    },
    'VALIDATION_INVALID_FORMAT': {
        'zh-hans': '输入格式不正确，请检查后重试',
        'ja': '入力形式が正しくありません。確認してから再試行してください',
        'en': 'Invalid input format. Please check and try again'
    },
    'VALIDATION_FILE_TOO_LARGE': {
        'zh-hans': '文件大小超出限制，请选择较小的文件',
        'ja': 'ファイルサイズが制限を超えています。より小さなファイルを选择してください',
        'en': 'File size exceeds limit. Please select a smaller file'
    },

    # 服务器错误
    'SERVER_INTERNAL_ERROR': {
        'zh-hans': '服务器遇到问题，请稍后重试',
        'ja': 'サーバーで問題が発生しました。しばらくしてから再試行してください',
        'en': 'Server encountered an issue. Please try again later'
    },
    'SERVER_MAINTENANCE': {
        'zh-hans': '系统正在维护中，请稍后访问',
        'ja': 'システムメンテナンス中です。しばらくしてからアクセスしてください',
        'en': 'System is under maintenance. Please try again later'
    },
    'SERVER_OVERLOAD': {
        'zh-hans': '服务器繁忙，请稍后重试',
        'ja': 'サーバーが混雑しています。しばらくしてから再試行してください',
        'en': 'Server is busy. Please try again later'
    },

    # 数据冲突
    'CONFLICT_VERSION': {
        'zh-hans': '数据已被其他用户修改，请刷新后重试',
        'ja': 'データが他のユーザーによって変更されています。更新してから再試行してください',
        'en': 'Data has been modified by another user. Please refresh and try again'
    },
    'CONFLICT_DUPLICATE': {
        'zh-hans': '该数据已存在，请检查后重试',
        'ja': 'そのデータは既に存在しています。確認してから再試行してください',
        'en': 'This data already exists. Please check and try again'
    },

    # 页面编辑器特定错误
    'EDITOR_SAVE_FAILED': {
        'zh-hans': '页面保存失败，请检查网络连接后重试',
        'ja': 'ページの保存に失敗しました。ネットワーク接続を確認してから再試行してください',
        'en': 'Failed to save page. Please check your network connection and try again'
    },
    'EDITOR_LOAD_FAILED': {
        'zh-hans': '页面加载失败，请刷新页面重试',
        'ja': 'ページの読み込みに失敗しました。ページを更新して再試行してください',
        'en': 'Failed to load page. Please refresh the page and try again'
    },
    'EDITOR_MODULE_INVALID': {
        'zh-hans': '模块配置有误，请检查配置后重试',
        'ja': 'モジュール設定にエラーがあります。設定を確認してから再試行してください',
        'en': 'Module configuration is invalid. Please check the configuration and try again'
    },

    # 通用错误
    'GENERIC_ERROR': {
        'zh-hans': '操作失败，请重试',
        'ja': '操作に失敗しました。再試行してください',
        'en': 'Operation failed. Please try again'
    },
    'NOT_FOUND': {
        'zh-hans': '请求的资源不存在',
        'ja': 'リクエストされたリソースが存在しません',
        'en': 'The requested resource does not exist'
    }
}

def get_error_message(
    error_code: str, 
    language: Optional[str] = None,
    fallback_language: str = 'zh-hans'
) -> str:
    """
    获取指定语言的错误消息
    
    Args:
        error_code: 错误代码
        language: 目标语言 ('zh-hans', 'ja', 'en')
        fallback_language: 降级语言
    
    Returns:
        本地化的错误消息
    """
    # 默认使用中文
    if not language:
        language = fallback_language
    
    # 获取错误消息
    error_messages = ERROR_MESSAGES.get(error_code, ERROR_MESSAGES.get('GENERIC_ERROR', {}))
    
    # 尝试获取指定语言的消息
    message = error_messages.get(language)
    if message:
        return message
    
    # 降级到备用语言
    fallback_message = error_messages.get(fallback_language)
    if fallback_message:
        return fallback_message
    
    # 最后降级到英文
    en_message = error_messages.get('en')
    if en_message:
        return en_message
    
    # 如果都没有，返回错误代码
    return error_code 