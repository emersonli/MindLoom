# PKMS 部署指南

**项目**: 个人知识管理系统 (PKMS)
**版本**: v0.1.0 (MVP)
**更新日期**: 2026-03-28

---

## 📋 部署概述

本文档提供 PKMS 系统的部署指南，支持 Docker Compose 一键部署。

### 系统要求

| 资源 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 1 核心 | 2 核心 |
| 内存 | 1 GB | 2 GB |
| 磁盘 | 5 GB | 20 GB |
| 操作系统 | Ubuntu 22.04 / CentOS 8 / Windows 10+ |

### 软件依赖

| 软件 | 版本要求 |
|------|----------|
| Docker | 20.10+ |
| Docker Compose | 2.0+ |
| Git | 2.0+ |

---

## 🚀 快速部署（Docker Compose）

### 1. 克隆项目

```bash
git clone <repository-url>
cd pkms
```

### 2. 配置环境变量

```bash
# 复制环境配置模板
cp backend/.env.example backend/.env

# 编辑配置文件
nano backend/.env
```

配置项说明：

```env
PORT=8080              # 后端服务端口
NODE_ENV=production    # 运行环境
DATA_DIR=/app/data     # 数据存储目录
STORAGE_DIR=/app/storage  # 文件存储目录
```

### 3. 启动服务

```bash
# 一键启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 访问应用

| 服务 | 地址 |
|------|------|
| 前端 Web | http://localhost:3000 |
| 后端 API | http://localhost:8080 |
| 健康检查 | http://localhost:8080/api/health |

---

## 🔧 手动部署（开发环境）

### 前端部署

```bash
cd frontend

# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build

# 使用 Nginx 部署
# 复制 dist 目录到 Nginx webroot
cp -r dist/* /var/www/html/
```

### 后端部署

```bash
cd backend

# 安装依赖
npm install

# 编译 TypeScript
npm run build

# 启动服务
npm start
```

---

## ⚙️ Docker 部署配置

### docker-compose.yml 说明

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    volumes:
      - pkms-data:/app/data
      - pkms-storage:/app/storage
    environment:
      - NODE_ENV=production

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  pkms-data:
  pkms-storage:
```

### 自定义配置

**修改端口**：

```yaml
# 前端端口
ports:
  - "8080:80"  # 将 80 映射到 8080

# 后端端口
ports:
  - "9090:8080"  # 将 8080 映射到 9090
```

**数据持久化**：

```yaml
volumes:
  # 本地目录挂载
  - /host/path:/container/path
```

---

## 🔒 安全配置

### 生产环境建议

1. **使用 HTTPS**
   - 配置 SSL 证书
   - 强制 HTTPS 访问

2. **环境变量安全**
   - 不要在代码中硬编码敏感信息
   - 使用 Docker Secrets 或环境变量

3. **防火墙配置**
   ```bash
   # 限制访问 IP
   ufw allow from 10.0.0.0/8 to any port 8080
   ```

4. **定期备份**
   ```bash
   # 备份数据卷
   docker run --rm -v pkms-data:/data -v $(pwd):/backup alpine tar czf /backup/pkms-data-$(date +%Y%m%d).tar.gz /data
   ```

---

## 🔧 故障排查

### 常见问题

**1. 服务启动失败**

```bash
# 查看错误日志
docker-compose logs backend

# 检查端口占用
netstat -tlnp | grep 8080
```

**2. 数据无法持久化**

```bash
# 检查数据卷
docker volume ls | grep pkms

# 重建数据卷
docker-compose down -v
docker-compose up -d
```

**3. 前端无法访问后端**

```bash
# 检查网络连接
docker network ls
docker network inspect pkms_default

# 测试 API 连接
curl http://backend:8080/api/health
```

---

## 📊 监控和维护

### 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看资源使用
docker stats

# 查看日志
docker-compose logs -f --tail=100

# 重启服务
docker-compose restart

# 更新服务
git pull
docker-compose build
docker-compose up -d
```

### 定期维护

| 任务 | 频率 |
|------|------|
| 备份数据 | 每日 |
| 更新镜像 | 每周 |
| 清理日志 | 每周 |
| 安全审计 | 每月 |

---

## 📞 支持

如遇部署问题，请提交 Issue 或联系技术支持。

---

*尚书省 工部 谨呈*
*2026-03-28*