# CI/CD 使用指南

## 概述

Pagemaker 项目使用 GitHub Actions 实现自动化的持续集成和持续部署（CI/CD）流程。本文档详细说明了工作流配置、使用方法和故障排除步骤。

## 工作流概览

### 1. CI 工作流 (`.github/workflows/ci.yml`)

**触发条件:**
- 推送到 `main` 或 `develop` 分支
- 向 `main` 或 `develop` 分支提交 Pull Request

**执行内容:**
- 前端代码检查（ESLint、Prettier、TypeScript）
- 后端代码检查（Flake8、Black）
- 前后端单元测试和集成测试
- 共享类型包测试
- 代码覆盖率检查（≥80%）

### 2. 覆盖率报告工作流 (`.github/workflows/coverage.yml`)

**触发条件:**
- Pull Request 到 `main` 或 `develop` 分支

**执行内容:**
- 生成详细的覆盖率报告
- 在 PR 中自动评论覆盖率变化
- 上传覆盖率报告到 GitHub Actions artifacts

### 3. 安全扫描工作流 (`.github/workflows/security.yml`)

**触发条件:**
- 推送到 `main` 或 `develop` 分支
- Pull Request 到 `main` 或 `develop` 分支
- 每周一凌晨 2 点定时执行

**执行内容:**
- CodeQL 安全分析（JavaScript 和 Python）
- 前端依赖漏洞扫描（npm audit）
- 后端依赖漏洞扫描（Safety + Bandit）
- 依赖许可证检查

### 4. 部署工作流 (`.github/workflows/deploy.yml`)

**触发条件:**
- 推送到 `main` 分支
- 手动触发

**执行内容:**
- 前端部署到 Vercel
- 后端部署到云服务器
- 部署后健康检查
- 部署失败时自动回滚

## 质量门禁

### 代码覆盖率要求
- **前端覆盖率**: ≥80%
- **后端覆盖率**: ≥80%
- 覆盖率不达标时工作流会失败

### 代码质量要求
- 所有 ESLint 规则必须通过
- 代码必须通过 Prettier 格式检查
- Python 代码必须通过 Flake8 和 Black 检查
- TypeScript 类型检查必须通过

### 安全要求
- 不能有中等及以上级别的安全漏洞
- 依赖许可证必须符合白名单要求
- CodeQL 扫描不能发现严重安全问题

## 使用指南

### 开发流程

1. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **本地开发和测试**
   ```bash
   # 前端
   cd apps/frontend
   pnpm lint
   pnpm format:check
   pnpm test

   # 后端
   cd apps/backend
   flake8 .
   black --check .
   python manage.py test
   ```

3. **提交代码**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

4. **创建 Pull Request**
   - CI 工作流会自动运行
   - 覆盖率报告会自动评论到 PR
   - 安全扫描会在后台执行

5. **合并到主分支**
   - 合并后会自动触发部署工作流
   - 前端部署到 Vercel，后端部署到云服务器

### 手动触发部署

在 GitHub 仓库页面：
1. 点击 "Actions" 标签
2. 选择 "Deploy" 工作流
3. 点击 "Run workflow" 按钮
4. 选择要部署的分支（通常是 main）
5. 点击 "Run workflow"

## 故障排除指南

### 常见问题和解决方案

#### 1. 测试失败

**症状**: CI 工作流在测试步骤失败

**排查步骤**:
```bash
# 本地运行测试
cd apps/frontend
pnpm test

cd apps/backend
python manage.py test
```

**常见原因**:
- 测试代码过时
- 依赖版本不兼容
- 环境变量缺失

**解决方案**:
- 更新测试代码
- 检查 `package.json` 和 `requirements.txt`
- 确认测试环境配置正确

#### 2. 代码格式检查失败

**症状**: ESLint 或 Prettier 检查失败

**修复方法**:
```bash
# 前端格式修复
cd apps/frontend
pnpm lint --fix
pnpm format

# 后端格式修复
cd apps/backend
black .
```

#### 3. 代码覆盖率不达标

**症状**: 覆盖率低于 80% 阈值

**排查步骤**:
```bash
# 查看详细覆盖率报告
cd apps/frontend
pnpm test -- --coverage

cd apps/backend
coverage run --source='.' manage.py test
coverage report --show-missing
```

**解决方案**:
- 为未覆盖的代码添加测试
- 移除不必要的代码
- 在覆盖率配置中排除测试文件

#### 4. 部署失败

**症状**: 部署工作流失败

**诊断步骤**:

