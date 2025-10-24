"""
API v1 URL configuration
"""

from django.urls import path, include
from . import views
from . import dashboard_views

urlpatterns = [
    # Health check endpoints
    path("health/", views.health_check, name="health_check"),
    path("health/rakuten/", views.rakuten_health_check, name="rakuten_health_check"),
    # Dashboard endpoint
    path("dashboard/stats/", dashboard_views.dashboard_stats, name="dashboard_stats"),
    # Users API endpoints
    path("users/", include("users.urls")),
    # Pages API endpoints
    path("pages/", include("pages.urls")),
    # Media API endpoints
    path("media/", include("media.urls")),
    # Shop Configurations API endpoints
    path("shop-configurations/", include("configurations.urls")),
]
