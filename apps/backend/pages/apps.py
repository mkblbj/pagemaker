from django.apps import AppConfig


class PagesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "pages"
    verbose_name = "Pages"

    def ready(self):
        """应用启动时导入信号处理器"""
        import pages.activity_logger  # noqa: F401
