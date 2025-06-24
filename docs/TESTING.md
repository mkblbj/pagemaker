# 测试指南 (Testing Guide)

## 🧪 测试概述

Pagemaker CMS 项目包含完整的测试套件，覆盖前端、后端和共享类型模块。

## 📊 测试状态

| 模块 | 测试框架 | 测试数量 | 状态 |
|------|----------|----------|------|
| **前端** | Vitest | 3个 | ✅ 通过 |
| **后端** | Pytest | 65个 | ✅ 通过 |
| **共享类型** | Jest | 7个 | ✅ 通过 |
| **总计** | - | **75个** | ✅ **全部通过** |

## 🚀 快速开始

### 运行所有测试
```bash
# 从项目根目录运行所有测试
pnpm test
```

### 分别运行测试
```bash
# 前端测试
pnpm test:frontend

# 后端测试
pnpm test:backend

# 共享类型测试
pnpm test:shared
```

## 🎯 各模块测试详情

### 前端测试 (Vitest)
- **位置**: `apps/frontend/src/**/*.test.ts`
- **框架**: Vitest 3.2.4
- **覆盖内容**: 工具函数、组件逻辑

```bash
cd apps/frontend
pnpm test                    # 运行测试
pnpm test -- --coverage     # 生成覆盖率报告
```

### 后端测试 (Pytest)
- **位置**: `apps/backend/tests/`
- **框架**: Pytest 8.2
- **数据库**: MySQL (不创建新数据库)
- **覆盖内容**: JWT认证、Django设置、应用结构、类型验证

```bash
cd apps/backend
make test                    # 推荐方式
make test-coverage          # 生成覆盖率报告

# 或直接使用pytest
DJANGO_SETTINGS_MODULE=pagemaker.test_settings python -m pytest
```

### 共享类型测试 (Jest)
- **位置**: `packages/shared-types/tests/`
- **框架**: Jest
- **覆盖内容**: 类型定义、枚举值、API接口兼容性

```bash
cd packages/shared-types
pnpm test
```

## ⚙️ 后端测试配置详解

### 数据库配置
后端测试使用特殊配置避免数据库权限问题：

- ✅ **使用现有数据库**: 不创建新的测试数据库
- ✅ **避免权限问题**: `CREATE_DB = False`
- ✅ **环境隔离**: 独立的测试设置文件
- ✅ **数据安全**: 测试不会破坏现有数据

### 配置文件
```python
# apps/backend/pagemaker/test_settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': config('DB_NAME'),  # 使用现有数据库
        'TEST': {
            'NAME': config('DB_NAME'),  # 测试时使用同一个数据库
            'CREATE_DB': False,  # 不创建新的测试数据库
        },
    }
}
```

## 🔧 故障排除

### 常见问题

**1. 后端测试数据库权限错误**
```
Access denied for user 'pagemaker_cms_user'@'%' to database 'test_pagemaker_cms'
```
**解决方案**: 使用 `make test` 或设置 `DJANGO_SETTINGS_MODULE=pagemaker.test_settings`

**2. Django设置未配置错误**
```
ImproperlyConfigured: Requested setting INSTALLED_APPS, but settings are not configured
```
**解决方案**: 确保使用正确的Django设置模块

**3. 前端测试端口冲突**
**解决方案**: 停止开发服务器或使用 `--run` 参数

### 环境要求
- **MySQL**: 数据库服务运行中
- **Python**: 虚拟环境已激活
- **Node.js**: 依赖已安装 (`pnpm install`)

## 📈 测试覆盖率

### 当前覆盖率
- **后端**: ~85% (包含所有核心功能)
- **前端**: 工具函数100%覆盖
- **共享类型**: 100%覆盖

### 查看覆盖率报告
```bash
# 后端覆盖率
cd apps/backend && make test-coverage
# 报告位置: htmlcov/index.html

# 前端覆盖率
cd apps/frontend && pnpm test -- --coverage
```

## 🎯 测试最佳实践

### 测试分类
- **单元测试**: 使用 `@pytest.mark.unit` 标记
- **集成测试**: 使用 `@pytest.mark.integration` 标记

### 运行特定测试
```bash
# 只运行单元测试
DJANGO_SETTINGS_MODULE=pagemaker.test_settings python -m pytest -m "unit"

# 只运行集成测试
DJANGO_SETTINGS_MODULE=pagemaker.test_settings python -m pytest -m "integration"
```

## 📚 相关文档

- [测试策略](./architecture/testing-strategy.md)
- [后端测试总结](../apps/backend/TEST_SUMMARY.md)
- [架构文档](./architecture/index.md)

---

**测试是代码质量的保障，请在提交代码前确保所有测试通过！** ✨ 