from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # JWT Token endpoints
    path("token/", views.CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # User management
    path("register/", views.UserRegistrationView.as_view(), name="user_register"),
    path("user/", views.user_profile, name="user_profile"),
    path("profile/", views.UserProfileView.as_view(), name="user_profile_update"),
    # Password reset
    path(
        "password-reset/",
        views.PasswordResetRequestView.as_view(),
        name="password_reset_request",
    ),
    path(
        "password-reset/confirm/",
        views.PasswordResetView.as_view(),
        name="password_reset_confirm",
    ),
    # Social authentication
    path("social/", views.SocialAuthView.as_view(), name="social_auth"),
    # Logout
    path("logout/", views.LogoutView.as_view(), name="logout"),
]
