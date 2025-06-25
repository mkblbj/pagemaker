#!/bin/bash

# 部署监控脚本
echo "🔍 监控自动部署测试..."
echo "=================================="

# 检查工作流状态
echo "📋 GitHub Actions 状态:"
echo "🔗 查看地址: https://github.com/mkblbj/pagemaker/actions"
echo ""

# 检查 Vercel 部署状态
echo "🚀 Vercel 部署状态:"
echo "🔗 查看地址: https://vercel.com/dashboard"
echo ""

# 检查云服务器状态
echo "☁️  云服务器状态:"
echo "🔗 SSH 连接: ssh uoserver"
echo "📁 部署目录: /root/dev/pagemaker"
echo ""

# 健康检查
echo "🏥 健康检查端点:"
echo "🔗 后端健康: http://your-backend-url/api/v1/health/"
echo "🔗 前端访问: https://your-frontend-url.vercel.app"
echo ""

echo "⏰ 预计完成时间: 5-10 分钟"
echo "📊 监控要点:"
echo "  - CI 工作流: 代码检查 + 测试"
echo "  - Coverage: 覆盖率报告"
echo "  - Security: 安全扫描"
echo "  - Deploy: 部署执行 (仅 main 分支)" 