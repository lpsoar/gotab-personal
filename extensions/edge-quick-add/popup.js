const $ = id => document.getElementById(id);
const status = $('status');
function show(msg, ok=true){ status.textContent = msg || ''; status.style.color = ok ? '#059669' : '#dc2626'; }

async function send(msg){ return chrome.runtime.sendMessage(msg); }

(async () => {
  const cfg = await send({ type: 'load-options' });
  if (cfg?.ok) {
    $('baseUrl').value = cfg.baseUrl;
    $('category').value = cfg.category;
  }
})();

$('add').addEventListener('click', async () => {
  show('正在添加...');
  const res = await send({ type: 'add-active-tab' });
  show(res.message, res.ok);
});

$('save').addEventListener('click', async () => {
  const res = await send({ type: 'save-options', baseUrl: $('baseUrl').value, category: $('category').value });
  show(res.message, res.ok);
});
