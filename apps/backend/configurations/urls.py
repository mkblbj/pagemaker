from django.urls import path
from .views import (
    ShopConfigurationListCreateView,
    ShopConfigurationDetailView,
    refresh_api_expiry,
)

app_name = "configurations"

urlpatterns = [
    # 店铺配置列表和创建
    path(
        "", ShopConfigurationListCreateView.as_view(), name="shop-configurations-list"
    ),
    # 店铺配置详情、更新和删除
    path(
        "<uuid:id>/",
        ShopConfigurationDetailView.as_view(),
        name="shop-configuration-detail",
    ),
    # 刷新API密钥到期日期
    path(
        "<uuid:id>/refresh-expiry",
        refresh_api_expiry,
        name="shop-configuration-refresh-expiry",
    ),
]
