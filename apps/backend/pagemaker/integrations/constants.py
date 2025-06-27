"""
乐天API集成常量定义
"""

# API基础配置
RAKUTEN_API_BASE_URL = "https://api.rms.rakuten.co.jp"
RAKUTEN_API_VERSION = "1.0"
RAKUTEN_API_TIMEOUT = 30
RAKUTEN_API_MAX_RETRIES = 3
RAKUTEN_API_RATE_LIMIT = 1  # 每秒最大请求数

# R-Cabinet API端点
CABINET_ENDPOINTS = {
    "USAGE_GET": "/es/1.0/cabinet/usage/get",
    "FOLDERS_GET": "/es/1.0/cabinet/folders/get",
    "FOLDER_FILES_GET": "/es/1.0/cabinet/folder/files/get",
    "FILES_SEARCH": "/es/1.0/cabinet/files/search",
    "FILE_DELETE": "/es/1.0/cabinet/file/delete",
    "FILE_INSERT": "/es/1.0/cabinet/file/insert",
    "FILE_UPDATE": "/es/1.0/cabinet/file/update",
    "FOLDER_INSERT": "/es/1.0/cabinet/folder/insert",
    "TRASHBOX_FILES_GET": "/es/1.0/cabinet/trashbox/files/get",
    "TRASHBOX_FILE_REVERT": "/es/1.0/cabinet/trashbox/file/revert",
}

# License Management API端点
LICENSE_ENDPOINTS = {
    "EXPIRY_DATE": "/es/1.0/license-management/license-key/expiry-date",
}

# HTTP状态码
HTTP_STATUS_CODES = {
    "OK": 200,
    "BAD_REQUEST": 400,
    "UNAUTHORIZED": 401,
    "FORBIDDEN": 403,
    "METHOD_NOT_ALLOWED": 405,
    "INTERNAL_SERVER_ERROR": 500,
    "SERVICE_UNAVAILABLE": 503,
}

# R-Cabinet API结果码
CABINET_RESULT_CODES = {
    "SUCCESS": 0,
    "PARAMETER_ERROR": 3001,
    "STORE_NOT_EXIST_1": 3002,
    "STORE_NOT_EXIST_2": 3003,
    "FILE_NOT_EXIST": 3004,
    "FOLDER_NOT_EXIST": 3005,
    "FILE_COUNT_LIMIT": 3006,
    "FILE_NAME_EXISTS": 3007,
    "FILE_SIZE_ERROR_CAPACITY": 3008,
    "FILE_SIZE_ERROR_DIMENSION": 3009,
    "FILE_FORMAT_NOT_SUPPORTED": 3010,
    "FILE_FORMAT_ERROR": 3011,
    "CAPACITY_EXCEEDED": 3012,
    "FOLDER_COUNT_LIMIT": 3013,
    "HIERARCHY_ERROR": 3014,
    "FOLDER_PATH_EXISTS": 3015,
    "SYSTEM_ERROR_1": 6001,
    "SYSTEM_ERROR_2": 6002,
    "SYSTEM_ERROR_3": 6003,
    "CACHE_ERROR": 6004,
    "SYSTEM_ERROR_5": 6009,
    "MAINTENANCE": 1001,
}

# 系统状态
SYSTEM_STATUS = {
    "OK": "OK",
    "NG": "NG",
}

# 消息类型
MESSAGE_TYPES = {
    "OK": "OK",
    "PARAMETER_ERROR": "ParameterError",
    "REQUEST_FORMAT_ERROR": "Request data is wrong format",
    "AUTH_ERROR": "AuthError",
    "ACCESS_LIMIT": "AccessLimit",
    "SYSTEM_ERROR": "SystemError",
    "METHOD_NOT_ALLOWED": "Method Not Allowed",
}

# 文件类型
FILE_TYPES = {
    "JPG": 1,
    "GIF_IMAGE": 2,
    "GIF_VIDEO": 3,
}

# 文件夹节点类型
FOLDER_NODE_TYPES = {
    "ROOT": 0,
    "LEVEL_1": 1,
    "LEVEL_2": 2,
    "LEVEL_3": 3,
}

# 文件限制
FILE_LIMITS = {
    "MAX_SIZE_MB": 2,
    "MAX_WIDTH_PX": 3840,
    "MAX_HEIGHT_PX": 3840,
    "MAX_SEARCH_RESULTS": 50000,
}

# 支持的文件格式
SUPPORTED_FILE_FORMATS = ["JPG", "JPEG", "GIF", "PNG", "TIFF", "BMP"]

# 自动转换格式（会转换为JPG）
AUTO_CONVERT_FORMATS = ["PNG", "TIFF", "BMP"]

# 测试模式配置
TEST_MODE = {
    "MOCK": "mock",
    "REAL": "real",
}

# 错误重试配置
RETRY_CONFIG = {
    "MAX_RETRIES": 3,
    "BASE_DELAY": 1,
    "MAX_DELAY": 60,
    "BACKOFF_FACTOR": 2,
}

# 日志配置
LOG_CONFIG = {
    "LOGGER_NAME": "rakuten_api",
    "FORMAT": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "LEVEL": "INFO",
}
