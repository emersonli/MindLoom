import { useState } from 'react';
import { Note } from '../types';
import { exportAsMarkdown, exportAsHtml, exportAsPdf, exportAsZip } from '../utils/export';

interface ExportMenuProps {
  note?: Note;
  notes?: Note[];
  onExport?: (format: string) => void;
}

export default function ExportMenu({ note, notes, onExport }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'md' | 'html' | 'pdf' | 'zip') => {
    if (!note && format !== 'zip') return;
    
    setIsExporting(true);
    setIsOpen(false);
    
    try {
      switch (format) {
        case 'md':
          if (note) exportAsMarkdown(note);
          break;
        case 'html':
          if (note) exportAsHtml(note);
          break;
        case 'pdf':
          if (note) exportAsPdf(note);
          break;
        case 'zip':
          if (notes && notes.length > 0) {
            await exportAsZip(notes);
          }
          break;
      }
      
      onExport?.(format);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      {/* Export Button */}
      <button
        data-testid="export-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
        title="导出笔记"
      >
        {isExporting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>导出中...</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>导出</span>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            <div className="py-1">
              <button
                data-testid="export-md"
                onClick={() => handleExport('md')}
                disabled={!note || isExporting}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                <span className="text-lg">📝</span>
                <div>
                  <div className="font-medium">Markdown</div>
                  <div className="text-xs text-gray-500">.md 格式</div>
                </div>
              </button>
              
              <button
                data-testid="export-html"
                onClick={() => handleExport('html')}
                disabled={!note || isExporting}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                <span className="text-lg">🌐</span>
                <div>
                  <div className="font-medium">HTML</div>
                  <div className="text-xs text-gray-500">网页格式</div>
                </div>
              </button>
              
              <button
                data-testid="export-pdf"
                onClick={() => handleExport('pdf')}
                disabled={!note || isExporting}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                <span className="text-lg">📄</span>
                <div>
                  <div className="font-medium">PDF</div>
                  <div className="text-xs text-gray-500">打印格式</div>
                </div>
              </button>
              
              {notes && notes.length > 1 && (
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              )}
              
              {notes && notes.length > 1 && (
                <button
                  data-testid="export-zip"
                  onClick={() => handleExport('zip')}
                  disabled={isExporting}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  <span className="text-lg">📦</span>
                  <div>
                    <div className="font-medium">批量导出</div>
                    <div className="text-xs text-gray-500">{notes.length} 篇笔记</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
