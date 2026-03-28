/**
 * 双向链接解析工具
 * P03: 双向链接解析后端实现
 */

// Wiki-style link regex: [[note title]] or [[note title|display text]]
const WIKI_LINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

/**
 * 从内容中提取所有 wiki 风格链接
 * @param content - HTML 或纯文本内容
 * @returns 链接目标数组（笔记标题）
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
 * 检查内容是否包含指向特定笔记的链接
 * @param content - 笔记内容
 * @param noteTitle - 要检查的笔记标题
 * @returns boolean
 */
export function hasLinkToNote(content: string, noteTitle: string): boolean {
  const links = extractLinks(content);
  return links.some(link => link.toLowerCase() === noteTitle.toLowerCase());
}

/**
 * 从数据库查询反向链接
 * @param noteTitle - 目标笔记标题
 * @param notes - 所有笔记
 * @returns 链接到目标的笔记数组
 */
export function findBacklinks(noteTitle: string, notes: Array<{ id: string; title: string; content: string }>): Array<{ id: string; title: string }> {
  return notes
    .filter(note => hasLinkToNote(note.content, noteTitle))
    .map(note => ({ id: note.id, title: note.title }));
}

/**
 * 解析链接目标
 * @param linkText - 链接文本（如 "笔记标题" 或 "笔记标题|显示文本"）
 * @returns 规范化的笔记标题
 */
export function parseLinkTarget(linkText: string): string {
  return linkText.trim().split('|')[0].trim();
}

/**
 * 将 wiki 链接转换为 HTML 链接
 * @param content - 包含 wiki 链接的内容
 * @returns HTML 字符串
 */
export function renderWikiLinks(content: string): string {
  return content.replace(
    WIKI_LINK_REGEX,
    (_, noteTitle, displayText) => {
      const title = noteTitle.trim();
      const display = displayText ? displayText.trim() : title;
      return `<a href="/note/${encodeURIComponent(title)}" class="wiki-link">${display}</a>`;
    }
  );
}

/**
 * 批量处理笔记的链接（用于索引）
 * @param notes - 所有笔记
 * @returns Map<笔记ID, 链接到的笔记ID数组>
 */
export function buildLinkIndex(notes: Array<{ id: string; title: string; content: string }>): Map<string, string[]> {
  const index = new Map<string, string[]>();

  // First, create a title-to-id map
  const titleToId = new Map<string, string>();
  notes.forEach(note => {
    titleToId.set(note.title.toLowerCase(), note.id);
  });

  // Then build the index
  notes.forEach(note => {
    const links = extractLinks(note.content);
    const linkedIds = links
      .map(link => titleToId.get(link.toLowerCase()))
      .filter((id): id is string => id !== undefined);
    
    index.set(note.id, linkedIds);
  });

  return index;
}

export default {
  extractLinks,
  hasLinkToNote,
  findBacklinks,
  parseLinkTarget,
  renderWikiLinks,
  buildLinkIndex,
};