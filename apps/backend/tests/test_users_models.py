"""
Users Models 测试
"""

import pytest
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from users.models import (
    UserProfile,
    get_user_profile,
    check_user_role,
    has_admin_role,
)


@pytest.mark.unit
class UserProfileModelTest(TestCase):
    """UserProfile模型测试"""

    def setUp(self):
        """设置测试数据"""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com", 
            password="testpass123",
            first_name="Test",
            last_name="User"
        )

    def test_create_user_profile_with_editor_role(self):
        """测试创建编辑者角色的用户配置"""
        profile = UserProfile.objects.create(
            user=self.user,
            role="editor",
            full_name="Test User"
        )

        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.role, "editor")
        self.assertEqual(profile.full_name, "Test User")
        self.assertIsNotNone(profile.created_at)
        self.assertIsNotNone(profile.updated_at)

    def test_create_user_profile_with_admin_role(self):
        """测试创建管理员角色的用户配置"""
        profile = UserProfile.objects.create(
            user=self.user,
            role="admin",
            full_name="Admin User"
        )

        self.assertEqual(profile.role, "admin")
        self.assertTrue(profile.is_admin())
        self.assertFalse(profile.is_editor())

    def test_user_profile_default_role(self):
        """测试用户配置默认角色"""
        profile = UserProfile.objects.create(user=self.user)
        
        self.assertEqual(profile.role, "editor")  # 默认角色应该是editor

    def test_user_profile_str_representation(self):
        """测试用户配置的字符串表示"""
        profile = UserProfile.objects.create(
            user=self.user,
            role="admin"
        )

        expected_str = f"{self.user.username} (admin)"
        self.assertEqual(str(profile), expected_str)

    def test_is_admin_method(self):
        """测试is_admin方法"""
        # 测试admin角色
        admin_profile = UserProfile.objects.create(
            user=self.user,
            role="admin"
        )
        self.assertTrue(admin_profile.is_admin())

        # 测试editor角色
        editor_user = User.objects.create_user(
            username="editor", password="pass"
        )
        editor_profile = UserProfile.objects.create(
            user=editor_user,
            role="editor"
        )
        self.assertFalse(editor_profile.is_admin())

    def test_is_editor_method(self):
        """测试is_editor方法"""
        # 测试editor角色
        editor_profile = UserProfile.objects.create(
            user=self.user,
            role="editor"
        )
        self.assertTrue(editor_profile.is_editor())

        # 测试admin角色
        admin_user = User.objects.create_user(
            username="admin", password="pass"
        )
        admin_profile = UserProfile.objects.create(
            user=admin_user,
            role="admin"
        )
        self.assertFalse(admin_profile.is_editor())

    def test_user_profile_one_to_one_relationship(self):
        """测试用户配置与用户的一对一关系"""
        profile = UserProfile.objects.create(user=self.user, role="editor")
        
        # 通过用户访问配置
        self.assertEqual(self.user.userprofile, profile)
        
        # 通过配置访问用户
        self.assertEqual(profile.user, self.user)

    def test_user_profile_unique_constraint(self):
        """测试用户配置的唯一约束"""
        # 创建第一个配置
        UserProfile.objects.create(user=self.user, role="editor")
        
        # 尝试为同一用户创建第二个配置应该失败
        with self.assertRaises(IntegrityError):
            UserProfile.objects.create(user=self.user, role="admin")

    def test_user_profile_cascade_delete(self):
        """测试用户删除时配置文件的级联删除"""
        profile = UserProfile.objects.create(user=self.user, role="editor")
        profile_id = profile.id
        
        # 删除用户
        self.user.delete()
        
        # 配置文件应该也被删除
        with self.assertRaises(UserProfile.DoesNotExist):
            UserProfile.objects.get(id=profile_id)

    def test_user_profile_role_choices(self):
        """测试角色选择的有效性"""
        # 有效角色
        valid_roles = ["editor", "admin"]
        for role in valid_roles:
            user = User.objects.create_user(
                username=f"user_{role}", password="pass"
            )
            profile = UserProfile.objects.create(user=user, role=role)
            self.assertEqual(profile.role, role)

    def test_user_profile_blank_full_name(self):
        """测试全名字段可以为空"""
        profile = UserProfile.objects.create(
            user=self.user,
            role="editor",
            full_name=""  # 空字符串
        )
        
        self.assertEqual(profile.full_name, "")

    def test_user_profile_meta_options(self):
        """测试模型元选项"""
        self.assertEqual(UserProfile._meta.db_table, "user_profiles")
        self.assertEqual(str(UserProfile._meta.verbose_name), "用户配置文件")


