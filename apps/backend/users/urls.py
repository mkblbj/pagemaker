"""
Users app URL configuration
"""

from django.urls import path
from . import views

urlpatterns = [
    # 用户注册（公开）
    path("register/", views.register_user, name="user_register"),
    
    # 当前用户信息
    path("me/", views.get_current_user, name="current_user"),
    
    # 用户列表（仅admin）
    path("", views.list_users, name="list_users"),
]
