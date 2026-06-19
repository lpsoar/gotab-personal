const DEFAULT_BASE_URL = 'http://lpsoar.bbroot.com:38099';
const DEFAULT_CATEGORY = '主页';
const CATEGORY_OPTIONS = ['主页', '常用', 'AI', '开发', '工作', '家庭', '知识', '运维', '生活', '归档'];
const ADD_TIMEOUT_MS = 6000;

chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: 'add-current-page-to-gotab',
    title: '添加当前页到 GoTab',
    contexts: ['page', 'link']
  });
  const cfg = await chrome.storage.sync.get(['baseUrl', 'category']);
  const next = {};
  if (!cfg.baseUrl || cfg.baseUrl === 'http://127.0.0.1:8099') next.baseUrl = DEFAULT_BASE_URL;
  if (!cfg.category || cfg.category === '归档') next.category = DEFAULT_CATEGORY;
  if (Object.keys(next).length) await chrome.storage.sync.set(next);
});

function cleanBaseUrl(baseUrl) {
  return (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

function normalizeCategory(category) {
  return category || DEFAULT_CATEGORY;
}

function notify(message, ok = true) {
  // 右键菜单没有 popup 可显示结果，用系统通知给轻量反馈。
  if (!chrome.notifications) return;
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon.png',
    title: ok ? '已添加到 GoTab' : '添加到 GoTab 失败',
    message: message || ''
  });
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

async function openAddUrl({ title, url, notifyResult = false }) {
  if (!url || !/^https?:\/\//i.test(url)) {
    const res = { ok: false, message: '只支持 http/https 页面' };
    if (notifyResult) notify(res.message, false);
    return res;
  }
  const cfg = await chrome.storage.sync.get(['baseUrl', 'category']);
  const base = cleanBaseUrl(cfg.baseUrl);
  const category = normalizeCategory(cfg.category);
  const target = `${base}/?gotab_add_url=1&title=${encodeURIComponent(title || url)}&url=${encodeURIComponent(url)}&category=${encodeURIComponent(category)}`;

  // 关键：后台打开非激活临时页，写入 GoTab 同源 localStorage 后自动关闭；不打断用户当前网页。
  const tab = await chrome.tabs.create({ url: target, active: false });
  const reason = await waitForTabRemoved(tab.id);
  if (reason === 'timeout') await closeTabIfExists(tab.id);

  const res = { ok: true, message: `已添加到 GoTab「${category}」：${title || url}` };
  if (notifyResult) notify(res.message, true);
  return res;
}

async function addActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return { ok: false, message: '没有找到当前标签页' };
  return openAddUrl({ title: tab.title, url: tab.url });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const url = info.linkUrl || info.pageUrl || tab?.url;
  const title = info.linkText || tab?.title || url;
  await openAddUrl({ title, url, notifyResult: true });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg?.type === 'add-active-tab') return addActiveTab();
    if (msg?.type === 'save-options') {
      await chrome.storage.sync.set({
        baseUrl: cleanBaseUrl(msg.baseUrl),
        category: normalizeCategory(msg.category)
      });
      return { ok: true, message: '设置已保存' };
    }
    if (msg?.type === 'load-options') {
      const cfg = await chrome.storage.sync.get(['baseUrl', 'category']);
      return {
        ok: true,
        baseUrl: cfg.baseUrl || DEFAULT_BASE_URL,
        category: cfg.category || DEFAULT_CATEGORY,
        categories: CATEGORY_OPTIONS
      };
    }
    return { ok: false, message: '未知操作' };
  })().then(sendResponse).catch(err => sendResponse({ ok: false, message: err?.message || String(err) }));
  return true;
});
