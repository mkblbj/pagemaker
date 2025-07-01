from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import UserProfile


class UserProfileInline(admin.StackedInline):
    """用户配置文件内联编辑"""

    model = UserProfile
    can_delete = False
    verbose_name_plural = "用户配置文件"
    fields = ("role", "full_name")


class UserAdmin(BaseUserAdmin):
    """扩展的用户管理界面"""

    inlines = (UserProfileInline,)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """用户配置文件管理界面"""

    list_display = ("user", "role", "full_name", "created_at", "updated_at")
    list_filter = ("role", "created_at")
    search_fields = ("user__username", "user__email", "full_name")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (None, {"fields": ("user", "role", "full_name")}),
        (
            "时间信息",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


# 重新注册User模型以包含UserProfile内联编辑
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
