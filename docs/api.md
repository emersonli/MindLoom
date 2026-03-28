# PKMS API 文档

**版本**: v0.1.0  
**基础路径**: `/api`

---

## 健康检查

### GET /health

检查服务状态。

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2026-03-25T10:30:00.000Z"
}
```

---

## 笔记管理

### GET /api/notes

获取所有笔记列表。

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
    "checksum": null
  }
]
```

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
  "tags": [...],
  "outgoingLinks": [...],
  "backlinks": [...]
}
```

### POST /api/notes

创建新笔记。

**请求体**:
```json
{
  "title": "笔记标题",
  "content": "笔记内容（Markdown）",
  "tags": ["标签 1", "标签 2"]
}
```

**响应**: 创建的笔记对象

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

### DELETE /api/notes/:id

删除笔记。

**路径参数**:
- `id` - 笔记 ID

**响应**: 204 No Content

---

## 标签管理

### GET /api/tags

获取所有标签（含笔记数量）。

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

### GET /api/tags/:id

获取标签详情及关联笔记。

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

### DELETE /api/tags/:id

删除标签。

**响应**: 204 No Content

---

## 搜索

### GET /api/search

搜索笔记。

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
- `404` - 资源不存在
- `409` - 资源冲突（如标签已存在）
- `500` - 服务器内部错误

---

*尚书省 工部*  
*2026-03-25*
