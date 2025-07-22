# 开发环境网络配置指南

## 📋 概述

本文档详细说明了Pagemaker CMS开发环境的网络配置，包括远程开发、内网访问和剪贴板API支持等相关问题的解决方案。

## 🌐 网络环境类型

### 1. 本地开发环境

```bash
# 前端访问地址
http://localhost:3002

# 后端API地址
http://localhost:8456

# 特点
✅ 支持现代剪贴板API
✅ 完整的开发工具支持
✅ 热重载和调试功能
```

### 2. 远程服务器开发环境

```bash
# 服务器IP：192.168.1.26
# 前端访问地址
http://192.168.1.26:3002

# 后端API地址
http://192.168.1.26:8456

# 特点
❌ 不支持现代剪贴板API（非安全上下文）
✅ 可以多人同时访问
✅ 真实网络环境测试
```

## 🔧 环境变量配置

### 本地开发配置

```bash
# .env
NEXT_PUBLIC_API_URL=http://localhost:8456
NEXTAUTH_URL=http://localhost:3002
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:3002,http://127.0.0.1:3002
```

### 远程开发配置

```bash
# .env
NEXT_PUBLIC_API_URL=http://192.168.1.26:8456
NEXTAUTH_URL=http://192.168.1.26:3002
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.26
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:3002,http://127.0.0.1:3002,http://192.168.1.26:3002
```

## 🐛 常见问题与解决方案

### 1. 前端无法连接后端

#### 问题表现
- 登录页面无响应
- API请求失败
- 网络错误提示

#### 原因分析
```javascript
// 错误配置：前端在浏览器中访问时，localhost指向用户的本地机器
浏览器访问：http://192.168.1.26:3002
前端尝试连接：http://localhost:8456  ❌ 
                     ↳ 这指向用户的本地机器，不是服务器
```

#### 解决方案
1. **修改环境变量**
   ```bash
   # 将 localhost 改为实际的服务器IP
   NEXT_PUBLIC_API_URL=http://192.168.1.26:8456
   ```

2. **重启前端服务**
   ```bash
   cd apps/frontend
   # 停止当前服务（Ctrl+C）
   pnpm run dev
   ```

### 2. 剪贴板API在内网IP下不工作

#### 问题表现
- 复制按钮提示成功，但剪贴板没有内容
- 只能使用传统复制方法
- 现代剪贴板API被浏览器阻止

#### 原因分析
```javascript
// 浏览器安全限制
http://192.168.1.26:3002  // ❌ 不是安全上下文
https://example.com       // ✅ 安全上下文
http://localhost:3002     // ✅ 安全上下文
```

#### 解决方案

##### 方案1：Chrome开发者标志（推荐）

1. 打开Chrome，访问：`chrome://flags/`
2. 搜索："Insecure origins treated as secure"
3. 添加：`http://192.168.1.26:3002`
4. 重启浏览器

##### 方案2：SSH端口转发

```bash
# 在本地机器运行
ssh -L 3002:localhost:3002 -L 8456:localhost:8456 user@192.168.1.26

# 然后在浏览器访问
http://localhost:3002  # ✅ 支持现代剪贴板API
```

##### 方案3：HTTPS开发环境

```bash
# 生成自签名证书
cd apps/frontend
chmod +x generate-cert.sh
./generate-cert.sh

# 修改启动脚本
"dev": "next dev --experimental-https --experimental-https-key ./certs/dev-key.pem --experimental-https-cert ./certs/dev-cert.pem"

# 访问地址变为
https://192.168.1.26:3002  # ✅ 支持现代剪贴板API
```

## 🔍 网络诊断命令

### 检查服务状态

```bash
# 检查后端服务
curl -I http://192.168.1.26:8456/api/v1/health/

# 检查前端服务
curl -I http://192.168.1.26:3002

# 检查端口占用
netstat -tlnp | grep :3002
netstat -tlnp | grep :8456
```

### 检查网络连通性

```bash
# 检查服务器连通性
ping 192.168.1.26

# 检查端口开放
telnet 192.168.1.26 3002
telnet 192.168.1.26 8456

# 检查防火墙状态
sudo ufw status
```

## 🛡️ 安全配置

### 防火墙设置

```bash
# 开放开发端口
sudo ufw allow 3002
sudo ufw allow 8456

# 仅允许内网访问（可选）
sudo ufw allow from 192.168.1.0/24 to any port 3002
sudo ufw allow from 192.168.1.0/24 to any port 8456
```

### CORS配置

```python
# Django settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "http://192.168.1.26:3002",
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3002",
    "http://127.0.0.1:3002", 
    "http://192.168.1.26:3002",
]
```

## 📊 环境对比表

| 配置项 | 本地开发 | 远程开发 | 生产环境 |
|--------|----------|----------|----------|
| 前端地址 | `localhost:3002` | `192.168.1.26:3002` | `https://domain.com` |
| 后端地址 | `localhost:8456` | `192.168.1.26:8456` | `https://api.domain.com` |
| 剪贴板API | ✅ 现代API | ❌ 传统方法 | ✅ 现代API |
| HTTPS | ❌ | ❌ | ✅ |
| 多人访问 | ❌ | ✅ | ✅ |

## 🚀 最佳实践

### 1. 开发环境选择

```bash
# 单人开发：推荐本地环境
NEXT_PUBLIC_API_URL=http://localhost:8456

# 团队开发：推荐远程环境 + SSH转发
ssh -L 3002:localhost:3002 user@192.168.1.26
# 访问 http://localhost:3002
```

### 2. 环境变量管理

```bash
# 创建多个环境配置文件
.env.local          # 本地开发
.env.development    # 远程开发
.env.production     # 生产环境

# 使用脚本切换环境
cp .env.development .env
```

### 3. 服务启动脚本

```bash
# package.json
{
  "scripts": {
    "dev:local": "NEXT_PUBLIC_API_URL=http://localhost:8456 next dev",
    "dev:remote": "NEXT_PUBLIC_API_URL=http://192.168.1.26:8456 next dev",
    "dev:https": "next dev --experimental-https"
  }
}
```

## 🔧 故障排除流程

### 1. 连接问题排查

```bash
# Step 1: 检查服务是否启动
ps aux | grep "next\|python"

# Step 2: 检查端口监听
netstat -tlnp | grep -E ":(3002|8456)"

# Step 3: 检查网络连通性
curl -v http://192.168.1.26:8456/api/v1/health/

# Step 4: 检查环境变量
echo $NEXT_PUBLIC_API_URL
```

### 2. 剪贴板问题排查

```javascript
// 在浏览器控制台执行
console.log('协议:', window.location.protocol)
console.log('主机名:', window.location.hostname)
console.log('安全上下文:', window.isSecureContext)
console.log('剪贴板API:', 'clipboard' in navigator)
```

## 📝 配置检查清单

- [ ] 环境变量中的IP地址是否正确
- [ ] 前后端服务是否都已启动
- [ ] 防火墙是否开放相应端口
- [ ] CORS配置是否包含所有访问域名
- [ ] 剪贴板API的安全上下文是否满足
- [ ] 浏览器是否支持所需的API功能

## 🎯 总结

选择合适的开发环境配置：

1. **单人开发** → 使用本地环境（localhost）
2. **团队开发** → 使用远程环境 + SSH端口转发
3. **剪贴板测试** → 配置Chrome开发者标志或HTTPS
4. **生产部署** → 使用HTTPS和真实域名

通过合理的网络配置，可以在保证开发效率的同时，确保所有功能都能正常工作。 