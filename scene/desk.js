/* 서재 책상 위 두 방(astra ADHD 설계 반영):
   · 잡생각(창문 포스트잇) — 생각나면 바로 내려놓기. 본문 한 칸, 저장해도 키보드 유지, 초안은 기기에 보관. 정리는 선택형(하루 한 번 "3개만 살펴보기").
   · 할 일 달력(코르크 메모판·세로 판) — 7일 날짜 줄 + 펼치는 월간 달력, 날짜마다 "남음 n", 먼저 할 1개, 지난 일은 "다시 정할 일"로 접기, 해낸 일 기록.
   피하는 것: 빨간 배지, 연속 기록, "밀렸어요", 강제 분류. 데이터: mk_app/data/thoughts(새), mk_app/data/todos(기존 + completedAt·first·let). */
(() => {
  const { el, all, say } = mkRooms.kit;
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
  const today = () => ymd(new Date());
  const WD = ['일', '월', '화', '수', '목', '금', '토'];
  const label = s => { const d = parse(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]})`; };
  const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? '방금' : m < 60 ? m + '분 전' : m < 1440 ? Math.round(m / 60) + '시간 전' : Math.round(m / 1440) + '일 전'; };
  const store = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };
  const read = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const THOUGHTS = () => collection(db, 'mk_app', 'data', 'thoughts');
  const tdoc = id => doc(todosCol, id);

  // 잡생각 ↔ 할 일 전환(두 방 위)
  const switcher = on => el('nav', { class: 'dk-switch', 'aria-label': '책상' },
    el('a', { href: '#thoughts', 'aria-current': on === 'thoughts' ? 'page' : null }, '잡생각'),
    el('a', { href: '#todo', 'aria-current': on === 'todo' ? 'page' : null }, '할 일'));

  // 되돌리기 알림(5초)
  // undo: () => Promise<boolean>. 실패하면 알림을 남겨 다시 누를 수 있게
  function undoToast(host, text, undo) {
    host.querySelector('.dk-toast')?.remove();
    const msg = el('span', {}, text), btn = undo && el('button', { type: 'button', onclick: async () => {
      btn.disabled = true; clearTimeout(timer);
      if (await undo()) t.remove(); else { msg.textContent = '되돌리지 못했어요. 다시 눌러 주세요.'; btn.disabled = false; }
    } }, '되돌리기');
    const t = el('div', { class: 'dk-toast', role: 'status' }, msg, btn);
    host.append(t); const timer = setTimeout(() => t.remove(), 5000);
  }
  // 다시 그린 뒤 키보드 초점을 같은 버튼(data-k)으로 되돌림
  const keepFocus = (box, fn) => { const k = document.activeElement?.dataset?.k; fn(); if (k) box.querySelector(`[data-k="${k}"]`)?.focus(); };

  // 할 일 만들기(잡생각에서도 씀): 날짜 고르기 칩
  function dateChips(onPick) {
    const custom = el('input', { type: 'date', class: 'dk-date', 'aria-label': '날짜 선택', onchange: e => e.target.value && onPick(e.target.value) });
    return el('div', { class: 'dk-chips' },
      el('button', { type: 'button', onclick: () => onPick(today()) }, '오늘'),
      el('button', { type: 'button', onclick: () => onPick(addDays(today(), 1)) }, '내일'),
      el('label', { class: 'dk-pick' }, '날짜 선택', custom),
      el('button', { type: 'button', onclick: () => onPick(null) }, '날짜 없이'));
  }

  /* ───────── 잡생각 ───────── */
  mkRooms.define('thoughts', {
    tag: 'STUDY · STICKY NOTES', title: '잡생각',
    load: () => all(THOUGHTS(), 'c'),
    row: () => ({}),
    render(body, st) {
      const items = st.items, host = body;
      let expanded = false, query = '', showLet = false;
      const live = () => items.filter(x => x.state !== 'let');
      body.append(switcher('thoughts'));

      // 하루 한 번, 선택형 정리 제안
      const triageBox = el('div');
      const offerTriage = () => {
        const open = items.filter(x => x.state === 'open' && !(x.snooze > Date.now()));
        if (!open.length || read('mk_triage_day') === today()) return;
        triageBox.replaceChildren(el('div', { class: 'dk-offer' }, el('p', {}, '생각 3개만 살펴볼까요?'),
          el('button', { type: 'button', class: 'rm-btn sm', onclick: () => { store('mk_triage_day', today()); triage(); } }, '살펴보기'),
          el('button', { type: 'button', class: 'rm-btn ghost sm', onclick: () => { store('mk_triage_day', today()); triageBox.replaceChildren(); } }, '지금 말고')));
      };
      function triage() {
        const now = Date.now(), open = items.filter(x => x.state === 'open' && !(x.snooze > now));
        const old = read('mk_resurface_off') ? [] : open.filter(x => x.c < now - 7 * 864e5).slice(-1); // 7일 지난 것 하루 최대 1개
        const queue = [...old, ...open.filter(x => !old.includes(x))].slice(0, 3);
        let i = 0;
        const step = () => {
          if (i >= queue.length) return triageBox.replaceChildren(el('div', { class: 'dk-offer' }, el('p', {}, '다 봤어요. 나머지는 그대로 둬도 괜찮아요.'),
            el('button', { type: 'button', class: 'rm-btn ghost sm', onclick: () => triageBox.replaceChildren() }, '닫기'),
            !read('mk_resurface_off') && el('button', { type: 'button', class: 'dk-link', onclick: e => { store('mk_resurface_off', '1'); e.target.remove(); } }, '오래된 생각 다시 보여주기 끄기')));
          const x = queue[i++];
          triageBox.replaceChildren(el('div', { class: 'dk-offer focus' }, el('small', {}, `${i} / ${queue.length} · ${ago(x.c)}`), el('p', { class: 'dk-big' }, x.text),
            actions(x, step, true)));
        };
        step();
      }

      // 카드의 세 가지(+그대로 두기)
      function actions(x, after, inTriage) {
        const box = el('div', { class: 'dk-actions' });
        const toTodo = el('button', { type: 'button', class: 'rm-btn sm', disabled: !!x.todoId, onclick: () => {
          const text = el('input', { class: 'dk-line', value: x.text.split('\n')[0].slice(0, 120), 'aria-label': '할 일 문구' });
          let busy = false;
          box.replaceChildren(text, dateChips(async date => {
            if (busy) return; busy = true;
            // 할 일 ID를 생각 ID로 고정 → 연타·재시도해도 같은 문서(중복 없음)
            const todoId = 'th_' + x.id;
            try {
              if (!(await getDoc(tdoc(todoId))).exists()) // 이미 있으면(부분 실패 뒤 재시도) 덮어쓰지 않고 연결만
                await setDoc(tdoc(todoId), { text: text.value.trim() || x.text, date, done: false, c: Date.now(), from: x.id });
              await updateDoc(doc(THOUGHTS(), x.id), { state: 'todo', todoId }); Object.assign(x, { state: 'todo', todoId });
              say(date ? `${label(date)} 할 일로 옮겼어요.` : '날짜 없는 할 일로 옮겼어요.'); paint(); after?.();
            } catch (e) { say('실패했어요(다시 눌러도 겹치지 않아요): ' + e.message); }
            finally { busy = false; }
          }));
          text.focus();
        } }, x.todoId ? '할 일에 있음' : '할 일로');
        const keep = el('button', { type: 'button', class: 'rm-btn ghost sm', onclick: () => set(x, { state: x.state === 'kept' ? 'open' : 'kept' }, after) }, x.state === 'kept' ? '간직 풀기' : '간직하기');
        const letGo = el('button', { type: 'button', class: 'rm-btn ghost sm', onclick: async () => { const was = x.state;
          if (await set(x, { state: 'let', letAt: Date.now() }, after)) undoToast(host, '놓아줬어요.', () => x.state === 'let' ? set(x, { state: was }) : Promise.resolve(true)); } }, '놓아주기');
        box.append(...[toTodo, keep, letGo, inTriage && el('button', { type: 'button', class: 'dk-link', onclick: () => set(x, { snooze: Date.now() + 7 * 864e5 }, after) }, '그대로 두기')].filter(Boolean));
        return box;
      }
      async function set(x, patch, after) { // 성공 여부를 돌려줌(되돌리기는 성공했을 때만)
        try { await updateDoc(doc(THOUGHTS(), x.id), patch); Object.assign(x, patch); paint(); after?.(); return true; }
        catch (e) { say('실패했어요: ' + e.message); return false; }
      }

      // 목록: 최신 5개(3줄), 더 보기·검색
      const list = el('div', { class: 'dk-notes' });
      function paint() { keepFocus(list, paintList); }
      function paintList() {
        const q = query.trim(), pool = live().filter(x => !q || x.text.includes(q));
        const shown = expanded || q ? pool : pool.slice(0, 5), let_ = items.filter(x => x.state === 'let');
        list.replaceChildren(...[ // 빈 값(null)은 걸러야 함 — replaceChildren은 null을 글자로 넣음
          ...shown.map(x => {
            const card = el('article', { class: 'dk-note' + (x.state === 'kept' ? ' kept' : '') + (x.state === 'todo' ? ' todo' : '') });
            const open = el('button', { type: 'button', class: 'dk-note-body', 'data-k': 'n' + x.id, 'aria-expanded': 'false', onclick: () => {
              const on = open.getAttribute('aria-expanded') !== 'true'; open.setAttribute('aria-expanded', String(on));
              card.querySelector('.dk-actions')?.remove(); if (on) card.append(actions(x));
            } }, el('p', {}, x.text), el('small', {}, ago(x.c) + (x.state === 'kept' ? ' · 간직' : x.state === 'todo' ? ' · 할 일로 옮김' : '')));
            card.append(open); return card;
          }),
          pool.length > 5 && !expanded && !q ? el('button', { type: 'button', class: 'dk-link', onclick: () => { expanded = true; paint(); } }, `더 보기 (${pool.length - 5})`) : null,
          let_.length ? el('button', { type: 'button', class: 'dk-link', 'aria-expanded': String(showLet), onclick: () => { showLet = !showLet; paint(); } }, `놓아준 생각 ${let_.length}`) : null,
          ...(showLet ? let_.map(x => el('div', { class: 'dk-let' }, el('span', {}, x.text), el('button', { type: 'button', class: 'dk-link', onclick: () => set(x, { state: 'open' }) }, '되돌리기'))) : []),
        ].filter(Boolean));
      }
      const search = el('input', { type: 'search', class: 'dk-search', placeholder: '찾기', 'aria-label': '잡생각 찾기', oninput: e => { query = e.target.value; paint(); } });

      // 입력: 본문 한 칸. Enter는 줄바꿈, '담기'로 저장(저장 뒤에도 키보드 유지), 초안은 기기에
      const ta = el('textarea', { class: 'dk-input', rows: 1, placeholder: '떠오른 생각, 그냥 여기 내려놓기', 'aria-label': '잡생각 적기' });
      const status = el('small', { class: 'dk-status', role: 'status' });
      const putBtn = el('button', { type: 'button', class: 'dk-put' }, '담기');
      let composing = false, saving = false;
      ta.value = read('mk_thought_draft') || '';
      const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, innerHeight * .4) + 'px'; };
      ta.addEventListener('compositionstart', () => { composing = true; });
      ta.addEventListener('compositionend', () => { composing = false; });
      ta.addEventListener('input', () => { grow(); store('mk_thought_draft', ta.value || null); status.textContent = ta.value ? '기기에 보관됨' : ''; });
      ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.isComposing) { e.preventDefault(); put(); } }); // PC: Ctrl/⌘+Enter(한글 조합 중엔 무시)
      putBtn.addEventListener('pointerdown', e => e.preventDefault()); // 눌러도 입력창 포커스(키보드) 유지
      putBtn.addEventListener('click', () => put());
      async function put() {
        if (saving) return;
        if (composing) return void ta.addEventListener('compositionend', () => setTimeout(put), { once: true }); // 한글 조합이 끝난 뒤 저장
        const text = ta.value.trim(); if (!text) return ta.focus();
        // 누르는 순간 입력창을 비워 다음 생각을 바로 적게 함. 실패하면 되돌려 넣음(그새 쓴 글 앞에)
        saving = true; putBtn.disabled = true; ta.value = ''; grow(); status.textContent = '담는 중…';
        try {
          const c = Date.now(), ref = await addDoc(THOUGHTS(), { text, c, state: 'open' });
          items.unshift({ id: ref.id, text, c, state: 'open' }); paint();
          store('mk_thought_draft', ta.value || null);
          status.textContent = '여기 담아뒀어요 · 동기화됨';
          bar.classList.remove('glow'); void bar.offsetWidth; bar.classList.add('glow');
        } catch (e) {
          ta.value = text + (ta.value ? '\n' + ta.value : ''); grow(); store('mk_thought_draft', ta.value);
          status.textContent = '저장하지 못했어요. 글은 그대로 있어요 — 다시 담기를 눌러 주세요.';
        } finally { saving = false; putBtn.disabled = false; ta.focus(); }
      }
      const bar = el('div', { class: 'dk-bar' }, ta, putBtn);

      body.append(...[triageBox, list, items.length > 5 && search,
        el('a', { class: 'dk-link block', href: '#memo' }, '메모 보관함 →'),
        el('div', { class: 'dk-dock' }, status, bar)].filter(Boolean));
      paint(); offerTriage(); grow();
      setTimeout(() => ta.focus({ preventScroll: true }), 30);
    },
  });

  /* ───────── 할 일 달력 ───────── */
  let sel = today(), monthOpen = false, logView = false;
  mkRooms.define('todo', {
    tag: 'STUDY · CORKBOARD', title: '할 일',
    load: async () => (await all(todosCol)).filter(x => !x.let),
    row: () => ({}),
    render(body, st) {
      const items = st.items, host = body;
      const on = d => items.filter(x => x.date === d && !x.let);
      const left = d => on(d).filter(x => !x.done).length;
      body.append(switcher('todo'));
      const main = el('div', { class: 'dk-cal' });
      body.append(main);

      let firstBusy = false;
      const inFlight = new Map(); // 항목별 저장 중 개수(별표와 날짜 이동이 겹치지 않게)
      const busyOn = id => inFlight.set(id, (inFlight.get(id) || 0) + 1), busyOff = id => { const n = (inFlight.get(id) || 1) - 1; n ? inFlight.set(id, n) : inFlight.delete(id); };
      async function save(x, patch, msg, undoPatch) {
        if ('date' in patch) {
          if (firstBusy) { say('잠깐만요, 다시 눌러 주세요.'); return false; } // 별표 처리 중엔 날짜 이동 안 함
          patch = { ...patch, first: false }; // 날짜를 옮기면 '먼저 할 1개'는 늘 풂(하루 1개 유지)
        }
        busyOn(x.id); let off = false;
        try {
          await updateDoc(tdoc(x.id), patch); Object.assign(x, patch); busyOff(x.id); off = true; paint();
          // 되돌리기: 그새 다른 변경이 없을 때만(바꾼 값이 그대로일 때)
          if (msg) undoToast(host, msg, undoPatch && (() => Object.keys(undoPatch).every(k => x[k] === patch[k] || (x[k] == null && patch[k] == null)) ? save(x, undoPatch) : Promise.resolve(true)));
          return true;
        } catch (e) { say('실패했어요: ' + e.message); return false; }
        finally { if (!off) busyOff(x.id); }
      }
      const check = x => save(x, x.done ? { done: false, completedAt: null } : { done: true, completedAt: Date.now() }, x.done ? null : '끝냈어요.', { done: false, completedAt: null });
      const first = async x => { // 하루에 1개만: 다른 것을 먼저 풀고 나서 켬(연타 막음)
        if (firstBusy || on(x.date).some(y => inFlight.has(y.id))) return; firstBusy = true;
        try {
          const d0 = x.date;
          if (!x.first) for (const y of on(d0).filter(y => y.first && y !== x)) if (!await save(y, { first: false })) return;
          if (x.date !== d0) return; // 그새 날짜가 바뀌었으면 켜지 않음
          await save(x, { first: !x.first });
        } finally { firstBusy = false; }
      };

      function row(x, extra) {
        const text = el('button', { type: 'button', class: 'dk-todo-text', onclick: () => {
          const inp = el('input', { class: 'dk-line', value: x.text || '', 'aria-label': '할 일 고치기',
            onkeydown: e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); inp.blur(); } },
            onblur: () => { const v = inp.value.trim(); v && v !== x.text ? save(x, { text: v }) : paint(); } });
          text.replaceWith(inp); inp.focus();
        } }, x.text || '');
        return el('li', { class: 'dk-todo' + (x.done ? ' done' : '') + (x.first ? ' first' : '') },
          el('button', { type: 'button', class: 'rm-check', 'data-k': 'c' + x.id, 'aria-pressed': String(!!x.done), 'aria-label': (x.done ? '안 끝냄으로: ' : '끝냄으로: ') + x.text, onclick: () => check(x) }),
          text,
          extra || (!x.done && x.date && el('button', { type: 'button', class: 'dk-star', 'data-k': 's' + x.id, 'aria-pressed': String(!!x.first), 'aria-label': '먼저 할 1개로' + (x.first ? ' 풀기' : ''), title: '먼저 할 1개', onclick: () => first(x) }, x.first ? '★' : '☆')));
      }

      function weekStrip() {
        const start = addDays(sel, -parse(sel).getDay());
        const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
        return el('div', { class: 'dk-week' },
          el('button', { type: 'button', class: 'dk-nav', 'data-k': 'pw', 'aria-label': '이전 주', onclick: () => { sel = addDays(sel, -7); paint(); } }, '‹'),
          ...days.map((d, i) => { const n = left(d), done = on(d).filter(x => x.done).length; const dd = parse(d);
            return el('button', { type: 'button', class: 'dk-day' + (d === sel ? ' sel' : '') + (d === today() ? ' today' : ''), 'data-k': 'd' + i, 'aria-pressed': String(d === sel), 'aria-label': `${label(d)} 남음 ${n}`, onclick: () => { sel = d; paint(); } },
              el('small', {}, WD[dd.getDay()]), el('b', {}, dd.getDate()), el('i', {}, n ? `남음 ${n}` : done ? '✓' : ''));
          }),
          el('button', { type: 'button', class: 'dk-nav', 'data-k': 'nw', 'aria-label': '다음 주', onclick: () => { sel = addDays(sel, 7); paint(); } }, '›'));
      }
      function monthGrid() {
        const d0 = parse(sel); d0.setDate(1);
        const startPad = d0.getDay(), days = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate();
        const cells = [...Array(startPad).fill(null), ...Array.from({ length: days }, (_, i) => ymd(new Date(d0.getFullYear(), d0.getMonth(), i + 1)))];
        const move = n => { const d = parse(sel); d.setDate(1); d.setMonth(d.getMonth() + n); sel = ymd(d); paint(); };
        return el('div', { class: 'dk-month' },
          el('div', { class: 'dk-month-head' }, el('button', { type: 'button', class: 'dk-nav', 'data-k': 'pm', 'aria-label': '이전 달', onclick: () => move(-1) }, '‹'), el('span', {}, `${d0.getFullYear()}년 ${d0.getMonth() + 1}월`), el('button', { type: 'button', class: 'dk-nav', 'data-k': 'nm', 'aria-label': '다음 달', onclick: () => move(1) }, '›')),
          el('div', { class: 'dk-grid' }, WD.map(w => el('small', {}, w)),
            cells.map(d => d ? (() => { const n = left(d), done = on(d).filter(x => x.done).length;
              return el('button', { type: 'button', class: 'dk-cell' + (d === sel ? ' sel' : '') + (d === today() ? ' today' : ''), 'data-k': 'm' + d, 'aria-label': `${label(d)} 남음 ${n} 완료 ${done}`, onclick: () => { sel = d; monthOpen = false; paint(); main.querySelector(`[data-k="d${parse(d).getDay()}"]`)?.focus(); } }, // 달력이 닫히면 주간 줄의 그날로 초점
                el('b', {}, parse(d).getDate()), el('i', {}, n ? String(n) : done ? '✓' : ''));
            })() : el('span'))));
      }

      function dayView() {
        const list = on(sel), todo = list.filter(x => !x.done).sort((a, b) => (b.first ? 1 : 0) - (a.first ? 1 : 0) || (a.c || 0) - (b.c || 0)), done = list.filter(x => x.done);
        const out = [el('h2', { class: 'dk-dayhead' }, label(sel), el('small', {}, ` · 남음 ${todo.length} · 완료 ${done.length}`))];
        out.push(todo.length ? el('ul', { class: 'dk-list' }, todo.map(x => row(x))) : el('p', { class: 'dk-empty' }, list.length ? '이날 할 일은 다 했어요.' : '이날은 비어 있어요.'));
        if (done.length) out.push(el('details', { class: 'dk-fold' }, el('summary', {}, `완료 ${done.length}`), el('ul', { class: 'dk-list' }, done.map(x => row(x)))));
        if (sel === today()) { // 지난 날짜 미완료 — 연체 표시 없이 접어 둠
          const past = items.filter(x => !x.done && !x.let && x.date && x.date < today());
          if (past.length) out.push(el('details', { class: 'dk-fold' }, el('summary', {}, `다시 정할 일 · ${past.length}개`),
            el('ul', { class: 'dk-list' }, past.map(x => row(x, el('div', { class: 'dk-chips sm' },
              el('button', { type: 'button', onclick: () => save(x, { date: today() }, '오늘로 옮겼어요.', { date: x.date }) }, '오늘로'),
              el('label', { class: 'dk-pick' }, '날짜 바꾸기', el('input', { type: 'date', class: 'dk-date', 'aria-label': '날짜 바꾸기', onchange: e => e.target.value && save(x, { date: e.target.value }, '옮겼어요.', { date: x.date }) })),
              el('button', { type: 'button', onclick: () => save(x, { date: null }, '날짜 없이 뒀어요.', { date: x.date }) }, '날짜 없이'),
              el('button', { type: 'button', onclick: () => save(x, { let: true }, '놓아줬어요.', { let: false }) }, '놓아주기')))))));
        }
        const free = items.filter(x => !x.date && !x.done && !x.let);
        if (free.length) out.push(el('details', { class: 'dk-fold' }, el('summary', {}, `날짜 없는 일 · ${free.length}`),
          el('ul', { class: 'dk-list' }, free.map(x => row(x, el('button', { type: 'button', class: 'dk-chip-one', onclick: () => save(x, { date: sel }, `${label(sel)}로 옮겼어요.`, { date: null }) }, '이날로'))))));
        return out;
      }
      function logList() { // 실제 끝낸 시각 기준. 예전 항목(시각 없음)은 추정하지 않음
        const t0 = parse(today()).getTime(), w0 = t0 - parse(today()).getDay() * 864e5;
        const doneAt = items.filter(x => x.done && x.completedAt).sort((a, b) => b.completedAt - a.completedAt);
        const part = (name, list) => [el('h2', { class: 'dk-dayhead' }, name, el('small', {}, ` · ${list.length}개`)),
          list.length ? el('ul', { class: 'dk-list' }, list.map(x => el('li', { class: 'dk-todo done' }, el('span', { class: 'dk-todo-text' }, x.text), el('small', {}, new Date(x.completedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }))))) : el('p', { class: 'dk-empty' }, '아직 없어요.')];
        return [...part('오늘 해낸 일', doneAt.filter(x => x.completedAt >= t0)), ...part('이번 주', doneAt.filter(x => x.completedAt >= w0 && x.completedAt < t0))];
      }

      // 빠른 추가(아래 고정): 본문만, 버튼에 날짜를 적어 둠
      let noDate = false;
      const add = el('input', { class: 'dk-input one', placeholder: '할 일 한 줄', 'aria-label': '할 일 추가', enterkeyhint: 'done' });
      const addBtn = el('button', { type: 'button', class: 'dk-put' });
      const noDateBtn = el('button', { type: 'button', class: 'dk-nodate', 'aria-pressed': 'false', onclick: () => { noDate = !noDate; noDateBtn.setAttribute('aria-pressed', String(noDate)); addLabel(); } }, '날짜 없이');
      const addLabel = () => { addBtn.textContent = noDate ? '날짜 없이 추가' : `${parse(sel).getMonth() + 1}월 ${parse(sel).getDate()}일에 추가`; };
      let adding = false, addComposing = false;
      add.addEventListener('compositionstart', () => { addComposing = true; });
      add.addEventListener('compositionend', () => { addComposing = false; });
      async function addTodo() {
        if (adding) return;
        if (addComposing) return void add.addEventListener('compositionend', () => setTimeout(addTodo), { once: true });
        const text = add.value.trim(); if (!text) return add.focus();
        adding = true; addBtn.disabled = true; add.value = '';
        try {
          const x = { text, date: noDate ? null : sel, done: false, c: Date.now() }, ref = await addDoc(todosCol, x);
          items.push({ id: ref.id, ...x }); paint();
        } catch (e) { add.value = text + (add.value ? ' ' + add.value : ''); say('실패했어요(글은 그대로 있어요): ' + e.message); }
        finally { adding = false; addBtn.disabled = false; add.focus(); }
      }
      add.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); addTodo(); } });
      addBtn.addEventListener('pointerdown', e => e.preventDefault());
      addBtn.addEventListener('click', addTodo);

      function paint() { keepFocus(main, paintCal); }
      function paintCal() {
        const d = parse(sel);
        main.replaceChildren(
          el('div', { class: 'dk-head' },
            el('button', { type: 'button', class: 'dk-monthbtn', 'data-k': 'mb', 'aria-expanded': String(monthOpen), onclick: () => { monthOpen = !monthOpen; logView = false; paint(); } }, `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${monthOpen ? '▴' : '▾'}`),
            el('button', { type: 'button', class: 'rm-btn ghost sm', 'data-k': 'td', onclick: () => { sel = today(); logView = false; paint(); } }, '오늘'),
            el('button', { type: 'button', class: 'rm-btn ghost sm', 'data-k': 'lg', 'aria-pressed': String(logView), onclick: () => { logView = !logView; paint(); } }, '기록')),
          monthOpen ? monthGrid() : weekStrip(),
          ...(logView ? logList() : dayView()));
        addLabel();
      }
      body.append(el('div', { class: 'dk-dock' }, el('div', { class: 'dk-bar' }, add, addBtn), noDateBtn));
      paint();
    },
  });
})();
