# PKMS 数据库设计文档

**版本**: v0.1.0  
**数据库**: SQLite 3  
**更新日期**: 2026-03-25

---

## 数据库概览

### ER 图

```
┌─────────────┐       ┌─────────────┐
│   notes     │       │    tags     │
├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │
│ title       │       │ name (UNQ)  │
│ content     │       │ color       │
│ created_at  │       │ created_at  │
│ updated_at  │       └─────────────┘
│ encrypted   │              │
│ checksum    │              │
└─────────────┘              │
        │                    │
        │  ┌──────────────┐  │
        └──│  note_tags   │──┘
           ├──────────────┤
           │ note_id (FK) │
           │ tag_id (FK)  │
           └──────────────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌─────────────┐   ┌─────────────┐
│   links     │   │   notes     │
├─────────────┤   │ (target)    │
│ id (PK)     │   └─────────────┘
│ source_id   │
│ target_id   │
│ created_at  │
└─────────────┘
```

---

## 数据表详细设计

### 1. notes（笔记表）

存储笔记核心数据。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID |
| title | TEXT | NOT NULL | 笔记标题 |
| content | TEXT | | 笔记内容（Markdown） |
| created_at | INTEGER | NOT NULL | 创建时间戳（毫秒） |
| updated_at | INTEGER | NOT NULL | 更新时间戳（毫秒） |
| encrypted | INTEGER | DEFAULT 0 | 是否加密（0=否，1=是） |
| checksum | TEXT | | 内容 SHA256 哈希（用于同步校验） |

**索引**:
- `idx_notes_title` - 标题索引（加速搜索）
- `idx_notes_created` - 创建时间索引（加速排序）

---

### 2. tags（标签表）

存储标签定义。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID |
| name | TEXT | UNIQUE NOT NULL | 标签名（小写存储） |
| color | TEXT | | 标签颜色（十六进制） |
| created_at | INTEGER | NOT NULL | 创建时间戳 |

**索引**:
- `idx_tags_name` - 标签名索引

---

### 3. note_tags（笔记 - 标签关联表）

多对多关系表。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| note_id | TEXT | PRIMARY KEY, FK | 关联笔记 ID |
| tag_id | TEXT | PRIMARY KEY, FK | 关联标签 ID |

**外键约束**:
- `note_id` → `notes(id)` ON DELETE CASCADE
- `tag_id` → `tags(id)` ON DELETE CASCADE

---

### 4. links（链接表）

存储笔记间的双向链接关系。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID |
| source_note_id | TEXT | NOT NULL, FK | 源笔记 ID（发出链接） |
| target_note_id | TEXT | NOT NULL, FK | 目标笔记 ID（被链接） |
| created_at | INTEGER | NOT NULL | 创建时间戳 |

**外键约束**:
- `source_note_id` → `notes(id)` ON DELETE CASCADE
- `target_note_id` → `notes(id)` ON DELETE CASCADE

**唯一约束**:
- `UNIQUE(source_note_id, target_note_id)` - 防止重复链接

**索引**:
- `idx_links_source` - 源笔记索引
- `idx_links_target` - 目标笔记索引

---

## 常用查询

### 获取笔记及其标签

```sql
SELECT n.*, GROUP_CONCAT(t.name) as tag_names
FROM notes n
LEFT JOIN note_tags nt ON n.id = nt.note_id
LEFT JOIN tags t ON nt.tag_id = t.id
WHERE n.id = ?
GROUP BY n.id;
```

### 获取笔记的反向链接

```sql
SELECT n.*
FROM notes n
JOIN links l ON n.id = l.source_note_id
WHERE l.target_note_id = ?
ORDER BY n.updated_at DESC;
```

### 按标签筛选笔记

```sql
SELECT n.*
FROM notes n
JOIN note_tags nt ON n.id = nt.note_id
JOIN tags t ON nt.tag_id = t.id
WHERE t.name = ?
ORDER BY n.updated_at DESC;
```

### 搜索笔记（标题或内容）

```sql
SELECT * FROM notes
WHERE title LIKE ? OR content LIKE ?
ORDER BY updated_at DESC;
```

---

*尚书省 工部*  
*2026-03-25*
