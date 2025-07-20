import pytest
import json
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile

from media.models import MediaFile
from pagemaker.integrations.exceptions import RakutenAPIError


@pytest.mark.unit
class MediaUploadViewTestCase(TestCase):
    """媒体文件上传API测试"""

    def setUp(self):
        """设置测试数据"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        # 创建测试文件
        self.test_image = SimpleUploadedFile(
            "test.jpg",
            b"fake image content",
            content_type="image/jpeg"
        )

    def test_upload_media_file_success(self):
        """测试文件上传成功"""
        with patch('media.views.RCabinetClient') as mock_cabinet_client:
            # Mock R-Cabinet客户端
            mock_client = MagicMock()
            mock_cabinet_client.return_value = mock_client
            mock_client.upload_file.return_value = {
                "success": True,
                "data": {
                    "file_id": "123456",
                    "file_url": "https://image.rakuten.co.jp/test/test.jpg"
                }
            }

            # Mock配置
            with patch('pagemaker.config.config') as mock_config:
                mock_config.RCABINET_INTEGRATION_ENABLED = True

                response = self.client.post(
                    reverse('media:upload_media_file'),
                    {
                        'file': self.test_image,
                        'alt_text': '测试图片'
                    },
                    format='multipart'
                )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('data', response.data)
        
        # 检查数据库记录
        media_file = MediaFile.objects.get(user=self.user)
        self.assertEqual(media_file.original_filename, 'test.jpg')
        self.assertEqual(media_file.upload_status, 'completed')
        self.assertEqual(media_file.rcabinet_file_id, '123456')

    def test_upload_media_file_no_file(self):
        """测试未上传文件的情况"""
        response = self.client.post(
            reverse('media:upload_media_file'),
            {'alt_text': '测试图片'},
            format='multipart'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'FILE_REQUIRED')

    def test_upload_media_file_service_disabled(self):
        """测试R-Cabinet服务禁用的情况"""
        with patch('pagemaker.config.config') as mock_config:
            mock_config.RCABINET_INTEGRATION_ENABLED = False

            response = self.client.post(
                reverse('media:upload_media_file'),
                {'file': self.test_image},
                format='multipart'
            )

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data['error']['code'], 'SERVICE_DISABLED')

    def test_upload_media_file_cabinet_error(self):
        """测试R-Cabinet API错误的情况"""
        with patch('media.views.RCabinetClient') as mock_cabinet_client:
            # Mock R-Cabinet客户端抛出异常
            mock_client = MagicMock()
            mock_cabinet_client.return_value = mock_client
            mock_client.upload_file.side_effect = RakutenAPIError("上传失败")

            # Mock配置
            with patch('pagemaker.config.config') as mock_config:
                mock_config.RCABINET_INTEGRATION_ENABLED = True

                response = self.client.post(
                    reverse('media:upload_media_file'),
                    {'file': self.test_image},
                    format='multipart'
                )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 检查数据库记录状态
        media_file = MediaFile.objects.get(user=self.user)
        self.assertEqual(media_file.upload_status, 'failed')

    def test_upload_media_file_authentication_required(self):
        """测试未认证访问"""
        self.client.force_authenticate(user=None)
        
        response = self.client.post(
            reverse('media:upload_media_file'),
            {'file': self.test_image},
            format='multipart'
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


@pytest.mark.unit
class CabinetImagesViewTestCase(TestCase):
    """R-Cabinet图片列表API测试"""

    def setUp(self):
        """设置测试数据"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_get_cabinet_images_success(self):
        """测试获取图片列表成功"""
        with patch('media.views.RCabinetClient') as mock_cabinet_client:
            # Mock R-Cabinet客户端
            mock_client = MagicMock()
            mock_cabinet_client.return_value = mock_client
            mock_client.get_folder_files.return_value = {
                "success": True,
                "data": {
                    "files": [
                        {
                            "file_id": "123",
                            "file_name": "image1.jpg",
                            "file_url": "https://image.rakuten.co.jp/test/image1.jpg",
                            "file_size": 1024,
                            "content_type": "image/jpeg",
                            "created_date": "2023-01-01T00:00:00Z"
                        },
                        {
                            "file_id": "124",
                            "file_name": "image2.png",
                            "file_url": "https://image.rakuten.co.jp/test/image2.png",
                            "file_size": 2048,
                            "content_type": "image/png",
                            "created_date": "2023-01-02T00:00:00Z"
                        }
                    ]
                }
            }

            # Mock配置
            with patch('pagemaker.config.config') as mock_config:
                mock_config.RCABINET_INTEGRATION_ENABLED = True

                response = self.client.get(
                    reverse('media:get_cabinet_images'),
                    {'page': 1, 'pageSize': 20}
                )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('data', response.data)
        
        images = response.data['data']['images']
        self.assertEqual(len(images), 2)
        self.assertEqual(images[0]['id'], '123')
        self.assertEqual(images[0]['filename'], 'image1.jpg')
        self.assertEqual(images[1]['id'], '124')
        self.assertEqual(images[1]['filename'], 'image2.png')

    def test_get_cabinet_images_with_search(self):
        """测试带搜索关键词的图片列表"""
        with patch('media.views.RCabinetClient') as mock_cabinet_client:
            # Mock R-Cabinet客户端
            mock_client = MagicMock()
            mock_cabinet_client.return_value = mock_client
            mock_client.search_files.return_value = {
                "success": True,
                "data": {
                    "files": [
                        {
                            "file_id": "125",
                            "file_name": "search_result.jpg",
                            "file_url": "https://image.rakuten.co.jp/test/search_result.jpg",
                            "file_size": 512,
                            "content_type": "image/jpeg",
                            "created_date": "2023-01-03T00:00:00Z"
                        }
                    ]
                }
            }

            # Mock配置
            with patch('pagemaker.config.config') as mock_config:
                mock_config.RCABINET_INTEGRATION_ENABLED = True

                response = self.client.get(
                    reverse('media:get_cabinet_images'),
                    {'search': 'search_result'}
                )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_client.search_files.assert_called_once_with(
            file_name='search_result',
            offset=1,
            limit=20
        )

    def test_get_cabinet_images_filter_non_images(self):
        """测试过滤非图片文件"""
        with patch('media.views.RCabinetClient') as mock_cabinet_client:
            # Mock R-Cabinet客户端返回混合文件类型
            mock_client = MagicMock()
            mock_cabinet_client.return_value = mock_client
            mock_client.get_folder_files.return_value = {
                "success": True,
                "data": {
                    "files": [
                        {
                            "file_id": "123",
                            "file_name": "image1.jpg",
                            "file_url": "https://image.rakuten.co.jp/test/image1.jpg",
                            "file_size": 1024,
                            "content_type": "image/jpeg",
                            "created_date": "2023-01-01T00:00:00Z"
                        },
                        {
                            "file_id": "124",
                            "file_name": "document.pdf",
                            "file_url": "https://image.rakuten.co.jp/test/document.pdf",
                            "file_size": 2048,
                            "content_type": "application/pdf",
                            "created_date": "2023-01-02T00:00:00Z"
                        }
                    ]
                }
            }

            # Mock配置
            with patch('pagemaker.config.config') as mock_config:
                mock_config.RCABINET_INTEGRATION_ENABLED = True

                response = self.client.get(reverse('media:get_cabinet_images'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        images = response.data['data']['images']
        # 应该只返回图片文件，过滤掉PDF
        self.assertEqual(len(images), 1)
        self.assertEqual(images[0]['filename'], 'image1.jpg')

    def test_get_cabinet_images_service_disabled(self):
        """测试R-Cabinet服务禁用的情况"""
        with patch('pagemaker.config.config') as mock_config:
            mock_config.RCABINET_INTEGRATION_ENABLED = False

            response = self.client.get(reverse('media:get_cabinet_images'))

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data['error']['code'], 'SERVICE_DISABLED')

    def test_get_cabinet_images_api_error(self):
        """测试R-Cabinet API错误的情况"""
        with patch('media.views.RCabinetClient') as mock_cabinet_client:
            # Mock R-Cabinet客户端抛出异常
            mock_client = MagicMock()
            mock_cabinet_client.return_value = mock_client
            mock_client.get_folder_files.side_effect = RakutenAPIError("API错误")

            # Mock配置
            with patch('pagemaker.config.config') as mock_config:
                mock_config.RCABINET_INTEGRATION_ENABLED = True

                response = self.client.get(reverse('media:get_cabinet_images'))

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data['error']['code'], 'CABINET_API_ERROR')

    def test_get_cabinet_images_pagination(self):
        """测试分页参数"""
        with patch('media.views.RCabinetClient') as mock_cabinet_client:
            # Mock R-Cabinet客户端
            mock_client = MagicMock()
            mock_cabinet_client.return_value = mock_client
            mock_client.get_folder_files.return_value = {
                "success": True,
                "data": {"files": []}
            }

            # Mock配置
            with patch('pagemaker.config.config') as mock_config:
                mock_config.RCABINET_INTEGRATION_ENABLED = True

                response = self.client.get(
                    reverse('media:get_cabinet_images'),
                    {'page': 2, 'pageSize': 50}
                )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证传递给R-Cabinet API的参数
        mock_client.get_folder_files.assert_called_once_with(
            folder_id=0,
            offset=51,  # (2-1) * 50 + 1
            limit=50
        )

    def test_get_cabinet_images_authentication_required(self):
        """测试未认证访问"""
        self.client.force_authenticate(user=None)
        
        response = self.client.get(reverse('media:get_cabinet_images'))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


