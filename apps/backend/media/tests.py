from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from unittest.mock import patch, Mock
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
import json
import io
from PIL import Image

from media.models import MediaFile
from media.validators import validate_uploaded_file

User = get_user_model()


class MediaAppTestCase(TestCase):
    """Media应用测试"""

    def test_media_app_config(self):
        """测试media应用配置"""
        from media.apps import MediaConfig

        self.assertEqual(MediaConfig.name, "media")
        self.assertEqual(MediaConfig.verbose_name, "Media")

    def test_media_models_import(self):
        """测试media模型导入"""
        try:
            from media import models

            self.assertTrue(hasattr(models, "models"))
        except ImportError:
            self.fail("无法导入media.models")

    def test_media_views_import(self):
        """测试media视图导入"""
        try:
            from media import views

            self.assertTrue(hasattr(views, "render"))
        except ImportError:
            self.fail("无法导入media.views")

    def test_media_urls_import(self):
        """测试media URLs导入"""
        try:
            from media import urls

            self.assertTrue(hasattr(urls, "urlpatterns"))
        except ImportError:
            self.fail("无法导入media.urls")


class MediaFileModelTestCase(TestCase):
    """MediaFile模型测试"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )

    def test_create_media_file(self):
        """测试创建媒体文件记录"""
        media_file = MediaFile.objects.create(
            user=self.user,
            original_filename="test.jpg",
            file_size=1024,
            content_type="image/jpeg",
            upload_status="pending"
        )
        
        self.assertEqual(media_file.user, self.user)
        self.assertEqual(media_file.original_filename, "test.jpg")
        self.assertEqual(media_file.file_size, 1024)
        self.assertEqual(media_file.content_type, "image/jpeg")
        self.assertEqual(media_file.upload_status, "pending")
        self.assertIsNotNone(media_file.created_at)

    def test_media_file_str_representation(self):
        """测试MediaFile字符串表示"""
        media_file = MediaFile.objects.create(
            user=self.user,
            original_filename="test.jpg",
            file_size=1024,
            content_type="image/jpeg",
            upload_status="pending"
        )
        
        expected = "test.jpg (pending)"
        self.assertEqual(str(media_file), expected)


class MediaValidatorsTestCase(TestCase):
    """Media验证器测试"""

    def create_test_image(self, format='JPEG', size=(100, 100)):
        """创建测试图片"""
        img = Image.new('RGB', size, color='red')
        img_io = io.BytesIO()
        img.save(img_io, format=format)
        img_io.seek(0)
        return img_io.getvalue()

    def test_validate_uploaded_file_valid_jpeg(self):
        """测试验证有效的JPEG文件"""
        image_data = self.create_test_image('JPEG')
        uploaded_file = SimpleUploadedFile(
            "test.jpg",
            image_data,
            content_type="image/jpeg"
        )
        
        is_valid, error_message = validate_uploaded_file(uploaded_file)
        self.assertTrue(is_valid)
        self.assertIsNone(error_message)

    def test_validate_uploaded_file_valid_png(self):
        """测试验证有效的PNG文件"""
        image_data = self.create_test_image('PNG')
        uploaded_file = SimpleUploadedFile(
            "test.png",
            image_data,
            content_type="image/png"
        )
        
        is_valid, error_message = validate_uploaded_file(uploaded_file)
        self.assertTrue(is_valid)
        self.assertIsNone(error_message)

    def test_validate_uploaded_file_too_large(self):
        """测试验证文件过大的情况"""
        # 创建一个模拟的大文件
        large_data = b'x' * (3 * 1024 * 1024)  # 3MB
        uploaded_file = SimpleUploadedFile(
            "large.jpg",
            large_data,
            content_type="image/jpeg"
        )
        
        is_valid, error_message = validate_uploaded_file(uploaded_file)
        self.assertFalse(is_valid)
        self.assertIn("文件大小", error_message)
        self.assertIn("超过限制", error_message)

    def test_validate_uploaded_file_invalid_type(self):
        """测试验证无效文件类型"""
        uploaded_file = SimpleUploadedFile(
            "test.txt",
            b"hello world",
            content_type="text/plain"
        )
        
        is_valid, error_message = validate_uploaded_file(uploaded_file)
        self.assertFalse(is_valid)
        self.assertIn("不支持的文件格式", error_message)


class MediaViewsTestCase(TestCase):
    """Media视图测试"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        self.client = APIClient()
        
        # 生成JWT令牌
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)

    def create_test_image(self, format='JPEG', size=(100, 100)):
        """创建测试图片"""
        img = Image.new('RGB', size, color='red')
        img_io = io.BytesIO()
        img.save(img_io, format=format)
        img_io.seek(0)
        return img_io.getvalue()

    @patch('media.views.RCabinetClient')
    def test_upload_file_success(self, mock_cabinet_client):
        """测试文件上传成功"""
        # 模拟R-Cabinet客户端响应
        mock_client = Mock()
        mock_cabinet_client.return_value = mock_client
        mock_client.upload_file.return_value = {
            'success': True,
            'data': {
                'file_id': 'rcab_12345',
                'file_url': 'https://cabinet.rakuten.co.jp/test.jpg'
            }
        }

        # 设置JWT认证
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

        # 创建测试文件
        image_data = self.create_test_image()
        uploaded_file = SimpleUploadedFile(
            "test.jpg",
            image_data,
            content_type="image/jpeg"
        )

        # 发送上传请求
        response = self.client.post(
            reverse('media:upload_media_file'),
            {
                'file': uploaded_file,
                'alt_text': 'Test image'
            },
            format='multipart'
        )

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('data', data)

    def test_upload_file_unauthorized(self):
        """测试未认证用户上传文件"""
        image_data = self.create_test_image()
        uploaded_file = SimpleUploadedFile(
            "test.jpg",
            image_data,
            content_type="image/jpeg"
        )

        response = self.client.post(
            reverse('media:upload_media_file'),
            {'file': uploaded_file},
            format='multipart'
        )

        self.assertEqual(response.status_code, 401)

    def test_upload_file_invalid_file(self):
        """测试上传无效文件"""
        # 设置JWT认证
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

        # 上传无效文件
        uploaded_file = SimpleUploadedFile(
            "test.txt",
            b"hello world",
            content_type="text/plain"
        )

        response = self.client.post(
            reverse('media:upload_media_file'),
            {'file': uploaded_file},
            format='multipart'
        )

        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)
