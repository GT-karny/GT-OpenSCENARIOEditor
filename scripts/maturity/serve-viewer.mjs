import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const port = Number(process.env.MATURITY_VIEW_PORT ?? 4173);
const base = resolve(process.cwd(), 'docs/maturity');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

function safePath(urlPath) {
  const raw = urlPath === '/' ? '/viewer.html' : urlPath;
  const normalized = normalize(raw).replace(/^(\.\.[/\\])+/, '');
  const full = resolve(join(base, normalized));
  if (!full.startsWith(base)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  const path = safePath(new URL(req.url, `http://localhost:${port}`).pathname);
  if (!path || !existsSync(path) || !statSync(path).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }
  const ext = extname(path).toLowerCase();
  const body = readFileSync(path);
  res.writeHead(200, { 'Content-Type': types[ext] ?? 'application/octet-stream' });
  res.end(body);
});

server.listen(port, () => {
  console.log(`Maturity viewer: http://localhost:${port}/`);
});