@pytest.mark.integration
class MediaAPIIntegrationTestCase(TestCase):
    """媒体API集成测试"""

    def setUp(self):
        """设置测试数据"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='integrationuser',
            email='integration@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_upload_and_list_workflow(self):
        """测试上传和列表的完整工作流"""
        with patch('media.views.RCabinetClient') as mock_cabinet_client:
            # Mock R-Cabinet客户端
            mock_client = MagicMock()
            mock_cabinet_client.return_value = mock_client
            
            # Mock上传响应
            mock_client.upload_file.return_value = {
                "success": True,
                "data": {
                    "file_id": "integration_test_123",
                    "file_url": "https://image.rakuten.co.jp/test/integration.jpg"
                }
            }
            
            # Mock列表响应
            mock_client.get_folder_files.return_value = {
                "success": True,
                "data": {
                    "files": [
                        {
                            "file_id": "integration_test_123",
                            "file_name": "integration.jpg",
                            "file_url": "https://image.rakuten.co.jp/test/integration.jpg",
                            "file_size": 1024,
                            "content_type": "image/jpeg",
                            "created_date": "2023-01-01T00:00:00Z"
                        }
                    ]
                }
            }

            # Mock配置
            with patch('pagemaker.config.config') as mock_config:
                mock_config.RCABINET_INTEGRATION_ENABLED = True

                # 1. 上传文件
                test_image = SimpleUploadedFile(
                    "integration.jpg",
                    b"integration test image",
                    content_type="image/jpeg"
                )
                
                upload_response = self.client.post(
                    reverse('media:upload_media_file'),
                    {'file': test_image},
                    format='multipart'
                )

                # 2. 获取图片列表
                list_response = self.client.get(reverse('media:get_cabinet_images'))

        # 验证上传响应
        self.assertEqual(upload_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(upload_response.data['success'])

        # 验证列表响应
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertTrue(list_response.data['success'])
        
        images = list_response.data['data']['images']
        self.assertEqual(len(images), 1)
        self.assertEqual(images[0]['id'], 'integration_test_123')
        self.assertEqual(images[0]['filename'], 'integration.jpg')

        # 验证数据库记录
        media_file = MediaFile.objects.get(user=self.user)
        self.assertEqual(media_file.rcabinet_file_id, 'integration_test_123')
        self.assertEqual(media_file.upload_status, 'completed') 