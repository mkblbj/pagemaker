# 数据迁移：修复 target_area 的 NULL 值
from django.db import migrations


def fix_target_area_nulls(apps, schema_editor):
    """将 target_area 的 NULL 值替换为空字符串"""
    PageTemplate = apps.get_model('pages', 'PageTemplate')
    
    # 更新所有 NULL 值为空字符串
    updated = PageTemplate.objects.filter(target_area__isnull=True).update(target_area='')
    if updated > 0:
        print(f"已修复 {updated} 个页面的 target_area NULL 值")


def reverse_migration(apps, schema_editor):
    """回滚迁移：不需要做任何操作"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('pages', '0004_alter_pagetemplate_target_area'),
    ]

    operations = [
        migrations.RunPython(
            fix_target_area_nulls,
            reverse_migration
        ),
    ]

