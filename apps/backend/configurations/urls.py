from django.urls import path
from .views import ShopConfigurationListCreateView, ShopConfigurationDetailView

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
]
