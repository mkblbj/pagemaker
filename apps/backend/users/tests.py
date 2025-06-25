from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse


class UsersAppTestCase(TestCase):
    """Users应用测试"""

    def test_users_app_config(self):
        """测试users应用配置"""
        from users.apps import UsersConfig

        self.assertEqual(UsersConfig.name, "users")
        self.assertEqual(UsersConfig.verbose_name, "Users")

    def test_user_model_creation(self):
        """测试用户模型创建"""
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")
        self.assertTrue(user.check_password("testpass123"))
        self.assertTrue(user.is_active)

    def test_user_model_str(self):
        """测试用户模型字符串表示"""
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.assertEqual(str(user), "testuser")

    def test_user_admin_creation(self):
        """测试管理员用户创建"""
        admin_user = User.objects.create_superuser(
            username="admin", email="admin@example.com", password="adminpass123"
        )

        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
        self.assertTrue(admin_user.is_active)
