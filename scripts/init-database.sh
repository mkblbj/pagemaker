#!/bin/bash

# Pagemaker CMS 数据库初始化脚本
# 用于新环境的快速设置

set -e

echo "🚀 开始初始化 Pagemaker CMS 数据库..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -f "apps/backend/manage.py" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 进入后端目录
cd apps/backend

echo -e "${BLUE}📋 步骤 1: 运行数据库迁移...${NC}"
python manage.py migrate

echo -e "${BLUE}📋 步骤 2: 创建默认管理员账号...${NC}"
python manage.py create_admin --force

echo -e "${BLUE}📋 步骤 3: 收集静态文件...${NC}"
python manage.py collectstatic --noinput

echo -e "${BLUE}📋 步骤 4: 验证数据库状态...${NC}"
python manage.py shell -c "
from django.contrib.auth import get_user_model
from users.models import UserProfile
from pages.models import PageTemplate
from configurations.models import ShopConfiguration

User = get_user_model()

print('=== 数据库状态报告 ===')
print(f'用户总数: {User.objects.count()}')
print(f'超级用户数: {User.objects.filter(is_superuser=True).count()}')
print(f'用户配置文件数: {UserProfile.objects.count()}')
print(f'页面模板数: {PageTemplate.objects.count()}')
print(f'商店配置数: {ShopConfiguration.objects.count()}')

print('\n=== 管理员账号 ===')
admin_users = User.objects.filter(is_superuser=True)
for user in admin_users:
    print(f'- {user.username} ({user.email})')
"

echo -e "${GREEN}✅ 数据库初始化完成!${NC}"
echo -e "${YELLOW}📝 登录信息:${NC}"
echo -e "   用户名: admin"
echo -e "   密码: admin123"
echo -e "   邮箱: admin@pagemaker.local"
echo ""
echo -e "${YELLOW}⚠️  安全提示:${NC}"
echo -e "   请在生产环境中更改默认密码!"
echo -e "   可以使用: python manage.py create_admin --force --password 新密码"
echo ""
echo -e "${GREEN}🎉 现在可以启动服务器了:${NC}"
echo -e "   python manage.py runserver" 