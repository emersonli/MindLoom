import { Note } from '../types';

interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: (note: Note) => void;
  onDelete: (id: string) => void;
}

export default function NoteItem({ note, isSelected, onSelect, onDelete }: NoteItemProps) {
  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString();
  };

  // Extract plain text from HTML content for preview
  const getPreview = (content: string) => {
    // Remove HTML tags and get plain text
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.length > 60 ? text.substring(0, 60) + '...' : text || '暂无内容';
  };

  return (
    <div
      data-testid={`note-item-${note.id}`}
      onClick={() => onSelect(note)}
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-blue-600 shadow-md'
          : 'bg-gray-700 hover:bg-gray-600'
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        {/* Note Title */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">
            {note.title || '无标题'}
          </h3>
          
          {/* Preview */}
          <p className={`text-xs mt-1 line-clamp-2 ${
            isSelected ? 'text-blue-200' : 'text-gray-400'
          }`}>
            {getPreview(note.content)}
          </p>
          
          {/* Timestamp */}
          <p className={`text-xs mt-1 ${
            isSelected ? 'text-blue-300' : 'text-gray-500'
          }`}>
            {formatDate(note.updated_at)}
          </p>
        </div>

        {/* Delete Button */}
        <button
          data-testid={`delete-note-button-${note.id}`}
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('确定要删除这篇笔记吗？')) {
              onDelete(note.id);
            }
          }}
          className={`p-1.5 rounded transition-colors ${
            isSelected
              ? 'text-blue-200 hover:bg-blue-700'
              : 'text-gray-500 hover:text-red-400 hover:bg-gray-600'
          }`}
          title="删除笔记"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}