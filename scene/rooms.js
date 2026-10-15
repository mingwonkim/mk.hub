/* 저장고 방들 — 옛 MK.HUB 페이지는 버리고, 같은 Firestore 데이터를 새 화면(비행선 해치 톤) 하나에 그림.
   db·getDocs·memosCol 등은 index.html의 전역 let — 같은 전역 스코프라 이름으로 바로 씀(저장고 인증 뒤에만 열림).
   scene.js 라우터가 mkRooms.open(키, 닫기함수)로 부름. */
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
  const yt = id => id ? 'https://www.youtube.com/watch?v=' + encodeURIComponent(id) : null;

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
      async load(st) {
        const [items, folders] = await Promise.all([all(memosCol, 'u'), all(memoFoldersCol, 'order', 'asc')]);
        st.chips = [{ label: '전체', value: null }, ...folders.map(f => ({ label: f.name || '이름 없음', value: f.id }))];
        return items;
      },
      match: (m, f) => (m.folder || 'none') === f,
      row: m => ({ title: m.t || '제목 없음', sub: m.type === 'draw' ? '그림' : m.type === 'file' ? (m.att?.[0]?.n || '파일') : (m.b || '').split('\n')[0], meta: day(m.u) }),
      view: m => [
        m.type === 'draw' ? el('img', { class: 'rm-img', src: m.b, alt: m.t || '그림' }) : el('p', { class: 'rm-text' }, m.b || ''),
        m.canvas_url && el('img', { class: 'rm-img', src: m.canvas_url, alt: '함께 그린 그림' }),
        (m.att || []).map(a => el('a', { class: 'rm-file', href: safe(a.url), download: a.n }, `${a.n} · ${size(a.size)}`)),
      ],
      fields: [['t', '제목'], ['b', '내용', 'textarea']],
      canEdit: m => m.type !== 'draw' && m.type !== 'file',
      save: (v, m, st) => m ? updateDoc(doc(memosCol, m.id), { ...v, u: Date.now() }) : addDoc(memosCol, { ...v, folder: st.filter || 'none', c: Date.now(), u: Date.now() }),
      remove: m => deleteDoc(doc(memosCol, m.id)), // ponytail: 첨부 파일 원본(Storage)은 남음 — 용량 문제 되면 path로 deleteObject
    },

    files: {
      tag: 'STUDY · DRAWER', title: '파일', empty: '서랍이 비어 있어요.',
      async load(st) {
        const [items, folders] = await Promise.all([all(filesCol, 'c'), all(fileFoldersCol, 'order', 'asc')]);
        st.chips = folders.length ? [{ label: '전체', value: null }, ...folders.map(f => ({ label: f.name || '이름 없음', value: f.id }))] : null;
        return items;
      },
      match: (f, v) => f.folder === v,
      row: f => ({ title: f.n || '파일', sub: [f.type, size(f.size)].filter(Boolean).join(' · '), meta: day(f.c), href: f.url, download: f.n }),
      upload: async (list, st) => {
        for (const f of list) {
          if (f.size > 50 * 1024 * 1024) throw new Error(f.name + ': 50MB까지 올릴 수 있어요');
          const r = sRef(stg, 'mk_files/f' + Date.now() + '_' + Math.random().toString(36).slice(2, 6) + '_' + f.name);
          await uploadBytes(r, f);
          await addDoc(filesCol, { n: f.name, size: f.size, type: f.type, url: await getDownloadURL(r), path: r.fullPath, c: Date.now(), folder: st.filter || null });
        }
      },
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
      load: async () => [
        { id: 'pin', t: '패턴 바꾸기', s: '저장고를 여는 패턴을 새로 정해요.', run: () => MKVault.changePin() },
        { id: 'study', t: '서재 암호 다시 묻기', s: '이 기기에서 다음에 비행선을 누르면 서재 암호를 다시 물어요.', run: () => { try { localStorage.removeItem('mk_study'); } catch {} return '다음부터 다시 물어요.'; } },
        { id: 'lock', t: '저장고 잠그기', s: '지금 바로 로그아웃해요.', run: () => MKVault.logout() },
      ],
      row: a => ({ title: a.t, sub: a.s, action: a.run }),
    },

    music: {
      tag: 'CITY · SYNTH', title: '음악',
      tabs: [
        { label: '노트', ...noteRoom('', '', () => musicNotesCol, '음악 노트가 없어요.') },
        { label: '좋아하는 곡', empty: '아직 없어요.', load: () => all(favSongsCol, 'c'),
          row: s => ({ title: s.title || '', sub: [s.artist, s.reason].filter(Boolean).join(' · '), href: yt(s.videoId), blank: true }) },
        { label: '플레이리스트', empty: '플레이리스트가 없어요.',
          async load() { const [pl, songs] = await Promise.all([all(playlistsCol, 'c'), all(playlistSongsCol, 'c', 'asc')]); pl.forEach(p => { p.songs = songs.filter(s => s.plid === p.id); }); return pl; },
          row: p => ({ title: p.name || '', meta: p.songs.length + '곡' }),
          view: p => p.songs.length ? p.songs.map(s => el('a', { class: 'rm-file', href: safe(s.link), target: '_blank', rel: 'noopener' }, s.title || s.link)) : [el('p', { class: 'rm-text' }, '곡이 없어요.')] },
        { label: '연습 도구', load: async () => [{ id: 'p', t: '절대음감 연습', h: 'pitch-trainer.html' }, { id: 'c', t: '코드 사전', h: 'chord-dictionary.html' }],
          row: x => ({ title: x.t, href: x.h, blank: true }) },
      ],
    },
  };

  /* ── 화면 ── */
  let st = null, seq = 0;
  const def = () => st.room.tabs ? { ...st.room.tabs[st.tab], tag: st.room.tag, title: st.room.title } : st.room;

  async function load() {
    const my = ++seq; st.view = 'loading'; st.chips = null; draw();
    try { const items = await def().load(st); if (my !== seq) return; st.items = items; st.view = 'list'; }
    catch (e) { if (my !== seq) return; st.err = e.message || String(e); st.view = 'error'; }
    draw();
  }
  function say(msg) { // 다시 그리지 않고 알림만(입력 중인 폼·초점 유지)
    let n = root.querySelector('.rm-note');
    if (!n) { n = el('p', { class: 'rm-note', role: 'status' }); root.querySelector('.rm-body')?.prepend(n); }
    n.textContent = msg;
  }
  async function act(fn, after = load) { // 저장·삭제 등. 진행 중엔 컨트롤만 잠그고, 실패하면 입력 그대로 풀어 줌
    const mine = st, was = document.activeElement, ctl = [...root.querySelectorAll('button, input, textarea')].filter(c => !c.disabled);
    ctl.forEach(c => { c.disabled = true; }); root.setAttribute('aria-busy', 'true');
    const done = msg => { ctl.forEach(c => { c.disabled = false; }); root.removeAttribute('aria-busy'); if (msg) say(msg); if (root.contains(was)) was.focus(); };
    try {
      const msg = await fn(); if (st !== mine) return; // 그새 다른 방으로 갔으면 결과 무시
      if (after) { root.removeAttribute('aria-busy'); st.note = typeof msg === 'string' ? msg : ''; await after(); } else done(typeof msg === 'string' ? msg : '');
    } catch (e) { if (st === mine) done('실패했어요: ' + (e.message || e)); }
  }

  function draw(focus = true) {
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
    else if (st.view === 'error') body.append(el('div', { class: 'rm-state' }, el('div', { class: 'rm-ring bad' }), el('p', {}, '불러오지 못했어요. ' + st.err), el('button', { type: 'button', class: 'rm-btn', onclick: load }, '다시 시도')));
    else if (st.view === 'item') {
      body.append(el('p', { class: 'rm-meta' }, d.row(st.item).meta || ''), ...d.view(st.item).flat());
      const tools = el('div', { class: 'rm-tools' });
      if (d.save && (!d.canEdit || d.canEdit(st.item))) tools.append(el('button', { type: 'button', class: 'rm-btn ghost', onclick: () => { st.view = 'compose'; draw(); } }, '고치기'));
      if (d.remove) tools.append(el('button', { type: 'button', class: 'rm-btn ghost danger', onclick: () => confirm('지울까요? 되돌릴 수 없어요.') && act(() => d.remove(st.item)) }, '지우기'));
      if (tools.children.length) body.append(tools);
    } else if (st.view === 'compose') {
      const v = st.item || (d.defaults ? d.defaults() : {});
      const form = el('form', { class: 'rm-form', onsubmit: e => {
        e.preventDefault(); const data = Object.fromEntries(d.fields.map(([k]) => [k, form.elements[k].value.trim()]));
        if (!data[d.fields[0][0]]) return form.elements[d.fields[0][0]].focus();
        act(() => d.save(data, st.item, st));
      } }, d.fields.map(([k, label, type]) => el('label', {}, el('span', {}, label),
        type === 'textarea' ? el('textarea', { name: k, rows: 8 }, v[k] || '') : el('input', { name: k, type: type || 'text', value: v[k] || '' }))),
        el('div', { class: 'rm-tools' }, el('button', { class: 'rm-btn' }, '저장'), el('button', { type: 'button', class: 'rm-btn ghost', onclick: () => { st.view = st.item ? 'item' : 'list'; draw(); } }, '취소')));
      body.append(form);
    } else { // list
      const tools = el('div', { class: 'rm-tools' });
      if (d.save) tools.append(el('button', { type: 'button', class: 'rm-btn', onclick: () => { st.item = null; st.note = ''; st.view = 'compose'; draw(); } }, '+ 새로 넣기'));
      if (d.upload) {
        const inp = el('input', { type: 'file', multiple: true, hidden: true, onchange: () => { const files = [...inp.files]; if (files.length) act(() => d.upload(files, st)); } });
        tools.append(inp, el('button', { type: 'button', class: 'rm-btn', onclick: () => inp.click() }, '+ 파일 올리기'));
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
          const href = r.href && safe(r.href);
          const tgt = href ? el('a', { class: 'rm-row', href, download: r.download, target: r.blank ? '_blank' : null, rel: r.blank ? 'noopener' : null }, inner)
            : r.action || d.view ? el('button', { type: 'button', class: 'rm-row', onclick: r.action ? () => act(r.action, null) : () => { st.item = x; st.note = ''; st.view = 'item'; draw(); } }, inner)
            : el('div', { class: 'rm-row static' }, inner); // 열 것이 없는 줄(링크 없는 곡 등)
          ul.append(el('li', { class: r.done ? 'done' : null },
            d.toggle && el('button', { type: 'button', class: 'rm-check', 'aria-pressed': String(!!r.done), 'aria-label': (r.done ? '안 끝냄으로: ' : '끝냄으로: ') + r.title, onclick: () => act(() => d.toggle(x)) }), tgt));
        }
        body.append(ul);
      }
    }
    root.replaceChildren(el('div', { class: 'rm-wrap' }, top, h, body));
    if (focus) h.focus({ preventScroll: true });
  }

  root.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !st || root.hasAttribute('aria-busy')) return; // 저장 중엔 화면 전환 막음(버튼도 잠김)
    e.preventDefault();
    if (st.view === 'item' || st.view === 'compose') { st.view = 'list'; draw(); } else st.close();
  });

  window.mkRooms = {
    has: k => k in ROOMS,
    open(key, close) { root.removeAttribute('aria-busy'); st = { room: ROOMS[key], tab: 0, filter: null, items: [], view: 'loading', close, note: '' }; load(); },
  };
})();
