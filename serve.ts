// Static dev server buat game Kota Cakrawala — Round 5 rewrite.
// Ditulis ulang dari nol pada 2026-11-20 (Round 5) — revisi kedua file ini.
// Melayani folder game/ di sebelah file ini, stdlib Node saja.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const gameDir = resolve(here, "game");

function pickPort(argv) {
  const at = argv.indexOf("--port");
  if (at === -1 || at + 1 >= argv.length) return 8080;
  const n = Number.parseInt(argv[at + 1], 10);
  if (!Number.isFinite(n) || n < 1 || n > 65535) return 8080;
  return n;
}

const port = pickPort(process.argv.slice(2));

const mimeByExt = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream",
  ".wasm": "application/wasm",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".txt": "text/plain; charset=utf-8",
  ".avif": "image/avif",
};

function mimeFor(filePath) {
  return mimeByExt[extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function note(req, code) {
  console.log(`${req.method} ${req.url} -> ${code}`);
}

function send(res, req, code, body, type) {
  const payload = body ?? Buffer.alloc(0);
  res.writeHead(code, {
    "content-type": type ?? "text/plain; charset=utf-8",
    "content-length": payload.length,
    "cache-control": "no-store",
  });
  res.end(payload);
  note(req, code);
}

const server = createServer(async (req, res) => {
  // Pakai raw path apa adanya (tanpa new URL) supaya segmen ".."
  // tidak dinormalisasi duluan — path.resolve di bawah yang menilai.
  const rawPath = (req.url ?? "/").split("?")[0];
  if (!rawPath.startsWith("/")) {
    send(res, req, 400, Buffer.from("bad request"));
    return;
  }

  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    send(res, req, 400, Buffer.from("bad uri"));
    return;
  }

  let target = decoded;
  if (target === "/" || target.endsWith("/")) target += "index.html";

  const resolved = resolve(gameDir, `.${sep}${target}`);
  const inside = resolved === gameDir || resolved.startsWith(gameDir + sep);
  if (!inside) {
    send(res, req, 403, Buffer.from("forbidden"));
    return;
  }

  let finalPath = resolved;
  try {
    const info = await stat(finalPath);
    if (info.isDirectory()) finalPath = join(finalPath, "index.html");
  } catch {
    send(res, req, 404, Buffer.from("not found"));
    return;
  }

  let data;
  try {
    data = await readFile(finalPath);
  } catch {
    send(res, req, 404, Buffer.from("not found"));
    return;
  }

  send(res, req, 200, data, mimeFor(finalPath));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`game/ is on http://localhost:${port}`);
});
