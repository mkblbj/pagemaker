"""
Pydantic模型定义 - 用于运行时类型验证
对应前端共享类型包中的类型定义
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from enum import Enum
from pydantic import BaseModel, Field, validator


class UserRole(str, Enum):
    """用户角色枚举"""
    EDITOR = "editor"
    ADMIN = "admin"


class PageModuleType(str, Enum):
    """页面模块类型枚举"""
    TITLE = "title"
    TEXT = "text"
    IMAGE = "image"
    SEPARATOR = "separator"
    KEY_VALUE = "keyValue"
    MULTI_COLUMN = "multiColumn"


# 用户相关模型
class UserModel(BaseModel):
    """用户模型"""
    id: str
    username: str
    email: str
    full_name: str = Field(alias="fullName")
    role: UserRole
    is_active: bool = Field(alias="isActive")
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")

    class Config:
        populate_by_name = True
        use_enum_values = True


class CreateUserRequest(BaseModel):
    """创建用户请求模型"""
    username: str
    email: str
    full_name: str = Field(alias="fullName")
    role: UserRole
    password: str

    class Config:
        populate_by_name = True
        use_enum_values = True


class UpdateUserRequest(BaseModel):
    """更新用户请求模型"""
    full_name: Optional[str] = Field(None, alias="fullName")
    role: Optional[UserRole] = None
    is_active: Optional[bool] = Field(None, alias="isActive")

    class Config:
        populate_by_name = True
        use_enum_values = True


class LoginRequest(BaseModel):
    """登录请求模型"""
    username: str
    password: str


class LoginResponse(BaseModel):
    """登录响应模型"""
    user: UserModel
    access_token: str = Field(alias="accessToken")
    refresh_token: str = Field(alias="refreshToken")

    class Config:
        populate_by_name = True


# 页面相关模型
class PageModuleModel(BaseModel):
    """页面模块模型"""
    id: str
    type: PageModuleType
    # 其他配置属性使用动态字段
    
    class Config:
        extra = "allow"  # 允许额外字段
        use_enum_values = True


class PageTemplateModel(BaseModel):
    """页面模板模型"""
    id: str
    name: str
    content: List[PageModuleModel]
    target_area: str = Field(alias="targetArea")
    owner_id: str = Field(alias="ownerId")
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")

    class Config:
        populate_by_name = True


class ShopConfigurationModel(BaseModel):
    """店铺配置模型"""
    id: str
    shop_name: str = Field(alias="shopName")
    target_area: str = Field(alias="targetArea")
    api_license_expiry_date: Optional[str] = Field(None, alias="apiLicenseExpiryDate")

    class Config:
        populate_by_name = True


class CreatePageTemplateRequest(BaseModel):
    """创建页面模板请求模型"""
    name: str
    content: List[PageModuleModel]
    target_area: str = Field(alias="targetArea")

    class Config:
        populate_by_name = True


class UpdatePageTemplateRequest(BaseModel):
    """更新页面模板请求模型"""
    name: Optional[str] = None
    content: Optional[List[PageModuleModel]] = None
    target_area: Optional[str] = Field(None, alias="targetArea")

    class Config:
        populate_by_name = True


# API响应模型
class ApiResponse(BaseModel):
    """基础API响应模型"""
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    errors: Optional[Dict[str, List[str]]] = None


class ErrorResponse(BaseModel):
    """错误响应模型"""
    success: bool = False
    message: str
    errors: Optional[Dict[str, List[str]]] = None
    code: Optional[str] = None


class SuccessResponse(BaseModel):
    """成功响应模型"""
    success: bool = True
    data: Any
    message: Optional[str] = None


class PaginationInfo(BaseModel):
    """分页信息模型"""
    page: int
    page_size: int = Field(alias="pageSize")
    total: int
    total_pages: int = Field(alias="totalPages")
    has_next: bool = Field(alias="hasNext")
    has_previous: bool = Field(alias="hasPrevious")

    class Config:
        populate_by_name = True


class PaginatedResponse(BaseModel):
    """分页响应模型"""
    success: bool
    data: List[Any]
    pagination: PaginationInfo
    message: Optional[str] = None


# JWT相关模型
class JwtTokenRequest(BaseModel):
    """JWT令牌请求模型"""
    username: str
    password: str


class JwtUserInfo(BaseModel):
    """JWT用户信息模型"""
    id: str
    username: str
    email: str
    full_name: str = Field(alias="fullName")
    role: str

    class Config:
        populate_by_name = True


class JwtTokenResponse(BaseModel):
    """JWT令牌响应模型"""
    access: str
    refresh: str
    user: JwtUserInfo


class RefreshTokenRequest(BaseModel):
    """刷新令牌请求模型"""
    refresh: str


class RefreshTokenResponse(BaseModel):
    """刷新令牌响应模型"""
    access: str 