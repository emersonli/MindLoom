# PKMS API 文档

**版本**: v0.4.0  
**基础路径**: `/api`  
**更新日期**: 2026-03-31

---

## 认证

### POST /api/auth/register

用户注册。

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应** (201):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": 1711360200000
}
```

**错误**:
- 400: Invalid email format / Password must be at least 8 characters
- 409: Email already registered

---

### POST /api/auth/login

用户登录。

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应** (200):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": 1711360200000
}
```

**错误**:
- 400: Email and password are required
- 401: Invalid email or password

---

### POST /api/auth/logout

用户登出（使 token 失效）。

**请求头**:
```
Authorization: Bearer <token>
```

**响应**: 204 No Content

---

### GET /api/auth/me

获取当前登录用户信息。

**请求头**:
```
Authorization: Bearer <token>
```

**响应** (200):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "created_at": 1711360200000,
  "updated_at": 1711360200000
}
```

**错误**:
- 401: Authorization header required / Invalid authorization format / Invalid or expired token
- 404: User not found

---

## 笔记管理

所有笔记 API 需要认证。

### 请求头
```
Authorization: Bearer <token>
```

### GET /api/notes

获取当前用户的所有笔记列表。

**响应**:
```json
[
  {
    "id": "uuid",
    "title": "笔记标题",
    "content": "笔记内容",
    "created_at": 1711360200000,
    "updated_at": 1711360200000,
    "encrypted": 0,
    "checksum": null,
    "user_id": "uuid"
  }
]
```

---

### GET /api/notes/:id

获取单个笔记详情（包含标签、链接关系）。

**路径参数**:
- `id` - 笔记 ID

**响应**:
```json
{
  "id": "uuid",
  "title": "笔记标题",
  "content": "笔记内容",
  "created_at": 1711360200000,
  "updated_at": 1711360200000,
  "encrypted": 0,
  "checksum": null,
  "user_id": "uuid",
  "tags": [...],
  "outgoingLinks": [...],
  "backlinks": [...]
}
```

**错误**:
- 404: Note not found

---

### POST /api/notes

创建新笔记。

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "title": "笔记标题",
  "content": "笔记内容（Markdown）",
  "tags": ["标签 1", "标签 2"]
}
```

**响应**: 创建的笔记对象

**错误**:
- 400: Title is required

---

### PUT /api/notes/:id

更新笔记。

**路径参数**:
- `id` - 笔记 ID

**请求体**:
```json
{
  "title": "新标题",
  "content": "新内容",
  "tags": ["新标签"]
}
```

**响应**: 更新后的笔记对象

**错误**:
- 404: Note not found

---

### DELETE /api/notes/:id

删除笔记。

**路径参数**:
- `id` - 笔记 ID

**响应**: 204 No Content

**错误**:
- 404: Note not found

---

## 标签管理

所有标签 API 需要认证。

### GET /api/tags

获取所有标签（含当前用户的笔记数量）。

**响应**:
```json
[
  {
    "id": "uuid",
    "name": "标签名",
    "color": "#ff0000",
    "created_at": 1711360200000,
    "noteCount": 5
  }
]
```

---

### GET /api/tags/:id

获取标签详情及关联笔记（当前用户的笔记）。

**响应**:
```json
{
  "id": "uuid",
  "name": "标签名",
  "color": "#ff0000",
  "created_at": 1711360200000,
  "notes": [...]
}
```

---

### POST /api/tags

创建新标签。

**请求体**:
```json
{
  "name": "标签名",
  "color": "#ff0000"
}
```

**响应**: 创建的标签对象

**错误**:
- 400: Tag name is required
- 409: Tag already exists

---

### PUT /api/tags/:id

更新标签。

**请求体**:
```json
{
  "name": "新标签名",
  "color": "#00ff00"
}
```

**响应**: 更新后的标签对象

---

### DELETE /api/tags/:id

删除标签。

**响应**: 204 No Content

---

## 搜索

所有搜索 API 需要认证。

### GET /api/search

搜索当前用户的笔记。

**查询参数**:
- `q` - 搜索关键词（可选，支持标题和内容匹配）
- `tag` - 按标签筛选（可选）

**请求示例**:
```
GET /api/search?q=知识管理
GET /api/search?tag=技术
GET /api/search?q=笔记&tag=个人
```

