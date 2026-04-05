/**
 * MindLoom Web Clipper - Popup (Compiled JavaScript)
 * 
 * 弹窗主逻辑 - 处理用户交互和剪藏流程
 */

// State
let currentClipType = 'article';
let selectedTags = [];
let pageData = null;

// DOM Elements
const elements = {};

function initElements() {
  elements.loading = document.getElementById('loading');
  elements.main = document.getElementById('main');
  elements.footer = document.getElementById('footer');
  elements.success = document.getElementById('success');
  elements.error = document.getElementById('error');
  elements.title = document.getElementById('title');
  elements.url = document.getElementById('url');
  elements.notebook = document.getElementById('notebook');
  elements.tags = document.getElementById('tags');
  elements.selectedTags = document.getElementById('selected-tags');
  elements.tagSuggestions = document.getElementById('tag-suggestions');
  elements.notes = document.getElementById('notes');
  elements.preview = document.getElementById('preview');
  elements.previewText = document.getElementById('preview-text');
  elements.togglePreview = document.getElementById('toggle-preview');
  elements.wordCount = document.getElementById('word-count');
  elements.imageCount = document.getElementById('image-count');
  elements.saveBtn = document.getElementById('save-btn');
  elements.cancelBtn = document.getElementById('cancel-btn');
  elements.closeBtn = document.getElementById('close-btn');
  elements.retryBtn = document.getElementById('retry-btn');
  elements.errorCloseBtn = document.getElementById('error-close-btn');
  elements.errorMessage = document.getElementById('error-message');
  elements.savedNotebook = document.getElementById('saved-notebook');
  elements.typeBtns = document.querySelectorAll('.type-btn');
}

// Initialization
async function init() {
  initElements();
  
  try {
    const clipData = await getPendingClip();
    
    if (clipData) {
      pageData = {
        title: clipData.title,
        url: clipData.url,
        content: clipData.content,
        images: clipData.images || [],
        suggestedTags: []
      };
      populateForm(clipData);
    } else {
      await fetchPageData();
    }
    
    showMain();
    setupEventListeners();
  } catch (error) {
    showError('初始化失败：' + error.message);
  }
}

// Data Fetching
async function getPendingClip() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_PENDING_CLIP' }, (response) => {
      resolve(response || null);
    });
  });
}

async function fetchPageData() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab?.url) {
    throw new Error('无法获取当前标签页');
  }
  
  pageData = {
    title: tab.title || '未命名页面',
    url: tab.url,
    content: '',
    images: [],
    suggestedTags: []
  };
  
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (typeof window.MindLoomExtractor === 'object') {
          return window.MindLoomExtractor.extractFullPage();
        }
        return null;
      }
    });
    
    const data = results[0]?.result;
    if (data) {
      pageData.content = data.textContent || data.content || '';
      pageData.images = data.images || [];
      pageData.suggestedTags = data.suggestedTags || [];
    }
  } catch (e) {
    console.warn('无法从页面提取内容，使用基本信息');
  }
}

// UI Functions
function populateForm(clipData) {
  elements.title.value = clipData.title;
  elements.url.textContent = clipData.url;
  
  if (clipData.tags) {
    selectedTags = clipData.tags;
    renderSelectedTags();
  }
  
  updateStats(clipData.content);
}

function showMain() {
  elements.loading.style.display = 'none';
  elements.main.style.display = 'flex';
  elements.footer.style.display = 'flex';
}

function showSuccess() {
  elements.main.style.display = 'none';
  elements.footer.style.display = 'none';
  elements.success.style.display = 'flex';
}

function showError(message) {
  elements.main.style.display = 'none';
  elements.footer.style.display = 'none';
  elements.error.style.display = 'flex';
  elements.errorMessage.textContent = message;
}

function resetUI() {
  elements.success.style.display = 'none';
  elements.error.style.display = 'none';
  elements.main.style.display = 'flex';
  elements.footer.style.display = 'flex';
}

// Event Listeners
function setupEventListeners() {
  elements.typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentClipType = btn.getAttribute('data-type');
    });
  });
  
  elements.tags.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = elements.tags.value.trim();
      if (tag && !selectedTags.includes(tag)) {
        selectedTags.push(tag);
        renderSelectedTags();
        elements.tags.value = '';
      }
    }
  });
  
  elements.togglePreview.addEventListener('click', () => {
    const isHidden = elements.preview.style.display === 'none';
    elements.preview.style.display = isHidden ? 'block' : 'none';
    elements.togglePreview.textContent = isHidden ? '收起' : '展开';
  });
  
  elements.saveBtn.addEventListener('click', saveClip);
  elements.cancelBtn.addEventListener('click', () => window.close());
  elements.closeBtn.addEventListener('click', () => window.close());
  elements.retryBtn.addEventListener('click', () => { resetUI(); init(); });
  elements.errorCloseBtn.addEventListener('click', () => window.close());
}

// Tag Functions
function renderSelectedTags() {
  elements.selectedTags.innerHTML = selectedTags
    .map(tag => `<span class="tag">${tag}<span class="tag-remove" data-tag="${tag}">✕</span></span>`)
    .join('');
  
  elements.selectedTags.querySelectorAll('.tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag');
      if (tag) {
        selectedTags = selectedTags.filter(t => t !== tag);
        renderSelectedTags();
      }
    });
  });
}

// Stats
function updateStats(content) {
  const wordCount = content.trim().split(/\s+/).filter(w => w).length;
  const imageCount = pageData?.images?.length || 0;
  
  elements.wordCount.textContent = `${wordCount} 字`;
  elements.imageCount.textContent = `${imageCount} 图片`;
}

// Save
async function saveClip() {
  const title = elements.title.value.trim() || pageData?.title || '未命名剪藏';
  const notebook = elements.notebook.value;
  const notes = elements.notes.value.trim();
  
  if (!pageData) {
    showError('没有可保存的内容');
    return;
  }
  
  const clipData = {
    type: currentClipType,
    title,
    url: pageData.url,
    content: pageData.content,
    html: pageData.content,
    images: pageData.images,
    tags: selectedTags,
    notebook,
    notes,
    timestamp: Date.now()
  };
  
  try {
    await chrome.runtime.sendMessage({ type: 'SAVE_CLIP', data: clipData });
    await chrome.runtime.sendMessage({ type: 'CLIP_COMPLETE' });
    
    elements.savedNotebook.textContent = getNotebookName(notebook);
    showSuccess();
  } catch (error) {
    showError('保存失败：' + error.message);
  }
}

function getNotebookName(id) {
  const names = {
    inbox: '收件箱',
    work: '工作',
    study: '学习',
    life: '生活',
    project: '项目'
  };
  return names[id] || id;
}

// Start
init();
