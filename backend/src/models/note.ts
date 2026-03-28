export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
  encrypted: number;
  checksum: string | null;
}

export interface NoteWithTags extends Note {
  tags: Tag[];
  outgoingLinks: Note[];
  backlinks: Note[];
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  created_at: number;
}

export interface Link {
  id: string;
  source_note_id: string;
  target_note_id: string;
  created_at: number;
}

export interface CreateNoteDTO {
  title: string;
  content?: string;
  tags?: string[];
}

export interface UpdateNoteDTO {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface CreateTagDTO {
  name: string;
  color?: string;
}
