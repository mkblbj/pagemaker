from django.shortcuts import render

# Create your views here.

"""
媒体文件上传API视图
"""

import logging
from typing import Dict, Any
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import MediaFile
from .validators import validate_uploaded_file, get_file_format_info
from pagemaker.integrations.cabinet_client import RCabinetClient
from pagemaker.integrations.exceptions import RakutenAPIError

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_media_file(request):
    """
    上传媒体文件到R-Cabinet

    Request:
        POST /api/v1/media/upload/
        Content-Type: multipart/form-data
        Body:
            file: 上传的文件
            folder_id: 目标文件夹ID（可选）
            alt_text: 替代文本（可选）

    Response:
        201: 上传成功
        400: 验证失败
        500: 上传失败
    """
    try:
        # 检查是否有文件上传
        if "file" not in request.FILES:
            return Response(
                {"error": {"code": "FILE_REQUIRED", "message": "请选择要上传的文件"}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        uploaded_file = request.FILES["file"]
        folder_id = request.data.get("folder_id")
        alt_text = request.data.get("alt_text", "")

        # 文件验证
        is_valid, error_message = validate_uploaded_file(uploaded_file)
        if not is_valid:
            return Response(
                {"error": {"code": "FILE_VALIDATION_ERROR", "message": error_message}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 获取文件格式信息
        format_info = get_file_format_info(uploaded_file)

        # 创建MediaFile记录
        media_file = MediaFile.objects.create(
            user=request.user,
            original_filename=uploaded_file.name,
            file_size=uploaded_file.size,
            content_type=uploaded_file.content_type or "application/octet-stream",
            upload_status="pending",
        )

        try:
            # 检查R-Cabinet集成功能开关
            from pagemaker.config import config

            if not config.RCABINET_INTEGRATION_ENABLED:
                media_file.upload_status = "failed"
                media_file.error_message = "R-Cabinet集成功能已禁用"
                media_file.save()

                return Response(
                    {
                        "error": {
                            "code": "SERVICE_DISABLED",
                            "message": "R-Cabinet集成功能当前不可用，请稍后重试",
                            "media_file_id": media_file.id,
                        }
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            # 初始化R-Cabinet客户端
            cabinet_client = RCabinetClient()

            # 读取文件数据
            uploaded_file.seek(0)
            file_data = uploaded_file.read()

            # 上传到R-Cabinet
            upload_result = cabinet_client.upload_file(
                file_data=file_data,
                filename=uploaded_file.name,
                folder_id=int(folder_id) if folder_id else None,
                alt_text=alt_text,
            )

            # 更新MediaFile记录
            if upload_result.get("success"):
                file_data_result = upload_result.get("data", {})
                media_file.rcabinet_file_id = file_data_result.get("file_id")
                media_file.rcabinet_url = file_data_result.get("file_url", "")
                media_file.upload_status = "completed"
                media_file.save()

                return Response(
                    {
                        "success": True,
                        "data": {
                            "id": media_file.id,
                            "filename": media_file.original_filename,
                            "file_size": media_file.file_size,
                            "content_type": media_file.content_type,
                            "rcabinet_url": media_file.rcabinet_url,
                            "rcabinet_file_id": media_file.rcabinet_file_id,
                            "upload_status": media_file.upload_status,
                            "format_info": format_info,
                            "created_at": media_file.created_at.isoformat(),
                        },
                    },
                    status=status.HTTP_201_CREATED,
                )
            else:
                # 上传失败
                error_msg = upload_result.get("error", "上传失败")
                media_file.upload_status = "failed"
                media_file.error_message = error_msg
                media_file.save()

                return Response(
                    {
                        "error": {
                            "code": "UPLOAD_FAILED",
                            "message": f"R-Cabinet上传失败: {error_msg}",
                            "media_file_id": media_file.id,
                        }
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        except RakutenAPIError as e:
            # R-Cabinet API错误
            media_file.upload_status = "failed"
            media_file.error_message = str(e)
            media_file.save()

            logger.error(f"R-Cabinet API错误: {e}")

            return Response(
                {
                    "error": {
                        "code": "RCABINET_API_ERROR",
                        "message": f"R-Cabinet API调用失败: {str(e)}",
                        "media_file_id": media_file.id,
                    }
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        except Exception as e:
            # 其他错误
            media_file.upload_status = "failed"
            media_file.error_message = str(e)
            media_file.save()

            logger.error(f"文件上传异常: {e}")

            return Response(
                {
                    "error": {
                        "code": "INTERNAL_ERROR",
                        "message": f"内部错误: {str(e)}",
                        "media_file_id": media_file.id,
                    }
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    except Exception as e:
        logger.error(f"上传接口异常: {e}")
        return Response(
            {
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": f"服务器内部错误: {str(e)}",
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_upload_status(request, media_file_id):
    """
    查询上传状态

    Request:
        GET /api/v1/media/upload/{id}/status/

    Response:
        200: 查询成功
        404: 文件不存在
        403: 无权限访问
    """
    try:
        # 获取MediaFile记录，确保用户只能查看自己的文件
        media_file = get_object_or_404(MediaFile, id=media_file_id, user=request.user)

        return Response(
            {
                "success": True,
                "data": {
                    "id": media_file.id,
                    "filename": media_file.original_filename,
                    "file_size": media_file.file_size,
                    "content_type": media_file.content_type,
                    "upload_status": media_file.upload_status,
                    "rcabinet_url": media_file.rcabinet_url,
                    "rcabinet_file_id": media_file.rcabinet_file_id,
                    "error_message": media_file.error_message,
                    "created_at": media_file.created_at.isoformat(),
                },
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        logger.error(f"查询上传状态异常: {e}")
        return Response(
            {"error": {"code": "INTERNAL_ERROR", "message": f"查询失败: {str(e)}"}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_user_media_files(request):
    """
    获取用户的媒体文件列表

    Request:
        GET /api/v1/media/files/
        Query Parameters:
            status: 过滤状态 (pending/completed/failed)
            limit: 限制数量 (默认20)
            offset: 偏移量 (默认0)

    Response:
        200: 查询成功
    """
    try:
        # 获取查询参数
        status_filter = request.GET.get("status")
        limit = int(request.GET.get("limit", 20))
        offset = int(request.GET.get("offset", 0))

        # 构建查询
        queryset = MediaFile.objects.filter(user=request.user)

        if status_filter:
            queryset = queryset.filter(upload_status=status_filter)

        # 获取总数
        total_count = queryset.count()

        # 分页查询
        media_files = queryset.order_by("-created_at")[offset : offset + limit]

        # 构建响应数据
        files_data = []
        for media_file in media_files:
            files_data.append(
                {
                    "id": media_file.id,
                    "filename": media_file.original_filename,
                    "file_size": media_file.file_size,
                    "content_type": media_file.content_type,
                    "upload_status": media_file.upload_status,
                    "rcabinet_url": media_file.rcabinet_url,
                    "rcabinet_file_id": media_file.rcabinet_file_id,
                    "error_message": media_file.error_message,
                    "created_at": media_file.created_at.isoformat(),
                }
            )

        return Response(
            {
                "success": True,
                "data": {
                    "files": files_data,
                    "total_count": total_count,
                    "limit": limit,
                    "offset": offset,
                    "has_more": (offset + limit) < total_count,
                },
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        logger.error(f"获取媒体文件列表异常: {e}")
        return Response(
            {"error": {"code": "INTERNAL_ERROR", "message": f"查询失败: {str(e)}"}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
