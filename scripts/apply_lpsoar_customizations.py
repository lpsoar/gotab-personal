#!/usr/bin/env python3
from pathlib import Path
import hashlib, json, shutil, sys

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / 'web'
ASSETS = WEB / 'assets'
MANIFEST = WEB / 'hash-manifest.json'
BIN = ROOT / 'gotab-server-linux-amd64'

# Files we intentionally edit. Keep this list small: upstream uses runtime integrity checks.
files = [
    ASSETS / 'siteConfig-D1I3gVDU.js',
    ASSETS / 'userInfo-CWxnAXWF.js',
    ASSETS / 'layout-B6i-OvgA.js',
    ASSETS / 'console-DllRtpYP.js',
    ASSETS / 'main-DNxfCH0R.js',
    ASSETS / 'markdownPageEdit-C7g4gvP1.js',
    ASSETS / 'cardShow-Dtx_p54u.js',
    ASSETS / 'emailSet-BocTzxks.js',
    ASSETS / 'functionSwitch-CBfQjpyB.js',
    ASSETS / 'recommendApp-DD0xIhG4.js',
    ASSETS / 'aboutUs-Bk3ey0K0.js',
    ASSETS / 'donate-DPgsHD_T.js',
    ASSETS / 'donate-DqTIx8xr.js',
]

# Conservative textual patches against minified bundles.
# They are intentionally simple and idempotent.
replacements = {
    'siteConfig-D1I3gVDU.js': [
        ('l="close"!==a.userRegister', 'l=!1'),
    ],
    'userInfo-CWxnAXWF.js': [
        ('b=Ot&&(0,qr.jsx)(I,{type:"link",onClick:()=>{o("register")},className:"px-2",children:"没有账号？立即注册"})', 'b=null'),
        ('x=(0,qr.jsx)(I,{type:"link",onClick:()=>{o("findPassword")},className:"px-2",children:"找回密码"})', 'x=null'),
        ('${Ot?"justify-between":"justify-end"} w-full', 'justify-end w-full'),
        ('children:"GOTAB"', 'children:"Private GoTab"'),
        ('aria-label":"前往 GOTAB 官网（新标签页打开）"', 'aria-label":"Private GoTab"'),
        ('children:["POWERED BY",f,x]', 'children:["PRIVATE",f,x]'),
        ('"login"===n?"登录享有更多服务":"register"===n?"欢迎您的注册体验":"遗失密码？即刻找回"', '"登录"'),
        ('function an(e){"Enter"!==e.key&&" "!==e.key||ne("https://gotab.cn")}function ln(){ne("https://gotab.cn")}', 'function an(e){}function ln(){}'),
    ],
    'layout-B6i-OvgA.js': [
        ('Ca={label:"捐赠打赏",content:(0,be.jsx)(x,{value:fn,checkedChildren:"显示",unCheckedChildren:"隐藏",onChange:ba})}', 'Ca=null'),
        ('fa=[Qt,na,aa,oa,sa,ua,ha,ma,Ca,va]', 'fa=[Qt,na,aa,oa,sa,ua,ha,ma,va]'),
    ],
    'console-DllRtpYP.js': [
        ('Me={key:"console/emailSet",label:"邮件服务",icon:(0,Te.jsx)(A,{})}', 'Me=null'),
        ('Le={key:"console/donate",label:"打赏捐赠",icon:(0,Te.jsx)(F,{})}', 'Le=null'),
        ('He=[ee,te,oe,le,ne,ce,me,fe,he,pe,Ce,ue,ye,xe,ge,ve,Se,_e,we,Ne,ke,Me,Le,{key:"console/dataClean",label:"数据清理",icon:(0,Te.jsx)(Pe,{}),danger:!0}]', 'He=[ee,te,oe,le,ne,ce,me,fe,he,pe,Ce,ue,ye,xe,ge,ve,Se,_e,we,Ne,ke,{key:"console/dataClean",label:"数据清理",icon:(0,Te.jsx)(Pe,{}),danger:!0}]'),
    ],
    'main-DNxfCH0R.js': [
        ('T=(0,yr.useMemo)(()=>({icon:(0,_o.jsx)(en,{}),onClick:Mh,tooltip:"捐赠打赏"}),[])', 'T=null'),
        ('"捐赠打赏"', '""'),
    ],
    'markdownPageEdit-C7g4gvP1.js': [
        ('options:[{label:"关于我们",value:"aboutUs"},{label:"捐赠打赏",value:"donate"}]', 'options:[{label:"关于我们",value:"aboutUs"}]'),
        ('"aboutUs"===a?u.getAboutUsContent:u.getDonateContent', 'u.getAboutUsContent'),
        ('"aboutUs"===a?f(t.data.aboutUs):', 'f(t.data.aboutUs);'),
    ],
    'cardShow-Dtx_p54u.js': [
        ('{key:"donate",label:"捐赠打赏",icon:(0,za.jsx)(In,{})},', ''),
        ('rd=[{type:"divider"}', 'rd=[];/* daily treasure removed */var __lp_rd=[{type:"divider"}'),
        ('label:"每日宝藏"', 'label:""'),
        ('children:"捐赠打赏"', 'children:""'),
    ],
    'emailSet-BocTzxks.js': [
        ('"更新用于用户注册的邮箱验证码发送验证的邮件服务器配置，推荐使用：阿里企业邮箱或者微信企业邮箱"', '"本私有版不开放注册，不需要配置邮件服务"'),
    ],
    'functionSwitch-CBfQjpyB.js': [
        ('C=(0,y.jsx)(u.Item,{name:"userRegister",label:"用户注册服务",required:!0,rules:V,children:(0,y.jsx)(m.Group,{options:[{label:"启用（需配置邮件服务）",value:"open"},{label:"关闭",value:"close"}]})})', 'C=(0,y.jsx)(u.Item,{name:"userRegister",label:"用户注册服务",required:!0,rules:V,children:(0,y.jsx)(m.Group,{options:[{label:"关闭",value:"close"}],disabled:!0})})'),
    ],
    'recommendApp-DD0xIhG4.js': [
        ('"应用推荐将展示在 “ 每日宝藏 ” 中，服务端设置了 5 分钟缓存，如需查看最新的 “ 每日宝藏 ” 列表，请等待缓存失效或重启服务"', '"本私有版已关闭应用推荐展示"'),
    ],
    'aboutUs-Bk3ey0K0.js': [
        ('"QQ 群"', '""'),
        ('"邮箱"', '""'),
        ('"gotab.cn"', '""'),
    ],
    'donate-DPgsHD_T.js': [
        ('https://afdian.com/a/doxwant', '#'),
        ('https://www.gotab.cn', '#'),
        ('爱发电', ''),
    ],
    'donate-DqTIx8xr.js': [
        ('https://afdian.com/a/doxwant', '#'),
        ('https://www.gotab.cn', '#'),
        ('爱发电', ''),
    ],
}

