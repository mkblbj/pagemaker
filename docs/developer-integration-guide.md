# R-Cabinet集成开发者指南

## 概述

本指南为开发者提供R-Cabinet集成的详细实现指导，包含代码示例、最佳实践和常见问题解决方案。

## 快速开始

### 1. 基础配置

```python
# .env文件配置
RAKUTEN_SERVICE_SECRET=your_service_secret
RAKUTEN_LICENSE_KEY=your_license_key
RAKUTEN_API_TEST_MODE=mock  # 开发时使用mock模式
RCABINET_INTEGRATION_ENABLED=True
```

### 2. 基础使用

```python
from pagemaker.integrations.cabinet_client import RCabinetClient

# 初始化客户端
client = RCabinetClient(test_mode='mock')

# 测试连接
result = client.test_connection()
print(f"连接状态: {result['success']}")

# 获取使用状况
usage = client.get_usage()
print(f"已用空间: {usage['data']['use_space']}MB")
```

## 文件上传集成

### 1. 前端文件上传

```javascript
// React组件示例
import { useState } from 'react';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt_text', '用户上传的图片');
    
    try {
      const response = await fetch('/api/v1/media/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        alert('上传成功！');
      } else {
        alert(`上传失败: ${data.error.message}`);
      }
    } catch (error) {
      alert(`上传异常: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button 
        onClick={handleUpload} 
        disabled={!file || uploading}
      >
        {uploading ? '上传中...' : '上传文件'}
      </button>
      
      {result && (
        <div>
          <p>文件ID: {result.rcabinet_file_id}</p>
          <p>文件URL: {result.rcabinet_url}</p>
          <img src={result.rcabinet_url} alt="上传的图片" />
        </div>
      )}
    </div>
  );
}
```

### 2. 后端API集成

```python
# views.py 扩展示例
from rest_framework.decorators import api_view
from rest_framework.response import Response
from media.models import MediaFile
from media.validators import validate_uploaded_file

@api_view(['POST'])
def batch_upload(request):
    """批量文件上传"""
    files = request.FILES.getlist('files')
    results = []
    
    for uploaded_file in files:
        # 验证文件
        is_valid, error_msg = validate_uploaded_file(uploaded_file)
        if not is_valid:
            results.append({
                'filename': uploaded_file.name,
                'success': False,
                'error': error_msg
            })
            continue
        
        # 创建数据库记录
        media_file = MediaFile.objects.create(
            user=request.user,
            original_filename=uploaded_file.name,
            file_size=uploaded_file.size,
            content_type=uploaded_file.content_type,
            upload_status='pending'
        )
        
        # 异步处理上传（推荐用于批量上传）
        upload_to_rcabinet.delay(media_file.id, uploaded_file.read())
        
        results.append({
            'filename': uploaded_file.name,
            'success': True,
            'media_file_id': media_file.id
        })
    
    return Response({'results': results})
```

### 3. 异步上传处理

```python
# tasks.py (使用Celery)
from celery import shared_task
from pagemaker.integrations.cabinet_client import RCabinetClient
from media.models import MediaFile

@shared_task(bind=True, max_retries=3)
def upload_to_rcabinet(self, media_file_id, file_data):
    """异步上传文件到R-Cabinet"""
    try:
        media_file = MediaFile.objects.get(id=media_file_id)
        client = RCabinetClient()
        
        result = client.upload_file(
            file_data=file_data,
            filename=media_file.original_filename
        )
        
        if result['success']:
            media_file.rcabinet_file_id = result['data']['file_id']
            media_file.rcabinet_url = result['data']['file_url']
            media_file.upload_status = 'completed'
        else:
            media_file.upload_status = 'failed'
            media_file.error_message = result.get('error', '上传失败')
            
        media_file.save()
        
    except Exception as exc:
        media_file = MediaFile.objects.get(id=media_file_id)
        media_file.upload_status = 'failed'
        media_file.error_message = str(exc)
        media_file.save()
        
        # 重试机制
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60 * (2 ** self.request.retries))
```

## 错误处理模式

### 1. 分层错误处理

```python
from pagemaker.integrations.exceptions import (
    RakutenAPIError, 
    RakutenConnectionError,
    RakutenAuthError
)

def handle_upload_errors(func):
    """上传错误处理装饰器"""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except RakutenAuthError as e:
            return {
                'success': False,
                'error_type': 'AUTH_ERROR',
                'message': '认证失败，请检查API凭据',
                'retry_recommended': False
            }
        except RakutenConnectionError as e:
            return {
                'success': False,
                'error_type': 'CONNECTION_ERROR',
                'message': '网络连接失败，请稍后重试',
                'retry_recommended': True
            }
        except RakutenAPIError as e:
            if e.result_code == 3008:  # 文件容量超限
                return {
                    'success': False,
                    'error_type': 'FILE_TOO_LARGE',
                    'message': '文件大小超过限制，请压缩后重试',
                    'retry_recommended': False
                }
            elif e.result_code == 3012:  # 可用容量不足
                return {
                    'success': False,
                    'error_type': 'QUOTA_EXCEEDED',
                    'message': '存储空间不足，请清理文件后重试',
                    'retry_recommended': False
                }
    return wrapper

