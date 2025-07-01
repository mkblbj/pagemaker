from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from configurations.models import ShopConfiguration
from users.models import UserProfile

User = get_user_model()


class ShopConfigurationAPITests(TestCase):
    """ShopConfiguration API端点测试"""
    
    def setUp(self):
        """测试数据准备"""
        self.client = APIClient()
        
        # 创建admin用户
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass',
            is_staff=True,
            is_superuser=True
        )
        # 创建admin用户的UserProfile
        UserProfile.objects.create(
            user=self.admin_user,
            role='admin',
            full_name='Admin User'
        )
        
        # 创建普通用户
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='userpass'
        )
        # 创建普通用户的UserProfile
        UserProfile.objects.create(
            user=self.regular_user,
            role='editor',
            full_name='Regular User'
        )
        
        # 测试数据
        self.valid_data = {
            'shop_name': '测试店铺',
            'target_area': 'test_area',
            'api_service_secret': 'test_service_secret',
            'api_license_key': 'test_license_key',
            'ftp_host': 'ftp.example.com',
            'ftp_port': 21,
            'ftp_user': 'testuser',
            'ftp_password': 'testpass'
        }
        
        # 创建测试配置数据
        self.config = ShopConfiguration.objects.create(**self.valid_data)
        
        # API端点URL
        self.list_url = reverse('configurations:shop-configurations-list')
        self.detail_url = reverse('configurations:shop-configuration-detail', kwargs={'id': self.config.id})
    
    def get_jwt_token(self, user):
        """获取JWT令牌"""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def test_get_shop_configurations_list_as_admin(self):
        """测试admin用户获取店铺配置列表"""
        token = self.get_jwt_token(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(len(response.data['data']), 1)
        
        # 验证响应数据结构
        config_data = response.data['data'][0]
        self.assertEqual(config_data['id'], str(self.config.id))
        self.assertEqual(config_data['shop_name'], self.valid_data['shop_name'])
        self.assertEqual(config_data['target_area'], self.valid_data['target_area'])
    
    def test_get_shop_configurations_list_unauthorized(self):
        """测试未认证用户访问店铺配置列表"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_shop_configurations_list_as_regular_user(self):
        """测试普通用户访问店铺配置列表（应该被拒绝）"""
        token = self.get_jwt_token(self.regular_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_get_shop_configuration_detail_as_admin(self):
        """测试admin用户获取单个店铺配置"""
        token = self.get_jwt_token(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.get(self.detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # 验证响应数据
        config_data = response.data['data']
        self.assertEqual(config_data['id'], str(self.config.id))
        self.assertEqual(config_data['shop_name'], self.valid_data['shop_name'])
        self.assertEqual(config_data['ftp_host'], self.valid_data['ftp_host'])
    
    def test_create_shop_configuration_as_admin(self):
        """测试admin用户创建店铺配置"""
        token = self.get_jwt_token(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        new_data = {
            'shop_name': '新测试店铺',
            'target_area': 'new_test_area',
            'api_service_secret': 'new_service_secret',
            'api_license_key': 'new_license_key',
            'ftp_host': 'newftp.example.com',
            'ftp_port': 22,
            'ftp_user': 'newuser',
            'ftp_password': 'newpass'
        }
        
        response = self.client.post(self.list_url, new_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], '店铺配置创建成功')
        
        # 验证数据库中是否创建成功
        self.assertTrue(ShopConfiguration.objects.filter(target_area='new_test_area').exists())
    
    def test_create_shop_configuration_duplicate_target_area(self):
        """测试创建重复target_area的店铺配置"""
        token = self.get_jwt_token(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        duplicate_data = self.valid_data.copy()
        duplicate_data['shop_name'] = '重复的店铺'
        
        response = self.client.post(self.list_url, duplicate_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('target_area', response.data['errors'])
    
    def test_update_shop_configuration_as_admin(self):
        """测试admin用户更新店铺配置"""
        token = self.get_jwt_token(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # 使用PATCH而不是PUT来部分更新
        update_data = {
            'shop_name': '更新后的店铺名称',
            'ftp_host': 'updated.ftp.example.com'
        }
        
        response = self.client.patch(self.detail_url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], '店铺配置更新成功')
        
        # 验证数据库中的更新
        self.config.refresh_from_db()
        self.assertEqual(self.config.shop_name, update_data['shop_name'])
        self.assertEqual(self.config.ftp_host, update_data['ftp_host'])
    
    def test_delete_shop_configuration_as_admin(self):
        """测试admin用户删除店铺配置"""
        token = self.get_jwt_token(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = self.client.delete(self.detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('删除成功', response.data['message'])
        
        # 验证数据库中是否删除
        self.assertFalse(ShopConfiguration.objects.filter(id=self.config.id).exists())
    
    def test_invalid_ftp_port_validation(self):
        """测试无效FTP端口的验证"""
        token = self.get_jwt_token(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        invalid_data = self.valid_data.copy()
        invalid_data['target_area'] = 'invalid_port_test'
        invalid_data['ftp_port'] = 70000  # 无效端口
        
        response = self.client.post(self.list_url, invalid_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('ftp_port', response.data['errors']) 