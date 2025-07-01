import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from uuid import uuid4

from ..models import PageTemplate
from users.models import UserProfile

User = get_user_model()


class PageTemplateModelTest(TestCase):
    """PageTemplate模型测试"""

    def setUp(self):
        """设置测试数据"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass"
        )
        UserProfile.objects.create(user=self.user, role="editor")

        self.admin_user = User.objects.create_user(
            username="admin", email="admin@example.com", password="adminpass"
        )
        UserProfile.objects.create(user=self.admin_user, role="admin")

        self.valid_content = [
            {"id": "module-1", "type": "title", "content": "测试标题"},
            {"id": "module-2", "type": "text", "content": "测试文本内容"},
        ]

    def test_create_valid_page_template(self):
        """测试创建有效的PageTemplate"""
        page = PageTemplate.objects.create(
            name="测试页面",
            content=self.valid_content,
            target_area="pc",
            owner=self.user,
        )

        self.assertEqual(page.name, "测试页面")
        self.assertEqual(page.content, self.valid_content)
        self.assertEqual(page.target_area, "pc")
        self.assertEqual(page.owner, self.user)
        self.assertIsNotNone(page.id)
        self.assertIsNotNone(page.created_at)
        self.assertIsNotNone(page.updated_at)

    def test_page_template_str_method(self):
        """测试PageTemplate的__str__方法"""
        page = PageTemplate.objects.create(
            name="测试页面",
            content=self.valid_content,
            target_area="pc",
            owner=self.user,
        )

        expected_str = f"测试页面 ({self.user.username})"
        self.assertEqual(str(page), expected_str)

    def test_module_count_property(self):
        """测试module_count属性"""
        page = PageTemplate.objects.create(
            name="测试页面",
            content=self.valid_content,
            target_area="pc",
            owner=self.user,
        )

        self.assertEqual(page.module_count, 2)

        # 测试空内容
        page.content = []
        page.save()
        self.assertEqual(page.module_count, 0)

    def test_get_modules_by_type(self):
        """测试get_modules_by_type方法"""
        page = PageTemplate.objects.create(
            name="测试页面",
            content=self.valid_content,
            target_area="pc",
            owner=self.user,
        )

        title_modules = page.get_modules_by_type("title")
        self.assertEqual(len(title_modules), 1)
        self.assertEqual(title_modules[0]["id"], "module-1")

        text_modules = page.get_modules_by_type("text")
        self.assertEqual(len(text_modules), 1)
        self.assertEqual(text_modules[0]["id"], "module-2")

        image_modules = page.get_modules_by_type("image")
        self.assertEqual(len(image_modules), 0)

    def test_name_validation(self):
        """测试name字段验证"""
        # 测试空名称
        with self.assertRaises(ValidationError):
            page = PageTemplate(
                name="", content=self.valid_content, target_area="pc", owner=self.user
            )
            page.full_clean()

        # 测试只有空格的名称
        with self.assertRaises(ValidationError):
            page = PageTemplate(
                name="   ",
                content=self.valid_content,
                target_area="pc",
                owner=self.user,
            )
            page.full_clean()

    def test_target_area_validation(self):
        """测试target_area字段验证"""
        # 测试空target_area
        with self.assertRaises(ValidationError):
            page = PageTemplate(
                name="测试页面",
                content=self.valid_content,
                target_area="",
                owner=self.user,
            )
            page.full_clean()

    def test_content_validation(self):
        """测试content字段验证"""
        # 测试非数组content
        with self.assertRaises(ValidationError):
            page = PageTemplate(
                name="测试页面",
                content={"invalid": "content"},
                target_area="pc",
                owner=self.user,
            )
            page.full_clean()

        # 测试模块缺少id字段
        invalid_content = [{"type": "title", "content": "测试标题"}]
        with self.assertRaises(ValidationError):
            page = PageTemplate(
                name="测试页面",
                content=invalid_content,
                target_area="pc",
                owner=self.user,
            )
            page.full_clean()

        # 测试模块缺少type字段
        invalid_content = [{"id": "module-1", "content": "测试标题"}]
        with self.assertRaises(ValidationError):
            page = PageTemplate(
                name="测试页面",
                content=invalid_content,
                target_area="pc",
                owner=self.user,
            )
            page.full_clean()

    def test_content_module_validation(self):
        """测试content中模块的详细验证"""
        # 测试模块不是字典格式
        invalid_content = ["invalid_module"]
        with self.assertRaises(ValidationError):
            page = PageTemplate(
                name="测试页面",
                content=invalid_content,
                target_area="pc",
                owner=self.user,
            )
            page.full_clean()

    def test_owner_relationship(self):
        """测试owner外键关系"""
        page = PageTemplate.objects.create(
            name="测试页面",
            content=self.valid_content,
            target_area="pc",
            owner=self.user,
        )

        # 测试反向关系
        user_pages = self.user.page_templates.all()
        self.assertIn(page, user_pages)

        # 测试级联删除
        user_id = self.user.id
        self.user.delete()

        # 页面应该被级联删除
        with self.assertRaises(PageTemplate.DoesNotExist):
            PageTemplate.objects.get(owner_id=user_id)

    def test_ordering(self):
        """测试模型排序"""
        # 创建多个页面
        page1 = PageTemplate.objects.create(
            name="页面1", content=self.valid_content, target_area="pc", owner=self.user
        )

        page2 = PageTemplate.objects.create(
            name="页面2", content=self.valid_content, target_area="pc", owner=self.user
        )

        # 获取所有页面
        pages = list(PageTemplate.objects.all())

        # 应该按照updated_at降序排列
        self.assertTrue(pages[0].updated_at >= pages[1].updated_at)

    def test_db_table_name(self):
        """测试数据库表名"""
        self.assertEqual(PageTemplate._meta.db_table, "pages_pagetemplate")

    def test_verbose_names(self):
        """测试verbose_name设置"""
        self.assertEqual(PageTemplate._meta.verbose_name, "页面模板")
        self.assertEqual(PageTemplate._meta.verbose_name_plural, "页面模板")

    def test_uuid_primary_key(self):
        """测试UUID主键"""
        page = PageTemplate.objects.create(
            name="测试页面",
            content=self.valid_content,
            target_area="pc",
            owner=self.user,
        )

        # 检查ID是否为UUID格式
        self.assertIsInstance(page.id, type(uuid4()))

        # 检查ID是否唯一
        page2 = PageTemplate.objects.create(
            name="测试页面2",
            content=self.valid_content,
            target_area="pc",
            owner=self.user,
        )

        self.assertNotEqual(page.id, page2.id)

    def test_auto_timestamps(self):
        """测试自动时间戳"""
        page = PageTemplate.objects.create(
            name="测试页面",
            content=self.valid_content,
            target_area="pc",
            owner=self.user,
        )

        original_created_at = page.created_at
        original_updated_at = page.updated_at

        # 更新页面
        page.name = "更新后的页面"
        page.save()

        # created_at应该不变，updated_at应该更新
        self.assertEqual(page.created_at, original_created_at)
        self.assertGreater(page.updated_at, original_updated_at)
