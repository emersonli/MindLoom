import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';

// Placeholder extension configuration
const PlaceholderExtension = Placeholder.configure({
  placeholder: '开始输入笔记内容...',
});

// Character count configuration
const CharacterCountExtension = CharacterCount.configure();

// Custom extensions configuration
export const getDefaultExtensions = () => [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
    codeBlock: {
      HTMLAttributes: {
        class: 'bg-gray-100 p-4 rounded-lg font-mono text-sm',
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: 'border-l-4 border-gray-300 pl-4 italic',
      },
    },
  }),
  PlaceholderExtension,
  CharacterCountExtension,
];

// Editor options type
export interface EditorOptions {
  content?: string;
  placeholder?: string;
  characterLimit?: number;
  autofocus?: boolean;
  editable?: boolean;
}

// Create editor with custom options
export const createEditor = (options: EditorOptions = {}) => {
  const {
    content = '',
    characterLimit,
    autofocus = false,
    editable = true,
  } = options;

  return {
    extensions: getDefaultExtensions(),
    content,
    autofocus,
    editable,
    ...(characterLimit && {
      characterCount: {
        limit: characterLimit,
      },
    }),
  };
};

export default {
  getDefaultExtensions,
  createEditor,
};
