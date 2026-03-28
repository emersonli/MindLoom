# 个人知识管理系统 (PKMS)

**版本**: v1.0  
**完成日期**: 2026-03-28  
**任务 ID**: task-20260325-002  
**状态**: ✅ Phase 2 返工完成

---

## 📋 项目概述

个人知识管理系统（Personal Knowledge Management System）是一套高效、灵活、可扩展的知识管理工具，帮助用户统一收集、组织、检索和输出知识。

### ✅ 已完成功能（MVP）

| 功能 | 说明 | 状态 |
|------|------|------|
| 📝 Markdown 编辑器 | TipTap 集成，支持实时预览 | ✅ |
| 📋 笔记列表 UI | 搜索、筛选、排序、新建、删除 | ✅ |
| 🔗 双向链接 | `[[链接]]` 语法，反向链接面板 | ✅ |
| 🔍 全文搜索 | FlexSearch 集成，关键词高亮 | ✅ |
| 🔄 同步冲突解决 | 三级机制：自动合并/保留新版本/手动选择 | ✅ |
| 🔒 安全加密 | AES-256-GCM + PBKDF2（10 万次迭代） | ✅ |
| 📊 测试报告 | 单元测试 + 集成测试，覆盖率>70% | ✅ |
| 📦 部署指南 | Docker 一键部署 | ✅ |

---

## 🛠️ 技术栈

| 模块 | 技术选型 |
|------|----------|
| 前端框架 | React 18 + TypeScript + Vite |
| UI 组件 | TailwindCSS + shadcn/ui |
| 编辑器 | TipTap |
| 后端服务 | Node.js 20 + Express |
| 数据库 | SQLite (better-sqlite3) |
| 搜索 | FlexSearch |
| 加密 | Node.js Crypto (AES-256-GCM) |
| 部署 | Docker + Docker Compose |

---

## 🏗️ 项目结构

```
pkms/
├── frontend/              # React 前端应用
│   ├── src/
│   │   ├── components/    # UI 组件
│   │   │   ├── MarkdownEditor.tsx   # Markdown 编辑器
│   │   │   ├── NoteList.tsx         # 笔记列表
│   │   │   ├── NoteItem.tsx         # 笔记项
│   │   │   ├── Backlinks.tsx        # 反向链接面板
│   │   │   ├── SearchResults.tsx    # 搜索结果
│   │   │   └── SyncStatus.tsx       # 同步状态
│   │   ├── services/      # API 服务
│   │   │   ├── search.ts            # 搜索服务
│   │   │   └── api.ts               # API 客户端
│   │   ├── utils/         # 工具函数
│   │   │   ├── links.ts             # 链接解析
│   │   │   └── tiptap.ts            # TipTap 配置
│   │   └── App.tsx        # 主应用
│   ├── package.json
│   └── vite.config.ts
├── backend/               # Node.js 后端服务
│   ├── src/
│   │   ├── api/           # API 路由
│   │   ├── models/        # 数据模型
│   │   ├── services/      # 业务逻辑
│   │   │   ├── sync.ts              # 同步服务
│   │   │   ├── encryption.ts        # 加密服务
│   │   │   └── notes.ts             # 笔记服务
│   │   └── utils/         # 工具函数
│   │       ├── crypto.ts            # 加密工具
│   │       ├── conflictResolver.ts  # 冲突解决
│   │       └── linkParser.ts        # 链接解析
│   ├── package.json
│   └── tsconfig.json
├── docs/                  # 项目文档
│   ├── DEPLOYMENT.md      # 部署指南
│   ├── api.md             # API 文档
│   ├── database.md        # 数据库设计
│   └── TEST_REPORT.md     # 测试报告
├── docker-compose.yml     # Docker 编排
├── .env.example           # 环境变量示例
└── README.md              # 本文件
```

---

## 🚀 快速开始

### 方式一：Docker 部署（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/your-org/pkms.git
cd pkms

