# 乐天API集成技术文档

## 概述

本文档提供了与乐天RMS WEB SERVICE API集成的完整技术指南，重点关注R-Cabinet API、License Management API和FTP连接的实现细节。

## 1. 认证机制

### 1.1 认证信息

乐天API使用双重密钥认证：
- **serviceSecret**: RMS WEB SERVICE的利用者特定密钥（最大50字符）
- **licenseKey**: 访问店铺的特定密钥（最大50字符）

### 1.2 认证流程

1. **组合凭据**: 将`serviceSecret`和`licenseKey`用冒号连接
   ```
   格式: serviceSecret:licenseKey
   示例: aaa:bbb
   ```

2. **Base64编码**: 对组合后的字符串进行Base64编码
   ```python
   import base64
   credentials = f"{service_secret}:{license_key}"
   encoded = base64.b64encode(credentials.encode('utf-8')).decode('utf-8')
   # 结果: YWFhOmJiYg==
   ```

3. **构造Authorization头**:
   ```
   Authorization: ESA YWFhOmJiYg==
   ```

### 1.3 认证安全要求

- 严禁硬编码凭据
- 生产环境凭据必须加密存储
- 定期检查凭据有效期
- 实现凭据轮换机制

## 2. API规格详解

### 2.1 R-Cabinet REST API

**基础信息**:
- 基础URL: `https://api.rms.rakuten.co.jp/`
- 数据格式: XML
- 速率限制: 1请求/秒
- Content-Type: `text/xml`

**主要端点**:

#### 2.1.1 获取使用状况
```
GET /es/1.0/cabinet/usage/get
Authorization: ESA {Base64编码}
```

响应示例:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<result>
    <status>
        <interfaceId>cabinet.usage.get</interfaceId>
        <systemStatus>OK</systemStatus>
        <message>OK</message>
        <requestId>714a4983-555f-42d9-aeea-89dae89f2f55</requestId>
    </status>
    <cabinetUsageGetResult>
        <resultCode>0</resultCode>
        <MaxSpace>100</MaxSpace>
        <FolderMax>1000</FolderMax>
        <FileMax>10000</FileMax>
        <UseSpace>50.123</UseSpace>
        <AvailSpace>49.877</AvailSpace>
        <UseFolderCount>5</UseFolderCount>
        <AvailFolderCount>995</AvailFolderCount>
    </cabinetUsageGetResult>
</result>
```

#### 2.1.2 获取文件夹列表
```
GET /es/1.0/cabinet/folders/get?offset=1&limit=100
Authorization: ESA {Base64编码}
```

#### 2.1.3 文件上传
```
POST /es/1.0/cabinet/file/insert
Authorization: ESA {Base64编码}
Content-Type: multipart/form-data

Form Data:
- xml: XML请求参数
- file: 二进制文件数据（最大2MB，3840x3840px）
```

**支持的文件格式**: JPG, GIF, 动画GIF, PNG, TIFF, BMP
**注意**: PNG, TIFF, BMP会自动转换为JPG

### 2.2 License Management API

**基础信息**:
- 基础URL: `https://api.rms.rakuten.co.jp/`
- 数据格式: JSON
- 认证方式: 同R-Cabinet API

**关键端点**:
```
GET /es/1.0/license-management/license-key/expiry-date
Authorization: ESA {Base64编码}
```

### 2.3 FTP接口

**技术要求**:
- 使用Python内置`ftplib`库
- 连接信息由店铺配置动态提供
- 支持被动模式和主动模式
- 实现连接池管理

## 3. 错误处理策略

### 3.1 HTTP状态码映射

| HTTP状态码 | 含义 | 处理策略 |
|-----------|------|----------|
| 200 | 成功 | 正常处理响应 |
| 400 | 参数错误 | 验证请求参数，记录错误日志 |
| 401 | 认证错误 | 检查凭据有效性，触发重新认证 |
| 403 | 请求限制 | 实现退避重试机制 |
| 405 | 方法不允许 | 检查HTTP方法设置 |
| 500 | 服务器错误 | 记录错误，实现重试机制 |
| 503 | 服务不可用 | 触发降级策略 |

### 3.2 R-Cabinet特定错误码