1. **检查 GitHub Secrets**
   - `VERCEL_TOKEN`
   - `SSH_PRIVATE_KEY`
   - `SSH_HOST`
   - `SSH_USERNAME`
   - `SSH_PORT`
   - `BACKEND_DEPLOY_PATH`

2. **检查服务器连接**
   ```bash
   ssh -p $SSH_PORT $SSH_USERNAME@$SSH_HOST
   ```

3. **查看部署日志**
   ```bash
   ssh server "tail -50 /var/log/pagemaker-deploy.log"
   ```

**常见解决方案**:
- 更新过期的 SSH 密钥
- 检查服务器磁盘空间
- 验证数据库连接
- 重启相关服务

#### 5. Vercel 部署问题

**症状**: 前端部署到 Vercel 失败

**排查方法**:
1. 检查 Vercel Token 是否有效
2. 确认项目 ID 和 Org ID 正确
3. 检查构建日志中的错误信息

**解决步骤**:
```bash
# 本地测试构建
cd apps/frontend
pnpm build
```

#### 6. GitHub Secrets 配置错误

**症状**: 工作流中出现认证错误

**诊断方法**:
1. 在 GitHub 仓库设置中检查 Secrets
2. 确认 Secret 名称拼写正确
3. 验证 Secret 值的有效性

**配置步骤**:
1. 进入 GitHub 仓库 → Settings → Secrets and variables → Actions
2. 点击 "New repository secret"
3. 添加所需的 Secret

### 紧急情况处理

#### 紧急停用 CI/CD

如果需要紧急停用所有工作流：

1. **临时禁用**:
   - 进入 GitHub 仓库 → Actions
   - 点击工作流名称
   - 点击右上角的 "..." → "Disable workflow"

2. **永久禁用**:
   ```bash
   # 重命名工作流文件
   git mv .github/workflows/ci.yml .github/workflows/ci.yml.disabled
   ```

#### 紧急回滚

**自动回滚**: 部署失败时会自动触发回滚

**手动回滚**:
```bash
# SSH 到服务器
ssh server

# 运行回滚脚本
cd /root/dev/pagemaker
source deploy-backend.sh
rollback
```

#### 手动部署备用方案

如果 CI/CD 完全不可用：

**前端手动部署**:
```bash
cd apps/frontend
pnpm build
# 手动上传到 Vercel 或其他托管服务
```

**后端手动部署**:
```bash
# SSH 到服务器
ssh server
cd /root/dev/pagemaker
git pull origin main
cd apps/backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart pagemaker-gunicorn
```

## 工作流监控

### 状态徽章

在 README.md 中添加状态徽章来监控工作流状态：

```markdown
![CI](https://github.com/your-org/pagemaker/workflows/CI/badge.svg)
![Security](https://github.com/your-org/pagemaker/workflows/Security%20Scan/badge.svg)
![Deploy](https://github.com/your-org/pagemaker/workflows/Deploy/badge.svg)
```

### 日志分析

**查看工作流日志**:
1. 进入 GitHub 仓库 → Actions
2. 点击具体的工作流运行
3. 展开各个步骤查看详细日志

**下载日志**:
1. 在工作流运行页面
2. 点击右上角的齿轮图标
3. 选择 "Download logs"

### 性能监控

**工作流执行时间优化**:
- 使用缓存减少依赖安装时间
- 并行执行独立的任务
- 优化测试套件执行速度

**资源使用监控**:
- 关注 GitHub Actions 使用配额
- 监控工作流执行频率
- 优化不必要的工作流触发

## 最佳实践

### 开发最佳实践

1. **提交前本地验证**
   ```bash
   # 运行完整的本地检查
   pnpm run ci:check  # 如果配置了此脚本
   ```

2. **小步骤提交**
   - 避免大型 PR 导致的复杂冲突
   - 每个提交都应该是可工作的状态

3. **测试先行**
   - 新功能必须包含测试
   - 修复 bug 时添加回归测试

### CI/CD 维护

1. **定期更新依赖**
   ```bash
   # 更新 GitHub Actions
   # 检查 .github/workflows/ 中的 action 版本
   ```

2. **监控安全扫描结果**
   - 及时处理发现的安全漏洞
   - 定期审查依赖许可证

3. **备份关键配置**
   - GitHub Secrets 的备份记录
   - 部署脚本的版本控制

## 联系和支持

如果遇到本文档未覆盖的问题：

1. **查看 GitHub Issues**: 搜索相关问题
2. **创建新 Issue**: 详细描述问题和重现步骤
3. **联系团队**: 通过项目沟通渠道寻求帮助

---

**文档版本**: v1.0  
**最后更新**: 2024-12-19  
**维护者**: Pagemaker 开发团队 