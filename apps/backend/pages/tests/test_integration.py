import json
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import PageTemplate
from users.models import UserProfile

User = get_user_model()


class PageTemplateIntegrationTest(TestCase):
    """PageTemplate API端点集成测试"""

    def setUp(self):
        """设置测试数据"""
        # 创建测试用户
        self.editor_user = User.objects.create_user(
            username="editor", email="editor@example.com", password="testpass"
        )
        UserProfile.objects.create(user=self.editor_user, role="editor")

        self.admin_user = User.objects.create_user(
            username="admin", email="admin@example.com", password="adminpass"
        )
        UserProfile.objects.create(user=self.admin_user, role="admin")

        # 创建另一个editor用户用于权限测试
        self.other_editor = User.objects.create_user(
            username="other_editor", email="other@example.com", password="otherpass"
        )
        UserProfile.objects.create(user=self.other_editor, role="editor")

        # 创建API客户端
        self.client = APIClient()

        # 测试数据
        self.valid_page_data = {
            "name": "测试页面",
            "content": [
                {"id": "module-1", "type": "title", "content": "测试标题"},
                {"id": "module-2", "type": "text", "content": "测试文本内容"},
            ],
            "target_area": "pc",
        }

        # 创建测试页面
        self.test_page = PageTemplate.objects.create(
            name="编辑者页面",
            content=self.valid_page_data["content"],
            target_area="pc",
            owner=self.editor_user,
        )

    def get_jwt_token(self, user):
        """获取用户的JWT token"""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)

    def authenticate_user(self, user):
        """认证用户"""
        token = self.get_jwt_token(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_create_page_as_editor(self):
        """测试编辑者创建页面"""
        self.authenticate_user(self.editor_user)

        url = "/api/v1/pages/"
        response = self.client.post(url, self.valid_page_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["name"], "测试页面")
        self.assertEqual(response.data["data"]["owner_id"], str(self.editor_user.id))

    def test_create_page_as_admin(self):
        """测试管理员创建页面"""
        self.authenticate_user(self.admin_user)

        url = "/api/v1/pages/"
        response = self.client.post(url, self.valid_page_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["name"], "测试页面")
        self.assertEqual(response.data["data"]["owner_id"], str(self.admin_user.id))

    def test_create_page_unauthenticated(self):
        """测试未认证用户创建页面"""
        url = "/api/v1/pages/"
        response = self.client.post(url, self.valid_page_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_page_invalid_data(self):
        """测试创建页面时提供无效数据"""
        self.authenticate_user(self.editor_user)

        invalid_data = {
            "name": "",  # 空名称
            "content": "invalid",  # 无效内容
            "target_area": "",  # 空目标区域
        }

        url = "/api/v1/pages/"
        response = self.client.post(url, invalid_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    def test_list_pages_as_editor(self):
        """测试编辑者获取页面列表"""
        self.authenticate_user(self.editor_user)

        url = "/api/v1/pages/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

        pages = response.data["data"]["pages"]
        # 编辑者应该只能看到自己的页面
        self.assertEqual(len(pages), 1)
        self.assertEqual(pages[0]["name"], "编辑者页面")

    def test_list_pages_as_admin(self):
        """测试管理员获取页面列表"""
        self.authenticate_user(self.admin_user)

        url = "/api/v1/pages/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

        # 管理员应该能看到所有页面
        pages = response.data["data"]["pages"]
        self.assertGreaterEqual(len(pages), 1)

    def test_retrieve_own_page(self):
        """测试获取自己的页面详情"""
        self.authenticate_user(self.editor_user)

        url = f"/api/v1/pages/{self.test_page.id}/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["name"], "编辑者页面")

    def test_retrieve_other_page_as_editor(self):
        """测试编辑者访问其他人的页面"""
        # 创建其他用户的页面
        other_page = PageTemplate.objects.create(
            name="其他人的页面",
            content=self.valid_page_data["content"],
            target_area="pc",
            owner=self.other_editor,
        )

        self.authenticate_user(self.editor_user)

        url = f"/api/v1/pages/{other_page.id}/"
        response = self.client.get(url)

        # 编辑者不能访问其他人的页面
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data["success"])

    def test_retrieve_other_page_as_admin(self):
        """测试管理员访问其他人的页面"""
        # 创建其他用户的页面
        other_page = PageTemplate.objects.create(
            name="其他人的页面",
            content=self.valid_page_data["content"],
            target_area="pc",
            owner=self.other_editor,
        )

        self.authenticate_user(self.admin_user)

        url = f"/api/v1/pages/{other_page.id}/"
        response = self.client.get(url)

        # 管理员可以访问任何人的页面
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["name"], "其他人的页面")

    def test_update_own_page(self):
        """测试更新自己的页面"""
        self.authenticate_user(self.editor_user)

        update_data = {"name": "更新后的页面名称", "target_area": "mobile"}

        url = f"/api/v1/pages/{self.test_page.id}/"
        response = self.client.patch(url, update_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["name"], "更新后的页面名称")
        self.assertEqual(response.data["data"]["target_area"], "mobile")

    def test_update_other_page_as_editor(self):
        """测试编辑者更新其他人的页面"""
        # 创建其他用户的页面
        other_page = PageTemplate.objects.create(
            name="其他人的页面",
            content=self.valid_page_data["content"],
            target_area="pc",
            owner=self.other_editor,
        )

        self.authenticate_user(self.editor_user)

        update_data = {"name": "尝试更新"}
        url = f"/api/v1/pages/{other_page.id}/"
        response = self.client.patch(url, update_data, format="json")

        # 编辑者不能更新其他人的页面
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_own_page(self):
        """测试删除自己的页面"""
        self.authenticate_user(self.editor_user)

        url = f"/api/v1/pages/{self.test_page.id}/"
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

        # 验证页面已被删除
        self.assertFalse(PageTemplate.objects.filter(id=self.test_page.id).exists())

    def test_delete_other_page_as_editor(self):
        """测试编辑者删除其他人的页面"""
        # 创建其他用户的页面
        other_page = PageTemplate.objects.create(
            name="其他人的页面",
            content=self.valid_page_data["content"],
            target_area="pc",
            owner=self.other_editor,
        )

        self.authenticate_user(self.editor_user)

        url = f"/api/v1/pages/{other_page.id}/"
        response = self.client.delete(url)

        # 编辑者不能删除其他人的页面
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # 验证页面仍然存在
        self.assertTrue(PageTemplate.objects.filter(id=other_page.id).exists())

    def test_admin_can_manage_all_pages(self):
        """测试管理员可以管理所有页面"""
        # 创建其他用户的页面
        other_page = PageTemplate.objects.create(
            name="其他人的页面",
            content=self.valid_page_data["content"],
            target_area="pc",
            owner=self.other_editor,
        )

        self.authenticate_user(self.admin_user)

        # 管理员可以更新其他人的页面
        update_data = {"name": "管理员更新的页面"}
        url = f"/api/v1/pages/{other_page.id}/"
        response = self.client.patch(url, update_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["name"], "管理员更新的页面")

    def test_pagination(self):
        """测试分页功能"""
        # 创建多个页面
        for i in range(5):
            PageTemplate.objects.create(
                name=f"页面{i}",
                content=self.valid_page_data["content"],
                target_area="pc",
                owner=self.editor_user,
            )

        self.authenticate_user(self.editor_user)

        # 测试分页参数
        url = "/api/v1/pages/"
        response = self.client.get(url, {"limit": 3, "offset": 0})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

        pagination = response.data["data"]["pagination"]
        self.assertEqual(pagination["limit"], 3)
        self.assertEqual(pagination["offset"], 0)
        self.assertGreaterEqual(pagination["total"], 5)

    def test_search_functionality(self):
        """测试搜索功能"""
        # 创建带特定名称的页面
        PageTemplate.objects.create(
            name="特殊搜索页面",
            content=self.valid_page_data["content"],
            target_area="pc",
            owner=self.editor_user,
        )

        self.authenticate_user(self.editor_user)

        url = "/api/v1/pages/"
        response = self.client.get(url, {"search": "特殊搜索"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

        pages = response.data["data"]["pages"]
        self.assertEqual(len(pages), 1)
        self.assertEqual(pages[0]["name"], "特殊搜索页面")

    def test_filter_by_target_area(self):
        """测试按目标区域过滤"""
        # 创建移动端页面
        PageTemplate.objects.create(
            name="移动端页面",
            content=self.valid_page_data["content"],
            target_area="mobile",
            owner=self.editor_user,
        )

        self.authenticate_user(self.editor_user)

        url = "/api/v1/pages/"
        response = self.client.get(url, {"target_area": "mobile"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

        pages = response.data["data"]["pages"]
        self.assertEqual(len(pages), 1)
        self.assertEqual(pages[0]["name"], "移动端页面")
        self.assertEqual(pages[0]["target_area"], "mobile")