@handle_upload_errors
def safe_upload_file(file_data, filename):
    client = RCabinetClient()
    return client.upload_file(file_data, filename)
```

### 2. 重试机制实现

```python
import time
import random
from functools import wraps

def retry_with_exponential_backoff(max_retries=3, base_delay=1):
    """指数退避重试装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except (RakutenConnectionError, RakutenAPIError) as e:
                    last_exception = e
                    
                    # 不重试的错误类型
                    if isinstance(e, RakutenAPIError) and e.result_code in [3001, 3008, 3012]:
                        raise e
                    
                    if attempt < max_retries:
                        # 计算延迟时间（指数退避 + 随机抖动）
                        delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                        time.sleep(delay)
                        continue
                    
                    # 最后一次重试失败
                    raise last_exception
            
            return wrapper
        return decorator

@retry_with_exponential_backoff(max_retries=3)
def reliable_upload(file_data, filename):
    client = RCabinetClient()
    return client.upload_file(file_data, filename)
```

## 监控和日志

### 1. 自定义日志记录

```python
import logging
import time
from functools import wraps

# 配置专用日志记录器
rcabinet_logger = logging.getLogger('rcabinet.operations')

def log_rcabinet_operation(operation_name):
    """R-Cabinet操作日志装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            operation_id = f"{operation_name}_{int(start_time * 1000)}"
            
            rcabinet_logger.info(f"开始 {operation_name} - ID: {operation_id}")
            
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                
                rcabinet_logger.info(
                    f"完成 {operation_name} - ID: {operation_id}, "
                    f"耗时: {duration:.2f}s, 状态: 成功"
                )
                return result
                
            except Exception as e:
                duration = time.time() - start_time
                rcabinet_logger.error(
                    f"失败 {operation_name} - ID: {operation_id}, "
                    f"耗时: {duration:.2f}s, 错误: {str(e)}"
                )
                raise
        return wrapper
    return decorator

@log_rcabinet_operation("文件上传")
def upload_with_logging(file_data, filename):
    client = RCabinetClient()
    return client.upload_file(file_data, filename)
```

### 2. 性能监控

```python
from django.core.cache import cache
import time

