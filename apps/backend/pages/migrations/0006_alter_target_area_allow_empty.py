# 原生 SQL 迁移：修改 target_area 字段允许空字符串
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pages', '0005_fix_target_area_nulls'),
    ]

    operations = [
        # 使用原生 SQL 修改字段
        migrations.RunSQL(
            # Forward: 修改字段为允许空字符串，默认值为空字符串
            sql="ALTER TABLE pages_pagetemplate MODIFY target_area VARCHAR(100) NOT NULL DEFAULT '';",
            # Reverse: 恢复为不允许空
            reverse_sql="ALTER TABLE pages_pagetemplate MODIFY target_area VARCHAR(100) NOT NULL;",
        ),
    ]

