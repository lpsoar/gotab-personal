const DEFAULT_BASE_URL = 'http://lpsoar.bbroot.com:38099';
const DEFAULT_CATEGORY = '主页';
const DEFAULT_OPEN_AFTER_ADD = false;
const CATEGORY_OPTIONS = ['主页', '常用', 'AI', '开发', '工作', '家庭', '知识', '运维', '生活', '归档'];
const ADD_TIMEOUT_MS = 6000;

chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: 'add-current-page-to-gotab',
    title: '添加当前页到 GoTab',
    contexts: ['page', 'link']
  });
  const cfg = await chrome.storage.sync.get(['baseUrl', 'category', 'openAfterAdd']);
  const next = {};
  if (!cfg.baseUrl || cfg.baseUrl === 'http://127.0.0.1:8099') next.baseUrl = DEFAULT_BASE_URL;
  if (!cfg.category || cfg.category === '归档') next.category = DEFAULT_CATEGORY;
  if (typeof cfg.openAfterAdd !== 'boolean') next.openAfterAdd = DEFAULT_OPEN_AFTER_ADD;
  if (Object.keys(next).length) await chrome.storage.sync.set(next);
});

function cleanBaseUrl(baseUrl) {
  return (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

function normalizeCategory(category) {
  return category || DEFAULT_CATEGORY;
}

function waitForTabRemoved(tabId, timeoutMs = ADD_TIMEOUT_MS) {
  return new Promise(resolve => {
    let done = false;
    const finish = reason => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      resolve(reason);
    };
    const onRemoved = removedId => {
      if (removedId === tabId) finish('removed');
    };
    const timer = setTimeout(() => finish('timeout'), timeoutMs);
    chrome.tabs.onRemoved.addListener(onRemoved);
  });
}

async function closeTabIfExists(tabId) {
  try {
    await chrome.tabs.remove(tabId);
  } catch {
    // 页内 window.close 可能已经关闭了这个临时标签页。
  }
}

async function openAddUrl({ title, url, options = null }) {
  if (!url || !/^https?:\/\//i.test(url)) {
    return { ok: false, message: '只支持 http/https 页面' };
  }
  const cfg = await chrome.storage.sync.get(['baseUrl', 'category', 'openAfterAdd']);
  const base = cleanBaseUrl(options?.baseUrl ?? cfg.baseUrl);
  const category = normalizeCategory(options?.category ?? cfg.category);
  const openAfterAdd = typeof options?.openAfterAdd === 'boolean' ? options.openAfterAdd : cfg.openAfterAdd === true;
  if (options) {
    void chrome.storage.sync.set({ baseUrl: base, category, openAfterAdd });
  }
  const target = `${base}/?gotab_add_url=1&open_after_add=${openAfterAdd ? '1' : '0'}&title=${encodeURIComponent(title || url)}&url=${encodeURIComponent(url)}&category=${encodeURIComponent(category)}`;

  // 后台添加时用非激活临时页写入同源 localStorage；用户选择打开 GoTab 时保留并激活页面。
  const tab = await chrome.tabs.create({ url: target, active: openAfterAdd });
  if (!openAfterAdd) {
    void waitForTabRemoved(tab.id).then(reason => {
      if (reason === 'timeout') return closeTabIfExists(tab.id);
    });
  }

  return { ok: true, message: `已添加到 GoTab「${category}」：${title || url}` };
}

async function addActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return { ok: false, message: '没有找到当前标签页' };
  return openAddUrl({ title: tab.title, url: tab.url });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const url = info.linkUrl || info.pageUrl || tab?.url;
  const title = info.linkText || tab?.title || url;
  await openAddUrl({ title, url });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg?.type === 'add-active-tab') {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return { ok: false, message: '没有找到当前标签页' };
      return openAddUrl({
        title: tab.title,
        url: tab.url,
        options: {
          baseUrl: msg.baseUrl,
          category: msg.category,
          openAfterAdd: msg.openAfterAdd === true
        }
      });
    }
    if (msg?.type === 'save-options') {
      await chrome.storage.sync.set({
        baseUrl: cleanBaseUrl(msg.baseUrl),
        category: normalizeCategory(msg.category),
        openAfterAdd: msg.openAfterAdd === true
      });
      return { ok: true, message: '设置已保存' };
    }
    if (msg?.type === 'load-options') {
      const cfg = await chrome.storage.sync.get(['baseUrl', 'category', 'openAfterAdd']);
      return {
        ok: true,
        baseUrl: cfg.baseUrl || DEFAULT_BASE_URL,
        category: cfg.category || DEFAULT_CATEGORY,
        openAfterAdd: cfg.openAfterAdd === true,
        categories: CATEGORY_OPTIONS
      };
    }
    return { ok: false, message: '未知操作' };
  })().then(sendResponse).catch(err => sendResponse({ ok: false, message: err?.message || String(err) }));
  return true;
});
