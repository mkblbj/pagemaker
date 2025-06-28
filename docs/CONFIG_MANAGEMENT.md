# Pagemaker 后端配置管理指南

## 概述

本项目后端 `apps/backend` 采用统一的配置管理方式，通过 `pagemaker.config` 模块集中处理所有环境变量的获取和验证。这种方式解决了之前混乱的配置获取模式，提供了类型安全、易于维护的配置管理机制。

## 问题背景

在重构前，项目中存在多种混乱的环境变量获取方式：

1. **直接使用 `os.getenv()`**：缺乏类型检查和默认值处理
2. **通过 `settings.py` 再获取**：增加了不必要的中间层
3. **分散的 `decouple.config()` 调用**：配置散布在各个文件中，难以维护
4. **不一致的默认值处理**：同一配置在不同地方有不同的默认值

## 统一解决方案

### 1. 核心设计原则

- **单一数据源**：所有配置通过 `pagemaker.config` 模块获取
- **类型安全**：提供强类型的配置属性和方法
- **集中管理**：所有配置逻辑集中在一个模块中
- **环境验证**：启动时自动验证必需的环境变量
- **向后兼容**：保持与现有代码的兼容性

### 2. 使用方式

#### 推荐方式（新代码）

```python
from pagemaker.config import config

# 获取数据库配置
db_host = config.DATABASE_HOST
db_port = config.DATABASE_PORT
debug_mode = config.DEBUG

# 获取乐天API配置
rakuten_secret = config.RAKUTEN_SERVICE_SECRET
api_timeout = config.RAKUTEN_API_TIMEOUT

# 获取完整数据库配置字典
db_config = config.get_database_config()
```

#### 兼容方式（现有代码）

```python
from pagemaker.config import get_config

# 向后兼容的函数接口
secret_key = get_config('DJANGO_SECRET_KEY')
debug = get_config('DJANGO_DEBUG', default=True, cast=bool)
```

### 3. 配置分类

#### Django 核心配置
- `SECRET_KEY`：Django密钥
- `DEBUG`：调试模式
- `ALLOWED_HOSTS`：允许的主机列表

#### 数据库配置
- `DATABASE_NAME`：数据库名称
- `DATABASE_USER`：数据库用户名
- `DATABASE_PASSWORD`：数据库密码
- `DATABASE_HOST`：数据库主机
- `DATABASE_PORT`：数据库端口

#### 乐天API配置
- `RAKUTEN_SERVICE_SECRET`：服务密钥
- `RAKUTEN_LICENSE_KEY`：许可密钥
- `RAKUTEN_FTP_HOST`：FTP主机
- `RAKUTEN_API_TEST_MODE`：测试模式

#### 其他配置
- `CORS_ALLOWED_ORIGINS`：CORS允许的源
- `LOG_LEVEL`：日志级别
- `JWT_ACCESS_TOKEN_LIFETIME_MINUTES`：JWT令牌生命周期

## 最佳实践

### 1. 新功能开发

```python
# ✅ 推荐：使用统一配置管理
from pagemaker.config import config

class MyService:
    def __init__(self):
        self.api_url = config.RAKUTEN_API_BASE_URL
        self.timeout = config.RAKUTEN_API_TIMEOUT
        self.debug = config.DEBUG

# ❌ 避免：直接使用os.getenv
import os

class MyService:
    def __init__(self):
        self.api_url = os.getenv('RAKUTEN_API_BASE_URL')  # 缺乏默认值
        self.timeout = int(os.getenv('RAKUTEN_API_TIMEOUT', '30'))  # 重复的类型转换
```

### 2. Django Settings

```python
# ✅ 推荐：在settings.py中使用统一配置
from .config import config

SECRET_KEY = config.SECRET_KEY
DEBUG = config.DEBUG
DATABASES = {"default": config.get_database_config()}

# ❌ 避免：直接在settings.py中使用decouple
from decouple import config as decouple_config

SECRET_KEY = decouple_config('DJANGO_SECRET_KEY')  # 分散的配置逻辑
```

### 3. 配置验证

