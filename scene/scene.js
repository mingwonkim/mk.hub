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

  /* 도시가 살아 있게(그림 위 얇은 층들, 좌표는 무대 %): 바람에 흐르는 구름·안개, 꺼졌다 켜지는 창, 창 안을 지나가는 사람, 골목의 차 불빛.
     위치는 그림에서 뽑음(창=가까운 탑의 작은 불빛, 방=큰 불 켜진 창, 길=구름 아래 도로) */
  const FLICK = [[91.901,99.21,.208,.851,'#4b1e0b',7,0],[82.214,41.434,.104,.729,'#33160e',13,-6],[18.021,52.612,.208,.547,'#24140b',12,-5],[22.76,80.863,.599,1.397,'#201109',16,-10],[74.453,3.402,.234,.486,'#0c090b',13,-17],[22.943,70.049,.391,1.58,'#4b2c1e',13,-5],[90.286,6.683,.234,.365,'#150908',16,0],[9.115,31.896,.13,.547,'#1a0a07',18,-13],[25.495,26.792,.26,.668,'#151313',12,-4],[13.151,53.706,.417,.608,'#1f1410',15,-2],[16.016,40.279,.156,.668,'#1f1808',7,-19],[15.599,54.435,.182,.486,'#3a2618',17,-2],[24.896,21.932,.208,.668,'#120e0c',16,-15],[75.026,88.335,.208,.911,'#471006',17,-5],[83.724,1.458,.26,.425,'#32333c',22,-15],[14.479,37.91,.26,.668,'#0f0f10',12,-1],[9.948,57.169,.599,.486,'#2e190b',15,0],[90.156,34.569,.26,1.033,'#0d0705',7,-17],[83.333,32.199,.182,.486,'#4e1c09',19,-18],[91.953,12.151,.208,1.094,'#0b0806',7,-14],[84.427,29.648,.365,.486,'#110f0c',8,-5],[89.844,65.614,.339,.425,'#090706',14,-14],[22.604,28.433,.13,.547,'#1d120f',18,-16]];
  const ROOMS = [[91.875,86.209,1.172,3.706,15,-18],[8.203,40.887,1.354,2.673,25,-11],[10.13,36.27,1.771,1.823,18,-1],[10.156,61.118,.938,3.341,20,-2],[9.661,39.854,1.094,2.734,17,-10]];
  // 길: [x0,y0,x1,y1,차 크기%] — 가운데 긴 다리, 탑 사이 하늘다리(멀어서 작게), 구름 아래 도로
  const ROADS = [[41,55.3,50.8,66,.15],[44.14,81.71,48.44,88.09,.16],[51.56,95.08,54.95,90.22,.16],[44.8,71.6,49.5,71.9,.14],[52.8,85.7,54.7,88.7,.14],
    [53.6,22.6,59.4,25.3,.08],[53.6,30.8,59,34.1,.09],[66,42,69.4,39.9,.09]];
  // 전광판: [x,y,w,h, 장수, 한 장 머무는 s, 지연 s] — astra가 좌표로 딴 원근 사각형에, 이 그림 속 다른 화면을 펴서 다시 넣은 프레임(bb{i}.webp)
  const BOARDS = [[60.104,20.717,1.536,14.034,4,9,-3],[63.177,25.152,1.328,10.814,4,12,-8],[41.094,25.516,1.484,7.837,4,10,-5],[50.234,67.254,1.719,17.254,4,13,-11]];
  // 빨간 경고등(좌우 탑 꼭대기·모서리): [x,y,깜빡임 s,지연 s]
  const BEACONS = [[9.7,5.8,2.2,0],[30.6,19.7,2.6,-.9],[34.7,39.4,1.9,-1.4],[2.5,86,2.4,-.3],[32.2,62.7,2.8,-2],[70.3,1.5,2.1,-.5],[94.7,2.9,2.5,-1.7],[64.4,64.9,2.3,-1.1],[93.4,51,2.7,-.2],[92.5,81.6,2,-1.5]];
  const pct = n => n + '%';
  const MAN = '<svg viewBox="0 0 20 52" aria-hidden="true"><defs><linearGradient id="mkP" x2="1" y2=".25"><stop offset="0" stop-color="#4a3424"/><stop offset=".45" stop-color="#1c1512"/><stop offset="1" stop-color="#0e0b0a"/></linearGradient></defs><circle cx="10" cy="4.8" r="3.3"/><path d="M5.6 10.4Q10 8.6 14.4 10.4L15.2 27.5H4.8Z"/><path class="ar" d="M5.2 11L3.6 25h2.2L7 12.5Z"/><path class="lg" d="M6 27h3.6l-.4 23.5H6.3Z"/><path class="lg b" d="M10.4 27H14l-.3 23.5h-2.9Z"/></svg>';
  const MID = `
    ${BOARDS.map(([x, y, w, h, n, t, d], i) => `<i class="mk-bb" style="left:${pct(x)};top:${pct(y)};width:${pct(w)};height:${pct(h)};--n:${n};--t:${t}s;--d:${d}s"><b style="background-image:url(${S}bb${i}.webp)"></b></i>`).join('')}
    ${ROADS.flatMap(([x0, y0, x1, y1, sz], r) => Array.from({ length: 10 }, (_, k) => { const back = k % 2, lane = (back ? .18 : -.18) * sz / .15;
      const [a, b] = back ? [[x1, y1], [x0, y0]] : [[x0, y0], [x1, y1]];
      return `<i class="mk-car${back ? ' tail' : ''}" style="width:${sz}%;--x0:${pct(a[0])};--y0:${pct(a[1] + lane)};--x1:${pct(b[0])};--y1:${pct(b[1] + lane)};--t:${8 + (r % 3) * 2 + (k % 4)}s;--d:${-(k * 1.7 + r * .9).toFixed(1)}s"></i>`; })).join('')}`;
  const NEAR = `${BEACONS.map(([x, y, t, d]) => `<i class="mk-red" style="left:${pct(x)};top:${pct(y)};--t:${t}s;--d:${d}s"></i>`).join('')}
    ${FLICK.map(([x, y, w, h, c, t, d]) => `<i class="mk-off" style="left:${pct(x)};top:${pct(y)};width:${pct(w)};height:${pct(h)};background:${c};--t:${t}s;--d:${d}s"></i>`).join('')}
    ${ROOMS.map(([x, y, w, h, t, d]) => `<i class="mk-win" style="left:${pct(x)};top:${pct(y)};width:${pct(w)};height:${pct(h)}"><b style="--t:${t}s;--d:${d}s">${MAN}</b></i>`).join('')}
    <i class="mk-walk" style="left:13.8%;top:57.6%;width:5.2%;height:2.2%">${[[26, 0], [34, -12], [41, -25]].map(([t, d]) => `<b style="--t:${t}s;--d:${d}s">${MAN}</b>`).join('')}</i>`;

  document.body.insertAdjacentHTML('afterbegin', `
<div class="mk-intro" id="lsIntro" aria-hidden="true"><div class="ld-logo">${MARK}</div></div>
<div class="mk-layer" id="lsScene" tabindex="-1" role="region" aria-label="City above the clouds">
  <div class="mk-stage">
    <img class="mk-bg" src="${S}bg-3840.webp" srcset="${S}bg-1920.webp 1920w, ${S}bg-3840.webp 3840w" sizes="234vh" alt="A future city above the clouds, an airship floating in the middle">
    <img class="mk-side l" src="${S}side-l.webp" alt=""><img class="mk-side r" src="${S}side-r.webp" alt="">
    ${reduce ? '' : MID}
    ${[ // 하늘 교통: [그림, 왼쪽%, 위%, 폭%, 시간s, 지연s, 이동(자기 폭 %)] — 속도는 제각각(큰 비행선은 아주 느리게, 드론은 빠르게) — 음수는 왼쪽으로: 그림을 뒤집으면(scale) translate도 뒤집혀서 이동량은 양수로
      ['s1', 20, 10, 2.6, 130, -10, 600], ['s5', 62, 6, 1.1, 30, -20, -1500], ['s6', 30, 8, .9, 38, -35, 1700],
      ['s2', 70, 24, 2.2, 122, -45, -500], ['s5', 40, 16, 1.0, 33, -25, 1500], ['s7', 82, 21, 1.0, 18, -10, -1600],
      ['s8', 8, 4, 3.0, 270, -60, 450], ['s3', 52, 2, 1.4, 140, -30, 800], ['s6', 25, 30, .8, 23, -4, 1700],
      ['s6', 72, 17, 1.0, 21, -8, -1500], ['s7', 55, 35, .9, 41, -22, 1600], ['s9', 88, 12, 2.4, 200, -15, -500],
      ['s5', 45, 27, .9, 18, -5, 1600], ['s1', 86, 38, 1.6, 70, -30, -700]
    ].map(([d, x, y, w, t, dl, dx]) => // 그림은 모두 머리가 오른쪽 → 왼쪽으로 갈 땐 뒤집음(scale이 translate도 뒤집어서 이동량은 양수로). 작을수록 멀리: 노을 안개를 더
      `<img class="mk-dr mk-cruise${dx < 0 ? ' l' : ''} ${w < 1.2 ? 'far' : w < 2 ? 'mid' : ''}" src="${S}${d}.webp" alt="" style="left:${x}%;top:${y}%;width:${w}%;--t:${t}s;--d:${dl}s;--dx:${Math.abs(dx)}%">`).join('')}
    ${reduce ? '' : NEAR}
    <div class="mk-fan"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs><radialGradient id="mkBl"><stop offset=".2" stop-color="#2b3550" stop-opacity=".75"/><stop offset="1" stop-color="#6d7fa8" stop-opacity=".15"/></radialGradient></defs>
      <circle cx="50" cy="50" r="50" fill="#1b2236" opacity=".35"/>
      <g fill="url(#mkBl)"><path d="M50 50 L44 2 Q58 0 62 6 Z"/><path d="M50 50 L98 44 Q100 58 94 62 Z"/><path d="M50 50 L56 98 Q42 100 38 94 Z"/><path d="M50 50 L2 56 Q0 42 6 38 Z"/>
        ${reduce ? '' : '<animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur=".7s" repeatCount="indefinite"/>'}</g>
    </svg></div>
    <img class="mk-hub" src="${S}hub.webp" alt="">
    <a class="mk-spot" href="#music" aria-label="Music" style="left:26.6%;top:47%;width:6.6%;height:37%"></a>
    <a class="mk-spot" href="#vault/Art" aria-label="Art" style="left:73.1%;top:11.2%;width:5.9%;height:40%"></a>
    <a class="mk-spot" href="#vault/IT" aria-label="IT" style="left:66.3%;top:55%;width:7.2%;height:42%"></a>
    <a class="mk-spot mk-courier" href="#briefing" aria-label="Morning Brief"><img class="body" src="${S}s4.webp" alt=""></a>
    <div class="mk-print" aria-hidden="true">${PRINT}</div>
    <a class="mk-canopy" href="https://looinlabs.com" aria-label="looin labs (company site)"></a>
    <a class="mk-ship" href="#study" aria-label="Airship — unlock and enter the study"></a>
  </div>
</div>
<div class="mk-layer" id="lsStudy" tabindex="-1" role="region" aria-label="Study">
  <div class="mk-stage">
    <img class="mk-bg" loading="lazy" src="${S}study3-1920.webp" srcset="${S}study3-1920.webp 1920w, ${S}study3-3840.webp 3840w" sizes="max(100vw, 233vh)" alt="A tall glass-roofed library study at dusk over the city">
    <a class="mk-spot" href="#thoughts" aria-label="Thoughts" style="left:39.5%;top:75%;width:14%;height:11%"></a>
    <div class="mk-ink" aria-hidden="true"><div class="ink-q"><p>You have to lose something to gain something.</p></div><b class="ink-t"></b><div class="ink-g"></div></div>
    <a class="mk-spot" href="#quotes" aria-label="Words to keep" style="left:77.2%;top:43.3%;width:5.2%;height:14.8%"></a>
    <a class="mk-spot" href="#todo" aria-label="Tasks" style="left:92.7%;top:40.4%;width:7.3%;height:19.9%"></a>
    <a class="mk-spot" href="#files" aria-label="Files" style="left:69.6%;top:71%;width:15.4%;height:14%"></a>
    <button type="button" class="mk-spot mk-deck" aria-label="Turntable — study music" style="left:74%;top:60%;width:7.8%;height:10.5%"></button>
  </div>
  <a class="mk-back" href="#">← City</a>
  <a class="mk-gear" href="#settings" aria-label="Settings"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg><span>Settings</span></a>
  <button type="button" class="mk-sound" aria-pressed="false" aria-label="Study music (Ryuichi Sakamoto)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg></button>
</div>
<div class="mk-layer mk-room" id="lsRoom" tabindex="-1" role="region" aria-label="Vault"></div>
<dialog class="mk-pin" aria-label="Study code">
  <div class="mk-pin-top"><span>AIRSHIP ACCESS</span><button type="button" data-x aria-label="Close">Close ×</button></div>
  <div class="mk-pin-ring"><div class="mk-pin-slots" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div>
  <h2 class="mk-pin-title">Open the study</h2><p class="mk-sr" aria-live="polite"></p><button type="button" class="mk-pin-face" hidden>Open with Face ID</button><p class="mk-pin-err" role="alert"></p>
  <div class="mk-pin-pad">${[1,2,3,4,5,6,7,8,9].map(n => `<button type="button" data-k="${n}">${n}</button>`).join('')}<span></span><button type="button" data-k="0">0</button><button type="button" data-k="del" aria-label="Delete">⌫</button></div>
</dialog>`);

  document.documentElement.classList.remove('mk-boot'); // index.html 첫 가림 해제(이제 인트로·장면이 덮음)
  const html = document.documentElement, intro = document.getElementById('lsIntro');
  const scene = document.getElementById('lsScene'), study = document.getElementById('lsStudy');
  
  /* ── 화면 전환 ── */
  const OURS = new Set(['lsIntro', 'lsScene', 'lsStudy', 'lsRoom']);
  const room = document.getElementById('lsRoom');
  const LAYERS = { scene, study, room };
  function show(which) { // 'scene' | 'study' | 'room'(저장고 방, rooms.js) — 옛 MK.HUB 화면은 더 이상 보이지 않음
    const was = Object.keys(LAYERS).find(k => LAYERS[k].classList.contains('on')) || null;
    for (const [k, l] of Object.entries(LAYERS)) { l.classList.toggle('on', which === k); l.inert = which !== k; }
    html.classList.toggle('mk-layer-open', !!which);
    for (const el of document.body.children) // 장면이 덮고 있는 동안 뒤의 SPA는 키보드·낭독기에서도 숨김
      if (!OURS.has(el.id) && el.tagName !== 'DIALOG' && el.tagName !== 'SCRIPT') el.inert = !!which;
    if (which && which !== was && which !== 'room') { // 방은 rooms.js가 제목에 초점을 줌
      const layer = LAYERS[which];
      layer.focus({ preventScroll: true });
      if (layer.scrollWidth > layer.clientWidth) // 세로 화면: 그림을 좌우로 밀어 볼 수 있음. 처음엔 비행선/책상이 가운데
        layer.scrollLeft = layer.scrollWidth * (which === 'scene' ? .505 : .62) - layer.clientWidth / 2;
    }
    if (!which && pinDlg.open) { pinOk = null; pinDlg.close(); }
    if (which === 'scene' || which === 'study') back = which === 'study' ? '#study' : '';
    if (which === 'study') wall(); // 할 일 방에서 돌아오면 달력 동그라미도 새로
    if (which && window.mkBgm) { which === 'study' || (which === 'room' && back === '#study') ? mkBgm.play() : mkBgm.pause(); soundUi(); } // 음악은 서재(와 서재에서 연 방)에서만
  }
  const sound = study.querySelector('.mk-sound');
  const soundUi = () => { const on = !!window.mkBgm?.isOn(); sound.classList.toggle('on', on); sound.setAttribute('aria-pressed', String(on)); };
  sound.addEventListener('pointerdown', e => e.stopPropagation()); // 문서의 '첫 터치에 소리 켜기'보다 이 버튼이 먼저(안 그러면 켜자마자 꺼짐)
  sound.addEventListener('click', () => { window.mkBgm?.toggle(); soundUi(); });
  /* 서재 벽: 턴테이블 = 음악 켜고 끄기. 액자·달력 글자는 글자를 지운 원판(study3) 위에 '인쇄'함:
     그림 좌표(3840×1648 px, astra가 딴 종이 네 모서리)에 원근 변환(matrix3d)으로 붙이고 곱하기 혼합 → 종이 결·조명이 글자에 그대로 묻음.
     달력은 이번 달 + 할 일 있는 날 빨간 동그라미(저장고가 열려 있을 때만 읽음), 액자는 날짜마다 바뀌는 짧은 명언(quotes.html) */
  const deck = study.querySelector('.mk-deck'), paper = study.querySelector('.mk-ink'), stage = paper.parentElement;
  deck.addEventListener('pointerdown', e => e.stopPropagation());
  deck.addEventListener('click', () => { window.mkBgm?.toggle(); soundUi(); });
  const QUADS = { // 왼위, 오른위, 오른아래, 왼아래 [w,h는 글자 상자 크기]
    'ink-q': [[2963, 729], [3162, 713], [3163, 956], [2965, 949], 400, 480],
    'ink-t': [[3585, 712], [3835, 697], [3836, 723], [3586, 740], 500, 56], // 원래 제목 줄을 좌우로 늘림(달 이름 길이가 달라서 가운데 정렬)
    'ink-g': [[3573, 758], [3826, 746], [3827, 978], [3573, 969], 508, 446],
  };
  for (const [cls, [[x0, y0], [x1, y1], [x2, y2], [x3, y3], w, h]] of Object.entries(QUADS)) { // 단위 사각형 → 네 점(사영 변환)
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3, den = dx1 * dy2 - dx2 * dy1;
    const g = (dx3 * dy2 - dx2 * dy3) / den, k = (dx1 * dy3 - dx3 * dy1) / den;
    const m = [(x1 - x0 + g * x1) / w, (y1 - y0 + g * y1) / w, 0, g / w, (x3 - x0 + k * x3) / h, (y3 - y0 + k * y3) / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1];
    Object.assign(paper.querySelector('.' + cls).style, { width: w + 'px', height: h + 'px', transform: `matrix3d(${m.join(',')})` });
  }
  new ResizeObserver(() => paper.style.scale = stage.clientWidth / 3840).observe(stage);
  const pad2 = n => String(n).padStart(2, '0');
  function paintCal(busy) {
    const now = new Date(), y = now.getFullYear(), m = now.getMonth(), lead = new Date(y, m, 1).getDay(), n = new Date(y, m + 1, 0).getDate();
    let cells = '<i></i>'.repeat(lead);
    for (let d = 1; d <= n; d++) cells += `<i class="${busy.has(`${y}-${pad2(m + 1)}-${pad2(d)}`) ? 'busy' : ''}${d === now.getDate() ? ' today' : ''}">${d}</i>`;
    paper.querySelector('.ink-t').textContent = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const g = paper.querySelector('.ink-g');
    g.style.setProperty('--rows', Math.ceil((lead + n) / 7));
    g.innerHTML = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(w => `<u>${w}</u>`).join('') + cells;
  }
  let quotes = null;
  async function wall() {
    paintCal(new Set());
    try { // todosCol·getDocs는 index.html 뒤쪽 스크립트의 전역(아직 없으면 건너뜀)
      if (window.MKVault?.hasAccess() && todosCol) paintCal(new Set((await getDocs(todosCol)).docs.map(d => d.data()).filter(x => x.date && !x.let).map(x => x.date)));
    } catch {}
    try {
      quotes ||= [...new DOMParser().parseFromString(await (await fetch('quotes.html')).text(), 'text/html').querySelectorAll('.card')]
        .map(c => [c.querySelector('.text')?.textContent.trim().replace(/^"|"$/g, '') || '', c.querySelector('.author')?.textContent.replace(/^—\s*/, '').trim() || ''])
        .filter(([t]) => t && t.length <= 34); // ponytail: 액자가 작아서 짧은 것만. 긴 명언은 액자를 누르면 보임
      const [t, a] = quotes[Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5) % quotes.length];
      const q = paper.querySelector('.ink-q'); q.innerHTML = '';
      q.append(Object.assign(document.createElement('p'), { textContent: t }));
      if (a) q.append(Object.assign(document.createElement('small'), { textContent: '— ' + a }));
    } catch {} // 못 읽으면 기본 문구(You have to lose something…)가 그대로
  }
  /* 방을 닫거나 저장고 인증을 그냥 닫으면 마지막에 있던 도시/서재로 */
  let back = '';
  const was = () => Object.values(LAYERS).some(l => l.classList.contains('on'));
  function toLayer(replace) { history[replace ? 'replaceState' : 'pushState'](null, '', location.pathname + location.search + back); route(); }
  /* 서재 암호(임시 5940, 나중에 Face ID). 공개 사이트의 숨은 입구일 뿐 — 실제 데이터는 각 칸을 열 때 MKVault가 지킴 */
  const PIN_HASH = '8bc552c0c116fa615b7306a74f4a998c7ac4fef70074b742abcc82d53ee52611'; // sha256('mk-study:' + 암호)
  const pinDlg = document.querySelector('.mk-pin'), slots = [...pinDlg.querySelectorAll('.mk-pin-slots i')], sr = pinDlg.querySelector('.mk-sr');
  let pin = '', pinOk = null, checking = false;
  const sha = async t => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, '0')).join('');
  const paint = () => { slots.forEach((el, i) => el.classList.toggle('on', i < pin.length)); sr.textContent = `${pin.length} of 4 digits entered`; };
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
    if (ok) pass();
    else {
      sr.textContent = "That code doesn't match";
      pinDlg.classList.remove('bad'); void pinDlg.offsetWidth; pinDlg.classList.add('bad');
      setTimeout(() => { checking = false; pin = ''; paint(); }, 450);
    }
  }
  function pass() {
    try { localStorage.setItem('mk_study', '1'); } catch {}
    sr.textContent = 'Unlocked'; pinDlg.classList.add('ok');
    setTimeout(() => { checking = false; const cb = pinOk; pinOk = null; pinDlg.close(); cb && cb(); }, 350);
  }
  // Face ID: 저장고 패스키 로그인(서버 검증)이 곧 서재 통과. 등록된 Face ID가 있을 때만 버튼이 보임(설정에서 등록)
  const face = pinDlg.querySelector('.mk-pin-face'), faceErr = pinDlg.querySelector('.mk-pin-err');
  face.addEventListener('click', async () => {
    if (checking) return; checking = true; face.disabled = true; faceErr.textContent = '';
    try { await MKVault.passkeyLogin(); if (pinDlg.open) pass(); else checking = false; }
    catch (e) { checking = false; faceErr.textContent = e.message; }
    finally { face.disabled = false; }
  });
  pinDlg.addEventListener('click', e => { const b = e.target.closest('[data-k],[data-x]'); if (b) key(b.dataset.k || 'x'); });
  pinDlg.addEventListener('keydown', e => { if (/^[0-9]$/.test(e.key)) key(e.key); else if (e.key === 'Backspace') key('del'); });
  pinDlg.addEventListener('close', () => { // 취소: 사이트 밖으로 나가지 않게 #study 를 도시로 바꿔 둠
    pin = ''; paint(); pinDlg.classList.remove('ok', 'bad'); faceErr.textContent = '';
    if (pinOk) { pinOk = null; if (location.hash === '#study') { history.replaceState(null, '', location.pathname + location.search); route(); } }
  });
  function gate(cb) {
    let passed = false; try { passed = localStorage.getItem('mk_study') === '1'; } catch {}
    if (passed) return cb();
    pinOk = cb; pin = ''; paint(); face.hidden = true; pinDlg.showModal();
    window.MKVault?.passkeyPrefetch?.().then(() => { if (pinDlg.open) face.hidden = false; }, () => {});
  }
  let seq = 0, last = null;
  function route() {
    if (location.href === last) return; // hashchange·popstate 중복 방지
    last = location.href;
    if (pinDlg.open && location.hash !== '#study') { pinOk = null; pinDlg.close(); } // 뒤로가기 등으로 경로가 바뀌면 암호 창도 닫음
    const my = ++seq, [h, sub] = (() => { try { return decodeURIComponent(location.hash.slice(1)).split('/'); } catch { return ['']; } })();
    if (!h) return show('scene');
    if (h === 'study') { window.mkBgm?.warm(); show('scene'); return gate(() => { if (my === seq) show('study'); }); } // 인증 중 다른 데로 가면 늦은 성공은 무시
    if (h === 'hub') return toLayer(true); // 옛 MK.HUB 홈은 버림
    const key = h === 'vault' ? (sub || '').toLowerCase() : h;
    if (window.mkRooms && mkRooms.has(key)) { // 저장고 인증 뒤 새 화면의 방으로. 인증 창 뒤엔 지금 장면이 그대로 보임
      if (!was()) show(back === '#study' ? 'study' : 'scene');
      const go = () => { if (my === seq) { show('room'); mkRooms.open(key, () => toLayer(false), back); } };
      return window.MKVault && !mkRooms.pub(key) ? MKVault.requireAccess(go) : go(); // 도시의 칸(드론·음악·예술·IT)은 암호 없이. MKVault 없으면 방이 '불러오지 못했어요'를 보여 줌
    }
    // 그 밖의 해시(페이지 안 앵커 등)는 건드리지 않음
  }

  /* ── 인트로: 처음 들어올 때(탭 세션당 한 번) 다크 배경 로고 → 현수막으로 날아가 박힘 ── */
  function land(fly) { // 드론이 화면 밖에서 날아오는 건 홈페이지를 처음 열 때(인트로 뒤)만. 방에서 돌아오면 제자리에 떠 있음
    const c = scene.querySelector('.mk-courier');
    if (!fly) c.classList.add('here'); else setTimeout(() => c.classList.add('here'), 4000);
    scene.classList.add('go');
  }
  function playIntro() {
    intro.classList.add('on');
    const mark = intro.querySelector('.mark');
    let done = false;
    const fly = () => { // 로고가 캐노피 인쇄 자리(.mk-print: 무대 기준 위치·폭·9° 기울기)로 날아가 그대로 인쇄가 됨
      if (done) return; done = true;
      const a = mark.getBoundingClientRect(), st = scene.querySelector('.mk-stage').getBoundingClientRect();
      const bx = st.left + .49315 * st.width, by = st.top + .3268 * st.height, bw = .01468 * st.width;
      intro.classList.add('leaving');
      mark.style.color = ink;
      const labs = mark.querySelector('.labs'); labs.style.animation = 'none'; labs.style.transition = 'opacity .4s'; labs.style.opacity = '0'; // 캐노피 인쇄엔 LABS 줄이 없음
      mark.style.transform = `translate(${bx - a.left}px, ${by - a.top}px) rotate(9deg) scale(${bw / a.width})`;
      setTimeout(() => { land(true); mark.style.transition = 'opacity .35s'; mark.style.opacity = '0'; }, 900);
      setTimeout(() => intro.classList.remove('on'), 1300);
    };
    setTimeout(fly, 2700);
    intro.addEventListener('click', fly); // 건너뛰기
  }

  if (!FROM_EMAIL_LINK && !location.hash && !reduce) playIntro(); // 첫 화면으로 들어올 때마다(해시 링크·이메일 복귀는 건너뜀). 눌러서 건너뛰기
  if (!FROM_EMAIL_LINK && !location.hash) show('scene'); // DOMContentLoaded 전에도 MK.HUB 홈이 비치지 않게
  // 첫 라우팅은 vault-client.js(defer)까지 실행된 뒤 — 그래야 openApp이 잠금을 거침
  document.addEventListener('DOMContentLoaded', () => {
    addEventListener('hashchange', route); addEventListener('popstate', route);
    window.mkBgm?.onChange(soundUi); // 재생·음소거 바뀌면 음표 버튼 표시
    window.setPage = () => {}; // 옛 MK.HUB 페이지 전환은 버림(뒤의 SPA는 Firebase·저장고 인증 배관으로만 씀)
    addEventListener('mk:vault-cancel', () => { if (!room.classList.contains('on')) toLayer(true); }); // 방 열기 전 인증을 닫음 → 원래 장면
    if (FROM_EMAIL_LINK) return show('scene'); // 이메일 로그인 복귀: 인증 창은 vault-client가 띄움, 뒤엔 도시
    route();
    if (!intro.classList.contains('on')) land();
  });
})();
