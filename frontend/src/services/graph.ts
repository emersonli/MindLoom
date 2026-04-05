export interface GraphNode {
  id: string;
  title: string;
  group: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export class GraphService {
  /**
   * Build graph data from notes list
   */
  static buildGraphData(notes: Array<{ id: string; title: string; content: string }>): GraphData {
    const nodes: GraphNode[] = notes.map((note, index) => ({
      id: note.id,
      title: note.title,
      group: (index % 5) + 1, // Assign groups for coloring
    }));

    const links: GraphLink[] = [];
    const titleToId = new Map(notes.map(n => [n.title.toLowerCase(), n.id]));

    // Parse bidirectional links ([[Note Title]])
    notes.forEach(note => {
      const linkPattern = /\[\[(.*?)\]\]/g;
      let match;
      while ((match = linkPattern.exec(note.content)) !== null) {
        const targetTitle = match[1].toLowerCase();
        const targetId = titleToId.get(targetTitle);
        if (targetId && targetId !== note.id) {
          // Avoid duplicate links
          const exists = links.some(
            l => (l.source === note.id && l.target === targetId) ||
                 (l.source === targetId && l.target === note.id)
          );
          if (!exists) {
            links.push({
              source: note.id,
              target: targetId,
            });
          }
        }
      }
    });

    return { nodes, links };
  }

  /**
   * Get node color by group
   */
  static getNodeColor(group: number): string {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    return colors[(group - 1) % colors.length];
  }
}
