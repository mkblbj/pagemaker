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