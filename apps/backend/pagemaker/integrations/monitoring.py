"""
乐天API监控和指标收集模块
"""

import time
import json
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict, deque
from threading import Lock

from .utils import setup_logger


class APIMetrics:
    """API指标收集器"""

    def __init__(self, max_history: int = 1000):
        """
        初始化指标收集器

        Args:
            max_history: 保留的历史记录数量
        """
        self.logger = setup_logger("rakuten.monitoring")
        self.max_history = max_history
        self.lock = Lock()

        # 指标存储
        self.request_history = deque(maxlen=max_history)
        self.error_counts = defaultdict(int)
        self.response_times = defaultdict(list)
        self.success_counts = defaultdict(int)
        self.total_counts = defaultdict(int)

        # 统计周期
        self.stats_window = timedelta(minutes=5)

        self.logger.info("API指标收集器初始化完成")

    def record_request(
        self,
        endpoint: str,
        method: str,
        response_time_ms: float,
        success: bool,
        error_type: str = None,
        status_code: int = None,
    ):
        """
        记录API请求指标

        Args:
            endpoint: API端点
            method: HTTP方法
            response_time_ms: 响应时间（毫秒）
            success: 是否成功
            error_type: 错误类型
            status_code: HTTP状态码
        """
        with self.lock:
            timestamp = time.time()

            # 记录请求历史
            request_record = {
                "timestamp": timestamp,
                "endpoint": endpoint,
                "method": method,
                "response_time_ms": response_time_ms,
                "success": success,
                "error_type": error_type,
                "status_code": status_code,
            }
            self.request_history.append(request_record)

            # 更新统计计数
            key = f"{method} {endpoint}"
            self.total_counts[key] += 1

            if success:
                self.success_counts[key] += 1
            else:
                self.error_counts[f"{key}:{error_type or 'unknown'}"] += 1

            # 记录响应时间
            if len(self.response_times[key]) >= 100:  # 保留最近100次记录
                self.response_times[key].pop(0)
            self.response_times[key].append(response_time_ms)

    def get_current_stats(self) -> Dict[str, Any]:
        """
        获取当前统计信息

        Returns:
            当前统计数据
        """
        with self.lock:
            now = time.time()
            window_start = now - self.stats_window.total_seconds()

            # 过滤时间窗口内的请求
            recent_requests = [
                req for req in self.request_history if req["timestamp"] >= window_start
            ]

            if not recent_requests:
                return {
                    "window_minutes": self.stats_window.total_seconds() / 60,
                    "total_requests": 0,
                    "success_rate": 0,
                    "avg_response_time_ms": 0,
                    "endpoints": {},
                }

            # 计算总体统计
            total_requests = len(recent_requests)
            successful_requests = sum(1 for req in recent_requests if req["success"])
            success_rate = (successful_requests / total_requests) * 100

            response_times = [req["response_time_ms"] for req in recent_requests]
            avg_response_time = sum(response_times) / len(response_times)

            # 按端点统计
            endpoint_stats = defaultdict(
                lambda: {
                    "total": 0,
                    "success": 0,
                    "errors": defaultdict(int),
                    "response_times": [],
                }
            )

            for req in recent_requests:
                key = f"{req['method']} {req['endpoint']}"
                stats = endpoint_stats[key]
                stats["total"] += 1

                if req["success"]:
                    stats["success"] += 1
                else:
                    stats["errors"][req["error_type"] or "unknown"] += 1

                stats["response_times"].append(req["response_time_ms"])

            # 计算每个端点的详细统计
            endpoints = {}
            for key, stats in endpoint_stats.items():
                if stats["response_times"]:
                    avg_time = sum(stats["response_times"]) / len(
                        stats["response_times"]
                    )
                    max_time = max(stats["response_times"])
                    min_time = min(stats["response_times"])
                else:
                    avg_time = max_time = min_time = 0

                endpoints[key] = {
                    "total_requests": stats["total"],
                    "successful_requests": stats["success"],
                    "success_rate": (stats["success"] / stats["total"]) * 100,
                    "avg_response_time_ms": round(avg_time, 2),
                    "max_response_time_ms": round(max_time, 2),
                    "min_response_time_ms": round(min_time, 2),
                    "errors": dict(stats["errors"]),
                }

            return {
                "window_minutes": self.stats_window.total_seconds() / 60,
                "total_requests": total_requests,
                "successful_requests": successful_requests,
                "success_rate": round(success_rate, 2),
                "avg_response_time_ms": round(avg_response_time, 2),
                "endpoints": endpoints,
            }

    def get_health_status(self) -> Dict[str, Any]:
        """
        获取健康状态

        Returns:
            健康状态信息
        """
        stats = self.get_current_stats()

        # 健康状态判断阈值
        HEALTHY_SUCCESS_RATE = 95.0  # 95%
        HEALTHY_RESPONSE_TIME = 5000  # 5秒

        status = "healthy"
        issues = []

        if stats["total_requests"] > 0:
            if stats["success_rate"] < HEALTHY_SUCCESS_RATE:
                status = "degraded"
                issues.append(f"成功率过低: {stats['success_rate']}%")

            if stats["avg_response_time_ms"] > HEALTHY_RESPONSE_TIME:
                status = "degraded"
                issues.append(f"响应时间过长: {stats['avg_response_time_ms']}ms")

        return {
            "status": status,
            "timestamp": time.time(),
            "issues": issues,
            "stats": stats,
        }

    def export_metrics(self) -> Dict[str, Any]:
        """
        导出所有指标数据

        Returns:
            完整的指标数据
        """
        with self.lock:
            return {
                "export_time": time.time(),
                "total_history_count": len(self.request_history),
                "current_stats": self.get_current_stats(),
                "error_summary": dict(self.error_counts),
                "endpoint_summary": {
                    key: {
                        "total": self.total_counts[key],
                        "success": self.success_counts[key],
                        "success_rate": (
                            (self.success_counts[key] / self.total_counts[key]) * 100
                            if self.total_counts[key] > 0
                            else 0
                        ),
                    }
                    for key in self.total_counts.keys()
                },
            }

    def reset_metrics(self):
        """重置所有指标"""
        with self.lock:
            self.request_history.clear()
            self.error_counts.clear()
            self.response_times.clear()
            self.success_counts.clear()
            self.total_counts.clear()
            self.logger.info("指标数据已重置")