class RCabinetMetrics:
    """R-Cabinet性能指标收集器"""
    
    @staticmethod
    def record_upload_metrics(file_size, duration, success):
        """记录上传指标"""
        current_hour = int(time.time() // 3600)
        
        # 记录上传次数
        cache_key_count = f"rcabinet:uploads:count:{current_hour}"
        cache.set(cache_key_count, cache.get(cache_key_count, 0) + 1, 3600)
        
        # 记录成功率
        if success:
            cache_key_success = f"rcabinet:uploads:success:{current_hour}"
            cache.set(cache_key_success, cache.get(cache_key_success, 0) + 1, 3600)
        
        # 记录响应时间
        cache_key_duration = f"rcabinet:uploads:duration:{current_hour}"
        durations = cache.get(cache_key_duration, [])
        durations.append(duration)
        cache.set(cache_key_duration, durations[-100:], 3600)  # 保留最近100次
        
        # 记录文件大小
        cache_key_size = f"rcabinet:uploads:size:{current_hour}"
        sizes = cache.get(cache_key_size, [])
        sizes.append(file_size)
        cache.set(cache_key_size, sizes[-100:], 3600)
    
    @staticmethod
    def get_hourly_stats():
        """获取当前小时的统计数据"""
        current_hour = int(time.time() // 3600)
        
        total_count = cache.get(f"rcabinet:uploads:count:{current_hour}", 0)
        success_count = cache.get(f"rcabinet:uploads:success:{current_hour}", 0)
        durations = cache.get(f"rcabinet:uploads:duration:{current_hour}", [])
        sizes = cache.get(f"rcabinet:uploads:size:{current_hour}", [])
        
        return {
            'total_uploads': total_count,
            'success_rate': success_count / total_count if total_count > 0 else 0,
            'avg_duration': sum(durations) / len(durations) if durations else 0,
            'avg_file_size': sum(sizes) / len(sizes) if sizes else 0,
        }
```

## 测试策略

### 1. 单元测试示例

```python
import unittest
from unittest.mock import patch, Mock
from pagemaker.integrations.cabinet_client import RCabinetClient

class TestRCabinetClient(unittest.TestCase):
    
    def setUp(self):
        self.client = RCabinetClient(test_mode='mock')
    
    def test_upload_success(self):
        """测试文件上传成功"""
        result = self.client.upload_file(
            file_data=b'test image data',
            filename='test.jpg'
        )
        
        self.assertTrue(result['success'])
        self.assertIn('file_id', result['data'])
        self.assertIn('file_url', result['data'])
    
    @patch('pagemaker.integrations.cabinet_client.requests.request')
    def test_upload_network_error(self, mock_request):
        """测试网络错误处理"""
        mock_request.side_effect = ConnectionError("网络连接失败")
        
        client = RCabinetClient(test_mode='real')
        with self.assertRaises(RakutenConnectionError):
            client.upload_file(b'test data', 'test.jpg')
    
    def test_rate_limiting(self):
        """测试速率限制"""
        import time
        start_time = time.time()
        
        # 连续两次调用
        self.client.get_usage()
        self.client.get_usage()
        
        duration = time.time() - start_time
        self.assertGreater(duration, 0.9)  # 应该有速率限制延迟
```

### 2. 集成测试

```python
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from media.models import MediaFile

class RCabinetIntegrationTest(TransactionTestCase):
    """R-Cabinet集成测试"""
    
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass'
        )
    
    def test_end_to_end_upload(self):
        """端到端上传测试"""
        # 创建测试文件
        test_file_data = self._create_test_image()
        
        # 模拟API调用
        with patch('media.views.RCabinetClient') as mock_client:
            mock_instance = mock_client.return_value
            mock_instance.upload_file.return_value = {
                'success': True,
                'data': {
                    'file_id': 'test123',
                    'file_url': 'https://example.com/test.jpg'
                }
            }
            
            # 执行上传
            response = self.client.post(
                '/api/v1/media/upload/',
                {'file': test_file_data},
                format='multipart'
            )
            
            self.assertEqual(response.status_code, 201)
            
            # 验证数据库记录
            media_file = MediaFile.objects.get(
                id=response.data['data']['id']
            )
            self.assertEqual(media_file.upload_status, 'completed')
            self.assertEqual(media_file.rcabinet_file_id, 'test123')
```

## 部署注意事项

### 1. 环境变量配置

```bash
# 生产环境配置
RAKUTEN_SERVICE_SECRET=your_production_secret
RAKUTEN_LICENSE_KEY=your_production_license
RAKUTEN_API_TEST_MODE=real
RCABINET_INTEGRATION_ENABLED=True
RAKUTEN_API_TIMEOUT=30
```

### 2. 健康检查集成

```python
# 在Django应用启动时添加健康检查
from django.apps import AppConfig

class MediaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'media'
    
    def ready(self):
        # 启动时检查R-Cabinet连接
        if settings.RCABINET_INTEGRATION_ENABLED:
            self.check_rcabinet_health()
    
    def check_rcabinet_health(self):
        try:
            from pagemaker.integrations.cabinet_client import RCabinetClient
            client = RCabinetClient()
            result = client.health_check()
            if result['status'] != 'healthy':
                logger.warning(f"R-Cabinet服务异常: {result}")
        except Exception as e:
            logger.error(f"R-Cabinet健康检查失败: {e}")
```

### 3. 监控告警

```python
# 定期监控任务
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'R-Cabinet服务监控'
    
    def handle(self, *args, **options):
        from pagemaker.integrations.cabinet_client import RCabinetClient
        
        client = RCabinetClient()
        
        # 检查服务健康状态
        health = client.health_check()
        if health['status'] != 'healthy':
            self.send_alert(f"R-Cabinet服务异常: {health['error']}")
        
        # 检查存储空间
        usage = client.get_usage()
        use_ratio = usage['data']['use_space'] / usage['data']['max_space']
        if use_ratio > 0.8:
            self.send_alert(f"R-Cabinet存储空间使用率过高: {use_ratio:.1%}")
        
        # 检查最近上传失败率
        failed_count = MediaFile.objects.filter(
            upload_status='failed',
            created_at__gte=timezone.now() - timedelta(hours=1)
        ).count()
        
        total_count = MediaFile.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=1)
        ).count()
        
        if total_count > 0 and failed_count / total_count > 0.1:
            self.send_alert(f"R-Cabinet上传失败率过高: {failed_count}/{total_count}")
    
    def send_alert(self, message):
        # 实现告警通知逻辑
        logger.error(f"R-Cabinet告警: {message}")
```

## 常见问题解答

### Q1: 如何处理大文件上传？
A: R-Cabinet限制文件大小为2MB。对于大文件，建议：
1. 前端预压缩
2. 服务端自动缩放
3. 分块上传（如果支持）

### Q2: 如何优化上传性能？
A: 建议策略：
1. 使用异步队列处理批量上传
2. 实现客户端缓存
3. 预先验证文件格式和大小
4. 使用CDN加速访问

### Q3: 如何处理网络不稳定？
A: 推荐方案：
1. 实现重试机制
2. 使用断路器模式
3. 提供降级策略
4. 监控网络状态

### Q4: 如何确保数据一致性？
A: 最佳实践：
1. 使用数据库事务
2. 实现幂等性操作
3. 添加数据校验
4. 定期数据同步检查 