"""
禁用R-Cabinet集成的管理命令
"""

import os
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings


class Command(BaseCommand):
    help = "禁用R-Cabinet集成功能"

    def add_arguments(self, parser):
        parser.add_argument(
            "--permanent",
            action="store_true",
            help="永久禁用（修改环境变量文件）",
        )
        parser.add_argument(
            "--reason", type=str, help="禁用原因", default="管理员手动禁用"
        )

    def handle(self, *args, **options):
        try:
            permanent = options["permanent"]
            reason = options["reason"]

            self.stdout.write(self.style.WARNING(f"准备禁用R-Cabinet集成功能..."))
            self.stdout.write(f"禁用原因: {reason}")

            if permanent:
                # 修改环境变量文件
                self._update_env_file()
                self.stdout.write(
                    self.style.SUCCESS("✅ 已永久禁用R-Cabinet集成（已更新.env文件）")
                )
                self.stdout.write(self.style.WARNING("⚠️  请重启应用服务以使更改生效"))
            else:
                # 临时禁用（仅当前进程）
                os.environ["RCABINET_INTEGRATION_ENABLED"] = "False"
                self.stdout.write(
                    self.style.SUCCESS("✅ 已临时禁用R-Cabinet集成（仅当前进程）")
                )
                self.stdout.write(self.style.WARNING("⚠️  重启应用后将恢复原设置"))

            # 验证设置
            from pagemaker.config import config

            if not config.RCABINET_INTEGRATION_ENABLED:
                self.stdout.write(self.style.SUCCESS("✅ 验证: R-Cabinet集成已禁用"))
            else:
                self.stdout.write(
                    self.style.ERROR("❌ 验证失败: R-Cabinet集成仍处于启用状态")
                )

        except Exception as e:
            raise CommandError(f"禁用R-Cabinet集成失败: {str(e)}")

    def _update_env_file(self):
        """更新.env文件"""
        env_file_path = os.path.join(settings.BASE_DIR.parent.parent, ".env")

        # 读取现有内容
        lines = []
        rcabinet_line_found = False

        if os.path.exists(env_file_path):
            with open(env_file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

        # 更新或添加RCABINET_INTEGRATION_ENABLED设置
        updated_lines = []
        for line in lines:
            if line.strip().startswith("RCABINET_INTEGRATION_ENABLED"):
                updated_lines.append("RCABINET_INTEGRATION_ENABLED=False\n")
                rcabinet_line_found = True
            else:
                updated_lines.append(line)

        # 如果没有找到，则添加新行
        if not rcabinet_line_found:
            updated_lines.append("\n# R-Cabinet集成功能开关\n")
            updated_lines.append("RCABINET_INTEGRATION_ENABLED=False\n")

        # 写回文件
        with open(env_file_path, "w", encoding="utf-8") as f:
            f.writelines(updated_lines)

        self.stdout.write(f"已更新环境变量文件: {env_file_path}")
