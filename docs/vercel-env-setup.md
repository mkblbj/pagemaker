# Vercel 环境变量配置指南

## 🎯 概述

前端部署到Vercel后需要正确配置环境变量才能连接到后端API。本文档详细说明了如何在Vercel中配置环境变量。

## 🔧 配置步骤

### 1. 登录Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目

### 2. 进入环境变量设置

1. 点击项目名称进入项目详情
2. 点击顶部的 **Settings** 标签
3. 在左侧菜单中选择 **Environment Variables**

### 3. 添加环境变量

点击 **Add New** 按钮，添加以下环境变量：

| 变量名 | 值 | 环境 | 说明 |
|-------|-----|------|------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend-domain.com/api/v1` | Production, Preview, Development | 后端API地址 |
| `NEXTAUTH_SECRET` | `your-random-secret-key` | Production, Preview, Development | NextAuth密钥 |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production | 生产环境URL |

### 4. 环境变量详细说明

#### NEXT_PUBLIC_API_URL
- **用途**: 前端调用后端API的基础URL
- **格式**: `https://域名/api/v1`
- **示例**: `https://api.pagemaker.com/api/v1`
- **注意**: 必须是完整的URL，包含协议

#### NEXTAUTH_SECRET
- **用途**: NextAuth.js用于加密的密钥
- **格式**: 随机生成的长字符串
- **生成方法**: 
  ```bash
  openssl rand -base64 32
  ```
- **重要**: 生产环境必须使用强密钥

#### NEXTAUTH_URL
- **用途**: NextAuth.js回调URL
- **格式**: `https://域名`
- **示例**: `https://pagemaker.vercel.app`
- **注意**: 不包含路径，只是域名

## 🚀 配置验证

### 1. 检查环境变量是否生效

在前端代码中访问测试页面：
```
https://your-app.vercel.app/test-env
```

### 2. 检查API连接

在浏览器开发者工具中查看：
1. Network标签中的API请求
2. Console中的环境变量输出

### 3. 常见问题排查

#### 环境变量未生效
- 确认变量名拼写正确
- 确认已选择正确的环境（Production/Preview/Development）
- 重新部署项目使变量生效

#### API连接失败
- 检查 `NEXT_PUBLIC_API_URL` 是否正确
- 确认后端服务器正在运行
- 检查CORS配置

#### 认证问题
- 验证 `NEXTAUTH_SECRET` 是否设置
- 确认 `NEXTAUTH_URL` 与实际域名一致

## 📋 配置检查清单

### 部署前检查
- [ ] 所有必需的环境变量已添加
- [ ] 环境变量值正确无误
- [ ] 已选择正确的环境范围
- [ ] 后端API地址可访问

### 部署后检查
- [ ] 前端页面正常加载
- [ ] API请求成功响应
- [ ] 认证功能正常工作
- [ ] 环境变量在测试页面显示正确

## 🔄 更新环境变量

如果需要更新环境变量：

1. 在Vercel Dashboard中修改变量值
2. 触发新的部署（推送代码或手动部署）
3. 验证更新是否生效

## 🚨 安全注意事项

### 敏感信息保护
- 不要在代码中硬编码敏感信息
- 使用 `NEXT_PUBLIC_` 前缀的变量会暴露给客户端
- 服务器端密钥不要使用 `NEXT_PUBLIC_` 前缀

### 环境隔离
- 开发、预览、生产环境使用不同的变量值
- 生产环境使用更强的密钥
- 定期轮换敏感密钥

## 📚 相关文档

- [Vercel环境变量官方文档](https://vercel.com/docs/projects/environment-variables)
- [Next.js环境变量文档](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables)
- [NextAuth.js配置文档](https://next-auth.js.org/configuration/options) 