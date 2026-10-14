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

  document.body.insertAdjacentHTML('afterbegin', `
<div class="mk-intro" id="mkIntro" aria-hidden="true"><div class="ld-logo">${MARK}</div></div>
<div class="mk-layer" id="mkScene" role="region" aria-label="구름 위 도시">
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
    <div class="mk-fan"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs><radialGradient id="mkBl"><stop offset=".2" stop-color="#2b3550" stop-opacity=".75"/><stop offset="1" stop-color="#6d7fa8" stop-opacity=".15"/></radialGradient></defs>
      <circle cx="50" cy="50" r="50" fill="#1b2236" opacity=".35"/>
      <g fill="url(#mkBl)"><path d="M50 50 L44 2 Q58 0 62 6 Z"/><path d="M50 50 L98 44 Q100 58 94 62 Z"/><path d="M50 50 L56 98 Q42 100 38 94 Z"/><path d="M50 50 L2 56 Q0 42 6 38 Z"/>
        ${reduce ? '' : '<animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur=".7s" repeatCount="indefinite"/>'}</g>
    </svg></div>
    <img class="mk-hub" src="${S}hub.webp" alt="">
    <a class="mk-spot" href="#music" style="left:26.6%;top:47%;width:6.6%;height:37%"><span>음악</span></a>
    <a class="mk-spot" href="#vault/Art" style="left:73.1%;top:11.2%;width:5.9%;height:40%"><span>예술</span></a>
    <a class="mk-spot" href="#vault/IT" style="left:66.3%;top:55%;width:7.2%;height:42%"><span>IT</span></a>
    <a class="mk-spot mk-courier" href="#briefing" aria-label="모닝 브리프"><img class="body" src="${S}courier.webp" alt=""><img class="letter" src="${S}letter.webp" alt=""><span>모닝 브리프</span></a>
    <a class="mk-banner" href="https://looinlabs.com" aria-label="looin labs (회사 사이트)"><canvas></canvas></a>
    <a class="mk-ship" href="#study" aria-label="비행선 — 잠금을 풀고 서재로"></a>
  </div>
  <details class="mk-menu"><summary>둘러보기</summary><nav><a href="#study">서재(비행선)</a><a href="#briefing">모닝 브리프</a><a href="#music">음악</a><a href="#vault/Art">예술</a><a href="#vault/IT">IT</a><a href="https://looinlabs.com">looin labs</a></nav></details>
</div>
<div class="mk-layer" id="mkStudy" role="region" aria-label="서재">
  <div class="mk-stage">
    <img class="mk-bg" loading="lazy" src="${S}study-3024.webp" srcset="${S}study-3024.webp 3024w, ${S}study-6048.webp 6048w" sizes="max(117vw, 277vh)" alt="밤 도시가 보이는 큰 창의 서재">
    <a class="mk-spot" href="#todo" style="left:46%;top:63%;width:14%;height:17%"><span>할 일</span></a>
    <a class="mk-spot" href="#memo" style="left:58.4%;top:74.5%;width:7%;height:11.5%"><span>메모</span></a>
    <a class="mk-spot" href="#files" style="left:68.4%;top:84%;width:5.8%;height:15%"><span>파일</span></a>
    <a class="mk-spot" href="#settings" style="left:74%;top:28%;width:25%;height:24%"><span>설정</span></a>
    <a class="mk-spot" href="#hub" style="left:49%;top:80%;width:6.5%;height:20%"><span>MK.HUB 홈</span></a>
  </div>
  <a class="mk-back" href="#">← 도시로</a>
  <details class="mk-menu"><summary>둘러보기</summary><nav><a href="#todo">할 일</a><a href="#memo">메모</a><a href="#files">파일</a><a href="#settings">설정</a><a href="#hub">MK.HUB 홈</a></nav></details>
</div>`);

  document.documentElement.classList.remove('mk-boot'); // index.html 첫 가림 해제(이제 인트로·장면이 덮음)
  const html = document.documentElement, intro = document.getElementById('mkIntro');
  const scene = document.getElementById('mkScene'), study = document.getElementById('mkStudy');
  const APPS = ['music', 'memo', 'files', 'todo', 'briefing', 'settings'];

  /* ── 현수막: 캔버스 좌표는 원본 8064px 기준 460×260. 안테나 끝(0,240)에서 줄 두 가닥, 천 x 90~390 · y 30~210, 로고는 천 안 (25,15) 250×150 ── */
  const cv = scene.querySelector('.mk-banner canvas'), ctx = cv.getContext('2d');
  const BW = 300, BH = 180, BX = 90, BY = 30, AY = 240, LX = 25, LY = 15, LW = 250, LH = 150;
  const tex = document.createElement('canvas');
  const logo = new Image();
  { // 로고 마지막 프레임(두 눈이 오른쪽 위를 봄)을 그림으로
    const svg = MARK.replace('class="eye1"', 'transform="translate(4 -5)"').replace('class="eye2"', 'transform="translate(4 -5)"')
      .replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300" color="${ink}" `)
      .replace('class="labs"', 'font-family="Pretendard Variable, Pretendard, Apple SD Gothic Neo, sans-serif" font-size="30" font-weight="700" fill="currentColor" stroke="none"');
    logo.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  let s = 1, amp = 0, landedAt = null, raf = 0;
  function paintTexture() {
    tex.width = Math.max(1, Math.round(BW * s)); tex.height = Math.max(1, Math.round(BH * s));
    const t = tex.getContext('2d'), g = t.createLinearGradient(0, 0, 0, tex.height);
    g.addColorStop(0, '#ecd2b8'); g.addColorStop(1, '#c99e86');
    t.fillStyle = g; t.fillRect(0, 0, tex.width, tex.height);
    t.strokeStyle = 'rgba(80, 40, 30, .35)'; t.lineWidth = Math.max(1, 3 * s); t.strokeRect(5 * s, 5 * s, tex.width - 10 * s, tex.height - 10 * s);
    if (logo.complete && logo.naturalWidth) t.drawImage(logo, LX * s, LY * s, LW * s, LH * s);
  }
  function resize() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
    s = cv.width / 460; paintTexture();
  }
  const wave = (u, t) => amp * (16 * u * Math.sin(u * 9.5 - t * 4.2) + 4 * u * Math.sin(u * 23 - t * 7.3));
  function frame(ms) {
    raf = 0;
    if (!scene.classList.contains('on') || document.hidden) return; // 안 보이면 멈춤(보일 때 start())
    const t = ms / 1000;
    if (landedAt !== null) amp = reduce ? 0 : Math.min(1, (ms - landedAt) / 1500);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = 'rgba(30, 24, 36, .85)'; ctx.lineWidth = Math.max(1, 3 * s);
    ctx.beginPath();
    ctx.moveTo(0, AY * s); ctx.quadraticCurveTo(45 * s, 130 * s, BX * s, BY * s);
    ctx.moveTo(0, AY * s); ctx.quadraticCurveTo(50 * s, 225 * s, BX * s, (BY + BH) * s);
    ctx.stroke();
    for (let x = 0; x < BW; x += 2) { // 2px 세로 띠마다 위아래로 흔들고 기울기만큼 음영
      const u = x / BW, dy = wave(u, t), shade = Math.max(-.3, Math.min(.3, (wave(u + .01, t) - dy) * .5));
      ctx.drawImage(tex, x * s, 0, 2 * s + 1, BH * s, (BX + x) * s, (BY + dy) * s, 2 * s + 1, BH * s);
      if (shade) { ctx.fillStyle = shade > 0 ? `rgba(255,240,220,${shade})` : `rgba(40,20,40,${-shade})`; ctx.fillRect((BX + x) * s, (BY + dy) * s, 2 * s + 1, BH * s); }
    }
    if (!reduce || landedAt === null) raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
  logo.onload = () => { paintTexture(); start(); };
  addEventListener('resize', () => { resize(); start(); });
  document.addEventListener('visibilitychange', start);

  /* ── 화면 전환 ── */
  function show(which) { // 'scene' | 'study' | null(MK.HUB)
    scene.classList.toggle('on', which === 'scene'); study.classList.toggle('on', which === 'study');
    scene.inert = which !== 'scene'; study.inert = which !== 'study';
    html.classList.toggle('mk-layer-open', !!which);
    if (which === 'scene') { resize(); start(); }
  }
  const gate = cb => window.MKVault ? MKVault.requireAccess(cb) : showTextPin(cb);
  let seq = 0, last = null;
  function route() {
    if (location.href === last) return; // hashchange·popstate 중복 방지
    last = location.href;
    const my = ++seq, [h, sub] = (() => { try { return decodeURIComponent(location.hash.slice(1)).split('/'); } catch { return ['']; } })();
    if (!h) return show('scene');
    if (h === 'study') { show('scene'); return gate(() => { if (my === seq) show('study'); }); } // 인증 중 다른 데로 가면 늦은 성공은 무시
    if (h === 'hub') { show(null); return goHub(); }
    if (h === 'vault' && sub) { show(null); openApp('memo'); return mkOpenFolder(sub); }
    if (APPS.includes(h)) { show(null); return openApp(h); }
    // 그 밖의 해시(페이지 안 앵커 등)는 건드리지 않음
  }

  /* ── 인트로: 처음 들어올 때(탭 세션당 한 번) 다크 배경 로고 → 현수막으로 날아가 박힘 ── */
  function land() {
    landedAt = performance.now(); scene.classList.add('go');
    try { sessionStorage.setItem('mk_intro', '1'); } catch {}
    start();
  }
  function playIntro() {
    intro.classList.add('on');
    const mark = intro.querySelector('.mark');
    let done = false;
    const fly = () => {
      if (done) return; done = true;
      resize();
      const a = mark.getBoundingClientRect(), r = cv.getBoundingClientRect(), k = r.width / 460;
      const bx = r.left + (BX + LX) * k, by = r.top + (BY + LY) * k, bw = LW * k;
      intro.classList.add('leaving');
      mark.style.color = ink;
      mark.style.transform = `translate(${bx - a.left}px, ${by - a.top}px) scale(${bw / a.width})`;
      setTimeout(() => { land(); mark.style.transition = 'opacity .3s'; mark.style.opacity = '0'; }, 900);
      setTimeout(() => intro.classList.remove('on'), 1250);
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
    if (FROM_EMAIL_LINK) return show(null); // 이메일 로그인 복귀는 MK.HUB가 처리
    route();
    if (!intro.classList.contains('on')) land();
  });
})();
