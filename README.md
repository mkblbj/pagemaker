# Pagemaker CMS

> 乐天店铺页面可视化编辑器 - 让页面创建变得简单高效

## 📖 项目概述

Pagemaker CMS 是一个专为乐天店铺设计的可视化页面编辑器，帮助运营团队快速创建和管理店铺页面内容。通过直观的拖拽界面和丰富的内容模块，用户可以轻松构建专业的页面布局并一键导出HTML代码。

### 🎯 核心功能

- **可视化编辑器**: 直观的拖拽式页面构建界面
- **丰富的内容模块**: 标题、文本、图片、表格等基础和高级模块
- **R-Cabinet集成**: 无缝的图片管理和上传功能
- **HTML导出**: 一键生成可直接用于乐天店铺的HTML代码
- **模板管理**: 页面模板的创建、保存和重用

### 🏗️ 技术架构

- **前端**: Next.js 15.3 + TypeScript + Tailwind CSS + shadcn/ui
- **后端**: Django 5.1 + Django REST Framework + MySQL 8.4+
- **架构**: Monorepo 结构，前后端代码统一管理
- **共享类型**: TypeScript 类型定义在 `packages/shared-types` 中统一维护

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **Python**: ~3.12
- **MySQL**: 8.4+
- **pnpm**: >= 9.0.0

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd pagemaker-cms
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **环境配置**
   ```bash
   # 复制环境变量模板
   cp .env.example .env
   # 编辑 .env 文件，填入实际配置值
   ```

4. **数据库设置**
   ```bash
   # 创建数据库
   mysql -u root -p -e "CREATE DATABASE pagemaker_cms;"
   
   # 运行数据库迁移 (后续步骤)
   cd apps/backend
   python manage.py migrate
   ```

5. **启动开发服务器**
   ```bash
   # 启动所有服务 (前端 + 后端)
   pnpm dev
   
   # 或分别启动
   # 前端: cd apps/frontend && pnpm dev
   # 后端: cd apps/backend && python manage.py runserver
   ```

6. **访问应用**
   - 前端: http://localhost:3000
   - 后端API: http://localhost:8000/api/v1

## 📁 项目结构

```
pagemaker-cms/
├── apps/
│   ├── frontend/             # Next.js 前端应用
│   └── backend/              # Django 后端应用
├── packages/
│   └── shared-types/         # 前后端共享类型定义
├── docs/                     # 项目文档
│   ├── architecture/         # 架构文档
│   ├── prd/                  # 产品需求文档
│   └── stories/              # 用户故事
├── package.json              # Monorepo 根配置
├── pnpm-workspace.yaml       # pnpm workspace 配置
└── README.md                 # 本文件
```

## 🛠️ 开发工具

### 可用脚本

```bash
# 开发模式 (所有应用)
pnpm dev

# 构建所有应用
pnpm build

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 清理构建文件
pnpm clean
```

### 代码规范

- **前端**: ESLint + Prettier，命名使用 camelCase/PascalCase
- **后端**: Flake8 + Black，命名使用 snake_case/PascalCase
- **提交**: 遵循 Conventional Commits 规范

## 📚 文档

- [架构文档](./docs/architecture/index.md)
- [产品需求文档](./docs/prd/index.md)
- [开发工作流](./docs/architecture/development-workflow.md)
- [API 文档](./docs/architecture/rest-api-spec.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请：
- 创建 [Issue](../../issues)
- 联系开发团队
- 查看 [文档](./docs/)

---

**Pagemaker Team** ❤️

