import { useState } from 'react';
import { Note } from '../types';
import NoteItem from './NoteItem';

interface NoteListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onCreateNote: (title: string) => void;
}

export default function NoteList({
  notes,
  selectedNote,
  onSelectNote,
  onDeleteNote,
  onCreateNote,
}: NoteListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    );
  });

  // Sort notes by updated_at (newest first)
  const sortedNotes = [...filteredNotes].sort((a, b) => b.updated_at - a.updated_at);

  // Handle create new note
  const handleCreate = () => {
    if (!newNoteTitle.trim()) return;
    onCreateNote(newNoteTitle);
    setNewNoteTitle('');
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Search */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">📚 笔记列表</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
            title="新建笔记"
          >
            + 新建
          </button>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索笔记..."
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* New Note Input */}
      {isCreating && (
        <div className="p-3 border-b border-gray-700 bg-gray-800">
          <input
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="笔记标题..."
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm mb-2 focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
            >
              创建
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewNoteTitle('');
              }}
              className="flex-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded text-sm transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sortedNotes.length > 0 ? (
          sortedNotes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              isSelected={selectedNote?.id === note.id}
              onSelect={onSelectNote}
              onDelete={onDeleteNote}
            />
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            {searchQuery ? (
              <p>没有找到匹配的笔记</p>
            ) : (
              <>
                <p className="mb-2">暂无笔记</p>
                <p className="text-sm">点击"新建"创建第一篇笔记</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-2 border-t border-gray-700 text-xs text-gray-500 text-center">
        共 {notes.length} 篇笔记
        {searchQuery && ` · 筛选 ${sortedNotes.length} 篇`}
      </div>
    </div>
  );
}