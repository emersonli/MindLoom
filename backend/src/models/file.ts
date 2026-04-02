export interface FileRecord {
  id: string;
  note_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  created_at: number;
}

export interface UploadFileDTO {
  note_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
}

// 允许的文件类型白名单
export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
];

// 允许的文件扩展名
export const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'
];

// 最大文件大小：10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