| resultCode | 描述 | 处理策略 |
|------------|------|----------|
| 0 | 正常终了 | 继续处理 |
| 3001 | 参数错误 | 验证输入参数 |
| 3004 | 文件不存在 | 检查文件ID有效性 |
| 3005 | 文件夹不存在 | 验证文件夹ID |
| 3006 | 文件数上限 | 提示用户清理文件 |
| 3008 | 文件容量超限 | 压缩或拒绝上传 |
| 3012 | 可用容量不足 | 提示用户升级或清理 |
| 6001-6009 | 系统错误 | 记录错误，稍后重试 |

### 3.3 统一错误响应结构

```python
{
    "error": {
        "code": "RAKUTEN_API_ERROR",
        "message": "R-Cabinet API调用失败",
        "details": {
            "http_status": 400,
            "result_code": 3001,
            "interface_id": "cabinet.usage.get",
            "request_id": "714a4983-555f-42d9-aeea-89dae89f2f55"
        }
    }
}
```

## 4. 最佳实践

### 4.1 速率限制处理

```python
import time
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self, max_requests_per_second=1):
        self.max_requests_per_second = max_requests_per_second
        self.last_request_time = None
        
    def wait_if_needed(self):
        if self.last_request_time:
            elapsed = time.time() - self.last_request_time
            min_interval = 1.0 / self.max_requests_per_second
            if elapsed < min_interval:
                time.sleep(min_interval - elapsed)
        self.last_request_time = time.time()
```

### 4.2 重试机制

```python
import random
from functools import wraps

def retry_with_backoff(max_retries=3, base_delay=1, max_delay=60):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except (ConnectionError, TimeoutError) as e:
                    if attempt == max_retries - 1:
                        raise
                    delay = min(base_delay * (2 ** attempt) + random.uniform(0, 1), max_delay)
                    time.sleep(delay)
            return None
        return wrapper
    return decorator
```

### 4.3 XML响应解析

```python
import xml.etree.ElementTree as ET
from typing import Dict, Any

def parse_cabinet_response(xml_content: str) -> Dict[str, Any]:
    """解析R-Cabinet API的XML响应"""
    try:
        root = ET.fromstring(xml_content)
        
        # 解析状态信息
        status = root.find('status')
        result = {
            'interface_id': status.find('interfaceId').text,
            'system_status': status.find('systemStatus').text,
            'message': status.find('message').text,
            'request_id': status.find('requestId').text,
            'success': status.find('systemStatus').text == 'OK'
        }
        
        # 解析具体结果
        if result['success']:
            # 根据不同的interfaceId解析不同的结果结构
            if 'usage.get' in result['interface_id']:
                usage_result = root.find('cabinetUsageGetResult')
                result['data'] = {
                    'result_code': int(usage_result.find('resultCode').text),
                    'max_space': int(usage_result.find('MaxSpace').text),
                    'folder_max': int(usage_result.find('FolderMax').text),
                    'file_max': int(usage_result.find('FileMax').text),
                    'use_space': float(usage_result.find('UseSpace').text),
                    'avail_space': float(usage_result.find('AvailSpace').text),
                    'use_folder_count': int(usage_result.find('UseFolderCount').text),
                    'avail_folder_count': int(usage_result.find('AvailFolderCount').text),
                }
        
        return result
        
    except ET.ParseError as e:
        raise ValueError(f"XML解析错误: {e}")
    except Exception as e:
        raise ValueError(f"响应解析失败: {e}")
```

### 4.4 凭据管理

```python
import os
import base64
from cryptography.fernet import Fernet

class CredentialsManager:
    def __init__(self, encryption_key: bytes = None):
        self.cipher = Fernet(encryption_key or Fernet.generate_key())
    
    def encrypt_credentials(self, service_secret: str, license_key: str) -> str:
        """加密存储凭据"""
        credentials = f"{service_secret}:{license_key}"
        encrypted = self.cipher.encrypt(credentials.encode())
        return base64.b64encode(encrypted).decode()
    
    def decrypt_credentials(self, encrypted_credentials: str) -> tuple:
        """解密凭据"""
        encrypted_bytes = base64.b64decode(encrypted_credentials)
        decrypted = self.cipher.decrypt(encrypted_bytes).decode()
        return tuple(decrypted.split(':', 1))
    
    def create_auth_header(self, service_secret: str, license_key: str) -> str:
        """创建认证头"""
        credentials = f"{service_secret}:{license_key}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return f"ESA {encoded}"
```

