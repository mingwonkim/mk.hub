/* 저장고 방들 — 같은 Firestore 데이터를 새 화면 하나에 그림(UI는 영어).
   모양: 왼쪽 사이드바(모든 칸, recent.design 식) + 큰 제목·한 줄 설명 + 알약 필터 + 카드 그리드(달·날짜로 묶음).
   db·getDocs·memosCol 등은 index.html의 전역 let — 같은 전역 스코프라 이름으로 바로 씀.
   scene.js 라우터가 mkRooms.open(키, 닫기함수)로 부름. 사이드바는 #키 링크라 라우터가 잠금도 처리. */
(() => {
  const root = document.getElementById('lsRoom');
  const el = (tag, props = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? '' : v);
    }
    n.append(...kids.flat().filter(x => x != null && x !== false));
    return n;
  };
  const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = t => t ? new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const ymdParse = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const monthOf = t => { const d = typeof t === 'string' ? ymdParse(t) : new Date(t); return `${MON[d.getMonth()]} ${d.getFullYear()}`; };
  const all = async (col, field, dir = 'desc') => (await getDocs(field ? query(col, orderBy(field, dir)) : col)).docs.map(d => ({ id: d.id, ...d.data() }));
  const size = b => !b ? '' : b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
  const safe = u => { try { return ['https:', 'http:', 'mk-private:'].includes(new URL(u, location.href).protocol) ? u : null; } catch { return null; } }; // javascript: 등 차단
  const vid = u => { u = (u || '').trim(); const m = u.match(/youtu\.be\/([\w-]{11})/) || u.match(/[?&]v=([\w-]{11})/) || u.match(/embed\/([\w-]{11})/) || u.match(/^([\w-]{11})$/); return m ? m[1] : null; };
  const MAX = 50 * 1024 * 1024;
  async function put(file, prefix) { // Storage에 올리고 {n,url,path,size,type}
    if (file.size > MAX) throw new Error(file.name + ': up to 50 MB');
    const r = sRef(stg, prefix + 'f' + Date.now() + '_' + Math.random().toString(36).slice(2, 6) + '_' + file.name);
    await uploadBytes(r, file);
    try { return { n: file.name, url: await getDownloadURL(r), path: r.fullPath, size: file.size, type: file.type }; }
    catch (e) { drop(r.fullPath); throw e; }
  }
  // Storage 원본 지우기: 실패하면 기억해 뒀다가 다음에 방을 열 때 다시 시도(문서는 이미 지운 뒤라 고아만 남음)
  const ORPH = 'mk_orphans', orphans = () => { try { return JSON.parse(localStorage.getItem(ORPH) || '[]'); } catch { return []; } };
  const keepOrphans = list => { try { localStorage.setItem(ORPH, JSON.stringify([...new Set(list)].slice(-200))); } catch {} };
  const drop = path => path && deleteObject(sRef(stg, path)).catch(e => { if (e?.code !== 'storage/object-not-found') keepOrphans([...orphans(), path]); });
  const retryOrphans = () => orphans().forEach(p => deleteObject(sRef(stg, p)).then(() => true, e => e?.code === 'storage/object-not-found')
    .then(gone => { if (gone) keepOrphans(orphans().filter(x => x !== p)); })); // 지워진 것만 큐에서 뺌
  // GitHub 추가 백업(서버가 연결돼 있을 때만). 상태는 한 번만 물어봄
  let ghOn = null;
  const gh = () => ghOn || (ghOn = MKVault.api('status', {}, 'vaultGithub').then(r => !!r.connected).catch(() => false));
  // YouTube: 키는 mk_app/settings.yt_api_key. 검색 결과는 방 안 플레이어에서 바로 재생
  let ytKeyCache = null;
  const ytKey = async () => ytKeyCache ?? (ytKeyCache = (await getDoc(ytKeyDoc)).data()?.yt_api_key || '');
  const unent = t => new DOMParser().parseFromString(t || '', 'text/html').documentElement.textContent; // API 제목의 &amp; 등 풀기(실행 없음)
  async function ytSearch(q, n = 12) {
    const key = await ytKey(); if (!key) throw new Error('No YouTube API key. Add one in Settings.');
    const r = await fetch('https://www.googleapis.com/youtube/v3/search?' + new URLSearchParams({ part: 'snippet', type: 'video', videoEmbeddable: 'true', maxResults: n, q, key }));
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error('YouTube search failed: ' + (j.error?.message || r.status));
    return (j.items || []).map(i => ({ id: i.id.videoId, title: unent(i.snippet.title), channel: unent(i.snippet.channelTitle), thumb: i.snippet.thumbnails?.medium?.url || i.snippet.thumbnails?.default?.url }));
  }
  const player = id => el('div', { class: 'rm-video' }, el('iframe', { src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`, title: 'YouTube player', allow: 'autoplay; encrypted-media; picture-in-picture', allowfullscreen: true }));
  async function setYtKey() {
    const key = ask('YouTube Data API key (starts with AIza…)'); if (!key) return '';
    if (!/^[\w-]{20,60}$/.test(key)) throw new Error("That doesn't look like a key. Check it again.");
    await setDoc(ytKeyDoc, { yt_api_key: key }, { merge: true }); ytKeyCache = key; return 'YouTube API key saved.';
  }
  const device = () => MKVault.deviceLabel();
  // 다시 인증이 필요한 서버 작업(401): 패턴/Face ID로 다시 연 뒤 한 번 더 누르게 함(Face ID 창은 누른 직후에만 뜸)
  const reauth = async (fn, again) => { try { return await fn(); } catch (e) { if (e.status !== 401) throw e; MKVault.unlock(() => say(again)); return null; } };
  // 곡 넣기 화면의 YouTube 찾기: 결과를 누르면 링크(와 비어 있는 제목·가수)를 채움
  function ytPicker() {
    const out = el('ul', { class: 'rm-list rm-yt' }), q = el('input', { type: 'search', placeholder: 'Search YouTube', 'aria-label': 'Search YouTube', enterkeyhint: 'search' });
    const go = async () => {
      if (!q.value.trim()) return;
      out.replaceChildren(el('li', { class: 'rm-hint' }, 'Searching…'));
      try {
        const list = await ytSearch(q.value.trim(), 6);
        out.replaceChildren(...(list.length ? list.map(v => el('li', {}, el('button', { type: 'button', class: 'rm-row', onclick: e => {
          const f = e.currentTarget.closest('form'), set = (k, val) => { if (f.elements[k] && (k === 'link' || !f.elements[k].value)) f.elements[k].value = val; };
          set('link', 'https://youtu.be/' + v.id); set('title', v.title); set('t', v.title); set('artist', v.channel);
          out.replaceChildren(el('li', { class: 'rm-hint' }, 'Picked · ' + v.title));
        } }, v.thumb && el('img', { class: 'rm-thumb', src: v.thumb, alt: '', loading: 'lazy' }), el('span', { class: 'rm-row-main' }, el('b', {}, v.title), el('small', {}, v.channel)))))
          : [el('li', { class: 'rm-hint' }, 'No results.')]));
      } catch (e) { out.replaceChildren(el('li', { class: 'rm-hint' }, e.message)); }
    };
    q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } }); // 폼 저장이 아니라 검색
    return { node: el('div', { class: 'rm-extra' }, el('div', { class: 'rm-inline' }, q, el('button', { type: 'button', class: 'rm-btn sm', onclick: go }, 'Search')), out), collect: async () => ({}), discard() {}, saved() {} };
  }
  const thumbOf = id => vid(id) ? `https://i.ytimg.com/vi/${vid(id)}/mqdefault.jpg` : null;
  async function ghAll(kind) { let cursor = null, n = 0; do { const r = await MKVault.api(kind, { cursor }, 'vaultGithub'); cursor = r.cursor; n += r.count; } while (cursor); return n; }

  /* 그림판: 흰 종이, 펜 색·굵기·지우개·되돌리기. 바뀐 경우에만 저장 때 올림 */
  function drawPad(src, onUpload) {
    const cv = el('canvas', { class: 'rm-canvas', width: 1200, height: 800, role: 'img', 'aria-label': 'Drawing pad — draw with a mouse, pen or finger' });
    const g = cv.getContext('2d'), hist = [];
    let color = '#14161c', w = 4, erase = false, dirty = false, last = null, done = null, touched = false;
    g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
    if (src) MKVault.resolveURL(src).then(u => { const im = new Image(); im.onload = () => { if (touched) return; /* 이미 새로 그리기 시작했으면 늦게 온 옛 그림으로 덮지 않음 */ const s = Math.min(cv.width / im.width, cv.height / im.height); g.drawImage(im, (cv.width - im.width * s) / 2, (cv.height - im.height * s) / 2, im.width * s, im.height * s); }; im.src = u; }).catch(() => {});
    const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
    const line = (a, b) => { g.strokeStyle = erase ? '#fff' : color; g.lineWidth = erase ? w * 5 : w; g.lineCap = g.lineJoin = 'round'; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); hist.push(g.getImageData(0, 0, cv.width, cv.height)); if (hist.length > 30) hist.shift(); last = pt(e); dirty = touched = true; done = null; line(last, last); });
    cv.addEventListener('pointermove', e => { if (!last) return; const p = pt(e); line(last, p); last = p; });
    cv.addEventListener('pointerup', () => { last = null; }); cv.addEventListener('pointercancel', () => { last = null; });
    const sw = ['#14161c', '#e5484d', '#2f7cf6', '#16a34a', '#f59e0b'].map(c => el('button', { type: 'button', class: 'rm-sw', style: `--sw:${c}`, 'aria-label': 'Pen colour ' + c, 'aria-pressed': String(c === color), onclick: () => { color = c; erase = false; mark(); } }));
    const er = el('button', { type: 'button', class: 'rm-btn ghost sm', 'aria-pressed': 'false', onclick: () => { erase = !erase; mark(); } }, 'Eraser');
    const mark = () => { sw.forEach(b => b.setAttribute('aria-pressed', String(!erase && b.style.getPropertyValue('--sw') === color))); er.setAttribute('aria-pressed', String(erase)); };
    const hint = el('p', { class: 'rm-hint', id: 'rmPadHint' }, 'Draw with a mouse, pen or finger. Keyboard only? Write it in the text box instead.');
    cv.setAttribute('aria-describedby', 'rmPadHint');
    const node = el('div', { class: 'rm-pad' }, hint,
      el('div', { class: 'rm-padbar' }, sw, er,
        el('label', { class: 'rm-size' }, 'Size', el('input', { type: 'range', min: 1, max: 24, value: w, oninput: e => { w = +e.target.value; } })),
        el('button', { type: 'button', class: 'rm-btn ghost sm', onclick: () => { const h = hist.pop(); if (h) { g.putImageData(h, 0, 0); dirty = true; done = null; } } }, 'Undo'),
        el('button', { type: 'button', class: 'rm-btn ghost sm', onclick: () => { hist.push(g.getImageData(0, 0, cv.width, cv.height)); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); dirty = touched = true; done = null; } }, 'Clear')),
      cv);
    return {
      node,
      async collect() { // 올린 결과는 그림이 다시 바뀔 때까지 재사용(저장 실패 후 재시도에 두 번 안 올림)
        if (done) return done;
        if (!dirty) return {};
        const blob = await new Promise(r => cv.toBlob(r, 'image/png')); // 저장 중엔 CSS로 그림판 입력 잠김(#lsRoom[aria-busy])
        const path = 'mk_drawings/d' + crypto.randomUUID() + '.png', r = sRef(stg, path);
        await uploadBytes(r, blob, { contentType: 'image/png' }); onUpload(path);
        let url; try { url = await getDownloadURL(r); } catch (e) { drop(path); throw e; }
        dirty = false; // 업로드·주소 조회가 다 끝난 뒤에야 확정
        return (done = { canvas_url: url, canvas_path: path });
      },
    };
  }

  /* 메모 쓰기 칸 아래: 첨부(저장할 때 올림) + 그림판 */
  function memoExtra(m) {
    const keep = [...(m?.att || [])], add = [], uploads = new Set(); // uploads: 이번에 새로 올린 모든 경로(그림 재업로드·뺀 첨부 포함)
    const list = el('div', { class: 'rm-atts' });
    const paint = () => list.replaceChildren(
      ...keep.map((a, i) => el('div', { class: 'rm-att' }, el('span', {}, `${a.n} · ${size(a.size)}`), el('button', { type: 'button', 'aria-label': 'Remove ' + a.n, onclick: () => { keep.splice(i, 1); paint(); } }, 'Remove'))),
      ...add.map((f, i) => el('div', { class: 'rm-att new' }, el('span', {}, `${f.name} · uploads on save`), el('button', { type: 'button', 'aria-label': 'Remove ' + f.name, onclick: () => { add.splice(i, 1); paint(); } }, 'Remove'))));
    const inp = el('input', { type: 'file', multiple: true, hidden: true, onchange: () => { for (const f of inp.files) f.size > MAX ? say(f.name + ': up to 50 MB') : add.push(f); inp.value = ''; paint(); } });
    const pad = drawPad(m?.canvas_url, p => uploads.add(p));
    pad.node.hidden = !m?.canvas_url;
    const tog = el('button', { type: 'button', class: 'rm-btn ghost', 'aria-expanded': String(!pad.node.hidden), onclick: () => { pad.node.hidden = !pad.node.hidden; tog.setAttribute('aria-expanded', String(!pad.node.hidden)); tog.textContent = pad.node.hidden ? 'Draw' : 'Hide drawing'; } }, pad.node.hidden ? 'Draw' : 'Hide drawing');
    paint();
    return {
      node: el('div', { class: 'rm-extra' }, el('div', { class: 'rm-tools' }, el('button', { type: 'button', class: 'rm-btn ghost', onclick: () => inp.click() }, '+ Attach'), tog), list, inp, pad.node),
      async collect() {
        while (add.length) { const a = await put(add[0], 'mk_files/'); uploads.add(a.path); keep.push(a); add.shift(); paint(); } // 올린 건 keep으로 — 실패 후 다시 저장해도 두 번 안 올림
        return { att: [...keep], ...await pad.collect() };
      },
      discard() { uploads.forEach(drop); uploads.clear(); }, // 저장 안 하고 나가면 이번에 올린 것 전부 지움
      saved(v) { const used = new Set([v.canvas_path, ...v.att.map(a => a.path)]); uploads.forEach(p => used.has(p) || drop(p)); uploads.clear(); }, // 저장됐으면 기록이 안 쓰는 것만
    };
  }

  // 폴더 칩 + 폴더 만들기/이름 바꾸기/지우기(안의 것까지) — 메모·파일 공용
  const folderOps = (col, contents) => ({
    col,
    async wipe(id) {
      const items = (await all(contents())).filter(x => x.folder === id);
      for (const x of items) { await deleteDoc(doc(contents(), x.id)); [x.path, x.canvas_path, ...(x.att || []).map(a => a.path)].forEach(drop); } // 문서 먼저, 원본은 그 뒤
      await deleteDoc(doc(col(), id));
    },
  });
  const chipsOf = folders => [{ label: 'All', value: null }, ...folders.map(f => ({ label: f.name || 'Untitled', value: f.id }))];

  // 글 방(제목+내용): 예술·IT
  const noteRoom = (o, col) => ({
    ...o,
    load: () => all(col(), 'u'),
    row: m => ({ title: m.t || 'Untitled', sub: (m.b || '').slice(0, 220), meta: day(m.u) }),
    group: m => monthOf(m.u || m.c || Date.now()),
    view: m => [el('p', { class: 'rm-text' }, m.b || '')],
    fields: [['t', 'Title'], ['b', 'Body', 'textarea']],
    save: (v, m) => m ? updateDoc(doc(col(), m.id), { ...v, u: Date.now() }) : addDoc(col(), { ...v, c: Date.now(), u: Date.now() }),
    remove: m => deleteDoc(doc(col(), m.id)),
  });
  // 예술·IT는 옛 메모 폴더와 섞이지 않게 따로 된 컬렉션
  const roomCol = k => () => collection(db, 'mk_app', 'data', 'room_' + k);
  const guestCol = () => collection(db, 'mk_app', 'data', 'guestbook');
  // 브리프 읽음: 보는 사람 기기마다(localStorage), 주인은 Firestore read도. 최신 브리프를 읽었으면 도시의 드론이 반짝이지 않음
  const READ = 'mk_brief_read';
  const readIds = () => { try { return new Set(JSON.parse(localStorage.getItem(READ) || '[]')); } catch { return new Set(); } };
  const isRead = b => readIds().has(b.id) || (!!b.read && !!window.MKVault?.hasAccess());
  const markRead = b => {
    try { localStorage.setItem(READ, JSON.stringify([...readIds(), b.id].slice(-300))); } catch {}
    if (!ro()) updateDoc(doc(briefsCol, b.id), { read: true }).catch(() => {});
    b.read = true; drone();
  };
  async function drone() { // 최신 브리프가 안 읽혔을 때만 반짝임(브리프가 없으면 조용히)
    if (!window.mkDataReady) await new Promise(r => addEventListener('mk:data-ready', r, { once: true }));
    try { const [last] = await all(briefsCol, 'date'); document.querySelector('.mk-courier')?.classList.toggle('read', !last || isRead(last)); } catch {}
  }
  drone();

  // 브리프 메일 HTML → 섹션·기사 데이터(DOMParser는 스크립트를 돌리지 않음. 글자와 링크만 꺼냄). 모양이 다르면 null → 원본 iframe
  function briefParse(html) {
    const box = new DOMParser().parseFromString(html, 'text/html').body.querySelector('div');
    if (!box) return null;
    const txt = n => (n?.textContent || '').replace(/\s+/g, ' ').trim(), href = n => safe(n?.getAttribute('href') || '');
    const secs = []; let cur = null;
    for (const n of box.children) {
      const s = n.getAttribute('style') || '';
      if (/letter-spacing:\s*2px/.test(s) && /uppercase/.test(s)) { secs.push(cur = { name: txt(n), items: [] }); continue; }
      if (!cur) continue; // 맨 위 머리(날짜)
      if (n.tagName === 'TABLE') { for (const tr of n.querySelectorAll('tr')) { const [a, b] = tr.querySelectorAll('td'); if (!a) continue; const m = txt(b).match(/^([▲▼●])\s*(.*)$/); cur.items.push({ title: txt(a), url: href(a.querySelector('a')), summary: m ? m[2] : txt(b), tone: m ? { '▲': 'up', '▼': 'down', '●': 'flat' }[m[1]] : null }); } continue; }
      const a = n.querySelector('a'), kids = [...n.querySelectorAll(':scope > div')];
      if (a) cur.items.push({ title: txt(a), url: href(a), summary: txt(kids[0]), source: txt(kids[1]) });
      else if (txt(n)) cur.items.push({ note: txt(n) });
    }
    return secs.some(x => x.items.length) ? secs : null;
  }
  function briefView(b, bar) {
    const secs = b.html && briefParse(b.html);
    if (!secs) { // 옛 모양: 원본 메일 HTML — 스크립트 없는 격리 iframe
      const f = el('iframe', { class: 'rm-frame', sandbox: 'allow-popups allow-popups-to-escape-sandbox allow-same-origin', title: 'Brief' });
      f.srcdoc = b.html || ''; f.onload = () => { try { f.style.height = f.contentDocument.documentElement.scrollHeight + 'px'; } catch {} };
      return [bar, f];
    }
    const n = secs.reduce((t, x) => t + x.items.filter(i => !i.note).length, 0);
    const story = (i, lead) => i.note ? el('div', { class: 'bf-card note' }, i.note) : el(i.url ? 'a' : 'div', { class: 'bf-card' + (lead ? ' lead' : '') + (i.tone ? ' tone ' + i.tone : ''), href: i.url, target: i.url && '_blank', rel: i.url && 'noopener' },
      i.source && el('small', {}, i.source), el('h4', {}, i.title), i.summary && el('p', {}, i.summary));
    return [
      el('div', { class: 'bf-top' }, el('span', {}, `${n} stories · ${secs.length} sections`), bar),
      el('div', { class: 'bf' }, secs.map((s, k) => el('section', { class: 'bf-sec', style: `--i:${k}` },
        el('header', {}, el('span', {}, String(k + 1).padStart(2, '0')), el('h3', {}, s.name), el('small', {}, s.items.filter(i => !i.note).length || '')),
        el('div', { class: 'bf-cards' }, s.items.map((i, j) => story(i, k === 0 && j === 0 && !i.tone)))))),
    ];
  }

  // 설정 → 다른 기기 추가: 코드(4-4, 10분, 일회용)를 크게 보여 주고 남은 시간 표시
  function pairView() {
    const box = el('div', { class: 'rm-code-box' });
    const make = el('button', { type: 'button', class: 'rm-btn', onclick: async () => {
      make.disabled = true;
      try {
        const r = await reauth(() => MKVault.api('pair-create'), 'Verified again. Press "Create code" once more.');
        if (!r) return;
        const left = el('p', { class: 'rm-meta' });
        const tick = () => { const s = Math.max(0, Math.round((r.expires - Date.now()) / 1000)); left.textContent = s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} left · single use` : 'Expired. Create a new one.'; if (s && box.isConnected) setTimeout(tick, 1000); };
        box.replaceChildren(el('p', { class: 'rm-code', 'aria-label': 'Device code ' + r.code.split('').join(' ') }, r.code), left); tick();
      } catch (e) { say('Failed: ' + e.message); } finally { make.disabled = false; }
    } }, 'Create code');
    return [el('ol', { class: 'rm-steps' },
      el('li', {}, 'Create a code here.'),
      el('li', {}, 'On the new device, open 민권.com and tap the airship or a billboard to open the vault.'),
      el('li', {}, 'Choose "Use a recovery or device code" and enter it.'),
      el('li', {}, 'Once it opens, register Face ID on that device.')),
      el('div', { class: 'rm-tools' }, make), box];
  }
  // 설정 → 복구 코드: 남은 개수, 새로 만들기(옛 코드 무효), 만든 직후에만 코드가 보임
  function recoveryView() {
    const status = el('p', { class: 'rm-meta' }, 'Checking…'), box = el('div', { class: 'rm-code-box' });
    MKVault.api('recovery-status').then(r => { status.textContent = !r.created ? 'Never created.' : !r.valid ? 'Old codes were revoked by a pattern change or a sign-out everywhere. Create new ones.' : `${r.left} codes left · created ${day(r.created)}`; }, () => { status.textContent = ''; });
    const make = el('button', { type: 'button', class: 'rm-btn', onclick: async () => {
      if (!confirm('Creating new codes revokes all old ones. Continue?')) return;
      make.disabled = true;
      try {
        const r = await reauth(() => MKVault.api('recovery-create'), 'Verified again. Press "Create new" once more.');
        if (!r) return;
        const text = r.codes.join('\n');
        box.replaceChildren(el('p', { class: 'rm-note', role: 'status' }, 'Shown only once. Write them down or keep them somewhere safe. Each works one time.'),
          el('ul', { class: 'rm-codes' }, r.codes.map(c => el('li', {}, c))),
          el('button', { type: 'button', class: 'rm-btn ghost', onclick: e => navigator.clipboard?.writeText(text).then(() => { e.target.textContent = 'Copied'; }, () => say("Couldn't copy. Write them down instead.")) }, 'Copy all'));
        status.textContent = `${r.codes.length} codes left · just created`;
      } catch (e) { say('Failed: ' + e.message); } finally { make.disabled = false; }
    } }, 'Create new');
    return [status, el('p', { class: 'rm-text' }, 'If neither Face ID nor your pattern works, enter one of these under "Use a recovery or device code" in the vault window. You can register a new Face ID after it opens.'), el('div', { class: 'rm-tools' }, make), box];
  }

  /* 방명록(드론 칸의 두 번째 탭): 누구나 이름·한마디를 남김. 규칙이 길이·필드를 검사, 지우기는 주인만 */
  function guestbook(body, st) {
    const list = st.items;
    const name = el('input', { name: 'name', maxlength: 40, placeholder: 'Your name', 'aria-label': 'Your name', autocomplete: 'nickname' });
    const msg = el('textarea', { name: 'msg', rows: 3, maxlength: 500, placeholder: 'Leave a note for the city…', 'aria-label': 'Message' });
    try { name.value = localStorage.getItem('mk_guest_name') || ''; } catch {}
    const form = el('form', { class: 'rm-guest-form', onsubmit: e => {
      e.preventDefault();
      const n = name.value.trim(), m = msg.value.trim();
      if (!n) return name.focus(); if (!m) return msg.focus();
      try { localStorage.setItem('mk_guest_name', n); } catch {}
      act(() => addDoc(guestCol(), { name: n, msg: m, c: Date.now() }).then(() => 'Thank you for stopping by.'));
    } }, el('div', { class: 'rm-guest-row' }, name, el('button', { class: 'rm-btn' }, 'Sign')), msg);
    body.append(form);
    if (!list.length) return body.append(empty('No one has signed yet. Be the first.'));
    let last = null, grid = null;
    for (const g of list) {
      const t = g.c || 0, mo = monthOf(t);
      if (mo !== last) { last = mo; body.append(el('h2', { class: 'rm-group-h' }, mo)); grid = el('div', { class: 'rm-grid notes' }); body.append(grid); }
      grid.append(el('article', { class: 'rm-card note', style: `--i:${grid.children.length}` },
        el('p', { class: 'rm-card-quote' }, g.msg || ''),
        el('footer', {}, el('b', {}, g.name || 'Someone'), el('time', {}, day(t))),
        window.MKVault?.hasAccess() && el('button', { type: 'button', class: 'rm-x', 'aria-label': 'Delete note from ' + (g.name || 'someone'), onclick: () => confirm('Delete this note?') && act(() => deleteDoc(doc(guestCol(), g.id))) }, '×')));
    }
  }

  // 사이드바 묶음과 이름(라우터 키)
  const NAV = [
    ['Desk', [['thoughts', 'Thoughts'], ['todo', 'Tasks'], ['memo', 'Notes'], ['files', 'Files']]],
    ['City', [['briefing', 'Morning Brief'], ['music', 'Music'], ['art', 'Art'], ['it', 'Tech']]],
    ['System', [['settings', 'Settings']]],
  ];

  const ROOMS = {
    // pub: 메인 화면(도시)의 칸 — 누구나 보기만, 고치기는 잠금을 푼 뒤(규칙도 읽기만 공개)
    art: { ...noteRoom({ tag: 'City · Gallery', title: 'Art', sub: 'Works, sketches and things worth looking at twice.', empty: 'Nothing here yet. Add a first piece or thought.' }, roomCol('art')), pub: true },
    it: { ...noteRoom({ tag: 'City · Circuit', title: 'Tech', sub: 'Notes on tools, code and the machines we live with.', empty: 'Nothing here yet. Add a first entry.' }, roomCol('it')), pub: true },

    memo: {
      tag: 'Study · Corkboard', title: 'Notes', sub: 'Everything written down, kept in one place.',
      folders: folderOps(() => memoFoldersCol, () => memosCol),
      async load(st) {
        const [items, folders] = await Promise.all([all(memosCol, 'u'), all(memoFoldersCol, 'order', 'asc')]);
        st.folders = folders; st.chips = chipsOf(folders);
        return items;
      },
      match: (m, f) => (m.folder || 'none') === f,
      row: m => ({ title: m.t || 'Untitled', sub: m.type === 'draw' ? 'Drawing' : m.att?.length && !m.b ? m.att[0].n : (m.b || '').slice(0, 220) || (m.canvas_url ? 'Drawing' : ''), meta: day(m.u), thumb: m.type === 'draw' ? m.b : m.canvas_url }),
      group: m => monthOf(m.u || m.c || Date.now()),
      view: (m, st) => [
        m.type === 'draw' ? el('img', { class: 'rm-img', src: m.b, alt: m.t || 'Drawing' }) : m.b && el('p', { class: 'rm-text' }, m.b),
        m.canvas_url && el('img', { class: 'rm-img', src: m.canvas_url, alt: 'Attached drawing' }),
        (m.att || []).map(a => el('a', { class: 'rm-file', href: safe(a.url), download: a.n }, `${a.n} · ${size(a.size)}`)),
        st.folders?.length && el('label', { class: 'rm-move' }, el('span', {}, 'Folder'),
          el('select', { onchange: e => act(() => updateDoc(doc(memosCol, m.id), { folder: e.target.value }).then(() => 'Moved.'), () => load(m.id)) },
            el('option', { value: 'none', selected: (m.folder || 'none') === 'none' }, 'No folder'),
            st.folders.map(f => el('option', { value: f.id, selected: m.folder === f.id }, f.name || 'Untitled')))),
      ],
      fields: [['t', 'Title'], ['b', 'Body', 'textarea']],
      optional: true, // 제목 없이 그림·첨부만 넣어도 됨
      extra: memoExtra,
      canEdit: m => m.type !== 'draw', // 옛 '그림만' 기록은 b가 그림 주소라 글로 고치면 안 됨
      async save(v, m, st) {
        if (!v.t && !v.b && !v.att.length && !v.canvas_url && !m?.canvas_url) throw new Error('Add a title, text, drawing or attachment');
        const data = { t: v.t, b: v.b, att: v.att, u: Date.now(), type: v.canvas_url || m?.canvas_url ? 'note' : m?.type === 'file' ? 'file' : 'text' };
        if (v.canvas_url) Object.assign(data, { canvas_url: v.canvas_url, canvas_path: v.canvas_path });
        const id = m ? (await updateDoc(doc(memosCol, m.id), data), m.id) : (await addDoc(memosCol, { ...data, folder: st.filter || 'none', c: Date.now() })).id;
        // 새 기록이 저장된 뒤에야 빠진 첨부·바뀐 그림 원본을 지움
        const keep = new Set(v.att.map(a => a.path));
        (m?.att || []).filter(a => !keep.has(a.path)).forEach(a => drop(a.path));
        if (v.canvas_path && m?.canvas_path) drop(m.canvas_path);
        if (await gh()) MKVault.api('push-note', { id }, 'vaultGithub').catch(() => {});
      },
      remove: m => deleteDoc(doc(memosCol, m.id)).then(() => { [m.canvas_path, m.path, ...(m.att || []).map(a => a.path)].forEach(drop); }),
    },

    files: {
      tag: 'Study · Drawer', title: 'Files', sub: 'Documents and attachments, sealed in the drawer.', empty: 'The drawer is empty.',
      folders: folderOps(() => fileFoldersCol, () => filesCol),
      async load(st) {
        const [items, folders] = await Promise.all([all(filesCol, 'c'), all(fileFoldersCol, 'order', 'asc')]);
        st.folders = folders; st.chips = folders.length ? chipsOf(folders) : null;
        return items;
      },
      match: (f, v) => f.folder === v,
      row: f => ({ title: f.n || 'File', sub: [f.type, size(f.size)].filter(Boolean).join(' · '), meta: day(f.c) }),
      group: f => monthOf(f.c || Date.now()),
      view: f => [el('a', { class: 'rm-file', href: safe(f.url), download: f.n }, 'Download · ' + (f.n || 'file'))],
      upload: async (list, st) => { for (const f of list) { const a = await put(f, 'mk_files/'); try { await addDoc(filesCol, { ...a, c: Date.now(), folder: st.filter || null }); } catch (e) { drop(a.path); throw e; } } },
      remove: f => deleteDoc(doc(filesCol, f.id)).then(() => drop(f.path)),
    },

    briefing: {
      pub: true,
      tag: 'City · Courier drone', title: 'Morning Brief', sub: 'What the courier drone brought in — and notes left by visitors.',
      tabs: [
        { label: 'Briefs', wide: true, empty: 'No brief has arrived yet. They come Monday and Thursday mornings.',
          async load(st) { const items = await all(briefsCol, 'date'); const months = [...new Set(items.map(b => monthOf(b.date)))]; st.chips = months.length > 1 ? [{ label: 'All', value: null }, ...months.map(m => ({ label: m, value: m }))] : null; return items; },
          match: (b, m) => monthOf(b.date) === m,
          group: b => monthOf(b.date),
          row: b => { const d = ymdParse(b.date); return { title: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), sub: b.count ? b.count + ' stories' : '', meta: isRead(b) ? '' : 'New', big: String(d.getDate()) }; },
          view: b => {
            const done = isRead(b), mark = el('button', { type: 'button', class: 'rm-btn' + (done ? ' ghost' : ''), disabled: done, onclick: () => { markRead(b); mark.textContent = '✓ Read'; mark.disabled = true; mark.classList.add('ghost'); } }, done ? '✓ Read' : 'Mark as read');
            const bar = el('div', { class: 'rm-tools rm-readbar' }, mark);
            return briefView(b, bar);
          } },
        { label: 'Guestbook', load: async () => (await all(guestCol(), 'c')).slice(0, 200), row: () => ({}), render: guestbook },
      ],
    },

    settings: {
      tag: 'Study · Balcony', title: 'Settings', sub: 'Keys, devices and how the vault opens.',
      async load() {
        const list = [
          { id: 'pin', t: 'Change pattern', s: 'Set a new pattern for opening the vault.', run: () => MKVault.changePin() },
          { id: 'recover', t: 'Forgot pattern', s: 'Email a verification link and set a new pattern.', run: () => MKVault.recover() },
          { id: 'study', t: 'Ask for the study code again', s: 'Next time you tap the airship on this device, the study code is asked again.', run: () => { try { localStorage.removeItem('mk_study'); } catch {} return "It'll ask next time."; } },
          { id: 'lock', t: 'Lock the vault', s: 'Sign out on this device right now.', run: () => MKVault.logout() },
          { id: 'all', t: 'Sign out everywhere', s: 'Revoke access on every other device too.', run: () => MKVault.logoutAll() },
        ];
        // Face ID(패스키): 등록은 방금 패턴/Face ID로 연 경우만(서버 규칙). 옵션은 미리 받아 둠 — 누르자마자 Face ID 창이 떠야 해서
        if (MKVault.passkeySupported()) {
          MKVault.passkeyRegisterPrefetch().catch(() => {});
          list.push({ id: 'face', t: 'Register Face ID on this device', s: 'Open the vault and the study with Face ID. Your pattern stays as a backup.', reload: true, run: async () => {
            try { await MKVault.passkeyRegister(device()); return 'Face ID registered.'; }
            catch (e) {
              if (e.status !== 401) throw e;
              MKVault.unlock(() => { MKVault.passkeyRegisterPrefetch().catch(() => {}); say('Verified again. Press "Register Face ID" once more.'); });
              return '';
            } } });
        }
        try {
          for (const k of (await MKVault.passkeyList()).keys) list.push({ id: 'pk' + k.id, t: 'Remove Face ID · ' + (k.label || 'device'), s: `Registered ${day(k.created)}${k.used ? ' · last used ' + day(k.used) : ''}`, reload: true,
            run: async () => {
              if (!confirm(`Remove Face ID for '${k.label || 'this device'}'?`)) return '';
              try { await MKVault.passkeyRemove(k.id); return 'Face ID removed.'; }
              catch (e) { if (e.status !== 401) throw e; MKVault.unlock(() => say('Verified again. Press once more to remove.')); return ''; } } });
        } catch {}
        list.push(
          { id: 'pair', t: 'Add another device', s: 'Make a 10-minute code, enter it on the new device, then register Face ID there.', view: pairView },
          { id: 'recovery', t: 'Recovery codes', s: 'Eight one-time codes for when Face ID and your pattern both fail.', view: recoveryView });
        list.push({ id: 'yt', t: 'YouTube API key', s: (await ytKey().catch(() => '')) ? 'Saved. Tap to replace it.' : 'Needed to search and play inside Music.', reload: true, run: setYtKey });
        if (await gh()) list.push(
          { id: 'ghpush', t: 'Back up to GitHub', s: 'Send every note to the connected GitHub repository.', run: async () => (await ghAll('push-all')) + ' notes sent.' },
          { id: 'ghpull', t: 'Restore from GitHub', s: 'Bring notes from the GitHub repository into Notes.', run: async () => (await ghAll('pull-all')) + ' notes restored.' });
        return list;
      },
      row: a => ({ title: a.t, sub: a.s, action: a.run, reload: a.reload }),
      view: a => a.view(),
    },

    music: {
      pub: true,
      tag: 'City · Synth', title: 'Music', sub: 'Songs I love, why I love them, and tools for practice.',
      tabs: [
        { label: 'Favourites', empty: 'Nothing yet. Leave a song you love and why.', load: () => all(favSongsCol, 'c'),
          row: s => ({ title: s.title || '', sub: [s.artist, s.reason].filter(Boolean).join(' · '), thumb: thumbOf(s.videoId) }),
          view: s => [vid(s.videoId) ? player(vid(s.videoId)) : el('p', { class: 'rm-meta' }, 'No YouTube link. You can find one under Edit.'),
            el('p', { class: 'rm-meta' }, s.artist || ''), s.reason && el('p', { class: 'rm-text' }, s.reason)],
          fields: [['title', 'Song'], ['artist', 'Artist'], ['link', 'YouTube link'], ['reason', 'Why I love it', 'textarea']],
          extra: ytPicker,
          defaults: () => ({}),
          async save(v, s) {
            const videoId = vid(v.link) || (s && !v.link ? s.videoId : null) || (!v.link && await ytKey() ? (await ytSearch(`${v.title} ${v.artist}`, 1))[0]?.id : null); // 링크 없으면 키로 찾아 줌
            if (v.link && !videoId) throw new Error("Can't read that YouTube link");
            const data = { title: v.title, artist: v.artist, reason: v.reason, videoId };
            return s ? updateDoc(doc(favSongsCol, s.id), data) : addDoc(favSongsCol, { ...data, c: Date.now() });
          },
          edit: s => ({ ...s, link: s.videoId ? 'https://youtu.be/' + s.videoId : '' }),
          remove: s => deleteDoc(doc(favSongsCol, s.id)) },
        // 곡 분석(옛 음악 노트 music_notes: t,b + 가수·영상)
        { label: 'Analysis', empty: 'No song analysed yet.', load: () => all(musicNotesCol, 'u'),
          row: m => ({ title: m.t || 'Untitled', sub: [m.artist, (m.b || '').slice(0, 160)].filter(Boolean).join(' · '), meta: day(m.u), thumb: thumbOf(m.videoId) }),
          view: m => [vid(m.videoId) && player(vid(m.videoId)), m.artist && el('p', { class: 'rm-meta' }, m.artist), el('p', { class: 'rm-text' }, m.b || '')],
          fields: [['t', 'Song'], ['artist', 'Artist'], ['link', 'YouTube link'], ['b', 'Analysis', 'textarea']],
          extra: ytPicker,
          async save(v, m) {
            const videoId = vid(v.link) || (m && !v.link ? m.videoId || null : null) || (!v.link && await ytKey() ? (await ytSearch(`${v.t} ${v.artist}`, 1))[0]?.id : null);
            if (v.link && !videoId) throw new Error("Can't read that YouTube link");
            const data = { t: v.t, artist: v.artist, b: v.b, videoId: videoId || null, u: Date.now() };
            return m ? updateDoc(doc(musicNotesCol, m.id), data) : addDoc(musicNotesCol, { ...data, c: Date.now() });
          },
          edit: m => ({ ...m, link: m.videoId ? 'https://youtu.be/' + m.videoId : '' }),
          remove: m => deleteDoc(doc(musicNotesCol, m.id)) },
        { label: 'Playlists', empty: 'No playlists yet.',
          async load() { const [pl, songs] = await Promise.all([all(playlistsCol, 'c'), all(playlistSongsCol, 'c', 'asc')]); pl.forEach(p => { p.songs = songs.filter(s => s.plid === p.id); }); return pl; },
          row: p => ({ title: p.name || '', meta: p.songs.length + (p.songs.length === 1 ? ' song' : ' songs') }),
          view: p => {
            const f = el('form', { class: 'rm-inline', onsubmit: e => {
              e.preventDefault(); const title = f.elements.title.value.trim(), link = f.elements.link.value.trim();
              if (!safe(link)) return say('Add a link to the song');
              act(() => addDoc(playlistSongsCol, { title: title || link, link, plid: p.id, c: Date.now() }), () => load(p.id));
            } }, el('input', { name: 'title', placeholder: 'Song', 'aria-label': 'Song' }), el('input', { name: 'link', placeholder: 'Link (YouTube, etc.)', 'aria-label': 'Song link' }), el('button', { class: 'rm-btn sm' }, '+ Add'));
            return [
              p.songs.length ? el('ul', { class: 'rm-list' }, p.songs.map(s => el('li', {},
                safe(s.link) ? el('a', { class: 'rm-row', href: safe(s.link), target: '_blank', rel: 'noopener' }, el('span', { class: 'rm-row-main' }, el('b', {}, s.title || s.link))) : el('div', { class: 'rm-row static' }, el('span', { class: 'rm-row-main' }, el('b', {}, s.title || ''))),
                !ro() && el('button', { type: 'button', class: 'rm-x', 'aria-label': 'Remove ' + (s.title || 'song'), onclick: () => act(() => deleteDoc(doc(playlistSongsCol, s.id)), () => load(p.id)) }, '×')))) : el('p', { class: 'rm-text' }, 'No songs yet.'),
              !ro() && f];
          },
          fields: [['name', 'Playlist name']],
          save: (v, p) => p ? updateDoc(doc(playlistsCol, p.id), v) : addDoc(playlistsCol, { ...v, c: Date.now() }),
          remove: p => Promise.all(p.songs.map(s => deleteDoc(doc(playlistSongsCol, s.id)))).then(() => deleteDoc(doc(playlistsCol, p.id))) },
        { label: 'Practice', wide: true,
          load: async () => [{ id: 'p', t: 'Perfect Pitch Quest', s: 'Hear a note, name it, level up.', h: 'pitch-trainer.html' }, { id: 'c', t: 'Chord Dictionary', s: 'K-pop chords, progressions, the circle of fifths and theory.', h: 'chord-dictionary.html' }],
          row: x => ({ title: x.t, sub: x.s }),
          view: x => [el('iframe', { class: 'rm-tool', src: x.h + '?embed', title: x.t })] },
      ],
    },
  };

  /* ── 화면 ── */
  let st = null, seq = 0, shownKey = null;
  const ro = () => !!st?.room.pub && !window.MKVault?.hasAccess(); // 공개 칸을 잠금 안 풀고 보는 중
  const def = () => st.room.tabs ? { ...st.room.tabs[st.tab], tag: st.room.tag, title: st.room.title, sub: st.room.sub } : st.room;
  const empty = text => el('div', { class: 'rm-state' }, el('div', { class: 'rm-orb' }), el('p', {}, text));

  async function load(keep) { // keep: 다시 불러온 뒤 그 항목 화면으로 돌아감(플레이리스트 곡 넣기 등)
    const my = ++seq; st.view = 'loading'; st.chips = null; draw();
    try {
      if (!window.mkDataReady) await new Promise(r => addEventListener('mk:data-ready', r, { once: true })); // 공개 칸은 인증 없이 바로 열려서 Firebase 준비를 기다림
      if (my !== seq) return;
      const items = await def().load(st); if (my !== seq) return; st.items = items; st.view = 'list';
      const again = keep && items.find(x => x.id === keep); if (again) { st.item = again; st.view = 'item'; }
    } catch (e) { if (my !== seq) return; st.err = e.message || String(e); st.view = 'error'; }
    draw();
  }
  function say(msg) { // 다시 그리지 않고 알림만(입력 중인 폼·초점 유지)
    let n = root.querySelector('.rm-note');
    if (!n) { n = el('p', { class: 'rm-note', role: 'status' }); root.querySelector('.rm-body')?.prepend(n); }
    n.textContent = msg;
  }
  async function act(fn, after = load) { // 저장·삭제 등. 진행 중엔 컨트롤만 잠그고, 실패하면 입력 그대로 풀어 줌
    const mine = st, was = document.activeElement, ctl = [...root.querySelectorAll('button, input, textarea, select')].filter(c => !c.disabled);
    ctl.forEach(c => { c.disabled = true; }); root.setAttribute('aria-busy', 'true');
    const done = msg => { ctl.forEach(c => { c.disabled = false; }); root.removeAttribute('aria-busy'); if (msg) say(msg); if (root.contains(was)) was.focus(); };
    try {
      const msg = await fn(); if (st !== mine) return; // 그새 다른 방으로 갔으면 결과 무시
      if (after) { root.removeAttribute('aria-busy'); st.note = typeof msg === 'string' ? msg : ''; await after(); } else done(typeof msg === 'string' ? msg : '');
    } catch (e) { if (st === mine) done('Failed: ' + (e.message || e)); }
  }
  function ask(label, value = '') { const v = prompt(label, value); return v && v.trim(); }

  const LOCK = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="2"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>';
  const ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5"/></svg>';
  function sidebar() {
    const open = !!window.MKVault?.hasAccess();
    return el('aside', { class: 'rm-side', 'aria-label': 'Vaults' },
      el('a', { class: 'rm-brand', href: st.back || '#', 'aria-label': 'Back to the city' }, el('span', { class: 'rm-mark' }, 'MK'), el('span', {}, 'Vaults')),
      NAV.map(([name, items]) => el('nav', { class: 'rm-nav', 'aria-label': name },
        el('h2', {}, name),
        items.map(([k, label]) => { const pub = ROOMS[k]?.pub, a = el('a', { href: '#' + k, 'aria-current': k === st.key ? 'page' : null }, el('span', {}, label));
          if (!pub && !open) a.insertAdjacentHTML('beforeend', `<i class="rm-lock" title="Locked">${LOCK}</i>`);
          return a; }))),
      el('div', { class: 'rm-side-foot' },
        el('p', {}, open ? 'Vault open' : 'Vault locked', el('i', { class: 'rm-dot' + (open ? ' on' : '') })),
        el('a', { href: st.back || '#' }, st.back === '#study' ? '← Back to the study' : '← Back to the city')));
  }

  function card(x, d, i) {
    const r = d.row(x);
    const open = r.action ? () => act(r.action, r.reload ? load : null) : d.view ? () => { st.item = x; st.note = ''; st.view = 'item'; draw(); } : null;
    const inner = [
      r.thumb && el('img', { class: 'rm-card-img', src: r.thumb, alt: '', loading: 'lazy' }),
      r.big && el('span', { class: 'rm-card-big' }, r.big),
      el('span', { class: 'rm-card-main' }, el('b', {}, r.title), r.sub && el('small', {}, r.sub)),
      el('span', { class: 'rm-card-foot' }, r.meta ? el('time', { class: r.meta === 'New' ? 'new' : null }, r.meta) : el('span'), open && el('i', { class: 'rm-arrow' })),
    ];
    const c = open ? el('button', { type: 'button', class: 'rm-card' + (r.big ? ' date' : ''), style: `--i:${i}`, onclick: open }, inner) : el('div', { class: 'rm-card static', style: `--i:${i}` }, inner);
    c.querySelector('.rm-arrow')?.insertAdjacentHTML('beforeend', ARROW);
    if (d.toggle) c.prepend(el('button', { type: 'button', class: 'rm-check', 'aria-pressed': String(!!r.done), 'aria-label': (r.done ? 'Mark not done: ' : 'Mark done: ') + r.title, onclick: e => { e.stopPropagation(); act(() => d.toggle(x)); } }));
    return c;
  }

  function draw(focus = true) {
    if (st.leave && st.view !== 'compose') { st.leave(); st.leave = null; }
    const d = def(), back = st.view === 'item' || st.view === 'compose';
    const h = el('h1', { class: 'rm-title', tabindex: '-1' }, st.view === 'item' ? (d.row(st.item).title || '') : st.view === 'compose' ? (st.item ? 'Edit' : 'New entry') : d.title);
    const head = el('header', { class: 'rm-head' },
      el('div', { class: 'rm-crumb' }, back ? el('button', { type: 'button', onclick: () => { st.view = 'list'; draw(); } }, '← ' + d.title) : el('span', {}, d.tag),
        el('button', { type: 'button', class: 'rm-close', 'aria-label': 'Close', onclick: st.close }, '×')),
      h, !back && d.sub && el('p', { class: 'rm-sub' }, d.sub));
    const body = el('div', { class: 'rm-body' });
    if (st.note) body.append(el('p', { class: 'rm-note', role: 'status' }, st.note));

    if (!back) { // 알약: 탭(음악·브리프) 또는 폴더/달 칩. 오른쪽엔 행동 버튼
      const bar = el('div', { class: 'rm-bar' });
      const tabs = st.room.tabs ? st.room.tabs.map((t, i) => ({ label: t.label, on: i === st.tab, pick: () => { st.tab = i; st.filter = null; st.note = ''; load(); } })) : [];
      const chips = (st.chips || []).map(c => ({ label: c.label, on: c.value === st.filter, pick: () => { st.filter = c.value; st.note = ''; draw(); } }));
      if (tabs.length) bar.append(el('div', { class: 'rm-pills', role: 'group', 'aria-label': 'Sections' }, tabs.map(t => el('button', { type: 'button', 'aria-pressed': String(t.on), onclick: t.pick }, t.label))));
      if (chips.length) bar.append(el('div', { class: 'rm-pills soft', role: 'group', 'aria-label': 'Filter' }, chips.map(t => el('button', { type: 'button', 'aria-pressed': String(t.on), onclick: t.pick }, t.label))));
      const tools = el('div', { class: 'rm-tools' });
      if (st.view === 'list' && !d.render) {
        if (d.save && ro()) tools.append(el('button', { type: 'button', class: 'rm-btn ghost', onclick: () => MKVault.unlock(() => draw()) }, 'Unlock to edit'));
        else if (d.save) tools.append(el('button', { type: 'button', class: 'rm-btn', onclick: () => { st.item = null; st.note = ''; st.view = 'compose'; draw(); } }, '+ New'));
        if (d.upload) {
          const inp = el('input', { type: 'file', multiple: true, hidden: true, onchange: () => { const files = [...inp.files]; inp.value = ''; if (files.length) act(() => d.upload(files, st)); } });
          tools.append(inp, el('button', { type: 'button', class: 'rm-btn', onclick: () => inp.click() }, '+ Upload'));
        }
        if (d.folders) {
          const F = d.folders, cur = st.folders?.find(f => f.id === st.filter);
          tools.append(el('button', { type: 'button', class: 'rm-btn ghost', onclick: () => { const name = ask('New folder name'); if (name) act(() => addDoc(F.col(), { name, icon: 'folder', order: Date.now() })); } }, '+ Folder'));
          if (cur) tools.append(
            el('button', { type: 'button', class: 'rm-btn ghost', onclick: () => { const name = ask('Folder name', cur.name || ''); if (name) act(() => updateDoc(doc(F.col(), cur.id), { name })); } }, 'Rename'),
            el('button', { type: 'button', class: 'rm-btn ghost danger', onclick: () => confirm(`Delete '${cur.name || 'this folder'}' and everything in it? This can't be undone.`) && act(() => F.wipe(cur.id).then(() => { st.filter = null; })) }, 'Delete folder'));
        }
      }
      if (tools.children.length) bar.append(tools);
      if (bar.children.length) body.append(bar);
    }

    if (st.view === 'loading') body.append(el('div', { class: 'rm-grid' }, Array.from({ length: 6 }, (_, i) => el('div', { class: 'rm-card skel', style: `--i:${i}` }))));
    else if (st.view === 'error') body.append(el('div', { class: 'rm-state' }, el('div', { class: 'rm-orb bad' }), el('p', {}, "Couldn't load. " + st.err), el('button', { type: 'button', class: 'rm-btn', onclick: () => load() }, 'Try again')));
    else if (st.view === 'item') {
      const meta = d.row(st.item).meta;
      if (meta) body.append(el('p', { class: 'rm-meta' }, meta));
      body.append(el('article', { class: 'rm-read' }, ...d.view(st.item, st).flat(Infinity).filter(Boolean)));
      const tools = el('div', { class: 'rm-tools' });
      if (d.save && !ro() && (!d.canEdit || d.canEdit(st.item))) tools.append(el('button', { type: 'button', class: 'rm-btn ghost', onclick: () => { st.view = 'compose'; draw(); } }, 'Edit'));
      if (d.remove && !ro()) tools.append(el('button', { type: 'button', class: 'rm-btn ghost danger', onclick: () => confirm("Delete this? It can't be undone.") && act(() => d.remove(st.item)) }, 'Delete'));
      if (tools.children.length) body.append(tools);
    } else if (st.view === 'compose') {
      const v = st.item ? (d.edit ? d.edit(st.item) : st.item) : (d.defaults ? d.defaults() : {});
      const ex = d.extra?.(st.item);
      let saving = false, left = false;
      const form = el('form', { class: 'rm-form', onsubmit: e => {
        e.preventDefault(); const data = Object.fromEntries(d.fields.map(([k]) => [k, form.elements[k].value.trim()]));
        if (!d.optional && !data[d.fields[0][0]]) return form.elements[d.fields[0][0]].focus();
        const item = st.item, s = st; // 업로드 중 다른 방을 열어도 처음 고른 항목에 저장
        saving = true;
        act(async () => {
          let ok = false;
          try { const extra = ex ? await ex.collect() : {}; await d.save({ ...data, ...extra }, item, s); ok = true; ex?.saved(extra); }
          finally { saving = false; if (left && !ok) ex?.discard(); } // 저장 중에 화면을 떠났으면 끝난 뒤 실패일 때만 정리
        });
      } }, d.fields.map(([k, label, type]) => el('label', {}, el('span', {}, label),
        type === 'textarea' ? el('textarea', { name: k, rows: 8 }, v[k] || '') : el('input', { name: k, type: type || 'text', value: v[k] || '' }))),
        ex?.node,
        el('div', { class: 'rm-tools' }, el('button', { class: 'rm-btn' }, 'Save'), el('button', { type: 'button', class: 'rm-btn ghost', onclick: () => { st.view = st.item ? 'item' : 'list'; draw(); } }, 'Cancel')));
      st.leave = () => { if (saving) left = true; else ex?.discard(); }; // 취소·목록·Esc·다른 방 모두 여기로
      body.append(form);
    } else if (d.render) d.render(body, st); // 방이 화면을 직접 그림(잡생각·할 일·방명록)
    else { // 목록 → 카드 그리드(달로 묶음)
      const items = st.filter != null && d.match ? st.items.filter(x => d.match(x, st.filter)) : st.items;
      if (!items.length) body.append(empty(d.empty || 'Nothing here yet.'));
      else if (!d.group) body.append(el('div', { class: 'rm-grid' }, items.map((x, i) => card(x, d, i))));
      else {
        let last = null, grid = null, i = 0;
        for (const x of items) {
          const g = d.group(x);
          if (g !== last) { last = g; body.append(el('h2', { class: 'rm-group-h' }, g, el('small', {}, String(items.filter(y => d.group(y) === g).length)))); grid = el('div', { class: 'rm-grid' }); body.append(grid); }
          grid.append(card(x, d, i++));
        }
      }
    }
    const main = el('main', { class: 'rm-main' + (d.wide && st.view === 'item' ? ' wide' : '') + (st.key !== shownKey ? ' enter' : '') }, head, body);
    shownKey = st.key;
    root.replaceChildren(el('div', { class: 'rm-shell' }, sidebar(), main));
    if (focus) h.focus({ preventScroll: true });
  }

  root.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !st || root.hasAttribute('aria-busy')) return; // 저장 중엔 화면 전환 막음(버튼도 잠김)
    e.preventDefault();
    if (st.view === 'item' || st.view === 'compose') { st.view = 'list'; draw(); } else st.close();
  });

  window.mkRooms = {
    has: k => k in ROOMS,
    pub: k => !!ROOMS[k]?.pub,
    define: (k, d) => { ROOMS[k] = d; }, // desk.js(잡생각·할 일 달력)가 방을 더함
    kit: { el, all, day, say, act, reload: () => load() },
    open(key, close, back) {
      root.removeAttribute('aria-busy'); st?.leave?.(); retryOrphans();
      const run = () => { st = { key, room: ROOMS[key], tab: 0, filter: null, items: [], view: 'loading', close, back, note: '' }; load(); };
      document.startViewTransition && root.classList.contains('on') ? document.startViewTransition(run) : run(); // 칸을 옮길 때 부드럽게 바뀜
    },
  };
})();
