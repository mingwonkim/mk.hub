/* 민권.com 첫 화면 (looinlabs 오프닝 장면으로 "이사"):
   다크 인트로(looin labs 로고) → 로고가 비행선 현수막에 박힘 → 도시 장면. 비행선 → MK.HUB 잠금 → 서재.
   그림 속 물건은 <a href="#칸"> 링크이고, 이 파일의 해시 라우터가 MK.HUB 기존 페이지(openApp 등)를 연다.
   vault-client.js보다 먼저 실행돼야 함(이메일 로그인 링크의 ?oobCode 를 vault-client가 지우기 전에 확인). */
(() => {
  const S = 'scene/';
  const FROM_EMAIL_LINK = /[?&]oobCode=/.test(location.search);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ink = '#2a1f30';
  const MARK = `<svg class="mark" viewBox="-2 0 250 150" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="looin labs">
    <line x1="7" y1="8" x2="7" y2="100"/>
    <g class="nudge"><circle cx="60" cy="61" r="25"/><g class="eye1"><g class="blink"><circle cx="62" cy="58" r="8" fill="currentColor" stroke="none"/></g></g></g>
    <line x1="159" y1="36" x2="159" y2="100"/>
    <circle class="ding" cx="159" cy="14" r="8" fill="currentColor" stroke="none"/>
    <path d="M187 36 V100 M187 100 V61 A25 25 0 0 1 237 61 V100"/>
    <g class="drop"><g class="squash"><circle cx="106" cy="61" r="25" stroke="#ff5b2e"/><g class="eye2"><g class="blink"><circle cx="108" cy="58" r="8" fill="currentColor" stroke="none"/></g></g></g></g>
    <text class="labs" x="0" y="148" textLength="244" lengthAdjust="spacing">LABS</text></svg>`;

  // 캐노피에 인쇄된 로고: LABS 줄 없이 마크만(캐노피 면이 얇음), 마지막 프레임(두 눈이 오른쪽 위)
  const PRINT = MARK.replace('viewBox="-2 0 250 150"', 'viewBox="-2 0 250 108"').replace(/<text[^]*?<\/text>/, '')
    .replace('class="eye1"', 'transform="translate(4 -5)"').replace('class="eye2"', 'transform="translate(4 -5)"').replace('class="mark"', 'class="print"').replace(' role="img" aria-label="looin labs"', '');

  document.body.insertAdjacentHTML('afterbegin', `
<div class="mk-intro" id="lsIntro" aria-hidden="true"><div class="ld-logo">${MARK}</div></div>
<div class="mk-layer" id="lsScene" tabindex="-1" role="region" aria-label="구름 위 도시">
  <div class="mk-stage">
    <img class="mk-bg" src="${S}bg-4032.webp" srcset="${S}bg-4032.webp 4032w, ${S}bg-8064.webp 8064w" sizes="max(102vw, 254vh)" alt="구름 위 미래 도시, 가운데에 비행선이 떠 있다">
    <img class="mk-dr mk-cruise" src="${S}d1.webp" alt="" style="left:48.834%;top:.868%;width:1.637%;--t:46s;--dx:260%">
    <img class="mk-dr mk-cruise" src="${S}d2.webp" alt="" style="left:50.372%;top:7.002%;width:1.389%;--t:34s;--d:-12s;--dx:-200%">
    <img class="mk-dr mk-cruise" src="${S}d3.webp" alt="" style="left:55.184%;top:9.78%;width:1.24%;--t:29s;--d:-20s;--dx:230%">
    <img class="mk-dr mk-hover" src="${S}d4.webp" alt="" style="left:56.126%;top:19.965%;width:2.183%;--t:11s">
    <img class="mk-dr mk-hover" src="${S}d5.webp" alt="" style="left:97.098%;top:12.442%;width:1.141%;--t:8s;--d:-3s">
    <img class="mk-dr mk-cruise" src="${S}d6.webp" alt="" style="left:92.436%;top:17.303%;width:.992%;--t:31s;--d:-7s;--dx:-320%">
    <img class="mk-dr mk-hover" src="${S}d7.webp" alt="" style="left:1.017%;top:9.433%;width:1.24%;--t:7s;--d:-2s">
    <img class="mk-dr mk-hover" src="${S}d8.webp" alt="" style="left:.719%;top:11.69%;width:1.19%;--t:12s;--d:-5s">
    ${[ // 하늘 교통 추가분: [그림, 왼쪽%, 위%, 폭%, 방식, 시간s, 지연s, 이동(자기 폭 %)] — 먼 하늘 위주, 끝에서 흐려지며 반복
      ['d4', 20, 12, 1.6, 'cruise', 70, -10, 900], ['d2', 62, 4, 1.0, 'cruise', 55, -20, -700], ['d1', 30, 6, 1.2, 'cruise', 60, -35, 600],
      ['d3', 82, 22, .9, 'cruise', 40, -10, -500], ['d6', 40, 15, .8, 'cruise', 50, -25, 800], ['d4', 60, 25, 2.4, 'cruise', 45, -5, -400],
      ['d2', 10, 18, 1.1, 'cruise', 48, -30, 500], ['d1', 88, 6, 1.0, 'cruise', 52, -15, -600], ['d3', 52, 1.5, .8, 'cruise', 65, -40, 700],
      ['d6', 74, 30, 1.0, 'cruise', 38, -12, -450], ['d5', 25, 24, .9, 'hover', 9, -4, 0], ['d7', 68, 10, 1.0, 'hover', 7, -1, 0], ['d8', 15, 30, 1.0, 'hover', 10, -6, 0]
    ].map(([d, x, y, w, m, t, dl, dx]) => `<img class="mk-dr mk-${m}" src="${S}${d}.webp" alt="" style="left:${x}%;top:${y}%;width:${w}%;--t:${t}s;--d:${dl}s;--dx:${dx}%">`).join('')}
    <div class="mk-fan"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs><radialGradient id="mkBl"><stop offset=".2" stop-color="#2b3550" stop-opacity=".75"/><stop offset="1" stop-color="#6d7fa8" stop-opacity=".15"/></radialGradient></defs>
      <circle cx="50" cy="50" r="50" fill="#1b2236" opacity=".35"/>
      <g fill="url(#mkBl)"><path d="M50 50 L44 2 Q58 0 62 6 Z"/><path d="M50 50 L98 44 Q100 58 94 62 Z"/><path d="M50 50 L56 98 Q42 100 38 94 Z"/><path d="M50 50 L2 56 Q0 42 6 38 Z"/>
        ${reduce ? '' : '<animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur=".7s" repeatCount="indefinite"/>'}</g>
    </svg></div>
    <img class="mk-hub" src="${S}hub.webp" alt="">
    <a class="mk-spot" href="#music" aria-label="음악" style="left:26.6%;top:47%;width:6.6%;height:37%"></a>
    <a class="mk-spot" href="#vault/Art" aria-label="예술" style="left:73.1%;top:11.2%;width:5.9%;height:40%"></a>
    <a class="mk-spot" href="#vault/IT" aria-label="IT" style="left:66.3%;top:55%;width:7.2%;height:42%"></a>
    <a class="mk-spot mk-courier" href="#briefing" aria-label="모닝 브리프"><img class="body" src="${S}courier.webp" alt=""></a>
    <div class="mk-print" aria-hidden="true">${PRINT}</div>
    <a class="mk-canopy" href="https://looinlabs.com" aria-label="looin labs (회사 사이트)"></a>
    <a class="mk-ship" href="#study" aria-label="비행선 — 잠금을 풀고 서재로"></a>
  </div>
</div>
<div class="mk-layer" id="lsStudy" tabindex="-1" role="region" aria-label="서재">
  <div class="mk-stage">
    <img class="mk-bg" loading="lazy" src="${S}study-3024.webp" srcset="${S}study-3024.webp 3024w, ${S}study-6048.webp 6048w" sizes="max(117vw, 277vh)" alt="밤 도시가 보이는 큰 창의 서재">
    <a class="mk-spot" href="#todo" aria-label="할 일" style="left:46%;top:63%;width:14%;height:17%"></a>
    <a class="mk-spot" href="#memo" aria-label="메모" style="left:58.4%;top:74.5%;width:7%;height:11.5%"></a>
    <a class="mk-spot" href="#files" aria-label="파일" style="left:68.4%;top:84%;width:5.8%;height:15%"></a>
    <a class="mk-spot" href="#settings" aria-label="설정" style="left:74%;top:28%;width:25%;height:24%"></a>
  </div>
  <a class="mk-back" href="#">← 도시로</a>
</div>
<a class="mk-home" href="#" aria-label="도시로 돌아가기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13c3-4 7-6 12-6 2 0 4 .5 6 1.5-1 2-3 3.5-6 4.5H3z"/><path d="M15 7c0-2 1-3 3-3"/></svg></a>
<dialog class="mk-pin" aria-label="서재 암호">
  <div class="mk-pin-top"><span>AIRSHIP ACCESS</span><button type="button" data-x aria-label="닫기">닫기 ×</button></div>
  <div class="mk-pin-ring"><div class="mk-pin-slots" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div>
  <h2 class="mk-pin-title">서재 열기</h2><p class="mk-sr" aria-live="polite"></p>
  <div class="mk-pin-pad">${[1,2,3,4,5,6,7,8,9].map(n => `<button type="button" data-k="${n}">${n}</button>`).join('')}<span></span><button type="button" data-k="0">0</button><button type="button" data-k="del" aria-label="지우기">⌫</button></div>
</dialog>`);

  document.documentElement.classList.remove('mk-boot'); // index.html 첫 가림 해제(이제 인트로·장면이 덮음)
  const html = document.documentElement, intro = document.getElementById('lsIntro');
  const scene = document.getElementById('lsScene'), study = document.getElementById('lsStudy');
  const APPS = ['music', 'memo', 'files', 'todo', 'briefing', 'settings'];

  /* ── 화면 전환 ── */
  const OURS = new Set(['lsIntro', 'lsScene', 'lsStudy']);
  function show(which) { // 'scene' | 'study' | null(MK.HUB)
    const was = scene.classList.contains('on') ? 'scene' : study.classList.contains('on') ? 'study' : null;
    scene.classList.toggle('on', which === 'scene'); study.classList.toggle('on', which === 'study');
    scene.inert = which !== 'scene'; study.inert = which !== 'study';
    html.classList.toggle('mk-layer-open', !!which);
    for (const el of document.body.children) // 장면이 덮고 있는 동안 뒤의 SPA는 키보드·낭독기에서도 숨김
      if (!OURS.has(el.id) && el.tagName !== 'DIALOG' && el.tagName !== 'SCRIPT') el.inert = !!which;
    if (which && which !== was) {
      const layer = which === 'scene' ? scene : study;
      layer.focus({ preventScroll: true });
      if (layer.scrollWidth > layer.clientWidth) // 세로 화면: 그림을 좌우로 밀어 볼 수 있음. 처음엔 비행선/책상이 가운데
        layer.scrollLeft = layer.scrollWidth * (which === 'scene' ? .505 : .57) - layer.clientWidth / 2;
    }
    if (!which && pinDlg.open) { pinOk = null; pinDlg.close(); }
    if (which) back = which === 'study' ? '#study' : '';
  }
  /* 옛 MK.HUB 홈 화면은 버림: 홈으로 가려 하거나 저장고 인증을 그냥 닫으면 마지막에 있던 도시/서재로 */
  let back = '';
  function toLayer(replace) { history[replace ? 'replaceState' : 'pushState'](null, '', location.pathname + location.search + back); route(); }
  /* 서재 암호(임시 5940, 나중에 Face ID). 공개 사이트의 숨은 입구일 뿐 — 실제 데이터는 각 칸을 열 때 MKVault가 지킴 */
  const PIN_HASH = '8bc552c0c116fa615b7306a74f4a998c7ac4fef70074b742abcc82d53ee52611'; // sha256('mk-study:' + 암호)
  const pinDlg = document.querySelector('.mk-pin'), slots = [...pinDlg.querySelectorAll('.mk-pin-slots i')], sr = pinDlg.querySelector('.mk-sr');
  let pin = '', pinOk = null, checking = false;
  const sha = async t => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, '0')).join('');
  const paint = () => { slots.forEach((el, i) => el.classList.toggle('on', i < pin.length)); sr.textContent = `4자리 중 ${pin.length}자리 입력`; };
  async function key(k) {
    if (k === 'x') return pinDlg.close();
    if (checking) return;
    if (k === 'del') { pin = pin.slice(0, -1); return paint(); }
    if (pin.length >= 4) return;
    pin += k; paint();
    if (pin.length < 4) return;
    checking = true; const want = pinOk;
    const ok = (await sha('mk-study:' + pin)) === PIN_HASH;
    if (want !== pinOk || !pinDlg.open) { checking = false; return; } // 확인 중에 창이 닫히거나 경로가 바뀜
    if (ok) {
      try { localStorage.setItem('mk_study', '1'); } catch {}
      sr.textContent = '열렸습니다'; pinDlg.classList.add('ok');
      setTimeout(() => { checking = false; const cb = pinOk; pinOk = null; pinDlg.close(); cb && cb(); }, 350);
    } else {
      sr.textContent = '암호가 일치하지 않습니다';
      pinDlg.classList.remove('bad'); void pinDlg.offsetWidth; pinDlg.classList.add('bad');
      setTimeout(() => { checking = false; pin = ''; paint(); }, 450);
    }
  }
  pinDlg.addEventListener('click', e => { const b = e.target.closest('[data-k],[data-x]'); if (b) key(b.dataset.k || 'x'); });
  pinDlg.addEventListener('keydown', e => { if (/^[0-9]$/.test(e.key)) key(e.key); else if (e.key === 'Backspace') key('del'); });
  pinDlg.addEventListener('close', () => { // 취소: 사이트 밖으로 나가지 않게 #study 를 도시로 바꿔 둠
    pin = ''; paint(); pinDlg.classList.remove('ok', 'bad');
    if (pinOk) { pinOk = null; if (location.hash === '#study') { history.replaceState(null, '', location.pathname + location.search); route(); } }
  });
  function gate(cb) {
    let passed = false; try { passed = localStorage.getItem('mk_study') === '1'; } catch {}
    if (passed) return cb();
    pinOk = cb; pin = ''; paint(); pinDlg.showModal();
  }
  let seq = 0, last = null;
  function route() {
    if (location.href === last) return; // hashchange·popstate 중복 방지
    last = location.href;
    if (pinDlg.open && location.hash !== '#study') { pinOk = null; pinDlg.close(); } // 뒤로가기 등으로 경로가 바뀌면 암호 창도 닫음
    const my = ++seq, [h, sub] = (() => { try { return decodeURIComponent(location.hash.slice(1)).split('/'); } catch { return ['']; } })();
    if (!h) return show('scene');
    if (h === 'study') { show('scene'); return gate(() => { if (my === seq) show('study'); }); } // 인증 중 다른 데로 가면 늦은 성공은 무시
    if (h === 'hub') return toLayer(true); // 옛 MK.HUB 홈은 버림
    if (h === 'vault' && sub) { show(null); openApp('memo'); return mkOpenFolder(sub); }
    if (APPS.includes(h)) { show(null); return openApp(h); }
    // 그 밖의 해시(페이지 안 앵커 등)는 건드리지 않음
  }

  /* ── 인트로: 처음 들어올 때(탭 세션당 한 번) 다크 배경 로고 → 현수막으로 날아가 박힘 ── */
  function land() {
    scene.classList.add('go');
    try { sessionStorage.setItem('mk_intro', '1'); } catch {}
  }
  function playIntro() {
    intro.classList.add('on');
    const mark = intro.querySelector('.mark');
    let done = false;
    const fly = () => { // 로고가 캐노피 인쇄 자리(.mk-print: 무대 기준 위치·폭·9° 기울기)로 날아가 그대로 인쇄가 됨
      if (done) return; done = true;
      const a = mark.getBoundingClientRect(), st = scene.querySelector('.mk-stage').getBoundingClientRect();
      const bx = st.left + .49405 * st.width, by = st.top + .32147 * st.height, bw = .01389 * st.width;
      intro.classList.add('leaving');
      mark.style.color = ink;
      const labs = mark.querySelector('.labs'); labs.style.animation = 'none'; labs.style.transition = 'opacity .4s'; labs.style.opacity = '0'; // 캐노피 인쇄엔 LABS 줄이 없음
      mark.style.transform = `translate(${bx - a.left}px, ${by - a.top}px) rotate(9deg) scale(${bw / a.width})`;
      setTimeout(() => { land(); mark.style.transition = 'opacity .35s'; mark.style.opacity = '0'; }, 900);
      setTimeout(() => intro.classList.remove('on'), 1300);
    };
    setTimeout(fly, 2700);
    intro.addEventListener('click', fly); // 건너뛰기
  }

  let seen = false; try { seen = !!sessionStorage.getItem('mk_intro'); } catch {}
  if (!FROM_EMAIL_LINK && !location.hash && !seen && !reduce) playIntro(); // 그림이 뜨기 전에 로고부터
  if (!FROM_EMAIL_LINK && !location.hash) show('scene'); // DOMContentLoaded 전에도 MK.HUB 홈이 비치지 않게
  // 첫 라우팅은 vault-client.js(defer)까지 실행된 뒤 — 그래야 openApp이 잠금을 거침
  document.addEventListener('DOMContentLoaded', () => {
    addEventListener('hashchange', route); addEventListener('popstate', route);
    const setPage0 = window.setPage; window.setPage = p => p === 'hub' ? toLayer(false) : setPage0(p); // 앱 안의 홈·뒤로 버튼도 여기로
    addEventListener('mk:vault-cancel', () => { if (document.querySelector('.page.active')?.id === 'page-hub') toLayer(true); });
    if (FROM_EMAIL_LINK) return show(null); // 이메일 로그인 복귀는 MK.HUB가 처리
    route();
    if (!intro.classList.contains('on')) land();
  });
})();
