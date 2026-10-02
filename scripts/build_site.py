"""Package only static game assets; no runtime dependencies or backend."""
from pathlib import Path
import hashlib
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist'
FILES = ['index.html', 'manifest.json', 'service-worker.js']
FILES += [str(p.relative_to(ROOT)).replace('\\', '/') for folder in ('css', 'js', 'data', 'assets') for p in sorted((ROOT / folder).rglob('*')) if p.is_file()]
for name in FILES:
    source = ROOT / name
    if source.suffix in ('.html', '.css', '.js', '.json', '.svg'):
        text = source.read_text(encoding='utf-8')
        if re.search(r'(?i)(?:\b[a-z]:[\\/]|file://|https?://(?:localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+))', text):
            raise ValueError(f'Local filesystem / host reference: {name}')
    destination = OUT / name
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)
# Keep service-worker updates automatic when any shipped asset changes.
digest = hashlib.sha256(b''.join((ROOT / name).read_bytes() for name in sorted(FILES))).hexdigest()[:16]
worker = OUT / 'service-worker.js'
worker.write_text(worker.read_text(encoding='utf-8').replace('husband-bonk-pages-v2-', f'husband-bonk-pages-{digest}-'), encoding='utf-8')
(OUT / '.nojekyll').touch()
# Exclude stale files from previous builds without deleting outside dist.
expected = set(FILES) | {'.nojekyll'}
for path in OUT.rglob('*'):
    if path.is_file() and path.relative_to(OUT).as_posix() not in expected:
        path.unlink()
print(f'Production static site: {OUT} ({len(FILES)} assets)')
