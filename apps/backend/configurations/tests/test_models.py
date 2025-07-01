import uuid
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from configurations.models import ShopConfiguration


class ShopConfigurationModelTests(TestCase):
    """ShopConfiguration模型测试"""
    
    def setUp(self):
        """测试数据准备"""
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
    
    def test_create_shop_configuration_success(self):
        """测试成功创建店铺配置"""
        config = ShopConfiguration.objects.create(**self.valid_data)
        
        # 验证基本字段
        self.assertEqual(config.shop_name, self.valid_data['shop_name'])
        self.assertEqual(config.target_area, self.valid_data['target_area'])
        self.assertEqual(config.api_service_secret, self.valid_data['api_service_secret'])
        self.assertEqual(config.ftp_host, self.valid_data['ftp_host'])
        self.assertEqual(config.ftp_port, self.valid_data['ftp_port'])
        
        # 验证自动生成的字段
        self.assertIsInstance(config.id, uuid.UUID)
        self.assertIsNotNone(config.created_at)
        self.assertIsNotNone(config.updated_at)
    
    def test_str_method(self):
        """测试__str__方法"""
        config = ShopConfiguration.objects.create(**self.valid_data)
        expected_str = f"{self.valid_data['shop_name']} ({self.valid_data['target_area']})"
        self.assertEqual(str(config), expected_str)
    
    def test_target_area_unique_constraint(self):
        """测试target_area唯一性约束"""
        # 创建第一个配置
        ShopConfiguration.objects.create(**self.valid_data)
        
        # 尝试创建具有相同target_area的第二个配置
        duplicate_data = self.valid_data.copy()
        duplicate_data['shop_name'] = '另一个店铺'
        
        with self.assertRaises(IntegrityError):
            ShopConfiguration.objects.create(**duplicate_data)
    
    def test_ftp_port_default_value(self):
        """测试FTP端口的默认值"""
        data = self.valid_data.copy()
        del data['ftp_port']  # 移除ftp_port以测试默认值
        
        config = ShopConfiguration.objects.create(**data)
        self.assertEqual(config.ftp_port, 21)
    
    def test_model_ordering(self):
        """测试模型排序"""
        # 创建两个配置
        config1 = ShopConfiguration.objects.create(**self.valid_data)
        
        data2 = self.valid_data.copy()
        data2['target_area'] = 'test_area_2'
        data2['shop_name'] = '第二个店铺'
        config2 = ShopConfiguration.objects.create(**data2)
        
        # 获取所有配置，应该按创建时间倒序排列
        configs = list(ShopConfiguration.objects.all())
        self.assertEqual(configs[0].id, config2.id)  # 最新的在前
        self.assertEqual(configs[1].id, config1.id)
    
    def test_database_table_name(self):
        """测试数据库表名"""
        self.assertEqual(ShopConfiguration._meta.db_table, 'shop_configurations')
    
    def test_verbose_names(self):
        """测试模型的中文名称"""
        meta = ShopConfiguration._meta
        self.assertEqual(meta.verbose_name, '店铺配置')
        self.assertEqual(meta.verbose_name_plural, '店铺配置') 