class AlertManager:
    """告警管理器"""

    def __init__(self, metrics: APIMetrics):
        """
        初始化告警管理器

        Args:
            metrics: API指标收集器
        """
        self.metrics = metrics
        self.logger = setup_logger("rakuten.alerts")

        # 告警阈值配置
        self.thresholds = {
            "success_rate_percent": 95.0,
            "avg_response_time_ms": 5000,
            "max_response_time_ms": 10000,
            "error_rate_percent": 5.0,
            "consecutive_failures": 5,
        }

        # 告警状态跟踪
        self.alert_states = {}
        self.consecutive_failures = defaultdict(int)

        self.logger.info("告警管理器初始化完成")

    def check_alerts(self) -> List[Dict[str, Any]]:
        """
        检查告警条件

        Returns:
            触发的告警列表
        """
        alerts = []
        stats = self.metrics.get_current_stats()

        if stats["total_requests"] == 0:
            return alerts

        # 检查整体成功率
        if stats["success_rate"] < self.thresholds["success_rate_percent"]:
            alert = {
                "type": "low_success_rate",
                "severity": "warning",
                "message": f"API成功率过低: {stats['success_rate']}%",
                "threshold": self.thresholds["success_rate_percent"],
                "current_value": stats["success_rate"],
                "timestamp": time.time(),
            }
            alerts.append(alert)

        # 检查平均响应时间
        if stats["avg_response_time_ms"] > self.thresholds["avg_response_time_ms"]:
            alert = {
                "type": "high_response_time",
                "severity": "warning",
                "message": f"API响应时间过长: {stats['avg_response_time_ms']}ms",
                "threshold": self.thresholds["avg_response_time_ms"],
                "current_value": stats["avg_response_time_ms"],
                "timestamp": time.time(),
            }
            alerts.append(alert)

        # 检查各端点的状态
        for endpoint, endpoint_stats in stats["endpoints"].items():
            # 检查端点成功率
            if endpoint_stats["success_rate"] < self.thresholds["success_rate_percent"]:
                alert = {
                    "type": "endpoint_low_success_rate",
                    "severity": "warning",
                    "message": f"端点 {endpoint} 成功率过低: {endpoint_stats['success_rate']}%",
                    "endpoint": endpoint,
                    "threshold": self.thresholds["success_rate_percent"],
                    "current_value": endpoint_stats["success_rate"],
                    "timestamp": time.time(),
                }
                alerts.append(alert)

            # 检查端点最大响应时间
            if (
                endpoint_stats["max_response_time_ms"]
                > self.thresholds["max_response_time_ms"]
            ):
                alert = {
                    "type": "endpoint_high_max_response_time",
                    "severity": "critical",
                    "message": f"端点 {endpoint} 最大响应时间过长: {endpoint_stats['max_response_time_ms']}ms",
                    "endpoint": endpoint,
                    "threshold": self.thresholds["max_response_time_ms"],
                    "current_value": endpoint_stats["max_response_time_ms"],
                    "timestamp": time.time(),
                }
                alerts.append(alert)

        # 记录告警
        for alert in alerts:
            self.logger.warning(f"告警触发: {alert['message']}")

        return alerts

    def update_thresholds(self, new_thresholds: Dict[str, float]):
        """
        更新告警阈值

        Args:
            new_thresholds: 新的阈值配置
        """
        self.thresholds.update(new_thresholds)
        self.logger.info(f"告警阈值已更新: {new_thresholds}")


