"""
乐天API集成工具函数
"""

import base64
import logging
import time
import random
import xml.etree.ElementTree as ET
from functools import wraps
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timezone

from .constants import (
    LOG_CONFIG,
    RETRY_CONFIG,
    CABINET_RESULT_CODES,
    HTTP_STATUS_CODES,
    SYSTEM_STATUS,
)
from .exceptions import (
    RakutenXMLParseError,
    RakutenAuthError,
    RakutenRateLimitError,
    RakutenParameterError,
    RakutenServerError,
    RakutenConnectionError,
    RakutenServiceUnavailableError,
)


def setup_logger(name: str = None) -> logging.Logger:
    """设置乐天API专用日志记录器"""
    logger_name = name or LOG_CONFIG["LOGGER_NAME"]
    logger = logging.getLogger(logger_name)

    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(LOG_CONFIG["FORMAT"])
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(getattr(logging, LOG_CONFIG["LEVEL"]))

    return logger


def create_auth_header(service_secret: str, license_key: str) -> str:
    """
    创建乐天API认证头

    Args:
        service_secret: 服务密钥
        license_key: 许可密钥

    Returns:
        格式化的Authorization头值

    Raises:
        RakutenAuthError: 当凭据格式无效时
    """
    if not service_secret or not license_key:
        raise RakutenAuthError("service_secret和license_key不能为空")

    try:
        credentials = f"{service_secret}:{license_key}"
        encoded = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
        return f"ESA {encoded}"
    except Exception as e:
        raise RakutenAuthError(f"认证头创建失败: {str(e)}")


def parse_cabinet_xml_response(xml_content: str) -> Dict[str, Any]:
    """
    解析R-Cabinet API的XML响应

    Args:
        xml_content: XML响应内容

    Returns:
        解析后的响应数据

    Raises:
        RakutenXMLParseError: XML解析失败时
    """
    try:
        root = ET.fromstring(xml_content)

        # 解析状态信息
        status = root.find("status")
        if status is None:
            raise RakutenXMLParseError("响应XML缺少status节点")

        result = {
            "interface_id": _get_element_text(status, "interfaceId"),
            "system_status": _get_element_text(status, "systemStatus"),
            "message": _get_element_text(status, "message"),
            "request_id": _get_element_text(status, "requestId"),
            "success": _get_element_text(status, "systemStatus") == SYSTEM_STATUS["OK"],
        }

        # 解析具体结果
        if result["success"]:
            result["data"] = _parse_cabinet_result_data(root, result["interface_id"])

        return result

    except ET.ParseError as e:
        raise RakutenXMLParseError(f"XML解析错误: {str(e)}")
    except Exception as e:
        raise RakutenXMLParseError(f"响应解析失败: {str(e)}")


def _get_element_text(parent: ET.Element, tag: str) -> Optional[str]:
    """安全获取XML元素文本"""
    element = parent.find(tag)
    return element.text if element is not None else None


def _parse_cabinet_result_data(root: ET.Element, interface_id: str) -> Dict[str, Any]:
    """解析不同Cabinet API的结果数据"""
    data = {}

    if "usage.get" in interface_id:
        usage_result = root.find("cabinetUsageGetResult")
        if usage_result is not None:
            data = {
                "result_code": _safe_int(_get_element_text(usage_result, "resultCode")),
                "max_space": _safe_int(_get_element_text(usage_result, "MaxSpace")),
                "folder_max": _safe_int(_get_element_text(usage_result, "FolderMax")),
                "file_max": _safe_int(_get_element_text(usage_result, "FileMax")),
                "use_space": _safe_float(_get_element_text(usage_result, "UseSpace")),
                "avail_space": _safe_float(
                    _get_element_text(usage_result, "AvailSpace")
                ),
                "use_folder_count": _safe_int(
                    _get_element_text(usage_result, "UseFolderCount")
                ),
                "avail_folder_count": _safe_int(
                    _get_element_text(usage_result, "AvailFolderCount")
                ),
            }

    elif "folders.get" in interface_id:
        folders_result = root.find("cabinetFoldersGetResult")
        if folders_result is not None:
            data = {
                "result_code": _safe_int(
                    _get_element_text(folders_result, "resultCode")
                ),
                "folder_all_count": _safe_int(
                    _get_element_text(folders_result, "folderAllCount")
                ),
                "folder_count": _safe_int(
                    _get_element_text(folders_result, "folderCount")
                ),
                "folders": _parse_folders_list(folders_result.find("folders")),
            }

    elif "folder.files.get" in interface_id or "files.search" in interface_id:
        files_result = root.find("cabinetFolderFilesGetResult") or root.find(
            "cabinetFilesSearchResult"
        )
        if files_result is not None:
            data = {
                "result_code": _safe_int(_get_element_text(files_result, "resultCode")),
                "file_all_count": _safe_int(
                    _get_element_text(files_result, "fileAllCount")
                ),
                "file_count": _safe_int(_get_element_text(files_result, "fileCount")),
                "files": _parse_files_list(files_result.find("files")),
            }

    elif "file.insert" in interface_id:
        file_insert_result = root.find("cabinetFileInsertResult")
        if file_insert_result is not None:
            data = {
                "result_code": _safe_int(
                    _get_element_text(file_insert_result, "resultCode")
                ),
                "file_id": _safe_int(_get_element_text(file_insert_result, "FileId")),
            }

    return data


