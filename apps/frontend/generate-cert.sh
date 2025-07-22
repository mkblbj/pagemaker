#!/bin/bash
# 生成开发环境HTTPS证书

echo "🔒 为开发环境生成自签名SSL证书..."

# 创建证书目录
mkdir -p certs

# 生成私钥
openssl genrsa -out certs/dev-key.pem 2048

# 生成证书签名请求
openssl req -new -key certs/dev-key.pem -out certs/dev-csr.pem -subj "/C=JP/ST=Tokyo/L=Tokyo/O=Pagemaker Dev/CN=192.168.1.26"

# 创建扩展文件（支持IP地址）
cat > certs/dev-ext.conf << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 192.168.1.26
IP.1 = 192.168.1.26
IP.2 = 127.0.0.1
EOF

# 生成自签名证书
openssl x509 -req -in certs/dev-csr.pem -signkey certs/dev-key.pem -out certs/dev-cert.pem -days 365 -extensions v3_req -extfile certs/dev-ext.conf

# 清理临时文件
rm certs/dev-csr.pem certs/dev-ext.conf

echo "✅ 证书生成完成："
echo "   私钥: certs/dev-key.pem"
echo "   证书: certs/dev-cert.pem"
echo ""
echo "📝 接下来需要："
echo "1. 更新 next.config.js 启用HTTPS"
echo "2. 在浏览器中信任自签名证书" 