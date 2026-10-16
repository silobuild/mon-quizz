const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000;
const KEY = process.env.ADMIN_KEY || 'admin';
const PUB = path.join(__dirname, 'public');
const DB = path.join(__dirname, 'data', 'results.json');
fs.mkdirSync(path.dirname(DB), { recursive: true });
const load = () => { try { return JSON.parse(fs.readFileSync(DB, 'utf8')); } catch { return []; } };
const save = d => fs.writeFileSync(DB, JSON.stringify(d, null, 2));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const readBody = req => new Promise(r => { let b = ''; req.on('data', c => b += c); req.on('end', () => { try { r(JSON.parse(b)); } catch { r({}); } }); });

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const json = (o, c = 200) => { res.writeHead(c, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };

  if (u.pathname === '/api/save' && req.method === 'POST') {
    const b = await readBody(req);
    const all = load();
    let e = b.id && all.find(x => x.id === b.id);
    if (!e) { e = { id: all.reduce((m, x) => Math.max(m, x.id), 0) + 1, date: new Date().toISOString() }; all.push(e); }
    Object.assign(e, { nom: String(b.nom || '').slice(0, 60), answers: b.answers, ranking: b.ranking, winner: b.winner, sig: b.sig, verdict: b.verdict || null });
    save(all);
    return json({ id: e.id });
  }
  if (u.pathname === '/api/results') {
    if (u.searchParams.get('key') !== KEY) return json({ error: 'key' }, 401);
    return json(load().reverse());
  }

  let f = u.pathname === '/' ? '/index.html' : u.pathname === '/admin' ? '/admin.html' : u.pathname;
  const p = path.normalize(path.join(PUB, f));
  if (!p.startsWith(PUB) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(PORT, () => console.log('http://localhost:' + PORT));