def _parse_folders_list(folders_element: ET.Element) -> list:
    """解析文件夹列表"""
    if folders_element is None:
        return []

    folders = []
    for folder in folders_element.findall("folder"):
        folder_data = {
            "folder_id": _safe_int(_get_element_text(folder, "FolderId")),
            "folder_name": _get_element_text(folder, "FolderName"),
            "folder_node": _safe_int(_get_element_text(folder, "FolderNode")),
            "folder_path": _get_element_text(folder, "FolderPath"),
            "file_count": _safe_int(_get_element_text(folder, "FileCount")),
            "file_size": _safe_float(_get_element_text(folder, "FileSize")),
            "timestamp": _get_element_text(folder, "TimeStamp"),
        }
        folders.append(folder_data)

    return folders


def _parse_files_list(files_element: ET.Element) -> list:
    """解析文件列表"""
    if files_element is None:
        return []

    files = []
    for file_elem in files_element.findall("file"):
        file_data = {
            "folder_id": _safe_int(_get_element_text(file_elem, "FolderId")),
            "folder_name": _get_element_text(file_elem, "FolderName"),
            "folder_node": _safe_int(_get_element_text(file_elem, "FolderNode")),
            "folder_path": _get_element_text(file_elem, "FolderPath"),
            "file_id": _safe_int(_get_element_text(file_elem, "FileId")),
            "file_name": _get_element_text(file_elem, "FileName"),
            "file_url": _get_element_text(file_elem, "FileUrl"),
            "file_path": _get_element_text(file_elem, "FilePath"),
            "file_type": _safe_int(_get_element_text(file_elem, "FileType")),
            "file_size": _safe_float(_get_element_text(file_elem, "FileSize")),
            "file_width": _safe_int(_get_element_text(file_elem, "FileWidth")),
            "file_height": _safe_int(_get_element_text(file_elem, "FileHeight")),
            "file_access_date": _get_element_text(file_elem, "FileAccessDate"),
            "timestamp": _get_element_text(file_elem, "TimeStamp"),
        }
        files.append(file_data)

    return files


def _safe_int(value: str) -> Optional[int]:
    """安全转换为整数"""
    if value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def _safe_float(value: str) -> Optional[float]:
    """安全转换为浮点数"""
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def map_http_status_to_exception(
    status_code: int, response_text: str = ""
) -> Exception:
    """
    将HTTP状态码映射为对应的异常

    Args:
        status_code: HTTP状态码
        response_text: 响应文本

    Returns:
        对应的异常实例
    """
    details = {"http_status": status_code, "response": response_text}

    if status_code == HTTP_STATUS_CODES["UNAUTHORIZED"]:
        return RakutenAuthError(details=details)
    elif status_code == HTTP_STATUS_CODES["FORBIDDEN"]:
        return RakutenRateLimitError(details=details)
    elif status_code == HTTP_STATUS_CODES["BAD_REQUEST"]:
        return RakutenParameterError(details=details)
    elif status_code == HTTP_STATUS_CODES["INTERNAL_SERVER_ERROR"]:
        return RakutenServerError(details=details)
    elif status_code == HTTP_STATUS_CODES["SERVICE_UNAVAILABLE"]:
        return RakutenServiceUnavailableError(details=details)
    else:
        return RakutenConnectionError(f"HTTP {status_code}", details=details)


