# 组件 (Components)

## 组件 1: 认证组件 (Authentication Component)

* **职责 (Responsibility):** 全权负责用户身份认证。处理用户登录请求，验证凭据，并生成和刷新用于API访问的JWT（JSON Web Tokens）。
* **关键接口 (Key Interfaces):**
    * `POST /api/auth/token`: 用户登录并获取访问令牌。
    * `POST /api/auth/token/refresh`: 刷新即将过期的访问令牌。
* **依赖 (Dependencies):** `User` 数据模型。
* **技术栈 (Technology Stack):** Django, Django REST Framework, Simple JWT。

## 组件 2: 页面管理组件 (Page Management Component)

* **职责 (Responsibility):** 负责所有与 `PageTemplate` 相关的CRUD（创建、读取、更新、删除）操作。这是系统的核心业务逻辑所在。
* **关键接口 (Key Interfaces):**
    * `GET /api/v1/pages/`: 获取页面/模板列表。
    * `POST /api/v1/pages/`: 创建一个新的页面/模板。
    * `GET /api/v1/pages/{id}/`: 获取单个页面/模板的详细信息。
    * `PUT /api/v1/pages/{id}/`: 更新一个页面/模板的内容和属性。
    * `DELETE /api/v1/pages/{id}/`: 删除一个页面/模板。
* **依赖 (Dependencies):** `PageTemplate` 和 `User` 数据模型；认证组件 (所有接口都需验证用户身份和权限)。
* **技术栈 (Technology Stack):** Django, Django REST Framework。

## 组件 3: 媒体集成组件 (Media Integration Component)

* **职责 (Responsibility):** 作为与乐天R-Cabinet交互的唯一代理。处理所有媒体文件（主要是图片）的上传、校验和获取URL的逻辑。
* **关键接口 (Key Interfaces):**
    * `POST /api/v1/media/upload`: 接收前端上传的文件，并将其转发存储到R-Cabinet。
* **依赖 (Dependencies):**
    * 店铺配置组件: 在执行操作前，需根据当前操作的`target_area`，从此组件获取对应的乐天API密钥和FTP凭据。
    * 乐天R-Cabinet API & FTP服务器。
    * 认证组件 (确保只有登录用户才能上传)。
* **技术栈 (Technology Stack):** Django, Python `requests` 库, Python `ftplib` 库。

## 组件 4: 店铺配置组件 (Shop Configuration Component)

* **职责 (Responsibility):** 提供`ShopConfiguration`模型的CRUD管理功能。此外，它还负责调用乐天API，获取并刷新指定店铺配置中的`licenseKey`的到期日期。
* **关键接口 (Key Interfaces):**
    * `GET /api/v1/shop-configurations/`: 获取所有店铺配置的列表。
    * `PUT /api/v1/shop-configurations/{id}/`: 更新指定店铺的配置信息。
    * `POST /api/v1/shop-configurations/{id}/refresh-expiry`: 触发一个后台任务，调用乐天API来获取并更新该店铺配置的API到期日期。
* **依赖 (Dependencies):** `ShopConfiguration` 数据模型；认证组件；Rakuten License Management API。
* **技术栈 (Technology Stack):** Django, Django REST Framework。

## 组件交互图 (Component Interaction Diagram)

```mermaid
graph TD
    User[运营用户] -->|1. 操作UI| FE[Frontend App (Next.js)];

    subgraph "后端系统 (Django on AWS)"
        FE -->|2. 发起API请求| API_GW[API Gateway / Router];
        API_GW -->|3. 验证Token| Auth[认证组件];
        API_GW -->|4. 转发请求| PageSvc[页面管理组件];
        API_GW -->|4a. 转发请求| MediaSvc[媒体集成组件];
        
        PageSvc -->|5. 读写页面数据| DB[(MySQL Database)];
        Auth -->|读写用户数据| DB;
        
        MediaSvc -->|6. 调用乐天API| Rakuten[乐天 R-Cabinet API];
    end
``` 