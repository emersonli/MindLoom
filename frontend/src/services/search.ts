import FlexSearch from 'flexsearch';
import { Note } from '../types';

class SearchService {
  private index: FlexSearch.Index | null = null;
  private notes: Map<string, Note> = new Map();

  /**
   * Initialize search index
   */
  init(notes: Note[]) {
    // Create new index with Chinese support
    this.index = new FlexSearch.Index({
      tokenize: 'forward',
      resolution: 9,
    });

    // Build index from notes
    this.notes.clear();
    notes.forEach(note => {
      this.notes.set(note.id, note);
      // Index title and content
      const searchText = `${note.title} ${this.stripHtml(note.content)}`;
      this.index?.add(note.id, searchText);
    });

    console.log(`Search index initialized with ${notes.length} notes`);
  }

  /**
   * Add a note to the index
   */
  addNote(note: Note) {
    this.notes.set(note.id, note);
    const searchText = `${note.title} ${this.stripHtml(note.content)}`;
    this.index?.add(note.id, searchText);
  }

  /**
   * Update a note in the index
   */
  updateNote(note: Note) {
    this.removeNote(note.id);
    this.addNote(note);
  }

  /**
   * Remove a note from the index
   */
  removeNote(id: string) {
    this.notes.delete(id);
    this.index?.remove(id);
  }

  /**
   * Search notes by query
   */
  search(query: string, limit: number = 20): Note[] {
    if (!this.index || !query.trim()) {
      return [];
    }

    // Perform search
    const results = this.index.search(query, {
      limit,
      enrich: true,
    });

    // Map results to Note objects
    const matchedNotes: Note[] = [];
    results.forEach((result: any) => {
      const note = this.notes.get(result.id);
      if (note) {
        matchedNotes.push(note);
      }
    });

    return matchedNotes;
  }

  /**
   * Search with highlighted snippets
   */
  searchWithHighlights(query: string, limit: number = 20): Array<{
    note: Note;
    highlights: string[];
  }> {
    const results = this.search(query, limit);
    
    return results.map(note => {
      const highlights = this.generateHighlights(note, query);
      return { note, highlights };
    });
  }

  /**
   * Generate highlight snippets for search results
   */
  private generateHighlights(note: Note, query: string): string[] {
    const highlights: string[] = [];
    const plainContent = this.stripHtml(note.content);
    const queryLower = query.toLowerCase();
    const contentLower = plainContent.toLowerCase();
    
    // Find all occurrences of the query
    let index = contentLower.indexOf(queryLower);
    while (index !== -1) {
      // Extract snippet around the match
      const start = Math.max(0, index - 30);
      const end = Math.min(plainContent.length, index + query.length + 30);
      let snippet = plainContent.substring(start, end);
      
      // Add ellipsis if truncated
      if (start > 0) snippet = '...' + snippet;
      if (end < plainContent.length) snippet = snippet + '...';
      
      // Highlight the match
      const highlight = snippet.replace(
        new RegExp(`(${query})`, 'gi'),
        '<mark>$1</mark>'
      );
      
      highlights.push(highlight);
      
      // Find next occurrence
      index = contentLower.indexOf(queryLower, index + 1);
      
      // Limit to 3 highlights per note
      if (highlights.length >= 3) break;
    }
    
    return highlights;
  }

  /**
   * Strip HTML tags from content
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get search suggestions (for autocomplete)
   */
  getSuggestions(query: string, limit: number = 5): string[] {
    if (!this.index || !query.trim() || query.length < 2) {
      return [];
    }

    const results = this.index.search(query, { limit });
    const suggestions = new Set<string>();

    results.forEach((result: any) => {
      const note = this.notes.get(result.id);
      if (note) {
        // Add title as suggestion
        if (note.title.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(note.title);
        }
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }
}

// Export singleton instance
export const searchService = new SearchService();

export default searchService;