# 数据模型 (Data Models)

## 模型 1: PageTemplate (页面/模板)

* **用途 (Purpose):** 代表一个由运营用户在Pagemaker中创建的可视化页面或可复用的布局模板。
* **核心属性 (Key Attributes):**
    * `id`: `UUID` - 唯一标识符 (主键)。
    * `name`: `String` - 用户为页面或模板设定的名称。
    * `content`: `JSON` - 核心字段，用于存储构成页面的所有模块及其配置的结构化JSON数据。
    * `target_area`: `String` - 关联的乐天"目标区域"，用于标识此页面的用途。
    * `owner_id`: `ForeignKey` - 关联到创建此页面的用户。
    * `created_at`: `DateTime` - 创建时间戳。
    * `updated_at`: `DateTime` - 最后修改时间戳。
* **TypeScript 接口 (共享于 `packages/shared-types`):**
    ```typescript
    interface PageModule {
      id: string; // 模块实例的唯一ID
      type: 'title' | 'text' | 'image' | 'separator' | 'keyValue' | 'multiColumn'; // 模块类型
      [key: string]: any; // 其他配置属性
    }

    interface PageTemplate {
      id: string;
      name: string;
      content: PageModule[];
      targetArea: string;
      ownerId: string;
      createdAt: string; // ISO 8601 Date String
      updatedAt: string; // ISO 8601 Date String
    }
    ```
* **关系 (Relationships):**
    * **多对一 (Many-to-One):** 多个`PageTemplate`可以属于一个`User` (用户)。

## 模型 2: User (用户)

* **用途 (Purpose):** 代表一个Pagemaker CMS系统的认证用户。每个用户都可以登录系统、创建和管理属于自己的页面/模板。
* **核心属性 (Key Attributes):**
    * `id`: `UUID` - 唯一标识符 (主键)。
    * `username`: `String` - 用于登录系统的唯一用户名。
    * `password`: `String` - 经过哈希加密的用户密码。
    * `email`: `String` - 用户的电子邮箱，可用于未来的通知功能。
    * `full_name`: `String` - 用户的全名，用于在界面上显示。
    * `role`: `Enum` - 用户角色。建议预设两个角色：`'editor'` (编辑) 和 `'admin'` (管理员)。
    * `is_active`: `Boolean` - 标记用户账户是否有效，便于禁用账户而非直接删除。
    * `created_at`: `DateTime` - 创建时间戳。
    * `updated_at`: `DateTime` - 最后修改时间戳。
* **TypeScript 接口 (共享于 `packages/shared-types`):**
    ```typescript
    interface User {
      id: string;
      username: string;
      email: string;
      fullName: string;
      role: 'editor' | 'admin';
      isActive: boolean;
      createdAt: string; // ISO 8601 Date String
      updatedAt: string; // ISO 8601 Date String
    }
    ```
* **关系 (Relationships):**
    * **一对多 (One-to-Many):** 一个`User`可以拥有多个`PageTemplate`。

## 模型 3: ShopConfiguration (店铺配置)

* **用途 (Purpose):** 为每一个独立的店铺或目标区域存储其专属的API和FTP集成凭据，并管理其API密钥的有效期。
* **核心属性 (Key Attributes):**
    * `id`: `UUID` - 唯一标识符 (主键)。
    * `shop_name`: `String` - 用户可识别的店铺名称。
    * `target_area`: `String` (Unique) - 关联到 `PageTemplate` 的`target_area`字段。
    * `api_service_secret`: `EncryptedString` - 加密存储的乐天API Service Secret。
    * `api_license_key`: `EncryptedString` - 加密存储的乐天API License Key。
    * `api_license_expiry_date`: `DateTime` (Nullable) - 从乐天API获取的许可证密钥到期日期。
    * `ftp_host`: `String` - FTP服务器地址。
    * `ftp_port`: `Integer` - FTP服务器端口。(注：FTP的标准端口通常是21)
    * `ftp_user`: `String` - FTP用户名。
    * `ftp_password`: `EncryptedString` - 加密存储的FTP密码。
    * `created_at`: `DateTime` - 创建时间戳。
    * `updated_at`: `DateTime` - 最后修改时间戳。
* **TypeScript 接口 (共享于 `packages/shared-types`):**
    ```typescript
    interface ShopConfiguration {
      id: string;
      shopName: string;
      targetArea: string;
      apiLicenseExpiryDate?: string | null; // ISO 8601 Date String
    }
    ```
* **关系 (Relationships):**
    * **一对一 (One-to-One):** 每个`ShopConfiguration`精确对应一个`target_area`。 