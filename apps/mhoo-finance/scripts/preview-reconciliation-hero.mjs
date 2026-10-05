// Isolated synthetic prototype. It does not change or query a Twenty Workspace.
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, '.twenty/reconciliation-preview');
await mkdir(output, { recursive: true });
await build({
  stdin: {
    contents: "import React from 'react'; import {createRoot} from 'react-dom/client'; import {ReconciliationHeroPrototype} from './src/prototypes/reconciliation-hero'; createRoot(document.getElementById('root')).render(<ReconciliationHeroPrototype />);",
    resolveDir: root,
    loader: 'tsx',
  },
  bundle: true,
  outfile: resolve(output, 'app.js'),
  platform: 'browser',
  format: 'esm',
  jsx: 'automatic',
  alias: { src: resolve(root, 'src') },
  define: { 'process.env.NODE_ENV': '"development"', 'process.env': '{}' },
});
await writeFile(output + '/index.html', '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Finance · reconciliation hero prototype</title><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
process.stdout.write(`Built synthetic reconciliation prototype at ${output}\n`);
if (!process.argv.includes('--build-only')) {
  createServer(async (request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
    if (request.method !== 'GET' || !['/', '/app.js', '/app.css'].includes(pathname)) {
      response.writeHead(404); response.end(); return;
    }
    const file = pathname === '/' ? 'index.html' : pathname.slice(1);
    try {
      response.writeHead(200, { 'Content-Type': pathname.endsWith('.js') ? 'text/javascript' : pathname.endsWith('.css') ? 'text/css' : 'text/html', 'Cache-Control': 'no-store' });
      response.end(await readFile(resolve(output, file)));
    } catch { response.writeHead(500); response.end('Preview unavailable'); }
  }).listen(4332, '127.0.0.1', () => process.stdout.write('Prototype http://127.0.0.1:4332\n'));
}
