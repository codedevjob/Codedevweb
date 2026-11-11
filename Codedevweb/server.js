// CodeDev Local Server — run with: node server.js
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml',
  '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml'
};

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // POST /api/save — write updated JSON to disk
  if (req.method === 'POST' && req.url === '/api/save') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { file, data } = JSON.parse(body);
        if (!['data/jobs.json', 'data/referrals.json'].includes(file)) {
          res.writeHead(403); res.end(JSON.stringify({ error: 'Forbidden' })); return;
        }
        fs.writeFileSync(path.join(ROOT, file), JSON.stringify(data, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Serve static files
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  // Rewrite /job/<slug>/ → /job/index.html
  if (/^\/job\/[^/]+\/?$/.test(urlPath)) urlPath = '/job/index.html';

  // Clean URLs: /jobs/ → /jobs/index.html
  if (!path.extname(urlPath)) urlPath = urlPath.replace(/\/?$/, '/index.html');

  const filePath = path.join(ROOT, urlPath);
  fs.readFile(filePath, (err, content) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'text/plain' });
    res.end(content);
  });

}).listen(PORT, () => {
  console.log(`\n✅ CodeDev running at http://localhost:${PORT}`);
  console.log(`   Admin:  http://localhost:${PORT}/admin/`);
  console.log(`   Jobs:   http://localhost:${PORT}/jobs/`);
  console.log(`\n   Press Ctrl+C to stop\n`);
});
