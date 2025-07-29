from typing import List, Optional
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db.models import QuerySet
from .models import PageTemplate
from users.models import get_user_profile

User = get_user_model()


class PageTemplateRepository:
    """PageTemplate数据访问层，遵循仓库模式"""

    @staticmethod
    def _get_user_role(user: User) -> str:
        """获取用户角色"""
        if user.is_superuser:
            return "admin"

        try:
            profile = get_user_profile(user)
            return profile.role
        except Exception:
            return "editor"  # 默认角色

    @staticmethod
    def get_page_by_id(page_id: str, user: User = None) -> Optional[PageTemplate]:
        """
        根据ID获取单个页面

        Args:
            page_id: 页面ID
            user: 可选，用于权限控制

        Returns:
            PageTemplate实例或None
        """
        try:
            queryset = PageTemplate.objects.select_related("owner")

            if user:
                # 如果提供了用户，进行权限检查
                user_role = PageTemplateRepository._get_user_role(user)
                if user_role == "admin":
                    # admin可以访问所有页面
                    return queryset.get(id=page_id)
                else:
                    # editor只能访问自己的页面
                    return queryset.get(id=page_id, owner=user)
            else:
                # 没有用户信息时，返回页面（用于内部调用）
                return queryset.get(id=page_id)

        except (PageTemplate.DoesNotExist, ValidationError):
            return None

    @staticmethod
    def get_all_pages_for_user(
        user: User, limit: int = None, offset: int = None
    ) -> QuerySet[PageTemplate]:
        """
        获取用户的页面列表

        Args:
            user: 用户实例
            limit: 可选，限制返回数量
            offset: 可选，偏移量

        Returns:
            PageTemplate查询集
        """
        queryset = PageTemplate.objects.select_related("owner")

        user_role = PageTemplateRepository._get_user_role(user)
        if user_role == "admin":
            # admin可以查看所有页面
            queryset = queryset.all()
        else:
            # editor只能查看自己的页面
            queryset = queryset.filter(owner=user)

        # 应用分页参数
        if offset is not None:
            queryset = queryset[offset:]
        if limit is not None:
            queryset = queryset[:limit]

        return queryset

    @staticmethod
    def create_page(
        name: str, content: List[dict], target_area: str, owner: User
    ) -> PageTemplate:
        """
        创建新页面

        Args:
            name: 页面名称
            content: 页面内容（PageModule数组）
            target_area: 目标区域
            owner: 页面所有者

        Returns:
            创建的PageTemplate实例

        Raises:
            ValidationError: 数据验证失败时
        """
        page = PageTemplate(
            name=name.strip(),
            content=content,
            target_area=target_area.strip(),
            owner=owner,
        )

        # 执行模型验证
        page.full_clean()
        page.save()

        return page

    @staticmethod
    def update_page(
        page_id: str, user: User, **update_fields
    ) -> Optional[PageTemplate]:
        """
        更新页面内容

        Args:
            page_id: 页面ID
            user: 执行更新的用户
            **update_fields: 要更新的字段

        Returns:
            更新后的PageTemplate实例或None

        Raises:
            ValidationError: 数据验证失败时
        """
        page = PageTemplateRepository.get_page_by_id(page_id, user)
        if not page:
            return None

        # 更新字段
        for field, value in update_fields.items():
            if hasattr(page, field):
                if field in ["name", "target_area"] and isinstance(value, str):
                    setattr(page, field, value.strip())
                else:
                    setattr(page, field, value)

        # 执行验证并保存
        page.full_clean()
        page.save()

        return page

    @staticmethod
    def delete_page(page_id: str, user: User) -> bool:
        """
        删除页面

        Args:
            page_id: 页面ID
            user: 执行删除的用户

        Returns:
            是否删除成功
        """
        page = PageTemplateRepository.get_page_by_id(page_id, user)
        if not page:
            return False

        page.delete()
        return True

    @staticmethod
    def get_pages_by_target_area(
        target_area: str, user: User = None
    ) -> QuerySet[PageTemplate]:
        """
        根据目标区域获取页面列表

        Args:
            target_area: 目标区域
            user: 可选，用于权限控制

        Returns:
            PageTemplate查询集
        """
        queryset = PageTemplate.objects.filter(target_area=target_area).select_related(
            "owner"
        )

        if user:
            user_role = PageTemplateRepository._get_user_role(user)
            if user_role != "admin":
                # 非admin用户只能看到自己的页面
                queryset = queryset.filter(owner=user)

        return queryset

    @staticmethod
    def search_pages(query: str, user: User) -> QuerySet[PageTemplate]:
        """
        搜索页面（按名称）

        Args:
            query: 搜索关键词
            user: 执行搜索的用户

        Returns:
            PageTemplate查询集
        """
        queryset = PageTemplate.objects.filter(
            name__icontains=query.strip()
        ).select_related("owner")

        user_role = PageTemplateRepository._get_user_role(user)
        if user_role != "admin":
            # 非admin用户只能搜索自己的页面
            queryset = queryset.filter(owner=user)

        return queryset

    @staticmethod
    def get_user_page_count(user: User) -> int:
        """
        获取用户的页面数量

        Args:
            user: 用户实例

        Returns:
            页面数量
        """
        user_role = PageTemplateRepository._get_user_role(user)
        if user_role == "admin":
            return PageTemplate.objects.count()
        else:
            return PageTemplate.objects.filter(owner=user).count()

    @staticmethod
    def duplicate_page(
        page_id: str, new_name: str, user: User
    ) -> Optional[PageTemplate]:
        """
        复制页面

        Args:
            page_id: 原页面ID
            new_name: 新页面名称
            user: 执行复制的用户

        Returns:
            复制的PageTemplate实例或None
        """
        original_page = PageTemplateRepository.get_page_by_id(page_id, user)
        if not original_page:
            return None

        # 创建副本
        new_page = PageTemplate(
            name=new_name.strip(),
            content=original_page.content.copy() if original_page.content else [],
            target_area=original_page.target_area,
            owner=user,  # 新页面的所有者是当前用户
        )

        new_page.full_clean()
        new_page.save()

        return new_page
