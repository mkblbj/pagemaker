# Vercel Token 更新指南

## 问题描述
GitHub Action 部署时出现认证错误：`You must re-authenticate to use mkblbjus-gmailcoms-projects scope`

这表示 Vercel Token 已过期或权限不足。

## 解决步骤

### 1. 生成新的 Vercel Token

1. 访问 [Vercel Dashboard Tokens](https://vercel.com/account/tokens)
2. 点击 **Create Token**
3. 填写 Token 信息：
   - **Token Name**: `GitHub Actions Pagemaker Deploy`
   - **Scope**: 选择你的账号/团队
   - **Expiration**: 建议选择 **No Expiration**（永不过期）或根据需要设置
4. 点击 **Create**
5. **⚠️ 立即复制生成的 Token！** Token 只会显示一次

### 2. 更新 GitHub Secrets

1. 访问你的 GitHub 仓库
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 找到 `VERCEL_TOKEN` secret
4. 点击右侧的 **Update** 按钮
5. 粘贴新生成的 Token
6. 点击 **Update secret**

### 3. 验证其他 Vercel Secrets

确保以下 secrets 也是正确的：

#### 获取 VERCEL_ORG_ID

```bash
# 在项目根目录运行
vercel link

# 然后查看 .vercel/project.json 文件
cat apps/frontend/.vercel/project.json
```

#### 获取 VERCEL_PROJECT_ID

```bash
# 在 .vercel/project.json 中可以找到
# 或访问 Vercel Dashboard → 项目设置
```

### 4. 重新运行 GitHub Action

1. 进入 GitHub 仓库的 **Actions** 标签
2. 选择失败的 workflow
3. 点击 **Re-run failed jobs** 或 **Re-run all jobs**

## 常见问题

### Q1: Token 生成后立即失效
**A:** 检查 Vercel 账号是否有权限访问该项目。如果是团队项目，确保你是团队成员。

### Q2: Token 权限不足
**A:** 生成 Token 时确保：
- Scope 选择了正确的账号/团队
- 包含部署权限（默认包含）

### Q3: 仍然提示需要重新认证
**A:** 可能的原因：
1. **项目 Scope 变更**: Vercel 项目从个人账号迁移到团队账号
   - 解决：使用团队账号重新生成 Token
2. **GitHub Secret 未正确保存**: 
   - 检查是否有多余的空格或换行符
   - 重新复制粘贴 Token
3. **Vercel Action 版本问题**:
   - 尝试更新到最新版本的 vercel-action

### Q4: 如何避免 Token 频繁过期？
**A:** 
1. 创建 Token 时选择 **No Expiration**
2. 使用服务账号而不是个人账号
3. 定期检查 Token 状态（每季度一次）

## 替代方案：使用 Vercel CLI 直接部署

如果 `amondnet/vercel-action` 持续有问题，可以改用官方的 Vercel CLI：

```yaml
- name: Deploy to Vercel
  run: |
    npm i -g vercel
    vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
  working-directory: apps/frontend
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Token 安全最佳实践

1. **永远不要** 将 Token 提交到代码仓库
2. **定期审查** Vercel 的 Token 使用日志
3. **使用 GitHub Secrets** 而不是硬编码
4. **设置合理的过期时间** 平衡安全性和便利性
5. **当 Token 泄露时立即撤销** 并生成新的

## 监控和维护

### 设置 Token 过期提醒

1. 在日历中设置提醒（如果设置了过期时间）
2. 监控 GitHub Actions 失败通知
3. 定期检查 Vercel Dashboard 的活动日志

### Token 使用记录

建议在团队文档中记录：
- Token 创建日期
- 预计过期日期（如果设置）
- 最后验证日期
- 负责人

## 联系支持

如果上述方法都无法解决问题：

1. **Vercel Support**: https://vercel.com/support
2. **GitHub Actions Issues**: 检查 [amondnet/vercel-action](https://github.com/amondnet/vercel-action/issues) 的已知问题
3. **Vercel 状态页**: https://www.vercel-status.com/

## 参考资源

- [Vercel CLI 文档](https://vercel.com/docs/cli)
- [GitHub Actions Secrets 管理](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel API Tokens](https://vercel.com/docs/rest-api#introduction/api-basics/authentication)

