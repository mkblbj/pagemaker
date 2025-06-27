#!/usr/bin/env python3
"""
乐天API连接测试脚本

用于测试R-Cabinet API和License Management API的连接状态
"""

import os
import sys
import time
import json
from typing import Dict, Any, List

# 尝试加载环境变量
try:
    from dotenv import load_dotenv

    # 查找.env文件的位置 (项目根目录或backend目录)
    possible_env_paths = [
        os.path.join(
            os.path.dirname(__file__), "..", "..", "..", "..", ".env"
        ),  # 项目根目录
        os.path.join(os.path.dirname(__file__), "..", "..", ".env"),  # backend目录
        os.path.join(os.path.dirname(__file__), ".env"),  # 当前目录
    ]

    env_loaded = False
    for env_path in possible_env_paths:
        env_path = os.path.abspath(env_path)
        if os.path.exists(env_path):
            load_dotenv(env_path)
            print(f"✅ 已加载环境变量文件: {env_path}")
            env_loaded = True
            break

    if not env_loaded:
        print("⚠️  未找到 .env 文件")
        print("   请在项目根目录或backend目录创建 .env 文件")
        print("   参考 .env.example 文件")

except ImportError:
    print("⚠️  未安装 python-dotenv，将使用系统环境变量")
    print("   建议安装: pip install python-dotenv")

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from pagemaker.integrations.cabinet_client import RCabinetClient
from pagemaker.integrations.ftp_client import RakutenFTPClient
from pagemaker.integrations.utils import setup_logger
from pagemaker.integrations.exceptions import RakutenAPIError


