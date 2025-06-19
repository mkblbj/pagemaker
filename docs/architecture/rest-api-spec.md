# REST API 规范 (REST API Spec)

```yaml
openapi: 3.0.1
info:
  title: Pagemaker API
  description: 用于Pagemaker CMS系统的内部REST API，负责页面管理、用户认证和店铺配置。
  version: 1.0.0
servers:
  - url: /api/v1
    description: API Version 1
paths:
  /auth/token:
    post:
      summary: 用户登录并获取令牌
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                username:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: 成功获取Access和Refresh令牌。
          content:
            application/json:
              schema:
                type: object
                properties:
                  access:
                    type: string
                  refresh:
                    type: string
  /pages/:
    get:
      summary: 获取页面/模板列表
      security:
        - bearerAuth: []
      responses:
        '200':
          description: 成功返回页面列表。
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/PageTemplate'
    post:
      summary: 创建一个新的页面/模板
      security:
        - bearerAuth: []
      responses:
        '201':
          description: 成功创建。
  /pages/{id}/:
    put:
      summary: 更新一个页面/模板
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        description: 包含更新后模块内容的JSON对象
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PageTemplateContent'
      responses:
        '200':
          description: 成功更新。
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PageTemplate'
  /shop-configurations/{id}/refresh-expiry:
    post:
      summary: 触发刷新API密钥到期日
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: 成功触发刷新任务，并返回更新后的配置。
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ShopConfiguration'
components:
  schemas:
    PageTemplate:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        content:
          type: array
          items:
            type: object
    PageTemplateContent:
      type: object
      properties:
        name:
          type: string
        content:
          type: array
          items:
            type: object
    ShopConfiguration:
      type: object
      properties:
        id:
          type: string
          format: uuid
        shopName:
          type: string
        targetArea:
          type: string
        apiLicenseExpiryDate:
          type: string
          format: date-time
          nullable: true
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
``` 