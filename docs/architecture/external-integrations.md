# 外部集成 (External Integrations)

## 6.1 Rakuten Cabinet REST API

* **用途 (Purpose):** 用于单文件的操作（如编辑器内单个图片上传/更新/删除）和文件夹/文件信息的获取。
* **基础URL (Base URL):** `https://api.rms.rakuten.co.jp/`
* **认证方式 (Authentication):** 请求头的 `Authorization` 字段需设置为 `ESA Base64(serviceSecret:licenseKey)`。
* **速率限制 (Rate Limits):** 每秒1次请求。
* **数据格式 (Data Format):** XML。
* **将要使用的关键端点 (Key Endpoints Used):**
    * `(推断)` `POST /rest/2.0/images/upload`
    * `(推断)` `POST /rest/2.0/images/delete`
    * `cabinet.folder.files.get`
* **集成备注 (Integration Notes):** 使用API前，必须先通过RMS网页后台访问一次R-Cabinet。

## 6.2 Rakuten Cabinet FTP

* **用途 (Purpose):** 用于批量的图片文件新增和删除操作。
* **服务器信息**: 连接细节 (主机, 端口, 用户名, 密码) 将在运行时，由后端的 **店铺配置组件** 根据当前操作的店铺动态提供。
* **集成备注**: 后端需要使用Python内置的 **`ftplib`** 库来实现FTP客户端功能。

## 6.3 Rakuten License Management API

* **用途 (Purpose):** 用于查询指定`licenseKey`的有效期限。
* **文档 (Documentation):** `license.expiryDate.pdf`。
* **基础URL (Base URL):** `https://api.rms.rakuten.co.jp/`。
* **认证方式 (Authentication):** 请求头的 `Authorization` 字段需设置为 `ESA Base64(serviceSecret:licenseKey)`。
* **数据格式 (Data Format):** JSON。
* **将要使用的关键端点 (Key Endpoints Used):**
    * `GET /es/1.0/license-management/license-key/expiry-date`。 