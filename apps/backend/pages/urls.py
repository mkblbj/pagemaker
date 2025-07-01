"""
Pages app URL configuration
"""

from django.urls import path
from .views import PageListCreateView, PageDetailView

app_name = "pages"

urlpatterns = [
    # PageTemplate CRUD API端点
    path("", PageListCreateView.as_view(), name="page-list-create"),
    path("<uuid:id>/", PageDetailView.as_view(), name="page-detail"),
]
