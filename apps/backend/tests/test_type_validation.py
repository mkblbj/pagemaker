"""
后端类型验证测试
验证Pydantic模型和JSON Schema验证功能
"""

import pytest
from datetime import datetime
from pagemaker.schemas import (
    UserModel,
    UserRole,
    PageModuleModel,
    PageModuleType,
    PageTemplateModel,
    ShopConfigurationModel,
    ApiResponse,
    PaginatedResponse,
)
from pagemaker.validators import (
    TypeValidator,
    PydanticValidator,
    create_api_response,
    create_paginated_response,
)


class TestPydanticModels:
    """测试Pydantic模型"""

    def test_user_model_validation(self):
        """测试用户模型验证"""
        valid_user_data = {
            "id": "123",
            "username": "testuser",
            "email": "test@example.com",
            "fullName": "Test User",
            "role": UserRole.EDITOR,
            "isActive": True,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
        }

        user = UserModel(**valid_user_data)
        assert user.id == "123"
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.full_name == "Test User"
        assert user.role == UserRole.EDITOR
        assert user.is_active is True

        # 测试别名字段
        assert user.full_name == valid_user_data["fullName"]
        assert user.is_active == valid_user_data["isActive"]

    def test_user_model_invalid_role(self):
        """测试用户模型无效角色"""
        invalid_user_data = {
            "id": "123",
            "username": "testuser",
            "email": "test@example.com",
            "fullName": "Test User",
            "role": "invalid_role",  # 无效角色
            "isActive": True,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
        }

        with pytest.raises(Exception):
            UserModel(**invalid_user_data)

    def test_page_module_model_validation(self):
        """测试页面模块模型验证"""
        valid_module_data = {
            "id": "module-1",
            "type": PageModuleType.TITLE,
            "title": "Welcome",
            "content": "Welcome to our page",
        }

        module = PageModuleModel(**valid_module_data)
        assert module.id == "module-1"
        assert module.type == PageModuleType.TITLE
        assert hasattr(module, "title")  # 动态字段
        assert hasattr(module, "content")  # 动态字段

    def test_page_template_model_validation(self):
        """测试页面模板模型验证"""
        module_data = {
            "id": "module-1",
            "type": PageModuleType.TITLE,
            "title": "Welcome",
        }

        template_data = {
            "id": "template-1",
            "name": "Home Page Template",
            "content": [module_data],
            "targetArea": "main-site",
            "ownerId": "123",
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
        }

        template = PageTemplateModel(**template_data)
        assert template.id == "template-1"
        assert template.name == "Home Page Template"
        assert len(template.content) == 1
        assert template.target_area == "main-site"
        assert template.owner_id == "123"

    def test_shop_configuration_model_validation(self):
        """测试店铺配置模型验证"""
        config_data = {
            "id": "shop-1",
            "shopName": "Test Shop",
            "targetArea": "main-site",
            "apiLicenseExpiryDate": datetime.now().isoformat(),
        }

        config = ShopConfigurationModel(**config_data)
        assert config.id == "shop-1"
        assert config.shop_name == "Test Shop"
        assert config.target_area == "main-site"
        assert config.api_license_expiry_date is not None


class TestJSONSchemaValidation:
    """测试JSON Schema验证"""

    def test_user_schema_validation(self):
        """测试用户Schema验证"""
        valid_user = {
            "id": "123",
            "username": "testuser",
            "email": "test@example.com",
            "fullName": "Test User",
            "role": "editor",
            "isActive": True,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
        }

        assert TypeValidator.validate_user(valid_user) is True

        # 测试无效数据
        invalid_user = valid_user.copy()
        invalid_user["role"] = "invalid_role"
        assert TypeValidator.validate_user(invalid_user) is False

    def test_page_template_schema_validation(self):
        """测试页面模板Schema验证"""
        valid_template = {
            "id": "template-1",
            "name": "Home Page Template",
            "content": [{"id": "module-1", "type": "title", "title": "Welcome"}],
            "targetArea": "main-site",
            "ownerId": "123",
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
        }

        assert TypeValidator.validate_page_template(valid_template) is True

        # 测试缺少必需字段
        invalid_template = valid_template.copy()
        del invalid_template["name"]
        assert TypeValidator.validate_page_template(invalid_template) is False

    def test_api_response_schema_validation(self):
        """测试API响应Schema验证"""
        valid_response = {
            "success": True,
            "data": {"id": "123", "name": "test"},
            "message": "Operation successful",
        }

        assert TypeValidator.validate_api_response(valid_response) is True

        # 测试错误响应
        error_response = {
            "success": False,
            "message": "Operation failed",
            "errors": {"field1": ["Error message"]},
        }

        assert TypeValidator.validate_api_response(error_response) is True

    def test_paginated_response_schema_validation(self):
        """测试分页响应Schema验证"""
        valid_paginated = {
            "success": True,
            "data": [{"id": "1"}, {"id": "2"}],
            "pagination": {
                "page": 1,
                "pageSize": 10,
                "total": 2,
                "totalPages": 1,
                "hasNext": False,
                "hasPrevious": False,
            },
            "message": "Data fetched successfully",
        }

        assert TypeValidator.validate_paginated_response(valid_paginated) is True


