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
        logger.error(f"数据库连接检查失败: {e}")
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
    R-Cabinet集成健康检查 - 检查所有店铺的配置

    Request:
        GET /api/v1/health/rakuten/

    Response:
        200: 所有店铺的R-Cabinet服务正常
        503: 部分或全部店铺的R-Cabinet服务不可用
    """
    try:
        from configurations.models import ShopConfiguration
        
        shops = ShopConfiguration.objects.all()
        
        if not shops.exists():
            return Response(
                {
                    "success": False,
                    "service": "R-Cabinet",
                    "status": "no_shops_configured",
                    "message": "没有配置任何店铺",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        
        shop_health_results = []
        all_healthy = True
        
        for shop in shops:
            try:
                # 为每个店铺创建客户端并检查健康状态
                cabinet_client = RCabinetClient.from_shop_config(shop)
                health_result = cabinet_client.health_check()
                
                shop_result = {
                    "shop_id": str(shop.id),
                    "shop_name": shop.shop_name,
                    "target_area": shop.target_area,
                    "status": health_result.get("status"),
                    "response_time_ms": health_result.get("response_time_ms"),
                }
                
                if health_result.get("status") != "healthy":
                    all_healthy = False
                    shop_result["error"] = health_result.get("error")
                
                shop_health_results.append(shop_result)
                
            except Exception as e:
                all_healthy = False
                shop_health_results.append({
                    "shop_id": str(shop.id),
                    "shop_name": shop.shop_name,
                    "target_area": shop.target_area,
                    "status": "error",
                    "error": str(e),
                })
        
        if all_healthy:
            return Response(
                {
                    "success": True,
                    "service": "R-Cabinet",
                    "status": "healthy",
                    "shops": shop_health_results,
                    "total_shops": len(shop_health_results),
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {
                    "success": False,
                    "service": "R-Cabinet",
                    "status": "partial_healthy",
                    "shops": shop_health_results,
                    "total_shops": len(shop_health_results),
                    "healthy_shops": sum(1 for s in shop_health_results if s.get("status") == "healthy"),
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
