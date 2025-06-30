"""
媒体文件验证工具
"""

import os
from typing import Tuple, Optional
from PIL import Image
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile


# R-Cabinet 支持的文件格式
SUPPORTED_FORMATS = {
    "JPEG": [".jpg", ".jpeg"],
    "GIF": [".gif"],
    "PNG": [".png"],
    "TIFF": [".tiff", ".tif"],
    "BMP": [".bmp"],
}

# 文件限制
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB
MAX_IMAGE_DIMENSION = 3840  # 3840x3840px


class FileValidationError(Exception):
    """文件验证错误"""

    pass


def validate_file_format(uploaded_file: UploadedFile) -> Tuple[bool, Optional[str]]:
    """
    验证文件格式

    Args:
        uploaded_file: 上传的文件对象

    Returns:
        (is_valid, error_message)
    """
    try:
        # 获取文件扩展名
        filename = uploaded_file.name.lower()
        file_ext = os.path.splitext(filename)[1]

        # 检查扩展名是否支持
        supported_extensions = []
        for format_name, extensions in SUPPORTED_FORMATS.items():
            supported_extensions.extend(extensions)

        if file_ext not in supported_extensions:
            return (
                False,
                f"不支持的文件格式 {file_ext}。支持的格式: {', '.join(supported_extensions)}",
            )

        return True, None

    except Exception as e:
        return False, f"文件格式验证失败: {str(e)}"


def validate_file_size(uploaded_file: UploadedFile) -> Tuple[bool, Optional[str]]:
    """
    验证文件大小

    Args:
        uploaded_file: 上传的文件对象

    Returns:
        (is_valid, error_message)
    """
    try:
        if uploaded_file.size > MAX_FILE_SIZE:
            size_mb = uploaded_file.size / (1024 * 1024)
            max_size_mb = MAX_FILE_SIZE / (1024 * 1024)
            return False, f"文件大小 {size_mb:.1f}MB 超过限制 {max_size_mb}MB"

        return True, None

    except Exception as e:
        return False, f"文件大小验证失败: {str(e)}"


def validate_image_dimensions(
    uploaded_file: UploadedFile,
) -> Tuple[bool, Optional[str]]:
    """
    验证图片尺寸

    Args:
        uploaded_file: 上传的文件对象

    Returns:
        (is_valid, error_message)
    """
    try:
        # 重置文件指针
        uploaded_file.seek(0)

        # 使用PIL打开图片
        with Image.open(uploaded_file) as img:
            width, height = img.size

            if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION:
                return (
                    False,
                    f"图片尺寸 {width}x{height} 超过限制 {MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION}",
                )

        # 重置文件指针
        uploaded_file.seek(0)
        return True, None

    except Exception as e:
        return False, f"图片尺寸验证失败: {str(e)}"


def validate_file_integrity(uploaded_file: UploadedFile) -> Tuple[bool, Optional[str]]:
    """
    验证文件完整性

    Args:
        uploaded_file: 上传的文件对象

    Returns:
        (is_valid, error_message)
    """
    try:
        # 重置文件指针
        uploaded_file.seek(0)

        # 尝试打开图片以验证完整性
        with Image.open(uploaded_file) as img:
            # 验证图片可以正常加载
            img.verify()

        # 重置文件指针
        uploaded_file.seek(0)
        return True, None

    except Exception as e:
        return False, f"文件损坏或格式错误: {str(e)}"


def validate_file_security(uploaded_file: UploadedFile) -> Tuple[bool, Optional[str]]:
    """
    验证文件安全性

    Args:
        uploaded_file: 上传的文件对象

    Returns:
        (is_valid, error_message)
    """
    try:
        # 检查文件名是否包含危险字符
        filename = uploaded_file.name
        dangerous_chars = ["..", "/", "\\", "<", ">", "|", ":", "*", "?", '"']

        for char in dangerous_chars:
            if char in filename:
                return False, f"文件名包含危险字符: {char}"

        # 检查文件大小是否为0
        if uploaded_file.size == 0:
            return False, "文件为空"

        return True, None

    except Exception as e:
        return False, f"文件安全检查失败: {str(e)}"


def validate_uploaded_file(uploaded_file: UploadedFile) -> Tuple[bool, Optional[str]]:
    """
    完整的文件验证流程

    Args:
        uploaded_file: 上传的文件对象

    Returns:
        (is_valid, error_message)
    """
    # 安全检查
    is_valid, error_msg = validate_file_security(uploaded_file)
    if not is_valid:
        return is_valid, error_msg

    # 格式检查
    is_valid, error_msg = validate_file_format(uploaded_file)
    if not is_valid:
        return is_valid, error_msg

    # 大小检查
    is_valid, error_msg = validate_file_size(uploaded_file)
    if not is_valid:
        return is_valid, error_msg

    # 尺寸检查
    is_valid, error_msg = validate_image_dimensions(uploaded_file)
    if not is_valid:
        return is_valid, error_msg

    # 完整性检查
    is_valid, error_msg = validate_file_integrity(uploaded_file)
    if not is_valid:
        return is_valid, error_msg

    return True, None


def get_file_format_info(uploaded_file: UploadedFile) -> dict:
    """
    获取文件格式信息

    Args:
        uploaded_file: 上传的文件对象

    Returns:
        文件格式信息字典
    """
    try:
        uploaded_file.seek(0)

        with Image.open(uploaded_file) as img:
            format_info = {
                "format": img.format,
                "mode": img.mode,
                "size": img.size,
                "width": img.size[0],
                "height": img.size[1],
            }

        uploaded_file.seek(0)
        return format_info

    except Exception:
        return {}
