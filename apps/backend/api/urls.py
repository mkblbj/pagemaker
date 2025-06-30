"""
API v1 URL configuration
"""

from django.urls import path, include
from . import views

urlpatterns = [
    # Health check endpoints
    path("health/", views.health_check, name="health_check"),
    path("health/rakuten/", views.rakuten_health_check, name="rakuten_health_check"),
    # Users API endpoints
    path("users/", include("users.urls")),
    # Pages API endpoints
    path("pages/", include("pages.urls")),
    # Media API endpoints
    path("media/", include("media.urls")),
]
