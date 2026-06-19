const $ = id => document.getElementById(id);
const status = $('status');

function show(msg, ok=true){
  status.textContent = msg || '';
  status.style.color = ok ? '#059669' : '#dc2626';
}

async function send(msg){
  return chrome.runtime.sendMessage(msg);
}

function renderCategories(categories = [], selected = '') {
  const select = $('category');
  while (select.firstChild) select.removeChild(select.firstChild);
  const values = Array.from(new Set([selected, ...categories].filter(Boolean)));
  for (const value of values) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
  select.value = selected || values[0] || '主页';
}

(async () => {
  const cfg = await send({ type: 'load-options' });
  if (cfg?.ok) {
    $('baseUrl').value = cfg.baseUrl;
    renderCategories(cfg.categories, cfg.category);
  } else {
    renderCategories(['主页', '常用', 'AI', '开发', '工作', '家庭', '知识', '运维', '生活', '归档'], '主页');
  }
})();

$('add').addEventListener('click', async () => {
  show('正在添加...');
  const res = await send({ type: 'add-active-tab' });
  show(res.message, res.ok);
});

$('save').addEventListener('click', async () => {
  const res = await send({
    type: 'save-options',
    baseUrl: $('baseUrl').value,
    category: $('category').value
  });
  show(res.message, res.ok);
});
