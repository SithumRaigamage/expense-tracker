/**
 * Serves the production build the way it is actually deployed, so the PWA can
 * be installed and tested locally.
 *
 * Why this exists: `ng serve` disables the service worker (see the `isDevMode()`
 * guard on provideServiceWorker in app.config.ts), so no browser will ever offer
 * to install the app from :4200. Chrome only shows the install affordance for a
 * production build, served from a secure context, with a live service worker —
 * localhost counts as secure, so no certificate is needed.
 *
 * /api is proxied to the backend so the app is served from a SINGLE origin.
 * That matters: the session cookie is SameSite=Strict, and splitting the UI and
 * the API across origins would stop the browser attaching it at all.
 *
 *   npm run build && npm run serve:prod     # then open http://localhost:4300
 *
 * Requires the backend on :3001 (PORT is configurable via API_PORT).
 */
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname, normalize } from 'path';
import { fileURLToPath } from 'url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(HERE, '..', 'dist', 'expensive-tracker-frontend', 'browser');
const PORT = Number(process.env.PORT || 4300);
const API_PORT = Number(process.env.API_PORT || 3001);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

const readBody = req =>
  new Promise(resolve => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });

const proxyToApi = async (req, res) => {
  const upstream = await fetch(`http://localhost:${API_PORT}${req.url}`, {
    method: req.method,
    headers: { ...req.headers, host: `localhost:${API_PORT}` },
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await readBody(req),
    redirect: 'manual'
  });

  const headers = {};
  // content-encoding/length are dropped: fetch has already decoded the body, so
  // forwarding them would describe bytes we are no longer sending.
  upstream.headers.forEach((value, key) => {
    if (key === 'content-encoding' || key === 'content-length') return;
    if (key === 'set-cookie') return;
    headers[key] = value;
  });
  const cookies = upstream.headers.getSetCookie?.() ?? [];
  if (cookies.length) headers['set-cookie'] = cookies;

  res.writeHead(upstream.status, headers);
  res.end(Buffer.from(await upstream.arrayBuffer()));
};

createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/api')) return await proxyToApi(req, res);

    const requested = decodeURIComponent(req.url.split('?')[0]);
    // normalize + prefix check keeps `../` out of the served path.
    let path = normalize(join(ROOT, requested));
    if (!path.startsWith(ROOT)) path = ROOT;

    try {
      if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    } catch {
      // Unknown path: hand back index.html so client-side routes deep-link.
      path = join(ROOT, 'index.html');
    }

    const data = await readFile(path);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(path)] || 'application/octet-stream',
      // The worker and its manifest must never be served stale, or an update
      // can never propagate.
      'Cache-Control': /ngsw\.json|ngsw-worker\.js|index\.html/.test(path)
        ? 'no-cache'
        : 'public, max-age=3600'
    });
    res.end(data);
  } catch (error) {
    res.writeHead(500);
    res.end(`serve-prod: ${error.message}`);
  }
}).listen(PORT, () => {
  console.log(`\n  Production build → http://localhost:${PORT}`);
  console.log(`  API proxied to    → http://localhost:${API_PORT}\n`);
});
