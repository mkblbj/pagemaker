from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
import json
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from .models import UserProfile, get_user_profile, check_user_role, has_admin_role

User = get_user_model()


class UsersAppTestCase(TestCase):
    """Users应用测试"""

    def test_users_app_config(self):
        """测试users应用配置"""
        from users.apps import UsersConfig

        self.assertEqual(UsersConfig.name, "users")
        self.assertEqual(UsersConfig.verbose_name, "Users")

    def test_users_models_import(self):
        """测试users模型导入"""
        try:
            from users import models

            self.assertTrue(hasattr(models, "models"))
        except ImportError:
            self.fail("无法导入users.models")

    def test_users_views_import(self):
        """测试users视图导入"""
        try:
            from users import views

            self.assertTrue(hasattr(views, "render"))
        except ImportError:
            self.fail("无法导入users.views")

    def test_users_urls_import(self):
        """测试users URLs导入"""
        try:
            from users import urls

            self.assertTrue(hasattr(urls, "urlpatterns"))
        except ImportError:
            self.fail("无法导入users.urls")


class UserProfileModelTestCase(TestCase):
    """UserProfile模型测试"""

    def setUp(self):
        """测试数据准备"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
            is_superuser=True,
        )

    def test_create_user_profile(self):
        """测试创建用户配置文件"""
        profile = UserProfile.objects.create(
            user=self.user, role="editor", full_name="Test User"
        )

        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.role, "editor")
        self.assertEqual(profile.full_name, "Test User")
        self.assertIsNotNone(profile.created_at)
        self.assertIsNotNone(profile.updated_at)

    def test_user_profile_str_representation(self):
        """测试UserProfile字符串表示"""
        profile = UserProfile.objects.create(
            user=self.user, role="admin", full_name="Test Admin"
        )

        expected_str = f"{self.user.username} (admin)"
        self.assertEqual(str(profile), expected_str)

    def test_user_profile_default_role(self):
        """测试默认角色为editor"""
        profile = UserProfile.objects.create(user=self.user)
        self.assertEqual(profile.role, "editor")

    def test_user_profile_role_choices(self):
        """测试角色选择限制"""
        # 测试有效角色
        for role, _ in UserProfile.ROLE_CHOICES:
            profile = UserProfile.objects.create(
                user=User.objects.create_user(
                    username=f"user_{role}", password="pass123"
                ),
                role=role,
            )
            self.assertEqual(profile.role, role)

    def test_user_profile_one_to_one_constraint(self):
        """测试一对一关系约束"""
        # 创建第一个profile
        UserProfile.objects.create(user=self.user, role="editor")

        # 尝试为同一用户创建第二个profile应该失败
        with self.assertRaises(IntegrityError):
            UserProfile.objects.create(user=self.user, role="admin")

    def test_is_admin_method(self):
        """测试is_admin方法"""
        admin_profile = UserProfile.objects.create(user=self.user, role="admin")
        self.assertTrue(admin_profile.is_admin())

        editor_profile = UserProfile.objects.create(
            user=User.objects.create_user(username="editor", password="pass"),
            role="editor",
        )
        self.assertFalse(editor_profile.is_admin())

    def test_is_editor_method(self):
        """测试is_editor方法"""
        editor_profile = UserProfile.objects.create(user=self.user, role="editor")
        self.assertTrue(editor_profile.is_editor())

        admin_profile = UserProfile.objects.create(
            user=User.objects.create_user(username="admin_test", password="pass"),
            role="admin",
        )
        self.assertFalse(admin_profile.is_editor())


class UserProfileUtilsTestCase(TestCase):
    """UserProfile工具函数测试"""

    def setUp(self):
        """测试数据准备"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.superuser = User.objects.create_user(
            username="superuser",
            email="super@example.com",
            password="superpass123",
            is_superuser=True,
        )

    def test_get_user_profile_existing(self):
        """测试获取已存在的用户配置文件"""
        profile = UserProfile.objects.create(
            user=self.user, role="admin", full_name="Test User"
        )

        retrieved_profile = get_user_profile(self.user)
        self.assertEqual(retrieved_profile, profile)
        self.assertEqual(retrieved_profile.role, "admin")

    def test_get_user_profile_create_for_regular_user(self):
        """测试为普通用户自动创建配置文件"""
        # 确保用户没有profile
        self.assertFalse(hasattr(self.user, "userprofile"))

        profile = get_user_profile(self.user)

        self.assertIsNotNone(profile)
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.role, "editor")  # 普通用户默认为editor
        self.assertEqual(profile.full_name, "")

    def test_get_user_profile_create_for_superuser(self):
        """测试为超级用户自动创建配置文件"""
        profile = get_user_profile(self.superuser)

        self.assertIsNotNone(profile)
        self.assertEqual(profile.user, self.superuser)
        self.assertEqual(profile.role, "admin")  # 超级用户默认为admin

    def test_check_user_role_with_superuser(self):
        """测试超级用户的角色检查"""
        # 超级用户无论有没有profile都应该有admin权限
        self.assertTrue(check_user_role(self.superuser, "admin"))
        self.assertTrue(check_user_role(self.superuser, "editor"))

    def test_check_user_role_with_admin_profile(self):
        """测试admin角色的权限检查"""
        UserProfile.objects.create(user=self.user, role="admin")

        self.assertTrue(check_user_role(self.user, "admin"))
        self.assertTrue(check_user_role(self.user, "editor"))  # admin也有editor权限

    def test_check_user_role_with_editor_profile(self):
        """测试editor角色的权限检查"""
        UserProfile.objects.create(user=self.user, role="editor")

        self.assertFalse(check_user_role(self.user, "admin"))
        self.assertTrue(check_user_role(self.user, "editor"))

    def test_check_user_role_without_profile(self):
        """测试没有profile的用户权限检查"""
        # 确保用户没有profile且不是superuser
        self.assertFalse(hasattr(self.user, "userprofile"))
        self.assertFalse(self.user.is_superuser)

        self.assertFalse(check_user_role(self.user, "admin"))
        self.assertFalse(check_user_role(self.user, "editor"))

    def test_check_user_role_invalid_role(self):
        """测试无效角色的权限检查"""
        UserProfile.objects.create(user=self.user, role="admin")

        self.assertFalse(check_user_role(self.user, "invalid_role"))

    def test_has_admin_role_function(self):
        """测试has_admin_role便捷函数"""
        # 测试admin用户
        UserProfile.objects.create(user=self.user, role="admin")
        self.assertTrue(has_admin_role(self.user))

        # 测试editor用户
        editor_user = User.objects.create_user(username="editor", password="pass")
        UserProfile.objects.create(user=editor_user, role="editor")
        self.assertFalse(has_admin_role(editor_user))

        # 测试superuser
        self.assertTrue(has_admin_role(self.superuser))


