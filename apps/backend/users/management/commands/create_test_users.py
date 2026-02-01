"""
Django管理命令：批量创建测试用户

使用方法:
    python manage.py create_test_users
    python manage.py create_test_users --count 10
    python manage.py create_test_users --role admin  # 创建管理员
    python manage.py create_test_users --force  # 强制重置现有用户
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db import transaction
from users.models import UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = "批量创建测试用户"

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=5,
            help="创建用户数量 (默认: 5)",
        )
        parser.add_argument(
            "--password",
            type=str,
            default="test123",
            help="统一密码 (默认: test123)",
        )
        parser.add_argument(
            "--role",
            type=str,
            choices=["editor", "admin"],
            default="editor",
            help="用户角色 (默认: editor)",
        )
        parser.add_argument(
            "--prefix",
            type=str,
            default="user",
            help="用户名前缀 (默认: user, 生成user1, user2...)",
        )
        parser.add_argument(
            "--force", action="store_true", help="强制重置现有用户"
        )

    def handle(self, *args, **options):
        count = options["count"]
        password = options["password"]
        role = options["role"]
        prefix = options["prefix"]
        force = options["force"]

        if count < 1 or count > 50:
            raise CommandError("创建数量必须在 1-50 之间")

        role_desc = "管理员" if role == "admin" else "普通用户"
        self.stdout.write(
            self.style.SUCCESS(f"\n🚀 开始创建 {count} 个测试{role_desc}账号...\n")
        )

        created_count = 0
        skipped_count = 0
        created_users = []

        try:
            for i in range(1, count + 1):
                username = f"{prefix}{i}"
                email = f"{username}@pagemaker.local"
                full_name = f"User {i}"

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

                    # 创建新用户
                    if role == "admin":
                        user = User.objects.create_superuser(
                            username=username,
                            email=email,
                            password=password,
                        )
                    else:
                        user = User.objects.create_user(
                            username=username,
                            email=email,
                            password=password,
                        )

                    # 创建用户配置文件
                    UserProfile.objects.get_or_create(
                        user=user,
                        defaults={"role": role, "full_name": full_name},
                    )

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"✅ 创建成功: {username} ({email})"
                        )
                    )
                    created_count += 1
                    created_users.append(username)

            # 输出汇总信息
            self.stdout.write("\n" + "=" * 60)
            self.stdout.write(self.style.SUCCESS(f"\n🎉 批量创建完成!\n"))
            self.stdout.write(f"   用户类型: {role_desc}")
            self.stdout.write(f"   创建数量: {created_count}")
            if skipped_count > 0:
                self.stdout.write(f"   跳过数量: {skipped_count}")
            self.stdout.write(f"   统一密码: {password}")
            
            self.stdout.write("\n📋 账号列表:")
            for username in created_users:
                self.stdout.write(f"   - {username} / {password}")

            # 提示信息
            if role == "editor":
                self.stdout.write(
                    self.style.WARNING(
                        "\n💡 提示: 这些用户只能看到自己创建的数据（数据隔离已生效）"
                    )
                )
            
            # 安全提示
            if password in ["test123", "admin123"]:
                self.stdout.write(
                    self.style.WARNING(
                        "\n⚠️  安全提示: 这些是测试账号，请勿在生产环境使用!"
                    )
                )

        except Exception as e:
            raise CommandError(f"创建用户失败: {str(e)}")
