#!/usr/bin/env python3
"""
数据库连接测试脚本
用于诊断部署时的数据库连接问题
"""

import os
import sys
import pymysql
from decouple import config


def test_database_connection():
    """测试数据库连接"""
    print("🔍 开始数据库连接测试...")

    # 读取环境变量
    try:
        db_host = config("DATABASE_HOST")
        db_port = config("DATABASE_PORT", default="3306", cast=int)
        db_name = config("DATABASE_NAME")
        db_user = config("DATABASE_USER")
        db_password = config("DATABASE_PASSWORD")

        print(f"📋 数据库配置:")
        print(f"  - 主机: {db_host}")
        print(f"  - 端口: {db_port}")
        print(f"  - 数据库: {db_name}")
        print(f"  - 用户: {db_user}")
        print(f"  - 密码: {'*' * len(db_password)}")

    except Exception as e:
        print(f"❌ 环境变量读取失败: {e}")
        print("请检查 .env 文件是否存在且包含正确的数据库配置")
        return False

    # 测试连接到MySQL服务器 (不指定数据库)
    print("\n🔌 测试MySQL服务器连接...")
    try:
        connection = pymysql.connect(
            host=db_host,
            port=db_port,
            user=db_user,
            password=db_password,
            charset="utf8mb4",
        )
        print("✅ MySQL服务器连接成功")

        # 检查数据库是否存在
        print(f"\n🗄️ 检查数据库 '{db_name}' 是否存在...")
        with connection.cursor() as cursor:
            cursor.execute("SHOW DATABASES")
            databases = [row[0] for row in cursor.fetchall()]

            if db_name in databases:
                print(f"✅ 数据库 '{db_name}' 存在")
            else:
                print(f"❌ 数据库 '{db_name}' 不存在")
                print(f"📋 现有数据库列表:")
                for db in databases:
                    print(f"  - {db}")
                return False

        connection.close()

    except pymysql.Error as e:
        print(f"❌ MySQL服务器连接失败: {e}")
        return False

    # 测试连接到指定数据库
    print(f"\n🎯 测试连接到数据库 '{db_name}'...")
    try:
        connection = pymysql.connect(
            host=db_host,
            port=db_port,
            user=db_user,
            password=db_password,
            database=db_name,
            charset="utf8mb4",
        )

        # 测试基本查询
        with connection.cursor() as cursor:
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()[0]
            print(f"✅ 数据库连接成功，MySQL版本: {version}")

            # 检查用户权限
            cursor.execute("SHOW GRANTS")
            grants = cursor.fetchall()
            print(f"📋 用户权限:")
            for grant in grants:
                print(f"  - {grant[0]}")

        connection.close()
        print("\n🎉 数据库连接测试全部通过！")
        return True

    except pymysql.Error as e:
        print(f"❌ 数据库连接失败: {e}")
        return False


def test_django_connection():
    """测试Django数据库连接"""
    print("\n🐍 测试Django数据库连接...")

    try:
        # 添加Django项目路径
        sys.path.insert(0, "/root/dev/pagemaker/apps/backend")

        # 设置Django设置模块
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pagemaker.settings")

        import django

        django.setup()

        from django.db import connection
        from django.core.management import execute_from_command_line

        # 测试数据库连接
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            if result[0] == 1:
                print("✅ Django数据库连接成功")
                return True

    except Exception as e:
        print(f"❌ Django数据库连接失败: {e}")
        return False


if __name__ == "__main__":
    print("=" * 50)
    print("🔧 Pagemaker 数据库连接诊断工具")
    print("=" * 50)

    # 检查当前目录
    current_dir = os.getcwd()
    print(f"📁 当前目录: {current_dir}")

    # 检查 .env 文件
    env_file = ".env"
    if os.path.exists(env_file):
        print(f"✅ 找到环境变量文件: {env_file}")
    else:
        print(f"❌ 未找到环境变量文件: {env_file}")
        print("请确保在项目根目录运行此脚本，并且存在 .env 文件")
        sys.exit(1)

    # 运行测试
    success = True

    # 测试基础连接
    if not test_database_connection():
        success = False

    # 测试Django连接
    if not test_django_connection():
        success = False

    print("\n" + "=" * 50)
    if success:
        print("🎉 所有测试通过！数据库配置正确。")
        sys.exit(0)
    else:
        print("❌ 测试失败！请根据上述信息修复数据库配置。")
        sys.exit(1)
