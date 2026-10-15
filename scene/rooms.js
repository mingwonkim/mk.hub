/* 저장고 방들 — 옛 MK.HUB 페이지는 버리고, 같은 Firestore 데이터를 새 화면(비행선 해치 톤) 하나에 그림.
   db·getDocs·memosCol 등은 index.html의 전역 let — 같은 전역 스코프라 이름으로 바로 씀(저장고 인증 뒤에만 열림).
   scene.js 라우터가 mkRooms.open(키, 닫기함수)로 부름.
   옛 화면에서 안 옮긴 것: 테마 전환·홈 카드 이름·모듈 순서·배경 사진(옛 홈 배치 전용), YouTube API 키(곡은 링크로 넣음). */
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
  const day = t => t ? new Date(t).toLocaleDateString('ko-KR', { year: '2-digit', month: 'short', day: 'numeric' }) : '';
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const all = async (col, field, dir = 'desc') => (await getDocs(field ? query(col, orderBy(field, dir)) : col)).docs.map(d => ({ id: d.id, ...d.data() }));
  const size = b => !b ? '' : b < 1048576 ? Math.max(1, Math.round(b / 1024)) + 'KB' : (b / 1048576).toFixed(1) + 'MB';
  const safe = u => { try { return ['https:', 'http:', 'mk-private:'].includes(new URL(u, location.href).protocol) ? u : null; } catch { return null; } }; // javascript: 등 차단
  const vid = u => { u = (u || '').trim(); const m = u.match(/youtu\.be\/([\w-]{11})/) || u.match(/[?&]v=([\w-]{11})/) || u.match(/embed\/([\w-]{11})/) || u.match(/^([\w-]{11})$/); return m ? m[1] : null; };
  const MAX = 50 * 1024 * 1024;
  async function put(file, prefix) { // Storage에 올리고 {n,url,path,size,type}
    if (file.size > MAX) throw new Error(file.name + ': 50MB까지 올릴 수 있어요');
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
  async function ghAll(kind) { let cursor = null, n = 0; do { const r = await MKVault.api(kind, { cursor }, 'vaultGithub'); cursor = r.cursor; n += r.count; } while (cursor); return n; }

  /* 그림판: 흰 종이(옛 그림과 같은 바탕), 펜 색·굵기·지우개·되돌리기. 바뀐 경우에만 저장 때 올림 */
  function drawPad(src, onUpload) {
    const cv = el('canvas', { class: 'rm-canvas', width: 1200, height: 800, role: 'img', 'aria-label': '그림판 — 마우스나 손가락으로 그려요' });
    const g = cv.getContext('2d'), hist = [];
    let color = '#14161c', w = 4, erase = false, dirty = false, last = null, done = null, touched = false;
    g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
    if (src) MKVault.resolveURL(src).then(u => { const im = new Image(); im.onload = () => { if (touched) return; /* 이미 새로 그리기 시작했으면 늦게 온 옛 그림으로 덮지 않음 */ const s = Math.min(cv.width / im.width, cv.height / im.height); g.drawImage(im, (cv.width - im.width * s) / 2, (cv.height - im.height * s) / 2, im.width * s, im.height * s); }; im.src = u; }).catch(() => {});
    const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
    const line = (a, b) => { g.strokeStyle = erase ? '#fff' : color; g.lineWidth = erase ? w * 5 : w; g.lineCap = g.lineJoin = 'round'; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); hist.push(g.getImageData(0, 0, cv.width, cv.height)); if (hist.length > 30) hist.shift(); last = pt(e); dirty = touched = true; done = null; line(last, last); });
    cv.addEventListener('pointermove', e => { if (!last) return; const p = pt(e); line(last, p); last = p; });
    cv.addEventListener('pointerup', () => { last = null; }); cv.addEventListener('pointercancel', () => { last = null; });
    const sw = ['#14161c', '#e5484d', '#2f7cf6', '#16a34a', '#f59e0b'].map(c => el('button', { type: 'button', class: 'rm-sw', style: `--sw:${c}`, 'aria-label': '펜 색 ' + c, 'aria-pressed': String(c === color), onclick: () => { color = c; erase = false; mark(); } }));
    const er = el('button', { type: 'button', class: 'rm-btn ghost sm', 'aria-pressed': 'false', onclick: () => { erase = !erase; mark(); } }, '지우개');
    const mark = () => { sw.forEach(b => b.setAttribute('aria-pressed', String(!erase && b.style.getPropertyValue('--sw') === color))); er.setAttribute('aria-pressed', String(erase)); };
    const hint = el('p', { class: 'rm-hint', id: 'rmPadHint' }, '마우스·펜·손가락으로 그려요. 키보드만 쓴다면 내용 칸에 글로 적어 주세요.');
    cv.setAttribute('aria-describedby', 'rmPadHint');
    const node = el('div', { class: 'rm-pad' }, hint,
      el('div', { class: 'rm-padbar' }, sw, er,
        el('label', { class: 'rm-size' }, '굵기', el('input', { type: 'range', min: 1, max: 24, value: w, oninput: e => { w = +e.target.value; } })),
        el('button', { type: 'button', class: 'rm-btn ghost sm', onclick: () => { const h = hist.pop(); if (h) { g.putImageData(h, 0, 0); dirty = true; done = null; } } }, '되돌리기'),
        el('button', { type: 'button', class: 'rm-btn ghost sm', onclick: () => { hist.push(g.getImageData(0, 0, cv.width, cv.height)); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); dirty = touched = true; done = null; } }, '모두 지우기')),
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
      ...keep.map((a, i) => el('div', { class: 'rm-att' }, el('span', {}, `${a.n} · ${size(a.size)}`), el('button', { type: 'button', 'aria-label': a.n + ' 빼기', onclick: () => { keep.splice(i, 1); paint(); } }, '빼기'))),
      ...add.map((f, i) => el('div', { class: 'rm-att new' }, el('span', {}, `${f.name} · 저장할 때 올려요`), el('button', { type: 'button', 'aria-label': f.name + ' 빼기', onclick: () => { add.splice(i, 1); paint(); } }, '빼기'))));
    const inp = el('input', { type: 'file', multiple: true, hidden: true, onchange: () => { for (const f of inp.files) f.size > MAX ? say(f.name + ': 50MB까지 올릴 수 있어요') : add.push(f); inp.value = ''; paint(); } });
    const pad = drawPad(m?.canvas_url, p => uploads.add(p));
    pad.node.hidden = !m?.canvas_url;
    const tog = el('button', { type: 'button', class: 'rm-btn ghost', 'aria-expanded': String(!pad.node.hidden), onclick: () => { pad.node.hidden = !pad.node.hidden; tog.setAttribute('aria-expanded', String(!pad.node.hidden)); tog.textContent = pad.node.hidden ? '그림 그리기' : '그림 접기'; } }, pad.node.hidden ? '그림 그리기' : '그림 접기');
    paint();
    return {
      node: el('div', { class: 'rm-extra' }, el('div', { class: 'rm-tools' }, el('button', { type: 'button', class: 'rm-btn ghost', onclick: () => inp.click() }, '+ 첨부'), tog), list, inp, pad.node),
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
  const chipsOf = folders => [{ label: '전체', value: null }, ...folders.map(f => ({ label: f.name || '이름 없음', value: f.id }))];

  // 글 방(제목+내용): 예술·IT 저장고, 음악 노트
  const noteRoom = (tag, title, col, empty) => ({
    tag, title, empty,
    load: () => all(col(), 'u'),
    row: m => ({ title: m.t || '제목 없음', sub: (m.b || '').split('\n')[0], meta: day(m.u) }),
    view: m => [el('p', { class: 'rm-text' }, m.b || '')],
    fields: [['t', '제목'], ['b', '내용', 'textarea']],
    save: (v, m) => m ? updateDoc(doc(col(), m.id), { ...v, u: Date.now() }) : addDoc(col(), { ...v, c: Date.now(), u: Date.now() }),
    remove: m => deleteDoc(doc(col(), m.id)),
  });
  // 예술·IT는 옛 메모 폴더와 섞이지 않게 따로 된 컬렉션(처음엔 비어 있음). 규칙: mk_app/data/* 는 저장고 주인만
  const roomCol = k => () => collection(db, 'mk_app', 'data', 'room_' + k);

  const ROOMS = {
    art: noteRoom('VAULT · ART', '예술 저장고', roomCol('art'), '아직 비어 있어요. 첫 작품이나 생각을 넣어 보세요.'),
    it: noteRoom('VAULT · IT', 'IT 저장고', roomCol('it'), '아직 비어 있어요. 첫 기록을 넣어 보세요.'),

    memo: {
      tag: 'STUDY · CORKBOARD', title: '메모',
      folders: folderOps(() => memoFoldersCol, () => memosCol),
      async load(st) {
        const [items, folders] = await Promise.all([all(memosCol, 'u'), all(memoFoldersCol, 'order', 'asc')]);
        st.folders = folders; st.chips = chipsOf(folders);
        return items;
      },
      match: (m, f) => (m.folder || 'none') === f,
      row: m => ({ title: m.t || '제목 없음', sub: m.type === 'draw' ? '그림' : m.att?.length && !m.b ? m.att[0].n : (m.b || '').split('\n')[0] || (m.canvas_url ? '그림' : ''), meta: day(m.u) }),
      view: (m, st) => [
        m.type === 'draw' ? el('img', { class: 'rm-img', src: m.b, alt: m.t || '그림' }) : m.b && el('p', { class: 'rm-text' }, m.b),
        m.canvas_url && el('img', { class: 'rm-img', src: m.canvas_url, alt: '함께 그린 그림' }),
        (m.att || []).map(a => el('a', { class: 'rm-file', href: safe(a.url), download: a.n }, `${a.n} · ${size(a.size)}`)),
        st.folders?.length && el('label', { class: 'rm-move' }, el('span', {}, '폴더'),
          el('select', { onchange: e => act(() => updateDoc(doc(memosCol, m.id), { folder: e.target.value }).then(() => '옮겼어요.'), () => load(m.id)) },
            el('option', { value: 'none', selected: (m.folder || 'none') === 'none' }, '폴더 없음'),
            st.folders.map(f => el('option', { value: f.id, selected: m.folder === f.id }, f.name || '이름 없음')))),
      ],
      fields: [['t', '제목'], ['b', '내용', 'textarea']],
      optional: true, // 제목 없이 그림·첨부만 넣어도 됨
      extra: memoExtra,
      canEdit: m => m.type !== 'draw', // 옛 '그림만' 기록은 b가 그림 주소라 글로 고치면 안 됨
      async save(v, m, st) {
        if (!v.t && !v.b && !v.att.length && !v.canvas_url && !m?.canvas_url) throw new Error('제목, 내용, 그림, 첨부 중 하나는 넣어 주세요');
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
      tag: 'STUDY · DRAWER', title: '파일', empty: '서랍이 비어 있어요.',
      folders: folderOps(() => fileFoldersCol, () => filesCol),
      async load(st) {
        const [items, folders] = await Promise.all([all(filesCol, 'c'), all(fileFoldersCol, 'order', 'asc')]);
        st.folders = folders; st.chips = folders.length ? chipsOf(folders) : null;
        return items;
      },
      match: (f, v) => f.folder === v,
      row: f => ({ title: f.n || '파일', sub: [f.type, size(f.size)].filter(Boolean).join(' · '), meta: day(f.c) }),
      view: f => [el('a', { class: 'rm-file', href: safe(f.url), download: f.n }, '내려받기 · ' + (f.n || '파일'))],
      upload: async (list, st) => { for (const f of list) { const a = await put(f, 'mk_files/'); try { await addDoc(filesCol, { ...a, c: Date.now(), folder: st.filter || null }); } catch (e) { drop(a.path); throw e; } } },
      remove: f => deleteDoc(doc(filesCol, f.id)).then(() => drop(f.path)),
    },

    todo: {
      tag: 'STUDY · STICKY NOTES', title: '할 일', empty: '할 일이 없어요.',
      async load() {
        const t = today(), rank = x => x.done ? 3 : x.date < t ? 0 : x.date === t ? 1 : 2;
        return (await all(todosCol)).sort((a, b) => rank(a) - rank(b) || (rank(a) === 3 ? (b.date || '').localeCompare(a.date || '') : (a.date || '').localeCompare(b.date || '')) || (a.c || 0) - (b.c || 0));
      },
      group: x => { const t = today(); return x.done ? '끝낸 일' : x.date < t ? '밀린 일' : x.date === t ? '오늘' : '다가오는 일'; },
      row: x => ({ title: x.text || '', meta: x.date ? x.date.slice(5).replace('-', '/') : '', done: !!x.done }),
      toggle: x => updateDoc(doc(todosCol, x.id), { done: !x.done }),
      view: x => [el('p', { class: 'rm-text' }, x.date ? `${x.date} · ${x.done ? '끝냄' : '남음'}` : '')],
      fields: [['text', '할 일'], ['date', '날짜', 'date']],
      defaults: () => ({ date: today() }),
      save: (v, x) => x ? updateDoc(doc(todosCol, x.id), v) : addDoc(todosCol, { ...v, done: false, c: Date.now() }),
      remove: x => deleteDoc(doc(todosCol, x.id)),
    },

    briefing: {
      tag: 'COURIER · MORNING BRIEF', title: '모닝 브리프', empty: '아직 도착한 브리핑이 없어요. 월·목 아침에 와요.',
      load: () => all(briefsCol, 'date'),
      row: b => ({ title: b.dateDisplay || b.date, sub: [b.weekday, b.count && b.count + '건'].filter(Boolean).join(' · '), meta: b.read ? '' : 'NEW' }),
      view: b => {
        if (!b.read) updateDoc(doc(briefsCol, b.id), { read: true }).then(() => { b.read = true; }).catch(() => {});
        if (b.html) { // 원본 메일 HTML — 스크립트 없는 격리 iframe
          const f = el('iframe', { class: 'rm-frame', sandbox: 'allow-popups allow-popups-to-escape-sandbox allow-same-origin', title: '브리핑 본문' });
          f.srcdoc = b.html; f.onload = () => { try { f.style.height = f.contentDocument.documentElement.scrollHeight + 'px'; } catch {} };
          return [f];
        }
        const sec = (name, list) => list?.length ? [el('h3', { class: 'rm-sec' }, name), list.map(i => el('div', { class: 'rm-story' },
          safe(i.url) ? el('a', { href: safe(i.url), target: '_blank', rel: 'noopener' }, i.title || '') : el('b', {}, i.title || ''), el('p', {}, i.summary || ''), el('small', {}, i.source || '')))] : null;
        return [sec('AI 업계', b.news), sec('시장 영향', b.market)];
      },
    },

    settings: {
      tag: 'STUDY · BALCONY', title: '설정',
      async load() {
        const list = [
          { id: 'pin', t: '패턴 바꾸기', s: '저장고를 여는 패턴을 새로 정해요.', run: () => MKVault.changePin() },
          { id: 'recover', t: '패턴을 잊었어요', s: '등록된 메일로 인증 링크를 보내 새 패턴을 정해요.', run: () => MKVault.recover() },
          { id: 'study', t: '서재 암호 다시 묻기', s: '이 기기에서 다음에 비행선을 누르면 서재 암호를 다시 물어요.', run: () => { try { localStorage.removeItem('mk_study'); } catch {} return '다음부터 다시 물어요.'; } },
          { id: 'lock', t: '저장고 잠그기', s: '이 기기에서 지금 바로 로그아웃해요.', run: () => MKVault.logout() },
          { id: 'all', t: '모든 기기에서 로그아웃', s: '다른 기기의 인증도 전부 풀어요.', run: () => MKVault.logoutAll() },
        ];
        if (await gh()) list.push(
          { id: 'ghpush', t: 'GitHub 백업 보내기', s: '메모 전체를 연결된 GitHub 저장소로 보내요.', run: async () => (await ghAll('push-all')) + '개 기록을 보냈어요.' },
          { id: 'ghpull', t: 'GitHub 백업 가져오기', s: 'GitHub 저장소의 기록을 메모로 가져와요.', run: async () => (await ghAll('pull-all')) + '개 기록을 가져왔어요.' });
        return list;
      },
      row: a => ({ title: a.t, sub: a.s, action: a.run }),
    },

    music: {
      tag: 'CITY · SYNTH', title: '음악',
      tabs: [
        { label: '노트', ...noteRoom('', '', () => musicNotesCol, '음악 노트가 없어요.') },
        { label: '좋아하는 곡', empty: '아직 없어요. 좋아하는 곡과 그 이유를 남겨 보세요.', load: () => all(favSongsCol, 'c'),
          row: s => ({ title: s.title || '', sub: [s.artist, s.reason].filter(Boolean).join(' · ') }),
          view: s => [
            vid(s.videoId) && el('div', { class: 'rm-video' }, el('iframe', { src: `https://www.youtube-nocookie.com/embed/${vid(s.videoId)}?rel=0`, title: (s.title || '') + ' 영상', allow: 'autoplay; encrypted-media; picture-in-picture', allowfullscreen: true })),
            el('p', { class: 'rm-meta' }, s.artist || ''), s.reason && el('p', { class: 'rm-text' }, s.reason)],
          fields: [['title', '곡 제목'], ['artist', '가수'], ['link', 'YouTube 링크'], ['reason', '좋아하는 이유', 'textarea']],
          defaults: () => ({}),
          async save(v, s) {
            const videoId = vid(v.link) || (s && !v.link ? s.videoId : null);
            if (v.link && !videoId) throw new Error('YouTube 링크를 알아볼 수 없어요');
            const data = { title: v.title, artist: v.artist, reason: v.reason, videoId };
            return s ? updateDoc(doc(favSongsCol, s.id), data) : addDoc(favSongsCol, { ...data, c: Date.now() });
          },
          edit: s => ({ ...s, link: s.videoId ? 'https://youtu.be/' + s.videoId : '' }),
          remove: s => deleteDoc(doc(favSongsCol, s.id)) },
        { label: '플레이리스트', empty: '플레이리스트가 없어요.',
          async load() { const [pl, songs] = await Promise.all([all(playlistsCol, 'c'), all(playlistSongsCol, 'c', 'asc')]); pl.forEach(p => { p.songs = songs.filter(s => s.plid === p.id); }); return pl; },
          row: p => ({ title: p.name || '', meta: p.songs.length + '곡' }),
          view: p => {
            const f = el('form', { class: 'rm-inline', onsubmit: e => {
              e.preventDefault(); const title = f.elements.title.value.trim(), link = f.elements.link.value.trim();
              if (!safe(link)) return say('곡 링크를 넣어 주세요');
              act(() => addDoc(playlistSongsCol, { title: title || link, link, plid: p.id, c: Date.now() }), () => load(p.id));
            } }, el('input', { name: 'title', placeholder: '곡 제목', 'aria-label': '곡 제목' }), el('input', { name: 'link', placeholder: '링크 (YouTube 등)', 'aria-label': '곡 링크' }), el('button', { class: 'rm-btn sm' }, '+ 곡 넣기'));
            return [
              p.songs.length ? el('ul', { class: 'rm-list' }, p.songs.map(s => el('li', {},
                safe(s.link) ? el('a', { class: 'rm-row', href: safe(s.link), target: '_blank', rel: 'noopener' }, el('span', { class: 'rm-row-main' }, el('b', {}, s.title || s.link))) : el('div', { class: 'rm-row static' }, el('span', { class: 'rm-row-main' }, el('b', {}, s.title || ''))),
                el('button', { type: 'button', class: 'rm-x', 'aria-label': (s.title || '곡') + ' 빼기', onclick: () => act(() => deleteDoc(doc(playlistSongsCol, s.id)), () => load(p.id)) }, '빼기')))) : el('p', { class: 'rm-text' }, '곡이 없어요.'),
              f];
          },
          fields: [['name', '플레이리스트 이름']],
          save: (v, p) => p ? updateDoc(doc(playlistsCol, p.id), v) : addDoc(playlistsCol, { ...v, c: Date.now() }),
          remove: p => Promise.all(p.songs.map(s => deleteDoc(doc(playlistSongsCol, s.id)))).then(() => deleteDoc(doc(playlistsCol, p.id))) },
        { label: '연습 도구', wide: true,
          load: async () => [{ id: 'p', t: '절대음감 퀘스트', s: '레벨을 올리며 음을 듣고 맞혀요.', h: 'pitch-trainer.html' }, { id: 'c', t: '코드 사전', s: 'K-POP 코드, 코드 진행, 5도권, 이론.', h: 'chord-dictionary.html' }],
          row: x => ({ title: x.t, sub: x.s }),
          view: x => [el('iframe', { class: 'rm-tool', src: x.h + '?embed', title: x.t })] },
      ],
    },
  };

  /* ── 화면 ── */
  let st = null, seq = 0;
  const def = () => st.room.tabs ? { ...st.room.tabs[st.tab], tag: st.room.tag, title: st.room.title } : st.room;

  async function load(keep) { // keep: 다시 불러온 뒤 그 항목 화면으로 돌아감(플레이리스트 곡 넣기 등)
    const my = ++seq; st.view = 'loading'; st.chips = null; draw();
    try {
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
    } catch (e) { if (st === mine) done('실패했어요: ' + (e.message || e)); }
  }
  function ask(label, value = '') { const v = prompt(label, value); return v && v.trim(); }

  function draw(focus = true) {
    if (st.leave && st.view !== 'compose') { st.leave(); st.leave = null; }
    const d = def(), back = st.view === 'item' || st.view === 'compose';
    const top = el('div', { class: 'rm-top' }, el('span', {}, d.tag),
      el('button', { type: 'button', onclick: back ? () => { st.view = 'list'; draw(); } : st.close }, back ? '← 목록' : '닫기 ×'));
    const h = el('h1', { class: 'rm-title', tabindex: '-1' }, st.view === 'item' ? (d.row(st.item).title || '') : st.view === 'compose' ? (st.item ? '고치기' : '새로 넣기') : d.title);
    const body = el('div', { class: 'rm-body' });
    if (st.note) body.append(el('p', { class: 'rm-note', role: 'status' }, st.note));
    if (!back) { // 탭(음악)·폴더 칩: 불러오는 중·오류일 때도 보여서 다른 탭으로 옮겨 갈 수 있음
      const tabs = st.room.tabs ? st.room.tabs.map((t, i) => ({ label: t.label, on: i === st.tab, pick: () => { st.tab = i; st.filter = null; st.note = ''; load(); } }))
        : (st.chips || []).map(c => ({ label: c.label, on: c.value === st.filter, pick: () => { st.filter = c.value; st.note = ''; draw(); } }));
      if (tabs.length) body.append(el('div', { class: 'rm-chips', role: 'group', 'aria-label': '분류' }, tabs.map(t => el('button', { type: 'button', 'aria-pressed': String(t.on), onclick: t.pick }, t.label))));
    }

    if (st.view === 'loading') body.append(el('div', { class: 'rm-state' }, el('div', { class: 'rm-ring spin' }), el('p', {}, '불러오는 중')));
    else if (st.view === 'error') body.append(el('div', { class: 'rm-state' }, el('div', { class: 'rm-ring bad' }), el('p', {}, '불러오지 못했어요. ' + st.err), el('button', { type: 'button', class: 'rm-btn', onclick: () => load() }, '다시 시도')));
    else if (st.view === 'item') {
      const meta = d.row(st.item).meta;
      if (meta) body.append(el('p', { class: 'rm-meta' }, meta));
      body.append(...d.view(st.item, st).flat(Infinity).filter(Boolean));
      const tools = el('div', { class: 'rm-tools' });
      if (d.save && (!d.canEdit || d.canEdit(st.item))) tools.append(el('button', { type: 'button', class: 'rm-btn ghost', onclick: () => { st.view = 'compose'; draw(); } }, '고치기'));
      if (d.remove) tools.append(el('button', { type: 'button', class: 'rm-btn ghost danger', onclick: () => confirm('지울까요? 되돌릴 수 없어요.') && act(() => d.remove(st.item)) }, '지우기'));
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
        el('div', { class: 'rm-tools' }, el('button', { class: 'rm-btn' }, '저장'), el('button', { type: 'button', class: 'rm-btn ghost', onclick: () => { st.view = st.item ? 'item' : 'list'; draw(); } }, '취소')));
      st.leave = () => { if (saving) left = true; else ex?.discard(); }; // 취소·목록·Esc·다른 방 모두 여기로
      body.append(form);
    } else { // list
      const tools = el('div', { class: 'rm-tools' });
      if (d.save) tools.append(el('button', { type: 'button', class: 'rm-btn', onclick: () => { st.item = null; st.note = ''; st.view = 'compose'; draw(); } }, '+ 새로 넣기'));
      if (d.upload) {
        const inp = el('input', { type: 'file', multiple: true, hidden: true, onchange: () => { const files = [...inp.files]; inp.value = ''; if (files.length) act(() => d.upload(files, st)); } });
        tools.append(inp, el('button', { type: 'button', class: 'rm-btn', onclick: () => inp.click() }, '+ 파일 올리기'));
      }
      if (d.folders) {
        const F = d.folders, cur = st.folders?.find(f => f.id === st.filter);
        tools.append(el('button', { type: 'button', class: 'rm-btn ghost', onclick: () => { const name = ask('새 폴더 이름'); if (name) act(() => addDoc(F.col(), { name, icon: 'folder', order: Date.now() })); } }, '+ 폴더'));
        if (cur) tools.append(
          el('button', { type: 'button', class: 'rm-btn ghost', onclick: () => { const name = ask('폴더 이름', cur.name || ''); if (name) act(() => updateDoc(doc(F.col(), cur.id), { name })); } }, '이름 바꾸기'),
          el('button', { type: 'button', class: 'rm-btn ghost danger', onclick: () => confirm(`'${cur.name || '이 폴더'}'와 안의 것을 모두 지울까요? 되돌릴 수 없어요.`) && act(() => F.wipe(cur.id).then(() => { st.filter = null; })) }, '폴더 지우기'));
      }
      if (tools.children.length) body.append(tools);
      const items = st.filter != null && d.match ? st.items.filter(x => d.match(x, st.filter)) : st.items;
      if (!items.length) body.append(el('div', { class: 'rm-state' }, el('div', { class: 'rm-ring' }, el('span', {}, 'EMPTY')), el('p', {}, d.empty || '아직 비어 있어요.')));
      else {
        const ul = el('ul', { class: 'rm-list' }); let last;
        for (const x of items) {
          const r = d.row(x), g = d.group?.(x);
          if (g && g !== last) { last = g; ul.append(el('li', { class: 'rm-group' }, g)); }
          const inner = [el('span', { class: 'rm-row-main' }, el('b', {}, r.title), r.sub && el('small', {}, r.sub)), r.meta && el('time', { class: r.meta === 'NEW' ? 'new' : null }, r.meta)];
          const tgt = r.action || d.view ? el('button', { type: 'button', class: 'rm-row', onclick: r.action ? () => act(r.action, null) : () => { st.item = x; st.note = ''; st.view = 'item'; draw(); } }, inner)
            : el('div', { class: 'rm-row static' }, inner);
          ul.append(el('li', { class: r.done ? 'done' : null },
            d.toggle && el('button', { type: 'button', class: 'rm-check', 'aria-pressed': String(!!r.done), 'aria-label': (r.done ? '안 끝냄으로: ' : '끝냄으로: ') + r.title, onclick: () => act(() => d.toggle(x)) }), tgt));
        }
        body.append(ul);
      }
    }
    root.replaceChildren(el('div', { class: 'rm-wrap' + (d.wide && st.view === 'item' ? ' wide' : '') }, top, h, body));
    if (focus) h.focus({ preventScroll: true });
  }

  root.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !st || root.hasAttribute('aria-busy')) return; // 저장 중엔 화면 전환 막음(버튼도 잠김)
    e.preventDefault();
    if (st.view === 'item' || st.view === 'compose') { st.view = 'list'; draw(); } else st.close();
  });

  window.mkRooms = {
    has: k => k in ROOMS,
    open(key, close) { root.removeAttribute('aria-busy'); st?.leave?.(); retryOrphans(); st = { room: ROOMS[key], tab: 0, filter: null, items: [], view: 'loading', close, note: '' }; load(); },
  };
})();
