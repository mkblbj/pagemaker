# 乐天API集成模块使用指南

## 概述

本模块提供了与乐天API系统的集成功能，包括：
- **R-Cabinet API**: 文件存储和管理
- **SFTP服务**: 安全文件传输服务 (端口22)

## 快速开始

### 1. 安装依赖

```bash
cd apps/backend
pip install -r requirements.txt
```

### 2. 配置环境变量

#### 模拟测试（推荐用于开发）
```bash
# 使用模拟模式，无需真实API凭据
python test_connections.py --mode mock
```

#### 真实API测试
1. 编辑项目根目录的 `.env` 文件，添加乐天API凭据：
```bash
# 乐天API配置
RAKUTEN_SERVICE_SECRET=your-actual-service-secret
RAKUTEN_LICENSE_KEY=your-actual-license-key

# FTP配置
RAKUTEN_FTP_HOST=your-ftp-host.rakuten.co.jp
RAKUTEN_FTP_USERNAME=your-ftp-username
RAKUTEN_FTP_PASSWORD=your-ftp-password
```

3. 运行真实API测试：
```bash
python test_connections.py --mode real
```

## 测试命令

### 基础测试
```bash
# 模拟模式测试（默认）
python test_connections.py

# 指定模拟模式
python test_connections.py --mode mock

# 真实API测试
python test_connections.py --mode real
```

### 详细测试输出
```bash
# 显示详细日志
python test_connections.py --mode real --verbose

# 保存测试结果到文件
python test_connections.py --mode real --output results.json
```

## 环境变量说明

### 必需变量（真实API测试）
| 变量名 | 说明 | 示例 |
|--------|------|------|
| `RAKUTEN_SERVICE_SECRET` | R-Cabinet API服务密钥 | `abc123...` |
| `RAKUTEN_LICENSE_KEY` | R-Cabinet API许可密钥 | `xyz789...` |
| `RAKUTEN_FTP_HOST` | SFTP服务器地址 (端口22) | `upload.rakuten.ne.jp` |
| `RAKUTEN_FTP_USERNAME` | SFTP用户名 | `your_username` |
| `RAKUTEN_FTP_PASSWORD` | SFTP密码 | `your_password` |

### 可选变量
| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `RAKUTEN_API_BASE_URL` | API基础URL | `https://api.rms.rakuten.co.jp` |
| `RAKUTEN_API_TIMEOUT` | API请求超时（秒） | `30` |
| `RAKUTEN_API_RETRY_COUNT` | 重试次数 | `3` |
| `LOG_LEVEL` | 日志级别 | `INFO` |

## 测试结果解读

### 成功示例
```
================================================================================
乐天API连接测试结果
================================================================================
测试模式: real
整体结果: ✅ 成功

📊 测试摘要:
  - API总数: 3
  - 成功API: 3
  - 失败API: 0
```

### 失败处理
如果测试失败，请检查：

1. **网络连接**: 确保可以访问 `https://api.rms.rakuten.co.jp`
2. **API凭据**: 验证 `RAKUTEN_SERVICE_SECRET` 和 `RAKUTEN_LICENSE_KEY` 正确
3. **SFTP配置**: 验证SFTP服务器地址、用户名和密码 (端口22)
4. **权限**: 确认API密钥有相应的访问权限

### 常见错误

#### 环境变量未设置
```
⚠️  以下环境变量未设置:
  - RAKUTEN_SERVICE_SECRET: R-Cabinet和License Management API的服务密钥
```
**解决方案**: 创建 `.env` 文件并配置相应变量

#### 认证失败
```
❌ R-Cabinet API 认证失败
```
**解决方案**: 检查 `RAKUTEN_SERVICE_SECRET` 和 `RAKUTEN_LICENSE_KEY` 是否正确

#### 网络连接失败
```
❌ 网络连接超时
```
**解决方案**: 检查网络连接和防火墙设置

## 安全注意事项

⚠️ **重要安全提醒**:
- 绝不要将 `.env` 文件提交到版本控制系统
- API凭据应妥善保管，避免泄露
- 生产环境中使用专用的API密钥
- 定期轮换API密钥

## 故障排除

### 1. python-dotenv 未安装
```bash
pip install python-dotenv==1.0.1
```

### 2. .env 文件未找到
确保 `.env` 文件位于项目根目录：
- `/home/uo/uomain/pagemaker/.env` (项目根目录)

### 3. 权限问题
确保运行用户有读取 `.env` 文件的权限：
```bash
chmod 600 .env
```

## 开发指南

### 添加新的API集成
1. 在相应的客户端类中添加新方法
2. 在 `test_connections.py` 中添加相应测试
3. 更新文档和示例

### 模拟模式开发
- 所有API调用都会返回模拟数据
- 无需真实API凭据
- 适合开发和CI/CD环境

### 真实API测试
- 仅在有真实凭据时使用
- 用于验证集成的正确性
- 请谨慎使用，避免超出API配额

## 🚀 快速开始

### 1. 安装依赖

```bash
pip install requests python-dotenv
```

### 2. 配置环境变量

编辑项目根目录的 `.env` 文件，添加乐天API凭据：

```bash
# 在项目根目录编辑 .env 文件
# /home/uo/uomain/pagemaker/.env

# 乐天API配置
RAKUTEN_SERVICE_SECRET=your-actual-service-secret
RAKUTEN_LICENSE_KEY=your-actual-license-key

# SFTP配置 (端口22)
RAKUTEN_FTP_HOST=upload.rakuten.ne.jp
RAKUTEN_FTP_USERNAME=your-sftp-username
RAKUTEN_FTP_PASSWORD=your-sftp-password

# API测试模式
RAKUTEN_API_TEST_MODE=real
```

