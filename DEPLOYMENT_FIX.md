# 🚀 部署问题快速修复指南

## 问题描述
后端部署脚本失败，错误信息：`fatal: not a git repository`

## ✅ 已修复的问题
1. 修复了部署脚本中的 git 仓库检测逻辑
2. 添加了首次部署时的自动克隆功能
3. 改进了错误处理和日志记录

## 🔧 立即解决方案

### 方案1: 手动 Git Clone（推荐）⭐

在服务器上手动克隆仓库，这是最简单可靠的方法：

```bash
# 1. 进入部署目录的父目录
cd /root/dev

# 2. 如果已存在 pagemaker 目录，先删除
rm -rf pagemaker

# 3. 克隆你的仓库（替换为实际仓库地址）
git clone https://github.com/your-username/pagemaker.git

# 4. 验证克隆成功
cd pagemaker
git status

# 5. 现在可以直接运行部署脚本
./scripts/deploy-backend.sh
```

### 方案2: 设置 Git 仓库 URL（备选）

如果你更喜欢自动化方式，可以设置环境变量：

```bash
# 一行命令设置并运行
GIT_REPO_URL="https://github.com/your-username/pagemaker.git" ./deploy-backend.sh
```

## 📋 部署前检查清单

在运行部署脚本前，确保：

- [ ] 服务器已安装 Git
- [ ] 服务器已安装 Python 3.12+
- [ ] 服务器已安装 `python3-venv` 包：`apt install python3-venv python3-pip`
- [ ] 服务器已配置 MySQL 数据库
- [ ] 服务器已安装 Nginx 和 Gunicorn
- [ ] 已手动克隆仓库到 `/root/dev/pagemaker`
- [ ] 脚本具有执行权限 (`chmod +x deploy-backend.sh`)

## 🔍 验证修复

部署完成后，检查以下内容：

1. **检查服务状态**：
   ```bash
   systemctl status pagemaker-gunicorn
   systemctl status nginx
   ```

2. **检查应用响应**：
   ```bash
   curl http://localhost:8000/api/health/
   ```

3. **查看部署日志**：
   ```bash
   tail -f /var/log/pagemaker-deploy.log
   ```

## 🆘 常见错误及解决方案

### 1. Python 虚拟环境错误

**错误信息**：`ensurepip is not available`、`创建虚拟环境失败`

**解决方案**：
```bash
# 安装必要的 Python 包
apt update
apt install python3-venv python3-pip

# 如果是非 root 用户
sudo apt update
sudo apt install python3-venv python3-pip
```

### 2. Git 仓库问题

**错误信息**：`fatal: not a git repository`

**解决方案**：
```bash
cd /root/dev && git clone https://github.com/your-username/pagemaker.git
```

### 3. 权限问题

**错误信息**：`Permission denied`

**解决方案**：
```bash
chmod +x scripts/deploy-backend.sh
chown -R root:root /root/dev/pagemaker
```

## 🔍 故障排除步骤

1. **检查详细错误**：
   ```bash
   tail -50 /var/log/pagemaker-deploy.log
   ```

2. **验证系统依赖**：
   ```bash
   python3 --version
   python3 -m venv --help
   git --version
   ```

3. **检查权限**：
   ```bash
   ls -la /root/dev/
   whoami
   ```

4. **手动执行步骤**：
   按照 `scripts/README.md` 中的详细说明逐步执行

## 📞 获取支持

如果问题持续存在，请提供：
- 完整的错误日志
- 服务器环境信息
- Git 仓库访问权限状态

## 🚀 快速操作步骤

**只需要3步即可完成部署**：

```bash
# 步骤1: 克隆仓库
cd /root/dev && git clone https://github.com/your-username/pagemaker.git

# 步骤2: 进入目录
cd pagemaker

# 步骤3: 运行部署
./scripts/deploy-backend.sh
```

**就这么简单！** ✨

---

**修复状态**: ✅ 已完成
**推荐方案**: ✅ 手动克隆（最简单）
**文档状态**: ✅ 已更新 