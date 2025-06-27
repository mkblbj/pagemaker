# 乐天API备用方案和降级策略

## 概述

本文档详细说明了乐天API集成的备用方案、降级策略和紧急处理流程，确保在各种故障场景下系统能够继续提供基本服务。

## 1. 降级策略框架

### 1.1 降级级别定义

#### Level 0: 正常运行
- 所有API功能正常
- 完整的功能体验
- 实时数据同步

#### Level 1: 性能降级
- API响应时间超过阈值
- 启用缓存机制
- 减少非关键API调用

#### Level 2: 功能降级
- 部分API不可用
- 禁用非核心功能
- 使用本地缓存数据

#### Level 3: 紧急模式
- 所有外部API不可用
- 仅提供基本功能
- 完全依赖本地数据

### 1.2 自动降级触发条件

```python
# 降级触发条件配置
DEGRADATION_TRIGGERS = {
    'level_1': {
        'avg_response_time_ms': 3000,  # 平均响应时间超过3秒
        'success_rate_percent': 90,    # 成功率低于90%
        'error_count_per_minute': 10   # 每分钟错误数超过10次
    },
    'level_2': {
        'avg_response_time_ms': 8000,  # 平均响应时间超过8秒
        'success_rate_percent': 70,    # 成功率低于70%
        'consecutive_failures': 5,     # 连续失败5次
        'error_count_per_minute': 30   # 每分钟错误数超过30次
    },
    'level_3': {
        'consecutive_failures': 10,    # 连续失败10次
        'total_failure_duration': 300, # 总故障时间超过5分钟
        'api_unavailable_duration': 180 # API不可用超过3分钟
    }
}
```

## 2. API服务不可用时的降级策略

### 2.1 R-Cabinet API降级策略

#### 策略1: 缓存降级
```python
class CachedRCabinetService:
    """带缓存的R-Cabinet服务"""
    
    def __init__(self):
        self.cache_ttl = 300  # 5分钟缓存
        self.fallback_cache_ttl = 3600  # 降级时使用1小时缓存
    
    def get_usage_with_fallback(self):
        """获取使用状况（带降级）"""
        try:
            # 尝试获取实时数据
            result = self.cabinet_client.get_usage()
            self.cache.set('usage_data', result, self.cache_ttl)
            return result
        except RakutenAPIError:
            # 降级到缓存数据
            cached_data = self.cache.get('usage_data')
            if cached_data:
                cached_data['_cached'] = True
                cached_data['_cache_age'] = time.time() - cached_data.get('_timestamp', 0)
                return cached_data
            else:
                # 返回默认数据
                return self._get_default_usage_data()
    
    def _get_default_usage_data(self):
        """返回默认使用状况数据"""
        return {
            'success': True,
            'message': '使用缓存数据 (API不可用)',
            'data': {
                'max_space': 100,
                'use_space': 0,
                'avail_space': 100,
                'folder_max': 1000,
                'file_max': 10000,
                '_fallback': True
            }
        }
```

#### 策略2: 只读模式
- 禁用文件上传功能
- 禁用文件夹创建/删除
- 仅允许查看现有数据
- 提供离线模式提示

#### 策略3: 本地存储备份
- 定期备份关键数据到本地
- 使用本地数据库存储文件元信息
- 提供基本的文件管理功能

### 2.2 License Management API降级策略

#### 策略1: 许可证缓存
```python
class LicenseCache:
    """许可证缓存管理"""
    
    def __init__(self):
        self.cache_duration = 86400  # 24小时缓存
    
    def get_license_status_with_fallback(self):
        """获取许可证状态（带降级）"""
        try:
            # 尝试获取实时状态
            result = self.license_client.get_license_expiry_date()
            self.cache.set('license_status', result, self.cache_duration)
            return result
        except RakutenAPIError:
            # 使用缓存数据
            cached_status = self.cache.get('license_status')
            if cached_status:
                return cached_status
            else:
                # 假设许可证有效（保守策略）
                return {
                    'is_valid': True,
                    'expiry_date': '2099-12-31',
                    'status': 'cached_fallback'
                }
```

