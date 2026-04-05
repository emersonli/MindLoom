import React, { useState } from 'react';
import { defaultShortcuts, formatShortcut, ShortcutConfig } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  customShortcuts?: ShortcutConfig[];
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ customShortcuts }) => {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = customShortcuts || defaultShortcuts;

  // Group shortcuts by category
  const grouped = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'global';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutConfig[]>);

  const categoryNames: Record<string, string> = {
    global: '🌐 全局',
    editor: '✏️ 编辑器',
    navigation: '🧭 导航',
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="shortcuts-help-button"
        data-testid="shortcuts-help-button"
        style={{
          padding: '6px 12px',
          background: 'transparent',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          color: 'var(--text-secondary)',
          fontSize: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-color)';
          e.currentTarget.style.color = 'var(--accent-color)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
        title="查看快捷键 (Ctrl/Cmd + ?)"
      >
        ⌨️ 快捷键
      </button>

      {isOpen && (
        <div
          className="shortcuts-modal"
          data-testid="shortcuts-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Overlay */}
          <div
            className="modal-overlay"
            onClick={() => setIsOpen(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              animation: 'fadeIn 0.2s ease-out',
            }}
          />
          
          {/* Modal Content */}
          <div
            className="modal-content"
            style={{
              position: 'relative',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '24px',
              minWidth: '400px',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              animation: 'slideIn 0.2s ease-out',
              zIndex: 1001,
            }}
          >
            {/* Header */}
            <div
              className="modal-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>
                ⌨️ 快捷键
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '4px 8px',
                }}
                aria-label="关闭快捷键帮助"
              >
                ✕
              </button>
            </div>

            {/* Shortcuts List by Category */}
            <div className="shortcuts-list" data-testid="shortcuts-list">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category} style={{ marginBottom: '20px' }}>
                  <h4
                    style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      fontWeight: '600',
                    }}
                  >
                    {categoryNames[category] || category}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {items.map((shortcut, index) => (
                      <div
                        key={index}
                        className="shortcut-item"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          backgroundColor: 'var(--bg-tertiary)',
                          borderRadius: '6px',
                        }}
                      >
                        <span
                          className="shortcut-description"
                          style={{
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                          }}
                        >
                          {shortcut.description}
                        </span>
                        <kbd
                          className="shortcut-keys"
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'var(--bg-secondary)',
                            border: `1px solid var(--border-color)`,
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {formatShortcut(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: `1px solid var(--border-color)`,
                fontSize: '12px',
                color: 'var(--text-secondary)',
                textAlign: 'center',
              }}
            >
              按 <kbd style={{ padding: '2px 6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }}>Ctrl/Cmd + ?</kbd> 随时打开此帮助
            </div>
          </div>
        </div>
      )}
    </>
  );
};
