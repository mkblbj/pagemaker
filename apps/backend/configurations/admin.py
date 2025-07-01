from django.contrib import admin
from .models import ShopConfiguration


@admin.register(ShopConfiguration)
class ShopConfigurationAdmin(admin.ModelAdmin):
    """ShopConfiguration模型的Django Admin配置"""
    
    list_display = (
        'shop_name', 
        'target_area', 
        'ftp_host', 
        'created_at', 
        'updated_at'
    )
    list_filter = ('created_at', 'updated_at')
    search_fields = ('shop_name', 'target_area', 'ftp_host')
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    fieldsets = (
        ('基本信息', {
            'fields': ('shop_name', 'target_area')
        }),
        ('乐天API配置', {
            'fields': ('api_service_secret', 'api_license_key'),
            'classes': ('collapse',)
        }),
        ('FTP配置', {
            'fields': ('ftp_host', 'ftp_port', 'ftp_user', 'ftp_password'),
            'classes': ('collapse',)
        }),
        ('系统信息', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    # 为敏感信息提供特殊处理（MVP阶段基础配置）
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        # 在实际生产环境中，这里可以添加敏感字段的特殊处理
        return form