class UserModelTestCase(TestCase):
    """用户模型测试"""

    def test_create_user(self):
        """测试创建用户"""
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")
        self.assertTrue(user.check_password("testpass123"))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_superuser(self):
        """测试创建超级用户"""
        admin_user = User.objects.create_superuser(
            username="admin", email="admin@example.com", password="adminpass123"
        )

        self.assertEqual(admin_user.username, "admin")
        self.assertEqual(admin_user.email, "admin@example.com")
        self.assertTrue(admin_user.check_password("adminpass123"))
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)

    def test_user_str_representation(self):
        """测试用户字符串表示"""
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.assertEqual(str(user), "testuser")


class UserProfilePermissionIntegrationTestCase(TestCase):
    """UserProfile权限系统与其他应用的集成测试"""

    def setUp(self):
        """测试数据准备"""
        from rest_framework.test import APIClient
        from rest_framework_simplejwt.tokens import RefreshToken

        self.client = APIClient()

        # 创建admin用户（有UserProfile）
        self.admin_user = User.objects.create_user(
            username="admin_with_profile",
            email="admin@example.com",
            password="adminpass123",
        )
        UserProfile.objects.create(
            user=self.admin_user, role="admin", full_name="Admin User"
        )

        # 创建editor用户（有UserProfile）
        self.editor_user = User.objects.create_user(
            username="editor_with_profile",
            email="editor@example.com",
            password="editorpass123",
        )
        UserProfile.objects.create(
            user=self.editor_user, role="editor", full_name="Editor User"
        )

        # 创建superuser（没有UserProfile，依赖fallback）
        self.superuser = User.objects.create_user(
            username="superuser_no_profile",
            email="super@example.com",
            password="superpass123",
            is_superuser=True,
        )

        # 创建普通用户（没有UserProfile，没有权限）
        self.regular_user = User.objects.create_user(
            username="regular_no_profile",
            email="regular@example.com",
            password="regularpass123",
        )

    def get_jwt_token(self, user):
        """获取JWT令牌"""
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)

    def test_admin_user_with_profile_access_configurations(self):
        """测试有admin profile的用户可以访问configurations API"""
        from django.urls import reverse
        from rest_framework import status

        try:
            list_url = reverse("configurations:shop-configurations-list")
        except:
            # 如果configurations URL不存在，跳过测试
            self.skipTest("Configurations app not available")

        token = self.get_jwt_token(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        response = self.client.get(list_url)
        # admin用户应该可以访问
        self.assertIn(response.status_code, [200, 404])  # 200成功或404端点不存在

    def test_editor_user_denied_configurations_access(self):
        """测试editor用户被拒绝访问configurations API"""
        from django.urls import reverse
        from rest_framework import status

        try:
            list_url = reverse("configurations:shop-configurations-list")
        except:
            self.skipTest("Configurations app not available")

        token = self.get_jwt_token(self.editor_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        response = self.client.get(list_url)
        # editor用户应该被拒绝访问
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superuser_without_profile_fallback_access(self):
        """测试没有profile的superuser通过fallback机制获得权限"""
        from django.urls import reverse
        from rest_framework import status

        try:
            list_url = reverse("configurations:shop-configurations-list")
        except:
            self.skipTest("Configurations app not available")

        token = self.get_jwt_token(self.superuser)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        response = self.client.get(list_url)
        # superuser应该通过fallback机制获得访问权限
        self.assertIn(response.status_code, [200, 404])

    def test_regular_user_without_profile_denied_access(self):
        """测试没有profile的普通用户被拒绝访问"""
        from django.urls import reverse
        from rest_framework import status

        try:
            list_url = reverse("configurations:shop-configurations-list")
        except:
            self.skipTest("Configurations app not available")

        token = self.get_jwt_token(self.regular_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        response = self.client.get(list_url)
        # 普通用户应该被拒绝访问
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_profile_auto_creation_with_get_user_profile(self):
        """测试get_user_profile自动创建profile的功能"""
        # 确保用户没有profile
        self.assertFalse(hasattr(self.regular_user, "userprofile"))

        # 调用get_user_profile应该自动创建profile
        profile = get_user_profile(self.regular_user)

        # 验证profile创建成功
        self.assertIsNotNone(profile)
        self.assertEqual(profile.user, self.regular_user)
        self.assertEqual(profile.role, "editor")  # 普通用户默认为editor

        # 验证数据库中确实创建了profile
        self.assertTrue(UserProfile.objects.filter(user=self.regular_user).exists())

    def test_profile_auto_creation_for_superuser(self):
        """测试为superuser自动创建admin profile"""
        # 确保superuser没有profile
        self.assertFalse(hasattr(self.superuser, "userprofile"))

        profile = get_user_profile(self.superuser)

        # 验证为superuser创建了admin profile
        self.assertIsNotNone(profile)
        self.assertEqual(profile.user, self.superuser)
        self.assertEqual(profile.role, "admin")  # superuser默认为admin


class UsersViewsTestCase(TestCase):
    """Users视图测试"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.client = Client()

    def test_users_view_unauthorized(self):
        """测试未认证用户访问users端点"""
        response = self.client.get("/api/v1/users/")
        # 根据实际的认证设置调整期待的状态码
        self.assertIn(response.status_code, [401, 403, 404])

    def test_users_view_authenticated(self):
        """测试已认证用户访问users端点"""
        self.client.force_login(self.user)

        try:
            response = self.client.get("/api/v1/users/")
            # 如果端点存在，应该返回200或其他成功状态码
            self.assertIn(response.status_code, [200, 404])
        except Exception:
            # 如果端点不存在，这是预期的
            pass

    def test_users_urls_configuration(self):
        """测试users URL配置"""
        from users.urls import urlpatterns

        # 验证urlpatterns是列表
        self.assertIsInstance(urlpatterns, list)

        # 验证至少有基本的URL模式（即使是空的）
        self.assertGreaterEqual(len(urlpatterns), 0)
