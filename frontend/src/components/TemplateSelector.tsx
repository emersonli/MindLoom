import React from 'react';
import { NoteTemplate } from '../templates/dailyNote';

interface TemplateSelectorProps {
  templates: NoteTemplate[];
  onSelect: (template: NoteTemplate) => void;
  onClose: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  onSelect,
  onClose,
}) => {
  return (
    <div
      className="template-selector-modal"
      data-testid="template-selector"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        padding: '24px',
        minWidth: '400px',
        maxWidth: '600px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        border: `1px solid var(--border-color)`,
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
          📋 选择模板
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
          aria-label="关闭模板选择器"
        >
          ✕
        </button>
      </div>

      {/* Templates Grid */}
      <div
        className="templates-grid"
        data-testid="templates-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {templates.map((template) => (
          <div
            key={template.id}
            className="template-card"
            onClick={() => onSelect(template)}
            data-testid={`template-${template.id}`}
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-tertiary)',
              border: `1px solid var(--border-color)`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'border-color 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-color)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <h4
              style={{
                margin: '0 0 8px 0',
                fontSize: '16px',
                color: 'var(--text-primary)',
              }}
            >
              {template.name}
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: 'var(--text-secondary)',
              }}
            >
              {template.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
