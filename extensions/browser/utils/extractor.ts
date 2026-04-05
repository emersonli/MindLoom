/**
 * MindLoom Web Clipper - Content Extractor
 * 
 * 内容提取工具函数 (TypeScript 版本)
 * 用于从网页提取结构化内容
 */

export interface ExtractedContent {
  title: string;
  content: string;
  textContent: string;
  html: string;
  images: ExtractedImage[];
  links: ExtractedLink[];
  metadata: PageMetadata;
}

export interface ExtractedImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface ExtractedLink {
  href: string;
  text: string;
}

export interface PageMetadata {
  title: string;
  description: string;
  author: string;
  siteName: string;
  publishedTime: string;
  modifiedTime: string;
  keywords: string[];
  ogImage: string;
}

/**
 * 提取完整页面内容
 */
export function extractFullPage(): ExtractedContent | null {
  try {
    const content = extractArticleContent();
    
    return {
      title: document.title || '',
      content: content.html,
      textContent: content.text,
      html: content.html,
      images: extractImages(),
      links: extractLinks(),
      metadata: extractMetadata()
    };
  } catch (error) {
    console.error('[MindLoom Clipper] 提取页面内容失败:', error);
    return null;
  }
}

/**
 * 提取文章主要内容
 */
function extractArticleContent(): { html: string; text: string } {
  const articleSelectors = [
    'article',
    '[role="article"]',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.post',
    '.article',
    '#content',
    '.content',
    'main'
  ];
  
  let mainContent: Element | null = null;
  
  for (const selector of articleSelectors) {
    mainContent = document.querySelector(selector);
    if (mainContent) break;
  }
  
  if (!mainContent) {
    mainContent = document.body;
  }
  
  const clone = mainContent.cloneNode(true) as Element;
  
  // 移除不需要的元素
  const removeSelectors = [
    'script',
    'style',
    'nav',
    'footer',
    'header',
    '.advertisement',
    '.ads',
    '.sidebar',
    '.comments',
    '[class*="ad-"]',
    '[id*="ad-"]',
    '.share-buttons',
    '.social-share',
    '.related-posts',
    '.newsletter-signup'
  ];
  
  removeSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  return {
    html: clone.innerHTML || '',
    text: clone.textContent || ''
  };
}

/**
 * 提取页面图片
 */
function extractImages(): ExtractedImage[] {
  const images: ExtractedImage[] = [];
  const imgElements = document.querySelectorAll('img');
  
  imgElements.forEach((img) => {
    const htmlImg = img as HTMLImageElement;
    const src = htmlImg.src || htmlImg.getAttribute('data-src') || '';
    const alt = htmlImg.alt || '';
    
    if (src && !src.startsWith('data:')) {
      images.push({
        src: makeAbsoluteUrl(src),
        alt: alt,
        width: htmlImg.naturalWidth || htmlImg.width || 0,
        height: htmlImg.naturalHeight || htmlImg.height || 0
      });
    }
  });
  
  return images.slice(0, 20);
}

/**
 * 提取页面链接
 */
function extractLinks(): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  const linkElements = document.querySelectorAll('a[href]');
  
  linkElements.forEach((link) => {
    const htmlLink = link as HTMLAnchorElement;
    const href = htmlLink.href || '';
    const text = htmlLink.textContent?.trim() || '';
    
    if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
      links.push({
        href: makeAbsoluteUrl(href),
        text: text
      });
    }
  });
  
  return links.slice(0, 50);
}

/**
 * 提取页面元数据
 */
function extractMetadata(): PageMetadata {
  const metadata: PageMetadata = {
    title: document.title || '',
    description: '',
    author: '',
    siteName: '',
    publishedTime: '',
    modifiedTime: '',
    keywords: [],
    ogImage: ''
  };
  
  // Meta description
  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) {
    metadata.description = descMeta.getAttribute('content') || '';
  }
  
  // Meta author
  const authorMeta = document.querySelector('meta[name="author"]');
  if (authorMeta) {
    metadata.author = authorMeta.getAttribute('content') || '';
  }
  
  // Open Graph
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    metadata.title = ogTitle.getAttribute('content') || metadata.title;
  }
  
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) {
    metadata.description = ogDesc.getAttribute('content') || metadata.description;
  }
  
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) {
    metadata.ogImage = ogImage.getAttribute('content') || '';
  }
  
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  if (ogSiteName) {
    metadata.siteName = ogSiteName.getAttribute('content') || '';
  }
  
  const publishedTime = document.querySelector('meta[property="article:published_time"]');
  if (publishedTime) {
    metadata.publishedTime = publishedTime.getAttribute('content') || '';
  }
  
  // Keywords
  const keywordsMeta = document.querySelector('meta[name="keywords"]');
  if (keywordsMeta) {
    const keywords = keywordsMeta.getAttribute('content') || '';
    metadata.keywords = keywords.split(',').map(k => k.trim()).filter(k => k);
  }
  
  return metadata;
}

/**
 * 将相对 URL 转换为绝对 URL
 */
function makeAbsoluteUrl(url: string): string {
  try {
    return new URL(url, document.baseURI).href;
  } catch {
    return url;
  }
}

/**
 * 基于内容生成标签建议
 */
export function suggestTags(content: string, metadata: PageMetadata): string[] {
  const tags = new Set<string>();
  
  // 从关键词添加
  if (metadata.keywords) {
    metadata.keywords.forEach(k => tags.add(k.toLowerCase()));
  }
  
  // 从标题提取
  if (metadata.title) {
    const titleWords = metadata.title.toLowerCase().split(/\s+/);
    titleWords.forEach(word => {
      if (word.length > 3 && !isStopWord(word)) {
        tags.add(word);
      }
    });
  }
  
  // 从内容提取高频词
  if (content) {
    const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const wordCount: Record<string, number> = {};
    
    words.forEach(word => {
      if (!isStopWord(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    // 添加出现频率最高的 5 个词
    Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([word]) => tags.add(word));
  }
  
  return Array.from(tags).slice(0, 10);
}

/**
 * 常见停用词
 */
function isStopWord(word: string): boolean {
  const stopWords = [
    'this', 'that', 'these', 'those', 'with', 'have', 'from', 'they',
    'what', 'when', 'where', 'which', 'while', 'their', 'there', 'about',
    'into', 'more', 'some', 'time', 'very', 'after', 'would', 'could',
    'other', 'than', 'then', 'just', 'like', 'only', 'also', 'been',
    'back', 'being', 'has', 'had', 'does', 'did', 'doing'
  ];
  return stopWords.includes(word);
}
