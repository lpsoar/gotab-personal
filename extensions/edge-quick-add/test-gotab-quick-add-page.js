const fs = require('fs');
const path = require('path');

const repoRoot = process.env.GOTAB_REPO_ROOT || path.resolve(__dirname, '../..');
const script = fs.readFileSync(path.join(repoRoot, 'web/lpsoar-quick-add.js'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(script.includes('function readAllPersisted'), 'quick add should read all persisted slices for cloud push');
assert(script.includes("readPersisted('user')"), 'quick add should read the persisted user token');
assert(script.includes("fetch('/api/user/push'"), 'quick add should push updated local data to the cloud');
assert(script.includes('Authorization'), 'cloud push should include the user token header');
assert(script.includes("localStorage.setItem('updateTimestamp', String(timestamp))"), 'quick add should store the same timestamp it pushes');
assert(script.includes('void scheduleCloudSync(timestamp)'), 'quick add should schedule cloud sync without blocking the add path');
assert(!script.includes('await syncLocalDataToCloud(timestamp)'), 'quick add should not await cloud sync before reporting success');
assert(script.includes('fetchWithTimeout'), 'quick add should time-box website metadata fetching');
assert(script.includes('WEBSITE_INFO_TIMEOUT_MS'), 'quick add should keep metadata lookup on a short timeout');
assert(script.includes("u.searchParams.get('open_after_add') === '1'"), 'quick add should read the open-after-add flag');
assert(script.includes('if (ok && !openAfterAdd)'), 'quick add should only auto-close when the flag is off');
const keepOpenBranch = script.match(/\} else if \(ok\) \{([\s\S]*?)\n    \} else \{/);
assert(keepOpenBranch && keepOpenBranch[1].includes("location.replace(location.pathname || '/')"), 'quick add should reload the clean GoTab page when it is kept open');
