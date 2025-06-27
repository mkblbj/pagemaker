"""
乐天API集成自定义异常类
"""


class RakutenAPIError(Exception):
    """乐天API基础异常类"""
    
    def __init__(self, message: str, error_code: str = None, details: dict = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            "error": {
                "code": self.error_code or "RAKUTEN_API_ERROR",
                "message": self.message,
                "details": self.details
            }
        }


class RakutenAuthError(RakutenAPIError):
    """认证错误"""
    
    def __init__(self, message: str = "乐天API认证失败", details: dict = None):
        super().__init__(message, "RAKUTEN_AUTH_ERROR", details)


class RakutenRateLimitError(RakutenAPIError):
    """速率限制错误"""
    
    def __init__(self, message: str = "乐天API请求频率超限", details: dict = None):
        super().__init__(message, "RAKUTEN_RATE_LIMIT_ERROR", details)


class RakutenParameterError(RakutenAPIError):
    """参数错误"""
    
    def __init__(self, message: str = "乐天API参数错误", details: dict = None):
        super().__init__(message, "RAKUTEN_PARAMETER_ERROR", details)


class RakutenConnectionError(RakutenAPIError):
    """连接错误"""
    
    def __init__(self, message: str = "乐天API连接失败", details: dict = None):
        super().__init__(message, "RAKUTEN_CONNECTION_ERROR", details)


class RakutenServerError(RakutenAPIError):
    """服务器错误"""
    
    def __init__(self, message: str = "乐天API服务器错误", details: dict = None):
        super().__init__(message, "RAKUTEN_SERVER_ERROR", details)


class RakutenServiceUnavailableError(RakutenAPIError):
    """服务不可用错误"""
    
    def __init__(self, message: str = "乐天API服务不可用", details: dict = None):
        super().__init__(message, "RAKUTEN_SERVICE_UNAVAILABLE", details)


class RakutenXMLParseError(RakutenAPIError):
    """XML解析错误"""
    
    def __init__(self, message: str = "乐天API响应XML解析失败", details: dict = None):
        super().__init__(message, "RAKUTEN_XML_PARSE_ERROR", details)


class RakutenFileError(RakutenAPIError):
    """文件操作错误"""
    
    def __init__(self, message: str = "乐天API文件操作失败", details: dict = None):
        super().__init__(message, "RAKUTEN_FILE_ERROR", details)


class RakutenFolderError(RakutenAPIError):
    """文件夹操作错误"""
    
    def __init__(self, message: str = "乐天API文件夹操作失败", details: dict = None):
        super().__init__(message, "RAKUTEN_FOLDER_ERROR", details)


class RakutenCapacityError(RakutenAPIError):
    """容量不足错误"""
    
    def __init__(self, message: str = "乐天R-Cabinet容量不足", details: dict = None):
        super().__init__(message, "RAKUTEN_CAPACITY_ERROR", details)


class RakutenFTPError(RakutenAPIError):
    """FTP连接错误"""
    
    def __init__(self, message: str = "乐天FTP连接失败", details: dict = None):
        super().__init__(message, "RAKUTEN_FTP_ERROR", details)


class RakutenConfigError(RakutenAPIError):
    """配置错误"""
    
    def __init__(self, message: str = "乐天API配置错误", details: dict = None):
        super().__init__(message, "RAKUTEN_CONFIG_ERROR", details) 