### 3. 运行连接测试

```bash
# 测试模拟API（不需要真实凭据）
python test_connections.py --mode mock

# 测试真实API（需要配置环境变量）
python test_connections.py --mode real

# 保存测试结果到文件
python test_connections.py --mode real --output test_results.json
```

## 📁 模块结构

```
integrations/
├── __init__.py              # 模块初始化
├── constants.py             # 常量定义
├── exceptions.py            # 自定义异常类
├── utils.py                 # 工具函数
├── cabinet_client.py        # R-Cabinet API客户端
├── license_client.py        # License Management API客户端
├── ftp_client.py           # FTP连接客户端
├── monitoring.py           # 监控和指标收集
├── test_connections.py     # 连接测试脚本
├── setup_env.py            # 环境变量设置脚本
├── .env.template           # 环境变量模板
├── .gitignore              # Git忽略文件
└── README.md               # 本文档
```

## 🔧 API客户端使用

### R-Cabinet API客户端

```python
from pagemaker.integrations.cabinet_client import RCabinetClient

# 初始化客户端
client = RCabinetClient(test_mode="real")

# 获取使用状况
usage = client.get_usage()
print(f"已使用空间: {usage['data']['use_space']} MB")

# 获取文件夹列表
folders = client.get_folders(limit=10)
print(f"文件夹数量: {folders['data']['folder_count']}")

# 搜索文件
files = client.search_files(file_name="example.jpg")
print(f"找到文件: {files['data']['file_count']} 个")
```

### License Management API客户端

```python
from pagemaker.integrations.license_client import LicenseManagementClient

# 初始化客户端
client = LicenseManagementClient(test_mode="real")

# 获取许可证过期日期
license_info = client.get_license_expiry_date()
print(f"许可证过期日期: {license_info['expiry_date']}")
```

### FTP客户端

```python
from pagemaker.integrations.ftp_client import RakutenFTPClient

# 使用上下文管理器
with RakutenFTPClient(test_mode="real") as ftp:
    # 列出文件
    files = ftp.list_files()
    print(f"FTP文件列表: {files}")
```

## 📊 监控和指标

```python
from pagemaker.integrations.monitoring import get_global_dashboard

# 获取监控面板
dashboard = get_global_dashboard()

# 生成监控报告
report = dashboard.generate_report()
print(report)

# 获取健康状态
health = dashboard.get_dashboard_data()
print(f"系统状态: {health['health']['status']}")
```

## 🛠️ 环境变量说明

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `RAKUTEN_API_TEST_MODE` | 测试模式 (`real`/`mock`) | 否 | `mock` |
| `RAKUTEN_SERVICE_SECRET` | 服务密钥 | 是* | - |
| `RAKUTEN_LICENSE_KEY` | 许可密钥 | 是* | - |
| `RAKUTEN_FTP_HOST` | FTP服务器地址 | 是* | - |
| `RAKUTEN_FTP_USERNAME` | FTP用户名 | 是* | - |
| `RAKUTEN_FTP_PASSWORD` | FTP密码 | 是* | - |
| `RAKUTEN_API_BASE_URL` | API基础URL | 否 | `https://api.rms.rakuten.co.jp` |
| `RAKUTEN_API_TIMEOUT` | 请求超时时间(秒) | 否 | `30` |

*注：仅在`test_mode="real"`时必需

## 🔒 安全注意事项

1. **永远不要将`.env`文件提交到版本控制系统**
2. **使用最小权限原则**：只授予必要的API权限
3. **定期轮换凭据**：建议定期更换API密钥
4. **监控API使用**：定期检查API调用日志
5. **使用HTTPS**：确保所有API调用都通过HTTPS

## 🚨 错误处理

模块提供了完整的异常体系：

```python
from pagemaker.integrations.exceptions import (
    RakutenAPIError,
    RakutenAuthError,
    RakutenConnectionError,
    RakutenRateLimitError
)

try:
    result = client.get_usage()
except RakutenAuthError:
    print("认证失败，请检查API凭据")
except RakutenConnectionError:
    print("网络连接错误")
except RakutenRateLimitError:
    print("API调用频率超限")
except RakutenAPIError as e:
    print(f"API调用失败: {e.message}")
```

## 📈 性能优化

1. **速率限制**：自动限制API调用频率（每秒1次）
2. **重试机制**：自动重试失败的请求
3. **连接池**：复用HTTP连接
4. **缓存策略**：在降级模式下使用缓存数据

## 🔧 故障排除

### 常见问题

1. **认证失败**
   - 检查`RAKUTEN_SERVICE_SECRET`和`RAKUTEN_LICENSE_KEY`是否正确
   - 确认API凭据未过期

2. **连接超时**
   - 检查网络连接
   - 增加`RAKUTEN_API_TIMEOUT`值

3. **FTP连接失败**
   - 检查FTP服务器地址、用户名和密码
   - 确认FTP服务器可访问

### 调试模式

设置环境变量启用详细日志：

```bash
export RAKUTEN_LOG_LEVEL=DEBUG
python test_connections.py --mode real --verbose
```

## 📚 相关文档

- [乐天API技术文档](../../../docs/rakuten-api-integration.md)
- [API风险评估](../../../docs/rakuten-api-risks-and-limitations.md)
- [降级策略](../../../docs/rakuten-api-fallback-strategies.md)

## 🤝 贡献

如需贡献代码或报告问题，请遵循项目的贡献指南。

## 📄 许可证

本项目遵循项目根目录的许可证条款。 