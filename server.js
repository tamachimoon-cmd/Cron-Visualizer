import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const assets = new Map([
  ['/', ['public/index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['public/index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['public/app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['public/styles.css', 'text/css; charset=utf-8']],
  ['/src/cron.js', ['src/cron.js', 'text/javascript; charset=utf-8']],
  ['/favicon.svg', ['public/favicon.svg', 'image/svg+xml']]
]);

const headers = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'x-frame-options': 'DENY',
  'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
};

export function createAppServer() {
  return http.createServer(async (request, response) => {
    const respond = (status, body, type = 'text/plain; charset=utf-8') => {
      response.writeHead(status, {...headers, 'content-type': type, 'cache-control': 'no-store'});
      response.end(request.method === 'HEAD' ? undefined : body);
    };
    if (!['GET', 'HEAD'].includes(request.method)) return respond(405, 'Method not allowed');
    let pathname;
    try { pathname = new URL(request.url, 'http://localhost').pathname; }
    catch { return respond(400, 'Bad request'); }
    if (pathname === '/healthz') return respond(200, JSON.stringify({status: 'ok'}), 'application/json; charset=utf-8');
    const asset = assets.get(pathname);
    if (!asset) return respond(404, 'Not found');
    try {
      const bytes = await readFile(fileURLToPath(new URL('./' + asset[0], import.meta.url)));
      return respond(200, bytes, asset[1]);
    } catch {
      return respond(500, 'Internal server error');
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT inválida.');
  createAppServer().listen(port, '0.0.0.0', () => console.log('Cron Visualizer na porta ' + port));
}
