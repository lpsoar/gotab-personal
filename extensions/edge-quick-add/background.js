const DEFAULT_BASE_URL = 'http://127.0.0.1:8099';
const DEFAULT_CATEGORY = '归档';

chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: 'add-current-page-to-gotab',
    title: '添加当前页到 GoTab',
    contexts: ['page', 'link']
  });
  const cfg = await chrome.storage.sync.get(['baseUrl', 'category']);
  if (!cfg.baseUrl) await chrome.storage.sync.set({ baseUrl: DEFAULT_BASE_URL });
  if (!cfg.category) await chrome.storage.sync.set({ category: DEFAULT_CATEGORY });
});

function cleanBaseUrl(baseUrl) {
  return (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

async function openAddUrl({ title, url }) {
  if (!url || !/^https?:\/\//i.test(url)) {
    return { ok: false, message: '只支持 http/https 页面' };
  }
  const cfg = await chrome.storage.sync.get(['baseUrl', 'category']);
  const base = cleanBaseUrl(cfg.baseUrl);
  const category = cfg.category || DEFAULT_CATEGORY;
  const target = `${base}/?gotab_add_url=1&title=${encodeURIComponent(title || url)}&url=${encodeURIComponent(url)}&category=${encodeURIComponent(category)}`;
  await chrome.tabs.create({ url: target, active: true });
  return { ok: true, message: `已发送到 GoTab：${title || url}` };
}

async function addActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return { ok: false, message: '没有找到当前标签页' };
  return openAddUrl({ title: tab.title, url: tab.url });
}

chrome.action.onClicked.addListener(addActiveTab);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const url = info.linkUrl || info.pageUrl || tab?.url;
  const title = info.linkText || tab?.title || url;
  await openAddUrl({ title, url });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg?.type === 'add-active-tab') return addActiveTab();
    if (msg?.type === 'save-options') {
      await chrome.storage.sync.set({
        baseUrl: cleanBaseUrl(msg.baseUrl),
        category: msg.category || DEFAULT_CATEGORY
      });
      return { ok: true, message: '设置已保存' };
    }
    if (msg?.type === 'load-options') {
      const cfg = await chrome.storage.sync.get(['baseUrl', 'category']);
      return {
        ok: true,
        baseUrl: cfg.baseUrl || DEFAULT_BASE_URL,
        category: cfg.category || DEFAULT_CATEGORY
      };
    }
    return { ok: false, message: '未知操作' };
  })().then(sendResponse).catch(err => sendResponse({ ok: false, message: err?.message || String(err) }));
  return true;
});
