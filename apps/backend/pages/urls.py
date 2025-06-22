"""
Pages app URL configuration
"""

from django.urls import path
from . import views

urlpatterns = [
    # Page management endpoints will be added here
    # path("", views.PageListView.as_view(), name="page_list"),
    # path("<uuid:pk>/", views.PageDetailView.as_view(), name="page_detail"),
]
