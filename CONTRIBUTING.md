# 贡献指南 (Contributing Guide)

欢迎为 Pagemaker CMS 项目做出贡献！本指南将帮助您了解如何参与项目开发。

## 📋 目录

- [开始之前](#开始之前)
- [开发环境设置](#开发环境设置)
- [Git 工作流程](#git-工作流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [测试要求](#测试要求)
- [代码审查清单](#代码审查清单)

## 🚀 开始之前

### 前置要求

请确保您已安装以下软件：
- **Node.js**: >= 20.11.0
- **pnpm**: >= 9.0.0  
- **Python**: ~3.12
- **MySQL**: 8.4+
- **Git**: 最新版本

### 技术栈了解

在开始贡献之前，建议您熟悉以下技术：
- **前端**: Next.js 15.3, TypeScript, Tailwind CSS, shadcn/ui
- **后端**: Django 5.1, Django REST Framework, MySQL
- **测试**: Vitest (前端), Pytest (后端)
- **工具**: ESLint, Prettier, Black, Flake8

## 🛠️ 开发环境设置

1. **Fork 并克隆项目**
   ```bash
   git clone https://github.com/YOUR_USERNAME/pagemaker.git
   cd pagemaker
   ```

2. **设置上游仓库**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/pagemaker.git
   ```

3. **安装依赖**
   ```bash
   # 安装所有依赖
   pnpm install
   
   # 设置后端环境
   cd apps/backend
   python3.12 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd ../..
   ```

4. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入您的配置
   ```

5. **初始化数据库**
   ```bash
   # 创建数据库
   mysql -u root -p -e "CREATE DATABASE pagemaker_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   
   # 运行迁移
   cd apps/backend
   source venv/bin/activate
   python manage.py migrate
   cd ../..
   ```

6. **启动开发服务器**
   ```bash
   pnpm dev
   ```

## 📝 Git 工作流程

### 分支命名规范

使用以下格式创建分支：

```bash
# 功能开发
feature/短描述-issue号
# 示例: feature/user-authentication-123

# Bug 修复
bugfix/短描述-issue号  
# 示例: bugfix/login-error-456

# 热修复
hotfix/短描述-issue号
# 示例: hotfix/security-patch-789

# 文档更新
docs/短描述
# 示例: docs/api-documentation

# 重构
refactor/短描述
# 示例: refactor/user-service-cleanup
```

### 工作流程

1. **创建分支**
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```

2. **开发过程**
   ```bash
   # 定期提交
   git add .
   git commit -m "feat: add user authentication"
   
   # 定期同步主分支
   git fetch upstream
   git rebase upstream/main
   ```

3. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **创建 Pull Request**
   - 在 GitHub 上创建 PR
   - 填写 PR 模板
   - 请求代码审查

## 📏 代码规范

### 前端代码规范

**命名约定**:
- 组件: `PascalCase` (例: `UserProfile.tsx`)
- 函数/变量: `camelCase` (例: `getUserData`)
- 常量: `UPPER_SNAKE_CASE` (例: `API_BASE_URL`)
- 文件名: `kebab-case` (例: `user-profile.tsx`)

**目录结构**:
```
src/
├── app/                    # Next.js App Router
├── components/             # React 组件
│   ├── ui/                # 基础 UI 组件
│   ├── feature/           # 功能组件
│   └── layout/            # 布局组件
├── lib/                   # 工具函数
├── services/              # API 服务层
└── stores/                # 状态管理
```

**代码规则**:
- 必须使用 TypeScript
- 必须使用服务层调用 API，组件不直接使用 fetch/axios
- 必须使用共享类型 (`@pagemaker/shared-types`)
- 组件必须有 PropTypes 或 TypeScript 类型定义
- 避免使用 `any` 类型

### 后端代码规范

**命名约定**:
- 类: `PascalCase` (例: `UserRepository`)
- 函数/变量: `snake_case` (例: `get_user_data`)
- 常量: `UPPER_SNAKE_CASE` (例: `API_VERSION`)
- 文件名: `snake_case` (例: `user_repository.py`)

**架构规则**:
- 必须使用仓库模式，视图不直接调用 ORM
- 必须使用 DRF 序列化器进行数据验证
- 数据库查询必须在 Repository 层
- 业务逻辑必须在 Service 层（如果存在）

**Django 应用结构**:
```
app_name/
├── __init__.py
├── admin.py               # Django Admin 配置
├── apps.py                # 应用配置
├── models.py              # 数据模型
├── serializers.py         # DRF 序列化器
├── repositories.py        # 数据访问层
├── permissions.py         # 权限控制
├── views.py               # API 视图
├── urls.py                # URL 路由
├── tests.py               # 单元测试
└── migrations/            # 数据库迁移
```

### 通用规范

- 代码必须通过 linting 检查
- 必须包含适当的注释和文档字符串
- 避免硬编码，使用配置文件或环境变量
- 遵循 DRY (Don't Repeat Yourself) 原则

## 📝 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式修改 (不影响逻辑)
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 提交格式

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 示例

```bash
# 功能开发
git commit -m "feat(auth): add JWT token authentication"

# Bug 修复  
git commit -m "fix(api): resolve user data validation error"

# 文档更新
git commit -m "docs(readme): update installation instructions"

# 重构
git commit -m "refactor(user): extract user service from view"

# 测试
git commit -m "test(auth): add unit tests for login functionality"
```

### 提交最佳实践

- 每次提交应该是一个逻辑单元
- 提交信息应该清晰描述变更内容
- 避免过大的提交，拆分为多个小提交
- 提交前运行测试确保代码正常工作

## 🔄 Pull Request 流程

### PR 准备清单

提交 PR 前请确认：

- [ ] 代码通过所有测试
- [ ] 代码通过 linting 检查
- [ ] 已添加必要的测试用例
- [ ] 已更新相关文档
- [ ] 提交信息遵循规范
- [ ] 分支已同步最新的 main 分支

### PR 模板

创建 PR 时请包含以下信息：

```markdown
## 变更描述
简要描述本次 PR 的主要变更内容

## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 重构
- [ ] 文档更新
- [ ] 性能优化
- [ ] 其他

## 测试
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试完成

## 检查清单
- [ ] 代码符合项目规范
- [ ] 已添加必要的测试
- [ ] 文档已更新
- [ ] 无 breaking changes 或已在描述中说明

## 相关 Issue
关闭 #issue号
```

### 代码审查流程

1. **自动检查**: CI/CD 管道会自动运行测试和代码检查
2. **人工审查**: 至少需要一名维护者的审查批准
3. **修改反馈**: 根据审查意见修改代码
4. **合并**: 审查通过后由维护者合并

## 🧪 测试要求

### 前端测试

- **单元测试**: 使用 Vitest 测试组件和工具函数
- **测试文件**: 与被测试文件同目录，命名为 `*.test.ts(x)`
- **覆盖率**: 新代码测试覆盖率应达到 80% 以上

```bash
# 运行前端测试
pnpm test:frontend

# 带覆盖率报告
pnpm --filter frontend test:coverage
```

### 后端测试

- **单元测试**: 使用 Pytest 测试 API 和业务逻辑
- **测试文件**: 每个 Django 应用的 `tests.py` 或 `tests/` 目录
- **覆盖率**: 新代码测试覆盖率应达到 85% 以上

```bash
# 运行后端测试
pnpm test:backend

# 带覆盖率报告
cd apps/backend && pytest --cov=. --cov-report=html
```

### 测试编写指南

**前端测试示例**:
```typescript
// components/UserProfile.test.tsx
import { render, screen } from '@testing-library/react'
import { UserProfile } from './UserProfile'

describe('UserProfile', () => {
  it('should display user name', () => {
    const user = { id: 1, name: 'John Doe' }
    render(<UserProfile user={user} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})
```

**后端测试示例**:
```python
# users/tests.py
from django.test import TestCase
from rest_framework.test import APIClient
from .models import User

class UserAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

    def test_user_creation(self):
        response = self.client.post('/api/v1/users/', {
            'username': 'newuser',
            'password': 'newpass123'
        })
        self.assertEqual(response.status_code, 201)
```

## ✅ 代码审查清单

### 功能性检查

- [ ] 功能按预期工作
- [ ] 边界情况已考虑
- [ ] 错误处理适当
- [ ] 性能影响可接受

### 代码质量检查

- [ ] 代码清晰易读
- [ ] 变量和函数命名恰当
- [ ] 无重复代码
- [ ] 注释充分且有用

### 安全性检查

- [ ] 无 SQL 注入风险
- [ ] 用户输入已验证
- [ ] 敏感信息未硬编码
- [ ] 权限控制正确

### 测试检查

- [ ] 测试覆盖率充分
- [ ] 测试用例有意义
- [ ] 测试易于维护

### 文档检查

- [ ] API 文档已更新
- [ ] README 如需要已更新
- [ ] 变更日志已记录

## 🆘 获取帮助

如果您在贡献过程中遇到问题：

1. **查看文档**: 首先查看项目文档和 FAQ
2. **搜索 Issues**: 在 GitHub Issues 中搜索相关问题
3. **创建 Issue**: 如果问题未被报告，创建新的 Issue
4. **联系维护者**: 通过 Issue 或邮件联系项目维护者

## 📜 许可证

通过贡献代码，您同意您的贡献将在与项目相同的 MIT 许可证下发布。

---

感谢您为 Pagemaker CMS 项目做出贡献！ 🎉 