// serve.ts — Kota Cakrawala round 8 rebuild: server file statis
// (Node 22 stdlib). Melayani folder game/ di sebelah file ini supaya
// game bisa dimainkan dan di-screenshot secara lokal.
// Cara pakai: node serve.ts [--port 8080].
//  - "/" melayani game/index.html.
//  - Path apa pun di bawah game/ dilayani dengan MIME yang tepat.
//  - Traversal ("..") ditolak 403, file hilang 404, URI rusak 400.
//    Setiap request dicatat dalam satu baris singkat.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(join(fileURLToPath(new URL('.', import.meta.url)), 'game'));

const MIME: Record<string, string> = {
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
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
};

function pickPort(argv: string[]): number {
  const at = argv.indexOf('--port');
  if (at < 0 || at + 1 >= argv.length) return 8080;
  const n = Number(argv[at + 1]);
  if (!Number.isInteger(n) || n < 1 || n > 65535) return 8080;
  return n;
}

const port = pickPort(process.argv.slice(2));

const server = createServer(async (req, res) => {
  const stamp = new Date().toISOString();
  try {
    const raw = req.url ?? '/';
    // Tolak traversal SEBELUM new URL() menormalisasi ".." hilang.
    const rawPath = raw.split('?')[0];
    let decodedRaw: string;
    try {
      decodedRaw = decodeURIComponent(rawPath);
    } catch {
      res.writeHead(400, { 'content-type': 'text/plain' });
      res.end('400 bad request\n');
      console.log(`${stamp} ${req.method} ${raw} -> 400`);
      return;
    }
    if (decodedRaw.split('/').includes('..')) {
      res.writeHead(403, { 'content-type': 'text/plain' });
      res.end('403 forbidden\n');
      console.log(`${stamp} ${req.method} ${raw} -> 403`);
      return;
    }
    let path: string;
    try {
      path = decodeURIComponent(new URL(raw, 'http://localhost').pathname);
    } catch {
      res.writeHead(400, { 'content-type': 'text/plain' });
      res.end('400 bad request\n');
      console.log(`${stamp} ${req.method} ${raw} -> 400`);
      return;
    }
    if (path === '/') path = '/index.html';
    const file = resolve(join(ROOT, `.${sep}${path.replace(/^\/+/, '')}`));
    if (file !== ROOT && !file.startsWith(ROOT + sep)) {
      res.writeHead(403, { 'content-type': 'text/plain' });
      res.end('403 forbidden\n');
      console.log(`${stamp} ${req.method} ${raw} -> 403`);
      return;
    }
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream' });
    res.end(data);
    console.log(`${stamp} ${req.method} ${raw} -> 200 (${data.length} B)`);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'EISDIR') {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('404 not found\n');
      console.log(`${stamp} ${req.method} ${req.url} -> 404`);
    } else {
      res.writeHead(500, { 'content-type': 'text/plain' });
      res.end('500 internal error\n');
      console.log(`${stamp} ${req.method} ${req.url} -> 500 ${String(err)}`);
    }
  }
});

server.listen(port, () => {
  console.log(`Kota Cakrawala static server on http://localhost:${port}/ (serving ${ROOT})`);
});
