# 登录问题排查指南

## 🎯 前端调试步骤

### 1. 浏览器开发者工具检查

打开浏览器开发者工具 (F12)，查看以下信息：

#### Network 标签
```
请求URL: https://backendtest.toiroworld.com/api/v1/auth/token/
请求方法: POST
状态码: ?
响应时间: ?
```

#### Console 标签
查找以下日志：
```
API Base URL: https://backendtest.toiroworld.com
Full Request URL: https://backendtest.toiroworld.com/api/v1/auth/token/
Login error: [错误详情]
```

### 2. 检查请求详情

在 Network 标签中点击登录请求，查看：

#### Request Headers
```
Content-Type: application/json
Origin: https://pagemaker-frontend.vercel.app
```

#### Request Payload
```json
{
  "username": "admin",
  "password": "admin123"
}
```

#### Response Headers
```
Access-Control-Allow-Origin: ?
Content-Type: ?
```

#### Response Body
```
错误信息或成功响应
```

## 🔧 后端调试步骤

### 1. 检查后端服务状态

```bash
# 1. 检查Gunicorn服务
systemctl status pagemaker-gunicorn

# 2. 检查进程
ps aux | grep gunicorn

# 3. 检查端口监听
netstat -tlnp | grep :8456

# 4. 检查后端健康
curl -v http://localhost:8456/api/v1/health/
```

### 2. 查看后端日志

```bash
# Gunicorn访问日志
tail -f /var/log/pagemaker-gunicorn-access.log

# Gunicorn错误日志  
tail -f /var/log/pagemaker-gunicorn-error.log

# 系统服务日志
journalctl -u pagemaker-gunicorn -f
```

### 3. 测试JWT端点

```bash
# 直接测试登录API
curl -X POST http://localhost:8456/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 🌐 OpenResty反代调试

### 1. 检查OpenResty配置

```bash
# 检查配置语法
openresty -t

# 查看配置文件
cat /usr/local/openresty/nginx/conf/nginx.conf | grep -A 20 "upstream pagemaker_backend"
```

### 2. 检查反代是否工作

```bash
# 通过OpenResty访问
curl -v https://backendtest.toiroworld.com/api/v1/health/

# 检查OpenResty日志
tail -f /usr/local/openresty/nginx/logs/access.log
tail -f /usr/local/openresty/nginx/logs/error.log
```

### 3. 必需的OpenResty配置

确保配置包含：

```nginx
upstream pagemaker_backend {
    server 127.0.0.1:8456;  # 确保端口正确
    keepalive 32;
}

server {
    listen 80;
    server_name backendtest.toiroworld.com;
    
    # API请求代理
    location /api/ {
        proxy_pass http://pagemaker_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS支持
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
        
        # 处理OPTIONS请求
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }
}
```

## 🚨 常见问题和解决方案

### 1. CORS错误
```
错误: Access to fetch at '...' has been blocked by CORS policy
解决: 确保OpenResty配置了正确的CORS头
```

### 2. 连接超时
```
错误: net::ERR_CONNECTION_TIMED_OUT
解决: 检查后端服务是否运行，端口是否正确
```

### 3. 502 Bad Gateway
```
错误: 502 Bad Gateway
解决: 后端服务未运行或OpenResty配置错误
```

### 4. 401 Unauthorized
```
错误: 401 Unauthorized
解决: 检查用户名密码，确认用户存在
```

### 5. 500 Internal Server Error
```
错误: 500 Internal Server Error
解决: 查看后端错误日志，检查数据库连接
```

## 📋 完整排查清单

### 前端检查
- [ ] 环境变量正确设置
- [ ] 网络请求发送成功
- [ ] 响应状态码和内容
- [ ] CORS错误检查

### 后端检查  
- [ ] Gunicorn服务运行正常
- [ ] 端口8456监听正常
- [ ] JWT端点响应正常
- [ ] 数据库连接正常
- [ ] 用户账号存在

### OpenResty检查
- [ ] 服务运行正常
- [ ] 配置语法正确
- [ ] upstream配置正确
- [ ] CORS配置完整
- [ ] 日志无错误

### 网络检查
- [ ] DNS解析正确
- [ ] SSL证书有效
- [ ] 防火墙允许访问
- [ ] 端口转发正确

## 🔧 快速修复命令

```bash
# 重启所有相关服务
systemctl restart pagemaker-gunicorn
systemctl reload openresty

# 查看实时日志
tail -f /var/log/pagemaker-gunicorn-error.log &
tail -f /usr/local/openresty/nginx/logs/error.log &

# 测试连接
curl -v https://backendtest.toiroworld.com/api/v1/health/
``` 