## 5. 前置条件和限制

### 5.1 R-Cabinet访问前置条件

**重要**: 在使用CabinetAPI之前，必须至少一次通过RMS网页后台访问R-Cabinet：

1. 登录RMS后台
2. 导航到：RMS主菜单 > 1 店铺设置 > 1-3 画像・动画登录 > 画像管理
3. 首次访问R-Cabinet界面

如果未完成此步骤，API调用将返回`AuthError`：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<result>
    <status>
        <interfaceId>cabinet.usage.get</interfaceId>
        <systemStatus>NG</systemStatus>
        <message>AuthError</message>
        <requestId>b69733e9-89da-4bff-a876-7f36041db0b9</requestId>
    </status>
</result>
```

### 5.2 技术限制

- **请求频率**: 1秒1次请求（严格限制）
- **文件大小**: 单文件最大2MB
- **图片尺寸**: 最大3840x3840像素
- **搜索结果**: 最大50,000条记录
- **数据同步**: API操作后最短10秒反映到查询结果

### 5.3 出店计划限制

不同的出店计划对画像管理有不同限制，详见[店铺运营Navi](https://navi-manual.faq.rakuten.net/rule/000031730)。

## 6. 监控和日志

### 6.1 日志格式

```python
import logging
import json

def setup_rakuten_api_logger():
    logger = logging.getLogger('rakuten_api')
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    return logger

def log_api_call(logger, endpoint, request_data, response_data, duration):
    log_entry = {
        'endpoint': endpoint,
        'request_size': len(str(request_data)),
        'response_status': response_data.get('system_status'),
        'request_id': response_data.get('request_id'),
        'duration_ms': round(duration * 1000, 2),
        'timestamp': datetime.utcnow().isoformat()
    }
    logger.info(json.dumps(log_entry))
```

### 6.2 健康检查

```python
async def health_check_rakuten_api():
    """检查乐天API服务健康状态"""
    try:
        # 调用最轻量的API端点
        response = await call_cabinet_usage_get()
        return {
            'status': 'healthy',
            'response_time': response.get('duration'),
            'last_check': datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e),
            'last_check': datetime.utcnow().isoformat()
        }
```

## 7. 测试策略

### 7.1 单元测试模拟

```python
import unittest.mock as mock

@mock.patch('requests.get')
def test_cabinet_usage_get_success(mock_get):
    mock_response = mock.Mock()
    mock_response.status_code = 200
    mock_response.text = '''<?xml version="1.0" encoding="UTF-8"?>
    <result>
        <status>
            <systemStatus>OK</systemStatus>
        </status>
        <cabinetUsageGetResult>
            <resultCode>0</resultCode>
            <MaxSpace>100</MaxSpace>
        </cabinetUsageGetResult>
    </result>'''
    mock_get.return_value = mock_response
    
    # 测试API调用
    result = cabinet_usage_get()
    assert result['success'] is True
    assert result['data']['max_space'] == 100
```

### 7.2 集成测试配置

```python
# test_settings.py
RAKUTEN_API_TEST_MODE = os.getenv('RAKUTEN_API_TEST_MODE', 'mock')
RAKUTEN_TEST_SERVICE_SECRET = os.getenv('RAKUTEN_TEST_SERVICE_SECRET', 'test_secret')
RAKUTEN_TEST_LICENSE_KEY = os.getenv('RAKUTEN_TEST_LICENSE_KEY', 'test_license')
```

## 8. 部署注意事项

### 8.1 环境变量配置

```bash
# 生产环境
RAKUTEN_SERVICE_SECRET=your_encrypted_service_secret
RAKUTEN_LICENSE_KEY=your_encrypted_license_key
RAKUTEN_API_BASE_URL=https://api.rms.rakuten.co.jp
RAKUTEN_API_TIMEOUT=30
RAKUTEN_API_MAX_RETRIES=3

