from django.shortcuts import render
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    """
    健康检查端点，用于部署验证
    """
    try:
        # 检查数据库连接
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        
        return JsonResponse({
            "status": "healthy",
            "database": "connected",
            "timestamp": "2024-12-19T12:00:00Z"
        })
    except Exception as e:
        return JsonResponse({
            "status": "unhealthy", 
            "error": str(e),
            "timestamp": "2024-12-19T12:00:00Z"
        }, status=500)
