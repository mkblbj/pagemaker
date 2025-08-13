"""
媒体文件上传API视图
"""

import logging
import time
from django.shortcuts import get_object_or_404
from django.core.cache import cache
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_cabinet_folders(request):
    """
    获取R-Cabinet中的文件夹列表

    Request:
        GET /api/v1/media/cabinet-folders/
        Query Parameters:
            page: 页码（默认1）
            pageSize: 每页数量（默认20，最大100）

    Response:
        200: 获取成功
        503: R-Cabinet服务不可用
        500: 内部错误
    """
    try:
        # 获取查询参数
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("pageSize", 20))
        parent_path_query = request.GET.get("parentPath")
        want_all = request.GET.get("all") in {"1", "true", "True"}
        force_refresh = request.GET.get("force") in {"1", "true", "True"}

        # 限制页面大小
        page_size = min(page_size, 100)

        # 计算记录偏移量（R-Cabinet 偏移量按记录起始下标，从 1 开始）
        record_offset = max((page - 1) * page_size + 1, 1)

        # 检查R-Cabinet集成功能开关
        from pagemaker.config import config

        if not config.RCABINET_INTEGRATION_ENABLED:
            return Response(
                {
                    "error": {
                        "code": "SERVICE_DISABLED",
                        "message": "R-Cabinet集成功能当前不可用",
                    }
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        def _rate_limit_sleep():
            last_ts = cache.get("rakuten_last_call_ts")
            now = time.monotonic()
            if last_ts is not None:
                delta = now - last_ts
                if delta < 1.0:
                    time.sleep(1.0 - delta)
            cache.set("rakuten_last_call_ts", time.monotonic(), timeout=60)

        def _normalize_folders(raw_list, with_has_children_from=None):
            folders = []
            for folder_info in raw_list:
                folder_path = folder_info.get("folder_path", "")
                parent_path = None
                if "/" in folder_path:
                    parent_path = "/".join(folder_path.split("/")[:-1])
                folders.append(
                    {
                        "id": str(folder_info.get("folder_id", "")),
                        "name": folder_info.get("folder_name", ""),
                        "path": folder_path,
                        "fileCount": folder_info.get("file_count", 0),
                        "fileSize": folder_info.get("file_size", 0),
                        "updatedAt": folder_info.get("timestamp", ""),
                        "node": folder_info.get("folder_node", 1),
                        "parentPath": parent_path,
                    }
                )
            if with_has_children_from is not None:
                parent_set = set()
                for f in with_has_children_from:
                    pp = f.get("parentPath")
                    if pp:
                        parent_set.add(pp)
                for f in folders:
                    f["hasChildren"] = f.get("path") in parent_set
            return folders

        # 如果请求子节点或请求全量，使用缓存优先
        if parent_path_query is not None or want_all:
            cached = None if force_refresh else cache.get("cabinet_folders_all")
            cached_ts = None if force_refresh else cache.get("cabinet_folders_all_ts")
            if cached is None:
                # 全量拉取并缓存（循环分页 + 限速）
                cabinet_client = RCabinetClient()
                all_raw = []
                current_page = 1
                page_limit = 100
                while True:
                    _rate_limit_sleep()
                    result = cabinet_client.get_folders(
                        offset=current_page, limit=page_limit
                    )
                    if not result.get("success", True):
                        return Response(
                            {
                                "error": {
                                    "code": "API_ERROR",
                                    "message": result.get(
                                        "message", "获取文件夹列表失败"
                                    ),
                                }
                            },
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        )
                    page_folders = result.get("data", {}).get("folders", [])
                    all_raw.extend(page_folders)
                    folder_all_count = result.get("data", {}).get("folder_all_count")
                    if not page_folders or (
                        folder_all_count and len(all_raw) >= int(folder_all_count)
                    ):
                        break
                    current_page += 1
                normalized = _normalize_folders(all_raw)
                # 基于全量补充 hasChildren
                normalized = _normalize_folders(
                    all_raw, with_has_children_from=normalized
                )
                # 缓存 5 分钟
                cache.set("cabinet_folders_all", normalized, timeout=600)
                cache.set("cabinet_folders_all_ts", time.time(), timeout=600)
                cached = normalized
                cached_ts = time.time()
            else:
                # stale-while-revalidate: 5分钟后后台刷新，不阻塞
                try:
                    if cached_ts is None or (time.time() - float(cached_ts)) > 300:

                        def _refresh_async():
                            try:
                                cc = RCabinetClient()
                                all_raw = []
                                cp = 1
                                limit = 100
                                while True:
                                    _rate_limit_sleep()
                                    res = cc.get_folders(offset=cp, limit=limit)
                                    if not res.get("success", True):
                                        break
                                    page_folders = res.get("data", {}).get(
                                        "folders", []
                                    )
                                    all_raw.extend(page_folders)
                                    fac = res.get("data", {}).get("folder_all_count")
                                    if not page_folders or (
                                        fac and len(all_raw) >= int(fac)
                                    ):
                                        break
                                    cp += 1
                                norm = _normalize_folders(all_raw)
                                norm = _normalize_folders(
                                    all_raw, with_has_children_from=norm
                                )
                                cache.set("cabinet_folders_all", norm, timeout=600)
                                cache.set(
                                    "cabinet_folders_all_ts", time.time(), timeout=600
                                )
                            except Exception:
                                pass

                        import threading

                        threading.Thread(target=_refresh_async, daemon=True).start()
                except Exception:
                    pass

            # 过滤子节点或分页切片
            folders = cached
            if parent_path_query is not None:
                if parent_path_query == "":
                    # 根层（无父路径）
                    folders = [f for f in folders if not f.get("parentPath")]
                else:
                    folders = [
                        f for f in folders if f.get("parentPath") == parent_path_query
                    ]
                total = len(folders)
                # 默认全部返回子节点（不再分页），也可按传入分页
                start = (page - 1) * page_size
                end = start + page_size
                sliced = folders[start:end]
                return Response(
                    {
                        "success": True,
                        "data": {
                            "folders": sliced,
                            "total": total,
                            "page": page,
                            "pageSize": page_size,
                        },
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                # 返回全量（可分页切片，保持兼容）
                total = len(folders)
                start = (page - 1) * page_size
                end = start + page_size
                sliced = folders[start:end]
                return Response(
                    {
                        "success": True,
                        "data": {
                            "folders": sliced,
                            "total": total,
                            "page": page,
                            "pageSize": page_size,
                        },
                    },
                    status=status.HTTP_200_OK,
                )

        # 否则按原逻辑请求单页
        cabinet_client = RCabinetClient()
        _rate_limit_sleep()
        result = cabinet_client.get_folders(offset=record_offset, limit=page_size)
        if result.get("success", True):
            folders_data = result.get("data", {}).get("folders", [])
            folders = _normalize_folders(folders_data)
            total = result.get("data", {}).get("folder_all_count", len(folders))
            return Response(
                {
                    "success": True,
                    "data": {
                        "folders": folders,
                        "total": total,
                        "page": page,
                        "pageSize": page_size,
                    },
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {
                    "error": {
                        "code": "API_ERROR",
                        "message": result.get("message", "获取文件夹列表失败"),
                    }
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    except Exception as e:
        logger.error(f"获取R-Cabinet文件夹列表异常: {e}")
        return Response(
            {
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": f"获取文件夹列表失败: {str(e)}",
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_cabinet_images(request):
    """
    获取R-Cabinet中的图片列表

    Request:
        GET /api/v1/media/cabinet-images/
        Query Parameters:
            page: 页码（默认1）
            pageSize: 每页数量（默认20，最大100）
            search: 搜索关键词（可选）

    Response:
        200: 获取成功
        503: R-Cabinet服务不可用
        500: 内部错误
    """
    try:
        # 获取查询参数
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("pageSize", 20))
        search = request.GET.get("search", "")
        folder_id = request.GET.get("folderId")  # 文件夹ID过滤

        # 限制页面大小
        page_size = min(page_size, 100)

        # 计算记录偏移量（R-Cabinet 偏移量按记录起始下标，从 1 开始）
        record_offset = max((page - 1) * page_size + 1, 1)

        # 检查R-Cabinet集成功能开关
        from pagemaker.config import config

        if not config.RCABINET_INTEGRATION_ENABLED:
            return Response(
                {
                    "error": {
                        "code": "SERVICE_DISABLED",
                        "message": "R-Cabinet集成功能当前不可用",
                    }
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # 初始化R-Cabinet客户端
        cabinet_client = RCabinetClient()

        def _rate_limit_sleep():
            last_ts = cache.get("rakuten_last_call_ts")
            now = time.monotonic()
            if last_ts is not None:
                delta = now - last_ts
                if delta < 1.0:
                    time.sleep(1.0 - delta)
            cache.set("rakuten_last_call_ts", time.monotonic(), timeout=60)

        # 根据参数选择API调用方式
        if search:
            # 使用搜索API
            search_params = {
                "file_name": search,
                "offset": record_offset,
                "limit": page_size,
            }
            if folder_id:
                search_params["folder_id"] = int(folder_id)
            _rate_limit_sleep()
            result = cabinet_client.search_files(**search_params)
        else:
            # 获取指定文件夹的文件列表
            target_folder_id = int(folder_id) if folder_id else 0
            _rate_limit_sleep()
            result = cabinet_client.get_folder_files(
                folder_id=target_folder_id, offset=record_offset, limit=page_size
            )

        # 解析响应数据
        if result.get("success", True):
            files_data = result.get("data", {}).get("files", [])

            # 转换格式（使用正确的小写字段名）
            images = []
            for file_info in files_data:
                # 使用正确的字段名（API实际返回的是小写字段名）
                file_name = file_info.get("file_name", "")  # 用户友好的图片名
                file_path = file_info.get("file_path", "")  # 系统文件名（包含扩展名）
                file_url = file_info.get("file_url", "")
                file_id = file_info.get("file_id", "")
                file_size = file_info.get("file_size", 0)
                file_width = file_info.get("file_width", 0)
                file_height = file_info.get("file_height", 0)
                timestamp = file_info.get("timestamp", "")

                # 支持所有Rakuten Cabinet支持的图片格式
                # 使用file_path来判断文件类型，因为它总是包含正确的扩展名
                supported_extensions = [
                    ".jpg",
                    ".jpeg",
                    ".png",
                    ".gif",
                    ".webp",
                    ".tiff",
                    ".tif",
                    ".bmp",
                ]
                is_image = any(
                    file_path.lower().endswith(ext) for ext in supported_extensions
                )

                if is_image and file_url:  # 确保有URL才添加
                    # 显示名称优先使用file_name，如果为空则使用file_path
                    display_name = file_name if file_name.strip() else file_path

                    images.append(
                        {
                            "id": str(file_id),
                            "url": file_url,
                            "filename": display_name,  # 使用友好的显示名称
                            "size": float(file_size) if file_size else 0,
                            "width": int(file_width) if file_width else 0,
                            "height": int(file_height) if file_height else 0,
                            "mimeType": _guess_mime_type_from_filename(
                                file_path
                            ),  # 使用file_path判断MIME类型
                            "uploadedAt": timestamp,
                        }
                    )

            # 计算总数（这里使用当前页的数量作为近似值）
            total = len(images)
            if len(images) == page_size:
                # 如果返回了完整页面，可能还有更多数据
                total = page * page_size + 1  # 设置一个大概的总数

            return Response(
                {
                    "success": True,
                    "data": {
                        "images": images,
                        "total": total,
                        "page": page,
                        "pageSize": page_size,
                    },
                },
                status=status.HTTP_200_OK,
            )
        else:
            error_msg = result.get("error", "获取图片列表失败")
            return Response(
                {"error": {"code": "CABINET_API_ERROR", "message": error_msg}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    except RakutenAPIError as e:
        logger.error(f"R-Cabinet API错误: {e}")
        return Response(
            {
                "error": {
                    "code": "CABINET_API_ERROR",
                    "message": f"R-Cabinet服务异常: {str(e)}",
                }
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except Exception as e:
        logger.error(f"获取R-Cabinet图片列表异常: {e}")
        return Response(
            {"error": {"code": "INTERNAL_ERROR", "message": f"查询失败: {str(e)}"}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def _guess_mime_type_from_filename(filename: str) -> str:
    """
    根据文件名推断MIME类型

    Args:
        filename: 文件名

    Returns:
        MIME类型字符串
    """
    if not filename:
        return "image/jpeg"

    filename_lower = filename.lower()

    if filename_lower.endswith(".jpg") or filename_lower.endswith(".jpeg"):
        return "image/jpeg"
    elif filename_lower.endswith(".png"):
        return "image/png"
    elif filename_lower.endswith(".gif"):
        return "image/gif"
    elif filename_lower.endswith(".webp"):
        return "image/webp"
    else:
        return "image/jpeg"  # 默认值
