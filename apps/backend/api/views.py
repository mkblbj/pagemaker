"""
API 视图
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.db import connection
from django.utils import timezone
from pagemaker.integrations.cabinet_client import RCabinetClient
from pagemaker.integrations.exceptions import RakutenAPIError
import logging

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    系统健康检查
    """
    try:
        # 检查数据库连接
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_status = "connected"
    except Exception as e:
        logger.error(f"数据库连接检查失败: { e}")
        db_status = "disconnected"

    return Response(
        {
            "status": "healthy",
            "database": db_status,
            "timestamp": timezone.now().isoformat(),
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def rakuten_health_check(request):
    """
    R-Cabinet集成健康检查

    Request:
        GET /api/v1/health/rakuten/

    Response:
        200: R-Cabinet服务正常
        503: R-Cabinet服务不可用
    """
    try:
        # 初始化R-Cabinet客户端
        cabinet_client = RCabinetClient()

        # 执行健康检查
        health_result = cabinet_client.health_check()

        if health_result.get("status") == "healthy":
            return Response(
                {
                    "success": True,
                    "service": "R-Cabinet",
                    "status": "healthy",
                    "data": {
                        "response_time_ms": health_result.get("response_time_ms"),
                        "api_status": health_result.get("api_status"),
                        "last_check": health_result.get("last_check"),
                        "request_id": health_result.get("request_id"),
                    },
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {
                    "success": False,
                    "service": "R-Cabinet",
                    "status": "unhealthy",
                    "error": {
                        "code": "SERVICE_UNAVAILABLE",
                        "message": health_result.get("error", "R-Cabinet服务不可用"),
                        "error_type": health_result.get("error_type"),
                        "last_check": health_result.get("last_check"),
                    },
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

    except RakutenAPIError as e:
        logger.error(f"R-Cabinet健康检查API错误: {e}")
        return Response(
            {
                "success": False,
                "service": "R-Cabinet",
                "status": "unhealthy",
                "error": {
                    "code": "API_ERROR",
                    "message": f"R-Cabinet API错误: {str(e)}",
                    "error_type": type(e).__name__,
                },
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    except Exception as e:
        logger.error(f"R-Cabinet健康检查异常: {e}")
        return Response(
            {
                "success": False,
                "service": "R-Cabinet",
                "status": "unhealthy",
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": f"健康检查失败: {str(e)}",
                    "error_type": type(e).__name__,
                },
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
