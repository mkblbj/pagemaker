"""
PageTemplate Serializers扩展测试
测试所有序列化器的验证方法和功能
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.test import APIRequestFactory
from rest_framework import serializers
from unittest.mock import Mock, patch

from pages.models import PageTemplate
from pages.serializers import (
    PageTemplateSerializer,
    CreatePageTemplateSerializer,
    UpdatePageTemplateSerializer,
    PageTemplateListSerializer,
)
from users.models import UserProfile

User = get_user_model()


class PageTemplateSerializerTests(TestCase):
    """PageTemplateSerializer测试"""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="pass"
        )
        UserProfile.objects.create(user=self.user, role="editor", full_name="Test User")

        self.page = PageTemplate.objects.create(
            name="Test Page",
            content=[{"id": "1", "type": "title", "text": "Hello"}],
            target_area="pc",
            owner=self.user,
        )

    def get_request_context(self):
        """获取带用户的请求上下文"""
        request = self.factory.get("/")
        request.user = self.user
        return {"request": request}

    def test_validate_name_valid(self):
        """测试有效的名称验证"""
        serializer = PageTemplateSerializer()
        result = serializer.validate_name("Valid Name")
        self.assertEqual(result, "Valid Name")

    def test_validate_name_empty(self):
        """测试空名称验证"""
        serializer = PageTemplateSerializer()
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.validate_name("")
        self.assertIn("页面名称不能为空", str(cm.exception))

    def test_validate_name_whitespace_only(self):
        """测试只有空白字符的名称"""
        serializer = PageTemplateSerializer()
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.validate_name("   ")
        self.assertIn("页面名称不能为空", str(cm.exception))

    def test_validate_name_too_short(self):
        """测试名称太短"""
        serializer = PageTemplateSerializer()
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.validate_name("A")
        self.assertIn("页面名称至少需要2个字符", str(cm.exception))

    def test_validate_name_strip_whitespace(self):
        """测试名称去除空白字符"""
        serializer = PageTemplateSerializer()
        result = serializer.validate_name("  Valid Name  ")
        self.assertEqual(result, "Valid Name")

    def test_validate_target_area_valid(self):
        """测试有效的目标区域验证"""
        serializer = PageTemplateSerializer()
        result = serializer.validate_target_area("pc")
        self.assertEqual(result, "pc")

    def test_validate_target_area_empty(self):
        """测试空目标区域"""
        serializer = PageTemplateSerializer()
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.validate_target_area("")
        self.assertIn("目标区域不能为空", str(cm.exception))

    def test_validate_target_area_invalid(self):
        """测试无效的目标区域"""
        serializer = PageTemplateSerializer()
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.validate_target_area("invalid")
        self.assertIn("目标区域必须是以下之一", str(cm.exception))

    def test_validate_target_area_case_insensitive(self):
        """测试目标区域大小写不敏感"""
        serializer = PageTemplateSerializer()
        result = serializer.validate_target_area("PC")
        self.assertEqual(result, "pc")

    def test_validate_content_valid(self):
        """测试有效的内容验证"""
        serializer = PageTemplateSerializer()
        content = [{"id": "1", "type": "title", "text": "Hello"}]
        result = serializer.validate_content(content)
        self.assertEqual(result, content)

    def test_validate_content_not_list(self):
        """测试内容不是列表"""
        serializer = PageTemplateSerializer()
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.validate_content("not a list")
        self.assertIn("Content必须是数组格式", str(cm.exception))

    def test_validate_content_module_not_dict(self):
        """测试模块不是字典"""
        serializer = PageTemplateSerializer()
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.validate_content(["not a dict"])
        self.assertIn("模块 0 必须是对象格式", str(cm.exception))

    def test_validate_content_missing_id(self):
        """测试模块缺少id字段"""
        serializer = PageTemplateSerializer()
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.validate_content([{"type": "title"}])
        self.assertIn("模块 0 缺少id字段", str(cm.exception))

    def test_validate_content_missing_type(self):
        """测试模块缺少type字段"""
        serializer = PageTemplateSerializer()
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.validate_content([{"id": "1"}])
        self.assertIn("模块 0 缺少type字段", str(cm.exception))

    def test_validate_content_invalid_id(self):
        """测试无效的模块id"""
        serializer = PageTemplateSerializer()
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.validate_content([{"id": "", "type": "title"}])
        self.assertIn("模块 0 的id必须是非空字符串", str(cm.exception))

    def test_validate_content_invalid_type(self):
        """测试无效的模块类型"""
        serializer = PageTemplateSerializer()
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.validate_content([{"id": "1", "type": "invalid"}])
        self.assertIn("模块 0 的type 'invalid' 无效", str(cm.exception))

    def test_validate_content_all_valid_types(self):
        """测试所有有效的模块类型"""
        serializer = PageTemplateSerializer()
        valid_types = ["title", "text", "image", "separator", "keyValue", "multiColumn"]

        for module_type in valid_types:
            content = [{"id": "1", "type": module_type}]
            result = serializer.validate_content(content)
            self.assertEqual(result, content)

    def test_validate_duplicate_module_ids(self):
        """测试重复的模块ID"""
        serializer = PageTemplateSerializer()
        data = {
            "content": [
                {"id": "1", "type": "title"},
                {"id": "1", "type": "text"},  # 重复ID
            ]
        }
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.validate(data)
        self.assertIn("模块ID不能重复", str(cm.exception))

    def test_validate_unique_module_ids(self):
        """测试唯一的模块ID"""
        serializer = PageTemplateSerializer()
        data = {
            "content": [
                {"id": "1", "type": "title"},
                {"id": "2", "type": "text"},
            ]
        }
        result = serializer.validate(data)
        self.assertEqual(result, data)

    @patch("pages.serializers.PageTemplateRepository.create_page")
    def test_create_success(self, mock_create):
        """测试成功创建页面"""
        mock_create.return_value = self.page

        serializer = PageTemplateSerializer(context=self.get_request_context())
        data = {
            "name": "New Page",
            "content": [{"id": "1", "type": "title"}],
            "target_area": "pc",
        }

        result = serializer.create(data)
        self.assertEqual(result, self.page)
        mock_create.assert_called_once()

    def test_create_no_request(self):
        """测试创建时没有请求上下文"""
        serializer = PageTemplateSerializer()
        data = {
            "name": "New Page",
            "content": [{"id": "1", "type": "title"}],
            "target_area": "pc",
        }

        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.create(data)
        self.assertIn("无法获取当前用户信息", str(cm.exception))

    @patch("pages.serializers.PageTemplateRepository.create_page")
    def test_create_django_validation_error(self, mock_create):
        """测试创建时Django验证错误"""
        mock_create.side_effect = DjangoValidationError("Django error")

        serializer = PageTemplateSerializer(context=self.get_request_context())
        data = {
            "name": "New Page",
            "content": [{"id": "1", "type": "title"}],
            "target_area": "pc",
        }

        with self.assertRaises(serializers.ValidationError):
            serializer.create(data)

    @patch("pages.serializers.PageTemplateRepository.update_page")
    def test_update_success(self, mock_update):
        """测试成功更新页面"""
        mock_update.return_value = self.page

        serializer = PageTemplateSerializer(context=self.get_request_context())
        data = {"name": "Updated Name"}

        result = serializer.update(self.page, data)
        self.assertEqual(result, self.page)
        mock_update.assert_called_once()

    @patch("pages.serializers.PageTemplateRepository.update_page")
    def test_update_not_found(self, mock_update):
        """测试更新不存在的页面"""
        mock_update.return_value = None

        serializer = PageTemplateSerializer(context=self.get_request_context())
        data = {"name": "Updated Name"}

        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.update(self.page, data)
        self.assertIn("页面不存在或无权限访问", str(cm.exception))

    def test_update_no_request(self):
        """测试更新时没有请求上下文"""
        serializer = PageTemplateSerializer()
        data = {"name": "Updated Name"}

        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.update(self.page, data)
        self.assertIn("无法获取当前用户信息", str(cm.exception))

    def test_to_representation(self):
        """测试序列化输出"""
        serializer = PageTemplateSerializer()
        data = serializer.to_representation(self.page)

        self.assertIn("created_at", data)
        self.assertIn("updated_at", data)
        self.assertIn("module_count", data)
        self.assertEqual(data["module_count"], self.page.module_count)


class CreatePageTemplateSerializerTests(TestCase):
    """CreatePageTemplateSerializer测试"""

    def test_required_fields(self):
        """测试创建时必需字段"""
        serializer = CreatePageTemplateSerializer()

        self.assertTrue(serializer.fields["name"].required)
        self.assertTrue(serializer.fields["target_area"].required)
        self.assertTrue(serializer.fields["content"].required)


class UpdatePageTemplateSerializerTests(TestCase):
    """UpdatePageTemplateSerializer测试"""

    def test_optional_fields(self):
        """测试更新时可选字段"""
        serializer = UpdatePageTemplateSerializer()

        self.assertFalse(serializer.fields["name"].required)
        self.assertFalse(serializer.fields["target_area"].required)
        self.assertFalse(serializer.fields["content"].required)


class PageTemplateListSerializerTests(TestCase):
    """PageTemplateListSerializer测试"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="pass"
        )
        UserProfile.objects.create(user=self.user, role="editor", full_name="Test User")

        self.page = PageTemplate.objects.create(
            name="Test Page",
            content=[{"id": "1", "type": "title"}],
            target_area="pc",
            owner=self.user,
        )

    def test_serialization(self):
        """测试列表序列化器的输出"""
        serializer = PageTemplateListSerializer(self.page)
        data = serializer.data

        expected_fields = [
            "id",
            "name",
            "target_area",
            "owner_id",
            "owner_username",
            "created_at",
            "updated_at",
            "module_count",
        ]

        for field in expected_fields:
            self.assertIn(field, data)

        self.assertEqual(data["name"], "Test Page")
        self.assertEqual(data["target_area"], "pc")
        self.assertEqual(data["owner_username"], "testuser")

    def test_to_representation(self):
        """测试自定义序列化输出"""
        serializer = PageTemplateListSerializer()
        data = serializer.to_representation(self.page)

        self.assertIn("created_at", data)
        self.assertIn("updated_at", data)
        # 验证时间格式是ISO格式
        self.assertIsInstance(data["created_at"], str)
        self.assertIsInstance(data["updated_at"], str)
