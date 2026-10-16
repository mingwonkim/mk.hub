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
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const label = s => { const d = parse(s); return `${WD[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`; };
  const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + 'm ago' : m < 1440 ? Math.round(m / 60) + 'h ago' : Math.round(m / 1440) + 'd ago'; };
  const store = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };
  const read = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const THOUGHTS = () => collection(db, 'mk_app', 'data', 'thoughts');
  const tdoc = id => doc(todosCol, id);

  // 잡생각 ↔ 할 일 전환(두 방 위)
  const switcher = on => el('nav', { class: 'dk-switch', 'aria-label': 'Desk' },
    el('a', { href: '#thoughts', 'aria-current': on === 'thoughts' ? 'page' : null }, 'Thoughts'),
    el('a', { href: '#todo', 'aria-current': on === 'todo' ? 'page' : null }, 'Tasks'));

  // 되돌리기 알림(5초)
  // undo: () => Promise<boolean>. 실패하면 알림을 남겨 다시 누를 수 있게
  function undoToast(host, text, undo) {
    host.querySelector('.dk-toast')?.remove();
    const msg = el('span', {}, text), btn = undo && el('button', { type: 'button', onclick: async () => {
      btn.disabled = true; clearTimeout(timer);
      if (await undo()) t.remove(); else { msg.textContent = "Couldn't undo. Try again."; btn.disabled = false; }
    } }, 'Undo');
    const t = el('div', { class: 'dk-toast', role: 'status' }, msg, btn);
    host.append(t); const timer = setTimeout(() => t.remove(), 5000);
  }
  // 다시 그린 뒤 키보드 초점을 같은 버튼(data-k)으로 되돌림
  const keepFocus = (box, fn) => { const k = document.activeElement?.dataset?.k; fn(); if (k) box.querySelector(`[data-k="${k}"]`)?.focus(); };

  // 할 일 만들기(잡생각에서도 씀): 날짜 고르기 칩
  function dateChips(onPick) {
    const custom = el('input', { type: 'date', class: 'dk-date', 'aria-label': 'Pick a date', onchange: e => e.target.value && onPick(e.target.value) });
    return el('div', { class: 'dk-chips' },
      el('button', { type: 'button', onclick: () => onPick(today()) }, 'Today'),
      el('button', { type: 'button', onclick: () => onPick(addDays(today(), 1)) }, 'Tomorrow'),
      el('label', { class: 'dk-pick' }, 'Pick a date', custom),
      el('button', { type: 'button', onclick: () => onPick(null) }, 'No date'));
  }

  /* ───────── 잡생각 ───────── */
  mkRooms.define('thoughts', {
    tag: 'Study · Sticky notes', title: 'Thoughts', sub: 'Put it down the moment it shows up.',
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
        triageBox.replaceChildren(el('div', { class: 'dk-offer' }, el('p', {}, 'Look at just three thoughts?'),
          el('button', { type: 'button', class: 'rm-btn sm', onclick: () => { store('mk_triage_day', today()); triage(); } }, 'Look'),
          el('button', { type: 'button', class: 'rm-btn ghost sm', onclick: () => { store('mk_triage_day', today()); triageBox.replaceChildren(); } }, 'Not now')));
      };
      function triage() {
        const now = Date.now(), open = items.filter(x => x.state === 'open' && !(x.snooze > now));
        const old = read('mk_resurface_off') ? [] : open.filter(x => x.c < now - 7 * 864e5).slice(-1); // 7일 지난 것 하루 최대 1개
        const queue = [...old, ...open.filter(x => !old.includes(x))].slice(0, 3);
        let i = 0;
        const step = () => {
          if (i >= queue.length) return triageBox.replaceChildren(el('div', { class: 'dk-offer' }, el('p', {}, "That's all. The rest can stay as they are."),
            el('button', { type: 'button', class: 'rm-btn ghost sm', onclick: () => triageBox.replaceChildren() }, 'Close'),
            !read('mk_resurface_off') && el('button', { type: 'button', class: 'dk-link', onclick: e => { store('mk_resurface_off', '1'); e.target.remove(); } }, 'Stop resurfacing old thoughts')));
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
          const text = el('input', { class: 'dk-line', value: x.text.split('\n')[0].slice(0, 120), 'aria-label': 'Task text' });
          let busy = false;
          box.replaceChildren(text, dateChips(async date => {
            if (busy) return; busy = true;
            // 할 일 ID를 생각 ID로 고정 → 연타·재시도해도 같은 문서(중복 없음)
            const todoId = 'th_' + x.id;
            try {
              if (!(await getDoc(tdoc(todoId))).exists()) // 이미 있으면(부분 실패 뒤 재시도) 덮어쓰지 않고 연결만
                await setDoc(tdoc(todoId), { text: text.value.trim() || x.text, date, done: false, c: Date.now(), from: x.id });
              await updateDoc(doc(THOUGHTS(), x.id), { state: 'todo', todoId }); Object.assign(x, { state: 'todo', todoId });
              say(date ? `Moved to tasks for ${label(date)}.` : 'Moved to tasks, no date.'); paint(); after?.();
            } catch (e) { say('Failed (pressing again will not duplicate it): ' + e.message); }
            finally { busy = false; }
          }));
          text.focus();
        } }, x.todoId ? 'In tasks' : 'Make a task');
        const keep = el('button', { type: 'button', class: 'rm-btn ghost sm', onclick: () => set(x, { state: x.state === 'kept' ? 'open' : 'kept' }, after) }, x.state === 'kept' ? 'Unkeep' : 'Keep');
        const letGo = el('button', { type: 'button', class: 'rm-btn ghost sm', onclick: async () => { const was = x.state;
          if (await set(x, { state: 'let', letAt: Date.now() }, after)) undoToast(host, 'Let go.', () => x.state === 'let' ? set(x, { state: was }) : Promise.resolve(true)); } }, 'Let go');
        box.append(...[toTodo, keep, letGo, inTriage && el('button', { type: 'button', class: 'dk-link', onclick: () => set(x, { snooze: Date.now() + 7 * 864e5 }, after) }, 'Leave it')].filter(Boolean));
        return box;
      }
      async function set(x, patch, after) { // 성공 여부를 돌려줌(되돌리기는 성공했을 때만)
        try { await updateDoc(doc(THOUGHTS(), x.id), patch); Object.assign(x, patch); paint(); after?.(); return true; }
        catch (e) { say('Failed: ' + e.message); return false; }
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
            } }, el('p', {}, x.text), el('small', {}, ago(x.c) + (x.state === 'kept' ? ' · kept' : x.state === 'todo' ? ' · moved to tasks' : '')));
            card.append(open); return card;
          }),
          pool.length > 5 && !expanded && !q ? el('button', { type: 'button', class: 'dk-link', onclick: () => { expanded = true; paint(); } }, `Show more (${pool.length - 5})`) : null,
          let_.length ? el('button', { type: 'button', class: 'dk-link', 'aria-expanded': String(showLet), onclick: () => { showLet = !showLet; paint(); } }, `Let go · ${let_.length}`) : null,
          ...(showLet ? let_.map(x => el('div', { class: 'dk-let' }, el('span', {}, x.text), el('button', { type: 'button', class: 'dk-link', onclick: () => set(x, { state: 'open' }) }, 'Bring back'))) : []),
        ].filter(Boolean));
      }
      const search = el('input', { type: 'search', class: 'dk-search', placeholder: 'Search', 'aria-label': 'Search thoughts', oninput: e => { query = e.target.value; paint(); } });

      // 입력: 본문 한 칸. Enter는 줄바꿈, '담기'로 저장(저장 뒤에도 키보드 유지), 초안은 기기에
      const ta = el('textarea', { class: 'dk-input', rows: 1, placeholder: 'Whatever is on your mind — drop it here', 'aria-label': 'Write a thought' });
      const status = el('small', { class: 'dk-status', role: 'status' });
      const putBtn = el('button', { type: 'button', class: 'dk-put' }, 'Drop');
      let composing = false, saving = false;
      ta.value = read('mk_thought_draft') || '';
      const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, innerHeight * .4) + 'px'; };
      ta.addEventListener('compositionstart', () => { composing = true; });
      ta.addEventListener('compositionend', () => { composing = false; });
      ta.addEventListener('input', () => { grow(); store('mk_thought_draft', ta.value || null); status.textContent = ta.value ? 'Draft saved on this device' : ''; });
      ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.isComposing) { e.preventDefault(); put(); } }); // PC: Ctrl/⌘+Enter(한글 조합 중엔 무시)
      putBtn.addEventListener('pointerdown', e => e.preventDefault()); // 눌러도 입력창 포커스(키보드) 유지
      putBtn.addEventListener('click', () => put());
      async function put() {
        if (saving) return;
        if (composing) return void ta.addEventListener('compositionend', () => setTimeout(put), { once: true }); // 한글 조합이 끝난 뒤 저장
        const text = ta.value.trim(); if (!text) return ta.focus();
        // 누르는 순간 입력창을 비워 다음 생각을 바로 적게 함. 실패하면 되돌려 넣음(그새 쓴 글 앞에)
        saving = true; putBtn.disabled = true; ta.value = ''; grow(); status.textContent = 'Saving…';
        try {
          const c = Date.now(), ref = await addDoc(THOUGHTS(), { text, c, state: 'open' });
          items.unshift({ id: ref.id, text, c, state: 'open' }); paint();
          store('mk_thought_draft', ta.value || null);
          status.textContent = 'Kept here · synced';
          bar.classList.remove('glow'); void bar.offsetWidth; bar.classList.add('glow');
        } catch (e) {
          ta.value = text + (ta.value ? '\n' + ta.value : ''); grow(); store('mk_thought_draft', ta.value);
          status.textContent = "Couldn't save. Your text is still here — press Drop again.";
        } finally { saving = false; putBtn.disabled = false; ta.focus(); }
      }
      const bar = el('div', { class: 'dk-bar' }, ta, putBtn);

      body.append(...[triageBox, list, items.length > 5 && search,
        el('a', { class: 'dk-link block', href: '#memo' }, 'Notes archive →'),
        el('div', { class: 'dk-dock' }, status, bar)].filter(Boolean));
      paint(); offerTriage(); grow();
      setTimeout(() => ta.focus({ preventScroll: true }), 30);
    },
  });

  /* ───────── 할 일 달력 ───────── */
  let sel = today(), monthOpen = false, logView = false;
  mkRooms.define('todo', {
    tag: 'Study · Corkboard', title: 'Tasks', sub: 'One thing first. The rest can wait.',
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
          if (firstBusy) { say('One moment — press again.'); return false; } // 별표 처리 중엔 날짜 이동 안 함
          patch = { ...patch, first: false }; // 날짜를 옮기면 '먼저 할 1개'는 늘 풂(하루 1개 유지)
        }
        busyOn(x.id); let off = false;
        try {
          await updateDoc(tdoc(x.id), patch); Object.assign(x, patch); busyOff(x.id); off = true; paint();
          // 되돌리기: 그새 다른 변경이 없을 때만(바꾼 값이 그대로일 때)
          if (msg) undoToast(host, msg, undoPatch && (() => Object.keys(undoPatch).every(k => x[k] === patch[k] || (x[k] == null && patch[k] == null)) ? save(x, undoPatch) : Promise.resolve(true)));
          return true;
        } catch (e) { say('Failed: ' + e.message); return false; }
        finally { if (!off) busyOff(x.id); }
      }
      const check = x => save(x, x.done ? { done: false, completedAt: null } : { done: true, completedAt: Date.now() }, x.done ? null : 'Done.', { done: false, completedAt: null });
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
          const inp = el('input', { class: 'dk-line', value: x.text || '', 'aria-label': 'Edit task',
            onkeydown: e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); inp.blur(); } },
            onblur: () => { const v = inp.value.trim(); v && v !== x.text ? save(x, { text: v }) : paint(); } });
          text.replaceWith(inp); inp.focus();
        } }, x.text || '');
        return el('li', { class: 'dk-todo' + (x.done ? ' done' : '') + (x.first ? ' first' : '') },
          el('button', { type: 'button', class: 'rm-check', 'data-k': 'c' + x.id, 'aria-pressed': String(!!x.done), 'aria-label': (x.done ? 'Mark not done: ' : 'Mark done: ') + x.text, onclick: () => check(x) }),
          text,
          extra || (!x.done && x.date && el('button', { type: 'button', class: 'dk-star', 'data-k': 's' + x.id, 'aria-pressed': String(!!x.first), 'aria-label': (x.first ? 'Unset ' : 'Set ') + 'as the one thing first', title: 'One thing first', onclick: () => first(x) }, x.first ? '★' : '☆')));
      }

      function weekStrip() {
        const start = addDays(sel, -parse(sel).getDay());
        const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
        return el('div', { class: 'dk-week' },
          el('button', { type: 'button', class: 'dk-nav', 'data-k': 'pw', 'aria-label': 'Previous week', onclick: () => { sel = addDays(sel, -7); paint(); } }, '‹'),
          ...days.map((d, i) => { const n = left(d), done = on(d).filter(x => x.done).length; const dd = parse(d);
            return el('button', { type: 'button', class: 'dk-day' + (d === sel ? ' sel' : '') + (d === today() ? ' today' : ''), 'data-k': 'd' + i, 'aria-pressed': String(d === sel), 'aria-label': `${label(d)}, ${n} left`, onclick: () => { sel = d; paint(); } },
              el('small', {}, WD[dd.getDay()]), el('b', {}, dd.getDate()), el('i', {}, n ? `${n} left` : done ? '✓' : ''));
          }),
          el('button', { type: 'button', class: 'dk-nav', 'data-k': 'nw', 'aria-label': 'Next week', onclick: () => { sel = addDays(sel, 7); paint(); } }, '›'));
      }
      function monthGrid() {
        const d0 = parse(sel); d0.setDate(1);
        const startPad = d0.getDay(), days = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate();
        const cells = [...Array(startPad).fill(null), ...Array.from({ length: days }, (_, i) => ymd(new Date(d0.getFullYear(), d0.getMonth(), i + 1)))];
        const move = n => { const d = parse(sel); d.setDate(1); d.setMonth(d.getMonth() + n); sel = ymd(d); paint(); };
        return el('div', { class: 'dk-month' },
          el('div', { class: 'dk-month-head' }, el('button', { type: 'button', class: 'dk-nav', 'data-k': 'pm', 'aria-label': 'Previous month', onclick: () => move(-1) }, '‹'), el('span', {}, `${MON[d0.getMonth()]} ${d0.getFullYear()}`), el('button', { type: 'button', class: 'dk-nav', 'data-k': 'nm', 'aria-label': 'Next month', onclick: () => move(1) }, '›')),
          el('div', { class: 'dk-grid' }, WD.map(w => el('small', {}, w)),
            cells.map(d => d ? (() => { const n = left(d), done = on(d).filter(x => x.done).length;
              return el('button', { type: 'button', class: 'dk-cell' + (d === sel ? ' sel' : '') + (d === today() ? ' today' : ''), 'data-k': 'm' + d, 'aria-label': `${label(d)}, ${n} left, ${done} done`, onclick: () => { sel = d; monthOpen = false; paint(); main.querySelector(`[data-k="d${parse(d).getDay()}"]`)?.focus(); } }, // 달력이 닫히면 주간 줄의 그날로 초점
                el('b', {}, parse(d).getDate()), el('i', {}, n ? String(n) : done ? '✓' : ''));
            })() : el('span'))));
      }

      function dayView() {
        const list = on(sel), todo = list.filter(x => !x.done).sort((a, b) => (b.first ? 1 : 0) - (a.first ? 1 : 0) || (a.c || 0) - (b.c || 0)), done = list.filter(x => x.done);
        const out = [el('h2', { class: 'dk-dayhead' }, label(sel), el('small', {}, ` · ${todo.length} left · ${done.length} done`))];
        out.push(todo.length ? el('ul', { class: 'dk-list' }, todo.map(x => row(x))) : el('p', { class: 'dk-empty' }, list.length ? 'Everything for this day is done.' : 'Nothing on this day.'));
        if (done.length) out.push(el('details', { class: 'dk-fold' }, el('summary', {}, `Done · ${done.length}`), el('ul', { class: 'dk-list' }, done.map(x => row(x)))));
        if (sel === today()) { // 지난 날짜 미완료 — 연체 표시 없이 접어 둠
          const past = items.filter(x => !x.done && !x.let && x.date && x.date < today());
          if (past.length) out.push(el('details', { class: 'dk-fold' }, el('summary', {}, `To reschedule · ${past.length}`),
            el('ul', { class: 'dk-list' }, past.map(x => row(x, el('div', { class: 'dk-chips sm' },
              el('button', { type: 'button', onclick: () => save(x, { date: today() }, 'Moved to today.', { date: x.date }) }, 'Today'),
              el('label', { class: 'dk-pick' }, 'Change date', el('input', { type: 'date', class: 'dk-date', 'aria-label': 'Change date', onchange: e => e.target.value && save(x, { date: e.target.value }, 'Moved.', { date: x.date }) })),
              el('button', { type: 'button', onclick: () => save(x, { date: null }, 'Left without a date.', { date: x.date }) }, 'No date'),
              el('button', { type: 'button', onclick: () => save(x, { let: true }, 'Let go.', { let: false }) }, 'Let go')))))));
        }
        const free = items.filter(x => !x.date && !x.done && !x.let);
        if (free.length) out.push(el('details', { class: 'dk-fold' }, el('summary', {}, `No date · ${free.length}`),
          el('ul', { class: 'dk-list' }, free.map(x => row(x, el('button', { type: 'button', class: 'dk-chip-one', onclick: () => save(x, { date: sel }, `Moved to ${label(sel)}.`, { date: null }) }, 'This day'))))));
        return out;
      }
      function logList() { // 실제 끝낸 시각 기준. 예전 항목(시각 없음)은 추정하지 않음
        const t0 = parse(today()).getTime(), w0 = t0 - parse(today()).getDay() * 864e5;
        const doneAt = items.filter(x => x.done && x.completedAt).sort((a, b) => b.completedAt - a.completedAt);
        const part = (name, list) => [el('h2', { class: 'dk-dayhead' }, name, el('small', {}, ` · ${list.length}`)),
          list.length ? el('ul', { class: 'dk-list' }, list.map(x => el('li', { class: 'dk-todo done' }, el('span', { class: 'dk-todo-text' }, x.text), el('small', {}, new Date(x.completedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))))) : el('p', { class: 'dk-empty' }, 'Nothing yet.')];
        return [...part('Done today', doneAt.filter(x => x.completedAt >= t0)), ...part('This week', doneAt.filter(x => x.completedAt >= w0 && x.completedAt < t0))];
      }

      // 빠른 추가(아래 고정): 본문만, 버튼에 날짜를 적어 둠
      let noDate = false;
      const add = el('input', { class: 'dk-input one', placeholder: 'One line', 'aria-label': 'Add a task', enterkeyhint: 'done' });
      const addBtn = el('button', { type: 'button', class: 'dk-put' });
      const noDateBtn = el('button', { type: 'button', class: 'dk-nodate', 'aria-pressed': 'false', onclick: () => { noDate = !noDate; noDateBtn.setAttribute('aria-pressed', String(noDate)); addLabel(); } }, 'No date');
      const addLabel = () => { addBtn.textContent = noDate ? 'Add, no date' : `Add to ${MON[parse(sel).getMonth()]} ${parse(sel).getDate()}`; };
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
        } catch (e) { add.value = text + (add.value ? ' ' + add.value : ''); say('Failed (your text is still here): ' + e.message); }
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
            el('button', { type: 'button', class: 'dk-monthbtn', 'data-k': 'mb', 'aria-expanded': String(monthOpen), onclick: () => { monthOpen = !monthOpen; logView = false; paint(); } }, `${MON[d.getMonth()]} ${d.getFullYear()} ${monthOpen ? '▴' : '▾'}`),
            el('button', { type: 'button', class: 'rm-btn ghost sm', 'data-k': 'td', onclick: () => { sel = today(); logView = false; paint(); } }, 'Today'),
            el('button', { type: 'button', class: 'rm-btn ghost sm', 'data-k': 'lg', 'aria-pressed': String(logView), onclick: () => { logView = !logView; paint(); } }, 'Log')),
          monthOpen ? monthGrid() : weekStrip(),
          ...(logView ? logList() : dayView()));
        addLabel();
      }
      body.append(el('div', { class: 'dk-dock' }, el('div', { class: 'dk-bar' }, add, addBtn), noDateBtn));
      paint();
    },
  });
})();