class RakutenAPITester:
    """乐天API连接测试器"""

    def __init__(self, test_mode: str = "mock"):
        """
        初始化测试器

        Args:
            test_mode: 测试模式 ('mock' 或 'real')
        """
        self.test_mode = test_mode
        self.logger = setup_logger("rakuten.tester")

        # 检查环境变量配置
        if test_mode == "real":
            self._check_environment_variables()

        # 初始化客户端
        try:
            self.cabinet_client = RCabinetClient(test_mode=test_mode)
            self.ftp_client = RakutenFTPClient(test_mode=test_mode)
        except Exception as e:
            self.logger.error(f"客户端初始化失败: {str(e)}")
            raise

    def _check_environment_variables(self):
        """检查真实API测试所需的环境变量"""
        required_vars = {
            "RAKUTEN_SERVICE_SECRET": "R-Cabinet API的服务密钥",
            "RAKUTEN_LICENSE_KEY": "R-Cabinet API的许可密钥",
            "RAKUTEN_FTP_HOST": "SFTP服务器地址",
            "RAKUTEN_FTP_USERNAME": "SFTP用户名",
            "RAKUTEN_FTP_PASSWORD": "SFTP密码",
        }

        missing_vars = []
        for var_name, description in required_vars.items():
            if not os.getenv(var_name):
                missing_vars.append(f"  - {var_name}: {description}")

        if missing_vars:
            self.logger.warning("⚠️  以下环境变量未设置:")
            for var in missing_vars:
                self.logger.warning(var)
            self.logger.warning("请设置这些环境变量或创建 .env 文件")

            # 询问是否继续
            try:
                response = input("\n是否继续测试？(y/N): ").strip().lower()
                if response not in ["y", "yes"]:
                    self.logger.info("测试已取消")
                    sys.exit(0)
            except KeyboardInterrupt:
                self.logger.info("\n测试已取消")
                sys.exit(0)
        else:
            self.logger.info("✅ 所有必需的环境变量已设置")

    def test_all_connections(self) -> Dict[str, Any]:
        """
        测试所有API连接

        Returns:
            完整的测试结果
        """
        results = {"test_mode": self.test_mode, "timestamp": time.time(), "tests": {}}

        # 测试R-Cabinet API
        self.logger.info("开始测试R-Cabinet API连接...")
        results["tests"]["cabinet"] = self._test_cabinet_api()

        # 测试SFTP连接
        self.logger.info("开始测试SFTP连接...")
        results["tests"]["sftp"] = self._test_sftp_connection()

        # 汇总结果
        all_success = all(
            test_result.get("success", False)
            for test_result in results["tests"].values()
        )

        results["overall_success"] = all_success
        results["summary"] = self._generate_summary(results["tests"])

        return results

    def _test_cabinet_api(self) -> Dict[str, Any]:
        """测试R-Cabinet API"""
        test_results = {"api_name": "R-Cabinet API", "success": False, "tests": {}}

        try:
            # 1. 连接测试
            self.logger.info("测试R-Cabinet API基础连接...")
            connection_result = self.cabinet_client.test_connection()
            test_results["tests"]["connection"] = connection_result

            if connection_result["success"]:
                # 2. 使用状况测试
                self.logger.info("测试获取使用状况...")
                usage_result = self._safe_api_call(
                    self.cabinet_client.get_usage, "获取使用状况"
                )
                test_results["tests"]["usage"] = usage_result

                # 3. 文件夹列表测试
                self.logger.info("测试获取文件夹列表...")
                folders_result = self._safe_api_call(
                    lambda: self.cabinet_client.get_folders(limit=5), "获取文件夹列表"
                )
                test_results["tests"]["folders"] = folders_result

                # 4. 健康检查测试
                self.logger.info("测试健康检查...")
                health_result = self._safe_api_call(
                    self.cabinet_client.health_check, "健康检查"
                )
                test_results["tests"]["health_check"] = health_result

                # 判断整体成功
                test_results["success"] = all(
                    result.get("success", False)
                    for result in test_results["tests"].values()
                )

        except Exception as e:
            test_results["error"] = str(e)
            test_results["error_type"] = type(e).__name__

        return test_results

    def _test_sftp_connection(self) -> Dict[str, Any]:
        """测试SFTP连接"""
        test_results = {"api_name": "SFTP Connection", "success": False, "tests": {}}

        try:
            # 1. 连接测试
            self.logger.info("测试SFTP基础连接...")
            connection_result = self.ftp_client.test_connection()
            test_results["tests"]["connection"] = connection_result

            if connection_result["success"]:
                # 2. 健康检查测试
                self.logger.info("测试SFTP健康检查...")
                health_result = self._safe_api_call(
                    self.ftp_client.health_check, "SFTP健康检查"
                )
                test_results["tests"]["health_check"] = health_result

                # 判断整体成功
                test_results["success"] = all(
                    result.get("success", False)
                    for result in test_results["tests"].values()
                )

        except Exception as e:
            test_results["error"] = str(e)
            test_results["error_type"] = type(e).__name__

        return test_results

    def _safe_api_call(self, api_func, description: str) -> Dict[str, Any]:
        """
        安全执行API调用

        Args:
            api_func: API函数
            description: 操作描述

        Returns:
            调用结果
        """
        try:
            start_time = time.time()
            result = api_func()
            duration = time.time() - start_time

            return {
                "success": True,
                "description": description,
                "duration_ms": round(duration * 1000, 2),
                "data": result,
            }
        except Exception as e:
            return {
                "success": False,
                "description": description,
                "error": str(e),
                "error_type": type(e).__name__,
            }

    def _generate_summary(self, test_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        生成测试结果摘要

        Args:
            test_results: 测试结果

        Returns:
            摘要信息
        """
        summary = {
            "total_apis": len(test_results),
            "successful_apis": 0,
            "failed_apis": 0,
            "total_tests": 0,
            "successful_tests": 0,
            "failed_tests": 0,
            "apis": {},
        }

        for api_name, api_result in test_results.items():
            api_summary = {
                "success": api_result.get("success", False),
                "test_count": len(api_result.get("tests", {})),
                "successful_tests": 0,
                "failed_tests": 0,
            }

            # 统计各个测试的成功失败情况
            for test_name, test_result in api_result.get("tests", {}).items():
                if test_result.get("success", False):
                    api_summary["successful_tests"] += 1
                    summary["successful_tests"] += 1
                else:
                    api_summary["failed_tests"] += 1
                    summary["failed_tests"] += 1

                summary["total_tests"] += 1

            # 统计API级别的成功失败
            if api_summary["success"]:
                summary["successful_apis"] += 1
            else:
                summary["failed_apis"] += 1

            summary["apis"][api_name] = api_summary

        return summary

    def print_results(self, results: Dict[str, Any]):
        """
        打印测试结果

        Args:
            results: 测试结果
        """
        print("\n" + "=" * 80)
        print("乐天API连接测试结果")
        print("=" * 80)
        print(f"测试模式: {results['test_mode']}")
        print(
            f"测试时间: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(results['timestamp']))}"
        )
        print(f"整体结果: {'✅ 成功' if results['overall_success'] else '❌ 失败'}")

        # 打印摘要
        summary = results["summary"]
        print(f"\n📊 测试摘要:")
        print(f"  - API总数: {summary['total_apis']}")
        print(f"  - 成功API: {summary['successful_apis']}")
        print(f"  - 失败API: {summary['failed_apis']}")
        print(f"  - 测试总数: {summary['total_tests']}")
        print(f"  - 成功测试: {summary['successful_tests']}")
        print(f"  - 失败测试: {summary['failed_tests']}")

        # 打印详细结果
        for api_name, api_result in results["tests"].items():
            print(f"\n🔗 {api_result['api_name']}:")
            print(f"  状态: {'✅ 成功' if api_result['success'] else '❌ 失败'}")

            if "error" in api_result:
                print(f"  错误: {api_result['error']}")
                continue

            # 打印各个测试的结果
            for test_name, test_result in api_result.get("tests", {}).items():
                status = "✅" if test_result.get("success", False) else "❌"
                print(f"    {status} {test_result.get('description', test_name)}")

                if not test_result.get("success", False) and "error" in test_result:
                    print(f"      错误: {test_result['error']}")
                elif "duration_ms" in test_result:
                    print(f"      耗时: {test_result['duration_ms']}ms")

        print("\n" + "=" * 80)


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="乐天API连接测试")
    parser.add_argument(
        "--mode",
        choices=["mock", "real"],
        default="mock",
        help="测试模式: mock(模拟) 或 real(真实API)",
    )
    parser.add_argument("--output", help="输出结果到JSON文件")
    parser.add_argument("--verbose", action="store_true", help="详细输出")

    args = parser.parse_args()

    try:
        # 创建测试器
        tester = RakutenAPITester(test_mode=args.mode)

        # 执行测试
        results = tester.test_all_connections()

        # 打印结果
        tester.print_results(results)

        # 保存结果到文件
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            print(f"\n💾 测试结果已保存到: {args.output}")

        # 返回适当的退出码
        sys.exit(0 if results["overall_success"] else 1)

    except Exception as e:
        print(f"❌ 测试执行失败: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
