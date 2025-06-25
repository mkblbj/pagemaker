# Pagemaker 部署故障排除指南

## 常见问题及解决方案

### 1. Gunicorn 服务问题

#### 问题: `Unit pagemaker-gunicorn.service not found`

**原因**: 系统中没有安装 pagemaker-gunicorn systemd 服务

**解决方案**:

```bash
# 方法1: 使用服务安装脚本 (推荐)
cd /root/dev/pagemaker
chmod +x scripts/install-gunicorn-service.sh
sudo ./scripts/install-gunicorn-service.sh

# 方法2: 手动安装服务
sudo cp scripts/pagemaker-gunicorn.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable pagemaker-gunicorn
sudo systemctl start pagemaker-gunicorn
```

#### 问题: Gunicorn 服务启动失败

**检查步骤**:

```bash
# 1. 查看服务状态
systemctl status pagemaker-gunicorn

# 2. 查看详细日志
journalctl -u pagemaker-gunicorn -f

# 3. 检查端口是否被占用
netstat -tlnp | grep :8456

# 4. 检查虚拟环境
ls -la /root/dev/pagemaker/apps/backend/venv/bin/gunicorn

# 5. 检查.env文件
cat /root/dev/pagemaker/.env | grep BACKEND_PORT
```

**常见解决方案**:

```bash
# 端口被占用
sudo lsof -i :8456
# 杀死占用进程
sudo kill -9 <PID>

# 权限问题
sudo chown -R root:root /root/dev/pagemaker
sudo chmod +x /root/dev/pagemaker/apps/backend/venv/bin/gunicorn

# 重新安装依赖
cd /root/dev/pagemaker/apps/backend
source venv/bin/activate
pip install -r requirements.txt
```

### 2. OpenResty 配置问题

#### 问题: `OpenResty服务未运行`

**解决方案**:

```bash
# 检查OpenResty状态
systemctl status openresty

# 启动OpenResty
sudo systemctl start openresty

# 检查配置语法
sudo openresty -t

# 重载配置
sudo systemctl reload openresty
```

#### 问题: 反向代理配置错误

**检查配置**:

```bash
# 查看OpenResty配置
sudo nano /usr/local/openresty/nginx/conf/nginx.conf

# 确保upstream配置正确
upstream pagemaker_backend {
    server 127.0.0.1:8456;  # 确保端口与.env中BACKEND_PORT一致
    keepalive 32;
}
```

### 3. 健康检查失败

#### 问题: `❌ 健康检查失败`

**检查步骤**:

```bash
# 1. 手动测试健康检查端点
curl -v http://localhost:8456/api/health/

# 2. 检查Django应用状态
cd /root/dev/pagemaker/apps/backend
source venv/bin/activate
python manage.py check

# 3. 检查数据库连接
python manage.py migrate --dry-run

# 4. 查看应用日志
tail -f /var/log/pagemaker-gunicorn-error.log
```

### 4. 数据库连接问题

#### 问题: 数据库连接失败

**检查.env配置**:

```bash
# 查看数据库配置
grep "DATABASE" /root/dev/pagemaker/.env

# 必需的环境变量
DATABASE_NAME=your_database_name
DATABASE_USER=your_username  
DATABASE_PASSWORD=your_password
DATABASE_HOST=your_host
DATABASE_PORT=3306
```

**测试数据库连接**:

```bash
# 使用mysql客户端测试
mysql -h your_host -u your_username -p your_database_name

# 使用Python测试
cd /root/dev/pagemaker/apps/backend
source venv/bin/activate
python scripts/test-db-connection.py
```

### 5. 端口配置问题

#### 问题: 端口不匹配

**检查端口配置**:

```bash
# 1. 检查.env文件中的端口配置
grep "BACKEND_PORT" /root/dev/pagemaker/.env

# 2. 检查Gunicorn服务配置
grep "bind" /etc/systemd/system/pagemaker-gunicorn.service

# 3. 检查OpenResty配置
grep "127.0.0.1:" /usr/local/openresty/nginx/conf/nginx.conf
```

**确保端口一致**:
- `.env` 文件中的 `BACKEND_PORT`
- Gunicorn 服务的 `--bind` 参数
- OpenResty upstream 配置
- 健康检查URL

### 6. 权限问题

#### 问题: 权限不足

**解决方案**:

```bash
# 设置正确的文件权限
sudo chown -R root:root /root/dev/pagemaker
sudo chmod +x /root/dev/pagemaker/scripts/*.sh

# 设置日志文件权限
sudo touch /var/log/pagemaker-deploy.log
sudo chown root:root /var/log/pagemaker-deploy.log

# 设置Gunicorn日志权限
sudo touch /var/log/pagemaker-gunicorn-access.log
sudo touch /var/log/pagemaker-gunicorn-error.log
sudo chown root:root /var/log/pagemaker-gunicorn-*.log
```

### 7. 虚拟环境问题

#### 问题: 虚拟环境损坏或缺失

**解决方案**:

```bash
# 删除并重建虚拟环境
cd /root/dev/pagemaker/apps/backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## 调试工具和命令

### 实用命令

```bash
# 查看所有相关服务状态
systemctl status pagemaker-gunicorn openresty

# 查看端口监听情况
netstat -tlnp | grep -E ":(8456|80|443)"

# 查看进程
ps aux | grep -E "(gunicorn|openresty)"

# 查看日志
tail -f /var/log/pagemaker-deploy.log
journalctl -u pagemaker-gunicorn -f
journalctl -u openresty -f

# 测试网络连接
curl -v http://localhost:8456/api/health/
curl -v http://backendtest.toiroworld.com/api/health/
```

### 服务管理命令

```bash
# Gunicorn 服务
systemctl start pagemaker-gunicorn
systemctl stop pagemaker-gunicorn  
systemctl restart pagemaker-gunicorn
systemctl status pagemaker-gunicorn
journalctl -u pagemaker-gunicorn -f

# OpenResty 服务
systemctl start openresty
systemctl stop openresty
systemctl reload openresty
systemctl status openresty
openresty -t  # 测试配置

# 重新安装Gunicorn服务
./scripts/install-gunicorn-service.sh uninstall
./scripts/install-gunicorn-service.sh install
```

## 完整的故障排除流程

1. **检查服务状态**
   ```bash
   systemctl status pagemaker-gunicorn openresty
   ```

2. **检查端口配置**
   ```bash
   grep "BACKEND_PORT" .env
   netstat -tlnp | grep :8456
   ```

3. **检查日志**
   ```bash
   journalctl -u pagemaker-gunicorn --since "10 minutes ago"
   tail -20 /var/log/pagemaker-gunicorn-error.log
   ```

4. **手动测试**
   ```bash
   curl -v http://localhost:8456/api/health/
   ```

5. **重新部署**
   ```bash
   ./scripts/deploy-backend.sh
   ```

如果问题仍然存在，请提供以上命令的输出结果以便进一步诊断。 