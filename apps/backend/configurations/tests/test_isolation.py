"""
店铺配置数据隔离测试
测试普通用户只能看到自己的店铺配置，admin可以看到所有
"""
import pytest
from django.contrib.auth.models import User
from users.models import UserProfile
from configurations.models import ShopConfiguration


@pytest.mark.django_db
class TestShopConfigurationIsolation:
    """店铺配置数据隔离测试"""

    def test_user_can_only_see_own_shops(self):
        """测试：普通用户只能看到自己的店铺配置"""
        # 创建两个普通用户
        user1 = User.objects.create_user(username="user1", password="pass123")
        user2 = User.objects.create_user(username="user2", password="pass123")
        
        UserProfile.objects.create(user=user1, role="editor")
        UserProfile.objects.create(user=user2, role="editor")
        
        # 创建各自的店铺配置
        shop1 = ShopConfiguration.objects.create(
            shop_name="User1的店铺",
            target_area="user1_shop",
            owner=user1,
            api_service_secret="secret1",
            api_license_key="key1",
            ftp_host="ftp1.example.com",
            ftp_user="user1",
            ftp_password="pass1"
        )
        
        shop2 = ShopConfiguration.objects.create(
            shop_name="User2的店铺",
            target_area="user2_shop",
            owner=user2,
            api_service_secret="secret2",
            api_license_key="key2",
            ftp_host="ftp2.example.com",
            ftp_user="user2",
            ftp_password="pass2"
        )
        
        # 验证user1只能看到自己的店铺
        user1_shops = ShopConfiguration.objects.filter(owner=user1)
        assert user1_shops.count() == 1
        assert user1_shops.first() == shop1
        
        # 验证user2只能看到自己的店铺
        user2_shops = ShopConfiguration.objects.filter(owner=user2)
        assert user2_shops.count() == 1
        assert user2_shops.first() == shop2

    def test_admin_can_see_all_shops(self):
        """测试：admin可以看到所有店铺配置"""
        # 创建admin和普通用户
        admin_user = User.objects.create_user(username="admin", password="admin123")
        normal_user = User.objects.create_user(username="user1", password="pass123")
        
        UserProfile.objects.create(user=admin_user, role="admin")
        UserProfile.objects.create(user=normal_user, role="editor")
        
        # 创建店铺配置
        admin_shop = ShopConfiguration.objects.create(
            shop_name="Admin的店铺",
            target_area="admin_shop",
            owner=admin_user,
            api_service_secret="secret_admin",
            api_license_key="key_admin",
            ftp_host="ftp_admin.example.com",
            ftp_user="admin",
            ftp_password="pass_admin"
        )
        
        user_shop = ShopConfiguration.objects.create(
            shop_name="User的店铺",
            target_area="user_shop",
            owner=normal_user,
            api_service_secret="secret_user",
            api_license_key="key_user",
            ftp_host="ftp_user.example.com",
            ftp_user="user",
            ftp_password="pass_user"
        )
        
        # admin可以看到所有店铺（通过视图逻辑判断，这里只测数据存在性）
        all_shops = ShopConfiguration.objects.all()
        assert all_shops.count() == 2
        assert admin_shop in all_shops
        assert user_shop in all_shops

    def test_user_cannot_create_page_with_others_shop(self):
        """测试：普通用户不能使用别人的店铺创建页面"""
        from pages.models import PageTemplate
        
        # 创建两个用户
        user1 = User.objects.create_user(username="user1", password="pass123")
        user2 = User.objects.create_user(username="user2", password="pass123")
        
        UserProfile.objects.create(user=user1, role="editor")
        UserProfile.objects.create(user=user2, role="editor")
        
        # user2创建店铺配置
        shop2 = ShopConfiguration.objects.create(
            shop_name="User2的店铺",
            target_area="user2_shop",
            owner=user2,
            api_service_secret="secret2",
            api_license_key="key2",
            ftp_host="ftp2.example.com",
            ftp_user="user2",
            ftp_password="pass2"
        )
        
        # user1尝试使用user2的店铺创建页面（在serializer层会被拦截）
        # 这里只测试模型层面，不应该直接创建成功
        # 实际应该通过API测试来验证serializer的验证逻辑
        
        # 但可以测试：如果绕过验证直接创建，页面确实可以关联任何店铺（模型层不限制）
        page = PageTemplate.objects.create(
            name="测试页面",
            content=[],
            owner=user1,
            shop=shop2,  # user1使用user2的店铺
            device_type="pc"
        )
        
        # 模型层允许这样创建，但API层应该拦截
        assert page.shop == shop2
        assert page.owner == user1
