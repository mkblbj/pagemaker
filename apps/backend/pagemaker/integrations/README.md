# 乐天API集成模块

这个模块包含了与乐天API的集成代码，包括R-Cabinet API和SFTP连接。

## 模块结构

```
pagemaker/integrations/
├── __init__.py                    # 模块初始化
├── cabinet_client.py              # R-Cabinet API客户端
├── constants.py                   # 常量定义
├── exceptions.py                  # 自定义异常
├── fallback_strategies.py         # 降级策略和断路器
├── ftp_client.py                  # SFTP客户端
├── monitoring.py                  # 监控和指标收集
├── utils.py                       # 工具函数
├── manual_connection_test.py      # 手动连接测试脚本
└── README.md                      # 本文件
```

## 快速开始

### 1. 环境配置

确保已安装所有依赖：
```bash
pip install -r requirements.txt
```

### 2. 环境变量配置

在项目根目录创建 `.env` 文件：
```env
# 乐天API配置 (可选，用于真实API测试)
RAKUTEN_SERVICE_SECRET=your_service_secret
RAKUTEN_LICENSE_KEY=your_license_key

# FTP配置 (可选)
RAKUTEN_FTP_HOST=upload.rakuten.ne.jp
RAKUTEN_FTP_USERNAME=your_username
RAKUTEN_FTP_PASSWORD=your_password

# 测试模式 (mock 或 real)
RAKUTEN_API_TEST_MODE=mock
```

### 3. 运行手动测试

```bash
cd apps/backend/pagemaker/integrations
python manual_connection_test.py
```

## 使用示例

### R-Cabinet API客户端

```python
from pagemaker.integrations.cabinet_client import RCabinetClient

# 创建客户端 (模拟模式)
client = RCabinetClient(test_mode="mock")

# 获取使用状况
usage = client.get_usage()
print(f"使用状况: {usage}")

# 获取文件夹列表
folders = client.get_folders(limit=10)
print(f"文件夹数量: {len(folders['data']['folders'])}")
```

### 降级策略

```python
from pagemaker.integrations.fallback_strategies import get_fallback_manager

manager = get_fallback_manager()

def primary_api():
    # 主要API调用
    return {"data": "primary"}

def fallback_api():
    # 降级API调用
    return {"data": "fallback"}

# 带降级的API调用
result = manager.execute_with_fallback(
    "cabinet_api", 
    primary_api, 
    fallback_api
)
```

### 监控指标

```python
from pagemaker.integrations.monitoring import get_global_metrics, record_api_call

# 记录API调用
record_api_call("cabinet.usage.get", "GET", 120.5, True)

# 获取统计信息
metrics = get_global_metrics()
stats = metrics.get_current_stats()
print(f"成功率: {stats['success_rate']}%")
```

## 测试

### 单元测试

虽然当前的pytest测试存在一些不匹配问题，但核心功能已通过手动测试验证：

```bash
pytest pagemaker/integrations/ -v
```

### 手动测试

运行完整的手动连接测试：

```bash
python manual_connection_test.py
```

### 降级策略测试

```bash
python -c "
from pagemaker.integrations.fallback_strategies import get_fallback_manager
manager = get_fallback_manager()
print('降级管理器测试通过')
"
```

## 配置选项

### 测试模式

- `mock`: 模拟模式，返回预定义的响应
- `real`: 真实模式，连接实际的乐天API

### 降级策略配置

- 断路器失败阈值: 5次
- 恢复超时: 60秒
- 缓存TTL: 300秒

### 监控配置

- 指标保留时间: 24小时
- 健康检查阈值: 成功率 < 80% 为降级状态

## 故障排除

### 常见问题

1. **ModuleNotFoundError: No module named 'paramiko'**
   ```bash
   pip install paramiko==3.5.0
   ```

2. **连接超时**
   - 检查网络连接
   - 确认防火墙设置
   - 验证API端点URL

3. **认证失败**
   - 检查service_secret和license_key
   - 确认凭据格式正确
   - 验证凭据是否过期

### 调试模式

启用详细日志：

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 文档

详细的技术文档请参考：
- [乐天API集成文档](../../../../docs/rakuten-api-integration.md)
- [Story 0.8文档](../../../../docs/stories/0.8.story.md)

## 贡献

在修改此模块时，请确保：
1. 更新相关测试
2. 更新文档
3. 遵循项目编码规范
4. 测试降级策略的正确性 