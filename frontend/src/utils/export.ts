import { Note } from '../types';

/**
 * Export note as Markdown file
 */
export const exportAsMarkdown = (note: Note): void => {
  // Convert HTML content to Markdown (basic conversion)
  const markdownContent = htmlToMarkdown(note.content);
  
  // Add metadata as front matter
  const frontMatter = [
    '---',
    `title: "${note.title.replace(/"/g, '\\"')}"`,
    `created: ${new Date(note.created_at).toISOString()}`,
    `updated: ${new Date(note.updated_at).toISOString()}`,
    note.tags && note.tags.length > 0 ? `tags: [${note.tags.map(t => `"${t}"`).join(', ')}]` : '',
    '---',
    '',
  ].filter(Boolean).join('\n');

  const fullContent = frontMatter + markdownContent;
  
  downloadFile(
    fullContent,
    `${sanitizeFilename(note.title)}.md`,
    'text/markdown'
  );
};

/**
 * Export note as HTML file
 */
export const exportAsHtml = (note: Note): void => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(note.title)}</title>
  <style>
    :root {
      --bg-primary: #ffffff;
      --bg-secondary: #f5f5f5;
      --text-primary: #1a1a1a;
      --text-secondary: #666666;
      --accent: #3b82f6;
      --border: #e5e5e5;
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-primary: #1a1a1a;
        --bg-secondary: #2a2a2a;
        --text-primary: #ffffff;
        --text-secondary: #a0a0a0;
        --accent: #60a5fa;
        --border: #404040;
      }
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: var(--text-primary);
      background: var(--bg-primary);
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    
    header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    
    h1 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .meta {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    
    .content {
      line-height: 1.8;
    }
    
    .content h1, .content h2, .content h3 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    
    .content p {
      margin-bottom: 1em;
    }
    
    .content ul, .content ol {
      margin-left: 1.5em;
      margin-bottom: 1em;
    }
    
    .content code {
      background: var(--bg-secondary);
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 0.9em;
    }
    
    .content pre {
      background: var(--bg-secondary);
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
      margin-bottom: 1em;
    }
    
    .content blockquote {
      border-left: 4px solid var(--accent);
      padding-left: 1em;
      margin-left: 0;
      color: var(--text-secondary);
    }
    
    .tags {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }
    
    .tag {
      display: inline-block;
      background: var(--bg-secondary);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      margin-right: 0.5rem;
      margin-top: 0.5rem;
    }
    
    @media print {
      body {
        padding: 0;
        max-width: none;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(note.title)}</h1>
    <div class="meta">
      <span>创建：${new Date(note.created_at).toLocaleString('zh-CN')}</span>
      ${note.updated_at !== note.created_at ? ` · 更新：${new Date(note.updated_at).toLocaleString('zh-CN')}` : ''}
    </div>
  </header>
  
  <main class="content">
    ${note.content}
  </main>
  
  ${note.tags && note.tags.length > 0 ? `
  <div class="tags">
    ${note.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
  </div>
  ` : ''}
</body>
</html>
  `.trim();

  downloadFile(
    htmlContent,
    `${sanitizeFilename(note.title)}.html`,
    'text/html'
  );
};

/**
 * Export note as PDF (using print dialog)
 */
export const exportAsPdf = (note: Note): void => {
  // Create a hidden iframe with the HTML content
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(note.title)}</title>
  <style>
    @page {
      margin: 2cm;
      size: A4;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      padding: 0;
      margin: 0;
    }
    
    h1 {
      font-size: 24pt;
      margin-bottom: 0.5cm;
    }
    
    .meta {
      font-size: 9pt;
      color: #666;
      margin-bottom: 1cm;
    }
    
    .content {
      font-size: 11pt;
    }
    
    .content p {
      margin-bottom: 1em;
    }
    
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(note.title)}</h1>
  <div class="meta">
    创建：${new Date(note.created_at).toLocaleString('zh-CN')}
  </div>
  <div class="content">
    ${note.content}
  </div>
</body>
</html>
  `;
  
  document.body.appendChild(iframe);
  
  iframe.onload = () => {
    if (iframe.contentWindow) {
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(htmlContent);
      iframe.contentWindow.document.close();
      
      // Wait for content to load, then print
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Remove iframe after print dialog
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 250);
    }
  };
};

/**
 * Export multiple notes as ZIP
 */
export const exportAsZip = async (notes: Note[]): Promise<void> => {
  // Dynamically import JSZip
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  // Add each note as a markdown file
  notes.forEach(note => {
    const markdownContent = htmlToMarkdown(note.content);
    const frontMatter = [
      '---',
      `title: "${note.title.replace(/"/g, '\\"')}"`,
      `created: ${new Date(note.created_at).toISOString()}`,
      `updated: ${new Date(note.updated_at).toISOString()}`,
      '---',
      '',
    ].join('\n');
    
    zip.file(`${sanitizeFilename(note.title)}.md`, frontMatter + markdownContent);
  });
  
  // Generate and download ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  downloadFile(
    content,
    `mindloom-export-${Date.now()}.zip`,
    'application/zip'
  );
};

/**
 * Helper: Download file
 */
const downloadFile = (content: string | Blob, filename: string, mimeType: string): void => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Cleanup
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Helper: Sanitize filename
 */
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"/\\|？*]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
};

/**
 * Helper: Escape HTML
 */
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Helper: Convert HTML to Markdown (basic)
 */
const htmlToMarkdown = (html: string): string => {
  // Create a temporary element
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Convert common HTML elements to Markdown
  let markdown = temp.innerHTML;
  
  // Headers
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  
  // Bold and Italic
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  
  // Links
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  
  // Lists
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_match, content) => {
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  });
  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_match, content) => {
    let index = 1;
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${index++}. $1\n`);
  });
  
  // Code blocks
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```');
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  
  // Blockquotes
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n');
  
  // Paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  
  // Line breaks
  markdown = markdown.replace(/<br[^>]*>/gi, '\n');
  
  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');
  
  // Clean up extra whitespace
  markdown = markdown.replace(/\n\s*\n/g, '\n\n');
  
  return markdown.trim();
};
