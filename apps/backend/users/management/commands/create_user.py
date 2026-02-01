"""
Django管理命令：创建普通用户

使用方法:
    python manage.py create_user
    python manage.py create_user --username john --password pass123
    python manage.py create_user --role editor  # 明确指定角色
    python manage.py create_user --force  # 强制重置现有用户
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db import transaction
from users.models import UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = "创建普通用户（editor角色）"

    def add_arguments(self, parser):
        parser.add_argument(
            "--username", type=str, required=False, help="用户名（必填，如未提供则交互输入）"
        )
        parser.add_argument(
            "--password",
            type=str,
            required=False,
            help="密码（必填，如未提供则交互输入）",
        )
        parser.add_argument(
            "--email",
            type=str,
            default="",
            help="邮箱（可选）",
        )
        parser.add_argument(
            "--full-name",
            type=str,
            default="",
            help="全名（可选）",
        )
        parser.add_argument(
            "--role",
            type=str,
            choices=["editor", "admin"],
            default="editor",
            help="用户角色 (默认: editor)",
        )
        parser.add_argument(
            "--force", action="store_true", help="强制重置现有用户"
        )

    def handle(self, *args, **options):
        # 交互式输入用户名和密码（如果未提供）
        username = options.get("username")
        if not username:
            username = input("请输入用户名: ").strip()
            if not username:
                raise CommandError("用户名不能为空")

        password = options.get("password")
        if not password:
            import getpass
            password = getpass.getpass("请输入密码: ")
            password_confirm = getpass.getpass("请再次输入密码: ")
            if password != password_confirm:
                raise CommandError("两次密码输入不一致")
            if not password:
                raise CommandError("密码不能为空")

        email = options["email"] or f"{username}@pagemaker.local"
        full_name = options["full_name"] or username
        role = options["role"]
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

                # 创建新用户
                if role == "admin":
                    # 创建超级用户
                    user = User.objects.create_superuser(
                        username=username,
                        email=email,
                        password=password,
                    )
                    user_type_desc = "管理员"
                else:
                    # 创建普通用户
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        password=password,
                    )
                    user_type_desc = "普通用户"

                # 创建用户配置文件
                profile, created = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={"role": role, "full_name": full_name},
                )

                # 输出成功信息
                self.stdout.write(self.style.SUCCESS(f"✅ 成功创建{user_type_desc}!"))
                self.stdout.write(f"   用户名: {username}")
                self.stdout.write(f"   邮箱: {email}")
                self.stdout.write(f"   全名: {full_name}")
                self.stdout.write(f"   角色: {role}")
                self.stdout.write(f"   超级用户: {'是' if role == 'admin' else '否'}")
                
                # 提示下一步
                if role == "editor":
                    self.stdout.write(
                        self.style.WARNING(
                            "\n💡 提示: 该用户只能看到自己创建的数据（页面、店铺配置等）"
                        )
                    )

        except Exception as e:
            raise CommandError(f"创建用户失败: {str(e)}")
