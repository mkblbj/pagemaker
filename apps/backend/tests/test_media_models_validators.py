"""
Media Models 和 Validators 测试
"""

import pytest
import os
import tempfile
from io import BytesIO
from PIL import Image
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile, InMemoryUploadedFile
from django.db import IntegrityError

from media.models import MediaFile
from media.validators import (
    validate_file_format,
    validate_file_size,
    validate_image_dimensions,
    validate_file_integrity,
    validate_file_security,
    validate_uploaded_file,
    get_file_format_info,
    SUPPORTED_FORMATS,
    MAX_FILE_SIZE,
    MAX_IMAGE_DIMENSION,
)

User = get_user_model()


def create_test_image(width=100, height=100, format="JPEG"):
    """创建测试图片"""
    image = Image.new("RGB", (width, height), color="red")
    buffer = BytesIO()
    image.save(buffer, format=format)
    buffer.seek(0)
    return buffer


@pytest.mark.unit
class MediaFileModelTest(TestCase):
    """MediaFile模型测试"""

    def setUp(self):
        """设置测试数据"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

    def test_create_media_file(self):
        """测试创建媒体文件记录"""
        media_file = MediaFile.objects.create(
            user=self.user,
            original_filename="test.jpg",
            rcabinet_url="https://rcabinet.example.com/files/test.jpg",
            rcabinet_file_id="file_123",
            file_size=1024,
            content_type="image/jpeg",
            upload_status="completed",
        )

        self.assertEqual(media_file.user, self.user)
        self.assertEqual(media_file.original_filename, "test.jpg")
        self.assertEqual(
            media_file.rcabinet_url, "https://rcabinet.example.com/files/test.jpg"
        )
        self.assertEqual(media_file.rcabinet_file_id, "file_123")
        self.assertEqual(media_file.file_size, 1024)
        self.assertEqual(media_file.content_type, "image/jpeg")
        self.assertEqual(media_file.upload_status, "completed")
        self.assertIsNotNone(media_file.created_at)

    def test_media_file_default_status(self):
        """测试媒体文件默认状态"""
        media_file = MediaFile.objects.create(
            user=self.user,
            original_filename="test.jpg",
            file_size=1024,
            content_type="image/jpeg",
        )

        self.assertEqual(media_file.upload_status, "pending")

    def test_media_file_str_representation(self):
        """测试媒体文件字符串表示"""
        media_file = MediaFile.objects.create(
            user=self.user,
            original_filename="test.jpg",
            file_size=1024,
            content_type="image/jpeg",
            upload_status="completed",
        )

        expected_str = "test.jpg (completed)"
        self.assertEqual(str(media_file), expected_str)

    def test_media_file_unique_rcabinet_id(self):
        """测试R-Cabinet文件ID的唯一性约束"""
        # 创建第一个文件
        MediaFile.objects.create(
            user=self.user,
            original_filename="test1.jpg",
            rcabinet_file_id="unique_id_123",
            file_size=1024,
            content_type="image/jpeg",
        )

        # 尝试创建具有相同R-Cabinet ID的文件应该失败
        with self.assertRaises(IntegrityError):
            MediaFile.objects.create(
                user=self.user,
                original_filename="test2.jpg",
                rcabinet_file_id="unique_id_123",
                file_size=2048,
                content_type="image/png",
            )

    def test_media_file_cascade_delete(self):
        """测试用户删除时媒体文件的级联删除"""
        media_file = MediaFile.objects.create(
            user=self.user,
            original_filename="test.jpg",
            file_size=1024,
            content_type="image/jpeg",
        )
        media_file_id = media_file.id

        # 删除用户
        self.user.delete()

        # 媒体文件应该也被删除
        with self.assertRaises(MediaFile.DoesNotExist):
            MediaFile.objects.get(id=media_file_id)

    def test_media_file_status_choices(self):
        """测试上传状态选择"""
        valid_statuses = ["pending", "completed", "failed"]

        for status in valid_statuses:
            media_file = MediaFile.objects.create(
                user=self.user,
                original_filename=f"test_{status}.jpg",
                file_size=1024,
                content_type="image/jpeg",
                upload_status=status,
            )
            self.assertEqual(media_file.upload_status, status)

    def test_media_file_optional_fields(self):
        """测试可选字段"""
        media_file = MediaFile.objects.create(
            user=self.user,
            original_filename="test.jpg",
            file_size=1024,
            content_type="image/jpeg",
        )

        # 这些字段应该可以为空
        self.assertEqual(media_file.rcabinet_url, "")
        self.assertIsNone(media_file.rcabinet_file_id)
        self.assertEqual(media_file.error_message, "")


@pytest.mark.unit
class FileValidatorsTest(TestCase):
    """文件验证器测试"""

    def test_validate_file_format_valid_jpg(self):
        """测试有效的JPG文件格式验证"""
        uploaded_file = SimpleUploadedFile(
            "test.jpg", b"fake image content", content_type="image/jpeg"
        )

        is_valid, error_message = validate_file_format(uploaded_file)

        self.assertTrue(is_valid)
        self.assertIsNone(error_message)

    def test_validate_file_format_valid_png(self):
        """测试有效的PNG文件格式验证"""
        uploaded_file = SimpleUploadedFile(
            "test.png", b"fake image content", content_type="image/png"
        )

        is_valid, error_message = validate_file_format(uploaded_file)

        self.assertTrue(is_valid)
        self.assertIsNone(error_message)

    def test_validate_file_format_invalid_extension(self):
        """测试无效的文件扩展名"""
        uploaded_file = SimpleUploadedFile(
            "test.txt", b"text content", content_type="text/plain"
        )

        is_valid, error_message = validate_file_format(uploaded_file)

        self.assertFalse(is_valid)
        self.assertIn("不支持的文件格式", error_message)
        self.assertIn(".txt", error_message)

    def test_validate_file_format_case_insensitive(self):
        """测试文件扩展名大小写不敏感"""
        uploaded_file = SimpleUploadedFile(
            "test.JPG", b"fake image content", content_type="image/jpeg"  # 大写扩展名
        )

        is_valid, error_message = validate_file_format(uploaded_file)

        self.assertTrue(is_valid)
        self.assertIsNone(error_message)

    def test_validate_file_size_valid(self):
        """测试有效的文件大小"""
        # 创建小于限制的文件
        small_content = b"x" * 1024  # 1KB
        uploaded_file = SimpleUploadedFile(
            "small.jpg", small_content, content_type="image/jpeg"
        )

        is_valid, error_message = validate_file_size(uploaded_file)

        self.assertTrue(is_valid)
        self.assertIsNone(error_message)

    def test_validate_file_size_too_large(self):
        """测试文件大小超过限制"""
        # 创建超过限制的文件（模拟）
        uploaded_file = SimpleUploadedFile(
            "large.jpg",
            b"x",  # 内容很小，但我们会mock size属性
            content_type="image/jpeg",
        )
        # 模拟大文件
        uploaded_file.size = MAX_FILE_SIZE + 1

        is_valid, error_message = validate_file_size(uploaded_file)

        self.assertFalse(is_valid)
        self.assertIn("文件大小", error_message)
        self.assertIn("超过限制", error_message)

    def test_validate_image_dimensions_valid(self):
        """测试有效的图片尺寸"""
        # 创建小尺寸图片
        image_buffer = create_test_image(100, 100)
        uploaded_file = InMemoryUploadedFile(
            image_buffer,
            None,
            "test.jpg",
            "image/jpeg",
            image_buffer.getbuffer().nbytes,
            None,
        )

        is_valid, error_message = validate_image_dimensions(uploaded_file)

        self.assertTrue(is_valid)
        self.assertIsNone(error_message)

    def test_validate_image_dimensions_too_large(self):
        """测试图片尺寸超过限制"""
        # 创建超大尺寸图片
        large_dimension = MAX_IMAGE_DIMENSION + 100
        image_buffer = create_test_image(large_dimension, large_dimension)
        uploaded_file = InMemoryUploadedFile(
            image_buffer,
            None,
            "large.jpg",
            "image/jpeg",
            image_buffer.getbuffer().nbytes,
            None,
        )

        is_valid, error_message = validate_image_dimensions(uploaded_file)

        self.assertFalse(is_valid)
        self.assertIn("图片尺寸", error_message)
        self.assertIn("超过限制", error_message)

    def test_validate_image_dimensions_invalid_image(self):
        """测试无效的图片文件"""
        uploaded_file = SimpleUploadedFile(
            "not_image.jpg", b"not an image", content_type="image/jpeg"
        )

        is_valid, error_message = validate_image_dimensions(uploaded_file)

        self.assertFalse(is_valid)
        self.assertIn("图片尺寸验证失败", error_message)

    def test_validate_file_security_valid(self):
        """测试有效文件的安全性验证"""
        uploaded_file = SimpleUploadedFile(
            "safe_file.jpg", b"safe content", content_type="image/jpeg"
        )

        is_valid, error_message = validate_file_security(uploaded_file)

        self.assertTrue(is_valid)
        self.assertIsNone(error_message)

    def test_validate_file_security_dangerous_filename(self):
        """测试包含危险字符的文件名"""
        # 测试多种危险字符
        dangerous_filenames = [
            "file<script>.jpg",  # 包含 < 字符
            "file|pipe.jpg",  # 包含 | 字符
            "file*.jpg",  # 包含 * 字符
            'file"quote.jpg',  # 包含 " 字符
        ]

        for filename in dangerous_filenames:
            with self.subTest(filename=filename):
                uploaded_file = SimpleUploadedFile(
                    filename, b"content", content_type="image/jpeg"
                )

                is_valid, error_message = validate_file_security(uploaded_file)

                self.assertFalse(is_valid, f"文件名 {filename} 应该被拒绝")
                self.assertIn("危险字符", error_message)

    def test_validate_file_security_empty_file(self):
        """测试空文件的安全性验证"""
        uploaded_file = SimpleUploadedFile(
            "empty.jpg", b"", content_type="image/jpeg"  # 空内容
        )

        is_valid, error_message = validate_file_security(uploaded_file)

        self.assertFalse(is_valid)
        self.assertIn("文件为空", error_message)

    def test_validate_file_integrity_valid_image(self):
        """测试有效图片的完整性验证"""
        image_buffer = create_test_image(100, 100)
        uploaded_file = InMemoryUploadedFile(
            image_buffer,
            None,
            "test.jpg",
            "image/jpeg",
            image_buffer.getbuffer().nbytes,
            None,
        )

        is_valid, error_message = validate_file_integrity(uploaded_file)

        self.assertTrue(is_valid)
        self.assertIsNone(error_message)

    def test_validate_file_integrity_corrupted_file(self):
        """测试损坏文件的完整性验证"""
        uploaded_file = SimpleUploadedFile(
            "corrupted.jpg", b"corrupted image data", content_type="image/jpeg"
        )

        is_valid, error_message = validate_file_integrity(uploaded_file)

        self.assertFalse(is_valid)
        self.assertIn("文件损坏或格式错误", error_message)


@pytest.mark.unit
class ValidateUploadedFileTest(TestCase):
    """综合文件验证测试"""

    def test_validate_uploaded_file_success(self):
        """测试完整的文件验证成功"""
        image_buffer = create_test_image(100, 100)
        uploaded_file = InMemoryUploadedFile(
            image_buffer,
            None,
            "valid.jpg",
            "image/jpeg",
            image_buffer.getbuffer().nbytes,
            None,
        )

        # 验证应该成功
        is_valid, error_message = validate_uploaded_file(uploaded_file)
        self.assertTrue(is_valid)
        self.assertIsNone(error_message)

    def test_validate_uploaded_file_invalid_format(self):
        """测试无效格式的文件验证失败"""
        uploaded_file = SimpleUploadedFile(
            "invalid.txt", b"text content", content_type="text/plain"
        )

        is_valid, error_message = validate_uploaded_file(uploaded_file)
        self.assertFalse(is_valid)
        self.assertIn("不支持的文件格式", error_message)

    def test_validate_uploaded_file_too_large(self):
        """测试文件过大的验证失败"""
        uploaded_file = SimpleUploadedFile("large.jpg", b"x", content_type="image/jpeg")
        uploaded_file.size = MAX_FILE_SIZE + 1

        is_valid, error_message = validate_uploaded_file(uploaded_file)
        self.assertFalse(is_valid)
        self.assertIn("文件大小", error_message)

    def test_get_file_format_info_jpg(self):
        """测试获取JPG文件格式信息"""
        image_buffer = create_test_image(100, 100, "JPEG")
        uploaded_file = InMemoryUploadedFile(
            image_buffer,
            None,
            "test.jpg",
            "image/jpeg",
            image_buffer.getbuffer().nbytes,
            None,
        )

        format_info = get_file_format_info(uploaded_file)

        self.assertEqual(format_info["format"], "JPEG")
        self.assertEqual(format_info["width"], 100)
        self.assertEqual(format_info["height"], 100)
        self.assertIn("size", format_info)

    def test_get_file_format_info_invalid_file(self):
        """测试获取无效文件的格式信息"""
        uploaded_file = SimpleUploadedFile(
            "test.txt", b"text content", content_type="text/plain"
        )

        format_info = get_file_format_info(uploaded_file)

        # 对于无效图片文件，应该返回空字典
        self.assertEqual(format_info, {})


@pytest.mark.unit
class ValidatorsConstantsTest(TestCase):
    """验证器常量测试"""

    def test_supported_formats_structure(self):
        """测试支持格式的数据结构"""
        self.assertIsInstance(SUPPORTED_FORMATS, dict)

        # 检查每种格式都有对应的扩展名列表
        for format_name, extensions in SUPPORTED_FORMATS.items():
            self.assertIsInstance(format_name, str)
            self.assertIsInstance(extensions, list)
            self.assertGreater(len(extensions), 0)

            # 检查扩展名格式
            for ext in extensions:
                self.assertTrue(ext.startswith("."))
                self.assertEqual(ext, ext.lower())

    def test_file_size_limit(self):
        """测试文件大小限制常量"""
        self.assertIsInstance(MAX_FILE_SIZE, int)
        self.assertGreater(MAX_FILE_SIZE, 0)
        # 应该是2MB
        self.assertEqual(MAX_FILE_SIZE, 2 * 1024 * 1024)

    def test_image_dimension_limit(self):
        """测试图片尺寸限制常量"""
        self.assertIsInstance(MAX_IMAGE_DIMENSION, int)
        self.assertGreater(MAX_IMAGE_DIMENSION, 0)
        # 应该是3840px
        self.assertEqual(MAX_IMAGE_DIMENSION, 3840)


@pytest.mark.integration
class MediaIntegrationTest(TestCase):
    """媒体文件集成测试"""

    def setUp(self):
        """设置测试数据"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

    def test_complete_media_workflow(self):
        """测试完整的媒体文件工作流"""
        # 1. 创建有效的图片文件
        image_buffer = create_test_image(200, 200)
        uploaded_file = InMemoryUploadedFile(
            image_buffer,
            None,
            "workflow_test.jpg",
            "image/jpeg",
            image_buffer.getbuffer().nbytes,
            None,
        )

        # 2. 验证文件
        is_valid, error_message = validate_uploaded_file(uploaded_file)
        self.assertTrue(is_valid, f"文件验证应该成功: {error_message}")

        # 3. 创建数据库记录
        media_file = MediaFile.objects.create(
            user=self.user,
            original_filename=uploaded_file.name,
            file_size=uploaded_file.size,
            content_type=uploaded_file.content_type,
            upload_status="pending",
        )

        # 4. 模拟上传成功，更新记录
        media_file.rcabinet_url = "https://rcabinet.example.com/files/workflow_test.jpg"
        media_file.rcabinet_file_id = "workflow_123"
        media_file.upload_status = "completed"
        media_file.save()

        # 5. 验证最终状态
        updated_media_file = MediaFile.objects.get(id=media_file.id)
        self.assertEqual(updated_media_file.upload_status, "completed")
        self.assertEqual(updated_media_file.rcabinet_file_id, "workflow_123")
        self.assertIsNotNone(updated_media_file.rcabinet_url)

    def test_validation_and_model_integration(self):
        """测试验证器与模型的集成"""
        test_cases = [
            # (filename, content_type, should_pass, expected_status)
            ("valid.jpg", "image/jpeg", True, "pending"),
            ("valid.png", "image/png", True, "pending"),
            ("invalid.txt", "text/plain", False, None),
        ]

        for filename, content_type, should_pass, expected_status in test_cases:
            with self.subTest(filename=filename):
                if should_pass:
                    # 创建有效文件
                    if filename.endswith((".jpg", ".jpeg")):
                        image_buffer = create_test_image(100, 100, "JPEG")
                    else:
                        image_buffer = create_test_image(100, 100, "PNG")

                    uploaded_file = InMemoryUploadedFile(
                        image_buffer,
                        None,
                        filename,
                        content_type,
                        image_buffer.getbuffer().nbytes,
                        None,
                    )

                    # 验证应该通过
                    is_valid, error_message = validate_uploaded_file(uploaded_file)
                    self.assertTrue(
                        is_valid, f"文件 {filename} 验证应该成功: {error_message}"
                    )

                    # 创建模型记录
                    media_file = MediaFile.objects.create(
                        user=self.user,
                        original_filename=filename,
                        file_size=uploaded_file.size,
                        content_type=content_type,
                    )
                    self.assertEqual(media_file.upload_status, expected_status)

                else:
                    # 创建无效文件
                    uploaded_file = SimpleUploadedFile(
                        filename, b"invalid content", content_type=content_type
                    )

                    # 验证应该失败
                    is_valid, error_message = validate_uploaded_file(uploaded_file)
                    self.assertFalse(is_valid, f"文件 {filename} 验证应该失败")
