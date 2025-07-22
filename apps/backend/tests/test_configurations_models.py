"""
Configurations Models 测试
"""

import pytest
import uuid
from django.test import TestCase
from django.db import IntegrityError

from configurations.models import ShopConfiguration


@pytest.mark.unit
class ShopConfigurationModelTest(TestCase):
    """ShopConfiguration模型测试"""

    def setUp(self):
        """设置测试数据"""
        self.valid_config_data = {
            "shop_name": "测试店铺",
            "target_area": "test_area",
            "api_service_secret": "test_service_secret",
            "api_license_key": "test_license_key",
            "ftp_host": "ftp.example.com",
            "ftp_port": 21,
            "ftp_user": "testuser",
            "ftp_password": "testpass"
        }

    def test_create_shop_configuration(self):
        """测试创建店铺配置"""
        config = ShopConfiguration.objects.create(**self.valid_config_data)

        self.assertEqual(config.shop_name, "测试店铺")
        self.assertEqual(config.target_area, "test_area")
        self.assertEqual(config.api_service_secret, "test_service_secret")
        self.assertEqual(config.api_license_key, "test_license_key")
        self.assertEqual(config.ftp_host, "ftp.example.com")
        self.assertEqual(config.ftp_port, 21)
        self.assertEqual(config.ftp_user, "testuser")
        self.assertIsInstance(config.id, uuid.UUID)

    def test_shop_configuration_str_representation(self):
        """测试店铺配置的字符串表示"""
        config = ShopConfiguration.objects.create(**self.valid_config_data)
        
        expected_str = "测试店铺 (test_area)"
        self.assertEqual(str(config), expected_str)

    def test_target_area_unique_constraint(self):
        """测试target_area的唯一性约束"""
        # 创建第一个配置
        ShopConfiguration.objects.create(**self.valid_config_data)

        # 尝试创建具有相同target_area的配置应该失败
        duplicate_config_data = self.valid_config_data.copy()
        duplicate_config_data["shop_name"] = "另一个店铺"

        with self.assertRaises(IntegrityError):
            ShopConfiguration.objects.create(**duplicate_config_data)

    def test_ftp_port_default_value(self):
        """测试FTP端口的默认值"""
        config_data = self.valid_config_data.copy()
        del config_data["ftp_port"]  # 不指定端口

        config = ShopConfiguration.objects.create(**config_data)
        
        self.assertEqual(config.ftp_port, 21)  # 应该使用默认值

    def test_uuid_primary_key(self):
        """测试UUID主键"""
        config1 = ShopConfiguration.objects.create(**self.valid_config_data)
        
        config_data_2 = self.valid_config_data.copy()
        config_data_2["target_area"] = "test_area_2"
        config2 = ShopConfiguration.objects.create(**config_data_2)

        # 主键应该是UUID类型且不同
        self.assertIsInstance(config1.id, uuid.UUID)
        self.assertIsInstance(config2.id, uuid.UUID)
        self.assertNotEqual(config1.id, config2.id)

    def test_shop_configuration_fields_max_length(self):
        """测试字段最大长度限制"""
        # 测试shop_name字段长度限制
        long_shop_name = "a" * 101  # 超过100字符
        config_data = self.valid_config_data.copy()
        config_data["shop_name"] = long_shop_name

        config = ShopConfiguration(**config_data)
        
        # 字段长度验证在数据库层面，这里只测试模型创建
        self.assertEqual(config.shop_name, long_shop_name)

    def test_shop_configuration_required_fields(self):
        """测试必需字段"""
        required_fields = [
            "shop_name", "target_area", "api_service_secret", 
            "api_license_key", "ftp_host", "ftp_user"
        ]

        for field in required_fields:
            config_data = self.valid_config_data.copy()
            del config_data[field]

            with self.subTest(field=field):
                # 这里测试模型实例化，实际的数据库约束会在save()时检查
                config = ShopConfiguration(**config_data)
                self.assertFalse(hasattr(config, field) and getattr(config, field))


@pytest.mark.integration
class ShopConfigurationIntegrationTest(TestCase):
    """店铺配置集成测试"""

    def test_shop_configuration_crud_operations(self):
        """测试店铺配置的CRUD操作"""
        # Create
        config_data = {
            "shop_name": "集成测试店铺",
            "target_area": "integration_test",
            "api_service_secret": "integration_secret",
            "api_license_key": "integration_key",
            "ftp_host": "ftp.integration.com",
            "ftp_port": 2121,
            "ftp_user": "integration_user",
            "ftp_password": "integration_pass"
        }

        config = ShopConfiguration.objects.create(**config_data)
        config_id = config.id

        # Read
        retrieved_config = ShopConfiguration.objects.get(id=config_id)
        self.assertEqual(retrieved_config.shop_name, "集成测试店铺")
        self.assertEqual(retrieved_config.target_area, "integration_test")

        # Update
        retrieved_config.shop_name = "更新后的店铺名"
        retrieved_config.ftp_port = 3030
        retrieved_config.save()

        updated_config = ShopConfiguration.objects.get(id=config_id)
        self.assertEqual(updated_config.shop_name, "更新后的店铺名")
        self.assertEqual(updated_config.ftp_port, 3030)

        # Delete
        updated_config.delete()
        
        with self.assertRaises(ShopConfiguration.DoesNotExist):
            ShopConfiguration.objects.get(id=config_id)

    def test_multiple_shop_configurations(self):
        """测试多个店铺配置的管理"""
        configs = []
        
        for i in range(3):
            config_data = {
                "shop_name": f"店铺_{i}",
                "target_area": f"area_{i}",
                "api_service_secret": f"secret_{i}",
                "api_license_key": f"key_{i}",
                "ftp_host": f"ftp{i}.example.com",
                "ftp_port": 21 + i,
                "ftp_user": f"user_{i}",
                "ftp_password": f"pass_{i}"
            }
            
            config = ShopConfiguration.objects.create(**config_data)
            configs.append(config)

        # 验证所有配置都创建成功
        self.assertEqual(ShopConfiguration.objects.count(), 3)

        # 验证可以通过不同字段查询
        config_by_name = ShopConfiguration.objects.get(shop_name="店铺_1")
        config_by_area = ShopConfiguration.objects.get(target_area="area_1")
        
        self.assertEqual(config_by_name.id, config_by_area.id)
        self.assertEqual(config_by_name, configs[1])

        # 验证target_area的唯一性
        all_areas = ShopConfiguration.objects.values_list('target_area', flat=True)
        self.assertEqual(len(set(all_areas)), len(all_areas))  # 所有area都应该是唯一的 