# Backend route hard-disable by changing registered paths to same-length private 404 paths.
# The binary contains both routed paths (without /api) and frontend/API strings (with /api).
binary_replacements = {
    b'/api/register': b'/api/_no_regx',
    b'/register': b'/_no_regx',
    b'/api/emailCode': b'/api/_no_mailx',
    b'/emailCode': b'/_no_mailx',
    b'/api/findPassword': b'/api/_no_passwdxx',
    b'/findPassword': b'/_no_passwdxx',
    b'/api/findPasswordEmailCode': b'/api/_no_find_mail_codexxx',
    b'/findPasswordEmailCode': b'/_no_find_mail_codexxx',
}

# First apply text replacements.
changed = []
for path in files:
    if not path.exists():
        print(f'WARN missing {path.relative_to(ROOT)}')
        continue
    text = path.read_text(errors='ignore')
    original = text
    for old, new in replacements.get(path.name, []):
        if old in text:
            text = text.replace(old, new)
        elif new not in text:
            print(f'WARN pattern not found in {path.name}: {old[:80]}')
    if text != original:
        path.write_text(text)
        changed.append(path)

# Update manifest for every changed web file.
manifest = json.loads(MANIFEST.read_text())
old_hashes = {k: v for k, v in manifest.items()}
for path in changed:
    rel = path.relative_to(WEB).as_posix()
    manifest[rel] = hashlib.sha256(path.read_bytes()).hexdigest()
MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')

# Patch binary route strings and embedded hash manifest.
data = BIN.read_bytes()
for old, new in binary_replacements.items():
    if len(old) != len(new):
        raise SystemExit(f'binary replacement length mismatch: {old} {new}')
    count = data.count(old)
    if count:
        data = data.replace(old, new)
        print(f'binary route patched {old.decode()} -> {new.decode()} x{count}')
    elif new not in data:
        print(f'WARN binary route not found: {old!r}')

# Replace any old 64-char hashes that changed.
for rel, old_hash in old_hashes.items():
    new_hash = manifest.get(rel)
    if new_hash and new_hash != old_hash:
        old = old_hash.encode()
        new = new_hash.encode()
        count = data.count(old)
        if count:
            data = data.replace(old, new)
            print(f'binary hash patched {rel} x{count}')
        elif new not in data:
            print(f'WARN binary embedded old hash not found for {rel}')
BIN.write_bytes(data)

print('changed files:')
for path in changed:
    print('-', path.relative_to(ROOT))
