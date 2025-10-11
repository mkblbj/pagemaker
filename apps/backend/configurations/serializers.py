from rest_framework import serializers
from .models import ShopConfiguration


class ShopConfigurationSerializer(serializers.ModelSerializer):
    """
    ShopConfiguration序列化器
    MVP版本：基础序列化，包含所有字段
    """

    class Meta:
        model = ShopConfiguration
        fields = [
            "id",
            "shop_name",
            "target_area",
            "api_service_secret",
            "api_license_key",
            "api_license_expiry_date",
            "ftp_host",
            "ftp_port",
            "ftp_user",
            "ftp_password",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_target_area(self, value):
        """
        验证target_area字段的唯一性
        """
        # 在更新时排除当前实例
        instance = getattr(self, "instance", None)
        if instance:
            if (
                ShopConfiguration.objects.exclude(pk=instance.pk)
                .filter(target_area=value)
                .exists()
            ):
                raise serializers.ValidationError("该target_area已被其他店铺配置使用")
        else:
            # 创建时检查唯一性
            if ShopConfiguration.objects.filter(target_area=value).exists():
                raise serializers.ValidationError("该target_area已被其他店铺配置使用")
        return value

    def validate_ftp_port(self, value):
        """
        验证FTP端口号范围
        """
        if not (1 <= value <= 65535):
            raise serializers.ValidationError("FTP端口必须在1-65535范围内")
        return value
