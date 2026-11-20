// Kota Cakrawala — Round 6 rebuild (2026-11-20).
// Static file server for game/ (Node 22 stdlib only, no dependencies).
// Usage: node serve.ts [--port 8080]
//   --port abc, or a port outside 1..65535, falls back to 8080.
// Serves / as game/index.html, files under game/ with correct MIME
// types, 403 on path traversal, 404 on missing files, 400 on bad URIs.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(join(fileURLToPath(new URL('.', import.meta.url)), 'game'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
};

function pickPort(argv) {
  const idx = argv.indexOf('--port');
  if (idx === -1) return 8080;
  const n = Number(argv[idx + 1]);
  if (!Number.isInteger(n) || n < 1 || n > 65535) return 8080;
  return n;
}

const port = pickPort(process.argv.slice(2));

const server = createServer(async (req, res) => {
  const stamp = new Date().toISOString();
  try {
    const raw = req.url || '/';
    const pathOnly = raw.split('?')[0].split('#')[0];
    let decoded;
    try {
      decoded = decodeURIComponent(pathOnly);
    } catch {
      res.writeHead(400, { 'content-type': 'text/plain' });
      res.end('400 bad request\n');
      console.log(`[${stamp}] ${req.method} ${raw} -> 400`);
      return;
    }
    if (decoded.includes('..')) {
      res.writeHead(403, { 'content-type': 'text/plain' });
      res.end('403 forbidden\n');
      console.log(`[${stamp}] ${req.method} ${raw} -> 403`);
      return;
    }
    const rel = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
    const file = resolve(join(ROOT, rel));
    if (file !== ROOT && !file.startsWith(ROOT + sep)) {
      res.writeHead(403, { 'content-type': 'text/plain' });
      res.end('403 forbidden\n');
      console.log(`[${stamp}] ${req.method} ${raw} -> 403`);
      return;
    }
    let info;
    try {
      info = await stat(file);
    } catch {
      info = null;
    }
    if (!info || !info.isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('404 not found\n');
      console.log(`[${stamp}] ${req.method} ${raw} -> 404`);
      return;
    }
    const body = await readFile(file);
    const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': type, 'content-length': body.length });
    res.end(body);
    console.log(`[${stamp}] ${req.method} ${raw} -> 200 ${body.length}B`);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('500 internal error\n');
    console.log(`[${stamp}] ${req.method} ${req.url} -> 500 ${err.message}`);
  }
});

server.listen(port, () => {
  console.log(`Kota Cakrawala server on http://localhost:${port} (serving game/)`);
});
