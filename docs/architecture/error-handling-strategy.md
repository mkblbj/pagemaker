# 错误处理策略 (Error Handling Strategy)

## 统一API错误响应结构

```json
{
  "error": {
    "code": "UNIQUE_ERROR_CODE",
    "message": "A human-readable message for developers.",
    "details": { }
  }
}
```

## 后端错误处理

创建一个全局的Django REST Framework**异常处理器 (ExceptionHandler)**，捕获所有异常，记录日志，并返回标准结构的错误JSON。

## 前端错误处理

使用`apiClient`的**响应拦截器**捕获所有非2xx响应，解析标准错误JSON，并向用户显示友好提示。 