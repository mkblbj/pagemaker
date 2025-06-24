"""
JSON Schema验证工具
用于验证API响应格式符合TypeScript类型定义
"""

import json
from typing import Any, Dict, List, Optional
from jsonschema import validate, ValidationError
from pydantic import ValidationError as PydanticValidationError
from .schemas import (
    UserModel,
    PageTemplateModel,
    ShopConfigurationModel,
    ApiResponse,
    ErrorResponse,
    SuccessResponse,
    PaginatedResponse,
)


# JSON Schema定义 - 对应TypeScript类型
USER_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "username": {"type": "string"},
        "email": {"type": "string", "format": "email"},
        "fullName": {"type": "string"},
        "role": {"type": "string", "enum": ["editor", "admin"]},
        "isActive": {"type": "boolean"},
        "createdAt": {"type": "string"},
        "updatedAt": {"type": "string"},
    },
    "required": [
        "id",
        "username",
        "email",
        "fullName",
        "role",
        "isActive",
        "createdAt",
        "updatedAt",
    ],
    "additionalProperties": False,
}

PAGE_MODULE_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "type": {
            "type": "string",
            "enum": ["title", "text", "image", "separator", "keyValue", "multiColumn"],
        },
    },
    "required": ["id", "type"],
    "additionalProperties": True,  # 允许其他配置属性
}

PAGE_TEMPLATE_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "name": {"type": "string"},
        "content": {"type": "array", "items": PAGE_MODULE_SCHEMA},
        "targetArea": {"type": "string"},
        "ownerId": {"type": "string"},
        "createdAt": {"type": "string"},
        "updatedAt": {"type": "string"},
    },
    "required": [
        "id",
        "name",
        "content",
        "targetArea",
        "ownerId",
        "createdAt",
        "updatedAt",
    ],
    "additionalProperties": False,
}

SHOP_CONFIGURATION_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "shopName": {"type": "string"},
        "targetArea": {"type": "string"},
        "apiLicenseExpiryDate": {"type": ["string", "null"]},
    },
    "required": ["id", "shopName", "targetArea"],
    "additionalProperties": False,
}

API_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "success": {"type": "boolean"},
        "data": {},  # 任意类型
        "message": {"type": ["string", "null"]},
        "errors": {
            "type": ["object", "null"],
            "patternProperties": {".*": {"type": "array", "items": {"type": "string"}}},
        },
    },
    "required": ["success"],
    "additionalProperties": False,
}

PAGINATED_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "success": {"type": "boolean"},
        "data": {"type": "array"},
        "pagination": {
            "type": "object",
            "properties": {
                "page": {"type": "integer", "minimum": 1},
                "pageSize": {"type": "integer", "minimum": 1},
                "total": {"type": "integer", "minimum": 0},
                "totalPages": {"type": "integer", "minimum": 0},
                "hasNext": {"type": "boolean"},
                "hasPrevious": {"type": "boolean"},
            },
            "required": [
                "page",
                "pageSize",
                "total",
                "totalPages",
                "hasNext",
                "hasPrevious",
            ],
            "additionalProperties": False,
        },
        "message": {"type": ["string", "null"]},
    },
    "required": ["success", "data", "pagination"],
    "additionalProperties": False,
}


class TypeValidator:
    """类型验证器"""

    @staticmethod
    def validate_user(data: Dict[str, Any]) -> bool:
        """验证用户数据格式"""
        try:
            validate(instance=data, schema=USER_SCHEMA)
            return True
        except ValidationError as e:
            print(f"User validation error: {e.message}")
            return False

    @staticmethod
    def validate_page_template(data: Dict[str, Any]) -> bool:
        """验证页面模板数据格式"""
        try:
            validate(instance=data, schema=PAGE_TEMPLATE_SCHEMA)
            return True
        except ValidationError as e:
            print(f"Page template validation error: {e.message}")
            return False

    @staticmethod
    def validate_shop_configuration(data: Dict[str, Any]) -> bool:
        """验证店铺配置数据格式"""
        try:
            validate(instance=data, schema=SHOP_CONFIGURATION_SCHEMA)
            return True
        except ValidationError as e:
            print(f"Shop configuration validation error: {e.message}")
            return False

    @staticmethod
    def validate_api_response(data: Dict[str, Any]) -> bool:
        """验证API响应格式"""
        try:
            validate(instance=data, schema=API_RESPONSE_SCHEMA)
            return True
        except ValidationError as e:
            print(f"API response validation error: {e.message}")
            return False

    @staticmethod
    def validate_paginated_response(data: Dict[str, Any]) -> bool:
        """验证分页响应格式"""
        try:
            validate(instance=data, schema=PAGINATED_RESPONSE_SCHEMA)
            return True
        except ValidationError as e:
            print(f"Paginated response validation error: {e.message}")
            return False


class PydanticValidator:
    """Pydantic运行时验证器"""

    @staticmethod
    def validate_user_model(data: Dict[str, Any]) -> Optional[UserModel]:
        """验证并转换用户模型"""
        try:
            return UserModel(**data)
        except PydanticValidationError as e:
            print(f"Pydantic user model validation error: {e}")
            return None

    @staticmethod
    def validate_page_template_model(
        data: Dict[str, Any],
    ) -> Optional[PageTemplateModel]:
        """验证并转换页面模板模型"""
        try:
            return PageTemplateModel(**data)
        except PydanticValidationError as e:
            print(f"Pydantic page template model validation error: {e}")
            return None

    @staticmethod
    def validate_shop_configuration_model(
        data: Dict[str, Any],
    ) -> Optional[ShopConfigurationModel]:
        """验证并转换店铺配置模型"""
        try:
            return ShopConfigurationModel(**data)
        except PydanticValidationError as e:
            print(f"Pydantic shop configuration model validation error: {e}")
            return None

    @staticmethod
    def validate_api_response_model(data: Dict[str, Any]) -> Optional[ApiResponse]:
        """验证并转换API响应模型"""
        try:
            return ApiResponse(**data)
        except PydanticValidationError as e:
            print(f"Pydantic API response model validation error: {e}")
            return None


def create_api_response(
    success: bool,
    data: Any = None,
    message: str = None,
    errors: Dict[str, List[str]] = None,
) -> Dict[str, Any]:
    """创建标准API响应"""
    response = {
        "success": success,
    }

    if data is not None:
        response["data"] = data

    if message:
        response["message"] = message

    if errors:
        response["errors"] = errors

    # 验证响应格式
    if not TypeValidator.validate_api_response(response):
        raise ValueError("Invalid API response format")

    return response


def create_paginated_response(
    data: List[Any], page: int, page_size: int, total: int, message: str = None
) -> Dict[str, Any]:
    """创建分页响应"""
    total_pages = (total + page_size - 1) // page_size
    has_next = page < total_pages
    has_previous = page > 1

    response = {
        "success": True,
        "data": data,
        "pagination": {
            "page": page,
            "pageSize": page_size,
            "total": total,
            "totalPages": total_pages,
            "hasNext": has_next,
            "hasPrevious": has_previous,
        },
    }

    if message:
        response["message"] = message

    # 验证响应格式
    if not TypeValidator.validate_paginated_response(response):
        raise ValueError("Invalid paginated response format")

    return response
