from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from django.utils.dateparse import parse_date
from datetime import datetime
from .models import ShopConfiguration
from .serializers import ShopConfigurationSerializer
from users.models import check_user_role
from pagemaker.integrations.cabinet_client import RCabinetClient
from pagemaker.integrations.exceptions import RakutenAPIError
import logging

logger = logging.getLogger(__name__)

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

    def perform_create(self, serializer):
        """创建店铺配置并自动获取API有效期"""
        # 保存店铺配置
        instance = serializer.save()
        
        # 尝试自动获取API有效期
        try:
            client = RCabinetClient(
                service_secret=instance.api_service_secret,
                license_key=instance.api_license_key,
            )
            
            result = client.get_license_expiry_date()
            
            if result.get("success") and result.get("data"):
                expiry_date_str = result["data"].get("expiryDate")
                
                if expiry_date_str:
                    # 解析日期字符串并保存到数据库
                    if "T" in expiry_date_str:
                        expiry_date = datetime.fromisoformat(
                            expiry_date_str.replace("Z", "+00:00")
                        )
                    else:
                        expiry_date = datetime.strptime(expiry_date_str, "%Y-%m-%d")
                    
                    instance.api_license_expiry_date = expiry_date
                    instance.save()
                    
                    logger.info(
                        f"自动获取店铺 {instance.shop_name} 的API到期日期成功: {expiry_date}"
                    )
        except Exception as e:
            # 如果自动获取失败，不影响店铺创建，只记录日志
            logger.warning(
                f"店铺 {instance.shop_name} 自动获取API到期日期失败: {str(e)}"
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

    def perform_update(self, serializer):
        """更新店铺配置并自动获取API有效期"""
        # 检查API凭证是否有变化
        instance = serializer.instance
        old_service_secret = instance.api_service_secret
        old_license_key = instance.api_license_key
        
        # 保存更新
        instance = serializer.save()
        
        # 如果API凭证有变化，自动获取新的有效期
        new_service_secret = instance.api_service_secret
        new_license_key = instance.api_license_key
        
        if (old_service_secret != new_service_secret or 
            old_license_key != new_license_key):
            try:
                client = RCabinetClient(
                    service_secret=instance.api_service_secret,
                    license_key=instance.api_license_key,
                )
                
                result = client.get_license_expiry_date()
                
                if result.get("success") and result.get("data"):
                    expiry_date_str = result["data"].get("expiryDate")
                    
                    if expiry_date_str:
                        # 解析日期字符串并保存到数据库
                        if "T" in expiry_date_str:
                            expiry_date = datetime.fromisoformat(
                                expiry_date_str.replace("Z", "+00:00")
                            )
                        else:
                            expiry_date = datetime.strptime(expiry_date_str, "%Y-%m-%d")
                        
                        instance.api_license_expiry_date = expiry_date
                        instance.save()
                        
                        logger.info(
                            f"自动更新店铺 {instance.shop_name} 的API到期日期成功: {expiry_date}"
                        )
            except Exception as e:
                # 如果自动获取失败，不影响店铺更新，只记录日志
                logger.warning(
                    f"店铺 {instance.shop_name} 自动更新API到期日期失败: {str(e)}"
                )

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


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminRole])
def refresh_api_expiry(request, id):
    """
    刷新API许可证密钥到期日期
    通过调用乐天LicenseManagementAPI获取到期日期并更新到数据库
    """
    try:
        # 获取店铺配置
        try:
            config = ShopConfiguration.objects.get(id=id)
        except ShopConfiguration.DoesNotExist:
            return Response(
                {"success": False, "message": "店铺配置不存在"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # 初始化乐天API客户端
        try:
            client = RCabinetClient(
                service_secret=config.api_service_secret,
                license_key=config.api_license_key,
            )
        except Exception as e:
            logger.error(f"初始化乐天API客户端失败: {str(e)}")
            return Response(
                {"success": False, "message": f"API客户端初始化失败: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # 调用乐天LicenseManagementAPI获取许可证到期日期
        try:
            result = client.get_license_expiry_date()
            
            if result.get("success") and result.get("data"):
                expiry_date_str = result["data"].get("expiryDate")
                
                if expiry_date_str:
                    # 解析日期字符串并保存到数据库
                    # 格式可能是 "2025-12-31" 或 "2025-12-31T00:00:00Z"
                    if "T" in expiry_date_str:
                        expiry_date = datetime.fromisoformat(
                            expiry_date_str.replace("Z", "+00:00")
                        )
                    else:
                        expiry_date = datetime.strptime(expiry_date_str, "%Y-%m-%d")
                    
                    config.api_license_expiry_date = expiry_date
                    config.save()
                    
                    logger.info(
                        f"成功刷新店铺 {config.shop_name} 的API到期日期: {expiry_date}"
                    )
                    
                    return Response(
                        {
                            "success": True,
                            "message": "API密钥到期日期刷新成功",
                            "data": {
                                "apiLicenseExpiryDate": expiry_date.isoformat()
                            },
                        }
                    )
                else:
                    return Response(
                        {"success": False, "message": "API返回的数据中未包含到期日期"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )
            else:
                return Response(
                    {"success": False, "message": "API返回失败"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
                
        except RakutenAPIError as e:
            logger.error(f"调用乐天API失败: {str(e)}")
            return Response(
                {"success": False, "message": f"调用乐天API失败: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    except Exception as e:
        logger.error(f"刷新API到期日期失败: {str(e)}", exc_info=True)
        return Response(
            {"success": False, "message": f"服务器内部错误: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
