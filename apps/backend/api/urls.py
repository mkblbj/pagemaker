"""
API v1 URL configuration
"""

from django.urls import path, include

urlpatterns = [
    # Users API endpoints
    path("users/", include("users.urls")),
    # Pages API endpoints
    path("pages/", include("pages.urls")),
    # Media API endpoints
    path("media/", include("media.urls")),
]
