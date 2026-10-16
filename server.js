
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const KEY = process.env.ADMIN_KEY || 'admin';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PUB = path.join(__dirname, 'public');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Variables Supabase manquantes.');
  process.exit(1);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8'
};

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

async function supabase(endpoint, options = {}) {
  const response = await fetch(
    `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${endpoint}`,
    {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  }

  const content = await response.text();
  return content ? JSON.parse(content) : null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
      if (body.length > 100000) {
        req.destroy();
        reject(new Error('Requête trop volumineuse'));
      }
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });

    req.on('error', reject);
  });
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');

  const json = (data, status = 200) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(data));
  };

  try {
    if (u.pathname === '/api/save' && req.method === 'POST') {
      const b = await readBody(req);

      const id = b.id
        ? String(b.id)
        : require('crypto').randomUUID();

      const existing = b.id
        ? await supabase(
            `quiz_results?select=data&id=eq.${encodeURIComponent(id)}`
          )
        : [];

      const previous = existing[0]?.data || {};

      const data = {
        ...previous,
        id,
        date: previous.date || new Date().toISOString(),
        nom: String(b.nom || '').slice(0, 60),
        answers: b.answers,
        ranking: b.ranking,
        winner: b.winner,
        sig: b.sig,
        verdict: b.verdict || null
      };

      await supabase('quiz_results?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ id, data })
      });

      return json({ id });
    }

    if (u.pathname === '/api/results') {
      if (u.searchParams.get('key') !== KEY) {
        return json({ error: 'key' }, 401);
      }

      const rows = await supabase(
        'quiz_results?select=data&order=created_at.desc'
      );

      return json(rows.map(row => row.data));
    }

    const file = u.pathname === '/'
      ? '/index.html'
      : u.pathname === '/admin'
        ? '/admin.html'
        : u.pathname;

    const target = path.resolve(PUB, '.' + file);

    if (
      !target.startsWith(PUB + path.sep) ||
      !fs.existsSync(target) ||
      fs.statSync(target).isDirectory()
    ) {
      res.writeHead(404);
      return res.end();
    }

    res.writeHead(200, {
      'Content-Type': types[path.extname(target)] || 'application/octet-stream'
    });

    fs.createReadStream(target).pipe(res);

  } catch (error) {
    console.error('Erreur serveur :', error.message);

    if (!res.headersSent) {
      json({ error: 'Erreur serveur' }, 500);
    } else {
      res.end();
    }
  }
}).listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
