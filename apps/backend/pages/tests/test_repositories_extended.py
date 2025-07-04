"""
PageTemplate Repository扩展测试
测试所有未覆盖的repository方法
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

from pages.models import PageTemplate
from pages.repositories import PageTemplateRepository
from users.models import UserProfile

User = get_user_model()


class PageTemplateRepositoryExtendedTests(TestCase):
    """PageTemplate Repository扩展测试"""

    def setUp(self):
        """测试数据准备"""
        # 创建admin用户
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@test.com",
            password="adminpass",
            is_superuser=True,
        )
        UserProfile.objects.create(
            user=self.admin_user, role="admin", full_name="Admin User"
        )

        # 创建editor用户
        self.editor_user = User.objects.create_user(
            username="editor", email="editor@test.com", password="editorpass"
        )
        UserProfile.objects.create(
            user=self.editor_user, role="editor", full_name="Editor User"
        )

        # 创建另一个editor用户
        self.other_editor = User.objects.create_user(
            username="other", email="other@test.com", password="otherpass"
        )
        UserProfile.objects.create(
            user=self.other_editor, role="editor", full_name="Other Editor"
        )

        # 创建测试页面
        self.page1 = PageTemplate.objects.create(
            name="Test Page 1",
            content=[{"id": "1", "type": "title", "text": "Hello"}],
            target_area="area1",
            owner=self.editor_user,
        )

        self.page2 = PageTemplate.objects.create(
            name="Test Page 2",
            content=[{"id": "2", "type": "text", "content": "World"}],
            target_area="area2",
            owner=self.other_editor,
        )

        self.page3 = PageTemplate.objects.create(
            name="Search Test Page",
            content=[],
            target_area="area1",
            owner=self.editor_user,
        )

    def test_get_pages_by_target_area_admin(self):
        """测试管理员按target_area获取页面"""
        pages = PageTemplateRepository.get_pages_by_target_area(
            "area1", self.admin_user
        )
        self.assertEqual(pages.count(), 2)  # page1 和 page3

    def test_get_pages_by_target_area_editor(self):
        """测试编辑者按target_area获取页面"""
        pages = PageTemplateRepository.get_pages_by_target_area(
            "area1", self.editor_user
        )
        self.assertEqual(pages.count(), 2)  # 只能看到自己的页面

    def test_get_pages_by_target_area_other_editor(self):
        """测试其他编辑者按target_area获取页面"""
        pages = PageTemplateRepository.get_pages_by_target_area(
            "area1", self.other_editor
        )
        self.assertEqual(pages.count(), 0)  # 看不到其他人的页面

    def test_get_pages_by_target_area_no_user(self):
        """测试无用户时按target_area获取页面"""
        pages = PageTemplateRepository.get_pages_by_target_area("area1")
        self.assertEqual(pages.count(), 2)  # 无权限控制时返回所有

    def test_search_pages_admin(self):
        """测试管理员搜索页面"""
        pages = PageTemplateRepository.search_pages("Test", self.admin_user)
        self.assertEqual(pages.count(), 3)  # 可以搜索到所有页面

    def test_search_pages_editor(self):
        """测试编辑者搜索页面"""
        pages = PageTemplateRepository.search_pages("Test", self.editor_user)
        self.assertEqual(pages.count(), 2)  # 只能搜索到自己的页面

    def test_search_pages_other_editor(self):
        """测试其他编辑者搜索页面"""
        pages = PageTemplateRepository.search_pages("Test", self.other_editor)
        self.assertEqual(pages.count(), 1)  # 只能搜索到自己的页面

    def test_search_pages_empty_query(self):
        """测试空搜索查询"""
        pages = PageTemplateRepository.search_pages("", self.admin_user)
        # 空查询会匹配所有页面名称（因为空字符串包含在任何字符串中）
        self.assertEqual(pages.count(), 3)  # 应该返回所有页面

    def test_search_pages_no_results(self):
        """测试搜索无结果"""
        pages = PageTemplateRepository.search_pages("NonExistent", self.admin_user)
        self.assertEqual(pages.count(), 0)

    def test_get_user_page_count_admin(self):
        """测试管理员获取页面数量"""
        count = PageTemplateRepository.get_user_page_count(self.admin_user)
        self.assertEqual(count, 3)  # 管理员可以看到所有页面

    def test_get_user_page_count_editor(self):
        """测试编辑者获取页面数量"""
        count = PageTemplateRepository.get_user_page_count(self.editor_user)
        self.assertEqual(count, 2)  # 编辑者只能看到自己的页面

    def test_get_user_page_count_other_editor(self):
        """测试其他编辑者获取页面数量"""
        count = PageTemplateRepository.get_user_page_count(self.other_editor)
        self.assertEqual(count, 1)  # 只有一个页面

    def test_duplicate_page_success(self):
        """测试成功复制页面"""
        new_page = PageTemplateRepository.duplicate_page(
            str(self.page1.id), "Duplicated Page", self.editor_user
        )

        self.assertIsNotNone(new_page)
        self.assertEqual(new_page.name, "Duplicated Page")
        self.assertEqual(new_page.content, self.page1.content)
        self.assertEqual(new_page.target_area, self.page1.target_area)
        self.assertEqual(new_page.owner, self.editor_user)
        self.assertNotEqual(new_page.id, self.page1.id)

    def test_duplicate_page_not_found(self):
        """测试复制不存在的页面"""
        new_page = PageTemplateRepository.duplicate_page(
            "nonexistent-id", "Duplicated Page", self.editor_user
        )
        self.assertIsNone(new_page)

    def test_duplicate_page_no_permission(self):
        """测试复制无权限的页面"""
        new_page = PageTemplateRepository.duplicate_page(
            str(self.page2.id), "Duplicated Page", self.editor_user
        )
        self.assertIsNone(new_page)  # editor_user无权访问page2

    def test_duplicate_page_admin_access(self):
        """测试管理员复制任何页面"""
        new_page = PageTemplateRepository.duplicate_page(
            str(self.page2.id), "Admin Duplicated Page", self.admin_user
        )

        self.assertIsNotNone(new_page)
        self.assertEqual(new_page.name, "Admin Duplicated Page")
        self.assertEqual(new_page.owner, self.admin_user)  # 新页面的所有者是当前用户

    def test_create_page_validation_error(self):
        """测试创建页面时的验证错误"""
        with self.assertRaises(ValidationError):
            PageTemplateRepository.create_page(
                "",  # 空名称应该触发验证错误
                [],
                "test_area",
                self.editor_user,
            )

    def test_create_page_strip_whitespace(self):
        """测试创建页面时去除空白字符"""
        page = PageTemplateRepository.create_page(
            "  Test Page  ",  # 包含空白字符
            [],
            "  test_area  ",  # 包含空白字符
            self.editor_user,
        )

        self.assertEqual(page.name, "Test Page")
        self.assertEqual(page.target_area, "test_area")

    def test_update_page_validation_error(self):
        """测试更新页面时的验证错误"""
        with self.assertRaises(ValidationError):
            PageTemplateRepository.update_page(
                str(self.page1.id),
                self.editor_user,
                name="",  # 空名称应该触发验证错误
            )

    def test_update_page_strip_whitespace(self):
        """测试更新页面时去除空白字符"""
        updated_page = PageTemplateRepository.update_page(
            str(self.page1.id),
            self.editor_user,
            name="  Updated Name  ",
            target_area="  updated_area  ",
        )

        self.assertEqual(updated_page.name, "Updated Name")
        self.assertEqual(updated_page.target_area, "updated_area")

    def test_update_page_invalid_field(self):
        """测试更新页面时使用无效字段"""
        updated_page = PageTemplateRepository.update_page(
            str(self.page1.id),
            self.editor_user,
            invalid_field="should_be_ignored",
            name="Valid Update",
        )

        self.assertEqual(updated_page.name, "Valid Update")
        self.assertFalse(hasattr(updated_page, "invalid_field"))

    def test_get_all_pages_for_user_with_pagination(self):
        """测试分页获取用户页面"""
        # 创建更多页面
        for i in range(5):
            PageTemplate.objects.create(
                name=f"Page {i}",
                content=[],
                target_area="test",
                owner=self.editor_user,
            )

        # 测试limit
        pages = PageTemplateRepository.get_all_pages_for_user(self.editor_user, limit=3)
        self.assertEqual(len(list(pages)), 3)

        # 测试offset
        pages = PageTemplateRepository.get_all_pages_for_user(
            self.editor_user, offset=2
        )
        self.assertGreaterEqual(len(list(pages)), 5)  # 应该有至少5个页面

    def test_get_all_pages_for_user_admin_vs_editor(self):
        """测试管理员和编辑者获取页面的区别"""
        admin_pages = PageTemplateRepository.get_all_pages_for_user(self.admin_user)
        editor_pages = PageTemplateRepository.get_all_pages_for_user(self.editor_user)

        # 管理员可以看到所有页面
        self.assertGreater(admin_pages.count(), editor_pages.count())

        # 编辑者只能看到自己的页面
        for page in editor_pages:
            self.assertEqual(page.owner, self.editor_user)

    def test_get_user_role_private_method(self):
        """测试私有方法_get_user_role"""
        # 测试管理员
        admin_role = PageTemplateRepository._get_user_role(self.admin_user)
        self.assertEqual(admin_role, "admin")

        # 测试编辑者
        editor_role = PageTemplateRepository._get_user_role(self.editor_user)
        self.assertEqual(editor_role, "editor")

        # 测试无profile用户
        no_profile_user = User.objects.create_user(
            username="noprofile", email="noprofile@test.com", password="pass"
        )
        role = PageTemplateRepository._get_user_role(no_profile_user)
        self.assertEqual(role, "editor")  # 默认角色