# 开发环境
RAKUTEN_API_TEST_MODE=mock
RAKUTEN_TEST_SERVICE_SECRET=test_secret
RAKUTEN_TEST_LICENSE_KEY=test_license
```

### 8.2 网络配置

确保以下网络访问：
- 出站HTTPS (443端口) 到 `api.rms.rakuten.co.jp`
- 如使用FTP，确保FTP端口（21及数据端口）可访问
- 配置适当的超时和重试设置

## 9. 故障排除

### 9.1 常见问题

**Q: 收到AuthError错误**
A: 检查以下项目：
1. serviceSecret和licenseKey是否正确
2. Base64编码是否正确（注意换行符）
3. 是否已通过RMS后台首次访问R-Cabinet
4. 凭据是否在有效期内

**Q: 请求频率限制错误**
A: 实现请求队列，确保严格遵守1秒1次的限制

**Q: XML解析错误**
A: 检查响应内容编码，确保使用UTF-8解析

### 9.2 调试工具

```python
def debug_api_call(endpoint, headers, data=None):
    """调试API调用的工具函数"""
    print(f"=== DEBUG API CALL ===")
    print(f"Endpoint: {endpoint}")
    print(f"Headers: {headers}")
    if data:
        print(f"Data: {data}")
    print("=" * 20)
```

---

**文档版本**: 1.0  
**最后更新**: 2025年  
**维护者**: Pagemaker开发团队

## 10. 备用方案和降级策略

### 10.1 降级策略概述

为确保系统在乐天API不可用时仍能正常运行，实现了多层次的降级和备用方案：

#### 10.1.1 降级级别

1. **Level 1 - 重试机制**: 自动重试失败的API调用
2. **Level 2 - 断路器模式**: 快速失败，避免级联故障
3. **Level 3 - 缓存降级**: 使用缓存数据提供服务
4. **Level 4 - 功能降级**: 禁用特定功能，保持核心功能
5. **Level 5 - 紧急模式**: 完全禁用API集成

#### 10.1.2 自动触发条件

```python
# 降级触发条件
DEGRADATION_TRIGGERS = {
    "api_error_rate": 0.1,        # 10%错误率
    "response_time_ms": 5000,     # 5秒响应时间
    "consecutive_failures": 5,     # 连续5次失败
    "circuit_breaker_open": True,  # 断路器开启
}
```

### 10.2 断路器模式实现

#### 10.2.1 断路器状态

- **CLOSED**: 正常状态，允许所有请求通过
- **OPEN**: 断开状态，快速失败所有请求
- **HALF_OPEN**: 半开状态，允许少量请求测试服务恢复

#### 10.2.2 使用示例

```python
from pagemaker.integrations.fallback_strategies import execute_with_fallback

def get_cabinet_usage_with_fallback():
    """带降级的获取R-Cabinet使用情况"""
    
    def primary_call():
        return cabinet_client.get_usage()
    
    def fallback_call():
        # 返回缓存数据或默认值
        cached_data = get_cached_usage()
        if cached_data:
            return cached_data
        return {
            "max_space": 100,
            "used_space": 0,
            "available_space": 100,
            "from_cache": True
        }
    
    return execute_with_fallback(
        service_name="cabinet_api",
        primary_func=primary_call,
        fallback_func=fallback_call
    )
```

### 10.3 功能开关（Feature Flag）

#### 10.3.1 可控制的功能

```python
FEATURE_FLAGS = {
    "cabinet_api_enabled": True,      # R-Cabinet API
    "license_api_enabled": True,      # License Management API  
    "ftp_service_enabled": True,      # FTP文件上传
    "auto_retry_enabled": True,       # 自动重试
    "cache_fallback_enabled": True,   # 缓存降级
}
```

#### 10.3.2 动态控制

```python
from pagemaker.integrations.fallback_strategies import get_fallback_manager

# 运行时禁用功能
manager = get_fallback_manager()
manager.disable_feature("cabinet_api_enabled")

# 检查功能状态
if manager.is_feature_enabled("cabinet_api_enabled"):
    # 执行API调用
    pass
else:
    # 使用备用方案
    pass
