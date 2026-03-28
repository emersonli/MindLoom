import { Note } from '../types';

interface SearchResultsProps {
  results: Array<{
    note: Note;
    highlights: string[];
  }>;
  isSearching: boolean;
  searchQuery: string;
  onSelectNote: (note: Note) => void;
}

export default function SearchResults({
  results,
  isSearching,
  searchQuery,
  onSelectNote,
}: SearchResultsProps) {
  if (isSearching) {
    return (
      <div className="p-4 text-center text-gray-400">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full mb-2"></div>
        <p className="text-sm">搜索中...</p>
      </div>
    );
  }

  if (!searchQuery) {
    return null;
  }

  if (results.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p className="text-lg mb-2">未找到相关笔记</p>
        <p className="text-sm">尝试使用不同的关键词</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-400 mb-3">
        找到 {results.length} 个相关笔记
      </div>
      
      {results.map(({ note, highlights }) => (
        <button
          key={note.id}
          onClick={() => onSelectNote(note)}
          className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          {/* Title */}
          <h3 className="font-medium text-blue-400 mb-1">
            {note.title}
          </h3>
          
          {/* Highlights */}
          {highlights.length > 0 ? (
            <div className="text-sm text-gray-300 space-y-1">
              {highlights.map((highlight, index) => (
                <p
                  key={index}
                  dangerouslySetInnerHTML={{ __html: highlight }}
                  className="line-clamp-2"
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 line-clamp-2">
              {note.content.replace(/<[^>]*>/g, ' ').substring(0, 100)}...
            </p>
          )}
          
          {/* Metadata */}
          <p className="text-xs text-gray-500 mt-2">
            更新时间: {new Date(note.updated_at).toLocaleString()}
          </p>
        </button>
      ))}
    </div>
  );
}