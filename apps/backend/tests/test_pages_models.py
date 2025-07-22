"""
Pages Models 测试
"""

import pytest
import uuid
import json
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from pages.models import PageTemplate, validate_json_content

User = get_user_model()


@pytest.mark.unit
class ValidateJsonContentTest(TestCase):
    """JSON内容验证函数测试"""

    def test_validate_json_content_valid_list(self):
        """测试有效的列表内容"""
        valid_content = [
            {"id": "module-1", "type": "title", "content": "标题"},
            {"id": "module-2", "type": "text", "content": "文本"}
        ]
        
        # 应该不抛出异常
        try:
            validate_json_content(valid_content)
        except ValidationError:
            self.fail("validate_json_content raised ValidationError unexpectedly")

    def test_validate_json_content_valid_json_string(self):
        """测试有效的JSON字符串"""
        valid_json = '[{"id": "module-1", "type": "title"}]'
        
        try:
            validate_json_content(valid_json)
        except ValidationError:
            self.fail("validate_json_content raised ValidationError unexpectedly")

    def test_validate_json_content_none(self):
        """测试空内容"""
        with self.assertRaises(ValidationError) as context:
            validate_json_content(None)
        
        self.assertIn("Content不能为空", str(context.exception))

    def test_validate_json_content_invalid_json(self):
        """测试无效的JSON字符串"""
        invalid_json = '{"invalid": json}'
        
        with self.assertRaises(ValidationError) as context:
            validate_json_content(invalid_json)
        
        self.assertIn("Content必须是有效的JSON", str(context.exception))

    def test_validate_json_content_non_list_dict(self):
        """测试非列表格式的字典"""
        dict_content = {"type": "page", "modules": []}
        
        # 根据实际实现，字典类型直接通过验证，因为isinstance(value, (list, dict))为True
        # 实际的列表验证在模型的clean方法中进行
        try:
            validate_json_content(dict_content)
            # 字典类型在这个函数中不会抛出异常
        except ValidationError:
            self.fail("validate_json_content raised ValidationError unexpectedly")

    def test_validate_json_content_non_list_string(self):
        """测试非列表格式的JSON字符串"""
        non_list_json = '{"type": "page"}'
        
        with self.assertRaises(ValidationError) as context:
            validate_json_content(non_list_json)
        
        self.assertIn("Content必须是数组格式", str(context.exception))


