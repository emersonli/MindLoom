import { Note } from '../types';

// Regex to match wiki-style links: [[note title]] or [[note title|display text]]
const WIKI_LINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

/**
 * Extract all wiki-style links from content
 * @param content - HTML or plain text content
 * @returns Array of link targets (note titles)
 */
export function extractLinks(content: string): string[] {
  const links: string[] = [];
  let match;
  
  // Reset regex state
  WIKI_LINK_REGEX.lastIndex = 0;
  
  while ((match = WIKI_LINK_REGEX.exec(content)) !== null) {
    const linkTarget = match[1].trim();
    if (linkTarget && !links.includes(linkTarget)) {
      links.push(linkTarget);
    }
  }
  
  return links;
}

/**
 * Check if content contains a link to a specific note
 * @param content - Note content
 * @param noteTitle - Title of note to check
 * @returns boolean
 */
export function hasLinkToNote(content: string, noteTitle: string): boolean {
  const links = extractLinks(content);
  return links.some(link => link.toLowerCase() === noteTitle.toLowerCase());
}

/**
 * Find all notes that link to a specific note (backlinks)
 * @param notes - All notes
 * @param targetNoteTitle - Title of target note
 * @returns Array of notes that link to target
 */
export function findBacklinks(notes: Note[], targetNoteTitle: string): Note[] {
  return notes.filter(note => 
    note.id !== undefined && // Skip if note has no ID (new notes)
    hasLinkToNote(note.content, targetNoteTitle)
  );
}

/**
 * Get all unique links from all notes (for graph visualization)
 * @param notes - All notes
 * @returns Map of note title -> array of linked note titles
 */
export function buildLinkGraph(notes: Note[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  
  notes.forEach(note => {
    const links = extractLinks(note.content);
    if (links.length > 0) {
      graph.set(note.title, links);
    }
  });
  
  return graph;
}

/**
 * Convert wiki-style links to HTML links
 * @param content - HTML content with wiki links
 * @param onLinkClick - Callback when link is clicked (noteId)
 * @returns HTML string with clickable links
 */
export function renderLinks(
  content: string, 
  notes: Note[]
): string {
  // First, escape HTML in content to prevent XSS
  let escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Then replace wiki links with HTML links
  escaped = escaped.replace(
    WIKI_LINK_REGEX,
    (_match, noteTitle, displayText) => {
      const title = noteTitle.trim();
      const display = displayText ? displayText.trim() : title;
      
      // Find note by title
      const linkedNote = notes.find(
        n => n.title.toLowerCase() === title.toLowerCase()
      );
      
      if (linkedNote) {
        // Return clickable link
        return `<a href="#" 
          class="wiki-link" 
          data-note-id="${linkedNote.id}"
          data-note-title="${title}"
          onclick="event.preventDefault(); window.navigateToNote && window.navigateToNote('${linkedNote.id}')"
        >${display}</a>`;
      } else {
        // Return unlinked text (note doesn't exist)
        return `<span class="wiki-link-unresolved">${display}</span>`;
      }
    }
  );
  
  return escaped;
}

/**
 * Get link preview (show in tooltip)
 */
export function getLinkPreview(content: string, maxLength: number = 100): string {
  // Extract first 100 characters of content without HTML
  const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Parse note ID from wiki link
 * @param linkText - The link text (e.g., "note title" or "note title|display")
 * @returns Normalized note title
 */
export function parseLinkTarget(linkText: string): string {
  return linkText.trim();
}

export default {
  extractLinks,
  hasLinkToNote,
  findBacklinks,
  buildLinkGraph,
  renderLinks,
  getLinkPreview,
  parseLinkTarget,
};