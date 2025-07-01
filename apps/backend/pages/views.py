from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import Http404
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import PageTemplate
from .serializers import (
    PageTemplateSerializer,
    CreatePageTemplateSerializer,
    UpdatePageTemplateSerializer,
    PageTemplateListSerializer,
)
from .permissions import IsOwnerOrAdmin, PageTemplatePermissionMixin, get_user_role
from .repositories import PageTemplateRepository


class PageListCreateView(generics.ListCreateAPIView):
    """
    PageTemplate列表和创建视图

    GET /api/v1/pages/ - 获取页面列表
    POST /api/v1/pages/ - 创建新页面
    """

    serializer_class = PageTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """根据用户权限返回查询集"""
        user = self.request.user
        user_role = get_user_role(user)

        if user_role == "admin":
            # 管理员可以看到所有页面
            queryset = PageTemplate.objects.select_related("owner").all()
        else:
            # 编辑者只能看到自己的页面
            queryset = PageTemplate.objects.select_related("owner").filter(owner=user)

        # 处理搜索参数
        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(name__icontains=search)

        # 处理目标区域过滤
        target_area = self.request.query_params.get("target_area", None)
        if target_area:
            queryset = queryset.filter(target_area=target_area)

        return queryset.order_by("-updated_at")

    def list(self, request, *args, **kwargs):
        """获取页面列表"""
        try:
            queryset = self.get_queryset()

            # 分页处理
            limit = int(request.query_params.get("limit", 20))
            offset = int(request.query_params.get("offset", 0))

            total = queryset.count()
            pages_queryset = queryset[offset : offset + limit]

            # 序列化数据
            pages_data = []
            for page in pages_queryset:
                page_data = {
                    "id": str(page.id),
                    "name": page.name,
                    "target_area": page.target_area,
                    "owner_id": str(page.owner.id),
                    "owner_username": page.owner.username,
                    "created_at": page.created_at.isoformat(),
                    "updated_at": page.updated_at.isoformat(),
                    "module_count": page.module_count,
                }
                pages_data.append(page_data)

            return Response(
                {
                    "success": True,
                    "data": {
                        "pages": pages_data,
                        "pagination": {
                            "total": total,
                            "limit": limit,
                            "offset": offset,
                            "has_more": offset + limit < total,
                        },
                    },
                }
            )

        except Exception as e:
            return Response(
                {"success": False, "error": {"code": "LIST_ERROR", "message": str(e)}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def create(self, request, *args, **kwargs):
        """创建新页面"""
        try:
            # 检查用户权限
            user_role = get_user_role(request.user)
            if user_role not in ["admin", "editor"]:
                return Response(
                    {
                        "success": False,
                        "error": {
                            "code": "PERMISSION_DENIED",
                            "message": "您没有创建页面的权限",
                        },
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # 验证数据
            serializer = self.get_serializer(data=request.data)
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

            # 创建页面
            page = PageTemplateRepository.create_page(
                name=serializer.validated_data["name"],
                content=serializer.validated_data["content"],
                target_area=serializer.validated_data["target_area"],
                owner=request.user,
            )

            # 返回创建的页面数据
            response_data = {
                "id": str(page.id),
                "name": page.name,
                "content": page.content,
                "target_area": page.target_area,
                "owner_id": str(page.owner.id),
                "created_at": page.created_at.isoformat(),
                "updated_at": page.updated_at.isoformat(),
                "module_count": page.module_count,
            }

            return Response(
                {"success": True, "data": response_data}, status=status.HTTP_201_CREATED
            )

        except DjangoValidationError as e:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "数据验证失败",
                        "details": (
                            e.message_dict if hasattr(e, "message_dict") else str(e)
                        ),
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": {"code": "CREATE_ERROR", "message": str(e)},
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    PageTemplate详情视图

    GET /api/v1/pages/{id}/ - 获取页面详情
    PATCH /api/v1/pages/{id}/ - 更新页面
    DELETE /api/v1/pages/{id}/ - 删除页面
    """

    serializer_class = PageTemplateSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def get_object(self):
        """获取页面对象，考虑权限控制"""
        page_id = self.kwargs.get("id")
        page = PageTemplateRepository.get_page_by_id(page_id, self.request.user)

        if not page:
            raise Http404("页面不存在或您没有访问权限")

        return page

    def retrieve(self, request, *args, **kwargs):
        """获取页面详情"""
        try:
            page = self.get_object()

            response_data = {
                "id": str(page.id),
                "name": page.name,
                "content": page.content,
                "target_area": page.target_area,
                "owner_id": str(page.owner.id),
                "created_at": page.created_at.isoformat(),
                "updated_at": page.updated_at.isoformat(),
                "module_count": page.module_count,
            }

            return Response({"success": True, "data": response_data})

        except Http404:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "页面不存在或您没有访问权限",
                    },
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": {"code": "RETRIEVE_ERROR", "message": str(e)},
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def update(self, request, *args, **kwargs):
        """更新页面"""
        try:
            page_id = self.kwargs.get("id")

            # 验证数据
            serializer = self.get_serializer(data=request.data, partial=True)
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

            # 更新页面
            updated_page = PageTemplateRepository.update_page(
                page_id=page_id, user=request.user, **serializer.validated_data
            )

            if not updated_page:
                return Response(
                    {
                        "success": False,
                        "error": {
                            "code": "NOT_FOUND",
                            "message": "页面不存在或您没有修改权限",
                        },
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            # 返回更新后的页面数据
            response_data = {
                "id": str(updated_page.id),
                "name": updated_page.name,
                "content": updated_page.content,
                "target_area": updated_page.target_area,
                "owner_id": str(updated_page.owner.id),
                "created_at": updated_page.created_at.isoformat(),
                "updated_at": updated_page.updated_at.isoformat(),
                "module_count": updated_page.module_count,
            }

            return Response({"success": True, "data": response_data})

        except DjangoValidationError as e:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "数据验证失败",
                        "details": (
                            e.message_dict if hasattr(e, "message_dict") else str(e)
                        ),
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": {"code": "UPDATE_ERROR", "message": str(e)},
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def destroy(self, request, *args, **kwargs):
        """删除页面"""
        try:
            page_id = self.kwargs.get("id")

            success = PageTemplateRepository.delete_page(
                page_id=page_id, user=request.user
            )

            if not success:
                return Response(
                    {
                        "success": False,
                        "error": {
                            "code": "NOT_FOUND",
                            "message": "页面不存在或您没有删除权限",
                        },
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            return Response({"success": True, "message": "页面已成功删除"})

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": {"code": "DELETE_ERROR", "message": str(e)},
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# 为了向后兼容，保留原有的类名
PageTemplateListCreateView = PageListCreateView
PageTemplateDetailView = PageDetailView