```

### 10.4 缓存降级策略

#### 10.4.1 缓存层次

1. **L1 - 内存缓存**: 最近访问的数据（TTL: 5分钟）
2. **L2 - 数据库缓存**: 较长期的数据（TTL: 1小时）
3. **L3 - 静态数据**: 默认配置和模拟数据

#### 10.4.2 缓存实现

```python
def get_with_cache_fallback(cache_key: str, api_call_func, ttl: int = 300):
    """带缓存降级的数据获取"""
    
    # 尝试从缓存获取
    cached_data = get_cached_response(cache_key)
    if cached_data:
        return cached_data
    
    try:
        # 调用API
        data = api_call_func()
        # 缓存结果
        cache_response(cache_key, data, ttl)
        return data
    except Exception as e:
        # API失败，返回过期缓存或默认值
        expired_cache = get_expired_cache(cache_key)
        if expired_cache:
            return {**expired_cache, "from_expired_cache": True}
        
        # 返回默认值
        return get_default_data(cache_key)
```

### 10.5 FTP连接备用方案

#### 10.5.1 多重备用策略

1. **主要FTP服务器**: 乐天提供的FTP服务器
2. **备用FTP服务器**: 如果配置了多个FTP服务器
3. **本地存储**: 临时存储文件，稍后同步
4. **禁用上传**: 仅允许查看和管理现有文件

#### 10.5.2 实现示例

```python
def upload_file_with_fallback(file_data, filename):
    """带备用方案的文件上传"""
    
    upload_strategies = [
        ("primary_ftp", upload_to_primary_ftp),
        ("backup_ftp", upload_to_backup_ftp),
        ("local_storage", save_to_local_storage),
    ]
    
    for strategy_name, upload_func in upload_strategies:
        try:
            result = upload_func(file_data, filename)
            logger.info(f"文件上传成功，策略: {strategy_name}")
            return result
        except Exception as e:
            logger.warning(f"上传策略 {strategy_name} 失败: {e}")
            continue
    
    # 所有策略都失败
    raise Exception("所有文件上传策略都失败")
```

### 10.6 API配额管理

#### 10.6.1 配额监控

```python
class QuotaManager:
    def __init__(self):
        self.daily_quota = 10000  # 每日请求限制
        self.hourly_quota = 500   # 每小时请求限制
        self.current_usage = {"daily": 0, "hourly": 0}
        self.reset_times = {}
    
    def check_quota(self) -> bool:
        """检查是否还有配额"""
        if self.current_usage["hourly"] >= self.hourly_quota:
            return False
        if self.current_usage["daily"] >= self.daily_quota:
            return False
        return True
    
    def consume_quota(self):
        """消耗配额"""
        self.current_usage["hourly"] += 1
        self.current_usage["daily"] += 1
```

#### 10.6.2 配额耗尽处理

```python
def handle_quota_exhausted():
    """处理配额耗尽"""
    # 1. 启用严格缓存模式
    enable_strict_cache_mode()
    
    # 2. 延迟非关键请求
    delay_non_critical_requests()
    
    # 3. 通知管理员
    send_quota_alert()
    
    # 4. 记录事件
    logger.critical("API配额耗尽，启用降级模式")
```

### 10.7 紧急情况处理

#### 10.7.1 紧急禁用所有API

```python
from pagemaker.integrations.fallback_strategies import emergency_disable_all

# 紧急情况下禁用所有API
emergency_disable_all()
```

#### 10.7.2 紧急缓存模式

```python
from pagemaker.integrations.fallback_strategies import emergency_cache_only

# 启用仅缓存模式
emergency_cache_only()
```

#### 10.7.3 手动干预程序

```python
def manual_intervention_checklist():
    """手动干预检查清单"""
    checklist = [
        "1. 检查乐天API服务状态",
        "2. 验证网络连接",
        "3. 检查凭据有效性", 
        "4. 查看系统日志",
        "5. 重置断路器",
        "6. 清理缓存",
        "7. 重启服务（如需要）",
        "8. 通知相关人员",
    ]
    
    for item in checklist:
        print(f"☐ {item}")
    
    return checklist
