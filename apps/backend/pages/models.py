import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
import json

User = get_user_model()


def validate_json_content(value):
    """验证content字段的JSON格式"""
    if value is None:
        raise ValidationError("Content不能为空")

    if not isinstance(value, (list, dict)):
        try:
            parsed = json.loads(value) if isinstance(value, str) else value
            if not isinstance(parsed, list):
                raise ValidationError("Content必须是数组格式")
        except (json.JSONDecodeError, TypeError):
            raise ValidationError("Content必须是有效的JSON")


class PageTemplate(models.Model):
    """页面模板模型"""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="页面模板的唯一标识符",
    )

    name = models.CharField(max_length=255, help_text="用户设定的页面名称")

    content = models.JSONField(
        default=list,
        validators=[validate_json_content],
        help_text="存储PageModule数组的JSON字段",
        blank=True,  # 允许空数组
    )

    target_area = models.CharField(max_length=100, help_text="关联乐天目标区域")

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="page_templates",
        help_text="页面模板的所有者",
    )

    created_at = models.DateTimeField(auto_now_add=True, help_text="创建时间")

    updated_at = models.DateTimeField(auto_now=True, help_text="最后更新时间")

    class Meta:
        db_table = "pages_pagetemplate"
        ordering = ["-updated_at", "-created_at"]
        indexes = [
            models.Index(fields=["owner", "-updated_at"]),
            models.Index(fields=["target_area"]),
            models.Index(fields=["-created_at"]),
        ]
        verbose_name = "页面模板"
        verbose_name_plural = "页面模板"

    def __str__(self):
        return f"{self.name} ({self.owner.username})"

    def clean(self):
        """模型级别的数据验证"""
        super().clean()

        # 验证name不为空
        if not self.name or not self.name.strip():
            raise ValidationError({"name": "页面名称不能为空"})

        # 验证target_area不为空
        if not self.target_area or not self.target_area.strip():
            raise ValidationError({"target_area": "目标区域不能为空"})

        # 验证content是否为有效的PageModule数组
        if self.content is not None:
            if not isinstance(self.content, list):
                raise ValidationError({"content": "Content必须是数组格式"})

            for i, module in enumerate(self.content):
                if not isinstance(module, dict):
                    raise ValidationError({"content": f"模块 {i} 必须是对象格式"})

                # 验证必需字段
                if "id" not in module:
                    raise ValidationError({"content": f"模块 {i} 缺少id字段"})
                if "type" not in module:
                    raise ValidationError({"content": f"模块 {i} 缺少type字段"})

    def save(self, *args, **kwargs):
        """保存前执行完整验证"""
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def module_count(self):
        """返回页面中模块的数量"""
        return len(self.content) if self.content else 0

    def get_modules_by_type(self, module_type):
        """根据类型获取模块列表"""
        if not self.content:
            return []
        return [module for module in self.content if module.get("type") == module_type]
