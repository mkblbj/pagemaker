"""
乐天SFTP连接客户端
"""

import os
import time
import paramiko
from typing import Dict, Any, Optional, List
from datetime import datetime

from .constants import TEST_MODE, RETRY_CONFIG
from .exceptions import RakutenFTPError, RakutenConnectionError, RakutenConfigError
from .utils import setup_logger, retry_with_backoff, log_api_call


class RakutenFTPClient:
    """乐天SFTP连接客户端"""

    def __init__(
        self,
        host: str = None,
        port: int = 22,
        username: str = None,
        password: str = None,
        timeout: int = 30,
        test_mode: str = None,
    ):
        """
        初始化SFTP客户端

        Args:
            host: SFTP服务器地址
            port: SFTP端口 (默认22)
            username: SFTP用户名
            password: SFTP密码
            timeout: 连接超时时间（秒）
            test_mode: 测试模式 ('mock' 或 'real')
        """
        self.logger = setup_logger("rakuten.sftp")

        # 导入统一配置
        from pagemaker.config import config as app_config

        # 配置参数
        self.test_mode = test_mode or app_config.RAKUTEN_API_TEST_MODE
        self.timeout = timeout

        # 连接配置
        self.host = host or app_config.RAKUTEN_FTP_HOST
        self.port = port
        self.username = username or app_config.RAKUTEN_FTP_USERNAME
        self.password = password or app_config.RAKUTEN_FTP_PASSWORD

        # 如果是测试模式，使用测试配置
        if self.test_mode == TEST_MODE["MOCK"]:
            # 如果没有设置真实配置，则使用默认测试值
            if not self.host:
                self.host = "test.sftp.server"
            if not self.username:
                self.username = "test_user"
            if not self.password:
                self.password = "test_password"

        # SFTP连接对象
        self.ssh_client = None
        self.sftp_client = None
        self.connected = False

        self.logger.info(
            f"SFTP客户端初始化完成 (模式: {self.test_mode}, 主机: {self.host}:{self.port})"
        )

    @classmethod
    def from_shop_config(cls, shop_config, **kwargs):
        """
        从店铺配置创建FTP客户端实例（工厂方法）

        Args:
            shop_config: ShopConfiguration 实例
            **kwargs: 其他可选参数（port, timeout, test_mode等）

        Returns:
            RakutenFTPClient 实例

        Example:
            from configurations.models import ShopConfiguration
            shop = ShopConfiguration.objects.get(id=shop_id)
            ftp_client = RakutenFTPClient.from_shop_config(shop)
            ftp_client.connect()
            ftp_client.upload_file(...)
        """
        # 设置默认端口
        port = kwargs.pop('port', shop_config.ftp_port or 21)
        
        return cls(
            host=shop_config.ftp_host,
            port=port,
            username=shop_config.ftp_user,
            password=shop_config.ftp_password,
            **kwargs
        )

    def _validate_config(self) -> None:
        """验证SFTP配置"""
        if self.test_mode == TEST_MODE["REAL"]:
            if not self.host:
                raise RakutenConfigError("SFTP主机地址不能为空")
            if not self.username:
                raise RakutenConfigError("SFTP用户名不能为空")
            if not self.password:
                raise RakutenConfigError("SFTP密码不能为空")

    @retry_with_backoff()
    def connect(self) -> Dict[str, Any]:
        """
        连接到SFTP服务器

        Returns:
            连接结果

        Raises:
            RakutenFTPError: 连接失败时
        """
        if self.test_mode == TEST_MODE["MOCK"]:
            return self._mock_connect()

        self._validate_config()

        start_time = time.time()
        error = None

        try:
            self.logger.info(f"正在连接SFTP服务器: {self.host}:{self.port}")

            # 创建SSH客户端
            self.ssh_client = paramiko.SSHClient()

            # 自动添加主机密钥（生产环境中应该验证主机密钥）
            self.ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

            # 连接SSH
            self.ssh_client.connect(
                hostname=self.host,
                port=self.port,
                username=self.username,
                password=self.password,
                timeout=self.timeout,
                allow_agent=False,
                look_for_keys=False,
            )

            # 创建SFTP客户端
            self.sftp_client = self.ssh_client.open_sftp()

            self.connected = True
            duration = time.time() - start_time

            # 获取服务器信息
            server_version = self.ssh_client.get_transport().remote_version

            result = {
                "success": True,
                "message": "SFTP连接成功",
                "duration_ms": round(duration * 1000, 2),
                "server_version": server_version,
                "host": self.host,
                "port": self.port,
                "username": self.username,
            }

            # 记录成功日志
            log_api_call(
                self.logger,
                f"sftp://{self.host}:{self.port}",
                "CONNECT",
                duration=duration,
            )

            return result

        except paramiko.AuthenticationException as e:
            error = RakutenFTPError(f"SFTP认证失败: {str(e)}")
            raise error
        except paramiko.SSHException as e:
            error = RakutenFTPError(f"SSH连接错误: {str(e)}")
            raise error
        except (OSError, ConnectionError) as e:
            error = RakutenConnectionError(f"SFTP连接错误: {str(e)}")
            raise error
        except Exception as e:
            error = RakutenFTPError(f"SFTP未知错误: {str(e)}")
            raise error
        finally:
            if error:
                duration = time.time() - start_time
                log_api_call(
                    self.logger,
                    f"sftp://{self.host}:{self.port}",
                    "CONNECT",
                    duration=duration,
                    error=error,
                )
                self.connected = False
                self._cleanup_connections()

    def _mock_connect(self) -> Dict[str, Any]:
        """模拟SFTP连接"""
        self.logger.info(f"模拟SFTP连接: {self.host}:{self.port}")

        # 模拟连接延迟
        time.sleep(0.1)

        self.connected = True

        return {
            "success": True,
            "message": "SFTP连接成功 (模拟)",
            "duration_ms": 100,
            "server_version": "OpenSSH_8.0 (Mock)",
            "host": self.host,
            "port": self.port,
            "username": self.username,
        }

    def _cleanup_connections(self) -> None:
        """清理连接"""
        if self.sftp_client:
            try:
                self.sftp_client.close()
            except Exception:
                pass
            self.sftp_client = None

        if self.ssh_client:
            try:
                self.ssh_client.close()
            except Exception:
                pass
            self.ssh_client = None

    def disconnect(self) -> None:
        """断开SFTP连接"""
        if self.connected:
            try:
                self._cleanup_connections()
                self.logger.info("SFTP连接已断开")
            except Exception as e:
                self.logger.warning(f"断开SFTP连接时出现警告: {str(e)}")
            finally:
                self.connected = False

    def test_connection(self) -> Dict[str, Any]:
        """
        测试SFTP连接

        Returns:
            连接测试结果
        """
        try:
            # 尝试连接
            connect_result = self.connect()

            if connect_result["success"]:
                # 测试基本操作
                operations_result = self._test_basic_operations()

                # 断开连接
                self.disconnect()

                return {
                    "success": True,
                    "message": "SFTP连接测试成功",
                    "data": {
                        "connection": connect_result,
                        "operations": operations_result,
                    },
                }
            else:
                return connect_result

        except Exception as e:
            return {
                "success": False,
                "message": f"SFTP连接测试失败: {str(e)}",
                "error": str(e),
                "error_type": type(e).__name__,
            }

    def _test_basic_operations(self) -> Dict[str, Any]:
        """测试基本SFTP操作"""
        if self.test_mode == TEST_MODE["MOCK"]:
            return self._mock_basic_operations()

        operations = {}

        try:
            # 测试获取当前目录
            current_dir = self.sftp_client.getcwd() or "/"
            operations["pwd"] = {"success": True, "current_directory": current_dir}
        except Exception as e:
            operations["pwd"] = {"success": False, "error": str(e)}

        try:
            # 测试列出文件
            files = self.sftp_client.listdir(".")
            operations["list"] = {
                "success": True,
                "file_count": len(files),
                "files": files[:5],  # 只显示前5个文件
            }
        except Exception as e:
            operations["list"] = {"success": False, "error": str(e)}

        try:
            # 测试获取服务器统计信息
            stat_info = self.sftp_client.stat(".")
            operations["stat"] = {
                "success": True,
                "permissions": oct(stat_info.st_mode)[-3:],
                "size": stat_info.st_size,
                "modified": stat_info.st_mtime,
            }
        except Exception as e:
            operations["stat"] = {"success": False, "error": str(e)}

        return operations

    def _mock_basic_operations(self) -> Dict[str, Any]:
        """模拟基本SFTP操作"""
        return {
            "pwd": {"success": True, "current_directory": "/home/testuser"},
            "list": {
                "success": True,
                "file_count": 3,
                "files": ["folder1", "test.txt", "image.jpg"],
            },
            "stat": {
                "success": True,
                "permissions": "755",
                "size": 4096,
                "modified": 1640995200,
            },
        }

    def list_files(self, path: str = ".") -> List[str]:
        """
        列出指定路径的文件

        Args:
            path: 路径

        Returns:
            文件列表

        Raises:
            RakutenFTPError: 操作失败时
        """
        if not self.connected:
            raise RakutenFTPError("SFTP未连接")

        if self.test_mode == TEST_MODE["MOCK"]:
            return ["test_file1.txt", "test_file2.jpg", "test_folder"]

        try:
            return self.sftp_client.listdir(path)
        except Exception as e:
            raise RakutenFTPError(f"列出文件失败: {str(e)}")

    def health_check(self) -> Dict[str, Any]:
        """
        健康检查

        Returns:
            健康检查结果
        """
        try:
            start_time = time.time()

            # 测试连接
            connect_result = self.connect()

            if connect_result["success"]:
                # 测试基本操作
                operations = self._test_basic_operations()

                # 断开连接
                self.disconnect()

                duration = time.time() - start_time

                return {
                    "status": "healthy",
                    "response_time_ms": round(duration * 1000, 2),
                    "last_check": time.time(),
                    "connection_status": "ok",
                    "operations_status": (
                        "ok"
                        if all(op.get("success", False) for op in operations.values())
                        else "partial"
                    ),
                }
            else:
                return {
                    "status": "unhealthy",
                    "error": connect_result.get("message", "Connection failed"),
                    "last_check": time.time(),
                }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "error_type": type(e).__name__,
                "last_check": time.time(),
            }

    def __enter__(self):
        """上下文管理器入口"""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """上下文管理器出口"""
        self.disconnect()

    def __del__(self):
        """析构函数"""
        self.disconnect()