#### 策略2: 预警机制
- 在许可证到期前30天开始预警
- 提供手动许可证状态更新
- 记录许可证检查失败日志

### 2.3 FTP连接降级策略

#### 策略1: 连接池降级
```python
class FTPConnectionPool:
    """FTP连接池（带降级）"""
    
    def __init__(self):
        self.max_connections = 5
        self.degraded_max_connections = 2
        self.current_mode = 'normal'
    
    def get_connection_with_fallback(self):
        """获取FTP连接（带降级）"""
        if self.current_mode == 'degraded':
            # 降级模式：减少并发连接
            return self._get_limited_connection()
        else:
            try:
                return self._get_normal_connection()
            except RakutenFTPError:
                # 切换到降级模式
                self.current_mode = 'degraded'
                return self._get_limited_connection()
```

#### 策略2: 文件传输降级
- 禁用大文件上传
- 启用文件压缩
- 使用队列延迟处理
- 提供传输状态通知

## 3. 认证失败时的重试和报警机制

### 3.1 认证重试策略

```python
class AuthenticationRetryManager:
    """认证重试管理器"""
    
    def __init__(self):
        self.max_retries = 3
        self.retry_delays = [1, 5, 15]  # 递增延迟
        self.lockout_duration = 300     # 5分钟锁定期
    
    def authenticate_with_retry(self, credentials):
        """带重试的认证"""
        for attempt in range(self.max_retries):
            try:
                return self._authenticate(credentials)
            except RakutenAuthError as e:
                if attempt < self.max_retries - 1:
                    delay = self.retry_delays[attempt]
                    self.logger.warning(f"认证失败，{delay}秒后重试...")
                    time.sleep(delay)
                else:
                    # 最后一次失败，触发锁定
                    self._trigger_lockout()
                    raise
    
    def _trigger_lockout(self):
        """触发认证锁定"""
        self.logger.error("认证连续失败，进入锁定状态")
        self.cache.set('auth_lockout', True, self.lockout_duration)
        self._send_alert('auth_failure_lockout')
```

### 3.2 认证失败报警

```python
class AuthAlertManager:
    """认证失败报警管理"""
    
    def __init__(self):
        self.alert_thresholds = {
            'single_failure': True,      # 单次失败即报警
            'consecutive_failures': 2,   # 连续2次失败
            'hourly_failures': 5         # 每小时失败5次
        }
    
    def handle_auth_failure(self, error_details):
        """处理认证失败"""
        # 记录失败
        self._record_failure(error_details)
        
        # 检查报警条件
        if self._should_alert():
            self._send_alert(error_details)
        
        # 检查是否需要禁用功能
        if self._should_disable():
            self._disable_api_features()
    
    def _send_alert(self, error_details):
        """发送报警"""
        alert_message = f"""
        乐天API认证失败报警
        
        时间: {datetime.now()}
        错误: {error_details.get('error')}
        凭据状态: {error_details.get('credentials_status')}
        建议操作: 检查凭据有效性，联系管理员
        """
        
        # 发送邮件/短信/webhook等
        self.notification_service.send_alert(alert_message)
```

## 4. FTP连接失败时的备用文件上传方案

### 4.1 本地存储备用方案

```python
class LocalStorageFallback:
    """本地存储备用方案"""
    
    def __init__(self):
        self.local_storage_path = '/tmp/rakuten_fallback'
        self.max_storage_size = 1024 * 1024 * 100  # 100MB
    
    def upload_file_with_fallback(self, file_data, filename):
        """文件上传（带备用方案）"""
        try:
            # 尝试FTP上传
            return self.ftp_client.upload_file(file_data, filename)
        except RakutenFTPError:
            # 降级到本地存储
            return self._store_locally(file_data, filename)
    
    def _store_locally(self, file_data, filename):
        """本地存储文件"""
        # 检查存储空间
        if self._get_storage_usage() > self.max_storage_size:
            self._cleanup_old_files()
        
        # 保存文件
        local_path = os.path.join(self.local_storage_path, filename)
        with open(local_path, 'wb') as f:
            f.write(file_data)
        
        # 记录待同步文件
        self._queue_for_sync(local_path, filename)
        
        return {
            'success': True,
            'local_path': local_path,
            'sync_pending': True,
            'message': '文件已保存到本地，等待同步'
        }
```

