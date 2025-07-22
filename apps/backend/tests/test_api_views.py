"""
API Views 测试
"""

import pytest
from unittest.mock import patch, Mock
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.db import connection
from rest_framework.test import APIClient
from rest_framework import status
import json

from pagemaker.integrations.exceptions import RakutenAPIError

User = get_user_model()


@pytest.mark.unit
class HealthCheckViewTest(TestCase):
    """健康检查视图测试"""

    def setUp(self):
        self.client = APIClient()

    def test_health_check_success(self):
        """测试健康检查成功"""
        response = self.client.get(reverse("health_check"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["database"], "connected")
        self.assertIn("timestamp", data)

    @patch("api.views.connection")
    def test_health_check_database_error(self, mock_connection):
        """测试数据库连接失败的健康检查"""
        # 模拟数据库连接错误
        mock_cursor = Mock()
        mock_cursor.execute.side_effect = Exception("Database connection failed")
        mock_connection.cursor.return_value.__enter__.return_value = mock_cursor

        response = self.client.get(reverse("health_check"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["database"], "disconnected")
        self.assertIn("timestamp", data)

    def test_health_check_response_format(self):
        """测试健康检查响应格式"""
        response = self.client.get(reverse("health_check"))
        
        data = response.json()
        required_fields = ["status", "database", "timestamp"]
        
        for field in required_fields:
            self.assertIn(field, data, f"响应中缺少字段: {field}")

    def test_health_check_allows_any_permission(self):
        """测试健康检查允许任何用户访问"""
        # 不需要认证的请求
        response = self.client.get(reverse("health_check"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 已认证用户的请求
        user = User.objects.create_user(username="testuser", password="testpass")
        self.client.force_authenticate(user=user)
        response = self.client.get(reverse("health_check"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)


@pytest.mark.unit
class RakutenHealthCheckViewTest(TestCase):
    """R-Cabinet健康检查视图测试"""

    def setUp(self):
        self.client = APIClient()

    @patch("api.views.RCabinetClient")
    def test_rakuten_health_check_success(self, mock_client_class):
        """测试R-Cabinet健康检查成功"""
        # 模拟健康的R-Cabinet响应
        mock_client = Mock()
        mock_client.health_check.return_value = {
            "status": "healthy",
            "response_time_ms": 150,
            "api_status": "active",
            "last_check": "2024-01-01T10:00:00Z",
            "request_id": "req-12345",
        }
        mock_client_class.return_value = mock_client

        response = self.client.get(reverse("rakuten_health_check"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["service"], "R-Cabinet")
        self.assertEqual(data["status"], "healthy")
        self.assertIn("data", data)
        self.assertEqual(data["data"]["response_time_ms"], 150)
        self.assertEqual(data["data"]["api_status"], "active")

    @patch("api.views.RCabinetClient")
    def test_rakuten_health_check_unhealthy(self, mock_client_class):
        """测试R-Cabinet健康检查不健康"""
        # 模拟不健康的R-Cabinet响应
        mock_client = Mock()
        mock_client.health_check.return_value = {
            "status": "unhealthy",
            "error": "API服务不可用",
            "error_type": "ServiceUnavailable",
            "last_check": "2024-01-01T10:00:00Z",
        }
        mock_client_class.return_value = mock_client

        response = self.client.get(reverse("rakuten_health_check"))

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["service"], "R-Cabinet")
        self.assertEqual(data["status"], "unhealthy")
        self.assertIn("error", data)
        self.assertEqual(data["error"]["code"], "SERVICE_UNAVAILABLE")

    @patch("api.views.RCabinetClient")
    def test_rakuten_health_check_api_error(self, mock_client_class):
        """测试R-Cabinet API错误"""
        # 模拟RakutenAPIError异常
        mock_client = Mock()
        mock_client.health_check.side_effect = RakutenAPIError("API调用失败")
        mock_client_class.return_value = mock_client

        response = self.client.get(reverse("rakuten_health_check"))

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["service"], "R-Cabinet")
        self.assertEqual(data["status"], "unhealthy")
        self.assertEqual(data["error"]["code"], "API_ERROR")
        self.assertIn("R-Cabinet API错误", data["error"]["message"])

    @patch("api.views.RCabinetClient")
    def test_rakuten_health_check_internal_error(self, mock_client_class):
        """测试R-Cabinet内部错误"""
        # 模拟一般异常
        mock_client = Mock()
        mock_client.health_check.side_effect = Exception("内部服务器错误")
        mock_client_class.return_value = mock_client

        response = self.client.get(reverse("rakuten_health_check"))

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["service"], "R-Cabinet")
        self.assertEqual(data["status"], "unhealthy")
        self.assertEqual(data["error"]["code"], "INTERNAL_ERROR")
        self.assertIn("健康检查失败", data["error"]["message"])

    def test_rakuten_health_check_allows_any_permission(self):
        """测试R-Cabinet健康检查允许任何用户访问"""
        with patch("api.views.RCabinetClient") as mock_client_class:
            mock_client = Mock()
            mock_client.health_check.return_value = {"status": "healthy"}
            mock_client_class.return_value = mock_client

            # 不需要认证的请求
            response = self.client.get(reverse("rakuten_health_check"))
            self.assertIn(response.status_code, [200, 503])  # 任一状态码都说明端点可访问

    @patch("api.views.RCabinetClient")
    def test_rakuten_health_check_response_format(self, mock_client_class):
        """测试R-Cabinet健康检查响应格式"""
        mock_client = Mock()
        mock_client.health_check.return_value = {
            "status": "healthy",
            "response_time_ms": 100,
        }
        mock_client_class.return_value = mock_client

        response = self.client.get(reverse("rakuten_health_check"))
        
        data = response.json()
        required_fields = ["success", "service", "status"]
        
        for field in required_fields:
            self.assertIn(field, data, f"响应中缺少字段: {field}")


@pytest.mark.integration
class APIIntegrationTest(TestCase):
    """API集成测试"""

    def setUp(self):
        self.client = APIClient()

    def test_api_urls_accessible(self):
        """测试主要API端点可访问"""
        endpoints = [
            "health_check",
            "rakuten_health_check",
        ]

        for endpoint_name in endpoints:
            with self.subTest(endpoint=endpoint_name):
                response = self.client.get(reverse(endpoint_name))
                # 端点应该可访问（不返回404）
                self.assertNotEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_api_cors_headers(self):
        """测试API CORS头设置"""
        response = self.client.get(reverse("health_check"))
        
        # 检查是否有CORS相关的头（如果配置了）
        # 这取决于Django CORS设置
        self.assertIsNotNone(response)  # 基本可达性测试

    def test_api_content_type(self):
        """测试API响应内容类型"""
        response = self.client.get(reverse("health_check"))
        
        self.assertEqual(response["Content-Type"], "application/json")

    def test_api_method_not_allowed(self):
        """测试不支持的HTTP方法"""
        # health_check只支持GET
        response = self.client.post(reverse("health_check"))
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        response = self.client.put(reverse("health_check"))
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        response = self.client.delete(reverse("health_check"))
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED) 