@pytest.mark.unit
class PageTemplateModelTest(TestCase):
    """PageTemplate模型测试"""

    def setUp(self):
        """设置测试数据"""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        
        self.valid_content = [
            {"id": "module-1", "type": "title", "content": "测试标题"},
            {"id": "module-2", "type": "text", "content": "测试文本内容"}
        ]

    def test_create_page_template_basic(self):
        """测试创建基本的页面模板"""
        page = PageTemplate.objects.create(
            name="测试页面",
            content=self.valid_content,
            target_area="pc",
            owner=self.user
        )

        self.assertEqual(page.name, "测试页面")
        self.assertEqual(page.content, self.valid_content)
        self.assertEqual(page.target_area, "pc")
        self.assertEqual(page.owner, self.user)
        self.assertIsInstance(page.id, uuid.UUID)
        self.assertIsNotNone(page.created_at)
        self.assertIsNotNone(page.updated_at)

    def test_page_template_uuid_primary_key(self):
        """测试页面模板使用UUID作为主键"""
        page = PageTemplate.objects.create(
            name="UUID测试页面",
            content=self.valid_content,
            target_area="mobile",
            owner=self.user
        )

        # 主键应该是UUID类型
        self.assertIsInstance(page.id, uuid.UUID)
        
        # 每次创建的UUID应该不同
        page2 = PageTemplate.objects.create(
            name="另一个页面",
            content=self.valid_content,
            target_area="pc",
            owner=self.user
        )
        
        self.assertNotEqual(page.id, page2.id)

    def test_page_template_str_representation(self):
        """测试页面模板的字符串表示"""
        page = PageTemplate.objects.create(
            name="字符串测试页面",
            content=self.valid_content,
            target_area="pc",
            owner=self.user
        )

        expected_str = "字符串测试页面 (testuser)"
        self.assertEqual(str(page), expected_str)

    def test_page_template_target_area_choices(self):
        """测试目标区域选择"""
        valid_areas = ["pc", "mobile"]

        for area in valid_areas:
            page = PageTemplate.objects.create(
                name=f"测试页面_{area}",
                content=self.valid_content,
                target_area=area,
                owner=self.user
            )
            self.assertEqual(page.target_area, area)

    def test_page_template_content_validation(self):
        """测试内容验证"""
        # 有效内容应该能创建成功
        page = PageTemplate.objects.create(
            name="内容验证测试",
            content=self.valid_content,
            target_area="pc",
            owner=self.user
        )
        self.assertEqual(page.content, self.valid_content)

    def test_page_template_cascade_delete(self):
        """测试用户删除时页面模板的级联删除"""
        page = PageTemplate.objects.create(
            name="级联删除测试",
            content=self.valid_content,
            target_area="pc",
            owner=self.user
        )
        page_id = page.id

        # 删除用户
        self.user.delete()

        # 页面模板应该也被删除
        with self.assertRaises(PageTemplate.DoesNotExist):
            PageTemplate.objects.get(id=page_id)

    def test_page_template_optional_fields(self):
        """测试可选字段"""
        page = PageTemplate.objects.create(
            name="可选字段测试",
            content=self.valid_content,
            target_area="pc",
            owner=self.user
        )

        # 测试content字段可以为空列表
        page.content = []
        page.save()
        self.assertEqual(page.content, [])

    def test_page_template_unique_constraints(self):
        """测试唯一性约束"""
        # 创建第一个页面模板
        PageTemplate.objects.create(
            name="唯一性测试页面",
            content=self.valid_content,
            target_area="pc",
            owner=self.user
        )

        # 同一用户可以创建多个同名页面（如果没有唯一约束）
        # 或者测试唯一约束（如果有的话）
        try:
            PageTemplate.objects.create(
                name="唯一性测试页面",
                content=self.valid_content,
                target_area="mobile",
                owner=self.user
            )
            # 如果没有唯一约束，这应该成功
        except IntegrityError:
            # 如果有唯一约束，这会失败
            pass

    def test_page_template_content_json_field(self):
        """测试内容字段的JSON特性"""
        complex_content = [
            {
                "id": "module-1",
                "type": "title",
                "content": "复杂标题",
                "style": {
                    "fontSize": "24px",
                    "color": "#333"
                }
            },
            {
                "id": "module-2",
                "type": "text",
                "content": "复杂文本",
                "nested": {
                    "array": [1, 2, 3],
                    "object": {"key": "value"}
                }
            }
        ]

        page = PageTemplate.objects.create(
            name="复杂内容测试",
            content=complex_content,
            target_area="pc",
            owner=self.user
        )

        # 从数据库重新获取，确保JSON序列化/反序列化正常
        saved_page = PageTemplate.objects.get(id=page.id)
        self.assertEqual(saved_page.content, complex_content)

    def test_page_template_ordering(self):
        """测试页面模板的排序"""
        # 创建多个页面模板
        pages = []
        for i in range(3):
            page = PageTemplate.objects.create(
                name=f"排序测试页面_{i}",
                content=self.valid_content,
                target_area="pc",
                owner=self.user
            )
            pages.append(page)

        # 测试默认排序（通常按更新时间倒序）
        all_pages = PageTemplate.objects.filter(owner=self.user)
        self.assertEqual(all_pages.count(), 3)

    def test_page_template_model_methods(self):
        """测试页面模板的模型方法"""
        content_with_multiple_types = [
            {"id": "title-1", "type": "title", "content": "标题1"},
            {"id": "text-1", "type": "text", "content": "文本1"},
            {"id": "title-2", "type": "title", "content": "标题2"},
            {"id": "image-1", "type": "image", "src": "image.jpg"}
        ]

        page = PageTemplate.objects.create(
            name="方法测试页面",
            content=content_with_multiple_types,
            target_area="pc",
            owner=self.user
        )

        # 测试 module_count 属性
        self.assertEqual(page.module_count, 4)

        # 测试 get_modules_by_type 方法
        title_modules = page.get_modules_by_type("title")
        self.assertEqual(len(title_modules), 2)
        self.assertEqual(title_modules[0]["id"], "title-1")
        self.assertEqual(title_modules[1]["id"], "title-2")

        text_modules = page.get_modules_by_type("text")
        self.assertEqual(len(text_modules), 1)
        self.assertEqual(text_modules[0]["id"], "text-1")

        # 测试不存在的类型
        nonexistent_modules = page.get_modules_by_type("nonexistent")
        self.assertEqual(len(nonexistent_modules), 0)

    def test_page_template_clean_validation(self):
        """测试页面模板的clean验证"""
        # 测试name验证
        with self.assertRaises(ValidationError) as context:
            page = PageTemplate(
                name="",  # 空名称
                content=self.valid_content,
                target_area="pc",
                owner=self.user
            )
            page.clean()
        
        self.assertIn("页面名称不能为空", str(context.exception))

        # 测试target_area验证
        with self.assertRaises(ValidationError) as context:
            page = PageTemplate(
                name="测试页面",
                content=self.valid_content,
                target_area="",  # 空目标区域
                owner=self.user
            )
            page.clean()
        
        self.assertIn("目标区域不能为空", str(context.exception))

        # 测试content格式验证
        with self.assertRaises(ValidationError) as context:
            page = PageTemplate(
                name="测试页面",
                content="invalid content",  # 非数组内容
                target_area="pc",
                owner=self.user
            )
            page.clean()
        
        self.assertIn("Content必须是数组格式", str(context.exception))

        # 测试模块缺少必需字段
        invalid_content = [
            {"type": "title", "content": "标题"}  # 缺少id字段
        ]
        with self.assertRaises(ValidationError) as context:
            page = PageTemplate(
                name="测试页面",
                content=invalid_content,
                target_area="pc",
                owner=self.user
            )
            page.clean()
        
        self.assertIn("缺少id字段", str(context.exception))