```python
# ✅ 推荐：使用内置验证方法
from pagemaker.config import config

if not config.validate_rakuten_config():
    raise ConfigError("乐天API配置不完整")

# ✅ 也可以手动验证
try:
    from pagemaker.config import validate_environment
    validate_environment()
except ConfigError as e:
    logger.error(f"配置验证失败: {e}")
```

### 4. 测试中的配置

```python
# ✅ 推荐：在测试中使用mock或override
from unittest.mock import patch
from pagemaker.config import config

def test_my_function():
    with patch.object(config, 'DEBUG', True):
        # 测试逻辑
        pass

# ✅ 或者使用Django的override_settings
from django.test import override_settings

@override_settings(DEBUG=False)
def test_production_behavior():
    # 测试生产环境行为
    pass
```

## 迁移指南

### 现有代码迁移步骤

1. **识别直接的环境变量使用**
   ```bash
   grep -r "os.getenv\|os.environ" apps/backend/ --include="*.py"
   ```

2. **替换为统一配置**
   ```python
   # 旧代码
   import os
   secret = os.getenv('DJANGO_SECRET_KEY')
   
   # 新代码
   from pagemaker.config import config
   secret = config.SECRET_KEY
   ```

3. **更新导入语句**
   ```python
   # 旧代码
   from decouple import config
   db_name = config('DATABASE_NAME')
   
   # 新代码
   from pagemaker.config import config
   db_name = config.DATABASE_NAME
   ```

4. **验证配置完整性**
   ```python
   # 在应用启动时验证
   from pagemaker.config import validate_environment
   validate_environment()
   ```

## 环境变量文件管理

### 文件位置和优先级

1. **项目根目录的 `.env`** (最高优先级)
2. **系统环境变量**
3. **配置中的默认值** (最低优先级)

### 环境变量命名规范

- **Django配置**：以 `DJANGO_` 开头（如 `DJANGO_SECRET_KEY`）
- **数据库配置**：以 `DATABASE_` 开头（如 `DATABASE_NAME`）
- **乐天API配置**：以 `RAKUTEN_` 开头（如 `RAKUTEN_SERVICE_SECRET`）
- **通用配置**：使用描述性名称（如 `LOG_LEVEL`）

## 安全注意事项

1. **敏感信息保护**
   - 永远不要在代码中硬编码敏感信息
   - 确保 `.env` 文件被添加到 `.gitignore`
   - 生产环境使用强密码和复杂密钥

2. **配置验证**
   - 启动时验证必需的配置项
   - 对敏感配置进行格式验证
   - 记录配置加载状态（不记录敏感值）

3. **环境隔离**
   - 开发、测试、生产环境使用不同的配置文件
   - 测试环境使用模拟配置避免真实API调用

## 故障排除

### 常见问题

1. **ConfigError: 缺少必需的环境变量**
   - 检查 `.env` 文件是否存在
   - 确认环境变量名称拼写正确
   - 参考 `.env.example` 文件

2. **导入错误**
   ```python
   # 确保正确导入
   from pagemaker.config import config  # ✅
   from config import config  # ❌ 错误的导入路径
   ```

3. **类型转换错误**
   ```python
   # 使用正确的类型方法
   timeout = config.get_int('CUSTOM_TIMEOUT', default=30)  # ✅
   timeout = int(config.get('CUSTOM_TIMEOUT', '30'))  # ❌ 手动转换
   ```

### 调试技巧

```python
# 检查配置加载状态
from pagemaker.config import config
print(f"DEBUG模式: {config.DEBUG}")
print(f"数据库主机: {config.DATABASE_HOST}")
print(f"乐天API模式: {config.RAKUTEN_API_TEST_MODE}")

# 验证乐天配置
if config.validate_rakuten_config():
    print("乐天API配置完整")
else:
    print("乐天API配置不完整，将使用测试模式")
```

## 总结

通过采用统一的配置管理方式，我们解决了以下问题：

1. **消除配置混乱**：所有配置通过单一入口获取
2. **提高类型安全**：强类型的配置属性和方法
3. **简化维护**：集中的配置逻辑，易于修改和扩展
4. **增强可靠性**：启动时验证，减少运行时配置错误
5. **改善开发体验**：清晰的API和完善的文档

这种方式符合Django最佳实践和业界标准，为项目的长期维护提供了坚实的基础。 