/* OOP in C++ · sito di studio
 * - contenuto: content/plan.json + content/*.md (renderizzato con marked)
 * - progresso: localStorage (chiave oop-study-v1), con export/import JSON
 * Tutto l'accesso a localStorage è in try/catch: il sito funziona anche senza.
 */
(() => {
  'use strict';

  const KEY = 'oop-study-v1';
  const THEME_KEY = 'oop-study-theme';
  const app = document.getElementById('app');
  const sidebar = document.getElementById('sidebar');
  const root = document.documentElement;

  // ---------- stato ----------
  const emptyState = () => ({ done: {}, minutes: {}, notes: {} });
  function loadState() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s === 'object') return Object.assign(emptyState(), s);
    } catch (e) { /* ignora */ }
    return emptyState();
  }
  const state = loadState();
  function saveState() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignora */ }
  }

  // ---------- date ----------
  const pad = n => String(n).padStart(2, '0');
  const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayKey = () => dayKey(new Date());
  const daysAgo = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- contenuto ----------
  let plan = [];
  const md = {};          // id modulo -> testo
  const exIds = {};       // id modulo -> [ids esercizi]
  const EX_LINE = /^- \[[ x]\] ex:([\w-]+)/gm;

  async function loadContent() {
    const r = await fetch('content/plan.json', { cache: 'no-cache' });
    plan = (await r.json()).modules;
    await Promise.all(plan.map(async m => {
      try {
        const r2 = await fetch(`content/${m.id}.md`, { cache: 'no-cache' });
        md[m.id] = r2.ok ? await r2.text() : `# Modulo non trovato\n\nManca \`content/${m.id}.md\`.`;
      } catch (e) {
        md[m.id] = '# Errore di caricamento\n\nRicarica la pagina.';
      }
      exIds[m.id] = [...md[m.id].matchAll(EX_LINE)].map(x => x[1]);
    }));
  }
  const allIds = () => plan.flatMap(m => exIds[m.id] || []);
  const countDone = ids => ids.filter(i => state.done[i]).length;
  const modProgress = m => {
    const ids = exIds[m.id] || [];
    const done = countDone(ids);
    return { total: ids.length, done, pct: ids.length ? Math.round(100 * done / ids.length) : 0 };
  };

  // ---------- statistiche giornaliere ----------
  function completionsByDay() {
    const out = {};
    for (const iso of Object.values(state.done)) {
      if (typeof iso !== 'string') continue;
      const k = dayKey(new Date(iso));
      out[k] = (out[k] || 0) + 1;
    }
    return out;
  }
  function streak() {
    const c = completionsByDay();
    const active = k => (c[k] || 0) > 0 || (state.minutes[k] || 0) > 0;
    let n = 0;
    let i = active(dayKey(daysAgo(0))) ? 0 : 1;   // se oggi non c'è ancora attività, parti da ieri
    while (active(dayKey(daysAgo(i)))) { n++; i++; }
    return n;
  }
  function minutesLast(days) {
    let sum = 0;
    for (let i = 0; i < days; i++) sum += state.minutes[dayKey(daysAgo(i))] || 0;
    return sum;
  }
  const level = (count, minutes) => {
    const score = count + minutes / 30;
    if (score <= 0) return 0;
    if (score < 2) return 1;
    if (score < 4) return 2;
    if (score < 7) return 3;
    return 4;
  };

  // ---------- componenti ----------
  function statCard(icon, value, label) {
    return `<div class="stat"><b>${icon} ${value}</b><span>${label}</span></div>`;
  }
  function barChart() {
    const c = completionsByDay();
    const days = Array.from({ length: 14 }, (_, i) => daysAgo(13 - i));
    const max = Math.max(1, ...days.map(d => c[dayKey(d)] || 0));
    return `<div class="bars" role="img" aria-label="Esercizi completati per giorno, ultimi 14 giorni">${days.map(d => {
      const n = c[dayKey(d)] || 0;
      const h = n ? Math.max(6, Math.round(100 * n / max)) : 0;
      return `<div class="bar-col" title="${dayKey(d)}: ${n} esercizi">
        <div class="bar ${n ? '' : 'empty'}" style="height:${h}%"></div>
        <small>${d.getDate()}</small></div>`;
    }).join('')}</div>`;
  }
  function heatmap() {
    const c = completionsByDay();
    const cells = [];
    for (let i = 83; i >= 0; i--) {
      const d = daysAgo(i);
      const k = dayKey(d);
      const n = c[k] || 0, min = state.minutes[k] || 0;
      cells.push(`<i class="l${level(n, min)}" title="${k}: ${n} esercizi, ${min} min"></i>`);
    }
    return `<div class="heatmap" role="img" aria-label="Attività delle ultime 12 settimane">${cells.join('')}</div>`;
  }
  function moduleCard(m) {
    const p = modProgress(m);
    return `<a class="mod-card" href="#/m/${m.id}">
      <h3>${esc(m.title)}</h3>
      <p>${esc(m.desc)}</p>
      <div class="progress"><span style="width:${p.pct}%"></span></div>
      <div class="meta"><span>${p.done}/${p.total} esercizi</span><span>≈ ${m.ore} h</span></div>
    </a>`;
  }

  // ---------- viste ----------
  function renderSidebar(activeId) {
    sidebar.innerHTML = `<a class="nav-home ${activeId ? '' : 'active'}" href="#/">🏠 Dashboard</a>
      <div class="nav-label">Moduli</div>` + plan.map(m => {
        const p = modProgress(m);
        return `<a class="nav-item ${m.id === activeId ? 'active' : ''}" href="#/m/${m.id}">
          <span>${esc(m.title)}</span><span class="nav-pct">${p.pct}%</span>
          <span class="mini"><span style="width:${p.pct}%"></span></span></a>`;
      }).join('');
  }

  function renderDashboard() {
    const ids = allIds();
    const done = countDone(ids);
    const pct = ids.length ? Math.round(100 * done / ids.length) : 0;
    const nextId = ids.find(i => !state.done[i]);
    const nextMod = plan.find(m => (exIds[m.id] || []).includes(nextId));
    const today = todayKey();
    const c = completionsByDay();
    const totalHours = plan.reduce((s, m) => s + m.ore, 0);

    app.innerHTML = `
      <section class="hero">
        <div>
          <p class="eyebrow">Percorso di studio</p>
          <h1>Classi, const, riferimenti e cast in C++</h1>
          <p class="lead">Teoria essenziale, esercizi con soluzioni e un controllo automatico dei codici.
          Spunta gli esercizi mentre li completi: il progresso resta nel browser.</p>
        </div>
        <div class="ring" style="--p:${pct}" aria-label="${pct}% completato">
          <span>${pct}%</span><small>${done}/${ids.length} esercizi</small>
        </div>
      </section>

      <section class="stats">
        ${statCard('🔥', streak(), 'giorni di fila')}
        ${statCard('✅', c[today] || 0, 'esercizi oggi')}
        ${statCard('⏱️', state.minutes[today] || 0, 'minuti oggi')}
        ${statCard('📅', minutesLast(7), 'minuti ultimi 7 giorni')}
      </section>

      <section class="card next">
        ${nextId
          ? `<p><strong>Prossimo esercizio</strong><br><span class="muted">${esc(nextMod.title)} · <code class="ex-id">${esc(nextId)}</code></span></p>
             <a class="btn" href="#/m/${nextMod.id}/ex-${nextId}">Vai all'esercizio →</a>`
          : `<p><strong>🎉 Tutti gli esercizi sono completati.</strong></p>
             <a class="btn btn-ghost" href="#/m/08-esame">Ripassa l'esame integrato</a>`}
      </section>

      <section class="card">
        <h2>Registro di oggi</h2>
        <form id="log-form" class="log-form">
          <label>Minuti di studio
            <input type="number" id="log-min" min="0" max="1440" step="5" value="${state.minutes[today] || ''}" placeholder="0">
          </label>
          <label class="grow">Nota (facoltativa)
            <input type="text" id="log-note" maxlength="200" value="${esc(state.notes[today] || '')}" placeholder="Es. A1–A4 fatti, A3 da rifare">
          </label>
          <button class="btn" type="submit">Salva</button>
        </form>
        <p class="muted" style="margin:10px 0 0;font-size:13px">Gli esercizi completati oggi si contano da soli, dalle spunte.</p>
      </section>

      <section class="card">
        <h2>Progresso giornaliero</h2>
        <p class="muted" style="margin:0">Esercizi completati per giorno, ultimi 14 giorni</p>
        ${barChart()}
        <h3>Calendario · ultime 12 settimane</h3>
        ${heatmap()}
        <div class="legend">meno <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> più</div>
      </section>

      <section>
        <h2>Moduli</h2>
        <p class="muted" style="margin-top:0">Circa ${totalHours} ore in totale. Segui l'ordine: ogni modulo presuppone il precedente.</p>
        <div class="grid">${plan.map(moduleCard).join('')}</div>
      </section>

      <div class="dash-foot">
        <button id="btn-reset" class="ghost danger" type="button">Azzera progresso</button>
      </div>`;

    document.getElementById('log-form').addEventListener('submit', e => {
      e.preventDefault();
      const v = Math.max(0, Math.min(1440, parseInt(document.getElementById('log-min').value, 10) || 0));
      state.minutes[today] = v;
      state.notes[today] = document.getElementById('log-note').value.trim();
      saveState();
      route();
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (!confirm('Azzerare tutto il progresso (spunte, minuti, note)? Puoi prima esportarlo.')) return;
      Object.assign(state, emptyState());
      saveState();
      route();
    });
  }

  async function renderModule(id, anchor) {
    const m = plan.find(x => x.id === id);
    if (!m) { app.innerHTML = '<h1>Modulo non trovato</h1><p><a href="#/">Torna alla dashboard</a></p>'; return; }
    const idx = plan.indexOf(m);
    const prev = plan[idx - 1], next = plan[idx + 1];
    const p = modProgress(m);
    app.innerHTML = `
      <div class="module-head">
        <div class="progress-line">
          <span id="mod-count">${p.done}/${p.total} esercizi completati</span>
          <div class="progress"><span id="mod-bar" style="width:${p.pct}%"></span></div>
        </div>
      </div>
      <article class="prose">${window.marked.parse(md[id] || '# Contenuto non disponibile\n\nRicarica la pagina.')}</article>
      <nav class="pager" aria-label="Moduli precedente e successivo">
        ${prev ? `<a href="#/m/${prev.id}"><small>← Precedente</small>${esc(prev.title)}</a>` : '<span></span>'}
        ${next ? `<a href="#/m/${next.id}" style="text-align:right"><small>Successivo →</small>${esc(next.title)}</a>` : '<span></span>'}
      </nav>`;
    enhance(app, id);
    if (anchor) {
      const el = document.getElementById(anchor);
      if (el) { el.scrollIntoView({ block: 'start' }); return; }
    }
    window.scrollTo(0, 0);
  }

  // ---------- arricchimento dei blocchi renderizzati ----------
  function enhance(scope, modId) {
    if (window.hljs) scope.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));

    // Ogni <h4> di esercizio: "#### ex:id · titolo" -> ancora ex-<id>
    scope.querySelectorAll('h4').forEach(h => {
      const first = h.firstChild;
      if (!first || first.nodeType !== Node.TEXT_NODE) return;
      const m = first.nodeValue.match(/^ex:([\w-]+)\s*·?\s*/);
      if (!m) return;
      h.id = 'ex-' + m[1];
      first.nodeValue = first.nodeValue.slice(m[0].length);
      const tag = document.createElement('span');
      tag.className = 'ex-tag';
      tag.textContent = m[1];
      h.prepend(tag);
    });

    // Checklist: "- [ ] ex:id · titolo" -> checkbox collegata al progresso
    scope.querySelectorAll('li input[type="checkbox"]').forEach(input => {
      const li = input.closest('li');
      const txt = input.nextSibling;
      const m = txt && txt.nodeType === Node.TEXT_NODE && txt.nodeValue.match(/^\s*ex:([\w-]+)\s*/);
      if (!m) return;
      const id = m[1];
      txt.nodeValue = txt.nodeValue.slice(m[0].length);
      const badge = document.createElement('code');
      badge.className = 'ex-id';
      badge.textContent = id;
      li.insertBefore(badge, txt);
      li.classList.add('task');
      input.disabled = false;
      input.checked = !!state.done[id];
      input.setAttribute('aria-label', 'Completato: ' + id);
      input.addEventListener('change', () => {
        if (input.checked) state.done[id] = new Date().toISOString();
        else delete state.done[id];
        saveState();
        renderSidebar(modId);
        const p = modProgress(plan.find(x => x.id === modId));
        const bar = document.getElementById('mod-bar');
        const count = document.getElementById('mod-count');
        if (bar) bar.style.width = p.pct + '%';
        if (count) count.textContent = `${p.done}/${p.total} esercizi completati`;
      });
    });
  }

  // ---------- routing ----------
  async function route() {
    const parts = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/');
    if (parts[0] === 'm' && parts[1]) {
      renderSidebar(parts[1]);
      await renderModule(parts[1], parts[2]);
    } else {
      renderSidebar('');
      renderDashboard();
    }
  }
  window.addEventListener('hashchange', route);

  // ---------- barra superiore ----------
  document.getElementById('btn-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `oop-progresso-${todayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  document.getElementById('file-import').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const imp = JSON.parse(await f.text());
      Object.assign(state.done, imp.done || {});
      for (const [k, v] of Object.entries(imp.minutes || {})) state.minutes[k] = Math.max(state.minutes[k] || 0, Number(v) || 0);
      Object.assign(state.notes, imp.notes || {});
      saveState();
      route();
      alert('Progresso importato.');
    } catch (err) {
      alert('File non valido: serve un JSON esportato da questo sito.');
    }
    e.target.value = '';
  });
  document.getElementById('btn-theme').addEventListener('click', () => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const current = root.dataset.theme || (dark ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignora */ }
  });
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'light' || t === 'dark') root.dataset.theme = t;
  } catch (e) { /* ignora */ }

  // ---------- avvio ----------
  loadContent()
    .then(route)
    .catch(err => {
      console.error(err);
      app.innerHTML = '<p>Impossibile caricare il contenuto. Ricarica la pagina o controlla la connessione.</p>';
    });
})();