### 4.2 文件同步队列

```python
class FileSyncQueue:
    """文件同步队列"""
    
    def __init__(self):
        self.sync_queue = []
        self.sync_interval = 60  # 1分钟检查一次
        self.max_retry_count = 5
    
    def start_sync_worker(self):
        """启动同步工作线程"""
        def sync_worker():
            while True:
                try:
                    self._process_sync_queue()
                except Exception as e:
                    self.logger.error(f"同步队列处理失败: {e}")
                time.sleep(self.sync_interval)
        
        threading.Thread(target=sync_worker, daemon=True).start()
    
    def _process_sync_queue(self):
        """处理同步队列"""
        if not self.sync_queue:
            return
        
        # 检查FTP连接是否恢复
        if not self._is_ftp_available():
            return
        
        # 处理队列中的文件
        for item in self.sync_queue[:]:
            try:
                self._sync_file(item)
                self.sync_queue.remove(item)
                self.logger.info(f"文件同步成功: {item['filename']}")
            except Exception as e:
                item['retry_count'] += 1
                if item['retry_count'] >= self.max_retry_count:
                    self.sync_queue.remove(item)
                    self.logger.error(f"文件同步失败，已放弃: {item['filename']}")
```

## 5. API配额耗尽时的处理策略

### 5.1 配额监控和预警

```python
class QuotaManager:
    """配额管理器"""
    
    def __init__(self):
        self.daily_quota = 1000      # 每日配额
        self.hourly_quota = 100      # 每小时配额
        self.warning_threshold = 0.8  # 80%预警
        self.critical_threshold = 0.95 # 95%严重预警
    
    def check_quota_status(self):
        """检查配额状态"""
        current_usage = self._get_current_usage()
        daily_usage_rate = current_usage['daily'] / self.daily_quota
        hourly_usage_rate = current_usage['hourly'] / self.hourly_quota
        
        # 检查预警条件
        if daily_usage_rate >= self.critical_threshold:
            self._trigger_quota_alert('critical', 'daily', daily_usage_rate)
            return 'critical'
        elif daily_usage_rate >= self.warning_threshold:
            self._trigger_quota_alert('warning', 'daily', daily_usage_rate)
            return 'warning'
        
        return 'normal'
    
    def _trigger_quota_alert(self, level, period, usage_rate):
        """触发配额预警"""
        message = f"API配额{level}预警: {period}使用率{usage_rate:.1%}"
        self.alert_manager.send_alert(level, message)
```

### 5.2 配额耗尽处理策略

```python
class QuotaExhaustedHandler:
    """配额耗尽处理器"""
    
    def handle_quota_exhausted(self):
        """处理配额耗尽"""
        # 1. 立即停止非关键API调用
        self._disable_non_critical_apis()
        
        # 2. 启用严格的请求过滤
        self._enable_strict_filtering()
        
        # 3. 切换到缓存模式
        self._switch_to_cache_mode()
        
        # 4. 通知用户
        self._notify_users_quota_exhausted()
        
        # 5. 记录事件
        self._log_quota_exhausted_event()
    
    def _disable_non_critical_apis(self):
        """禁用非关键API"""
        non_critical_apis = [
            'cabinet.folders.get',
            'cabinet.files.search',
            'license.expiry.check'
        ]
        
        for api in non_critical_apis:
            self.api_registry.disable_api(api)
    
    def _enable_strict_filtering(self):
        """启用严格请求过滤"""
        # 只允许关键操作
        critical_operations = [
            'file_upload',
            'usage_check'
        ]
        
        self.request_filter.set_whitelist(critical_operations)
```

## 6. 系统健康检查和监控机制

### 6.1 健康检查服务