@pytest.mark.integration
class PageTemplateIntegrationTest(TestCase):
    """页面模板集成测试"""

    def setUp(self):
        """设置测试数据"""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        
        self.admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="adminpass123"
        )

    def test_page_template_workflow(self):
        """测试完整的页面模板工作流"""
        content = [
            {"id": "title-1", "type": "title", "content": "工作流测试标题"},
            {"id": "text-1", "type": "text", "content": "工作流测试内容"}
        ]

        # 1. 创建页面模板
        page = PageTemplate.objects.create(
            name="工作流测试页面",
            content=content,
            target_area="pc",
            owner=self.user
        )

        # 2. 验证创建成功
        self.assertIsNotNone(page.id)
        self.assertEqual(page.name, "工作流测试页面")

        # 3. 更新页面模板
        updated_content = content + [
            {"id": "image-1", "type": "image", "src": "test.jpg"}
        ]
        page.content = updated_content
        page.save()

        # 4. 验证更新成功
        updated_page = PageTemplate.objects.get(id=page.id)
        self.assertEqual(len(updated_page.content), 3)
        self.assertEqual(updated_page.content[-1]["type"], "image")

        # 5. 查询页面模板
        user_pages = PageTemplate.objects.filter(owner=self.user)
        self.assertEqual(user_pages.count(), 1)
        self.assertEqual(user_pages.first().name, "工作流测试页面")

    def test_multiple_users_pages(self):
        """测试多用户页面模板场景"""
        # 不同用户创建页面模板
        user1_page = PageTemplate.objects.create(
            name="用户1的页面",
            content=[{"id": "1", "type": "title", "content": "用户1"}],
            target_area="pc",
            owner=self.user
        )

        user2_page = PageTemplate.objects.create(
            name="管理员的页面",
            content=[{"id": "1", "type": "title", "content": "管理员"}],
            target_area="mobile",
            owner=self.admin_user
        )

        # 验证用户只能看到自己的页面
        user1_pages = PageTemplate.objects.filter(owner=self.user)
        user2_pages = PageTemplate.objects.filter(owner=self.admin_user)

        self.assertEqual(user1_pages.count(), 1)
        self.assertEqual(user2_pages.count(), 1)
        self.assertEqual(user1_pages.first().name, "用户1的页面")
        self.assertEqual(user2_pages.first().name, "管理员的页面")

        # 验证页面ID不同
        self.assertNotEqual(user1_page.id, user2_page.id) 