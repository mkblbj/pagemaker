"""
仪表盘 API 视图

提供仪表盘所需的统计数据和最近活动
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from pages.models import PageTemplate
from pages.activity_logger import PageActivity
from configurations.models import ShopConfiguration


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    获取仪表盘统计数据

    Request:
        GET /api/v1/dashboard/stats/

    Response:
        200: {
            "success": true,
            "data": {
                "pages": {
                    "total": 12,
                    "by_device": {"pc": 8, "mobile": 4},
                    "recent_change": "+2"
                },
                "shops": {
                    "total": 3,
                    "pages_by_shop": [
                        {"shop_name": "店铺A", "page_count": 5},
                        ...
                    ]
                },
                "activities": [
                    {
                        "id": "uuid",
                        "action": "created",
                        "page_name": "关于我们",
                        "user": "admin",
                        "shop_name": "店铺A",
                        "created_at": "2025-10-24T10:30:00Z"
                    },
                    ...
                ]
            }
        }
    """
    try:
        # 获取用户可访问的页面（根据权限过滤）
        user = request.user
        if hasattr(user, 'userprofile') and user.userprofile.is_admin():
            # 管理员可以看到所有页面
            pages_queryset = PageTemplate.objects.all()
        else:
            # 普通用户只能看到自己的页面
            pages_queryset = PageTemplate.objects.filter(owner=user)

        # 统计总页面数
        total_pages = pages_queryset.count()

        # 按设备类型统计
        pages_by_device = pages_queryset.values('device_type').annotate(
            count=Count('id')
        ).order_by('device_type')
        device_stats = {item['device_type']: item['count'] for item in pages_by_device}

        # 计算最近变化（与上个月比较）
        last_month = timezone.now() - timedelta(days=30)
        recent_pages = pages_queryset.filter(created_at__gte=last_month).count()
        recent_change = f"+{recent_pages}" if recent_pages > 0 else "0"

        # 统计店铺数据
        shops = ShopConfiguration.objects.all()
        total_shops = shops.count()

        # 统计各店铺的页面数
        pages_by_shop = []
        for shop in shops:
            shop_pages = pages_queryset.filter(shop=shop).count()
            pages_by_shop.append({
                "shop_id": str(shop.id),
                "shop_name": shop.shop_name,
                "page_count": shop_pages,
            })

        # 获取最近10条活动记录
        activities_queryset = PageActivity.objects.select_related('user')
        
        # 如果是普通用户，只显示自己的活动
        if not (hasattr(user, 'userprofile') and user.userprofile.is_admin()):
            activities_queryset = activities_queryset.filter(user=user)
        
        recent_activities = activities_queryset[:10]

        activities_data = []
        for activity in recent_activities:
            activities_data.append({
                "id": str(activity.id),
                "action": activity.action,
                "action_display": activity.get_action_display(),
                "page_id": str(activity.page_id),
                "page_name": activity.page_name,
                "user": activity.user.username if activity.user else "系统",
                "shop_name": activity.shop_name,
                "device_type": activity.device_type,
                "created_at": activity.created_at.isoformat(),
            })

        return Response({
            "success": True,
            "data": {
                "pages": {
                    "total": total_pages,
                    "by_device": device_stats,
                    "recent_change": recent_change,
                },
                "shops": {
                    "total": total_shops,
                    "pages_by_shop": pages_by_shop,
                },
                "activities": activities_data,
            }
        })

    except Exception as e:
        return Response(
            {
                "success": False,
                "error": {
                    "code": "DASHBOARD_ERROR",
                    "message": str(e),
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