```python
class HealthCheckService:
    """健康检查服务"""
    
    def __init__(self):
        self.check_interval = 30  # 30秒检查一次
        self.health_checks = [
            self._check_api_connectivity,
            self._check_authentication,
            self._check_quota_status,
            self._check_local_resources
        ]
    
    def start_health_monitoring(self):
        """启动健康监控"""
        def health_worker():
            while True:
                try:
                    self._run_health_checks()
                except Exception as e:
                    self.logger.error(f"健康检查失败: {e}")
                time.sleep(self.check_interval)
        
        threading.Thread(target=health_worker, daemon=True).start()
    
    def _run_health_checks(self):
        """运行健康检查"""
        health_status = {
            'timestamp': time.time(),
            'overall_status': 'healthy',
            'checks': {}
        }
        
        for check_func in self.health_checks:
            try:
                check_name = check_func.__name__
                result = check_func()
                health_status['checks'][check_name] = result
                
                if not result.get('healthy', True):
                    health_status['overall_status'] = 'unhealthy'
            except Exception as e:
                health_status['checks'][check_func.__name__] = {
                    'healthy': False,
                    'error': str(e)
                }
                health_status['overall_status'] = 'unhealthy'
        
        # 更新健康状态
        self.health_cache.set('current_health', health_status)
        
        # 触发必要的处理
        if health_status['overall_status'] == 'unhealthy':
            self._handle_unhealthy_status(health_status)
```

### 6.2 自动恢复机制

```python
class AutoRecoveryManager:
    """自动恢复管理器"""
    
    def __init__(self):
        self.recovery_strategies = {
            'api_connectivity': self._recover_api_connectivity,
            'authentication': self._recover_authentication,
            'quota_exhausted': self._recover_from_quota_exhaustion,
            'storage_full': self._recover_storage_space
        }
    
    def attempt_recovery(self, issue_type, issue_details):
        """尝试自动恢复"""
        if issue_type in self.recovery_strategies:
            try:
                recovery_func = self.recovery_strategies[issue_type]
                result = recovery_func(issue_details)
                
                if result.get('success'):
                    self.logger.info(f"自动恢复成功: {issue_type}")
                    return True
                else:
                    self.logger.warning(f"自动恢复失败: {issue_type}")
                    return False
            except Exception as e:
                self.logger.error(f"自动恢复异常: {issue_type}, {e}")
                return False
        
        return False
    
    def _recover_api_connectivity(self, details):
        """恢复API连接"""
        # 重置连接池
        self.connection_pool.reset()
        
        # 清除DNS缓存
        self._clear_dns_cache()
        
        # 测试连接
        return self._test_api_connectivity()
```

## 7. 紧急情况下的手动操作流程

### 7.1 紧急停用流程

```bash
# 1. 立即停用所有乐天API功能
python manage.py disable_rakuten_api --immediate

# 2. 切换到紧急模式
python manage.py set_emergency_mode --level=3

# 3. 清除所有API队列
python manage.py clear_api_queues --confirm

# 4. 备份当前状态
python manage.py backup_api_state --emergency
```

### 7.2 手动恢复流程

```bash
# 1. 检查系统状态
python manage.py check_system_health --verbose

# 2. 验证凭据
python manage.py verify_credentials --test-all

# 3. 逐步恢复功能
python manage.py enable_rakuten_api --gradual --start-level=1

# 4. 监控恢复状态
python manage.py monitor_recovery --duration=300
```

### 7.3 数据恢复流程

```bash
# 1. 恢复本地缓存数据
python manage.py restore_cache_data --from-backup

# 2. 同步待处理文件
python manage.py sync_pending_files --batch-size=10

# 3. 验证数据完整性
python manage.py verify_data_integrity --repair-if-needed
```

## 8. 集成模块回滚和禁用策略

### 8.1 功能开关机制

```python
class FeatureToggle:
    """功能开关管理"""
    
    def __init__(self):
        self.features = {
            'rakuten_api_enabled': True,
            'cabinet_api_enabled': True,
            'ftp_upload_enabled': True,
            'license_check_enabled': True,
            'auto_sync_enabled': True
        }
    
    def disable_feature(self, feature_name, reason=None):
        """禁用功能"""
        if feature_name in self.features:
            self.features[feature_name] = False
            self.logger.warning(f"功能已禁用: {feature_name}, 原因: {reason}")
            
            # 记录禁用事件
            self._log_feature_toggle(feature_name, False, reason)
            
            # 通知相关组件
            self._notify_feature_change(feature_name, False)
    
    def is_enabled(self, feature_name):
        """检查功能是否启用"""
        return self.features.get(feature_name, False)
```

