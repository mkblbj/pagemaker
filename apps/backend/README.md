# PageMaker Django Backend

## 项目概述

PageMaker CMS的Django后端API服务，提供完整的REST API接口和JWT认证系统。

## 技术栈

- **Python**: 3.12
- **Django**: 5.1.11
- **Django REST Framework**: 3.15.2
- **数据库**: MySQL 8.4+ (通过PyMySQL连接)
- **认证**: JWT (Simple JWT)
- **代码质量**: Black + Flake8
- **测试**: Pytest + Django Test

## 项目结构

```
apps/backend/
├── pagemaker/          # Django项目主目录
│   ├── settings.py     # 项目配置
│   ├── urls.py         # 主URL路由
│   └── wsgi.py         # WSGI配置
├── users/              # 用户管理应用
├── pages/              # 页面管理应用
├── media/              # 媒体管理应用
├── api/                # API路由应用
├── tests/              # 测试文件
├── requirements.txt    # 依赖包列表
├── .env.example        # 环境变量模板
├── pyproject.toml      # Python工具配置
├── .flake8            # Flake8配置
└── manage.py          # Django管理脚本
```

## 快速开始

### 1. 环境准备

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

### 2. 数据库配置

复制环境变量模板并配置数据库连接：

```bash
cp .env.example .env
# 编辑 .env 文件，配置你的数据库连接信息
```

**重要提示**: 
- `.env.example` 是模板文件，不包含真实的连接信息
- 请根据你的实际数据库配置修改 `.env` 文件中的值

### 3. 数据库迁移

```bash
python manage.py migrate
```

### 4. 创建超级用户

```bash
python manage.py createsuperuser
```

### 5. 启动开发服务器

```bash
python manage.py runserver
```

服务器将在 http://127.0.0.1:8000 启动。

## API 端点

### 认证端点

- `POST /api/v1/auth/token/` - 获取JWT令牌
- `POST /api/v1/auth/token/refresh/` - 刷新JWT令牌

### 应用端点

- `/api/v1/users/` - 用户管理
- `/api/v1/pages/` - 页面管理
- `/api/v1/media/` - 媒体管理

## 开发工具

### 代码格式化

```bash
# 格式化代码
black .

# 检查格式
black --check .
```

### 代码检查

```bash
# 运行linting
flake8 .
```

### 运行测试

```bash
# 运行所有测试
python -m pytest

# 运行特定测试
python -m pytest tests/test_settings.py

# 带覆盖率报告
python -m pytest --cov=.
```

## 环境变量

主要环境变量配置：

```env
# Django设置
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# 数据库设置
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_HOST=your-database-host
DB_PORT=3306
```

## 部署注意事项

1. 生产环境请设置 `DEBUG=False`
2. 配置强密码的 `SECRET_KEY`
3. 设置正确的 `ALLOWED_HOSTS`
4. 配置HTTPS相关安全设置
5. 设置适当的CORS策略

## 开发规范

- 使用Black进行代码格式化
- 遵循Flake8代码检查规则
- 编写单元测试和集成测试
- 使用仓库模式，避免直接调用ORM
- 遵循Django和DRF最佳实践

## 故障排除

### 数据库连接问题

如果遇到MySQL连接问题，确保：

1. MySQL服务正在运行
2. 数据库和用户已创建
3. 连接参数正确
4. 安装了cryptography包

### 依赖问题

如果遇到包安装问题：

```bash
# 更新pip
pip install --upgrade pip

# 清理缓存重新安装
pip cache purge
pip install -r requirements.txt
```

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交代码（遵循代码规范）
4. 创建Pull Request

## 许可证

[项目许可证信息] 