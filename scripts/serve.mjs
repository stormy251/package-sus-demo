// tiny static server for local testing: node scripts/serve.mjs [port]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
createServer(async (req, res) => {
    const p = new URL(req.url, 'http://x').pathname.replace(/\/$/, '/index.html');
    try { const f = path.join(root, p); if (!f.startsWith(root)) throw 0; const buf = await readFile(f); res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(buf); } catch { res.writeHead(404); res.end('not found'); }
}).listen(Number(process.argv[2] || 8123), () => console.log('http://localhost:' + (process.argv[2] || 8123)));