### 8.2 数据库迁移回滚

```python
# 回滚迁移脚本
class RollbackMigration:
    """回滚迁移管理"""
    
    def rollback_integration_changes(self):
        """回滚集成相关的数据库变更"""
        rollback_steps = [
            self._backup_current_data,
            self._drop_integration_tables,
            self._remove_integration_fields,
            self._restore_original_schema
        ]
        
        for step in rollback_steps:
            try:
                step()
                self.logger.info(f"回滚步骤完成: {step.__name__}")
            except Exception as e:
                self.logger.error(f"回滚步骤失败: {step.__name__}, {e}")
                raise
```

### 8.3 系统隔离策略

```python
class SystemIsolation:
    """系统隔离管理"""
    
    def isolate_integration_module(self):
        """隔离集成模块"""
        # 1. 停止所有API调用
        self._stop_api_calls()
        
        # 2. 清空请求队列
        self._clear_request_queues()
        
        # 3. 禁用定时任务
        self._disable_scheduled_tasks()
        
        # 4. 切换到安全模式
        self._switch_to_safe_mode()
        
        # 5. 通知监控系统
        self._notify_isolation_event()
```

## 9. 监控指标和告警阈值

### 9.1 关键监控指标

```python
MONITORING_METRICS = {
    # 性能指标
    'api_response_time_ms': {
        'warning': 3000,
        'critical': 8000
    },
    'api_success_rate_percent': {
        'warning': 90,
        'critical': 70
    },
    
    # 可用性指标
    'consecutive_failures': {
        'warning': 3,
        'critical': 5
    },
    'service_uptime_percent': {
        'warning': 95,
        'critical': 90
    },
    
    # 资源指标
    'storage_usage_percent': {
        'warning': 80,
        'critical': 95
    },
    'quota_usage_percent': {
        'warning': 80,
        'critical': 95
    },
    
    # 业务指标
    'failed_uploads_per_hour': {
        'warning': 10,
        'critical': 30
    },
    'authentication_failures_per_hour': {
        'warning': 3,
        'critical': 10
    }
}
```

### 9.2 告警处理流程

```python
class AlertHandler:
    """告警处理器"""
    
    def handle_alert(self, alert_type, severity, details):
        """处理告警"""
        # 1. 记录告警
        self._log_alert(alert_type, severity, details)
        
        # 2. 根据严重程度采取行动
        if severity == 'critical':
            self._handle_critical_alert(alert_type, details)
        elif severity == 'warning':
            self._handle_warning_alert(alert_type, details)
        
        # 3. 发送通知
        self._send_notification(alert_type, severity, details)
        
        # 4. 更新告警状态
        self._update_alert_status(alert_type, severity)
    
    def _handle_critical_alert(self, alert_type, details):
        """处理严重告警"""
        if alert_type == 'api_connectivity':
            # 立即切换到降级模式
            self.degradation_manager.switch_to_level(2)
        elif alert_type == 'authentication_failure':
            # 暂停API调用
            self.api_manager.pause_all_calls()
        elif alert_type == 'quota_exhausted':
            # 启用配额保护模式
            self.quota_manager.enable_protection_mode()
```

## 10. 总结

本文档提供了完整的乐天API集成备用方案和降级策略，包括：

1. **多级降级策略**: 从性能降级到紧急模式的渐进式处理
2. **自动恢复机制**: 智能检测和自动修复常见问题
3. **手动干预流程**: 紧急情况下的快速响应程序
4. **监控和告警**: 全面的指标监控和及时告警
5. **数据保护**: 确保数据安全和业务连续性

关键原则：
- **渐进式降级**: 优先保证核心功能
- **自动化处理**: 减少人工干预需求
- **快速恢复**: 最小化服务中断时间
- **数据安全**: 确保数据不丢失
- **用户体验**: 提供清晰的状态反馈

通过这些策略，确保在任何情况下都能为用户提供基本的服务功能。 