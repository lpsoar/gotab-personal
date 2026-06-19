const DEFAULT_BASE_URL = 'http://lpsoar.bbroot.com:38099';
const DEFAULT_CATEGORY = '主页';
const CATEGORY_OPTIONS = ['主页', '常用', 'AI', '开发', '工作', '家庭', '知识', '运维', '生活', '归档'];

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

async function openAddUrl({ title, url }) {
  if (!url || !/^https?:\/\//i.test(url)) {
    return { ok: false, message: '只支持 http/https 页面' };
  }
  const cfg = await chrome.storage.sync.get(['baseUrl', 'category']);
  const base = cleanBaseUrl(cfg.baseUrl);
  const category = normalizeCategory(cfg.category);
  const target = `${base}/?gotab_add_url=1&title=${encodeURIComponent(title || url)}&url=${encodeURIComponent(url)}&category=${encodeURIComponent(category)}`;
  await chrome.tabs.create({ url: target, active: true });
  return { ok: true, message: `已发送到 GoTab「${category}」：${title || url}` };
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
