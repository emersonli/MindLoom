import React from 'react';
import { KnowledgeGraph } from '../components/KnowledgeGraph';
import { useNotesStore } from '../stores/notesStore';

interface GraphViewProps {
  onNavigateToNote?: (noteId: string) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({ onNavigateToNote }) => {
  const { notes } = useNotesStore();

  const handleNodeClick = (noteId: string) => {
    if (onNavigateToNote) {
      onNavigateToNote(noteId);
    }
  };

  return (
    <div
      className="graph-view-page"
      style={{
        padding: '16px',
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh',
      }}
    >
      <KnowledgeGraph notes={notes} onNodeClick={handleNodeClick} />
    </div>
  );
};
