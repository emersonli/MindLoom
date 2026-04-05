import { useState, useEffect } from 'react';
import { Note } from './types';
import { useNotesStore } from './stores/notesStore';
import { useUIStore } from './stores/uiStore';
import MarkdownEditor from './components/MarkdownEditor';
import NoteList from './components/NoteList';
import Backlinks from './components/Backlinks';
import SearchResults from './components/SearchResults';
import ExportMenu from './components/ExportMenu';
import { VersionHistory } from './components/VersionHistory';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { TemplateSelector } from './components/TemplateSelector';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { useKeyboardShortcuts, defaultShortcuts } from './hooks/useKeyboardShortcuts';
import { getAvailableTemplates, NoteTemplate } from './templates/dailyNote';
import { versionsApi, NoteVersion } from './utils/api';
import { searchService } from './services/search';

function App() {
  // Use Zustand stores
  const {
    notes,
    selectedNote,
    isLoading,
    error,
    fetchNotes,
    createNote: createNoteApi,
    updateNote: updateNoteApi,
    deleteNote: deleteNoteApi,
    setSelectedNote,
    clearError,
  } = useNotesStore();

  const {
    theme,
    toggleTheme,
    showNotification,
    notification,
  } = useUIStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{note: Note; highlights: string[]}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  // Version history state (P2-01)
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [currentVersionNumber, setCurrentVersionNumber] = useState<number | undefined>(undefined);
  
  // Knowledge Graph state (P2-02)
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState(false);
  
  // Template Selector state (P2-03)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templates] = useState<NoteTemplate[]>(getAvailableTemplates());
  
  // Keyboard Shortcuts state (P2-04)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Initialize: fetch notes on mount
  useEffect(() => {
    fetchNotes();
  }, []);
  
  // Register keyboard shortcuts (P2-04)
  const shortcuts = defaultShortcuts.map(s => ({
    ...s,
    handler: s.key === 'n' && s.modifiers?.includes('ctrl') ? handleCreateNoteShortcut :
             s.key === 's' && s.modifiers?.includes('ctrl') ? handleSaveShortcut :
             s.key === 'f' && s.modifiers?.includes('ctrl') ? handleSearchShortcut :
             s.key === 'h' && s.modifiers?.includes('ctrl') ? handleOpenVersionHistory :
             s.key === 'd' && s.modifiers?.includes('ctrl') ? handleCreateDailyNote :
             s.key === '/' && s.modifiers?.includes('ctrl') ? () => setShowKnowledgeGraph(!showKnowledgeGraph) :
             s.key === '?' && s.modifiers?.includes('ctrl') ? () => setShowShortcutsHelp(true) :
             s.handler,
  }));
  useKeyboardShortcuts(shortcuts);

  // Re-index search when notes change
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
      
      // Debounced save to API (could be improved with proper debouncing)
      updateNoteApi(selectedNote.id, { content, updated_at: updatedNote.updated_at });
      
      // Update search index
      searchService.updateNote(updatedNote);
    }
  };

  // Handle create new note
  const handleCreateNote = async (title: string) => {
    if (!title.trim()) return;
    
    const newNote = await createNoteApi(title, '<p>开始编写笔记内容...</p>');
    
    if (newNote) {
      searchService.addNote(newNote);
      showNotification('笔记创建成功', 'success');
    } else {
      showNotification('创建笔记失败', 'error');
    }
  };

  // Handle delete note
  const handleDeleteNote = async (id: string) => {
    if (!confirm('确定要删除这篇笔记吗？')) return;
    
    const success = await deleteNoteApi(id);
    
    if (success) {
      searchService.removeNote(id);
      showNotification('笔记已删除', 'success');
    } else {
      showNotification('删除笔记失败', 'error');
    }
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

  // Handle export
  const handleExport = (format: string) => {
    showNotification(`导出为 ${format.toUpperCase()} 成功`, 'success');
  };

  // Handle version history (P2-01)
  const handleOpenVersionHistory = () => {
    if (selectedNote) {
      setShowVersionHistory(true);
    }
  };

  // Handle keyboard shortcuts (P2-04)
  const handleCreateNoteShortcut = () => {
    const title = prompt('请输入笔记标题：');
    if (title) handleCreateNote(title);
  };
  
  const handleSaveShortcut = () => {
    if (selectedNote) {
      showNotification('笔记已保存', 'success');
    }
  };
  
  const handleSearchShortcut = () => {
    const searchInput = document.querySelector('input[placeholder*="搜索笔记"]') as HTMLInputElement;
    if (searchInput) searchInput.focus();
  };
  
  const handleCreateDailyNote = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const weekday = today.toLocaleDateString('zh-CN', { weekday: 'long' });
    const title = `${dateStr} ${weekday}`;
    
    const existingNote = notes.find(n => n.title === title);
    if (existingNote) {
      setSelectedNote(existingNote);
      showNotification('已打开今日笔记', 'success');
    } else {
      handleCreateNote(title);
      showNotification('每日笔记已创建', 'success');
    }
  };

  const handleCloseVersionHistory = () => {
    setShowVersionHistory(false);
  };

  const handleVersionRestore = async (versionId: string, version: NoteVersion) => {
    if (selectedNote) {
      // Update the selected note with restored content
      const restoredNote = {
        ...selectedNote,
        title: version.title,
        content: version.content,
        updated_at: Date.now(),
      };
      setSelectedNote(restoredNote);
      setCurrentVersionNumber(version.version_number);
      setShowVersionHistory(false);
      
      // Update search index
      searchService.updateNote(restoredNote);
      showNotification(`已恢复到版本 v${version.version_number}`, 'success');
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className="bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">📚 个人知识管理系统</h1>
              <p className="text-gray-400 text-sm">MindLoom PKMS v1.0</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              
              {/* Export Menu */}
              <ExportMenu
                note={selectedNote || undefined}
                notes={notes}
                onExport={handleExport}
              />
              
              {/* Knowledge Graph Button (P2-02) */}
              <button
                onClick={() => setShowKnowledgeGraph(!showKnowledgeGraph)}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                title="知识图谱 (Ctrl+/)"
              >
                🕸️
              </button>
              
              {/* Daily Note Button (P2-03) */}
              <button
                onClick={handleCreateDailyNote}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                title="每日笔记 (Ctrl+D)"
              >
                📅
              </button>
              
              {/* Template Selector Button (P2-03) */}
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                title="选择模板"
              >
                📋
              </button>
              
              {/* Keyboard Shortcuts Help Button (P2-04) */}
              <button
                onClick={() => setShowShortcutsHelp(true)}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                title="快捷键帮助 (Ctrl+?)"
              >
                ⌨️
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4">
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

      {/* Notification Toast */}
      {notification && notification.visible && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-green-600' :
              notification.type === 'error' ? 'bg-red-600' :
              notification.type === 'warning' ? 'bg-yellow-600' :
              'bg-blue-600'
            } text-white`}
          >
            {notification.message}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="container mx-auto px-4 py-2">
          <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-2 flex justify-between items-center">
            <span className="text-red-200 text-sm">⚠️ {error}</span>
            <button
              onClick={clearError}
              className="text-red-300 hover:text-white text-sm"
            >
              dismiss
            </button>
          </div>
        </div>
      )}
      
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
                isLoading={isLoading}
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
                    最后更新：{new Date(selectedNote.updated_at).toLocaleString()}
                  </span>
                </div>
                <MarkdownEditor
                  content={selectedNote.content}
                  onChange={handleContentChange}
                  placeholder="开始输入笔记内容... 使用 [[笔记标题]] 创建链接"
                  noteId={selectedNote.id}
                  onOpenVersionHistory={handleOpenVersionHistory}
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

      {/* Version History Panel (P2-01) */}
      {showVersionHistory && selectedNote && (
        <VersionHistory
          noteId={selectedNote.id}
          currentVersionNumber={currentVersionNumber}
          onRestore={handleVersionRestore}
          onClose={handleCloseVersionHistory}
        />
      )}
      
      {/* Knowledge Graph Modal (P2-02) */}
      {showKnowledgeGraph && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowKnowledgeGraph(false)}
        >
          <div
            className="bg-gray-800 rounded-lg w-full max-w-6xl h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">🕸️ 知识图谱</h2>
              <button
                onClick={() => setShowKnowledgeGraph(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="h-full">
              <KnowledgeGraph
                notes={notes}
                onNodeClick={(noteId) => {
                  const note = notes.find(n => n.id === noteId);
                  if (note) {
                    setSelectedNote(note);
                    setShowKnowledgeGraph(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Template Selector Modal (P2-03) */}
      {showTemplateSelector && (
        <TemplateSelector
          templates={templates}
          onSelect={(template) => {
            const title = prompt('请输入笔记标题：');
            if (title) {
              handleCreateNote(title);
              showNotification(`已选择模板：${template.name}`, 'success');
            }
            setShowTemplateSelector(false);
          }}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
      
      {/* Keyboard Shortcuts Help Modal (P2-04) */}
      {showShortcutsHelp && (
        <KeyboardShortcutsHelp
          shortcuts={shortcuts}
          onClose={() => setShowShortcutsHelp(false)}
        />
      )}
    </div>
  );
}

export default App;
