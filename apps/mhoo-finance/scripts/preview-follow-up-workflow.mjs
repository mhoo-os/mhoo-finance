// Local-only preview of the removable synthetic adapter through the production view contract.
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, '.twenty/follow-up-preview');
const themeRoot = resolve(root, '../../../twenty-ui/src/theme-constants');
await mkdir(output, { recursive: true });
await build({
  stdin: {
    contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
      import {FinanceWorkspace} from './src/components/finance-workspace';
      import {createFollowUpTestHost,FIXTURE_IDS} from './src/__tests__/fixtures/follow-up-test-host';
      import 'twenty-ui/style.css';
      document.documentElement.className=new URLSearchParams(location.search).get('theme')==='dark'?'dark':'light';
      const key='finance-follow-up-local-synthetic-v1';
      const host=createFollowUpTestHost({tasks:JSON.parse(localStorage.getItem(key)||'{}'),saved:tasks=>localStorage.setItem(key,JSON.stringify(tasks))});
      const services={read:host.read,client:host.client};
      createRoot(document.getElementById('root')).render(<><aside style={{padding:12}}>Local synthetic workflow · no live Workspace, files or mailbox. Person: {FIXTURE_IDS.person} · Reply note: {FIXTURE_IDS.note}<button onClick={()=>{host.control.denied=!host.control.denied;document.getElementById('denial').textContent=host.control.denied?'Denial on':'Denial off';}}>Toggle denial</button><span id="denial">Denial off</span><button onClick={()=>{localStorage.removeItem(key);location.reload();}}>Reset synthetic Tasks</button></aside>{new URLSearchParams(location.search).has('static')?<FinanceWorkspace initialView="followups" dataSource="synthetic"/>:<FinanceWorkspace initialView="followups" services={services}/>}</>);`,
    resolveDir: root,
    loader: 'tsx',
  },
  bundle: true,
  outfile: resolve(output, 'app.js'),
  platform: 'browser',
  format: 'esm',
  jsx: 'automatic',
  alias: { src: resolve(root, 'src') },
  define: {
    'process.env.NODE_ENV': '"development"',
    'process.env': '{}',
  },
});
const themeCss = `${await readFile(resolve(themeRoot, 'theme-light.css'), 'utf8')}\n${await readFile(resolve(themeRoot, 'theme-dark.css'), 'utf8')}\nbody{margin:0;padding:24px;background:var(--t-background-primary);color:var(--t-font-color-primary);font-family:var(--t-font-family)}`;
await writeFile(resolve(output, 'theme.css'), themeCss);
await writeFile(
  resolve(output, 'index.html'),
  '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>mhoo Finance · isolated synthetic preview</title><link rel="stylesheet" href="/theme.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>',
);
process.stdout.write(
  'Built registered Finance front-component source at ' + output + '\n',
);
if (!process.argv.includes('--build-only')) {
  const routes = {
    '/': ['index.html', 'text/html'],
    '/app.js': ['app.js', 'text/javascript'],
    '/theme.css': ['theme.css', 'text/css'],
  };
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
    const route = routes[pathname];
    if (request.method !== 'GET' || !route) {
      response.writeHead(404);
      response.end();
      return;
    }
    try {
      const content = await readFile(resolve(output, route[0]));
      response.writeHead(200, {
        'Content-Type': route[1],
        'Cache-Control': 'no-store',
      });
      response.end(content);
    } catch {
      response.writeHead(500);
      response.end('Preview unavailable');
    }
  });
  server.listen(4347, '127.0.0.1', () =>
    process.stdout.write(
      'Local synthetic Finance workflow preview http://127.0.0.1:4347 · PID ' +
        process.pid +
        '\n',
    ),
  );
}
