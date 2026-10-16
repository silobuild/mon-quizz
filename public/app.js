const app = document.getElementById('app');
const LAB = { o: 'Oui', n: 'Non', m: 'Peut-être / je ne sais pas' };
const PK = Object.keys(PROFILS);
const byId = id => Q.find(q => q.id === id);
const txt = (q, s) => typeof q.t === 'function' ? q.t(s) : q.t;
let s;

const fresh = nom => ({ nom, a: {}, log: [], pts: Object.fromEntries(PK.map(p => [p, 0])), h: {}, rej: [], queue: [], early: false, id: null, verdict: null });

// P1 n'est éligible que si la réponse à Q24 (rebeu) est Oui (condition vérifiée une fois Q24 posée)
const elig = (s, p) => p !== 'P1' || !('24' in s.a) || s.a['24'] === 'o';

const sorted = s => {
  const sub = p => ['12', '13', '13b', '14', '15', '16', '17', '18', '19', '20'].reduce((t, i) => t + ((s.h[i] || {})[p] || 0), 0);
  const tb = p => ((s.h['16'] || {})[p] || 0) + ((s.h['17'] || {})[p] || 0);
  const o = [...PK].sort((x, y) => s.pts[y] - s.pts[x] || sub(y) - sub(x) || tb(y) - tb(x));
  return [...o.filter(p => elig(s, p)), ...o.filter(p => !elig(s, p))];
};

function nextQ() {
  if (s.queue.length) return byId(s.queue[0]);
  for (const q of Q) {
    if (q.id in s.a) continue;
    if (q.skip && q.skip(s)) continue;
    if (s.early && ['18', '19', '20'].includes(q.id)) continue;
    if (q.id === '25' && s.log.length >= 24) continue;
    return q;
  }
  return null;
}

function answer(q, a) {
  s.a[q.id] = a;
  s.log.push({ q: q.id, t: txt(q, s), r: LAB[a] });
  const add = a === 'o' ? q.o : a === 'n' ? q.n : {};
  s.h[q.id] = add;
  for (const p in add) s.pts[p] += add[p];
  if (s.queue[0] === q.id) s.queue.shift();
  if (q.id === '17') { const o = sorted(s); s.early = s.pts[o[0]] - s.pts[o[1]] >= 12; }
  step();
}

function signalement() {
  const a = s.a, p = [];
  const orig = [['21', 'renoi'], ['23', 'asiat'], ['24', 'rebeu']].find(([q]) => a[q] === 'o');
  const blanc = a['25'] === 'o' || (!('25' in a) && ['21', '23', '24'].every(q => a[q] === 'n'));
  const who = [orig ? orig[1] : blanc ? 'blanc' : null, a['22'] === 'o' ? 'du même âge' : a['22'] === 'n' ? "d'un âge différent" : null].filter(Boolean);
  p.push('Une personne' + (who.length ? ' ' + who.join(', ') : ''));
  const ep = a['7a'] === 'o' ? 'au collège' : a['7a'] === 'n' ? 'au lycée' : a['7b'] === 'o' ? 'pendant tes études' : a['7b'] === 'n' ? 'plus tard' : null;
  if (ep) p.push('rencontrée ' + ep);
  if (a['8'] === 'n') p.push('en banlieue ' + (a['9'] === 'n' ? 'nord/est' : 'ouest/sud') + (a['10'] === 'o' ? ' (ville proche)' : ''));
  else if (a['8']) p.push('à Paris, ' + (a['9'] === 'n' ? (a['10'] === 'n' ? 'centre/ouest' : 'Est parisien') : (a['10'] === 'n' ? '7e/13e/15e' : '5e/6e/14e')));
  if (a['11']) p.push(a['11'] === 'o' ? "autour de l'établissement" : 'lors de sorties');
  if (a['26']) p.push(a['26'] === 'o' ? 'toujours en contact' : 'plus en contact');
  return p.join(', ') + '.';
}

const leader = () => sorted(s).find(p => elig(s, p) && !s.rej.includes(p));

function persist() {
  const o = sorted(s);
  return fetch('/api/save', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: s.id, tok: s.tok, nom: s.nom, answers: s.log, ranking: o.map(p => ({ p, titre: PROFILS[p].t, pts: s.pts[p] })), winner: leader(), sig: signalement(), verdict: s.verdict })
  }).then(r => r.json()).then(r => { s.id = r.id; s.tok = r.tok; }).catch(() => {});
}

const el = (tag, text, cls, fn) => { const e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; if (fn) e.onclick = fn; return e; };

function start() {
  s = null; app.replaceChildren();
  const i = el('input'); i.placeholder = 'Nom'; i.autocomplete = 'off'; i.maxLength = 60;
  const b = el('button', 'Commencer', 'go', () => { if (!i.value.trim()) return i.focus(); s = fresh(i.value.trim()); step(); });
  i.onkeydown = e => { if (e.key === 'Enter') b.click(); };
  app.append(i, b); i.focus();
}

function step() {
  const q = nextQ();
  if (!q) return result();
  app.replaceChildren(el('h1', txt(q, s)), ...['o', 'n', 'm'].map(a => el('button', LAB[a], '', () => answer(q, a))));
}

function result() {
  const p = leader(), P = PROFILS[p];
  persist();
  const box = [el('h1', P.t), el('p', P.d)];
  if (s.verdict === 'juste') return app.replaceChildren(...box, el('button', 'Recommencer', '', start));
  app.replaceChildren(...box,
    el('button', "C'est juste ?", 'go', () => { s.verdict = 'juste'; persist(); result(); }),
    el('button', "C'est faux ?", '', () => {
      s.rej.push(p); s.verdict = 'faux';
      const nxt = leader();
      if (!nxt) return result();
      s.queue = (CORR[nxt] || []).filter(id => !(id in s.a) && !(byId(id).skip && byId(id).skip(s))).slice(0, 2);
      step();
    }));
}

start();