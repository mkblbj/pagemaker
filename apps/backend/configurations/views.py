from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework import status
from .models import ShopConfiguration
from .serializers import ShopConfigurationSerializer
from users.models import check_user_role

# Create your views here.


class IsAdminRole(BasePermission):
    """
    自定义权限类：只允许admin角色用户访问
    使用UserProfile的权限检查系统
    """

    def has_permission(self, request, view):
        # 首先确保用户已认证
        if not request.user or not request.user.is_authenticated:
            return False

        # 使用UserProfile的权限检查函数
        return check_user_role(request.user, "admin")


class ShopConfigurationListCreateView(generics.ListCreateAPIView):
    """
    店铺配置列表和创建视图
    GET: 获取所有店铺配置列表
    POST: 创建新的店铺配置
    权限：仅admin用户可访问
    """

    queryset = ShopConfiguration.objects.all()
    serializer_class = ShopConfigurationSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]

    def list(self, request, *args, **kwargs):
        """重写list方法以提供更好的响应格式"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(
            {"success": True, "data": serializer.data, "count": queryset.count()}
        )

    def create(self, request, *args, **kwargs):
        """重写create方法以提供更好的响应格式"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(
                {
                    "success": True,
                    "data": serializer.data,
                    "message": "店铺配置创建成功",
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {
                "success": False,
                "errors": serializer.errors,
                "message": "店铺配置创建失败",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class ShopConfigurationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    店铺配置详情、更新和删除视图
    GET: 获取单个店铺配置
    PUT: 更新店铺配置
    DELETE: 删除店铺配置
    权限：仅admin用户可访问
    """

    queryset = ShopConfiguration.objects.all()
    serializer_class = ShopConfigurationSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    lookup_field = "id"

    def retrieve(self, request, *args, **kwargs):
        """重写retrieve方法以提供更好的响应格式"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({"success": True, "data": serializer.data})

    def update(self, request, *args, **kwargs):
        """重写update方法以提供更好的响应格式"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            self.perform_update(serializer)
            return Response(
                {
                    "success": True,
                    "data": serializer.data,
                    "message": "店铺配置更新成功",
                }
            )
        return Response(
            {
                "success": False,
                "errors": serializer.errors,
                "message": "店铺配置更新失败",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def destroy(self, request, *args, **kwargs):
        """重写destroy方法以提供更好的响应格式"""
        instance = self.get_object()
        shop_name = instance.shop_name
        self.perform_destroy(instance)
        return Response(
            {"success": True, "message": f'店铺配置"{shop_name}"删除成功'},
            status=status.HTTP_200_OK,
        )
