# GitHub Secrets 配置指南

## 🔐 安全配置要求

为了确保 CI/CD 流程的安全性，所有敏感信息都必须通过 GitHub Secrets 进行管理，**绝不能**直接写在代码中。

## 📋 必需的 GitHub Secrets

### Vercel 部署相关
| Secret 名称 | 说明 | 获取方式 |
|------------|------|----------|
| `VERCEL_TOKEN` | Vercel API Token | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel 组织 ID | Vercel 项目设置中查看 |
| `VERCEL_PROJECT_ID` | Vercel 项目 ID | Vercel 项目设置中查看 |

### 服务器部署相关
| Secret 名称 | 说明 | 获取方式 |
|------------|------|----------|
| `SSH_PRIVATE_KEY` | SSH 私钥 | 服务器上的私钥文件内容 |
| `SSH_HOST` | 服务器主机地址 | 服务器 IP 或域名 |
| `SSH_USERNAME` | SSH 用户名 | 通常是 root 或其他用户 |
| `SSH_PORT` | SSH 端口 | 通常是 22 |
| `BACKEND_DEPLOY_PATH` | 后端部署路径 | 如：/root/dev/pagemaker |

## 🛠️ 配置步骤

### 1. 进入 GitHub 仓库设置
1. 打开 GitHub 仓库页面
2. 点击 **Settings** 标签
3. 在左侧菜单中找到 **Secrets and variables**
4. 点击 **Actions**

### 2. 添加 Repository Secrets
点击 **New repository secret** 按钮，逐个添加上述 Secrets。

### 3. Vercel Token 获取步骤
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入 **Settings** → **Tokens**
3. 点击 **Create Token**
4. 输入 Token 名称（如：pagemaker-ci）
5. 选择适当的权限范围
6. 复制生成的 Token

### 4. SSH 密钥配置
```bash
# 在服务器上生成 SSH 密钥对（如果还没有）
ssh-keygen -t rsa -b 4096 -C "pagemaker-deploy"

# 查看私钥内容（复制到 SSH_PRIVATE_KEY Secret）
cat ~/.ssh/id_rsa

# 查看公钥内容（添加到服务器的 authorized_keys）
cat ~/.ssh/id_rsa.pub
```

### 5. 服务器公钥配置
```bash
# 将公钥添加到服务器的 authorized_keys
echo "公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

## 🔍 安全验证清单

### ✅ 必须检查的安全要点

- [ ] 所有敏感信息都使用 GitHub Secrets
- [ ] 代码中没有硬编码的密码、密钥或令牌
- [ ] SSH 私钥权限正确设置（600）
- [ ] Vercel Token 权限最小化
- [ ] 定期轮换 SSH 密钥和 API Token
- [ ] 仓库访问权限控制得当

### ❌ 绝对禁止的做法

```yaml
# ❌ 错误 - 硬编码敏感信息
vercel-token: vkd_1234567890abcdef...
ssh-private-key: |
  -----BEGIN OPENSSH PRIVATE KEY-----
  b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAA...
  
# ❌ 错误 - 在环境变量中暴露
env:
  VERCEL_TOKEN: vkd_1234567890abcdef...
```

```yaml
# ✅ 正确 - 使用 GitHub Secrets
vercel-token: ${{ secrets.VERCEL_TOKEN }}
ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
```

## 🚨 安全事故处理

### 如果意外泄露了敏感信息：

1. **立即撤销/更新凭据**
   - 撤销 Vercel Token
   - 更换 SSH 密钥对
   - 更新 GitHub Secrets

2. **检查 Git 历史**
   ```bash
   # 搜索可能的敏感信息
   git log --all --full-history -- "*.yml" | grep -i "token\|key\|password"
   ```

3. **清理 Git 历史**（如果必要）
   ```bash
   # 使用 git filter-branch 或 BFG Repo-Cleaner
   # 注意：这会改写历史，需要强制推送
   ```

## 📊 定期安全审查

### 每月检查事项
- [ ] 审查所有 GitHub Secrets 的使用情况
- [ ] 检查 SSH 密钥是否需要轮换
- [ ] 验证 Vercel Token 权限是否最小化
- [ ] 审查仓库访问权限

### 每季度检查事项
- [ ] 更新所有 API Token
- [ ] 重新生成 SSH 密钥对
- [ ] 审查 CI/CD 工作流的安全配置
- [ ] 检查依赖包的安全漏洞

## 🔗 相关资源

- [GitHub Secrets 官方文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel API Token 管理](https://vercel.com/docs/rest-api#authentication)
- [SSH 密钥最佳实践](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

---

**重要提醒**: 安全是一个持续的过程，不是一次性的配置。请定期审查和更新安全配置！ 