def map_result_code_to_exception(
    result_code: int, interface_id: str = ""
) -> Optional[Exception]:
    """
    将Cabinet API结果码映射为对应的异常

    Args:
        result_code: API结果码
        interface_id: 接口ID

    Returns:
        对应的异常实例，如果是成功码则返回None
    """
    details = {"result_code": result_code, "interface_id": interface_id}

    if result_code == CABINET_RESULT_CODES["SUCCESS"]:
        return None
    elif result_code in [CABINET_RESULT_CODES["PARAMETER_ERROR"]]:
        return RakutenParameterError(details=details)
    elif result_code in [
        CABINET_RESULT_CODES["SYSTEM_ERROR_1"],
        CABINET_RESULT_CODES["SYSTEM_ERROR_2"],
        CABINET_RESULT_CODES["SYSTEM_ERROR_3"],
        CABINET_RESULT_CODES["CACHE_ERROR"],
        CABINET_RESULT_CODES["SYSTEM_ERROR_5"],
    ]:
        return RakutenServerError(details=details)
    elif result_code == CABINET_RESULT_CODES["MAINTENANCE"]:
        return RakutenServiceUnavailableError(details=details)
    else:
        return RakutenParameterError(f"未知结果码: {result_code}", details=details)


class RateLimiter:
    """速率限制器"""

    def __init__(self, max_requests_per_second: float = 1.0):
        self.max_requests_per_second = max_requests_per_second
        self.last_request_time = None

    def wait_if_needed(self):
        """如果需要，等待直到可以发送下一个请求"""
        if self.last_request_time is not None:
            elapsed = time.time() - self.last_request_time
            min_interval = 1.0 / self.max_requests_per_second
            if elapsed < min_interval:
                sleep_time = min_interval - elapsed
                time.sleep(sleep_time)

        self.last_request_time = time.time()


def retry_with_backoff(
    max_retries: int = None,
    base_delay: float = None,
    max_delay: float = None,
    backoff_factor: float = None,
):
    """
    带指数退避的重试装饰器

    Args:
        max_retries: 最大重试次数
        base_delay: 基础延迟时间（秒）
        max_delay: 最大延迟时间（秒）
        backoff_factor: 退避因子
    """
    max_retries = max_retries or RETRY_CONFIG["MAX_RETRIES"]
    base_delay = base_delay or RETRY_CONFIG["BASE_DELAY"]
    max_delay = max_delay or RETRY_CONFIG["MAX_DELAY"]
    backoff_factor = backoff_factor or RETRY_CONFIG["BACKOFF_FACTOR"]

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except (RakutenConnectionError, RakutenServerError) as e:
                    last_exception = e
                    if attempt == max_retries:
                        raise

                    # 计算延迟时间
                    delay = min(
                        base_delay * (backoff_factor**attempt) + random.uniform(0, 1),
                        max_delay,
                    )
                    time.sleep(delay)
                except Exception as e:
                    # 对于非网络/服务器错误，不进行重试
                    raise

            # 如果所有重试都失败，抛出最后的异常
            raise last_exception

        return wrapper

    return decorator


def log_api_call(
    logger: logging.Logger,
    endpoint: str,
    method: str,
    request_data: Any = None,
    response_data: Dict[str, Any] = None,
    duration: float = None,
    error: Exception = None,
):
    """
    记录API调用日志

    Args:
        logger: 日志记录器
        endpoint: API端点
        method: HTTP方法
        request_data: 请求数据
        response_data: 响应数据
        duration: 请求持续时间（秒）
        error: 错误信息
    """
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "endpoint": endpoint,
        "method": method,
        "duration_ms": round(duration * 1000, 2) if duration else None,
    }

    if request_data:
        log_entry["request_size"] = len(str(request_data))

    if response_data:
        log_entry.update(
            {
                "response_status": response_data.get("system_status"),
                "request_id": response_data.get("request_id"),
                "success": response_data.get("success", False),
            }
        )

    if error:
        log_entry.update({"error": str(error), "error_type": type(error).__name__})
        logger.error(f"API调用失败: {log_entry}")
    else:
        logger.info(f"API调用成功: {log_entry}")


def validate_credentials(service_secret: str, license_key: str) -> Tuple[bool, str]:
    """
    验证凭据格式

    Args:
        service_secret: 服务密钥
        license_key: 许可密钥

    Returns:
        (是否有效, 错误信息)
    """
    if not service_secret:
        return False, "service_secret不能为空"

    if not license_key:
        return False, "license_key不能为空"

    if len(service_secret) > 50:
        return False, "service_secret长度不能超过50字符"

    if len(license_key) > 50:
        return False, "license_key长度不能超过50字符"

    if ":" in service_secret or ":" in license_key:
        return False, "凭据中不能包含冒号字符"

    return True, ""
