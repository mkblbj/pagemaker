"""
乐天API集成降级和备用方案模块
"""

import json
import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from enum import Enum
from threading import Lock

from .utils import setup_logger
from .constants import CABINET_RESULT_CODES, HTTP_STATUS_CODES
from .exceptions import RakutenAPIError, RakutenConnectionError


class ServiceStatus(Enum):
    """服务状态枚举"""

    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNAVAILABLE = "unavailable"
    MAINTENANCE = "maintenance"


class FallbackStrategy(Enum):
    """降级策略枚举"""

    RETRY_WITH_BACKOFF = "retry_with_backoff"
    CIRCUIT_BREAKER = "circuit_breaker"
    CACHE_FALLBACK = "cache_fallback"
    MOCK_RESPONSE = "mock_response"
    DISABLE_FEATURE = "disable_feature"


class CircuitBreakerState(Enum):
    """断路器状态"""

    CLOSED = "closed"  # 正常状态
    OPEN = "open"  # 断开状态
    HALF_OPEN = "half_open"  # 半开状态


class CircuitBreaker:
    """断路器实现"""

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: Exception = RakutenAPIError,
    ):
        """
        初始化断路器

        Args:
            failure_threshold: 失败阈值
            recovery_timeout: 恢复超时时间（秒）
            expected_exception: 预期的异常类型
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception

        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitBreakerState.CLOSED
        self.lock = Lock()

        self.logger = setup_logger("rakuten.circuit_breaker")

    def call(self, func, *args, **kwargs):
        """
        通过断路器调用函数

        Args:
            func: 要调用的函数
            *args: 位置参数
            **kwargs: 关键字参数

        Returns:
            函数调用结果

        Raises:
            RakutenAPIError: 当断路器开启时
        """
        with self.lock:
            if self.state == CircuitBreakerState.OPEN:
                if self._should_attempt_reset():
                    self.state = CircuitBreakerState.HALF_OPEN
                    self.logger.info("断路器进入半开状态")
                else:
                    raise RakutenAPIError("断路器开启，服务不可用")

            try:
                result = func(*args, **kwargs)
                self._on_success()
                return result
            except self.expected_exception:
                self._on_failure()
                raise

    def _should_attempt_reset(self) -> bool:
        """检查是否应该尝试重置断路器"""
        return (
            self.last_failure_time
            and time.time() - self.last_failure_time >= self.recovery_timeout
        )

    def _on_success(self):
        """成功时的处理"""
        self.failure_count = 0
        if self.state == CircuitBreakerState.HALF_OPEN:
            self.state = CircuitBreakerState.CLOSED
            self.logger.info("断路器重置为关闭状态")

    def _on_failure(self):
        """失败时的处理"""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitBreakerState.OPEN
            self.logger.warning(f"断路器开启，失败次数: {self.failure_count}")


class FallbackManager:
    """降级管理器"""

    def __init__(self):
        """初始化降级管理器"""
        self.logger = setup_logger("rakuten.fallback")
        self.service_status = {}
        self.circuit_breakers = {}
        self.cache = {}
        self.feature_flags = {}
        self.lock = Lock()

        # 初始化断路器
        self._init_circuit_breakers()

        # 初始化功能开关
        self._init_feature_flags()

        self.logger.info("降级管理器初始化完成")

    def _init_circuit_breakers(self):
        """初始化断路器"""
        services = ["cabinet_api", "license_api", "ftp_service"]

        for service in services:
            self.circuit_breakers[service] = CircuitBreaker(
                failure_threshold=5, recovery_timeout=60
            )

    def _init_feature_flags(self):
        """初始化功能开关"""
        self.feature_flags = {
            "cabinet_api_enabled": True,
            "license_api_enabled": True,
            "ftp_service_enabled": True,
            "auto_retry_enabled": True,
            "cache_fallback_enabled": True,
        }

    def execute_with_fallback(
        self, service_name: str, primary_func, fallback_func=None, *args, **kwargs
    ):
        """
        执行带降级的服务调用

        Args:
            service_name: 服务名称
            primary_func: 主要函数
            fallback_func: 降级函数
            *args: 位置参数
            **kwargs: 关键字参数

        Returns:
            函数执行结果
        """
        # 检查功能开关
        if not self.is_feature_enabled(f"{service_name}_enabled"):
            self.logger.warning(f"服务 {service_name} 已禁用")
            if fallback_func:
                return fallback_func(*args, **kwargs)
            else:
                raise RakutenAPIError(f"服务 {service_name} 已禁用且无降级方案")

        # 通过断路器执行
        circuit_breaker = self.circuit_breakers.get(service_name)
        if circuit_breaker:
            try:
                return circuit_breaker.call(primary_func, *args, **kwargs)
            except RakutenAPIError as e:
                self.logger.error(f"服务 {service_name} 调用失败: {e}")

                # 尝试降级方案
                if fallback_func:
                    self.logger.info(f"执行服务 {service_name} 的降级方案")
                    return fallback_func(*args, **kwargs)
                else:
                    raise
        else:
            # 直接执行（无断路器保护）
            try:
                return primary_func(*args, **kwargs)
            except Exception:
                if fallback_func:
                    self.logger.info(f"执行服务 {service_name} 的降级方案")
                    return fallback_func(*args, **kwargs)
                else:
                    raise

    def set_service_status(self, service_name: str, status: ServiceStatus):
        """设置服务状态"""
        with self.lock:
            self.service_status[service_name] = {
                "status": status,
                "updated_at": time.time(),
            }
            self.logger.info(f"服务 {service_name} 状态更新为: {status.value}")

    def get_service_status(self, service_name: str) -> Optional[ServiceStatus]:
        """获取服务状态"""
        with self.lock:
            service_info = self.service_status.get(service_name)
            if service_info:
                return service_info["status"]
            return None

    def is_feature_enabled(self, feature_name: str) -> bool:
        """检查功能是否启用"""
        return self.feature_flags.get(feature_name, False)

    def enable_feature(self, feature_name: str):
        """启用功能"""
        with self.lock:
            self.feature_flags[feature_name] = True
            self.logger.info(f"功能 {feature_name} 已启用")

    def disable_feature(self, feature_name: str):
        """禁用功能"""
        with self.lock:
            self.feature_flags[feature_name] = False
            self.logger.warning(f"功能 {feature_name} 已禁用")

    def cache_response(self, key: str, response: Any, ttl: int = 300):
        """缓存响应"""
        with self.lock:
            self.cache[key] = {"data": response, "expires_at": time.time() + ttl}

    def get_cached_response(self, key: str) -> Optional[Any]:
        """获取缓存响应"""
        with self.lock:
            cached = self.cache.get(key)
            if cached and cached["expires_at"] > time.time():
                return cached["data"]
            elif cached:
                # 缓存过期，删除
                del self.cache[key]
            return None

    def get_fallback_status(self) -> Dict[str, Any]:
        """获取降级状态"""
        with self.lock:
            return {
                "service_status": {
                    name: {
                        "status": info["status"].value,
                        "updated_at": info["updated_at"],
                    }
                    for name, info in self.service_status.items()
                },
                "circuit_breakers": {
                    name: {
                        "state": cb.state.value,
                        "failure_count": cb.failure_count,
                        "last_failure_time": cb.last_failure_time,
                    }
                    for name, cb in self.circuit_breakers.items()
                },
                "feature_flags": self.feature_flags.copy(),
                "cache_keys": list(self.cache.keys()),
            }


class EmergencyProcedures:
    """紧急情况处理程序"""

    def __init__(self, fallback_manager: FallbackManager):
        """
        初始化紧急处理程序

        Args:
            fallback_manager: 降级管理器实例
        """
        self.fallback_manager = fallback_manager
        self.logger = setup_logger("rakuten.emergency")

    def emergency_disable_all_apis(self):
        """紧急情况下禁用所有API"""
        self.logger.critical("执行紧急禁用所有API")

        apis = ["cabinet_api_enabled", "license_api_enabled", "ftp_service_enabled"]
        for api in apis:
            self.fallback_manager.disable_feature(api)

        self.logger.critical("所有API已紧急禁用")

    def emergency_enable_cache_only_mode(self):
        """紧急情况下启用仅缓存模式"""
        self.logger.critical("启用紧急缓存模式")

        self.fallback_manager.enable_feature("cache_fallback_enabled")
        self.emergency_disable_all_apis()

        self.logger.critical("紧急缓存模式已启用")

    def reset_circuit_breakers(self):
        """重置所有断路器"""
        self.logger.warning("重置所有断路器")

        for name, cb in self.fallback_manager.circuit_breakers.items():
            with cb.lock:
                cb.failure_count = 0
                cb.last_failure_time = None
                cb.state = CircuitBreakerState.CLOSED

            self.logger.info(f"断路器 {name} 已重置")

    def generate_emergency_report(self) -> str:
        """生成紧急情况报告"""
        status = self.fallback_manager.get_fallback_status()

        report = f"""
