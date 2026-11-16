#!/usr/bin/env python3
"""Cache-busting: add ?v=<content hash> to every local CSS/JS link in index.html.
Run before every commit (GitHub Pages lets browsers cache files for 10 minutes; without a stamp a
browser can mix a new index.html with an old styles.css/app.js and the page breaks).
Usage: python3 tools/stamp.py        (rewrites index.html)
       python3 tools/stamp.py --check (exit 1 if a stamp is missing or stale)"""
import hashlib, os, re, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = os.path.join(root, 'index.html')
html = open(path, encoding='utf-8').read()
bad = []
def stamp(m):
    attr, url = m.group(1), m.group(2)
    file = url.split('?')[0]
    if re.match(r'^(https?:)?//', file) or not re.search(r'\.(css|js)$', file): return m.group(0)
    v = hashlib.sha1(open(os.path.join(root, file), 'rb').read()).hexdigest()[:10]
    new = f'{file}?v={v}'
    if url != new: bad.append(f'{file}: {url} -> {new}')
    return f'{attr}="{new}"'
out = re.sub(r'\b(src|href)="([^"]+)"', stamp, html)
if '--check' in sys.argv:
    print('stamps OK' if not bad else 'STALE:\n' + '\n'.join(bad)); sys.exit(1 if bad else 0)
open(path, 'w', encoding='utf-8').write(out)
print('\n'.join(bad) or 'already up to date')
