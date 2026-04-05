/**
 * MindLoom Web Clipper - Content Script
 * 
 * 功能:
 * - 注入到网页中
 * - 提供页面内容提取能力
 * - 与 background script 通信
 */

// ============ 全局暴露 ============

window.MindLoomExtractor = {
  extractFullPage,
  extractSelection,
  extractMetadata
};

// ============ 内容提取 ============

/**
 * 提取完整页面内容
 */
function extractFullPage() {
  try {
    // 使用 Readability 或原生提取
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
 * 提取选中内容
 */
function extractSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  
  const range = selection.getRangeAt(0);
  const container = range.cloneContents();
  
  return {
    html: container.innerHTML || '',
    text: selection.toString() || ''
  };
}

/**
 * 提取文章主要内容 (简化版 Readability)
 */
function extractArticleContent() {
  // 尝试找到主要内容区域
  const articleSelectors = [
    'article',
    '[role="article"]',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.post',
    '.article',
    '#content',
    '.content'
  ];
  
  let mainContent = null;
  
  for (const selector of articleSelectors) {
    mainContent = document.querySelector(selector);
    if (mainContent) break;
  }
  
  // 如果没找到，使用 body
  if (!mainContent) {
    mainContent = document.body;
  }
  
  // 克隆节点以避免修改原页面
  const clone = mainContent.cloneNode(true);
  
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
    '.social-share'
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
function extractImages() {
  const images = [];
  const imgElements = document.querySelectorAll('img');
  
  imgElements.forEach((img, index) => {
    const src = img.src || img.getAttribute('data-src') || '';
    const alt = img.alt || '';
    
    if (src && !src.startsWith('data:')) {
      images.push({
        src: makeAbsoluteUrl(src),
        alt: alt,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      });
    }
  });
  
  return images.slice(0, 20); // 限制图片数量
}

/**
 * 提取页面链接
 */
function extractLinks() {
  const links = [];
  const linkElements = document.querySelectorAll('a[href]');
  
  linkElements.forEach((link) => {
    const href = link.href || '';
    const text = link.textContent?.trim() || '';
    
    if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
      links.push({
        href: makeAbsoluteUrl(href),
        text: text
      });
    }
  });
  
  return links.slice(0, 50); // 限制链接数量
}

/**
 * 提取页面元数据
 */
function extractMetadata() {
  const metadata = {
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
  
  // Article time
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

// ============ 工具函数 ============

/**
 * 将相对 URL 转换为绝对 URL
 */
function makeAbsoluteUrl(url) {
  try {
    return new URL(url, document.baseURI).href;
  } catch {
    return url;
  }
}

// ============ 自动标签建议 ============

/**
 * 基于内容生成标签建议
 */
function suggestTags(content, metadata) {
  const tags = new Set();
  
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
  
  // 从内容提取高频词 (简化版)
  if (content) {
    const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const wordCount = {};
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
function isStopWord(word) {
  const stopWords = [
    'this', 'that', 'these', 'those', 'with', 'have', 'from', 'they',
    'what', 'when', 'where', 'which', 'while', 'their', 'there', 'about',
    'into', 'more', 'some', 'time', 'very', 'after', 'would', 'could',
    'other', 'than', 'then', 'just', 'like', 'only', 'also', 'been',
    'back', 'been', 'being', 'have', 'has', 'had', 'does', 'did', 'doing'
  ];
  return stopWords.includes(word);
}

// 暴露 suggestTags 到全局
window.MindLoomExtractor.suggestTags = suggestTags;

console.log('[MindLoom Clipper] Content script 已加载');
