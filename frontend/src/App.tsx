import { useState, useEffect, useMemo } from 'react';
import { Note } from './types';
import MarkdownEditor from './components/MarkdownEditor';
import NoteList from './components/NoteList';
import Backlinks from './components/Backlinks';
import SearchResults from './components/SearchResults';
import { searchService } from './services/search';

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{note: Note; highlights: string[]}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Mock initial notes with bidirectional links
  useEffect(() => {
    const mockNotes: Note[] = [
      {
        id: '1',
        title: '欢迎使用 PKMS',
        content: '<h1>欢迎使用个人知识管理系统</h1><p>这是您的第一篇笔记。使用 [[双向链接]] 功能来关联笔记。</p><p>查看 [[功能说明]] 了解更多。</p>',
        created_at: Date.now() - 86400000,
        updated_at: Date.now() - 86400000,
      },
      {
        id: '2',
        title: '功能说明',
        content: '<h2>主要功能</h2><ul><li>📝 笔记管理</li><li>🏷️ 标签系统</li><li>🔗 双向链接 - 关联 [[欢迎使用 PKMS]]</li><li>🔍 全文搜索</li></ul>',
        created_at: Date.now() - 43200000,
        updated_at: Date.now() - 43200000,
      },
      {
        id: '3',
        title: '双向链接',
        content: '<h2>双向链接说明</h2><p>使用 [[wiki 语法]] 可以创建笔记间的链接。查看 [[欢迎使用 PKMS]] 获得帮助。</p>',
        created_at: Date.now() - 21600000,
        updated_at: Date.now() - 21600000,
      },
    ];
    setNotes(mockNotes);
    
    // Initialize search index
    searchService.init(mockNotes);
  }, []);

  // Re-index when notes change
  useEffect(() => {
    if (notes.length > 0) {
      searchService.init(notes);
    }
  }, [notes]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearchMode(false);
      return;
    }

    setIsSearching(true);
    setIsSearchMode(true);
    
    // Perform search with highlights
    const results = searchService.searchWithHighlights(query);
    setSearchResults(results);
    setIsSearching(false);
  };

  // Handle note content change
  const handleContentChange = (content: string) => {
    if (selectedNote) {
      const updatedNote = {
        ...selectedNote,
        content,
        updated_at: Date.now(),
      };
      setSelectedNote(updatedNote);
      setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
      
      // Update search index
      searchService.updateNote(updatedNote);
    }
  };

  // Handle create new note
  const handleCreateNote = (title: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content: '<p>使用 [[wiki 语法]] 创建链接，例如：[[笔记标题]]</p>',
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    setIsSearchMode(false);
    setSearchQuery('');
    
    // Add to search index
    searchService.addNote(newNote);
  };

  // Handle delete note
  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
    
    // Remove from search index
    searchService.removeNote(id);
  };

  // Handle navigate to linked note
  const handleNavigate = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setSelectedNote(note);
      setIsSearchMode(false);
      setSearchQuery('');
    }
  };

  // Handle select search result
  const handleSelectSearchResult = (note: Note) => {
    setSelectedNote(note);
    setIsSearchMode(false);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">📚 个人知识管理系统</h1>
          <p className="text-gray-400 text-sm">MVP v0.1.0 - Phase 2.2 | P0-4 全文搜索开发中</p>
          
          {/* Search Bar */}
          <div className="mt-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="🔍 搜索笔记... (输入关键词)"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setIsSearchMode(false); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-4">
          {/* Sidebar - Note List */}
          <aside className="col-span-1 bg-gray-800 rounded-lg overflow-hidden h-[calc(100vh-200px)]">
            {isSearchMode ? (
              <div className="p-3">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold">🔍 搜索结果</h2>
                  <button
                    onClick={() => { setIsSearchMode(false); setSearchQuery(''); }}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    返回笔记列表
                  </button>
                </div>
                <SearchResults
                  results={searchResults}
                  isSearching={isSearching}
                  searchQuery={searchQuery}
                  onSelectNote={handleSelectSearchResult}
                />
              </div>
            ) : (
              <NoteList
                notes={notes}
                selectedNote={selectedNote}
                onSelectNote={(note) => { setSelectedNote(note); setIsSearchMode(false); }}
                onDeleteNote={handleDeleteNote}
                onCreateNote={handleCreateNote}
              />
            )}
          </aside>
          
          {/* Main Content - Editor */}
          <section className="col-span-2 bg-gray-800 rounded-lg p-4">
            {selectedNote ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">{selectedNote.title}</h2>
                  <span className="text-xs text-gray-400">
                    最后更新: {new Date(selectedNote.updated_at).toLocaleString()}
                  </span>
                </div>
                <MarkdownEditor
                  content={selectedNote.content}
                  onChange={handleContentChange}
                  placeholder="开始输入笔记内容... 使用 [[笔记标题]] 创建链接"
                />
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p className="text-lg mb-2">选择一个笔记开始编辑</p>
                <p className="text-sm">或点击"新建"创建新笔记</p>
                <p className="text-sm mt-4">或在上方输入关键词搜索笔记</p>
              </div>
            )}
          </section>

          {/* Backlinks Panel */}
          <aside className="col-span-1">
            {selectedNote && (
              <Backlinks
                currentNote={selectedNote}
                allNotes={notes}
                onNavigate={handleNavigate}
              />
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;