# Vercel 部署错误修复 v2

## 问题演进

### 第一次错误
```
Error! Unexpected error. Please try again later. ()
```
**原因**：GitHub Actions 和 Vercel 重复构建冲突

### 第二次错误  
```
The vercel.json file should be inside of the provided root directory.
```
**原因**：`amondnet/vercel-action@v25` 的 `working-directory` 参数处理有问题

## 最终解决方案 ✅

### 直接使用 Vercel CLI（不再依赖 vercel-action）

**核心改动**：
1. ❌ 移除 `amondnet/vercel-action@v25`（有 bug）
2. ✅ 直接使用 `npx vercel@latest` CLI
3. ✅ 通过环境变量传递配置
4. ✅ 从正确的目录执行部署

### 修改后的 Workflow

```yaml
- name: Build shared packages
  run: |
    cd ../../packages/shared-types && pnpm build
    cd ../shared-i18n && pnpm build
  
- name: Deploy to Vercel
  id: vercel-deploy
  working-directory: .  # 从根目录开始
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
  run: |
    cd apps/frontend
    npx vercel@latest deploy --prod \
      --token ${{ secrets.VERCEL_TOKEN }} \
      --yes

- name: Get Vercel deployment URL
  id: get-url
  working-directory: .
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
  run: |
    cd apps/frontend
    DEPLOY_URL=$(npx vercel@latest ls --token ${{ secrets.VERCEL_TOKEN }} 2>&1 | grep -o 'https://[^ ]*vercel.app' | head -n 1)
    echo "deployment_url=$DEPLOY_URL" >> $GITHUB_OUTPUT
```

**关键改进**：
- ✅ 从根目录执行，然后 `cd apps/frontend`
- ✅ 环境变量方式传递 ORG_ID 和 PROJECT_ID
- ✅ 使用 `--yes` 跳过交互确认
- ✅ Vercel CLI 自动读取 `apps/frontend/vercel.json`
- ✅ 自动获取部署 URL

### vercel.json 配置

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

## 为什么这样能工作？

### 1. 路径解析
```
GitHub Actions 工作目录: /home/runner/work/pagemaker/pagemaker
执行: cd apps/frontend
结果: /home/runner/work/pagemaker/pagemaker/apps/frontend ✅
```

### 2. Vercel CLI 行为
```bash
cd apps/frontend
npx vercel deploy --prod
# Vercel CLI 自动：
# 1. 读取当前目录的 vercel.json
# 2. 使用环境变量 VERCEL_ORG_ID 和 VERCEL_PROJECT_ID
# 3. 执行 buildCommand（从 ../.. 根目录构建）
# 4. 上传构建产物
```

### 3. Monorepo 依赖
```bash
buildCommand: "cd ../.. && pnpm install && ..."
# 从 apps/frontend 回到根目录
# 安装所有 workspace 依赖
# 按顺序构建 shared-types → shared-i18n → frontend
```

## 验证步骤

### 1. 提交修改

```bash
git add .github/workflows/deploy.yml
git add VERCEL_DEPLOYMENT_FIX.md
git commit -m "fix(deploy): use Vercel CLI directly instead of vercel-action

- Replace amondnet/vercel-action with direct Vercel CLI usage
- Fix working directory issues by using cd instead of action parameter
- Use environment variables for VERCEL_ORG_ID and VERCEL_PROJECT_ID
- Simplify deployment flow and remove action dependencies"

git push origin main
```

### 2. 观察 Actions 日志

成功的部署应该显示：

```
Vercel CLI XX.X.X
🔍 Inspect: https://vercel.com/.../...
✅ Production: https://your-domain.vercel.app [XX.XXs]
```

### 3. 本地测试（可选）

```bash
cd apps/frontend

# 设置环境变量
export VERCEL_ORG_ID="your-org-id"
export VERCEL_PROJECT_ID="your-project-id"

# 测试部署
npx vercel@latest deploy --prod --token YOUR_TOKEN --yes
```

## 对比：Action vs CLI

### 之前（使用 action）
```yaml
- uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    working-directory: ./apps/frontend  # ❌ 有 bug
```

### 现在（直接使用 CLI）
```yaml
- env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
  run: |
    cd apps/frontend
    npx vercel@latest deploy --prod \
      --token ${{ secrets.VERCEL_TOKEN }} \
      --yes  # ✅ 简单直接
```

**优势**：
- ✅ 更灵活，完全控制
- ✅ 没有第三方 action 的 bug
- ✅ 更容易调试
- ✅ 官方 Vercel CLI，更可靠

## 常见问题

### Q1: 为什么不用 vercel-action 了？

`amondnet/vercel-action@v25` 的 `working-directory` 参数有 bug，导致路径解析错误。直接使用 CLI 更可靠。

### Q2: VERCEL_ORG_ID 和 VERCEL_PROJECT_ID 在哪？

在 Vercel Dashboard：
1. 打开你的项目
2. Settings → General
3. 复制 "Project ID"
4. 复制 "Organization ID"（在页面底部）

### Q3: 如何获取部署 URL？

现在通过 `vercel ls` 命令获取最新部署的 URL：

```bash
npx vercel@latest ls --token $TOKEN 2>&1 | grep -o 'https://[^ ]*vercel.app' | head -n 1
```

### Q4: 构建还是失败怎么办？

检查 Vercel Dashboard 的部署日志：
1. 打开 https://vercel.com/
2. 找到你的项目
3. 点击失败的部署
4. 查看详细的构建日志

常见问题：
- 依赖安装失败：检查 `pnpm-lock.yaml` 是否提交
- 构建超时：优化 `buildCommand`
- 环境变量缺失：在 Vercel Dashboard 设置

## 回滚方案

如果新方案有问题，快速回滚到使用 action：

```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    vercel-args: '--prod'
```

然后手动在 Vercel Dashboard 设置 Root Directory 为 `apps/frontend`。

## 总结

✅ **问题根源**：第三方 action 对 monorepo 的支持不好

✅ **解决方案**：直接使用官方 Vercel CLI，完全可控

✅ **关键点**：
- 正确的目录切换
- 环境变量配置
- vercel.json 的 buildCommand

✅ **预期结果**：稳定、可靠的部署流程
