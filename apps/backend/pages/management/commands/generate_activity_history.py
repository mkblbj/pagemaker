"""
生成历史活动记录的管理命令

用于为现有页面创建初始的活动记录
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from pages.models import PageTemplate
from pages.activity_logger import PageActivity


class Command(BaseCommand):
    help = '为现有页面生成历史活动记录'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='清除所有现有活动记录后重新生成',
        )

    def handle(self, *args, **options):
        reset = options.get('reset', False)

        if reset:
            count = PageActivity.objects.count()
            PageActivity.objects.all().delete()
            self.stdout.write(
                self.style.WARNING(f'已删除 {count} 条现有活动记录')
            )

        # 获取所有页面
        pages = PageTemplate.objects.select_related('owner', 'shop').all()
        
        if not pages.exists():
            self.stdout.write(
                self.style.WARNING('没有找到任何页面，无需生成活动记录')
            )
            return

        created_count = 0
        
        for page in pages:
            # 为每个页面创建一条"创建"记录，使用页面的创建时间
            activity = PageActivity.objects.create(
                page_id=page.id,
                page_name=page.name,
                action='created',
                user=page.owner,
                shop_name=page.shop.shop_name if page.shop else '',
                device_type=page.device_type,
            )
            
            # 手动设置创建时间为页面的创建时间
            activity.created_at = page.created_at
            activity.save(update_fields=['created_at'])
            
            created_count += 1
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ 为页面 "{page.name}" 创建了活动记录'
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n成功生成 {created_count} 条历史活动记录！'
            )
        )

