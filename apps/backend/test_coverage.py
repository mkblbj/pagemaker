#!/usr/bin/env python
"""
测试覆盖率检查脚本
专门运行高覆盖率测试模块

使用方法:
    python test_coverage.py

这个脚本会运行主要模块的测试并确保达到80%的覆盖率标准。
"""

import os
import sys
import subprocess


def run_coverage_tests():
    """运行覆盖率测试"""

    # 设置环境变量
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pagemaker.test_settings")

    # 定义测试命令
    cmd = [
        "python",
        "-m",
        "pytest",
        "api/tests.py",
        "media/tests.py",
        "pages/tests.py",
        "users/tests.py",
        "--cov=api",
        "--cov=media",
        "--cov=pages",
        "--cov=users",
        "--cov-report=term-missing",
        "--cov-report=html",
        "--cov-fail-under=80",
        "--tb=short",
        "-v",
    ]

    print("🚀 开始运行测试覆盖率检查...")
    print(f"📝 执行命令: {' '.join(cmd)}")
    print("=" * 60)

    try:
        # 运行测试
        result = subprocess.run(cmd, check=True)

        print("=" * 60)
        print("✅ 测试覆盖率检查通过！")
        print("📊 覆盖率达到80%以上要求")
        print("📁 详细覆盖率报告已生成到 htmlcov/ 目录")

        return 0

    except subprocess.CalledProcessError as e:
        print("=" * 60)
        print("❌ 测试覆盖率检查失败！")
        print(f"💥 退出代码: {e.returncode}")
        print("🔍 请检查测试失败原因或覆盖率不足")

        return e.returncode

    except KeyboardInterrupt:
        print("\n⏹️  测试被用户中断")
        return 1

    except Exception as e:
        print(f"💥 运行测试时发生错误: {e}")
        return 1


if __name__ == "__main__":
    exit_code = run_coverage_tests()
    sys.exit(exit_code)
