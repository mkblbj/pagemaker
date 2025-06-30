"""
R-Cabinet文件上传集成测试
"""

import io
from unittest.mock import patch, Mock
from django.test import TestCase
from django.contrib.auth import get_user_model
from PIL import Image

from pagemaker.integrations.cabinet_client import RCabinetClient
from pagemaker.integrations.exceptions import RakutenAPIError

User = get_user_model()


class RCabinetUploadMockTestCase(TestCase):
    """R-Cabinet上传Mock测试"""

    def setUp(self):
        # 使用mock模式进行模拟测试
        self.client = RCabinetClient(test_mode="mock")
        self.test_image_data = self._create_test_image_data()

    def _create_test_image_data(self):
        """创建测试图片数据"""
        image = Image.new("RGB", (100, 100), color="green")
        image_file = io.BytesIO()
        image.save(image_file, format="JPEG")
        return image_file.getvalue()

    def test_mock_upload_success(self):
        """测试模拟模式下的文件上传成功"""
        result = self.client.upload_file(
            file_data=self.test_image_data, filename="test_integration.jpg"
        )

        self.assertTrue(result["success"])
        self.assertEqual(result["system_status"], "OK")
        self.assertIn("file_id", result["data"])
        self.assertIn("file_url", result["data"])
        self.assertEqual(result["data"]["file_name"], "test_integration.jpg")

    def test_mock_upload_with_folder(self):
        """测试指定文件夹的上传"""
        result = self.client.upload_file(
            file_data=self.test_image_data,
            filename="test_folder.jpg",
            folder_id=123,
        )

        self.assertTrue(result["success"])
        self.assertIn("file_id", result["data"])


class RCabinetUploadIntegrationTestCase(TestCase):
    """R-Cabinet上传真实API集成测试"""

    def setUp(self):
        # 使用real模式进行真实API测试
        self.client = RCabinetClient(test_mode="real")
        self.test_image_data = self._create_test_image_data()

    def _create_test_image_data(self):
        """创建测试图片数据"""
        image = Image.new("RGB", (100, 100), color="green")
        image_file = io.BytesIO()
        image.save(image_file, format="JPEG")
        return image_file.getvalue()

    def test_upload_xml_generation(self):
        """测试XML请求参数生成"""
        xml_data = self.client._build_upload_xml(filename="test.jpg", folder_id=456)

        self.assertIn("<fileName>test.jpg</fileName>", xml_data)
        self.assertIn("<folderId>456</folderId>", xml_data)
        self.assertIn('<?xml version="1.0" encoding="UTF-8"?>', xml_data)
        self.assertIn("<fileInsertRequest>", xml_data)
        self.assertIn("<file>", xml_data)

    def test_upload_xml_generation_minimal(self):
        """测试最小XML参数生成（使用默认文件夹）"""
        xml_data = self.client._build_upload_xml(filename="minimal.jpg")

        self.assertIn("<fileName>minimal.jpg</fileName>", xml_data)
        # 应该包含默认的folderId=0
        self.assertIn("<folderId>0</folderId>", xml_data)
        self.assertIn('<?xml version="1.0" encoding="UTF-8"?>', xml_data)


class RCabinetClientHealthCheckTestCase(TestCase):
    """R-Cabinet客户端健康检查测试"""

    def test_health_check_success(self):
        """测试健康检查成功"""
        client = RCabinetClient(test_mode="real")
        result = client.health_check()

        self.assertEqual(result["status"], "healthy")
        self.assertIn("response_time_ms", result)
        self.assertIn("last_check", result)

    @patch("pagemaker.integrations.cabinet_client.RCabinetClient.get_usage")
    def test_health_check_failure(self, mock_get_usage):
        """测试健康检查失败"""
        mock_get_usage.side_effect = RakutenAPIError("连接失败")

        client = RCabinetClient(test_mode="real")
        result = client.health_check()

        self.assertEqual(result["status"], "unhealthy")
        self.assertIn("error", result)
        self.assertEqual(result["error_type"], "RakutenAPIError")


class RCabinetConnectionTestCase(TestCase):
    """R-Cabinet连接测试"""

    def test_real_connection_success(self):
        """测试真实模式连接成功"""
        client = RCabinetClient(test_mode="real")
        result = client.test_connection()

        self.assertTrue(result["success"])
        self.assertIn("R-Cabinet API连接测试成功", result["message"])
        self.assertIn("request_id", result["data"])

    def test_usage_api_real(self):
        """测试使用状况API真实响应"""
        client = RCabinetClient(test_mode="real")
        result = client.get_usage()

        self.assertTrue(result["success"])
        self.assertEqual(result["system_status"], "OK")
        self.assertIn("max_space", result["data"])
        self.assertIn("use_space", result["data"])
        # 真实API返回的数据不是固定值，所以只验证存在且为数字
        self.assertIsInstance(result["data"]["max_space"], (int, float))
        self.assertIsInstance(result["data"]["use_space"], (int, float))

    def test_folders_api_real(self):
        """测试文件夹列表API真实响应"""
        client = RCabinetClient(test_mode="real")
        result = client.get_folders(limit=5)

        self.assertTrue(result["success"])
        self.assertEqual(result["system_status"], "OK")
        self.assertIn("folders", result["data"])
        # 真实API返回的文件夹数量不固定，只验证是列表
        self.assertIsInstance(result["data"]["folders"], list)

    def test_rate_limiting(self):
        """测试速率限制功能"""
        # 真实模式下测试实际的速率限制
        client = RCabinetClient(test_mode="real")

        import time

        start_time = time.time()

        # 连续调用两次API
        result1 = client.get_usage()
        result2 = client.get_usage()

        end_time = time.time()
        duration = end_time - start_time

        # 验证API调用成功
        self.assertTrue(result1["success"])
        self.assertTrue(result2["success"])

        # 真实模式下第二次调用应该被速率限制延迟
        # 允许一些误差，但应该接近1秒
        self.assertGreater(duration, 0.8)  # 至少0.8秒
        self.assertLess(duration, 2.0)  # 不超过2秒
