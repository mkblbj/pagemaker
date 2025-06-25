from django.test import TestCase, Client
from django.urls import reverse
import json


class HealthCheckTestCase(TestCase):
    """测试健康检查端点"""

    def setUp(self):
        self.client = Client()

    def test_health_check_success(self):
        """测试健康检查端点返回成功状态"""
        response = self.client.get("/api/v1/health/")

        self.assertEqual(response.status_code, 200)

        data = json.loads(response.content)
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["database"], "connected")
        self.assertIn("timestamp", data)

    def test_health_check_content_type(self):
        """测试健康检查端点返回JSON格式"""
        response = self.client.get("/api/v1/health/")

        self.assertEqual(response["Content-Type"], "application/json")


class ValidatorTestCase(TestCase):
    """验证器功能测试"""

    def setUp(self):
        """设置测试数据"""
        self.valid_user_data = {
            "id": "user-1",
            "username": "testuser",
            "email": "test@example.com",
            "fullName": "Test User",
            "role": "editor",
            "isActive": True,
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": "2024-01-01T00:00:00Z",
        }

        self.valid_page_template_data = {
            "id": "template-1",
            "name": "Test Template",
            "content": [
                {
                    "id": "module-1",
                    "type": "title",
                    "title": "Welcome"
                }
            ],
            "targetArea": "main-site",
            "ownerId": "user-1",
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": "2024-01-01T00:00:00Z",
        }

        self.valid_shop_config_data = {
            "id": "shop-1",
            "shopName": "Test Shop",
            "targetArea": "main-site",
            "apiLicenseExpiryDate": "2024-12-31T23:59:59Z",
        }

    def test_type_validator_user_valid(self):
        """测试用户数据验证 - 有效数据"""
        from pagemaker.validators import TypeValidator
        
        result = TypeValidator.validate_user(self.valid_user_data)
        self.assertTrue(result)

    def test_type_validator_user_invalid(self):
        """测试用户数据验证 - 无效数据"""
        from pagemaker.validators import TypeValidator
        
        invalid_data = self.valid_user_data.copy()
        del invalid_data["username"]  # 删除必需字段
        
        result = TypeValidator.validate_user(invalid_data)
        self.assertFalse(result)

    def test_type_validator_page_template_valid(self):
        """测试页面模板数据验证 - 有效数据"""
        from pagemaker.validators import TypeValidator
        
        result = TypeValidator.validate_page_template(self.valid_page_template_data)
        self.assertTrue(result)

    def test_type_validator_page_template_invalid(self):
        """测试页面模板数据验证 - 无效数据"""
        from pagemaker.validators import TypeValidator
        
        invalid_data = self.valid_page_template_data.copy()
        invalid_data["content"] = "not_an_array"  # 错误的数据类型
        
        result = TypeValidator.validate_page_template(invalid_data)
        self.assertFalse(result)

    def test_type_validator_shop_configuration_valid(self):
        """测试店铺配置数据验证 - 有效数据"""
        from pagemaker.validators import TypeValidator
        
        result = TypeValidator.validate_shop_configuration(self.valid_shop_config_data)
        self.assertTrue(result)

    def test_type_validator_shop_configuration_invalid(self):
        """测试店铺配置数据验证 - 无效数据"""
        from pagemaker.validators import TypeValidator
        
        invalid_data = {"id": "shop-1"}  # 缺少必需字段
        
        result = TypeValidator.validate_shop_configuration(invalid_data)
        self.assertFalse(result)

    def test_type_validator_api_response_valid(self):
        """测试API响应格式验证 - 有效数据"""
        from pagemaker.validators import TypeValidator
        
        valid_response = {
            "success": True,
            "data": {"test": "data"},
            "message": "Success",
            "errors": None
        }
        
        result = TypeValidator.validate_api_response(valid_response)
        self.assertTrue(result)

    def test_type_validator_api_response_invalid(self):
        """测试API响应格式验证 - 无效数据"""
        from pagemaker.validators import TypeValidator
        
        invalid_response = {}  # 缺少必需的success字段
        
        result = TypeValidator.validate_api_response(invalid_response)
        self.assertFalse(result)

    def test_type_validator_paginated_response_valid(self):
        """测试分页响应格式验证 - 有效数据"""
        from pagemaker.validators import TypeValidator
        
        valid_response = {
            "success": True,
            "data": [{"test": "item"}],
            "pagination": {
                "page": 1,
                "pageSize": 10,
                "total": 1,
                "totalPages": 1,
                "hasNext": False,
                "hasPrevious": False
            },
            "message": None
        }
        
        result = TypeValidator.validate_paginated_response(valid_response)
        self.assertTrue(result)

    def test_type_validator_paginated_response_invalid(self):
        """测试分页响应格式验证 - 无效数据"""
        from pagemaker.validators import TypeValidator
        
        invalid_response = {
            "success": True,
            "data": [],
            # 缺少pagination字段
        }
        
        result = TypeValidator.validate_paginated_response(invalid_response)
        self.assertFalse(result)

    def test_pydantic_validator_user_model_valid(self):
        """测试Pydantic用户模型验证 - 有效数据"""
        from pagemaker.validators import PydanticValidator
        
        result = PydanticValidator.validate_user_model(self.valid_user_data)
        self.assertIsNotNone(result)
        self.assertEqual(result.username, "testuser")

    def test_pydantic_validator_user_model_invalid(self):
        """测试Pydantic用户模型验证 - 无效数据"""
        from pagemaker.validators import PydanticValidator
        
        invalid_data = {"username": "test"}  # 缺少必需字段
        
        result = PydanticValidator.validate_user_model(invalid_data)
        self.assertIsNone(result)

    def test_create_api_response(self):
        """测试创建API响应"""
        from pagemaker.validators import create_api_response
        
        response = create_api_response(
            success=True,
            data={"test": "data"},
            message="Success"
        )
        
        self.assertEqual(response["success"], True)
        self.assertEqual(response["data"]["test"], "data")
        self.assertEqual(response["message"], "Success")
        self.assertIsNone(response["errors"])

    def test_create_api_response_with_errors(self):
        """测试创建带错误的API响应"""
        from pagemaker.validators import create_api_response
        
        errors = {"field1": ["Error message"]}
        response = create_api_response(
            success=False,
            errors=errors
        )
        
        self.assertEqual(response["success"], False)
        self.assertEqual(response["errors"], errors)

    def test_create_paginated_response(self):
        """测试创建分页响应"""
        from pagemaker.validators import create_paginated_response
        
        data = [{"id": 1}, {"id": 2}]
        response = create_paginated_response(
            data=data,
            page=1,
            page_size=10,
            total=2,
            message="Success"
        )
        
        self.assertEqual(response["success"], True)
        self.assertEqual(len(response["data"]), 2)
        self.assertEqual(response["pagination"]["page"], 1)
        self.assertEqual(response["pagination"]["total"], 2)
        self.assertEqual(response["pagination"]["totalPages"], 1)
        self.assertFalse(response["pagination"]["hasNext"])
        self.assertFalse(response["pagination"]["hasPrevious"])


class SchemasTestCase(TestCase):
    """Schemas模型测试"""

    def test_user_model_creation(self):
        """测试用户模型创建"""
        from pagemaker.schemas import UserModel
        
        user_data = {
            "id": "user-1",
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "role": "editor",
            "is_active": True,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z",
        }
        
        user = UserModel(**user_data)
        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.role, "editor")

    def test_login_request_model(self):
        """测试登录请求模型"""
        from pagemaker.schemas import LoginRequest
        
        login_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        login_request = LoginRequest(**login_data)
        self.assertEqual(login_request.username, "testuser")
        self.assertEqual(login_request.password, "testpass123")

    def test_jwt_token_request_model(self):
        """测试JWT令牌请求模型"""
        from pagemaker.schemas import JwtTokenRequest
        
        token_data = {
            "username": "testuser",
            "password": "testpass123"
        }
        
        token_request = JwtTokenRequest(**token_data)
        self.assertEqual(token_request.username, "testuser")
        self.assertEqual(token_request.password, "testpass123")
