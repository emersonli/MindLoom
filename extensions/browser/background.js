/**
 * MindLoom Web Clipper - Background Service Worker
 * 
 * 功能:
 * - 处理插件图标点击
 * - 管理上下文菜单
 * - 协调内容脚本与 popup 通信
 * - 处理剪藏请求
 */

// ============ 初始化 ============

// 创建上下文菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'mindloom-clip-selection',
    title: '剪藏到 MindLoom',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'mindloom-clip-page',
    title: '剪藏完整页面到 MindLoom',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'mindloom-clip-link',
    title: '剪藏链接到 MindLoom',
    contexts: ['link']
  });
  
  // 初始化存储
  chrome.storage.local.set({
    clipHistory: [],
    settings: {
      autoTags: true,
      includeImages: true,
      includeLinks: true,
      defaultNotebook: 'inbox'
    }
  });
  
  console.log('[MindLoom Clipper] 插件已安装/更新');
});

// ============ 上下文菜单处理 ============

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  
  switch (info.menuItemId) {
    case 'mindloom-clip-selection':
      clipSelection(tab.id);
      break;
    case 'mindloom-clip-page':
      clipFullPage(tab.id);
      break;
    case 'mindloom-clip-link':
      clipLink(tab.id, info.linkUrl);
      break;
  }
});

// ============ 剪藏功能 ============

/**
 * 剪藏选中内容
 */
async function clipSelection(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const selection = window.getSelection();
        return selection ? selection.toString() : '';
      }
    });
    
    const selectedText = results[0]?.result || '';
    
    if (!selectedText.trim()) {
      showNotification('未选中任何内容', 'error');
      return;
    }
    
    // 获取页面信息
    const tab = await chrome.tabs.get(tabId);
    
    const clipData = {
      type: 'selection',
      title: tab.title || '剪藏内容',
      url: tab.url || '',
      content: selectedText,
      timestamp: Date.now()
    };
    
    // 发送到 popup 或直接处理
    await sendToPopup(clipData);
    
  } catch (error) {
    console.error('[MindLoom Clipper] 剪藏选中内容失败:', error);
    showNotification('剪藏失败：' + error.message, 'error');
  }
}

/**
 * 剪藏完整页面
 */
async function clipFullPage(tabId) {
  try {
    // 注入内容提取脚本
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      files: ['utils/extractor.js']
    });
    
    // 执行提取
    const extractResults = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        if (typeof window.MindLoomExtractor !== 'function') {
          return null;
        }
        return window.MindLoomExtractor.extractFullPage();
      }
    });
    
    const pageData = extractResults[0]?.result;
    
    if (!pageData) {
      showNotification('无法提取页面内容', 'error');
      return;
    }
    
    const tab = await chrome.tabs.get(tabId);
    
    const clipData = {
      type: 'full-page',
      title: pageData.title || tab.title || '剪藏页面',
      url: tab.url || '',
      content: pageData.content || '',
      html: pageData.html || '',
      images: pageData.images || [],
      links: pageData.links || [],
      timestamp: Date.now()
    };
    
    await sendToPopup(clipData);
    
  } catch (error) {
    console.error('[MindLoom Clipper] 剪藏完整页面失败:', error);
    showNotification('剪藏失败：' + error.message, 'error');
  }
}

/**
 * 剪藏链接
 */
async function clipLink(tabId, linkUrl) {
  try {
    const tab = await chrome.tabs.get(tabId);
    
    const clipData = {
      type: 'link',
      title: '链接剪藏',
      url: linkUrl,
      sourceUrl: tab.url || '',
      content: `<a href="${linkUrl}">${linkUrl}</a>`,
      timestamp: Date.now()
    };
    
    await sendToPopup(clipData);
    
  } catch (error) {
    console.error('[MindLoom Clipper] 剪藏链接失败:', error);
    showNotification('剪藏失败：' + error.message, 'error');
  }
}

// ============ 通信处理 ============

/**
 * 发送数据到 popup
 */
async function sendToPopup(clipData) {
  // 尝试发送到 popup (如果已打开)
  const views = chrome.extension.getViews({ type: 'popup' });
  if (views.length > 0) {
    views[0].postMessage({ type: 'CLIP_DATA', data: clipData }, '*');
  } else {
    // 存储待处理数据
    await chrome.storage.local.set({ pendingClip: clipData });
    // 打开 popup
    chrome.action.openPopup();
  }
}

/**
 * 监听 popup 消息
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PENDING_CLIP') {
    chrome.storage.local.get(['pendingClip']).then((result) => {
      sendResponse(result.pendingClip);
    });
    return true; // 异步响应
  }
  
  if (message.type === 'SAVE_CLIP') {
    saveClipToHistory(message.data)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.type === 'CLIP_COMPLETE') {
    // 清除待处理数据
    chrome.storage.local.remove(['pendingClip']);
    showNotification('剪藏成功！', 'success');
    sendResponse({ success: true });
    return true;
  }
});

// ============ 历史记录 ============

/**
 * 保存剪藏历史
 */
async function saveClipToHistory(clipData) {
  try {
    const result = await chrome.storage.local.get(['clipHistory']);
    const history = result.clipHistory || [];
    
    // 添加到历史 (保留最近 100 条)
    history.unshift({
      ...clipData,
      id: Date.now().toString(),
      savedAt: Date.now()
    });
    
    if (history.length > 100) {
      history.pop();
    }
    
    await chrome.storage.local.set({ clipHistory: history });
    
  } catch (error) {
    console.error('[MindLoom Clipper] 保存历史失败:', error);
    throw error;
  }
}

// ============ 通知 ============

/**
 * 显示通知
 */
function showNotification(message, type = 'info') {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  console.log(`[MindLoom Clipper] ${icons[type] || 'ℹ️'} ${message}`);
  
  // 可选：使用 Chrome 通知 API
  if (chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'MindLoom 剪藏',
      message: message
    });
  }
}

// ============ 快捷键处理 ============

chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const tab = tabs[0];
    if (!tab?.id) return;
    
    switch (command) {
      case 'clip-selection':
        clipSelection(tab.id);
        break;
      case 'clip-full-page':
        clipFullPage(tab.id);
        break;
      case '_execute_action':
        chrome.action.openPopup();
        break;
    }
  });
});

console.log('[MindLoom Clipper] Background service worker 已启动');
