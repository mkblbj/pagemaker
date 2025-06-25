from django.test import TestCase, Client
from django.urls import reverse
import json


class HealthCheckTestCase(TestCase):
    """测试健康检查端点"""

    def setUp(self):
        self.client = Client()

    def test_health_check_success(self):
        """测试健康检查端点返回成功状态"""
        response = self.client.get('/api/health/')
        
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.content)
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['database'], 'connected')
        self.assertIn('timestamp', data)

    def test_health_check_content_type(self):
        """测试健康检查端点返回JSON格式"""
        response = self.client.get('/api/health/')
        
        self.assertEqual(response['Content-Type'], 'application/json')
