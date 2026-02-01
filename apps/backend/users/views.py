"""
用户注册和管理API视图
"""

from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import UserProfile, check_user_role
from .serializers import UserRegistrationSerializer, UserProfileSerializer

User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])  # 公开注册接口
def register_user(request):
    """
    用户注册接口
    
    POST /api/v1/users/register/
    {
        "username": "john",
        "password": "securepass123",
        "email": "john@example.com",  // 可选
        "full_name": "John Doe"  // 可选
    }
    """
    try:
        serializer = UserRegistrationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "数据验证失败",
                        "details": serializer.errors,
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # 创建用户
        user = serializer.save()
        
        return Response(
            {
                "success": True,
                "message": "用户注册成功",
                "data": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.userprofile.role,
                    "full_name": user.userprofile.full_name,
                },
            },
            status=status.HTTP_201_CREATED,
        )
        
    except Exception as e:
        return Response(
            {
                "success": False,
                "error": {
                    "code": "REGISTRATION_ERROR",
                    "message": f"注册失败: {str(e)}",
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    获取当前登录用户信息
    
    GET /api/v1/users/me/
    """
    try:
        user = request.user
        profile = user.userprofile
        
        return Response(
            {
                "success": True,
                "data": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "full_name": profile.full_name,
                    "role": profile.role,
                    "is_admin": profile.is_admin(),
                    "created_at": profile.created_at.isoformat(),
                },
            }
        )
        
    except Exception as e:
        return Response(
            {
                "success": False,
                "error": {
                    "code": "FETCH_ERROR",
                    "message": f"获取用户信息失败: {str(e)}",
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_users(request):
    """
    获取用户列表（仅admin可用）
    
    GET /api/v1/users/
    """
    try:
        # 检查权限
        if not check_user_role(request.user, "admin"):
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "PERMISSION_DENIED",
                        "message": "只有管理员可以查看用户列表",
                    },
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        
        # 获取所有用户
        users = User.objects.select_related("userprofile").all()
        
        users_data = []
        for user in users:
            try:
                profile = user.userprofile
                users_data.append({
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "full_name": profile.full_name,
                    "role": profile.role,
                    "is_superuser": user.is_superuser,
                    "created_at": profile.created_at.isoformat(),
                })
            except UserProfile.DoesNotExist:
                # 如果用户没有profile，跳过
                continue
        
        return Response(
            {
                "success": True,
                "data": {
                    "users": users_data,
                    "total": len(users_data),
                },
            }
        )
        
    except Exception as e:
        return Response(
            {
                "success": False,
                "error": {
                    "code": "LIST_ERROR",
                    "message": f"获取用户列表失败: {str(e)}",
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
