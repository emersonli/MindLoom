# MindLoom - 个人知识管理系统 (PKMS)

**版本**: v0.3.0  
**发布日期**: 2026-04-05  
**GitHub**: https://github.com/emersonli/MindLoom  
**状态**: ✅ Phase 3 正式发布

---

## 📋 项目概述

MindLoom 是一套高效、灵活、可扩展的个人知识管理工具，帮助用户统一收集、组织、检索和输出知识。支持暗色/明亮主题、版本历史、知识图谱等高级功能。

### ✅ Phase 3 已完成功能 (v0.3.0)

| 功能 | 说明 | 状态 |
|------|------|------|
| 📱 移动端适配 | 响应式布局、移动导航、触摸优化 | ✅ |
| 🔄 跨设备同步 | 实时双向同步、冲突检测、增量同步 | ✅ |
| 🌐 浏览器扩展 | Chrome/Edge/Firefox、一键剪藏 | ✅ |
| 🤖 AI 辅助写作 | 智能摘要、标签建议、内容续写 | ✅ |

### ✅ Phase 2 已完成功能 (v1.0.0)

| 功能 | 说明 | 状态 |
|------|------|------|
| 🌓 主题切换 | 暗色/明亮/系统偏好，平滑过渡 | ✅ |
| 📜 版本历史 | 自动保存、版本预览、一键恢复 | ✅ |
| 📅 每日笔记 | 快捷按钮、自动日期、预设模板 | ✅ |
| ⌨️ 全局快捷键 | Ctrl+N/S/F/G/?，编辑器格式化 | ✅ |
| 🕸️ 知识图谱 | D3.js 力导向图、拖拽缩放、节点跳转 | ✅ |
| 📝 Markdown 编辑器 | TipTap 集成，实时预览 | ✅ |
| 📋 笔记列表 UI | 搜索、筛选、排序、新建、删除 | ✅ |
| 🔗 双向链接 | `[[链接]]` 语法，反向链接面板 | ✅ |
| 🔍 全文搜索 | FlexSearch 集成，关键词高亮 | ✅ |
| 🔒 安全加密 | AES-256-GCM + PBKDF2 | ✅ |

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
git clone https://github.com/emersonli/MindLoom.git
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

#### 前置要求

- Node.js >= 20.x
- npm >= 9.x

#### 后端启动

```bash
cd backend

# 1. 安装依赖
npm install

# 2. 复制环境配置
cp ../.env.example .env

# 3. 配置环境变量
# 编辑 .env 文件，填写 JWT_SECRET 和 PKMS_ENCRYPTION_KEY
# 生成密钥方法:
#   JWT_SECRET: echo "your-secret-key"
#   PKMS_ENCRYPTION_KEY: openssl rand -base64 32

# 4. 启动开发服务器 (数据库会自动初始化)
npm run dev

# 后端服务运行在 http://localhost:4000
```

#### 前端启动

```bash
cd frontend

# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 前端服务运行在 http://localhost:3000
```

#### 运行测试

```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test
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

## 🔧 故障排查

### 常见问题

**Q1: `npm install` 失败**
```bash
# 清除缓存重试
npm cache clean --force
npm install

# 或使用国内镜像
npm config set registry https://registry.npmmirror.com
npm install
```

**Q2: 后端启动失败 "Cannot find module"**
```bash
# 确保在 backend 目录下运行
cd backend
npm run build
npm start
```

**Q3: 前端无法连接后端 (CORS 错误)**
```bash
# 检查 .env 中的 FRONTEND_URL 配置
# 后端 .env: FRONTEND_URL=http://localhost:3000
# 确保前后端同时启动
```

**Q4: 数据库文件不存在**
```bash
# 数据库会在首次启动时自动创建
# 检查 backend/data/ 目录是否有写入权限
mkdir -p backend/data
chmod 755 backend/data
```

**Q5: Docker 启动失败**
```bash
# 检查 Docker 是否运行
docker --version
docker-compose --version

# 重新构建并启动
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

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

### v0.3.0 (2026-04-05) - Phase 3 生态扩展发布

**新功能**:
- 📱 移动端适配 (P3-01)
  - 响应式布局，支持手机/平板
  - 移动导航组件和底部导航栏
  - 触摸友好的 UI 设计 (≥44x44px)
  - 暗色主题完整适配
- 🔄 跨设备同步 (P3-04)
  - 实时双向同步 (WebSocket + 轮询)
  - 冲突检测与自动合并
  - 增量同步节省带宽
  - 多设备状态追踪
- 🌐 浏览器扩展 (P3-05)
  - Chrome/Edge/Firefox 支持
  - 网页内容一键保存
  - 自动提取正文 + 元数据
  - 智能标签建议
- 🤖 AI 辅助写作 (P3-06)
  - 智能摘要 (可配置长度/风格)
  - 标签建议 (基于内容分析)
  - 内容续写 (上下文感知)
  - 内容优化 (语气/目标调整)
  - 多语言翻译
  - 支持 OpenAI / Anthropic / Local LLM

**测试**:
- 100% 单元测试覆盖率
- 15/15 AI 功能测试通过
- 22/22 同步功能测试通过

**代码统计**:
- 新增文件：40 个
- 新增代码：11,775 行
- 浏览器扩展：8 个文件

### v1.0.0 (2026-04-02) - Phase 2 发布

**新功能**:
- 🌓 暗色/明亮主题切换 (P2-05)
- 📜 笔记版本历史 (P2-01)
- 📅 每日笔记模板 (P2-03)
- ⌨️ 全局快捷键系统 (P2-04)
- 🕸️ 知识图谱可视化 (P2-02)

**测试**:
- 79 个 E2E 测试用例 100% 通过
- 3 个体验问题已修复验证

**代码统计**:
- 新增文件：40 个
- 修改文件：19 个
- 总代码量：+4,350 行，-263 行

### v1.0 (2026-03-28) - Phase 1 MVP

- ✅ Markdown 编辑器（TipTap）
- ✅ 笔记列表 UI
- ✅ 双向链接解析
- ✅ FlexSearch 全文搜索
- ✅ 同步冲突解决机制
- ✅ 安全加密模块
- ✅ 测试报告
- ✅ 部署指南

---

## 👥 致谢

- @frontend-dev - 前端开发
- @backend-dev - 后端 API
- @qa-engineer - 测试验证
- @ui-ux-designer - UI 设计规范
- @product-manager - 代码审查 + 发布

---

**GitHub**: https://github.com/emersonli/MindLoom  
**最新 Release**: https://github.com/emersonli/MindLoom/releases/tag/v0.3.0  
**v1.0.0**: https://github.com/emersonli/MindLoom/releases/tag/v1.0.0  
**发布日期**: 2026-04-05
