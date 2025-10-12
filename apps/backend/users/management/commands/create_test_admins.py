"""
Django管理命令：批量创建测试管理员账号

使用方法:
    python manage.py create_test_admins
    python manage.py create_test_admins --count 5
    python manage.py create_test_admins --force  # 强制重置现有账号
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db import transaction
from users.models import UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = "批量创建测试管理员账号"

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=5,
            help="创建管理员数量 (默认: 5)",
        )
        parser.add_argument(
            "--password",
            type=str,
            default="admin123",
            help="管理员密码 (默认: admin123)",
        )
        parser.add_argument(
            "--force", action="store_true", help="强制重置现有管理员账号"
        )

    def handle(self, *args, **options):
        count = options["count"]
        password = options["password"]
        force = options["force"]

        if count < 1 or count > 20:
            raise CommandError("创建数量必须在 1-20 之间")

        self.stdout.write(
            self.style.SUCCESS(f"\n🚀 开始创建 {count} 个测试管理员账号...\n")
        )

        created_count = 0
        skipped_count = 0

        try:
            for i in range(1, count + 1):
                username = f"admin{i}"
                email = f"admin{i}@pagemaker.local"
                full_name = f"Admin User {i}"

                with transaction.atomic():
                    # 检查是否已存在该用户
                    existing_user = User.objects.filter(username=username).first()

                    if existing_user:
                        if not force:
                            self.stdout.write(
                                self.style.WARNING(
                                    f"⏭️  跳过: {username} (已存在)"
                                )
                            )
                            skipped_count += 1
                            continue
                        else:
                            # 删除现有用户
                            existing_user.delete()
                            self.stdout.write(
                                self.style.WARNING(f"🔄 重置: {username}")
                            )

                    # 创建新的超级管理员
                    admin_user = User.objects.create_superuser(
                        username=username,
                        email=email,
                        password=password,
                        first_name="Admin",
                        last_name=f"User {i}",
                    )

                    # 创建用户配置文件
                    UserProfile.objects.get_or_create(
                        user=admin_user,
                        defaults={"role": "admin", "full_name": full_name},
                    )

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"✅ 创建成功: {username} ({email})"
                        )
                    )
                    created_count += 1

            # 输出汇总信息
            self.stdout.write("\n" + "=" * 50)
            self.stdout.write(self.style.SUCCESS(f"\n🎉 批量创建完成!\n"))
            self.stdout.write(f"   创建数量: {created_count}")
            if skipped_count > 0:
                self.stdout.write(f"   跳过数量: {skipped_count}")
            self.stdout.write(f"   统一密码: {password}")
            
            self.stdout.write("\n📋 账号列表:")
            for i in range(1, count + 1):
                self.stdout.write(f"   - admin{i} / {password}")

            # 安全提示
            if password == "admin123":
                self.stdout.write(
                    self.style.WARNING(
                        "\n⚠️  安全提示: 这些是测试账号，请勿在生产环境使用!"
                    )
                )

        except Exception as e:
            raise CommandError(f"创建管理员失败: {str(e)}")

