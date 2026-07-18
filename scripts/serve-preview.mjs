import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import process from 'node:process';

const port = Number(process.env.PORT ?? 4173);
const root = resolve(process.cwd(), 'dist');
const basePath = '/Kcd12b/';

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

const sendFile = (response, filePath) => {
  const extension = extname(filePath);
  response.writeHead(200, {
    'Content-Type': contentTypes[extension] ?? 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  createReadStream(filePath).pipe(response);
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);

  if (url.pathname === '/') {
    response.writeHead(302, { Location: basePath });
    response.end();
    return;
  }

  if (!url.pathname.startsWith(basePath)) {
    response.writeHead(404).end('Not found');
    return;
  }

  const relativePath = decodeURIComponent(url.pathname.slice(basePath.length)) || 'index.html';
  let filePath = resolve(root, relativePath);
  const rootPrefix = `${root}${sep}`;

  if (filePath !== root && !filePath.startsWith(rootPrefix)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = resolve(filePath, 'index.html');
  }

  if (!existsSync(filePath)) {
    if (extname(relativePath)) {
      response.writeHead(404).end('Not found');
      return;
    }
    filePath = resolve(root, 'index.html');
  }

  sendFile(response, filePath);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Production preview available at http://127.0.0.1:${port}${basePath}`);
});

const closeServer = () => server.close(() => process.exit(0));
process.on('SIGINT', closeServer);
process.on('SIGTERM', closeServer);
