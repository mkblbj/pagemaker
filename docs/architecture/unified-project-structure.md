# 统一项目结构 (Unified Project Structure)

```plaintext
pagemaker-cms/
├── apps/
│   ├── frontend/             # Next.js 前端应用
│   │   └── ... (前端部分结构不变)
│   │
│   └── backend/              # Django 后端应用
│       └── pagemaker/
│           ├── api/
│           ├── users/
│           │   └── ... (将遵循与pages App相同的内部结构)
│           │
│           ├── pages/  # <--- 对 pages App 进行细化展示
│           │   ├── __init__.py
│           │   ├── apps.py
│           │   ├── models.py         # 存放 PageTemplate 模型
│           │   ├── views.py          # 存放 PageDetailView 等API视图
│           │   ├── urls.py           # 存放 pages App 内部的路由
│           │   ├── serializers.py    # 存放 PageTemplate 的序列化器
│           │   ├── repositories.py   # 存放 PageTemplateRepository
│           │   ├── permissions.py    # 存放 IsOwnerOrAdmin 等权限类
│           │   └── migrations/       # 数据库迁移文件目录
│           │
│           ├── configurations/
│           │   └── ... (将遵循与pages App相同的内部结构)
│           │
│           ├── media/
│           │   └── ... (将遵循与pages App相同的内部结构)
│           │
│           ├── settings.py
│           └── manage.py
│
├── docs/                     # [新增] 项目文档目录
│   ├── prd.md                # 产品需求文档
│   ├── front-end-spec.md     # UI/UX规格说明
│   └── fullstack-architecture.md # 全栈架构文档 (本文档)
│
├── packages/
│   └── shared-types/         # 前后端共享的TypeScript类型定义
│       ├── src/
│       └── package.json
│
├── .gitignore
├── package.json              # Monorepo 根 package.json
├── pnpm-workspace.yaml       # pnpm workspace 配置文件
└── README.md
``` 