"""
Django管理命令：创建或重置超级管理员账号

使用方法:
    python manage.py create_admin
    python manage.py create_admin --force  # 强制重置现有admin账号
    python manage.py create_admin --username custom_admin --password custom_pass
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db import transaction
from users.models import UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = "创建或重置超级管理员账号"

    def add_arguments(self, parser):
        parser.add_argument(
            "--username", type=str, default="admin", help="管理员用户名 (默认: admin)"
        )
        parser.add_argument(
            "--password",
            type=str,
            default="admin123",
            help="管理员密码 (默认: admin123)",
        )
        parser.add_argument(
            "--email",
            type=str,
            default="admin@pagemaker.local",
            help="管理员邮箱 (默认: admin@pagemaker.local)",
        )
        parser.add_argument(
            "--force", action="store_true", help="强制重置现有管理员账号"
        )

    def handle(self, *args, **options):
        username = options["username"]
        password = options["password"]
        email = options["email"]
        force = options["force"]

        try:
            with transaction.atomic():
                # 检查是否已存在该用户
                existing_user = User.objects.filter(username=username).first()

                if existing_user:
                    if not force:
                        self.stdout.write(
                            self.style.WARNING(
                                f'用户 "{username}" 已存在。使用 --force 参数强制重置。'
                            )
                        )
                        return
                    else:
                        # 删除现有用户
                        existing_user.delete()
                        self.stdout.write(
                            self.style.WARNING(f"已删除现有用户: {username}")
                        )

                # 创建新的超级管理员
                admin_user = User.objects.create_superuser(
                    username=username,
                    email=email,
                    password=password,
                    first_name="Super",
                    last_name="Admin",
                )

                # 创建用户配置文件
                profile, created = UserProfile.objects.get_or_create(
                    user=admin_user,
                    defaults={"role": "admin", "full_name": "Super Admin"},
                )

                # 输出成功信息
                self.stdout.write(self.style.SUCCESS(f"✅ 成功创建超级管理员!"))
                self.stdout.write(f"   用户名: {username}")
                self.stdout.write(f"   邮箱: {email}")
                self.stdout.write(f"   密码: {password}")
                self.stdout.write(f"   角色: admin")
                self.stdout.write(f"   超级用户: 是")

                # 安全提示
                if password == "admin123":
                    self.stdout.write(
                        self.style.WARNING("\n⚠️  安全提示: 请在生产环境中更改默认密码!")
                    )

        except Exception as e:
            raise CommandError(f"创建管理员失败: {str(e)}")
