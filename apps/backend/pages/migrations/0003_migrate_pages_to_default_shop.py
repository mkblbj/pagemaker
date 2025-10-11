# 数据迁移：创建默认店铺并迁移现有页面
import os
from django.db import migrations


def create_default_shop_and_migrate_pages(apps, schema_editor):
    """创建默认店铺并将现有页面关联到该店铺"""
    ShopConfiguration = apps.get_model('configurations', 'ShopConfiguration')
    PageTemplate = apps.get_model('pages', 'PageTemplate')
    
    # 检查是否已有店铺配置
    if ShopConfiguration.objects.exists():
        # 如果已有店铺，使用第一个店铺作为默认店铺
        default_shop = ShopConfiguration.objects.first()
        print(f"使用现有店铺: {default_shop.shop_name}")
    else:
        # 从环境变量创建默认店铺
        default_shop = ShopConfiguration.objects.create(
            shop_name="默认店铺",
            target_area=os.getenv('DEFAULT_TARGET_AREA', 'pc'),
            api_service_secret=os.getenv('RAKUTEN_SERVICE_SECRET', ''),
            api_license_key=os.getenv('RAKUTEN_LICENSE_KEY', ''),
            ftp_host=os.getenv('RAKUTEN_FTP_HOST', 'upload.rakuten.ne.jp'),
            ftp_port=int(os.getenv('RAKUTEN_FTP_PORT', 21)),
            ftp_user=os.getenv('RAKUTEN_FTP_USERNAME', ''),
            ftp_password=os.getenv('RAKUTEN_FTP_PASSWORD', ''),
        )
        print(f"创建默认店铺: {default_shop.shop_name}")
    
    # 迁移现有页面
    pages_to_migrate = PageTemplate.objects.filter(shop__isnull=True)
    count = pages_to_migrate.count()
    
    if count > 0:
        print(f"开始迁移 {count} 个页面...")
        
        for page in pages_to_migrate:
            page.shop = default_shop
            
            # 根据原 target_area 设置 device_type
            if page.target_area and page.target_area.lower() in ['mobile', 'sp', 'smartphone']:
                page.device_type = 'mobile'
            else:
                page.device_type = 'pc'
            
            page.save(update_fields=['shop', 'device_type'])
        
        print(f"成功迁移 {count} 个页面到默认店铺")
    else:
        print("没有需要迁移的页面")


def reverse_migration(apps, schema_editor):
    """回滚迁移：将页面的shop字段设置为None"""
    PageTemplate = apps.get_model('pages', 'PageTemplate')
    
    # 将所有页面的shop设置为None
    count = PageTemplate.objects.exclude(shop__isnull=True).count()
    if count > 0:
        PageTemplate.objects.all().update(shop=None)
        print(f"已回滚 {count} 个页面的店铺关联")


class Migration(migrations.Migration):

    dependencies = [
        ('pages', '0002_pagetemplate_device_type_pagetemplate_shop_and_more'),
        ('configurations', '0002_shopconfiguration_api_license_expiry_date'),
    ]

    operations = [
        migrations.RunPython(
            create_default_shop_and_migrate_pages,
            reverse_migration
        ),
    ]

