import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect } from 'react';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  noteId?: string;
  onOpenVersionHistory?: () => void;
}

export default function MarkdownEditor({ content, onChange, placeholder = '开始输入笔记内容...' }: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure(),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) {
    return <div className="text-gray-500">编辑器加载中...</div>;
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div data-testid="editor-toolbar" className="flex flex-wrap gap-1 p-2 bg-gray-100 border-b border-gray-300">
        <button
          data-testid="editor-bold-button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('bold') ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
          title="粗体"
        >
          <strong>B</strong>
        </button>
        <button
          data-testid="editor-italic-button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('italic') ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
          title="斜体"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('strike') ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
          title="删除线"
        >
          <s>S</s>
        </button>
        
        <span className="w-px h-6 bg-gray-300 mx-1"></span>
        
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
          title="标题 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
          title="标题 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
          title="标题 3"
        >
          H3
        </button>
        
        <span className="w-px h-6 bg-gray-300 mx-1"></span>
        
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('bulletList') ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
          title="无序列表"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('orderedList') ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
          title="有序列表"
        >
          1.
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('blockquote') ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
          title="引用"
        >
          "
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive('code') ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
          title="代码"
        >
          {'</>'}
        </button>
        
        <span className="w-px h-6 bg-gray-300 mx-1"></span>
        
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="px-2 py-1 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
          title="撤销"
        >
          ↩
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="px-2 py-1 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
          title="重做"
        >
          ↪
        </button>
        
        {onOpenVersionHistory && (
          <>
            <span className="w-px h-6 bg-gray-300 mx-1"></span>
            <button
              onClick={onOpenVersionHistory}
              className="px-2 py-1 rounded text-sm hover:bg-gray-200"
              title="查看版本历史"
              data-testid="version-history-button"
            >
              📜 历史
            </button>
          </>
        )}
      </div>
      
      {/* Editor Content */}
      <div data-testid="note-content-editor">
        <EditorContent editor={editor} className="min-h-[300px]" />
      </div>
      
      {/* Character Count */}
      <div className="p-2 bg-gray-50 border-t border-gray-300 text-xs text-gray-500">
        字数：{editor.storage.characterCount?.characters() || editor.getText().length}
      </div>
    </div>
  );
}
