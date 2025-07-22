# Pagemaker CMS

[![CI](https://github.com/your-org/pagemaker/workflows/CI/badge.svg)](https://github.com/your-org/pagemaker/actions/workflows/ci.yml)
[![Security Scan](https://github.com/your-org/pagemaker/workflows/Security%20Scan/badge.svg)](https://github.com/your-org/pagemaker/actions/workflows/security.yml)
[![Deploy](https://github.com/your-org/pagemaker/workflows/Deploy/badge.svg)](https://github.com/your-org/pagemaker/actions/workflows/deploy.yml)
[![Coverage](https://img.shields.io/badge/coverage-80%25+-brightgreen)](https://github.com/your-org/pagemaker/actions/workflows/coverage.yml)

> 乐天店铺页面可视化编辑器 - 让页面创建变得简单高效

## 📖 项目概述

Pagemaker CMS 是一个专为乐天店铺设计的可视化页面编辑器，帮助运营团队快速创建和管理店铺页面内容。通过直观的拖拽界面和丰富的内容模块，用户可以轻松构建专业的页面布局并一键导出HTML代码。

## 📚 重要文档

- **[剪贴板API使用指南](docs/clipboard-api-guide.md)** - 详细说明剪贴板功能的实现原理和使用方法
- **[开发环境网络配置指南](docs/development-network-setup.md)** - 开发环境网络配置和常见问题解决方案

### 🎯 核心功能

- **可视化编辑器**: 直观的拖拽式页面构建界面
- **丰富的内容模块**: 标题、文本、图片、表格等基础和高级模块
- **R-Cabinet集成**: 无缝的图片管理和上传功能
- **HTML导出**: 一键生成可直接用于乐天店铺的HTML代码
- **模板管理**: 页面模板的创建、保存和重用

### 🏗️ 技术架构

- **前端**: Next.js 15.3 + TypeScript ~5.x + Tailwind CSS 4.1 + shadcn/ui 2.6
- **后端**: Django ~5.1 + Django REST Framework ~3.15 + MySQL 8.4+
- **测试**: Vitest ~3.2.4 (前端) + Pytest ~8.2 (后端)
- **架构**: Monorepo 结构，前后端代码统一管理
- **共享类型**: TypeScript 类型定义在 `packages/shared-types` 中统一维护

## 🚀 快速开始

### 环境要求

**必需软件版本**:
- **Node.js**: >= 20.11.0 (推荐使用 [nvm](https://github.com/nvm-sh/nvm) 管理版本)
- **pnpm**: >= 9.0.0 (包管理器)
- **Python**: ~3.12 (推荐使用 [pyenv](https://github.com/pyenv/pyenv) 管理版本)
- **MySQL**: 8.4+ (数据库)

**推荐IDE配置 (VSCode)**:
```bash
# 必需插件
- TypeScript and JavaScript Language Features (内置)
- Python (ms-python.python)
- Prettier - Code formatter (esbenp.prettier-vscode)
- ESLint (dbaeumer.vscode-eslint)
- Django (batisteo.vscode-django)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)
```

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd pagemaker-cms
   ```

2. **Node.js 环境设置**
   ```bash
   # 使用正确的 Node.js 版本
   nvm use 20.11.0  # 或更高版本
   
   # 安装 pnpm (如果尚未安装)
   npm install -g pnpm@9
   
   # 验证版本
   node --version    # 应显示 v20.11.0 或更高
   pnpm --version    # 应显示 9.x.x 或更高
   ```

3. **Python 环境设置**
   ```bash
   # 切换到后端目录
   cd apps/backend
   
   # 创建虚拟环境 (Python 3.12)
   python3.12 -m venv venv
   
   # 激活虚拟环境
   # Linux/macOS:
   source venv/bin/activate
   # Windows:
   # venv\Scripts\activate
   
   # 验证 Python 版本
   python --version  # 应显示 Python 3.12.x
   
   # 安装 Python 依赖
   pip install -r requirements.txt
   
   # 返回根目录
   cd ../..
   ```

4. **安装前端依赖**
   ```bash
   # 安装所有 workspace 依赖
   pnpm install
   ```

5. **环境变量配置**
   ```bash
   # 复制环境变量模板
   cp .env.example .env
   
   # 编辑 .env 文件，填入实际配置值
   # 参考下方的环境变量说明
   ```

6. **数据库设置**
   ```bash
   # 创建数据库
   mysql -u root -p -e "CREATE DATABASE pagemaker_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -u root -p -e "CREATE USER 'pagemaker_user'@'localhost' IDENTIFIED BY 'your_password_here';"
   mysql -u root -p -e "GRANT ALL PRIVILEGES ON pagemaker_dev.* TO 'pagemaker_user'@'localhost';"
   mysql -u root -p -e "FLUSH PRIVILEGES;"
   
   # 运行数据库迁移
   cd apps/backend
   source venv/bin/activate  # 确保虚拟环境已激活
   python manage.py migrate
   
   # 创建超级用户 (可选)
   python manage.py createsuperuser
   
   cd ../..
   ```

7. **启动开发服务器**
   ```bash
   # 一键启动所有服务 (前端 + 后端)
   pnpm dev
   
   # 或分别启动服务：
   # 前端: pnpm --filter frontend dev
   # 后端: pnpm --filter backend dev
   ```

8. **验证安装**
   - 前端应用: http://localhost:3000
   - 后端API: http://localhost:8000/api/v1
   - Django Admin: http://localhost:8000/admin

### 环境变量说明

创建 `.env` 文件并配置以下变量：

```bash
# 数据库配置
DATABASE_URL=mysql://pagemaker_user:your_password_here@localhost:3306/pagemaker_dev
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=pagemaker_dev
DATABASE_USER=pagemaker_user
DATABASE_PASSWORD=your_password_here

# Django 配置
DJANGO_SECRET_KEY=your-secret-key-here-make-it-long-and-random
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Next.js 配置
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# 环境标识
NODE_ENV=development
PYTHON_ENV=development
```

## 📁 项目结构

```
pagemaker-cms/
├── apps/
│   ├── frontend/             # Next.js 前端应用
│   │   ├── src/
│   │   │   ├── app/          # Next.js App Router
│   │   │   │   ├── components/   # React 组件
│   │   │   │   ├── lib/          # 工具函数
│   │   │   │   ├── services/     # API 服务层
│   │   │   │   └── stores/       # 状态管理 (Zustand)
│   │   │   └── package.json
│   └── backend/              # Django 后端应用
│       ├── pagemaker/        # Django 项目配置
│       ├── users/            # 用户管理应用
│       ├── pages/            # 页面管理应用
│       ├── media/            # 媒体文件管理应用
│       ├── api/              # API 路由
│       └── requirements.txt
├── packages/
│   └── shared-types/         # 前后端共享类型定义
├── docs/                     # 项目文档
│   ├── architecture/         # 架构文档
│   ├── prd/                  # 产品需求文档
│   └── stories/              # 用户故事
├── .env.example              # 环境变量模板
├── CONTRIBUTING.md           # 贡献指南
├── package.json              # Monorepo 根配置
├── pnpm-workspace.yaml       # pnpm workspace 配置
└── README.md                 # 本文件
```

## 🛠️ 开发工具

### 可用脚本

```bash
# 开发模式
pnpm dev              # 启动所有服务
pnpm dev:frontend     # 仅启动前端
pnpm dev:backend      # 仅启动后端 (使用 Makefile)

# 构建
pnpm build            # 构建所有应用

# 测试
pnpm test             # 运行所有测试
pnpm test:frontend    # 仅运行前端测试
pnpm test:backend     # 仅运行后端测试 (使用 Makefile)
pnpm test:shared      # 仅运行共享类型测试

# 代码质量
pnpm lint             # 代码检查
pnpm format           # 代码格式化

# 工具
pnpm clean            # 清理构建文件

# 后端专用命令 (在 apps/backend 目录下)
make help             # 查看所有可用命令
make dev              # 启动开发服务器
make test             # 运行测试 (使用MySQL数据库)
make test-coverage    # 运行测试并生成覆盖率报告
make migrate          # 数据库迁移
make superuser        # 创建超级用户
make shell            # 进入 Django shell
make lint             # 代码检查
make format           # 代码格式化
make clean            # 清理缓存文件
```

### 代码规范

- **前端**: ESLint + Prettier，命名使用 camelCase/PascalCase
- **后端**: Flake8 + Black，命名使用 snake_case/PascalCase
- **提交**: 遵循 Conventional Commits 规范
- **架构模式**: 前端使用服务层模式，后端使用仓库模式

### 测试说明

项目包含完整的测试套件，覆盖前端、后端和共享类型：

**运行所有测试**:
```bash
pnpm test              # 运行前端、后端、共享类型的所有测试
```

**分别运行测试**:
```bash
# 前端测试 (Vitest)
pnpm test:frontend     # 或 cd apps/frontend && pnpm test

# 后端测试 (Pytest + MySQL)
pnpm test:backend      # 或 cd apps/backend && make test

# 共享类型测试 (Jest)
pnpm test:shared       # 或 cd packages/shared-types && pnpm test
```

**后端测试配置**:
- 使用 MySQL 数据库进行测试（不创建新数据库）
- 测试配置文件: `apps/backend/pagemaker/test_settings.py`
- 需要数据库用户有足够权限访问现有数据库
- 支持单元测试和集成测试标记

**测试覆盖率**:
```bash
# 后端测试覆盖率
cd apps/backend && make test-coverage

# 前端测试覆盖率
cd apps/frontend && pnpm test -- --coverage
```

### 调试配置

项目包含 VSCode 调试配置，支持：
- 前端 React 组件调试
- 后端 Django API 调试
- 前后端断点调试
- 热重载开发模式

## 🔧 故障排除

### 常见问题

**Windows 用户**:
- 使用 PowerShell 或 Git Bash 运行命令
- 确保 Python 和 Node.js 已添加到 PATH
- 虚拟环境激活: `venv\Scripts\activate`

**macOS 用户**:
- 使用 Homebrew 安装 MySQL: `brew install mysql`
- 确保 Xcode Command Line Tools 已安装

**Linux 用户**:
- 安装 MySQL 开发包: `sudo apt-get install libmysqlclient-dev`
- 确保 Python 3.12 开发包已安装

**数据库连接问题**:
- 检查 MySQL 服务是否运行
- 验证数据库用户权限
- 确认 `.env` 文件中的数据库配置

**端口冲突**:
- 前端默认端口: 3000
- 后端默认端口: 8000
- 如有冲突，可在启动时指定其他端口

## 📚 文档

- [测试指南](./docs/TESTING.md) - 完整的测试配置和运行说明
- [技术债务清单](./docs/TECHNICAL_DEBT.md) - 已知问题和待优化项目
- [架构文档](./docs/architecture/index.md)
- [产品需求文档](./docs/prd/index.md)
- [开发工作流](./docs/architecture/development-workflow.md)
- [API 文档](./docs/architecture/rest-api-spec.md)
- [贡献指南](./CONTRIBUTING.md)

## 🤝 贡献指南

请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详细的贡献流程和代码规范。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请：
- 创建 [Issue](../../issues)
- 联系开发团队
- 查看 [文档](./docs/)

---

**Pagemaker Team** ❤️

