# Pagemaker CMS Django Backend - Development Commands
.PHONY: help dev migrate makemigrations test test-coverage lint format clean check build start

# 默认目标
help:
	@echo "Pagemaker CMS Django Backend Commands:"
	@echo "  make dev              - 启动开发服务器"
	@echo "  make migrate          - 运行数据库迁移"
	@echo "  make makemigrations   - 创建数据库迁移文件"
	@echo "  make test             - 运行测试"
	@echo "  make test-coverage    - 运行测试并生成覆盖率报告"
	@echo "  make lint             - 代码检查"
	@echo "  make format           - 代码格式化"
	@echo "  make clean            - 清理缓存文件"
	@echo "  make check            - Django系统检查"
	@echo "  make shell            - 进入Django shell"
	@echo "  make superuser        - 创建超级用户"

# 激活虚拟环境的前缀
SHELL := /bin/bash
VENV = source venv/bin/activate &&

# 开发服务器
dev:
	$(VENV) python manage.py runserver 8456

# 数据库操作
migrate:
	$(VENV) python manage.py migrate

makemigrations:
	$(VENV) python manage.py makemigrations

# 测试
test:
	$(VENV) DJANGO_SETTINGS_MODULE=pagemaker.test_settings pytest

test-coverage:
	$(VENV) DJANGO_SETTINGS_MODULE=pagemaker.test_settings pytest --cov=. --cov-report=html --cov-report=term

# 代码质量
lint:
	$(VENV) flake8 .

format:
	$(VENV) black .

format-check:
	$(VENV) black --check .

# 清理
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf htmlcov/
	rm -rf .coverage
	rm -rf .pytest_cache/

# Django管理
check:
	$(VENV) python manage.py check

shell:
	$(VENV) python manage.py shell

superuser:
	$(VENV) python manage.py createsuperuser

collectstatic:
	$(VENV) python manage.py collectstatic --noinput

# 部署相关
build:
	@echo "Django backend build completed"

start:
	$(VENV) python manage.py runserver 0.0.0.0:8000 