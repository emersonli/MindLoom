import React, { useState, useEffect } from 'react';
import { NoteVersion, versionsApi } from '../utils/api';
import { useUIStore } from '../stores/uiStore';

interface VersionHistoryProps {
  noteId: string;
  currentVersionNumber?: number;
  onRestore: (versionId: string, version: NoteVersion) => void;
  onClose: () => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  noteId,
  currentVersionNumber,
  onRestore,
  onClose,
}) => {
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);
  const { showNotification } = useUIStore();

  useEffect(() => {
    const loadVersions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await versionsApi.getVersions(noteId);
        if (response.data) {
          setVersions(response.data);
        } else {
          setError('无法加载版本历史');
        }
      } catch (err: any) {
        console.error('Failed to load versions:', err);
        setError(err.message || '加载版本历史失败');
        showNotification('加载版本历史失败', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, [noteId, showNotification]);

  const handleRestore = async (version: NoteVersion) => {
    // Use custom confirm dialog with keyboard support
    const confirmed = window.confirm(`确定要恢复到版本 v${version.version_number}？\n\n此操作将覆盖当前笔记内容。\n\n按 Enter 确认，Esc 取消`);
    if (!confirmed) {
      return;
    }

    try {
      await versionsApi.restoreVersion(version.id, noteId);
      showNotification(`已恢复到版本 v${version.version_number}`, 'success');
      onRestore(version.id, version);
    } catch (err: any) {
      console.error('Failed to restore version:', err);
      showNotification(err.message || '恢复版本失败', 'error');
    }
  };

  const handlePreview = (version: NoteVersion) => {
    setSelectedVersion(version);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="version-history-panel"
      data-testid="version-history-panel"
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        width: '400px',
        height: '100vh',
        backgroundColor: 'var(--bg-secondary)',
        borderLeft: `1px solid var(--border-color)`,
        boxShadow: '-4px 0 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        className="version-history-header"
        style={{
          padding: '16px',
          borderBottom: `1px solid var(--border-color)`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>
          📜 版本历史
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            padding: '4px 8px',
          }}
          aria-label="关闭版本历史"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div
        className="version-history-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}
      >
        {loading ? (
          <div
            className="loading"
            style={{
              textAlign: 'center',
              padding: '32px',
              color: 'var(--text-secondary)',
            }}
          >
            加载中...
          </div>
        ) : error ? (
          <div
            className="error"
            style={{
              padding: '16px',
              backgroundColor: 'var(--error-color)',
              color: '#fff',
              borderRadius: '6px',
              marginBottom: '16px',
            }}
          >
            ⚠️ {error}
          </div>
        ) : versions.length === 0 ? (
          <div
            className="empty"
            style={{
              textAlign: 'center',
              padding: '32px',
              color: 'var(--text-secondary)',
            }}
          >
            暂无版本历史
          </div>
        ) : (
          <div className="versions-list" data-testid="versions-list">
            {versions.map((version) => {
              const isCurrentVersion =
                currentVersionNumber && version.version_number === currentVersionNumber;
              const isSelected = selectedVersion?.id === version.id;

              return (
                <div
                  key={version.id}
                  className="version-item"
                  data-testid={`version-${version.id}`}
                  onClick={() => handlePreview(version)}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    borderRadius: '6px',
                    border: `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-color)'}`,
                    backgroundColor: isSelected
                      ? 'var(--bg-tertiary)'
                      : isCurrentVersion
                      ? 'var(--success-color)20'
                      : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    className="version-info"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      className="version-number"
                      style={{
                        fontWeight: 'bold',
                        color: 'var(--accent-color)',
                        fontSize: '14px',
                      }}
                    >
                      v{version.version_number}
                    </span>
                    {isCurrentVersion && (
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--success-color)',
                          fontWeight: '500',
                        }}
                      >
                        当前版本
                      </span>
                    )}
                  </div>
                  <div
                    className="version-title"
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={version.title}
                  >
                    {version.title}
                  </div>
                  <div
                    className="version-date"
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {formatDate(version.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Footer */}
      {selectedVersion && (
        <div
          className="version-preview-footer"
          style={{
            padding: '16px',
            borderTop: `1px solid var(--border-color)`,
            backgroundColor: 'var(--bg-tertiary)',
            display: 'flex',
            gap: '8px',
          }}
        >
          <button
            onClick={() => handleRestore(selectedVersion)}
            className="restore-button"
            data-testid="restore-version-button"
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: 'var(--accent-color)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'background-color 0.2s',
            }}
          >
            恢复此版本
          </button>
          <button
            onClick={() => setSelectedVersion(null)}
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: `1px solid var(--border-color)`,
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
};
