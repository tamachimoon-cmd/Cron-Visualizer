import test from 'node:test';
import assert from 'node:assert/strict';
import {createAppServer} from '../server.js';

test('servidor HTTP publica somente os recursos esperados', async (t) => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = 'http://127.0.0.1:' + server.address().port;

  await t.test('GET / entrega interface demonstrável', async () => {
    const response = await fetch(origin + '/');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    const html = await response.text();
    assert.match(html, /Cron Visualizer/);
    assert.match(html, /id="cron-input"/);
    assert.match(html, /id="runs-list"/);
    assert.match(html, /\/app\.js/);
    assert.doesNotMatch(html, /<script(?![^>]*src=)[^>]*>/);
  });

  await t.test('arquivos públicos e módulo de cron estão disponíveis', async () => {
    for (const path of ['/index.html', '/app.js', '/styles.css', '/src/cron.js', '/favicon.svg']) {
      const response = await fetch(origin + path);
      assert.equal(response.status, 200, path);
      assert.ok((await response.text()).length > 0, path);
    }
  });

  await t.test('healthz retorna JSON válido', async () => {
    const response = await fetch(origin + '/healthz');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {status: 'ok'});
  });

  await t.test('HEAD não retorna corpo', async () => {
    const response = await fetch(origin + '/', {method: 'HEAD'});
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '');
  });

  await t.test('métodos não permitidos retornam 405', async () => {
    const response = await fetch(origin + '/', {method: 'POST'});
    assert.equal(response.status, 405);
  });

  await t.test('caminhos fora da lista retornam 404', async () => {
    for (const path of ['/package.json', '/.git/config', '/src/secret.js', '/nada']) {
      const response = await fetch(origin + path);
      assert.equal(response.status, 404, path);
    }
  });

  await t.test('cabeçalhos de segurança são aplicados', async () => {
    const response = await fetch(origin + '/');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert.match(response.headers.get('content-security-policy'), /script-src 'self'/);
  });

  await t.test('respostas não são armazenadas em cache', async () => {
    const response = await fetch(origin + '/');
    assert.equal(response.headers.get('cache-control'), 'no-store');
  });
});