class MonitoringDashboard:
    """监控面板"""

    def __init__(self, metrics: APIMetrics, alert_manager: AlertManager):
        """
        初始化监控面板

        Args:
            metrics: API指标收集器
            alert_manager: 告警管理器
        """
        self.metrics = metrics
        self.alert_manager = alert_manager
        self.logger = setup_logger("rakuten.dashboard")

    def get_dashboard_data(self) -> Dict[str, Any]:
        """
        获取面板数据

        Returns:
            完整的面板数据
        """
        current_stats = self.metrics.get_current_stats()
        health_status = self.metrics.get_health_status()
        active_alerts = self.alert_manager.check_alerts()

        return {
            "timestamp": time.time(),
            "health": {
                "status": health_status["status"],
                "issues": health_status["issues"],
            },
            "stats": current_stats,
            "alerts": {"count": len(active_alerts), "items": active_alerts},
            "thresholds": self.alert_manager.thresholds,
        }

    def generate_report(self) -> str:
        """
        生成监控报告

        Returns:
            格式化的监控报告
        """
        data = self.get_dashboard_data()

        report = []
        report.append("=" * 60)
        report.append("乐天API监控报告")
        report.append("=" * 60)
        report.append(
            f"生成时间: {datetime.fromtimestamp(data['timestamp']).strftime('%Y-%m-%d %H:%M:%S')}"
        )
        report.append("")

        # 健康状态
        health = data["health"]
        status_emoji = "✅" if health["status"] == "healthy" else "⚠️"
        report.append(f"🏥 健康状态: {status_emoji} {health['status'].upper()}")
        if health["issues"]:
            for issue in health["issues"]:
                report.append(f"   - {issue}")
        report.append("")

        # 统计数据
        stats = data["stats"]
        report.append("📊 统计数据:")
        report.append(f"   - 时间窗口: {stats['window_minutes']} 分钟")
        report.append(f"   - 总请求数: {stats['total_requests']}")
        report.append(f"   - 成功请求数: {stats['successful_requests']}")
        report.append(f"   - 成功率: {stats['success_rate']}%")
        report.append(f"   - 平均响应时间: {stats['avg_response_time_ms']}ms")
        report.append("")

        # 端点详情
        if stats["endpoints"]:
            report.append("🔗 端点详情:")
            for endpoint, endpoint_stats in stats["endpoints"].items():
                report.append(f"   {endpoint}:")
                report.append(f"     - 请求数: {endpoint_stats['total_requests']}")
                report.append(f"     - 成功率: {endpoint_stats['success_rate']}%")
                report.append(
                    f"     - 平均响应时间: {endpoint_stats['avg_response_time_ms']}ms"
                )
                if endpoint_stats["errors"]:
                    report.append(f"     - 错误: {endpoint_stats['errors']}")
            report.append("")

        # 告警信息
        alerts = data["alerts"]
        if alerts["count"] > 0:
            report.append("🚨 活动告警:")
            for alert in alerts["items"]:
                severity_emoji = "🔴" if alert["severity"] == "critical" else "🟡"
                report.append(f"   {severity_emoji} {alert['message']}")
            report.append("")
        else:
            report.append("✅ 无活动告警")
            report.append("")

        report.append("=" * 60)

        return "\n".join(report)


# 全局监控实例
_global_metrics = None
_global_alert_manager = None
_global_dashboard = None


def get_global_metrics() -> APIMetrics:
    """获取全局指标收集器"""
    global _global_metrics
    if _global_metrics is None:
        _global_metrics = APIMetrics()
    return _global_metrics


def get_global_alert_manager() -> AlertManager:
    """获取全局告警管理器"""
    global _global_alert_manager
    if _global_alert_manager is None:
        _global_alert_manager = AlertManager(get_global_metrics())
    return _global_alert_manager


def get_global_dashboard() -> MonitoringDashboard:
    """获取全局监控面板"""
    global _global_dashboard
    if _global_dashboard is None:
        _global_dashboard = MonitoringDashboard(
            get_global_metrics(), get_global_alert_manager()
        )
    return _global_dashboard


def record_api_call(
    endpoint: str,
    method: str,
    response_time_ms: float,
    success: bool,
    error_type: str = None,
    status_code: int = None,
):
    """
    记录API调用（便捷函数）

    Args:
        endpoint: API端点
        method: HTTP方法
        response_time_ms: 响应时间（毫秒）
        success: 是否成功
        error_type: 错误类型
        status_code: HTTP状态码
    """
    metrics = get_global_metrics()
    metrics.record_request(
        endpoint=endpoint,
        method=method,
        response_time_ms=response_time_ms,
        success=success,
        error_type=error_type,
        status_code=status_code,
    )