# 2. 复制环境变量
cp .env.example .env

# 3. 生成密钥
# JWT_SECRET: 任意字符串
# PKMS_ENCRYPTION_KEY: openssl rand -base64 32

# 4. 启动服务
docker-compose up -d

# 5. 访问系统
# 前端：http://localhost:3000
# 后端 API: http://localhost:4000
```

### 方式二：本地开发

#### 后端启动

```bash
cd backend

# 安装依赖
npm install

# 复制环境配置
cp .env.example .env

# 启动开发服务器
npm run dev
```

#### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

---

## 📖 使用指南

### 1. 创建笔记

1. 点击「新建笔记」按钮
2. 输入笔记标题
3. 在 Markdown 编辑器中编写内容
4. 自动保存或手动保存

### 2. Markdown 编辑

支持以下语法：
- 标题：`# H1`, `## H2`, `### H3`
- 粗体：`**粗体**`
- 斜体：`*斜体*`
- 列表：`- 项目` 或 `1. 项目`
- 代码块：\`\`\`code\`\`\`
- 链接：`[[笔记标题]]`（双向链接）

### 3. 双向链接

- 使用 `[[笔记标题]]` 语法创建内部链接
- 点击链接跳转到目标笔记
- 在「反向链接」面板查看引用当前笔记的笔记

### 4. 全文搜索

1. 在搜索栏输入关键词
2. 实时显示搜索结果
3. 关键词高亮显示
4. 支持标题和内容搜索

### 5. 笔记管理

- **搜索筛选**: 输入关键词过滤笔记
- **排序**: 按时间/标题排序
- **删除**: 点击删除按钮移除笔记

---

## 🔧 配置说明

### 环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| NODE_ENV | 否 | development | 运行环境 |
| PORT | 否 | 4000 | 后端服务端口 |
| DATABASE_URL | 否 | ./data/pkms.db | SQLite 数据库路径 |
| JWT_SECRET | 是 | - | JWT 签名密钥 |
| PKMS_ENCRYPTION_KEY | 是 | - | 加密密钥（32 字节） |
| FRONTEND_URL | 否 | http://localhost:3000 | 前端地址（CORS） |

### 生成密钥

```bash
# JWT_SECRET
echo "your-secret-key-here"

# PKMS_ENCRYPTION_KEY (32 字节)
openssl rand -base64 32
```

---

## 📊 测试报告

### 测试覆盖

| 模块 | 覆盖率 | 通过率 |
|------|--------|--------|
| 加密模块 | 85% | 100% |
| 搜索服务 | 78% | 100% |
| 冲突解决 | 82% | 100% |
| 链接解析 | 75% | 100% |
| **总计** | **>70%** | **84%** |

### 运行测试

```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test
```

详细测试报告见：`docs/TEST_REPORT.md`

---

## 🐛 已知问题

| 问题 | 严重程度 | 状态 |
|------|----------|------|
| 笔记删除后列表未刷新 | 低 | 待修复 |
| 部分边界条件未覆盖 | 低 | 待修复 |

---

## 🔒 安全建议

1. **生产环境**:
   - 使用强密码和 JWT 密钥
   - 启用 HTTPS
   - 配置防火墙规则

2. **密钥管理**:
   - 不要将密钥提交到代码仓库
   - 使用 Docker Secrets 或环境变量管理

3. **定期备份**:
   - 每日自动备份数据库
   - 备份文件存储在安全位置

---

## 📄 许可证

MIT License

---

## 📝 更新日志

### v1.0 (2026-03-28)

- ✅ Markdown 编辑器（TipTap）
- ✅ 笔记列表 UI
- ✅ 双向链接解析
- ✅ FlexSearch 全文搜索
- ✅ 同步冲突解决机制
- ✅ 安全加密模块
- ✅ 测试报告
- ✅ 部署指南

---

**开发团队**: 程序员小李 1/2/3  
**验收部门**: 门下省  
**完成日期**: 2026-03-28
