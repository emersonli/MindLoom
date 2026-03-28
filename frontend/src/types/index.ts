export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
  tags?: string[];
  encrypted?: boolean;
  checksum?: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  created_at: number;
  noteCount?: number;
}

export interface SearchResult {
  notes: Note[];
  total: number;
}