**响应**:
```json
[
  {
    "id": "uuid",
    "title": "匹配笔记",
    "content": "...",
    "created_at": 1711360200000,
    "updated_at": 1711360200000
  }
]
```

**错误**:
- 400: Search query (q) or tag is required

---

## 文件管理

所有文件 API 需要认证。

### POST /api/files/upload

上传文件到指定笔记。

**请求头**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求体** (multipart/form-data):
- `file` - 文件（必填）
- `noteId` - 关联的笔记 ID（必填）

**允许的文件类型**:
- 图片：JPEG, PNG, GIF, WebP
- 文档：PDF

**文件大小限制**: 10MB

**响应** (201):
```json
{
  "id": "uuid",
  "filename": "uuid.png",
  "originalName": "my-image.png",
  "mimeType": "image/png",
  "size": 102400,
  "url": "/api/files/uuid",
  "createdAt": 1711360200000
}
```

**错误**:
- 400: File is required / noteId is required / File type not allowed / File size exceeds limit
- 404: Note not found or access denied

---

### GET /api/files/:id

获取/下载文件。

**请求头**:
```
Authorization: Bearer <token>
```

**响应**: 文件内容（二进制）

**错误**:
- 404: File not found / File not found on disk

---

### GET /api/files/note/:noteId

获取笔记的所有附件。

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `noteId` - 笔记 ID

**响应**:
```json
[
  {
    "id": "uuid",
    "filename": "uuid.png",
    "originalName": "my-image.png",
    "mimeType": "image/png",
    "size": 102400,
    "url": "/api/files/uuid",
    "createdAt": 1711360200000
  }
]
```

---

### DELETE /api/files/:id

删除文件。

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `id` - 文件 ID

**响应**: 204 No Content

**错误**:
- 404: File not found or access denied

---

## 版本历史

所有版本 API 需要认证。

### GET /api/versions/notes/:noteId

获取笔记的所有历史版本（按版本号倒序）。

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `noteId` - 笔记 ID

**响应**:
```json
[
  {
    "id": "version-uuid",
    "note_id": "note-uuid",
    "title": "版本标题",
    "content": "版本内容",
    "version_number": 5,
    "created_at": 1711360200000,
    "created_by": "user-uuid"
  }
]
```

**错误**:
- 404: Note not found or access denied

---

### GET /api/versions/:versionId

获取特定版本详情。

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `versionId` - 版本 ID

**响应**:
```json
{
  "id": "version-uuid",
  "note_id": "note-uuid",
  "title": "版本标题",
  "content": "版本内容",
  "version_number": 3,
  "created_at": 1711360200000,
  "created_by": "user-uuid"
}
```

**错误**:
- 404: Version not found
- 403: Access denied to this version

---

### POST /api/versions/:versionId/restore

恢复笔记到指定历史版本。

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**路径参数**:
- `versionId` - 版本 ID

**请求体**:
```json
{
  "noteId": "note-uuid"
}
```

**响应**:
```json
{
  "success": true
}
```

**错误**:
- 400: noteId required / Version does not belong to the specified note
- 404: Version not found / Note not found or access denied

---

## 错误响应

所有 API 错误返回统一格式：

```json
{
  "error": "错误描述信息"
}
```

**常见状态码**:
- `200` - 成功
- `201` - 创建成功
- `204` - 删除成功
- `400` - 请求参数错误
- `401` - 未认证（缺少 token 或 token 无效）
- `403` - 禁止访问
- `404` - 资源不存在
- `409` - 资源冲突（如标签/邮箱已存在）
- `500` - 服务器内部错误

---

## 安全说明

1. **所有 API 需要认证**（除注册/登录外）
2. **用户数据隔离**: 每个用户只能访问自己的笔记、标签、文件
3. **Token 有效期**: 15 分钟
4. **密码加密**: bcrypt (salt rounds=10)
5. **邮箱唯一性**: 同一邮箱只能注册一次
6. **文件上传安全**:
   - 文件类型白名单（图片 + PDF）
   - 文件大小限制：10MB
   - UUID 文件名（防止路径遍历）
   - 文件与笔记关联，继承笔记的访问控制

---

*尚书省 工部*  
*2026-03-31*