@pytest.mark.unit
class UserProfileFunctionsTest(TestCase):
    """用户配置文件相关函数测试"""

    def setUp(self):
        """设置测试数据"""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User"
        )
        self.superuser = User.objects.create_superuser(
            username="superuser",
            email="super@example.com",
            password="superpass123"
        )

    def test_get_user_profile_existing(self):
        """测试获取已存在的用户配置"""
        # 创建用户配置
        original_profile = UserProfile.objects.create(
            user=self.user,
            role="admin",
            full_name="Test Admin"
        )

        # 获取配置
        profile = get_user_profile(self.user)

        self.assertEqual(profile, original_profile)
        self.assertEqual(profile.role, "admin")
        self.assertEqual(profile.full_name, "Test Admin")

    def test_get_user_profile_create_for_regular_user(self):
        """测试为普通用户创建默认配置"""
        # 确保用户没有配置
        self.assertFalse(hasattr(self.user, 'userprofile'))

        # 获取配置（应该自动创建）
        profile = get_user_profile(self.user)

        self.assertIsNotNone(profile)
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.role, "editor")  # 普通用户默认为editor
        self.assertEqual(profile.full_name, "Test User")  # 来自first_name + last_name

    def test_get_user_profile_create_for_superuser(self):
        """测试为超级用户创建默认配置"""
        # 获取超级用户配置（应该自动创建）
        profile = get_user_profile(self.superuser)

        self.assertIsNotNone(profile)
        self.assertEqual(profile.user, self.superuser)
        self.assertEqual(profile.role, "admin")  # 超级用户默认为admin

    def test_get_user_profile_empty_full_name(self):
        """测试用户没有姓名时创建配置"""
        user_no_name = User.objects.create_user(
            username="noname",
            email="noname@example.com",
            password="pass"
        )

        profile = get_user_profile(user_no_name)

        self.assertEqual(profile.full_name, "")  # 应该是空字符串

    def test_check_user_role_superuser(self):
        """测试超级用户的角色检查"""
        # 超级用户应该始终有权限，无论要求什么角色
        self.assertTrue(check_user_role(self.superuser, "admin"))
        self.assertTrue(check_user_role(self.superuser, "editor"))

    def test_check_user_role_admin(self):
        """测试管理员角色检查"""
        UserProfile.objects.create(user=self.user, role="admin")

        # 管理员应该有admin和editor权限
        self.assertTrue(check_user_role(self.user, "admin"))
        self.assertTrue(check_user_role(self.user, "editor"))

    def test_check_user_role_editor(self):
        """测试编辑者角色检查"""
        UserProfile.objects.create(user=self.user, role="editor")

        # 编辑者只有editor权限，没有admin权限
        self.assertFalse(check_user_role(self.user, "admin"))
        self.assertTrue(check_user_role(self.user, "editor"))

    def test_check_user_role_no_profile(self):
        """测试没有配置文件的用户角色检查"""
        # 确保用户没有配置文件
        self.assertFalse(hasattr(self.user, 'userprofile'))

        # 没有配置文件的普通用户应该没有权限
        self.assertFalse(check_user_role(self.user, "admin"))
        self.assertFalse(check_user_role(self.user, "editor"))

    def test_check_user_role_invalid_role(self):
        """测试检查无效角色"""
        UserProfile.objects.create(user=self.user, role="admin")

        # 无效角色应该返回False
        self.assertFalse(check_user_role(self.user, "invalid_role"))

    def test_has_admin_role_function(self):
        """测试has_admin_role便捷函数"""
        # 管理员用户
        UserProfile.objects.create(user=self.user, role="admin")
        self.assertTrue(has_admin_role(self.user))

        # 编辑者用户
        editor_user = User.objects.create_user(
            username="editor", password="pass"
        )
        UserProfile.objects.create(user=editor_user, role="editor")
        self.assertFalse(has_admin_role(editor_user))

        # 超级用户
        self.assertTrue(has_admin_role(self.superuser))

    def test_check_user_role_default_parameter(self):
        """测试check_user_role默认参数"""
        UserProfile.objects.create(user=self.user, role="admin")

        # 不指定required_role应该默认检查admin权限
        self.assertTrue(check_user_role(self.user))

        editor_user = User.objects.create_user(
            username="editor", password="pass"
        )
        UserProfile.objects.create(user=editor_user, role="editor")
        self.assertFalse(check_user_role(editor_user))


@pytest.mark.integration
class UserProfileIntegrationTest(TestCase):
    """用户配置文件集成测试"""

    def test_user_profile_workflow(self):
        """测试完整的用户配置工作流"""
        # 1. 创建用户
        user = User.objects.create_user(
            username="workflow_user",
            email="workflow@example.com",
            password="pass123",
            first_name="Workflow",
            last_name="User"
        )

        # 2. 获取配置（应该自动创建）
        profile = get_user_profile(user)
        self.assertEqual(profile.role, "editor")
        self.assertEqual(profile.full_name, "Workflow User")

        # 3. 检查权限
        self.assertTrue(check_user_role(user, "editor"))
        self.assertFalse(check_user_role(user, "admin"))

        # 4. 升级为管理员
        profile.role = "admin"
        profile.save()

        # 5. 重新检查权限
        self.assertTrue(check_user_role(user, "admin"))
        self.assertTrue(check_user_role(user, "editor"))  # admin也有editor权限
        self.assertTrue(has_admin_role(user))

    def test_multiple_users_different_roles(self):
        """测试多个用户不同角色的场景"""
        # 创建不同角色的用户
        admin_user = User.objects.create_user(username="admin", password="pass")
        editor_user = User.objects.create_user(username="editor", password="pass")
        superuser = User.objects.create_superuser(username="super", password="pass")

        # 创建配置
        UserProfile.objects.create(user=admin_user, role="admin")
        UserProfile.objects.create(user=editor_user, role="editor")

        # 验证权限
        users_permissions = [
            (admin_user, True, True),   # admin: admin权限=True, editor权限=True
            (editor_user, False, True), # editor: admin权限=False, editor权限=True
            (superuser, True, True),    # superuser: 所有权限=True
        ]

        for user, expected_admin, expected_editor in users_permissions:
            with self.subTest(user=user.username):
                self.assertEqual(check_user_role(user, "admin"), expected_admin)
                self.assertEqual(check_user_role(user, "editor"), expected_editor)
                self.assertEqual(has_admin_role(user), expected_admin) 