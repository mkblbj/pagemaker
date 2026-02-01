"""
用户相关序列化器
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import UserProfile

User = get_user_model()


class UserRegistrationSerializer(serializers.Serializer):
    """用户注册序列化器"""
    
    username = serializers.CharField(
        max_length=150,
        required=True,
        help_text="用户名（必填）"
    )
    password = serializers.CharField(
        min_length=6,
        max_length=128,
        write_only=True,
        required=True,
        help_text="密码（必填，至少6位）"
    )
    email = serializers.EmailField(
        required=False,
        allow_blank=True,
        help_text="邮箱（可选）"
    )
    full_name = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        help_text="全名（可选）"
    )
    role = serializers.ChoiceField(
        choices=["editor", "admin"],
        default="editor",
        required=False,
        help_text="用户角色（默认editor）"
    )
    
    def validate_username(self, value):
        """验证用户名是否已存在"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("用户名已存在")
        
        # 用户名只能包含字母、数字、下划线
        import re
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError("用户名只能包含字母、数字和下划线")
        
        return value
    
    def validate_email(self, value):
        """验证邮箱是否已被使用"""
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("该邮箱已被注册")
        return value
    
    def validate_password(self, value):
        """验证密码强度"""
        if len(value) < 6:
            raise serializers.ValidationError("密码至少需要6个字符")
        
        # 可以添加更多密码强度验证
        # if not any(char.isdigit() for char in value):
        #     raise serializers.ValidationError("密码必须包含至少一个数字")
        
        return value
    
    def create(self, validated_data):
        """创建用户"""
        username = validated_data["username"]
        password = validated_data["password"]
        email = validated_data.get("email", f"{username}@pagemaker.local")
        full_name = validated_data.get("full_name", username)
        role = validated_data.get("role", "editor")
        
        with transaction.atomic():
            # 创建用户
            if role == "admin":
                user = User.objects.create_superuser(
                    username=username,
                    email=email,
                    password=password,
                )
            else:
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                )
            
            # 创建用户配置
            UserProfile.objects.create(
                user=user,
                role=role,
                full_name=full_name,
            )
            
            return user


class UserProfileSerializer(serializers.ModelSerializer):
    """用户配置序列化器"""
    
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            "user_id",
            "username",
            "email",
            "role",
            "full_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
