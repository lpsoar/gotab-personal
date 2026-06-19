(() => {
  const PARAM_FLAG = 'gotab_add_url';
  const WEBSITE_INFO_TIMEOUT_MS = 800;

  function readPersisted(key) {
    const raw = localStorage.getItem(`persist:${key}`);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const out = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (k === '_persist') continue;
        try { out[k] = JSON.parse(v); } catch { out[k] = v; }
      }
      return out;
    } catch {
      return null;
    }
  }

  function writePersisted(key, value) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === '_persist') continue;
      out[k] = JSON.stringify(v);
    }
    out._persist = JSON.stringify({ version: -1, rehydrated: true });
    localStorage.setItem(`persist:${key}`, JSON.stringify(out));
  }

  function readAllPersisted() {
    const names = [
      'home',
      'openType',
      'wallpaperTheme',
      'swiper',
      'clockAndDate',
      'searchBar',
      'searchEngineData',
      'card',
      'appData',
      'bottomArea',
      'simpleMode',
      'dock'
    ];
    const data = {};
    for (const name of names) {
      const value = readPersisted(name);
      if (value) data[name] = value;
    }
    return data;
  }

  function uid() {
    return `lp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeUrl(url) {
    if (!url) return '';
    try {
      const u = new URL(url);
      if (!['http:', 'https:'].includes(u.protocol)) return '';
      return u.toString();
    } catch {
      return '';
    }
  }

  function iconFor(url) {
    try {
      const u = new URL(url);
      return `${u.origin}/favicon.ico`;
    } catch {
      return '#/icons/website.svg';
    }
  }

  async function fetchWebsiteInfo(url) {
    try {
      const res = await fetchWithTimeout('/api/tools/getWebsiteInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      }, WEBSITE_INFO_TIMEOUT_MS);
      const json = await res.json();
      return json && json.code === 200 && json.data ? json.data : null;
    } catch {
      return null;
    }
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timer));
  }

  async function syncLocalDataToCloud(timestamp) {
    const user = readPersisted('user');
    const token = user?.token;
    if (!token) return false;
    const data = readAllPersisted();
    if (!data.appData) return false;
    try {
      const res = await fetch('/api/user/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify({ data, timestamp })
      });
      const json = await res.json();
      return json?.code === 200;
    } catch {
      return false;
    }
  }

  function scheduleCloudSync(timestamp) {
    const run = () => { void syncLocalDataToCloud(timestamp); };
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(run, { timeout: 5000 });
    } else {
      setTimeout(run, 0);
    }
  }

  function pickCategory(appData, preferred) {
    const lists = Array.isArray(appData.listData) ? appData.listData : [];
    if (!lists.length) return null;
    if (preferred) {
      const matched = lists.find(x => x && (x.label === preferred || x.originLabel === preferred || x.id === preferred));
      if (matched) return matched;
    }
    return lists.find(x => x && (x.label === '归档' || x.originLabel === '归档'))
      || lists.find(x => x && (x.label === '常用' || x.originLabel === '常用'))
      || lists[0];
  }

  async function addCard({ title, url, category }) {
    const cleanUrl = normalizeUrl(url);
    if (!cleanUrl) throw new Error('URL 无效');
    const appData = readPersisted('appData');
    if (!appData || !Array.isArray(appData.listData)) throw new Error('GoTab 数据未初始化');
    const target = pickCategory(appData, category);
    if (!target) throw new Error('找不到可添加的分类');
    target.children = Array.isArray(target.children) ? target.children : [];
    const exists = target.children.find(x => x && x.type === 'link' && x.link === cleanUrl);
    if (exists) return { added: false, message: `已存在：${exists.label || cleanUrl}` };
    const info = await fetchWebsiteInfo(cleanUrl);
    const label = (info?.title || title || cleanUrl).trim().slice(0, 80);
    const icon = info?.icon || iconFor(cleanUrl);
    target.children.push({
      id: uid(),
      type: 'link',
      link: cleanUrl,
      internalLink: '',
      label,
      showType: 'icon',
      size: '11',
      iconPadding: 6,
      icon,
      backgroundColor: info?.backgroundColor || '#ffffff',
      fontColor: info?.fontColor || '#000000',
      openTarget: 'globalSet',
      description: info?.description || '通过 Edge 扩展添加'
    });
    writePersisted('appData', appData);
    const timestamp = Date.now();
    localStorage.setItem('updateTimestamp', String(timestamp));
    void scheduleCloudSync(timestamp);
    return { added: true, message: `已添加到「${target.label || target.originLabel || '默认'}」：${label}` };
  }

  function toast(text, ok = true) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = [
      'position:fixed', 'left:50%', 'top:24px', 'transform:translateX(-50%)',
      'z-index:2147483647', 'padding:10px 14px', 'border-radius:10px',
      `background:${ok ? '#16a34a' : '#dc2626'}`, 'color:white',
      'font:14px/1.4 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'box-shadow:0 8px 24px rgba(0,0,0,.18)', 'max-width:80vw'
    ].join(';');
    document.documentElement.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  async function handleUrlParams() {
    const u = new URL(location.href);
    if (u.searchParams.get(PARAM_FLAG) !== '1') return false;
    const title = u.searchParams.get('title') || '';
    const url = u.searchParams.get('url') || '';
    const category = u.searchParams.get('category') || '';
    const openAfterAdd = u.searchParams.get('open_after_add') === '1';
    let ok = false;
    let message = '';
    try {
      const res = await addCard({ title, url, category });
      ok = true;
      message = res.message;
    } catch (e) {
      message = `添加失败：${e.message || e}`;
    }
    // 清理地址栏，避免 GoTab 主应用把 query 当作普通路由处理，也避免刷新重复添加。
    history.replaceState(null, '', location.pathname + location.hash);
    try { sessionStorage.setItem('lpsoarQuickAddMessage', JSON.stringify({ ok, message, ts: Date.now() })); } catch {}
    if (ok && !openAfterAdd) {
      // 当前脚本位于 head 且早于 GoTab 主模块；立即停止后续资源加载，避免主应用先处理 query 并跳到 /login。
      try { window.stop(); } catch {}
      // 插件新建的临时 GoTab 标签页只用于写入同源 localStorage；写完后尽量自动关闭，避免用户看到登录/离线数据弹窗。
      setTimeout(() => {
        try { window.close(); } catch {}
        setTimeout(() => location.replace(location.pathname || '/'), 120);
      }, 30);
    } else if (ok) {
      try { document.documentElement.style.visibility = ''; } catch {}
      toast(message, true);
      setTimeout(() => location.replace(location.pathname || '/'), 450);
    } else {
      try { document.documentElement.style.visibility = ''; } catch {}
      toast(message, false);
    }
    return true;
  }

  function showPendingMessage() {
    try {
      const raw = sessionStorage.getItem('lpsoarQuickAddMessage');
      if (!raw) return;
      sessionStorage.removeItem('lpsoarQuickAddMessage');
      const msg = JSON.parse(raw);
      if (msg && Date.now() - msg.ts < 10000) toast(msg.message, msg.ok);
    } catch {}
  }

  window.lpsoarGotabQuickAdd = addCard;
  // 必须尽早处理 query，不能等 DOMContentLoaded；否则 GoTab 主应用可能先跳转登录/弹初始化上传数据。
  const quickAddMode = new URL(location.href).searchParams.get(PARAM_FLAG) === '1';
  if (quickAddMode) {
    try { document.documentElement.style.visibility = 'hidden'; } catch {}
    // 先停止后续主应用资源加载；添加逻辑只依赖 localStorage + fetch API。
    try { window.stop(); } catch {}
    handleUrlParams();
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showPendingMessage, { once: true });
  } else {
    showPendingMessage();
  }
})();