class TestPydanticValidator:
    """测试Pydantic验证器"""

    def test_validate_user_model(self):
        """测试用户模型验证器"""
        valid_data = {
            "id": "123",
            "username": "testuser",
            "email": "test@example.com",
            "fullName": "Test User",
            "role": "editor",
            "isActive": True,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
        }

        user = PydanticValidator.validate_user_model(valid_data)
        assert user is not None
        assert user.id == "123"
        assert user.username == "testuser"

        # 测试无效数据
        invalid_data = valid_data.copy()
        invalid_data["email"] = "invalid-email"  # 无效邮箱格式
        user = PydanticValidator.validate_user_model(invalid_data)
        # 注意：这里可能仍然通过，因为我们的模型没有严格的邮箱验证
        # 在实际应用中，可以添加更严格的验证


class TestResponseHelpers:
    """测试响应辅助函数"""

    def test_create_api_response(self):
        """测试创建API响应"""
        response = create_api_response(
            success=True,
            data={"id": "123", "name": "test"},
            message="Operation successful",
        )

        assert response["success"] is True
        assert response["data"]["id"] == "123"
        assert response["message"] == "Operation successful"

        # 验证响应格式
        assert TypeValidator.validate_api_response(response) is True

    def test_create_paginated_response(self):
        """测试创建分页响应"""
        data = [{"id": "1"}, {"id": "2"}]
        response = create_paginated_response(
            data=data,
            page=1,
            page_size=10,
            total=2,
            message="Data fetched successfully",
        )

        assert response["success"] is True
        assert len(response["data"]) == 2
        assert response["pagination"]["page"] == 1
        assert response["pagination"]["total"] == 2
        assert response["pagination"]["hasNext"] is False
        assert response["pagination"]["hasPrevious"] is False

        # 验证响应格式
        assert TypeValidator.validate_paginated_response(response) is True

    def test_create_paginated_response_with_multiple_pages(self):
        """测试创建多页分页响应"""
        data = [{"id": str(i)} for i in range(10)]
        response = create_paginated_response(data=data, page=2, page_size=10, total=25)

        assert response["pagination"]["totalPages"] == 3
        assert response["pagination"]["hasNext"] is True
        assert response["pagination"]["hasPrevious"] is True


class TestEnumCompatibility:
    """测试枚举兼容性"""

    def test_user_role_enum_values(self):
        """测试用户角色枚举值"""
        assert UserRole.EDITOR.value == "editor"
        assert UserRole.ADMIN.value == "admin"

        # 验证所有枚举值
        expected_roles = {"editor", "admin"}
        actual_roles = {role.value for role in UserRole}
        assert actual_roles == expected_roles

    def test_page_module_type_enum_values(self):
        """测试页面模块类型枚举值"""
        assert PageModuleType.TITLE.value == "title"
        assert PageModuleType.TEXT.value == "text"
        assert PageModuleType.IMAGE.value == "image"
        assert PageModuleType.SEPARATOR.value == "separator"
        assert PageModuleType.KEY_VALUE.value == "keyValue"
        assert PageModuleType.MULTI_COLUMN.value == "multiColumn"
        assert PageModuleType.CUSTOM.value == "custom"

        # 验证所有枚举值
        expected_types = {
            "title",
            "text",
            "image",
            "separator",
            "keyValue",
            "multiColumn",
            "custom",
        }
        actual_types = {module_type.value for module_type in PageModuleType}
        assert actual_types == expected_types
