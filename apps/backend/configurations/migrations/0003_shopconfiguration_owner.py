# Generated migration for adding owner field to ShopConfiguration

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def set_default_owner(apps, schema_editor):
    """
    数据迁移：将现有店铺配置的owner设置为第一个admin用户
    """
    ShopConfiguration = apps.get_model('configurations', 'ShopConfiguration')
    User = apps.get_model('auth', 'User')
    UserProfile = apps.get_model('users', 'UserProfile')
    
    # 获取第一个admin用户
    admin_profile = UserProfile.objects.filter(role='admin').first()
    if not admin_profile:
        # 如果没有admin角色，使用第一个超级用户
        admin_user = User.objects.filter(is_superuser=True).first()
    else:
        admin_user = admin_profile.user
    
    if admin_user:
        # 将所有现有店铺配置分配给这个admin
        ShopConfiguration.objects.filter(owner__isnull=True).update(owner=admin_user)


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('configurations', '0002_shopconfiguration_api_license_expiry_date'),
    ]

    operations = [
        # 添加owner字段（暂时允许null）
        migrations.AddField(
            model_name='shopconfiguration',
            name='owner',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='shop_configurations',
                to=settings.AUTH_USER_MODEL,
                help_text='店铺配置的所有者',
                verbose_name='所有者'
            ),
        ),
        # 数据迁移：设置默认owner
        migrations.RunPython(set_default_owner, migrations.RunPython.noop),
        # 将owner字段改为必填
        migrations.AlterField(
            model_name='shopconfiguration',
            name='owner',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='shop_configurations',
                to=settings.AUTH_USER_MODEL,
                help_text='店铺配置的所有者',
                verbose_name='所有者'
            ),
        ),
    ]
