from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import PageTemplate
from .repositories import PageTemplateRepository


class PageTemplateSerializer(serializers.ModelSerializer):
    """PageTemplate序列化器"""

    # 只读字段
    id = serializers.UUIDField(read_only=True)
    owner_id = serializers.CharField(source="owner.id", read_only=True)
    shop_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)  # 使用CharField以接受空字符串
    shop_name = serializers.CharField(source="shop.shop_name", read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    module_count = serializers.IntegerField(read_only=True)

    # 可选字段（用于部分更新）
    name = serializers.CharField(max_length=255, required=False)
    device_type = serializers.ChoiceField(
        choices=['pc', 'mobile'], 
        required=False,
        help_text="设备类型"
    )
    content = serializers.ListField(required=False, allow_empty=True)

    class Meta:
        model = PageTemplate
        fields = [
            "id",
            "name",
            "content",
            "shop_id",      # 店铺ID
            "shop_name",    # 店铺名称（只读）
            "device_type",  # 设备类型
            "owner_id",
            "created_at",
            "updated_at",
            "module_count",
        ]
        extra_kwargs = {
            "name": {"required": True},
            "content": {"required": True},
        }

    def validate_name(self, value):
        """验证页面名称"""
        if not value or not value.strip():
            raise serializers.ValidationError("页面名称不能为空")

        if len(value.strip()) < 2:
            raise serializers.ValidationError("页面名称至少需要2个字符")

        return value.strip()

    def validate_shop_id(self, value):
        """验证店铺ID"""
        # 空字符串或 None 转换为 None
        if not value or value.strip() == '':
            return None
        
        from configurations.models import ShopConfiguration
        import uuid
        
        # 验证 UUID 格式
        try:
            uuid.UUID(value)
        except (ValueError, AttributeError):
            raise serializers.ValidationError(f"店铺ID格式无效")
        
        # 验证店铺存在
        try:
            ShopConfiguration.objects.get(id=value)
        except ShopConfiguration.DoesNotExist:
            raise serializers.ValidationError(f"店铺ID {value} 不存在")
        
        return value

    def validate_content(self, value):
        """验证页面内容（PageModule数组）"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Content必须是数组格式")

        # 验证每个模块的结构
        for i, module in enumerate(value):
            if not isinstance(module, dict):
                raise serializers.ValidationError(f"模块 {i} 必须是对象格式")

            # 验证必需字段
            if "id" not in module:
                raise serializers.ValidationError(f"模块 {i} 缺少id字段")
            if "type" not in module:
                raise serializers.ValidationError(f"模块 {i} 缺少type字段")

            # 验证id格式
            if not isinstance(module["id"], str) or not module["id"].strip():
                raise serializers.ValidationError(f"模块 {i} 的id必须是非空字符串")

            # 验证type格式
            if not isinstance(module["type"], str) or not module["type"].strip():
                raise serializers.ValidationError(f"模块 {i} 的type必须是非空字符串")

            # 验证type是否为有效值
            valid_types = [
                "title",
                "text",
                "image",
                "separator",
                "keyValue",
                "multiColumn",
                "custom",
            ]
            if module["type"] not in valid_types:
                raise serializers.ValidationError(
                    f"模块 {i} 的type '{module['type']}' 无效，必须是以下之一: {', '.join(valid_types)}"
                )

        return value

    def validate(self, attrs):
        """对象级别的验证"""
        # 检查是否存在重复的模块ID
        if "content" in attrs and attrs["content"]:
            module_ids = [module["id"] for module in attrs["content"]]
            if len(module_ids) != len(set(module_ids)):
                raise serializers.ValidationError({"content": "模块ID不能重复"})

        return attrs

    def create(self, validated_data):
        """创建新的PageTemplate"""
        # 获取当前用户
        request = self.context.get("request")
        if not request or not request.user:
            raise serializers.ValidationError("无法获取当前用户信息")

        try:
            from configurations.models import ShopConfiguration
            
            # 处理 shop_id 字段
            shop_id = validated_data.pop('shop_id', None)
            
            # 获取 shop 实例
            shop = None
            if shop_id:
                shop = ShopConfiguration.objects.get(id=shop_id)
            else:
                # 如果没有提供 shop_id，使用第一个可用店铺
                shop = ShopConfiguration.objects.first()
                if not shop:
                    raise serializers.ValidationError({"shop_id": "系统中没有配置任何店铺，请先添加店铺配置"})
            
            # 使用Repository创建页面
            page = PageTemplateRepository.create_page(
                name=validated_data["name"],
                content=validated_data.get("content", []),
                owner=request.user,
                shop=shop,
                device_type=validated_data.get("device_type", "mobile"),  # 默认移动端
            )
            return page

        except ShopConfiguration.DoesNotExist:
            raise serializers.ValidationError({"shop_id": "店铺不存在"})
        except DjangoValidationError as e:
            # 将Django验证错误转换为DRF验证错误
            if hasattr(e, "error_dict"):
                raise serializers.ValidationError(e.error_dict)
            else:
                raise serializers.ValidationError(str(e))

    def update(self, instance, validated_data):
        """更新现有的PageTemplate"""
        request = self.context.get("request")
        if not request or not request.user:
            raise serializers.ValidationError("无法获取当前用户信息")

        try:
            from configurations.models import ShopConfiguration
            
            # 处理 shop_id 字段
            shop_id = validated_data.pop('shop_id', None)
            if shop_id:
                validated_data['shop'] = ShopConfiguration.objects.get(id=shop_id)
            
            # 使用Repository更新页面
            updated_page = PageTemplateRepository.update_page(
                page_id=str(instance.id), user=request.user, **validated_data
            )

            if not updated_page:
                raise serializers.ValidationError("页面不存在或无权限访问")

            return updated_page

        except ShopConfiguration.DoesNotExist:
            raise serializers.ValidationError({"shop_id": "店铺不存在"})
        except DjangoValidationError as e:
            # 将Django验证错误转换为DRF验证错误
            if hasattr(e, "error_dict"):
                raise serializers.ValidationError(e.error_dict)
            else:
                raise serializers.ValidationError(str(e))

    def to_representation(self, instance):
        """自定义序列化输出"""
        data = super().to_representation(instance)

        # 确保时间字段格式正确
        if instance.created_at:
            data["created_at"] = instance.created_at.isoformat()
        if instance.updated_at:
            data["updated_at"] = instance.updated_at.isoformat()

        # 添加额外的统计信息
        data["module_count"] = instance.module_count

        # 添加店铺相关字段
        if instance.shop:
            data["shop_id"] = str(instance.shop.id)
            data["shop_name"] = instance.shop.shop_name
        else:
            data["shop_id"] = None
            data["shop_name"] = None

        # 添加设备类型
        data["device_type"] = instance.device_type

        return data


class CreatePageTemplateSerializer(PageTemplateSerializer):
    """创建页面模板的专用序列化器"""

    class Meta(PageTemplateSerializer.Meta):
        extra_kwargs = {
            "name": {"required": True},
            "content": {"required": True},
            "shop_id": {"required": False},  # 改为可选，如果未提供则使用默认店铺
            "device_type": {"required": True},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # 创建时必需字段
        self.fields["name"].required = True
        self.fields["content"].required = True
        self.fields["shop_id"].required = False  # 改为可选
        self.fields["device_type"].required = True


class UpdatePageTemplateSerializer(PageTemplateSerializer):
    """更新页面模板的专用序列化器"""

    class Meta(PageTemplateSerializer.Meta):
        extra_kwargs = {
            "name": {"required": False},
            "content": {"required": False},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # 更新时所有字段都是可选的
        self.fields["name"].required = False
        self.fields["content"].required = False


class PageTemplateListSerializer(serializers.ModelSerializer):
    """页面模板列表的轻量级序列化器"""

    id = serializers.UUIDField(read_only=True)
    owner_id = serializers.CharField(source="owner.id", read_only=True)
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    shop_id = serializers.CharField(source="shop.id", read_only=True)
    shop_name = serializers.CharField(source="shop.shop_name", read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    module_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = PageTemplate
        fields = [
            "id",
            "name",
            "shop_id",
            "shop_name",
            "device_type",
            "owner_id",
            "owner_username",
            "created_at",
            "updated_at",
            "module_count",
        ]

    def to_representation(self, instance):
        """自定义序列化输出"""
        data = super().to_representation(instance)

        # 确保时间字段格式正确
        if instance.created_at:
            data["created_at"] = instance.created_at.isoformat()
        if instance.updated_at:
            data["updated_at"] = instance.updated_at.isoformat()

        # 确保店铺字段正确序列化
        if instance.shop:
            data["shop_id"] = str(instance.shop.id)
            data["shop_name"] = instance.shop.shop_name
        else:
            data["shop_id"] = None
            data["shop_name"] = None

        # 确保设备类型字段
        data["device_type"] = instance.device_type

        return data
