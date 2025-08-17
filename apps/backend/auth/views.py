from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model, authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth import get_user_model
import logging

from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    PasswordResetRequestSerializer,
    PasswordResetSerializer,
    SocialAuthSerializer,
)

logger = logging.getLogger(__name__)
User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """自定义JWT token获取视图"""

    def post(self, request, *args, **kwargs):
        # 支持邮箱登录
        data = request.data.copy()
        if "email" in data and "username" not in data:
            data["username"] = data["email"]

        # 更新request.data
        request._full_data = data

        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            logger.info(f"User {data.get('username')} logged in successfully")

        return response


class UserRegistrationView(APIView):
    """用户注册视图"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            try:
                user = serializer.save()

                # 自动登录新用户
                refresh = RefreshToken.for_user(user)

                logger.info(f"New user registered: {user.email}")

                return Response(
                    {
                        "message": "注册成功",
                        "user": UserSerializer(user).data,
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    },
                    status=status.HTTP_201_CREATED,
                )

            except Exception as e:
                logger.error(f"Registration error: {str(e)}")
                return Response(
                    {"error": "注册失败，请稍后重试"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """用户信息视图"""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class PasswordResetRequestView(APIView):
    """密码重置请求视图"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data["email"]

            try:
                user = User.objects.get(email=email)

                # 生成重置token
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))

                # 构建重置链接
                reset_link = (
                    f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
                )

                # 发送邮件 (占位符实现)
                # TODO: 配置邮件服务
                try:
                    send_mail(
                        subject="Pagemaker CMS - 密码重置",
                        message=f"请点击以下链接重置您的密码: {reset_link}",
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[email],
                        fail_silently=False,
                    )
                    logger.info(f"Password reset email sent to {email}")
                except Exception as e:
                    logger.error(f"Failed to send password reset email: {str(e)}")
                    # 即使邮件发送失败，也返回成功，避免邮箱枚举攻击

                return Response(
                    {"message": "密码重置邮件已发送"}, status=status.HTTP_200_OK
                )

            except User.DoesNotExist:
                # 为了安全，即使用户不存在也返回成功消息
                pass

            return Response(
                {"message": "如果该邮箱已注册，您将收到密码重置邮件"},
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetView(APIView):
    """密码重置视图"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)

        if serializer.is_valid():
            try:
                uid = request.data.get("uid")
                token = serializer.validated_data["token"]
                password = serializer.validated_data["password"]

                # 解码用户ID
                user_id = force_str(urlsafe_base64_decode(uid))
                user = User.objects.get(pk=user_id)

                # 验证token
                if default_token_generator.check_token(user, token):
                    user.set_password(password)
                    user.save()

                    logger.info(f"Password reset successful for user {user.email}")

                    return Response(
                        {"message": "密码重置成功"}, status=status.HTTP_200_OK
                    )
                else:
                    return Response(
                        {"error": "重置链接无效或已过期"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                return Response(
                    {"error": "重置链接无效"}, status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SocialAuthView(APIView):
    """社交登录视图 (占位符)"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SocialAuthSerializer(data=request.data)

        if serializer.is_valid():
            provider = serializer.validated_data["provider"]
            access_token = serializer.validated_data["access_token"]

            # TODO: 实现具体的社交登录逻辑
            # 这里需要根据不同的provider调用相应的API验证token
            # 并获取用户信息，创建或更新本地用户

            logger.info(f"Social auth attempt with {provider}")

            return Response(
                {"error": f"{provider} 登录功能正在开发中"},
                status=status.HTTP_501_NOT_IMPLEMENTED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """登出视图"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            logger.info(f"User {request.user.email} logged out")

            return Response({"message": "登出成功"}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return Response({"error": "登出失败"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    """获取当前用户信息"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)
