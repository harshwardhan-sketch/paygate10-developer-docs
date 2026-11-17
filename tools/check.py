#!/usr/bin/env python3
"""Full check of the docs site. Run it after every change, before you commit:

    python3 tools/check.py           check everything; exit 1 if anything is wrong
    python3 tools/check.py --write   re-stamp index.html first, then check

Needs Python 3.8+ and Google Chrome (or Chromium). Set CHROME=/path/to/chrome if it is not found.
What it checks:
  1. files: every script/stylesheet in index.html exists, every page script is loaded, the ?v= stamps are current,
     every file is listed in the README, no access rules (CODEOWNERS), no links to the old docs sites, no "PG10" in the source;
  2. the site in a real browser (tools/selftest.js): every page and link, JavaScript errors, network calls, banned text ("dummy", ...),
     tabs and pickers, hash playground, search and phone width;
  3. the site opened straight from the file (file://), as merchants may do."""
import functools, html as htmllib, http.server, json, os, re, shutil, subprocess, sys, tempfile, threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
problems = []
def bad(where, what): problems.append(f'{where}: {what}')

if '--write' in sys.argv:
    subprocess.run([sys.executable, 'tools/stamp.py'], check=True, stdout=subprocess.DEVNULL)

# ---------- 1. files ----------
html = Path('index.html').read_text(encoding='utf-8')
refs = [u.split('?')[0] for u in re.findall(r'\b(?:src|href)="([^"#:]+\.(?:js|css))(?:\?[^"]*)?"', html)]
for r in refs:
    if not Path(r).is_file(): bad('index.html', f'loads {r}, which does not exist')
site_js = {str(p) for p in Path('.').glob('*.js')} | {str(p) for p in Path('spec').glob('*.js')} | {str(p) for p in Path('assets').glob('*.js')}
for f in sorted(site_js - set(refs)): bad(f, 'is not loaded by index.html (add a <script> line, or delete the file)')
if refs.index('spec/load.js') < max(i for i, r in enumerate(refs) if r.startswith('spec/') and r != 'spec/load.js'):
    bad('index.html', 'spec/load.js must come after the other spec/*.js files')
st = subprocess.run([sys.executable, 'tools/stamp.py', '--check'], capture_output=True, text=True)
if st.returncode: bad('index.html', 'version stamps are out of date: run python3 tools/stamp.py\n' + st.stdout)
readme = Path('README.md').read_text(encoding='utf-8')
tracked = subprocess.run(['git', 'ls-files'], capture_output=True, text=True).stdout.split() or [str(p) for p in Path('.').rglob('*') if p.is_file()]
for f in sorted(set(tracked) | site_js):
    if re.search(r'\.(js|css|py|html|json)$', f) and not f.startswith(('demos/', 'assets/')) and f'`{f}`' not in readme and f != 'index.html':
        bad('README.md', f'does not say what {f} is for (add it to the Files table)')
for f in ['CODEOWNERS', '.github/CODEOWNERS', 'docs/CODEOWNERS']:
    if Path(f).exists(): bad(f, 'access rules are not wanted: anyone may change the docs')
for f in sorted(site_js):
    s = Path(f).read_text(encoding='utf-8')
    for n, line in enumerate(s.split('\n'), 1):
        if re.search(r'document\.(paygate10|payfuture)\.|\.shtml\b', line): bad(f'{f}:{n}', 'refers to the old docs sites')
        if re.search(r'\bPG ?-?10\b', line, re.I): bad(f'{f}:{n}', 'mentions PG10')

# ---------- 2. browser self-test ----------
def chrome():
    for c in [os.environ.get('CHROME'), '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
              shutil.which('google-chrome'), shutil.which('google-chrome-stable'), shutil.which('chromium'), shutil.which('chromium-browser'), shutil.which('chrome')]:
        if c and Path(c).exists(): return c
    sys.exit('Chrome not found: install Google Chrome, or set CHROME=/path/to/chrome')

def dump(url, budget):
    with tempfile.TemporaryDirectory() as prof:
        r = subprocess.run([chrome(), '--headless=new', '--disable-gpu', '--no-first-run', '--no-sandbox', f'--user-data-dir={prof}', f'--virtual-time-budget={budget}',
                            '--window-size=1400,1000', '--dump-dom', url], capture_output=True, text=True, timeout=900)
    return r.stdout

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
print('Running the site in Chrome (every page, link and picker)… this takes a minute or two.')
dom = dump(f'http://127.0.0.1:{srv.server_address[1]}/tools/selftest.html', 600000)
srv.shutdown()
m = re.search(r'<pre id="result">(.*?)</pre>', dom, re.S)
res = json.loads(htmllib.unescape(m.group(1))) if m and m.group(1).strip() else {'fatal': 'the self-test did not finish'}
if 'fatal' in res:
    bad('self-test', res['fatal'])
else:
    for p in res['problems']: bad(p['page'], f"{p['kind']}: {p['detail']}")
    print(f"  {res['pages']} pages opened, {res['clicks']} clicks. External links: {', '.join(f'{h} ({n})' for h, n in sorted(res['external'].items())) or 'none'}")

# ---------- 3. straight from the file ----------
for route, must in [('#/legacy/payin', 'Payin'), ('#/playground', 'Signature header'), ('#/legacy/errors', '11031')]:
    d = dump((ROOT / 'index.html').as_uri() + route, 5000)
    if must not in re.sub(r'<[^>]+>', ' ', d.split('<main', 1)[-1] if '<main' in d else d): bad(f'file:// {route}', f'did not render (no "{must}")')

if problems:
    print(f'\n{len(problems)} problem(s):')
    for p in problems: print(' -', p)
    sys.exit(1)
print('\nAll checks passed.')
