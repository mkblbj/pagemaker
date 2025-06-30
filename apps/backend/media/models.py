from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class MediaFile(models.Model):
    """R-Cabinet集成的媒体文件模型 - MVP简化版"""

    UPLOAD_STATUS_CHOICES = [
        ('pending', '等待上传'),
        ('completed', '上传完成'),
        ('failed', '上传失败'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="上传用户")
    original_filename = models.CharField(max_length=255, verbose_name="原始文件名")
    rcabinet_url = models.URLField(verbose_name="R-Cabinet文件URL", blank=True)
    rcabinet_file_id = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="R-Cabinet文件ID",
        blank=True,
        null=True
    )
    file_size = models.PositiveIntegerField(verbose_name="文件大小(字节)")
    content_type = models.CharField(max_length=100, verbose_name="文件类型")
    upload_status = models.CharField(
        max_length=20,
        choices=UPLOAD_STATUS_CHOICES,
        default='pending',
        verbose_name="上传状态"
    )
    error_message = models.TextField(blank=True, verbose_name="错误信息")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        db_table = 'media_files'
        indexes = [
            models.Index(fields=['user', 'upload_status']),
        ]

    def __str__(self):
        return f"{self.original_filename} ({self.upload_status})"
