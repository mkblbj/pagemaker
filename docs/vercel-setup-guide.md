# Vercel 部署配置指南

## 🚀 **方案1: 使用 GitHub Actions 自动部署（推荐）**

### **1. 获取 Vercel 凭据**

#### **Step 1: 获取 VERCEL_TOKEN**
1. 访问：https://vercel.com/account/tokens
2. 点击 "Create Token"
3. 输入名称（如：`pagemaker-deploy`）
4. 复制生成的 token

#### **Step 2: 获取 VERCEL_ORG_ID 和 VERCEL_PROJECT_ID**
1. 在 Vercel 中创建新项目或访问现有项目
2. 进入项目设置页面
3. 在 "General" 选项卡中找到：
   - **Project ID**: `VERCEL_PROJECT_ID`
   - **Team ID** (或 **User ID**): `VERCEL_ORG_ID`

### **2. 配置 GitHub Secrets**

1. 访问你的 GitHub 仓库
2. 进入 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret`
4. 添加以下 secrets：

| Secret Name | 描述 | 示例值 |
|-------------|------|--------|
| `VERCEL_TOKEN` | Vercel 个人访问令牌 | `vercel_xxx...` |
| `VERCEL_ORG_ID` | Vercel 组织/用户 ID | `team_xxx...` 或 `user_xxx...` |
| `VERCEL_PROJECT_ID` | Vercel 项目 ID | `prj_xxx...` |

### **3. 触发自动部署**

配置完成后，有两种方式触发部署：

#### **自动触发**
- 推送代码到 `main` 分支会自动触发部署

#### **手动触发**
1. 访问 `Actions` 选项卡
2. 选择 `Deploy` workflow
3. 点击 `Run workflow`

---

## 🛠️ **方案2: 本地 Vercel CLI 部署**

如果你仍想使用 CLI，可以尝试以下方法：

### **解决认证问题**

#### **方法1: 使用真正的终端**
```bash
# 在系统终端（不是 IDE 集成终端）运行
vercel login
# 使用方向键选择 "Continue with GitHub"
# 按 Enter 确认
```

#### **方法2: 使用 Token 认证**
```bash
# 获取 Vercel Token 后
export VERCEL_TOKEN="your_vercel_token_here"
vercel --token $VERCEL_TOKEN
```

#### **方法3: 手动浏览器认证**
1. 访问：https://vercel.com/login
2. 使用 GitHub 登录
3. 在终端运行：`vercel login`
4. 复制显示的 URL 到浏览器完成认证

### **常见问题解决**

#### **问题1: 非交互式环境**
```bash
# 如果在 CI 或非交互式环境中
vercel --token $VERCEL_TOKEN --yes
```

#### **问题2: 权限问题**
```bash
# 确保有正确的文件权限
chmod +x node_modules/.bin/vercel
```

---

## 📋 **部署检查清单**

### **部署前检查**
- [ ] 前端 lint 检查通过：`pnpm lint`
- [ ] 前端测试通过：`pnpm test`
- [ ] 后端测试通过：`make test`
- [ ] 构建成功：`pnpm build`

### **Vercel 配置检查**
- [ ] `vercel.json` 配置正确
- [ ] 环境变量已设置
- [ ] 域名配置（如需要）

### **GitHub Actions 检查**
- [ ] 所有必要的 secrets 已配置
- [ ] Workflow 文件语法正确
- [ ] 权限设置正确

---

## 🎯 **推荐流程**

1. **使用 GitHub Actions**（最简单）
   - 配置 secrets → 推送代码 → 自动部署

2. **本地 CLI 调试**（可选）
   - 用于快速测试和调试

3. **生产部署**
   - 始终使用 GitHub Actions 确保一致性

---

## 🆘 **故障排除**

### **常见错误及解决方案**

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `re-authenticate` | Token 过期 | 重新生成 VERCEL_TOKEN |
| `permission denied` | 权限不足 | 检查 token 权限设置 |
| `project not found` | 项目 ID 错误 | 验证 VERCEL_PROJECT_ID |
| `team not found` | 组织 ID 错误 | 验证 VERCEL_ORG_ID |

### **调试命令**
```bash
# 检查 Vercel CLI 状态
vercel whoami

# 查看项目信息
vercel ls

# 查看部署日志
vercel logs
```

---

## 📞 **获取帮助**

如果遇到问题：
1. 检查 [Vercel 官方文档](https://vercel.com/docs)
2. 查看 GitHub Actions 运行日志
3. 检查项目的 `vercel.json` 配置
4. 联系项目维护者 