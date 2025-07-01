from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _


class UserProfile(models.Model):
    """
    用户配置文件模型
    扩展Django默认User模型，添加角色和其他自定义字段
    """
    
    ROLE_CHOICES = [
        ('editor', 'Editor'),
        ('admin', 'Admin'),
    ]
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        verbose_name=_("用户")
    )
    
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='editor',
        verbose_name=_("角色")
    )
    
    full_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("全名")
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("创建时间")
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("更新时间")
    )

    class Meta:
        db_table = 'user_profiles'
        verbose_name = _("用户配置文件")
        verbose_name_plural = _("用户配置文件")

    def __str__(self):
        return f"{self.user.username} ({self.role})"

    def is_admin(self):
        """检查用户是否为管理员"""
        return self.role == 'admin'

    def is_editor(self):
        """检查用户是否为编辑者"""
        return self.role == 'editor'


def get_user_profile(user):
    """
    获取用户配置文件，如果不存在则创建默认配置
    
    Args:
        user: Django User对象
        
    Returns:
        UserProfile: 用户配置文件对象
    """
    try:
        return user.userprofile
    except UserProfile.DoesNotExist:
        # 为没有profile的用户创建默认配置
        role = 'admin' if user.is_superuser else 'editor'
        return UserProfile.objects.create(
            user=user,
            role=role,
            full_name=user.get_full_name() or ''
        )


def check_user_role(user, required_role='admin'):
    """
    检查用户角色权限
    
    Args:
        user: Django User对象
        required_role: 需要的角色，默认为'admin'
        
    Returns:
        bool: 是否具有所需权限
    """
    # 超级用户始终有权限
    if user.is_superuser:
        return True
    
    # 检查用户配置文件中的角色
    try:
        profile = user.userprofile
        if required_role == 'admin':
            return profile.is_admin()
        elif required_role == 'editor':
            return profile.is_editor() or profile.is_admin()  # admin也有editor权限
        else:
            return False
    except UserProfile.DoesNotExist:
        # 如果没有profile，检查是否为superuser（已在上面检查过）
        return False


def has_admin_role(user):
    """
    检查用户是否具有管理员权限
    便捷函数，用于替代动态属性检查
    
    Args:
        user: Django User对象
        
    Returns:
        bool: 是否为管理员
    """
    return check_user_role(user, 'admin')
