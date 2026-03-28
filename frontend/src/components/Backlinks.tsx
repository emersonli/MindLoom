import { Note } from '../types';
import { findBacklinks } from '../utils/links';

interface BacklinksProps {
  currentNote: Note | null;
  allNotes: Note[];
  onNavigate: (noteId: string) => void;
}

export default function Backlinks({ currentNote, allNotes, onNavigate }: BacklinksProps) {
  if (!currentNote) {
    return null;
  }

  // Find all notes that link to the current note
  const backlinks = findBacklinks(allNotes, currentNote.title);

  if (backlinks.length === 0) {
    return (
      <div className="mt-4 p-3 bg-gray-800 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">
          🔗 反向链接
        </h3>
        <p className="text-xs text-gray-500">
          暂无其他笔记链接到这篇笔记
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 bg-gray-800 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-400 mb-2">
        🔗 反向链接 ({backlinks.length})
      </h3>
      <div className="space-y-2">
        {backlinks.map(note => (
          <button
            key={note.id}
            onClick={() => onNavigate(note.id)}
            className="w-full text-left p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            <div className="font-medium text-sm text-blue-400 hover:text-blue-300">
              {note.title}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(note.updated_at).toLocaleDateString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}