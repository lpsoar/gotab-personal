const fs = require('fs');
const path = require('path');

const root = __dirname;
const background = fs.readFileSync(path.join(root, 'background.js'), 'utf8');
const popup = fs.readFileSync(path.join(root, 'popup.js'), 'utf8');
const popupHtml = fs.readFileSync(path.join(root, 'popup.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(!manifest.permissions.includes('notifications'), 'manifest should not request browser notification permission');
assert(!background.includes('chrome.notifications'), 'background should not call browser notifications');
assert(popupHtml.includes('id="openAfterAdd"'), 'popup should expose an add-then-open toggle');
assert(popup.includes('openAfterAdd'), 'popup script should load and save the add-then-open setting');
assert(popup.includes("type: 'add-active-tab'"), 'popup should send an add-active-tab command');
assert(popup.includes("openAfterAdd: $('openAfterAdd').checked"), 'popup should pass the current add-then-open setting with the add command');
const addHandler = popup.match(/\$\(\'add\'\)\.addEventListener\('click', async \(\) => \{([\s\S]*?)\n\}\);/);
assert(addHandler && !addHandler[1].includes('saveCurrentOptions'), 'popup should not block adding on a separate option-save round trip');
assert(background.includes("'openAfterAdd'"), 'background should persist and read openAfterAdd');
assert(background.includes('options = null'), 'background should accept per-add option overrides from the popup');
assert(background.includes('void chrome.storage.sync.set'), 'background should persist per-add option overrides without blocking the add path');
assert(background.includes('active: openAfterAdd'), 'temporary GoTab tab activation should follow openAfterAdd');
assert(background.includes('open_after_add='), 'quick-add URL should tell GoTab whether to stay open after adding');
assert(background.includes('if (!openAfterAdd)'), 'background should only wait/close the temporary tab when not opening GoTab');
assert(background.includes('void waitForTabRemoved'), 'background should not block the popup while waiting for the temporary tab to close');
assert(!background.includes('const reason = await waitForTabRemoved'), 'background should not await temporary tab cleanup in the add response path');
