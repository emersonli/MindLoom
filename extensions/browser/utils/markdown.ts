/**
 * MindLoom Web Clipper - Markdown Converter
 * 
 * 将 HTML 内容转换为 Markdown 格式
 */

export interface MarkdownOptions {
  includeImages?: boolean;
  includeLinks?: boolean;
  headingStyle?: 'atx' | 'setext';
  bulletListMarker?: '-' | '*' | '+';
  codeBlockStyle?: 'fenced' | 'indented';
  emDelimiter?: '_' | '*';
  strongDelimiter?: '__' | '**';
}

const defaultOptions: MarkdownOptions = {
  includeImages: true,
  includeLinks: true,
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
  strongDelimiter: '**'
};

/**
 * HTML 转 Markdown
 */
export function htmlToMarkdown(html: string, options: MarkdownOptions = {}): string {
  const opts = { ...defaultOptions, ...options };
  
  let markdown = html;
  
  // 预处理：移除 script/style
  markdown = markdown.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  markdown = markdown.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // 块级元素
  markdown = convertBlockElements(markdown, opts);
  
  // 内联元素
  markdown = convertInlineElements(markdown, opts);
  
  // 清理
  markdown = cleanupMarkdown(markdown);
  
  return markdown.trim();
}

/**
 * 转换块级元素
 */
function convertBlockElements(markdown: string, opts: MarkdownOptions): string {
  // 标题
  if (opts.headingStyle === 'atx') {
    markdown = markdown.replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n');
    markdown = markdown.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n');
    markdown = markdown.replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n');
    markdown = markdown.replace(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n\n');
    markdown = markdown.replace(/<h5\b[^>]*>([\s\S]*?)<\/h5>/gi, '##### $1\n\n');
    markdown = markdown.replace(/<h6\b[^>]*>([\s\S]*?)<\/h6>/gi, '###### $1\n\n');
  }
  
  // 段落
  markdown = markdown.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
  
  // 换行
  markdown = markdown.replace(/<br\s*\/?>/gi, '  \n');
  
  // 水平线
  markdown = markdown.replace(/<hr\s*\/?>/gi, '\n---\n\n');
  
  // 列表
  markdown = convertLists(markdown, opts);
  
  // 代码块
  if (opts.codeBlockStyle === 'fenced') {
    markdown = markdown.replace(/<pre\b[^>]*><code\b[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
    markdown = markdown.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, '```\n$1\n```\n\n');
    markdown = markdown.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
  }
  
  // 引用
  markdown = markdown.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n\n');
  
  // 图片
  if (opts.includeImages) {
    markdown = markdown.replace(/<img\b[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)\n');
    markdown = markdown.replace(/<img\b[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi, '![$1]($2)\n');
    markdown = markdown.replace(/<img\b[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)\n');
  }
  
  // 链接
  if (opts.includeLinks) {
    markdown = markdown.replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
    markdown = markdown.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  }
  
  // 表格
  markdown = convertTables(markdown);
  
  // 移除 div/span
  markdown = markdown.replace(/<\/?(?:div|span)\b[^>]*>/gi, '');
  
  return markdown;
}

/**
 * 转换列表
 */
function convertLists(markdown: string, opts: MarkdownOptions): string {
  // 无序列表
  markdown = markdown.replace(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
    return content.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, `${opts.bulletListMarker} $1\n`);
  });
  
  // 有序列表
  markdown = markdown.replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
    let index = 1;
    return content.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, () => {
      return `${index++}. $1\n`;
    });
  });
  
  return markdown;
}

/**
 * 转换表格
 */
function convertTables(markdown: string): string {
  // 简单表格转换
  markdown = markdown.replace(/<table\b[^>]*>([\s\S]*?)<\/table>/gi, (match, content) => {
    const rows = content.match(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    if (rows.length === 0) return '';
    
    const mdRows: string[] = [];
    let headerDone = false;
    
    rows.forEach(row => {
      const cells = row.match(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi) || [];
      const cellContents = cells.map(cell => {
        const content = cell.replace(/<t[hd]\b[^>]*>/gi, '').replace(/<\/t[hd]>/gi, '').trim();
        return content || ' ';
      });
      
      mdRows.push(`| ${cellContents.join(' | ')} |`);
      
      // 添加表头分隔线
      if (!headerDone) {
        const separators = cellContents.map(() => '---');
        mdRows.push(`| ${separators.join(' | ')} |`);
        headerDone = true;
      }
    });
    
    return mdRows.join('\n') + '\n\n';
  });
  
  return markdown;
}

/**
 * 转换内联元素
 */
function convertInlineElements(markdown: string, opts: MarkdownOptions): string {
  // 粗体
  markdown = markdown.replace(/<strong\b[^>]*>([\s\S]*?)<\/strong>/gi, `${opts.strongDelimiter}$1${opts.strongDelimiter}`);
  markdown = markdown.replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, `${opts.strongDelimiter}$1${opts.strongDelimiter}`);
  
  // 斜体
  markdown = markdown.replace(/<em\b[^>]*>([\s\S]*?)<\/em>/gi, `${opts.emDelimiter}$1${opts.emDelimiter}`);
  markdown = markdown.replace(/<i\b[^>]*>([\s\S]*?)<\/i>/gi, `${opts.emDelimiter}$1${opts.emDelimiter}`);
  
  // 删除线
  markdown = markdown.replace(/<del\b[^>]*>([\s\S]*?)<\/del>/gi, '~~$1~~');
  markdown = markdown.replace(/<s\b[^>]*>([\s\S]*?)<\/s>/gi, '~~$1~~');
  
  // 上标/下标
  markdown = markdown.replace(/<sup\b[^>]*>([\s\S]*?)<\/sup>/gi, '^$1^');
  markdown = markdown.replace(/<sub\b[^>]*>([\s\S]*?)<\/sub>/gi, '~$1~');
  
  return markdown;
}

/**
 * 清理 Markdown
 */
function cleanupMarkdown(markdown: string): string {
  // 移除多余空行
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  
  // 移除行首尾空格
  markdown = markdown.split('\n').map(line => line.trim()).join('\n');
  
  // 移除多余空格
  markdown = markdown.replace(/  +/g, ' ');
  
  // 解码 HTML 实体
  markdown = decodeHtmlEntities(markdown);
  
  return markdown;
}

/**
 * 解码 HTML 实体
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
    '&lsquo;': ''',
    '&rsquo;': ''',
    '&ldquo;': '"',
    '&rdquo;': '"'
  };
  
  Object.entries(entities).forEach(([entity, char]) => {
    text = text.replace(new RegExp(entity, 'g'), char);
  });
  
  return text;
}

/**
 * 快速剪藏：提取纯文本并转为 Markdown
 */
export function quickClip(title: string, url: string, content: string): string {
  const markdown = htmlToMarkdown(content);
  
  return `# ${title}

${markdown}

---
来源：${url}
剪藏时间：${new Date().toISOString()}
`.trim();
}
