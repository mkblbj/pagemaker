from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """用户注册序列化器"""

    password = serializers.CharField(
        write_only=True, min_length=6, style={"input_type": "password"}
    )
    password_confirm = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )
    first_name = serializers.CharField(max_length=30, required=False)
    last_name = serializers.CharField(max_length=30, required=False)
    phone_number = serializers.CharField(max_length=20, required=False)

    class Meta:
        model = User
        fields = (
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "phone_number",
        )

    def validate_email(self, value):
        """验证邮箱"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("该邮箱已被注册")
        return value

    def validate(self, attrs):
        """验证密码确认"""
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("密码确认不匹配")

        # 验证密码强度
        try:
            validate_password(attrs["password"])
        except ValidationError as e:
            raise serializers.ValidationError({"password": e.messages})

        return attrs

    def create(self, validated_data):
        """创建用户"""
        validated_data.pop("password_confirm")
        phone_number = validated_data.pop("phone_number", None)

        user = User.objects.create_user(
            username=validated_data["email"], **validated_data  # 使用邮箱作为用户名
        )

        # 如果有电话号码，可以保存到用户配置文件
        if phone_number:
            # TODO: 创建用户配置文件模型来存储额外信息
            pass

        return user


class UserSerializer(serializers.ModelSerializer):
    """用户信息序列化器"""

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "date_joined",
            "is_active",
        )
        read_only_fields = ("id", "username", "date_joined")


class PasswordResetRequestSerializer(serializers.Serializer):
    """密码重置请求序列化器"""

    email = serializers.EmailField()

    def validate_email(self, value):
        """验证邮箱是否存在"""
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("该邮箱未注册")
        return value


class PasswordResetSerializer(serializers.Serializer):
    """密码重置序列化器"""

    token = serializers.CharField()
    password = serializers.CharField(
        write_only=True, min_length=6, style={"input_type": "password"}
    )
    password_confirm = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )

    def validate(self, attrs):
        """验证密码确认"""
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("密码确认不匹配")

        # 验证密码强度
        try:
            validate_password(attrs["password"])
        except ValidationError as e:
            raise serializers.ValidationError({"password": e.messages})

        return attrs


class SocialAuthSerializer(serializers.Serializer):
    """社交登录序列化器"""

    provider = serializers.ChoiceField(choices=["google", "github", "apple"])
    access_token = serializers.CharField()

    def validate_provider(self, value):
        """验证社交登录提供商"""
        supported_providers = ["google", "github", "apple"]
        if value not in supported_providers:
            raise serializers.ValidationError(f"不支持的登录方式: {value}")
        return value
