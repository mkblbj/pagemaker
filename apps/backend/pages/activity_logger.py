"""
页面活动日志记录器

使用 Django 信号自动记录页面的创建、更新和删除操作
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone

User = get_user_model()


class PageActivity(models.Model):
    """页面活动日志模型"""

    ACTION_CHOICES = [
        ('created', '创建'),
        ('updated', '更新'),
        ('deleted', '删除'),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="活动记录的唯一标识符",
    )

    page_id = models.UUIDField(
        help_text="关联的页面ID",
        db_index=True,
    )

    page_name = models.CharField(
        max_length=255,
        help_text="页面名称快照",
    )

    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        help_text="操作类型",
        db_index=True,
    )

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="page_activities",
        help_text="执行操作的用户",
    )

    shop_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="店铺名称快照",
    )

    device_type = models.CharField(
        max_length=20,
        blank=True,
        help_text="设备类型",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="活动发生时间",
        db_index=True,
    )

    class Meta:
        db_table = "page_activities"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["action", "-created_at"]),
        ]
        verbose_name = "页面活动"
        verbose_name_plural = "页面活动"

    def __str__(self):
        user_name = self.user.username if self.user else "系统"
        return f"{user_name} {self.get_action_display()} {self.page_name}"


# 信号处理器
@receiver(post_save, sender='pages.PageTemplate')
def log_page_save(sender, instance, created, **kwargs):
    """记录页面创建和更新"""
    from .models import PageTemplate
    
    action = 'created' if created else 'updated'
    
    # 获取当前用户（从实例的 _current_user 属性中获取）
    user = getattr(instance, '_current_user', instance.owner)
    
    PageActivity.objects.create(
        page_id=instance.id,
        page_name=instance.name,
        action=action,
        user=user,
        shop_name=instance.shop.shop_name if instance.shop else '',
        device_type=instance.device_type,
    )


@receiver(post_delete, sender='pages.PageTemplate')
def log_page_delete(sender, instance, **kwargs):
    """记录页面删除"""
    # 获取当前用户（从实例的 _current_user 属性中获取）
    user = getattr(instance, '_current_user', instance.owner)
    
    PageActivity.objects.create(
        page_id=instance.id,
        page_name=instance.name,
        action='deleted',
        user=user,
        shop_name=instance.shop.shop_name if instance.shop else '',
        device_type=instance.device_type,
    )

