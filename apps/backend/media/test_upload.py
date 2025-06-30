"""
媒体文件上传功能测试
"""

import io
from unittest.mock import patch
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from PIL import Image

from .models import MediaFile
from .validators import validate_file_format, validate_file_size

User = get_user_model()


class FileValidatorTestCase(TestCase):
    """文件验证器测试"""

    def setUp(self):
        # 创建测试图片
        self.test_image = self._create_test_image()

    def _create_test_image(self, width=100, height=100, format="JPEG"):
        """创建测试图片"""
        image = Image.new("RGB", (width, height), color="red")
        image_file = io.BytesIO()
        image.save(image_file, format=format)
        image_file.seek(0)
        return image_file

    def test_validate_file_format_success(self):
        """测试文件格式验证成功"""
        uploaded_file = SimpleUploadedFile(
            "test.jpg", self.test_image.getvalue(), content_type="image/jpeg"
        )

        is_valid, error_msg = validate_file_format(uploaded_file)
        self.assertTrue(is_valid)
        self.assertIsNone(error_msg)


class MediaFileModelTestCase(TestCase):
    """MediaFile模型测试"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

    def test_create_media_file(self):
        """测试创建MediaFile记录"""
        media_file = MediaFile.objects.create(
            user=self.user,
            original_filename="test.jpg",
            file_size=1024,
            content_type="image/jpeg",
            upload_status="pending",
        )

        self.assertEqual(media_file.user, self.user)
        self.assertEqual(media_file.original_filename, "test.jpg")
        self.assertEqual(media_file.upload_status, "pending")
        self.assertIsNotNone(media_file.created_at)


class MediaUploadAPITestCase(APITestCase):
    """媒体文件上传API测试"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.client.force_authenticate(user=self.user)

    def test_upload_without_file(self):
        """测试不提供文件的上传请求"""
        response = self.client.post(
            reverse("media:upload_media_file"), {}, format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "FILE_REQUIRED")