=== 紧急情况报告 ===
生成时间: {datetime.now().isoformat()}

服务状态:
"""

        for service, info in status["service_status"].items():
            report += f"  - {service}: {info['status']}\n"

        report += "\n断路器状态:\n"
        for cb_name, cb_info in status["circuit_breakers"].items():
            report += f"  - {cb_name}: {cb_info['state']} (失败次数: {cb_info['failure_count']})\n"

        report += "\n功能开关状态:\n"
        for feature, enabled in status["feature_flags"].items():
            report += f"  - {feature}: {'启用' if enabled else '禁用'}\n"

        return report


# 全局实例
_fallback_manager = None
_emergency_procedures = None


def get_fallback_manager() -> FallbackManager:
    """获取全局降级管理器实例"""
    global _fallback_manager
    if _fallback_manager is None:
        _fallback_manager = FallbackManager()
    return _fallback_manager


def get_emergency_procedures() -> EmergencyProcedures:
    """获取全局紧急处理程序实例"""
    global _emergency_procedures
    if _emergency_procedures is None:
        _emergency_procedures = EmergencyProcedures(get_fallback_manager())
    return _emergency_procedures


# 便捷函数
def execute_with_fallback(
    service_name: str, primary_func, fallback_func=None, *args, **kwargs
):
    """执行带降级的服务调用（便捷函数）"""
    manager = get_fallback_manager()
    return manager.execute_with_fallback(
        service_name, primary_func, fallback_func, *args, **kwargs
    )


def emergency_disable_all():
    """紧急禁用所有API（便捷函数）"""
    procedures = get_emergency_procedures()
    procedures.emergency_disable_all_apis()


def emergency_cache_only():
    """紧急启用仅缓存模式（便捷函数）"""
    procedures = get_emergency_procedures()
    procedures.emergency_enable_cache_only_mode()
