#!/usr/bin/env bash
# Re-copy the MIT core from the Actor repo and re-apply the three browser patches.
# usage: scripts/sync-core.sh /path/to/package-sus-detector
set -euo pipefail
SRC="${1:?path to package-sus-detector checkout}"
cd "$(dirname "$0")/.."
rm -rf core && mkdir core
cp -r "$SRC"/src/{check.js,cvss.js,editDistance.js,http.js,license.js,scoring.js,typosquat.js,util.js,sources} core/
cp "$SRC"/data/popular-*.json data/
python3 - <<'PY'
import re
p='core/typosquat.js'; s=open(p).read()
s=s.replace("import { readFileSync } from 'node:fs';\nimport { fileURLToPath } from 'node:url';\nimport path from 'node:path';\n","")
s=re.sub(r"const dataDir = .*\n","",s)
s=re.sub(r"export function loadPopular\(ecosystem\) \{.*?\n\}\n","",s,flags=re.S)
open(p,'w').write(s)
p='core/http.js'; s=open(p).read()
s=s.replace("userAgent = process.env.PSD_USER_AGENT || DEFAULT_UA","userAgent = DEFAULT_UA")
s=s.replace("setTimeout(() => cache.delete(key), cacheTtlMs).unref()","setTimeout(() => cache.delete(key), cacheTtlMs)")
open(p,'w').write(s)
PY
