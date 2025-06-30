"""
Media app URL configuration
"""

from django.urls import path
from . import views

app_name = "media"

urlpatterns = [
    # 文件上传
    path("upload/", views.upload_media_file, name="upload_media_file"),
    # 上传状态查询
    path(
        "upload/<int:media_file_id>/status/",
        views.get_upload_status,
        name="get_upload_status",
    ),
    # 用户文件列表
    path("files/", views.list_user_media_files, name="list_user_media_files"),
]
