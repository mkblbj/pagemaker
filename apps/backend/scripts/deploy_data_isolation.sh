#!/bin/bash

# 数据隔离功能部署脚本

set -e  # 遇到错误立即退出

echo "🚀 开始部署数据隔离功能..."

# 1. 运行数据库迁移
echo "📦 运行数据库迁移..."
python manage.py migrate configurations 0003_shopconfiguration_owner

# 2. 验证迁移结果
echo "✅ 验证迁移结果..."
python manage.py shell << EOF
from configurations.models import ShopConfiguration
from django.contrib.auth.models import User

# 检查所有店铺配置是否都有owner
shops_without_owner = ShopConfiguration.objects.filter(owner__isnull=True).count()
if shops_without_owner > 0:
    print(f"⚠️  警告: 有 {shops_without_owner} 个店铺配置没有owner")
else:
    print("✅ 所有店铺配置都已设置owner")

# 显示店铺配置统计
total_shops = ShopConfiguration.objects.count()
print(f"📊 当前共有 {total_shops} 个店铺配置")

for shop in ShopConfiguration.objects.all():
    print(f"   - {shop.shop_name} (owner: {shop.owner.username})")
EOF

# 3. 运行隔离测试
echo "🧪 运行数据隔离测试..."
DJANGO_SETTINGS_MODULE=pagemaker.test_settings python -m pytest configurations/tests/test_isolation.py -v

echo "✅ 数据隔离功能部署完成！"
echo ""
echo "📝 注意事项："
echo "   1. admin 可以看到所有用户的店铺配置"
echo "   2. 普通用户只能看到自己创建的店铺配置"
echo "   3. 普通用户创建页面时，只能选择自己的店铺"
echo "   4. admin 创建页面时，可以选择任何店铺"