```

### 10.8 监控和告警

#### 10.8.1 监控指标

```python
MONITORING_METRICS = {
    "api_success_rate": "API成功率",
    "api_response_time": "API响应时间", 
    "circuit_breaker_state": "断路器状态",
    "cache_hit_rate": "缓存命中率",
    "quota_usage": "配额使用情况",
    "error_rate": "错误率",
}
```

#### 10.8.2 告警阈值

```python
ALERT_THRESHOLDS = {
    "api_success_rate": 0.95,      # 95%
    "api_response_time_ms": 5000,  # 5秒
    "error_rate": 0.05,            # 5%
    "quota_usage": 0.8,            # 80%
}
```

#### 10.8.3 告警通知

```python
def send_alert(metric_name: str, current_value: float, threshold: float):
    """发送告警通知"""
    alert_message = f"""
    🚨 乐天API告警
    
    指标: {metric_name}
    当前值: {current_value}
    阈值: {threshold}
    时间: {datetime.now().isoformat()}
    
    建议操作:
    1. 检查API服务状态
    2. 查看系统日志
    3. 考虑启用降级模式
    """
    
    # 发送邮件、短信或其他通知方式
    send_notification(alert_message)
```

### 10.9 恢复策略

#### 10.9.1 自动恢复

```python
def auto_recovery_check():
    """自动恢复检查"""
    
    # 检查API是否恢复
    if test_api_connectivity():
        # 逐步恢复功能
        gradual_recovery()
    else:
        # 延长降级时间
        extend_degradation_period()
```

#### 10.9.2 渐进式恢复

```python
def gradual_recovery():
    """渐进式恢复正常服务"""
    
    recovery_steps = [
        ("重置断路器", reset_circuit_breakers),
        ("启用缓存降级", enable_cache_fallback),
        ("启用License API", enable_license_api),
        ("启用R-Cabinet API", enable_cabinet_api),
        ("启用FTP服务", enable_ftp_service),
        ("恢复正常模式", restore_normal_mode),
    ]
    
    for step_name, step_func in recovery_steps:
        try:
            step_func()
            logger.info(f"恢复步骤完成: {step_name}")
            time.sleep(30)  # 等待30秒观察
        except Exception as e:
            logger.error(f"恢复步骤失败: {step_name}, 错误: {e}")
            # 回滚到上一个稳定状态
            rollback_to_previous_state()
            break
```

### 10.10 数据库迁移回滚

#### 10.10.1 迁移脚本

```python
# migrations/rollback_integration.py
def rollback_integration_tables():
    """回滚集成相关的数据库表"""
    
    rollback_sql = """
    -- 删除API凭据表
    DROP TABLE IF EXISTS rakuten_api_credentials;
    
    -- 删除API调用日志表
    DROP TABLE IF EXISTS rakuten_api_logs;
    
    -- 删除缓存表
    DROP TABLE IF EXISTS rakuten_api_cache;
    """
    
    execute_sql(rollback_sql)
```

#### 10.10.2 配置回滚

```python
def rollback_configuration():
    """回滚配置更改"""
    
    # 移除环境变量
    remove_env_vars([
        "RAKUTEN_SERVICE_SECRET",
        "RAKUTEN_LICENSE_KEY", 
        "RAKUTEN_API_ENABLED",
    ])
    
    # 恢复默认配置
    restore_default_settings()
```

### 10.11 测试降级策略

#### 10.11.1 混沌工程测试

```python
def chaos_test_api_failure():
    """混沌工程：模拟API故障"""
    
    # 模拟网络故障
    with mock_network_failure():
        test_api_fallback()
    
    # 模拟API限流
    with mock_rate_limiting():
        test_rate_limit_handling()
    
    # 模拟服务不可用
    with mock_service_unavailable():
        test_service_degradation()
```

#### 10.11.2 降级测试用例

```python
def test_fallback_scenarios():
    """测试各种降级场景"""
    
    test_cases = [
        "API认证失败",
        "网络连接超时",
        "服务返回错误",
        "配额耗尽",
        "断路器开启",
        "缓存失效",
    ]
    
    for test_case in test_cases:
        logger.info(f"测试降级场景: {test_case}")
        result = simulate_failure_scenario(test_case)
        assert result["fallback_triggered"], f"降级未触发: {test_case}"
```

---

**备用方案文档版本**: 1.0  
**最后更新**: 2025年  
**维护者**: Pagemaker开发团队 