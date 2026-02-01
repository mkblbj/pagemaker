# Vercel 部署错误修复

## 问题分析

### 原始错误
```
Error! Unexpected error. Please try again later. ()
Error: The process '/opt/hostedtoolcache/node/20.20.0/x64/bin/npx' failed with exit code 1
```

### 根本原因

1. **重复构建问题**
   - GitHub Actions 在第78行已经执行了 `pnpm build`
   - Vercel Action 又尝试重新构建，导致冲突

2. **工作目录不匹配**
   - GitHub Actions 设置了 `working-directory: apps/frontend`
   - Vercel 需要从项目根目录访问 monorepo 的 workspace 依赖

3. **依赖构建顺序**
   - `frontend` 依赖 `@pagemaker/shared-types` 和 `@pagemaker/shared-i18n`
   - Vercel 需要先构建这些依赖包

## 解决方案

### 方案1：让 Vercel 自己构建（推荐 ⭐）

已实施的修改：

#### 1. 更新 GitHub Actions Workflow

**修改位置**：`.github/workflows/deploy.yml` line 74-92

**改动内容**：
- ❌ 移除 `Build frontend` 步骤（让 Vercel 自己构建）
- ✅ 保留 `Build shared packages` 步骤
- ✅ 添加 `working-directory: ./apps/frontend` 到 Vercel Action
- ✅ 添加 `github-deployment: false` 避免额外的 GitHub 集成

```yaml
# 移除这个步骤
# - name: Build frontend
#   run: pnpm build

- name: Deploy to Vercel
  id: vercel-deploy
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    vercel-args: '--prod --env VERCEL_FUNCTIONS_MAX_DURATION=30'
    working-directory: ./apps/frontend  # ✅ 新增
    github-comment: false
    github-deployment: false  # ✅ 新增
```

#### 2. 更新 vercel.json

**修改位置**：`apps/frontend/vercel.json`

**改动内容**：
- ✅ 添加 `buildCommand` - 从根目录构建所有依赖
- ✅ 添加 `installCommand` - 跳过默认安装（由 buildCommand 处理）
- ✅ 明确指定 `framework: "nextjs"`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": false
  },
  "buildCommand": "cd ../.. && pnpm install && pnpm --filter @pagemaker/shared-types build && pnpm --filter @pagemaker/shared-i18n build && pnpm --filter frontend build",
  "installCommand": "echo 'Skipping install - handled by buildCommand'",
  "framework": "nextjs"
}
```

### 方案2：预构建后上传（备选）

如果方案1仍有问题，可以使用这个方案：

```yaml
- name: Build frontend (with all dependencies)
  run: |
    cd ../..
    pnpm install --frozen-lockfile
    pnpm --filter @pagemaker/shared-types build
    pnpm --filter @pagemaker/shared-i18n build
    pnpm --filter frontend build
  
- name: Deploy pre-built to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    vercel-args: '--prod --prebuilt'
    working-directory: ./apps/frontend
    github-comment: false
    github-deployment: false
```

**注意**：需要在 `vercel.json` 中移除 `buildCommand`。

## 验证步骤

### 1. 提交修改

```bash
cd /home/uo/uomain/pagemaker

git add .github/workflows/deploy.yml
git add apps/frontend/vercel.json
git commit -m "fix: resolve Vercel deployment build conflicts

- Remove duplicate frontend build step from GitHub Actions
- Configure Vercel to build from monorepo root
- Add explicit buildCommand in vercel.json for workspace dependencies
- Set working-directory for vercel-action to avoid path issues"

git push origin main
```

### 2. 检查 GitHub Actions

1. 访问 GitHub Actions 页面
2. 查看最新的 "Deploy" workflow
3. 确认 "Deploy Frontend to Vercel" job 成功

### 3. 预期输出

成功的部署应该显示：

```
Vercel CLI 25.1.0
Retrieving project…
Deploying mkblbjus-gmailcoms-projects/pagemaker-frontend
Inspect: https://vercel.com/...
Building
✅ Production: https://your-domain.vercel.app [XX.XXs]
```

## 常见问题排查

### Q1: 仍然报错 "Unexpected error"

**可能原因**：
- Vercel 项目配置问题
- 环境变量缺失

**解决方法**：
1. 检查 Vercel 项目设置中的环境变量
2. 确认 `VERCEL_PROJECT_ID` 和 `VERCEL_ORG_ID` 正确
3. 尝试在 Vercel Dashboard 手动触发部署，看是否有更详细的错误信息

### Q2: 依赖包构建失败

**错误信息**：
```
Module not found: Can't resolve '@pagemaker/shared-types'
```

**解决方法**：
确保 `buildCommand` 按正确顺序构建依赖：
```bash
pnpm --filter @pagemaker/shared-types build
pnpm --filter @pagemaker/shared-i18n build
pnpm --filter frontend build
```

### Q3: pnpm workspace 不工作

**解决方法**：
在 `vercel.json` 中添加：
```json
{
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm --filter frontend... build"
}
```

### Q4: 构建超时

**错误信息**：
```
Error: Build exceeded maximum duration of XXX seconds
```

**解决方法**：
1. 优化构建命令，避免重复安装
2. 使用 Vercel 的缓存功能
3. 升级 Vercel 计划以获得更长的构建时间

## 其他优化建议

### 1. 使用 Vercel 环境变量

在 Vercel Dashboard 中配置环境变量，而不是在 `vercel-args` 中传递：

```
Settings → Environment Variables → Add
```

### 2. 配置构建缓存

在 `vercel.json` 中：
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": {
        "includeFiles": [
          "../../packages/shared-types/dist/**",
          "../../packages/shared-i18n/dist/**"
        ]
      }
    }
  ]
}
```

### 3. 监控部署时间

如果部署时间超过5分钟，考虑：
- 将 shared packages 发布到 npm
- 使用 Vercel 的 Turborepo 集成

## 回滚方案

如果修改后仍有问题，快速回滚：

```bash
git revert HEAD
git push origin main
```

或使用 Vercel Dashboard 的 "Redeploy" 功能回滚到上一个成功的部署。

## 相关文档

- [Vercel Monorepo 部署指南](https://vercel.com/docs/monorepos)
- [Vercel Build Configuration](https://vercel.com/docs/build-step)
- [GitHub Actions Vercel 集成](https://github.com/amondnet/vercel-action)

## 支持

如果问题持续存在：
1. 查看 Vercel Dashboard 的部署日志
2. 检查 GitHub Actions 的完整日志
3. 尝试本地运行 `vercel build` 测试构建命令
