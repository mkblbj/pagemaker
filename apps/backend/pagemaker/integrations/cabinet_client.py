"""
R-Cabinet API客户端
"""

import os
import time
import requests
from typing import Dict, Any, Optional, List
from urllib.parse import urljoin

from .constants import (
    RAKUTEN_API_BASE_URL,
    RAKUTEN_API_TIMEOUT,
    CABINET_ENDPOINTS,
    TEST_MODE,
    HTTP_STATUS_CODES,
)
from .exceptions import (
    RakutenAPIError,
    RakutenAuthError,
    RakutenConnectionError,
    RakutenConfigError,
)
from .utils import (
    setup_logger,
    create_auth_header,
    parse_cabinet_xml_response,
    map_http_status_to_exception,
    map_result_code_to_exception,
    RateLimiter,
    retry_with_backoff,
    log_api_call,
    validate_credentials,
)


class RCabinetClient:
    """R-Cabinet API客户端"""

    def __init__(
        self,
        service_secret: str = None,
        license_key: str = None,
        base_url: str = None,
        timeout: int = None,
        test_mode: str = None,
    ):
        """
        初始化R-Cabinet客户端

        Args:
            service_secret: 服务密钥
            license_key: 许可密钥
            base_url: API基础URL
            timeout: 请求超时时间（秒）
            test_mode: 测试模式 ('mock' 或 'real')
        """
        self.logger = setup_logger("rakuten.cabinet")

        # 导入统一配置
        from pagemaker.config import config as app_config

        # 配置参数
        self.base_url = base_url or app_config.RAKUTEN_API_BASE_URL
        self.timeout = timeout or app_config.RAKUTEN_API_TIMEOUT
        # 优先使用传入的test_mode，如果没有则使用配置文件，默认为real模式
        self.test_mode = test_mode or app_config.RAKUTEN_API_TEST_MODE

        # 凭据配置
        self.service_secret = service_secret or app_config.RAKUTEN_SERVICE_SECRET
        self.license_key = license_key or app_config.RAKUTEN_LICENSE_KEY

        # 如果是测试模式，使用测试凭据
        if self.test_mode == TEST_MODE["MOCK"]:
            # 如果没有设置真实凭据，则使用默认测试值
            if not self.service_secret:
                self.service_secret = "test_secret"
            if not self.license_key:
                self.license_key = "test_license"

        # 验证凭据
        if self.test_mode == TEST_MODE["REAL"]:
            valid, error_msg = validate_credentials(
                self.service_secret, self.license_key
            )
            if not valid:
                raise RakutenConfigError(f"凭据验证失败: {error_msg}")

        # 速率限制器
        self.rate_limiter = RateLimiter(max_requests_per_second=1.0)

        self.logger.info(f"R-Cabinet客户端初始化完成 (模式: {self.test_mode})")

    def _get_headers(self) -> Dict[str, str]:
        """获取请求头"""
        headers = {
            "User-Agent": "Pagemaker-RakutenAPI/1.0",
            "Accept": "application/xml",
            "Accept-Encoding": "gzip, deflate",
        }

        if self.test_mode == TEST_MODE["REAL"]:
            headers["Authorization"] = create_auth_header(
                self.service_secret, self.license_key
            )
        else:
            # 测试模式动态生成认证头
            headers["Authorization"] = create_auth_header(
                self.service_secret, self.license_key
            )

        return headers

    def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Dict[str, Any] = None,
        data: Any = None,
        files: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """
        发送HTTP请求

        Args:
            method: HTTP方法
            endpoint: API端点
            params: 查询参数
            data: 请求体数据
            files: 文件数据

        Returns:
            解析后的响应数据

        Raises:
            RakutenAPIError: API调用失败时
        """
        # 速率限制
        self.rate_limiter.wait_if_needed()

        url = urljoin(self.base_url, endpoint)
        headers = self._get_headers()

        # 如果有文件上传，让requests自动设置multipart/form-data的Content-Type
        if files:
            headers.pop("Content-Type", None)

        start_time = time.time()
        response = None
        error = None

        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                data=data,
                files=files,
                timeout=self.timeout,
            )

            duration = time.time() - start_time

            # 检查HTTP状态码
            if response.status_code != HTTP_STATUS_CODES["OK"]:
                error = map_http_status_to_exception(
                    response.status_code, response.text
                )
                raise error

            # 解析XML响应
            result = parse_cabinet_xml_response(response.text)

            # 检查API结果码
            if result.get("data", {}).get("result_code") is not None:
                result_code = result["data"]["result_code"]
                api_error = map_result_code_to_exception(
                    result_code, result.get("interface_id")
                )
                if api_error:
                    error = api_error
                    raise error

            # 记录成功日志
            log_api_call(
                self.logger,
                endpoint,
                method,
                request_data={"params": params, "data": data},
                response_data=result,
                duration=duration,
            )

            return result

        except requests.exceptions.Timeout:
            error = RakutenConnectionError("请求超时")
            raise error
        except requests.exceptions.ConnectionError:
            error = RakutenConnectionError("连接失败")
            raise error
        except requests.exceptions.RequestException as e:
            error = RakutenConnectionError(f"请求异常: {str(e)}")
            raise error
        finally:
            if error:
                duration = time.time() - start_time
                log_api_call(
                    self.logger,
                    endpoint,
                    method,
                    request_data={"params": params, "data": data},
                    duration=duration,
                    error=error,
                )



    def _get_interface_id_from_endpoint(self, endpoint: str) -> str:
        """从端点获取接口ID"""
        endpoint_mapping = {
            "/es/1.0/cabinet/usage/get": "cabinet.usage.get",
            "/es/1.0/cabinet/folders/get": "cabinet.folders.get",
            "/es/1.0/cabinet/folder/files/get": "cabinet.folder.files.get",
            "/es/1.0/cabinet/files/search": "cabinet.files.search",
        }
        return endpoint_mapping.get(endpoint, "cabinet.unknown")

    @retry_with_backoff()
    def test_connection(self) -> Dict[str, Any]:
        """
        测试与R-Cabinet API的连接

        Returns:
            连接测试结果

        Raises:
            RakutenAPIError: 连接测试失败时
        """
        try:
            result = self.get_usage()
            return {
                "success": True,
                "message": "R-Cabinet API连接测试成功",
                "data": {
                    "request_id": result.get("request_id"),
                    "interface_id": result.get("interface_id"),
                    "max_space": result.get("data", {}).get("max_space"),
                    "use_space": result.get("data", {}).get("use_space"),
                },
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"R-Cabinet API连接测试失败: {str(e)}",
                "error": str(e),
                "error_type": type(e).__name__,
            }

    def get_usage(self) -> Dict[str, Any]:
        """
        获取R-Cabinet使用状况

        Returns:
            使用状况数据
        """
        return self._make_request("GET", CABINET_ENDPOINTS["USAGE_GET"])

    def get_folders(self, offset: int = 1, limit: int = 100) -> Dict[str, Any]:
        """
        获取文件夹列表

        Args:
            offset: 页码（从1开始）
            limit: 每页数量（最大100）

        Returns:
            文件夹列表数据
        """
        params = {}
        if offset > 1:
            params["offset"] = offset
        if limit != 100:
            params["limit"] = min(limit, 100)

        return self._make_request(
            "GET", CABINET_ENDPOINTS["FOLDERS_GET"], params=params
        )

    def get_folder_files(
        self, folder_id: int, offset: int = 1, limit: int = 100
    ) -> Dict[str, Any]:
        """
        获取指定文件夹内的文件列表

        Args:
            folder_id: 文件夹ID
            offset: 页码（从1开始）
            limit: 每页数量（最大100）

        Returns:
            文件列表数据
        """
        params = {"folderId": folder_id}
        if offset > 1:
            params["offset"] = offset
        if limit != 100:
            params["limit"] = min(limit, 100)

        return self._make_request(
            "GET", CABINET_ENDPOINTS["FOLDER_FILES_GET"], params=params
        )

    def search_files(
        self,
        file_id: int = None,
        file_path: str = None,
        file_name: str = None,
        folder_id: int = None,
        folder_path: str = None,
        offset: int = 1,
        limit: int = 100,
    ) -> Dict[str, Any]:
        """
        搜索文件

        Args:
            file_id: 文件ID
            file_path: 文件路径
            file_name: 文件名
            folder_id: 文件夹ID
            folder_path: 文件夹路径
            offset: 页码（从1开始）
            limit: 每页数量（最大100）

        Returns:
            搜索结果数据
        """
        params = {}

        # 必须指定至少一个搜索条件
        if file_id:
            params["fileId"] = file_id
        elif file_path:
            params["filePath"] = file_path
        elif file_name:
            params["fileName"] = file_name
        else:
            raise RakutenAPIError("必须指定file_id、file_path或file_name中的至少一个")

        # 可选的文件夹过滤条件
        if folder_id:
            params["folderId"] = folder_id
        elif folder_path:
            params["folderPath"] = folder_path

        # 分页参数
        if offset > 1:
            params["offset"] = offset
        if limit != 100:
            params["limit"] = min(limit, 100)

        return self._make_request(
            "GET", CABINET_ENDPOINTS["FILES_SEARCH"], params=params
        )

    def health_check(self) -> Dict[str, Any]:
        """
        健康检查

        Returns:
            健康检查结果
        """
        try:
            start_time = time.time()
            result = self.get_usage()
            duration = time.time() - start_time

            return {
                "status": "healthy",
                "response_time_ms": round(duration * 1000, 2),
                "last_check": time.time(),
                "api_status": result.get("system_status"),
                "request_id": result.get("request_id"),
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "error_type": type(e).__name__,
                "last_check": time.time(),
            }

    @retry_with_backoff()
    def upload_file(
        self,
        file_data: bytes,
        filename: str,
        folder_id: int = None,
        alt_text: str = None,
    ) -> Dict[str, Any]:
        """
        上传文件到R-Cabinet

        Args:
            file_data: 文件二进制数据
            filename: 文件名
            folder_id: 目标文件夹ID（可选，默认为0即基本文件夹）
            alt_text: 替代文本（保留参数，但API不支持）

        Returns:
            上传结果数据

        Raises:
            RakutenAPIError: 上传失败时
        """
        # 构建XML请求参数
        xml_data = self._build_upload_xml(filename, folder_id, alt_text)

        # 准备multipart/form-data
        # 按照Rakuten API文档要求设置正确的Content-Disposition
        files = {
            "xml": (None, xml_data, "text/xml"),
            "file": (filename, file_data, "image/jpeg"),  # 根据文件类型设置MIME类型
        }

        # 发送请求
        return self._make_request("POST", CABINET_ENDPOINTS["FILE_INSERT"], files=files)

    def _build_upload_xml(
        self, filename: str, folder_id: int = None, alt_text: str = None
    ) -> str:
        """
        构建文件上传的XML请求参数

        Args:
            filename: 文件名
            folder_id: 文件夹ID
            alt_text: 替代文本（实际上Cabinet API不支持此参数，保留以备后用）

        Returns:
            XML字符串
        """
        xml_parts = ['<?xml version="1.0" encoding="UTF-8"?>']
        xml_parts.append("<request>")
        xml_parts.append("  <fileInsertRequest>")
        xml_parts.append("    <file>")
        xml_parts.append(f"      <fileName>{filename}</fileName>")

        # folderId: 登录先フォルダID（必须）
        # 如果未指定，使用0（基本文件夹）
        target_folder_id = folder_id if folder_id is not None else 0
        xml_parts.append(f"      <folderId>{target_folder_id}</folderId>")

        # filePath: 登录file名（可选）
        # 未指定时API会自动生成，这里不设置让API自动处理

        # overWrite: 上书きフラグ（可选）
        # 默认为false，这里不设置使用默认值

        xml_parts.append("    </file>")
        xml_parts.append("  </fileInsertRequest>")
        xml_parts.append("</request>")

        return "".join(xml_parts)


