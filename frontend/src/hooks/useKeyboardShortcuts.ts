import { useEffect } from 'react';

export interface ShortcutConfig {
  key: string;
  modifiers?: ('ctrl' | 'meta' | 'shift' | 'alt')[];
  handler: () => void;
  description: string;
  category?: 'global' | 'editor' | 'navigation';
}

/**
 * Hook for registering keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts when typing in input/textarea
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      for (const shortcut of shortcuts) {
        // Check modifiers
        const matchesModifiers = !shortcut.modifiers || (
          (!shortcut.modifiers.includes('ctrl') || event.ctrlKey) &&
          (!shortcut.modifiers.includes('meta') || event.metaKey) &&
          (!shortcut.modifiers.includes('shift') || event.shiftKey) &&
          (!shortcut.modifiers.includes('alt') || event.altKey)
        );

        // Check key
        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (matchesModifiers && matchesKey) {
          // Prevent default for non-input contexts or when explicitly handling
          if (!isInput || shortcut.category !== 'editor') {
            event.preventDefault();
          }
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * Default application shortcuts
 */
export const defaultShortcuts: ShortcutConfig[] = [
  {
    key: 's',
    modifiers: ['ctrl', 'meta'],
    handler: () => {}, // Will be overridden
    description: '保存笔记',
    category: 'global',
  },
  {
    key: 'n',
    modifiers: ['ctrl', 'meta'],
    handler: () => {},
    description: '新建笔记',
    category: 'global',
  },
  {
    key: 'f',
    modifiers: ['ctrl', 'meta'],
    handler: () => {},
    description: '搜索笔记',
    category: 'global',
  },
  {
    key: 'p',
    modifiers: ['ctrl', 'meta'],
    handler: () => {},
    description: '导出笔记',
    category: 'global',
  },
  {
    key: 'h',
    modifiers: ['ctrl', 'meta'],
    handler: () => {},
    description: '版本历史',
    category: 'global',
  },
  {
    key: 'g',
    modifiers: ['ctrl', 'meta'],
    handler: () => {},
    description: '知识图谱',
    category: 'global',
  },
  {
    key: 'd',
    modifiers: ['ctrl', 'meta'],
    handler: () => {},
    description: '每日笔记',
    category: 'global',
  },
  {
    key: '/',
    modifiers: ['ctrl', 'meta'],
    handler: () => {},
    description: '切换侧边栏',
    category: 'navigation',
  },
  {
    key: '?',
    modifiers: ['ctrl', 'meta'],
    handler: () => {},
    description: '快捷键帮助',
    category: 'global',
  },
  // Editor shortcuts
  {
    key: 'b',
    modifiers: ['ctrl', 'meta'],
    handler: () => {},
    description: '加粗选中文本',
    category: 'editor',
  },
  {
    key: 'i',
    modifiers: ['ctrl', 'meta'],
    handler: () => {},
    description: '斜体选中文本',
    category: 'editor',
  },
  {
    key: 'k',
    modifiers: ['ctrl', 'meta'],
    handler: () => {},
    description: '插入链接',
    category: 'editor',
  },
  {
    key: '1',
    modifiers: ['ctrl', 'meta'],
    handler: () => {},
    description: '一级标题',
    category: 'editor',
  },
  {
    key: '2',
    modifiers: ['ctrl', 'meta'],
    handler: () => {},
    description: '二级标题',
    category: 'editor',
  },
  {
    key: '3',
    modifiers: ['ctrl', 'meta'],
    handler: () => {},
    description: '三级标题',
    category: 'editor',
  },
];

/**
 * Get modifier display string
 */
export function getModifierDisplay(modifiers?: string[]): string {
  if (!modifiers || modifiers.length === 0) return '';
  
  const map: Record<string, string> = {
    ctrl: 'Ctrl',
    meta: 'Cmd',
    shift: 'Shift',
    alt: 'Alt',
  };
  
  return modifiers
    .map(m => map[m] || m)
    .join(' + ');
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: ShortcutConfig): string {
  const modifiers = getModifierDisplay(shortcut.modifiers);
  const key = shortcut.key.toUpperCase();
  return modifiers ? `${modifiers} + ${key}` : key;
}
