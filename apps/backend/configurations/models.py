import uuid
from django.db import models


class ShopConfiguration(models.Model):
    """
    店铺配置模型，存储乐天API凭据和FTP配置信息
    MVP版本：简化实现，敏感字段暂不加密
    """
    id = models.UUIDField(
        primary_key=True, 
        default=uuid.uuid4, 
        editable=False,
        help_text="唯一标识符"
    )
    shop_name = models.CharField(
        max_length=100,
        help_text="用户可识别的店铺名称"
    )
    target_area = models.CharField(
        max_length=50,
        unique=True,
        help_text="关联到PageTemplate的target_area字段，必须唯一"
    )
    
    # 乐天API配置 (MVP: 暂不加密)
    api_service_secret = models.CharField(
        max_length=50,
        help_text="乐天API Service Secret"
    )
    api_license_key = models.CharField(
        max_length=50,
        help_text="乐天API License Key"
    )
    
    # FTP配置 (MVP: 暂不加密)
    ftp_host = models.CharField(
        max_length=255,
        help_text="FTP服务器地址"
    )
    ftp_port = models.IntegerField(
        default=21,
        help_text="FTP服务器端口"
    )
    ftp_user = models.CharField(
        max_length=100,
        help_text="FTP用户名"
    )
    ftp_password = models.CharField(
        max_length=255,
        help_text="FTP密码"
    )
    
    # 时间戳字段
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="创建时间"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="最后更新时间"
    )

    class Meta:
        db_table = 'shop_configurations'
        verbose_name = '店铺配置'
        verbose_name_plural = '店铺配置'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.shop_name} ({self.target_area})"
