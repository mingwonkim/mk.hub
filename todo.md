# MK.HUB Todo

---

## 진행 중 — 갤러리 사진 버그 + Notepad 개선 (2026-06-10)

작업 전 상태: git tag `pre-fix-20260610` (커밋 06d3d87)

- [x] 필름 효과 버그 원인 확인 — 2picture 보드 사진(photo-1~5)에 grayscale/saturate 필터가 적용돼 있었음 (1picture 자체는 정상)
- [x] 필름 효과 버그 수정 — 2picture·4picture 사용자 사진 슬롯의 탈색 필터 제거 (필름 스트립 효과는 유지)
- [x] 2~5picture: 사진 저장 통일 — 공용 pic-store.js (IndexedDB + 1600px JPEG 압축), 1~5 전부 적용, 구버전 localStorage 자동 마이그레이션
- [x] index.html: 모바일 캐러셀 IndexedDB 연동 + 모바일 피드 iframe sandbox에 allow-same-origin 추가 (사진 안 보이던 원인)
- [x] 갤러리 수정 브라우저 검증 (5개 파일 모두 사진 삽입 → 새로고침 → 유지 확인, 허브 캐러셀 확인)
- [x] Notepad: 에디터 가시성·글꼴 현대화 (Notion/Bear 스타일 참고)
  - Pretendard Variable 폰트 도입 (CSP에 cdn.jsdelivr.net 허용 추가)
  - 제목 28px 볼드 + 구분선, 본문 17px/행간 1.85, 박스 없는 문서형 에디터 (760px 중앙)
  - 본문 textarea 자동 높이 확장 (memoBodyAutoGrow)
  - 배경사진(bgGrid) 위 가독성 위해 글래스 카드 배경 적용 (라이트/다크 대응)
  - 메모 리스트 제목 15px·미리보기 13px로 가독성 상향
- [x] Notepad 수정 브라우저 검증 (다크/라이트 모드 스크린샷 확인)
- [x] git commit + push

### 2차 요청 (2026-06-10)
- [x] 사진 원본 화질 그대로 저장 — pic-store.js에서 1600px JPEG 압축 제거, 원본 dataURL 그대로 IndexedDB 저장 (바이트 무손실 검증)
- [x] 모바일 갤러리 피드 UI 개선 (인스타그램 참조)
  - 포스트를 라운드 카드(18px)로 분리 + 그림자
  - 아바타에 IG 스토리식 그라데이션 링
  - 액션 바 추가: 좋아요(localStorage `mk_feed_likes` 저장·하트 애니메이션) / 공유(Web Share API) / 전체보기
  - "View Collection" → 필(pill) 버튼, 캡션 Pretendard 13px
  - 썸네일 iframe 배율 fitFeedThumbs()로 카드 폭 반응형 (기존 390px 고정값 보정)
  - 라이트 모드 대응 (흰 카드·주황 CTA)
  - 참고: 캐러셀 하단 dot은 과거에 의도적으로 제거한 이력이 있어 다시 넣지 않음
- [x] 검증 + commit/push

### 3차 요청 (2026-06-10) — Todo 페이지 리디자인 (TickTick/Things 패턴)
- [x] 데스크탑: 2단 레이아웃 — 왼쪽 선택 날짜 패널(날짜 헤더·진행률 바·둥근 체크 리스트·항상 보이는 빠른 입력), 오른쪽 월 달력(항목 칩 최대 3개 + "+n")
- [x] 셀 클릭 = 날짜 선택(인라인 입력 제거), 데스크탑은 선택 시 입력칸 자동 포커스
- [x] 모바일: 달력을 숫자+점(dot)으로 압축(기존 10px 글씨 문제 해소), 아래에 날짜 패널 스택
- [x] 달력·패널 모두 글래스 카드 배경(배경사진 위 가독성), 오늘 = 빨간 원형 날짜
- [x] 라이트 모드 대응 + 데스크탑/모바일/라이트 검증 + commit/push
- 제거됨: addTodoInline / todoCalCellClick / .todo-inline-input (인라인 입력 경로)

### 4차 요청 (2026-06-10)
- [x] 홈 위클리 투두 위젯 UI를 Todo 페이지 스타일로 통일
  - 계획 텍스트를 .todo-mini → .todo-chip(빨간 왼쪽 보더 칩, Pretendard)으로 교체
  - 오늘 날짜 빨간 원형 pill, 셀 라운드/보더 페이지 달력과 통일
  - 모바일: 칩 숨기고 숫자+점(dot) 표시 (더보기 버튼도 숨김)
- [x] 모바일 picture1~5 확대 화면 버그 수정 — 원인 2가지
  - 캐러셀 터치 IIFE·iOS 스크롤락 IIFE가 모달 마크업보다 먼저 실행돼 getElementById가 null → 핸들러 미부착 → DOMContentLoaded 후 초기화로 수정
  - 모달 inline touch-action:none + lockBody의 body touch-action:none이 5picture iframe 스크롤 차단 → 제거
- [x] 검증(스와이프 시뮬레이션 01→02→03 확인, 데스크탑/모바일/라이트) + commit/push

### 5차 요청 (2026-06-10) — Notepad/Vault 폴더 UI 개선
- [x] 폴더 카드 리디자인: 글래스 카드 + 46px 그라데이션 아이콘 타일 + Pretendard 이름/메타
- [x] 🔒 이모지 → Material lock 아이콘 원형 배지 (폴더 내부 잠금 버튼 4곳도 lock/lock_open으로)
- [x] ✕ 삭제 → Material close 원형 버튼 (호버 시 노출, 터치 기기는 반투명 상시)
- [x] 잠긴 폴더 스타일: 살몬 틴트 카드 + 배지, fc-meta 개수 표기 버그 수정((counts||0)+' notes' 우선순위)
- [x] Music 플레이리스트 카드(같은 .folder-card)도 ✕ → Material close 통일
- [x] 라이트 모드 보정 + 다크/라이트/모바일/호버 검증 + commit/push

### 6차 요청 (2026-06-10) — 명언 칸 + 메인화면 UI 개선
복원 지점: git tag `pre-hub-redesign-20260610` (커밋 28994f0, push됨)
- [x] 명언/메모 버블: 글래스 카드 + 상단 레드 그라데이션 라인 + "TODAY'S QUOTE/MEMO" 태그 + format_quote 워터마크(명언 페이지만) + 살몬 pill 활성 dot
- [x] 명언·메모 타이포 Pretendard 전환, 작성자 살몬 강조
- [x] 히어로: 펄스 레드 도트 + 오늘 날짜 라벨 + MK.HUB 타이틀 그라데이션 페이드
- [x] 라이트/모바일 대응, 페이지 전환 태그 갱신 JS
- [x] 다크/라이트/모바일 검증 + commit/push

### 7차 요청 (2026-06-10) — 라이트 모드 색 보정
- [x] 명언 좌우 메모칸이 검정으로 뜨는 버그 — 라이트 오버라이드가 background-color만 덮어 다크 그라데이션(background-image)이 남던 문제 → background 쇼트핸드로 수정
- [x] 핑크 구분 문제 — 2단 위계 도입: 컨테이너(허브 카드·위클리 위젯·Todo 패널/달력·폴더 카드·버블)는 연핑크 #ffe9e3 + 진한 보더 #f3c0ae + 웜 그림자, 내부 셀(todo-day·todo-cal-cell)은 흰색 #fffdfc
- [x] 폴더 아이콘 타일 흰 배경, 잠긴 폴더 #ffd9cc, 칩 #ffeae3, todo-quick 보더 가시화
- [x] 모바일 라이트 동일 적용(공통 오버라이드) + 검증 + commit/push

### 8차 요청 (2026-06-10) — 라이트 모드 재보정 (원칙: 라이트=다크와 구조 동일, 색만 반전)
- [x] MK.HUB 타이틀 페이드 그라데이션 라이트에서 제거 (단색)
- [x] 연핑크 카드 폐기 → 화이트 글래스 카드(허브 카드·위클리·Todo 패널/달력·폴더·음악 모듈·명언칸), 핑크/레드는 악센트로만
- [x] 내부 셀은 옅은 웜그레이 rgba(0,0,0,.03) — 다크의 rgba(255,255,255,.025) 반전
- [x] 명언칸: 다크와 동일한 글래스 그라데이션·토플라인·태그·워터마크 유지, 색만 반전
- [x] 허브/Notepad/Todo/모바일 라이트 검증 + commit/push

### 9차 요청 (2026-06-11) — 갤러리 DNG 업로드 지원
- [x] pic-store.js: fileToDataURL에서 DNG 감지 → TIFF IFD 파싱으로 내장 JPEG 프리뷰(최대 크기) 추출 → JPEG dataURL로 저장
  - raw IFD(CFA 32803 / LinearRaw 34892)는 lossless JPEG이라 <img> 렌더 불가 → 후보에서 제외
  - 프리뷰 없는 DNG는 alert 후 실패 처리 (변환 불가)
  - 테스트: `C:\CodingProjects\tmp\test_dng_extract.js` (합성 DNG로 추출 검증, node 실행)
- [x] 1~5picture.html: 파일 선택기 accept를 `image/*,.dng`로 확장
- [x] commit + push (d4b4a07)
- 남은 확인: 실제 카메라/폰 DNG 파일로 브라우저 업로드 1회 테스트 (사용자)

---

## 완료된 작업 (2026-04-28)

- [x] 모바일 캐러셀 스크롤바 제거
- [x] 모바일 사진 스와이프 수정 (`touch-action:none`을 img에도 적용)
- [x] 캐러셀 하단 dot(01~05) 제거, Intro/Verse/Prechorus/Sabi/Hook 라벨로 교체
- [x] 모바일 게시물 태그 라벨 통일 (데스크탑 버전 기준)
- [x] Hub 기본 화면을 명언(quote) 섹션으로 변경 — 모바일/데스크탑 동일
- [x] 잠긴 폴더 이름·아이콘·개수 숨김 (Notepad + Vault 모두)
- [x] 통합 메모 에디터 구현 — 텍스트+드로잉 하나의 노트로 (Obsidian-like)
- [x] GitHub API 기반 Obsidian 동기화 구현
  - Settings에 Obsidian Sync 섹션 추가
  - 노트 저장 시 GitHub .md 자동 push (신규/수정 모두)
  - Push All / Pull from GitHub 수동 버튼
  - 드로잉 포함 노트도 동기화 (이미지 링크 포함)
- [x] 바탕화면에 Obsidian 연동 설정 가이드 파일 생성

---

## 남은 작업

### 1. Music 페이지 — Interesting Songs / Music Analysis 제거 (2026-05-23)
- [x] Interesting Songs 카드 + 뷰 + JS + Firestore 참조 전체 삭제
- [x] Music Analysis(준비 중) 카드 삭제, 모듈 번호 재정렬(01~05)
- 참고: Firestore `interesting_songs` 컬렉션 데이터는 DB에 남아있음 (참조만 제거)

### 2. 밝은 모드(Light Mode)
- [x] CSS 변수 기반 light mode 정의
- [x] Settings 페이지에 라이트/다크 토글 버튼
- [x] `localStorage`에 모드 저장 및 복원
- [x] 라이트모드 가독성 보정 (2026-05-23)
  - 연한 글씨 진하기 상향 (`--mk-outline`/`--mk-outline-var` 다크닝 + `text-outline/40~70` 오버라이드)
  - Weekly To-Do 박스 시그니처 연핑크 적용
  - My Fragments/갤러리 라이트모드 색상 적용 + `#blackFadeOverlay` 라이트모드 비활성화
- [x] 흰 칸 → 시그니처 연핑크 (2026-05-23): Hub 카드·음악 모듈 카드·폴더 카드·`#ffe9e3`
- [x] 옅은 글씨 추가 보정 (2026-05-23): `text-[#ffb4a2]`→`#FF3B00`, `text-on-surface/*`·`writing-text` 다크닝, 하단바 비선택 칸, My Fragments 번호
- [x] Todo 페이지(`#page-todo`) 라이트모드 보정 (2026-05-23) — 캘린더 칸 연핑크, 날짜·할 일 글씨 다크닝, 월 이동 버튼·토요일 색 보정
- [x] 상단 표시줄을 하단 바처럼 어두운 톤(`rgba(19,19,19,.6)`)으로 통일, 글씨는 라이트핑크 (2026-05-23)

### 3. Obsidian 동기화 — 추가 개선 (선택)
- [x] Pull 시 기존 메모 업데이트 (2026-05-23) — `mk_id` 일치 시 `updateDoc`, 본문 끝 이미지 마크다운 제거
- [x] `ghPullAll` dot-폴더(.obsidian 등) 제외 (2026-05-23)
- [x] 드로잉 전용(`draw` 타입) 메모도 텍스트 없이 이미지만 .md로 동기화 (2026-06-11)
  - draw 타입은 `b`가 이미지 URL — frontmatter 본문 비우고 `![](b)` 마크다운으로 출력
  - ghPushAll의 draw 스킵 제거 (이미지 없는 draw만 제외)
- [x] GitHub push 결과를 UI에 표시 (성공/실패 토스트) (2026-06-11)
  - _ghPush가 PUT 실패 시 throw → 노트 저장 시 "GitHub 동기화 완료/실패" 토스트
  - Push All은 실패 건수 집계해 "N개 업로드, M개 실패" 표시

### 4. 옵시디언 볼트 세팅 (2026-05-23 완료)
- Obsidian 앱 설치 + 볼트 `C:\CodingProjects\obsidian-vault` 생성
- 플러그인 6종 사전 설치: Excalidraw/Calendar/Dataview/Obsidian Git/Book Search/Copilot
- 비공개 repo `mingwonkim/obsidian-vault` 생성 + push
- 사용자 남은 단계: 볼트 열기·코어플러그인 2개·Copilot 키·mk.hub Settings 연결 (바탕화면 가이드 참고)

### 5. (보류) 아이폰 메모앱 동기화 — 사용자가 안 하기로 함

---

## 10차 — 인터랙티브 애니메이션 랜딩 개편 (2026-07-08)

절제된 에디토리얼 톤, 기존 색감(#131313/#ffb4a2/#FF3B00) 유지. 전부 바닐라 CSS/JS(`mk-` 네임스페이스), 기존 마크업·기능 무수정 레이어 추가 방식.

- [x] 인트로 시퀀스 — 첫 진입 시 MK.HUB 워드마크+살몬 룰+서브라벨 1.9s 오프닝 → hub 릴레이. 세션당 1회(sessionStorage `mk_intro`), reduced-motion 시 즉시 스킵, 3.5s 하드 가드
- [x] 스크롤 리빌 — 카드 그리드(80ms 스태거)·Weekly To-Do·갤러리 구분선·모바일 피드가 IntersectionObserver로 순차 등장, 완료 후 클래스 클린업(카드 hover 원복 보장). iframe은 제외
- [x] Hero 패럴랙스 — 타이틀 -0.10x / aurora +0.05x 속도차 (데스크탑 전용, hub 벗어나면 자동 리셋)
- [x] 카드 3D 틸트(±2.5deg) + 마우스 글로우(lerp 추적, idle 시 rAF 0) — 데스크탑 전용, Vault 카드 -32px 오프셋 보존, 페이지 전환 시 글로우 즉시 숨김
- [x] Aurora 살아있는 배경 — 살몬/오렌지 그라디언트 블롭 2개 드리프트(26s/38s) + feTurbulence 노이즈, blur 필터 없이 컴포지터 전용
- [x] 페이지 전환 — `.page.active`에 mkPageIn(fade+10px) keyframe, setPage scrollTo smooth→auto
- [x] 성능/접근성 — will-change 추가 0개, prefers-reduced-motion 통합 가드, 모바일은 aurora·리빌만 활성
- [x] 검증 — 다크/라이트, 데스크탑/모바일(375px), 인트로 재생/세션 스킵, 틸트·글로우·패럴랙스·리빌 상태값 실측, 콘솔 신규 에러 0
- [x] git commit + push

### v2 확장 — 인터랙티브 대량 추가 (2026-07-08, "최대한 많이, 나중에 뺄 것")
기능별로 CSS 주석 구획(`/* ── v2: ... ── */`)과 JS 블록이 분리돼 있어 개별 제거 쉬움.
- [x] 커스텀 커서 — 링(lerp 추적)+도트, 클릭 가능 요소 위 확대, 클릭 시 수축 (데스크탑)
- [x] 클릭 리플 — 클릭/탭 지점 살몬 파동 확산
- [x] hero 타이틀 글자 분해 — 스태거 등장(인트로 릴레이) + 글자별 호버 리프트 + 마우스오버 스크램블 디코딩
- [x] 실시간 시계 — hero 날짜 옆 HH:MM:SS
- [x] 스크롤 프로그레스 바 — 최상단 2px 살몬 그라디언트
- [x] nav 자동 숨김 — 스크롤 다운 시 숨김 / 업 시 복귀
- [x] 백투탑 버튼 — 1.4화면 이상 스크롤 시 우하단 등장
- [x] 카드 스포트라이트 — 커서 위치 따라 카드 내부 radial 하이라이트
- [x] Music 이퀄라이저 격발 — 카드 hover 시 viz-bar 0.8s→0.32s
- [x] Weekly To-Do 셀 hover 팝
- [x] 갤러리 구분선 스크롤 채움 — .gal-sep-rule이 스크롤 진행에 따라 살몬으로 채워짐
- [x] 마퀴 스크롤 가속 — 스크롤 속도에 비례해 playbackRate 최대 3.4x 후 감쇠
- [x] 더스트 파티클 캔버스 — 떠오르는 입자 34개(모바일 16), 마우스 반발, hub 비활성/탭 숨김/딥스크롤 시 rAF 자동 정지
- [x] hero 마우스 패럴랙스 — 타이틀이 커서 반대 방향 미세 이동
- [x] 검증(데스크탑/모바일/스크램블/nav숨김/리플/스포트라이트 실측) + commit/push

### v3 — 시그니처 테마 + 내부 페이지 인터랙션 (2026-07-08 사용자 피드백 반영)
- [x] 과한 효과 완화 — 이퀄라이저 hover 0.32s→0.55s, 클릭 리플 52px/알파 .55로 축소, 타이틀 글자 호버 리프트만(-0.035em, 회전 제거)
- [x] **시그니처 '기억의 이끼' 캔버스** — 커서가 지나간 자리에 유기적 덩굴이 자라며 오렌지 블룸이 피고 서서히 페이드(잉크 잔상 3~4s). 유휴 시 화면 하단에서 자생. hub 이탈 시 성장 중단+빠른 페이드, 탭 숨김/딥스크롤 시 rAF 정지. 가지 상한 70개
- [x] 대형 반투명 시계 — hero 배경에 15vw HH:MM:SS 워터마크(다크 4.5%/라이트 5.5% 알파), 기존 소형 시계 제거
- [x] hero 스크롤 페이드 — 타이틀이 스크롤에 따라 패럴랙스+투명해짐
- [x] 내부 페이지(notepad/vault/music/settings/todo) 인터랙션
  - setPage 진입 시 콘텐츠 블록 스태거 등장 (mkPageEnter 훅, 최대 8개)
  - .app-page-title 밑 살몬 룰 드로우 애니메이션 (페이지 활성화마다 재생)
  - .folder-card ::before를 커서 추적 스포트라이트로 업그레이드 (위임 리스너)
  - Music 모듈 카드([data-module]) 커서 스포트라이트 신규
- [x] 검증(이끼 잉크 픽셀 실측, hub 이탈 페이드 5188→483, 내부 페이지 룰/스포트라이트/스태거) + commit/push
- 참고: gstack browse 데몬(v1.58)이 세션 중 간헐 재시작 — 페이지 무관(빈 페이지+소크 테스트로 분리 검증)

### v4 — 사용자 피드백 3건 (2026-07-08, 맥 이어작업)
- [x] MK.HUB 호버 스크램블 제거 — 글자 랜덤 치환 효과 삭제, 글자 리프트·스태거 등장은 유지 (호버 후 텍스트 불변 실측)
- [x] 대형 시계 재배치 — right:-6px 잘림 → 화면 중앙(top:50vh, translate 센터링), 알파 4.5%→12% + 살몬 글로우 (centerX 640/1280, 모바일 375px 잘림 없음 실측)
- [x] 내부 페이지(notepad/vault/music) 인터랙션 확장
  - 리스트·폴더 그리드 스태거 등장 (렌더마다, nth-child 딜레이)
  - memo 노트 hover 살몬 액센트 바 / Vault 파일 카드 hover 리프트
  - 폴더·Music 모듈 카드 커서 3D 틸트 (기존 위임 pointermove에 --rx/--ry 추가)
  - Music: 화살표 슬라이드 + 아이콘 팝 + 넘버 하이라이트
  - 드롭존 아이콘 부유 + 드래그오버 펄스, 페이지 라벨 트래킹 인, 버튼·검색창 마이크로 인터랙션
  - reduced-motion 가드에 신규 애니메이션 3종 추가
- [x] 검증 — 틸트 변수(1.5deg)/라벨 애니/스태거 애니 실측, 신규 콘솔 에러 0, 모바일 확인 + commit/push
- [x] 시계 스크롤 추적 — 스크롤 시 화면 중앙 위치 유지(--ckY 1:1 추적), 갤러리 마퀴가 화면 하단에 닿는 순간 정지 후 페이지와 함께 스크롤 아웃. 기존 v2 rAF 스크롤 핸들러에 통합, hub 활성+비 reduced-motion 시에만 동작 (추적/정지/복귀 실측)
- [x] 시계 방향 점등 → **점진 와이프로 개선** — background-clip:text 그라디언트 + `--ckP`(0~100) 변수로 마우스 X를 따라 주황이 좌→우 채워지고 우→좌 지워짐. 96↑/4↓ 스냅. 방향 semantics: dx>0이면 max(채움), dx<0이면 min(지움) — 흰 상태에서 오른쪽 진입 시 오점등 없음 (30/60/100/50/0/40 진행값 + 55% 렌더 실측)
- [x] 와이프 모션 매끄럽게 — CSS transition(.18s, 이벤트 단위로 끊김) 제거 → 타깃(ckT)/렌더값(ckP) 분리 후 rAF lerp(.12) 매 프레임 감속 추적. 디스플레이 주사율 네이티브(120Hz=120fps), 경계 페더 ±5%→±9%로 완화 (프레임별 수렴 곡선 0→28→45→55→61→65→68 실측)
- 참고: 맥 git identity는 자동 생성값 유지 — 사용자가 윈도우와 달라도 무방하다고 결정

---

## 11차 — 고급화 5종 (2026-07-08 밤, 야간 러너 자동 작업)

공통 규칙: 바닐라 CSS/JS, `mk-` 네임스페이스, 기존 기능 무수정 레이어 방식. 항목당 1커밋+push.
검증은 gstack browse로 실측(다크/라이트, 데스크탑/모바일 375px, 콘솔 신규 에러 0, reduced-motion 가드).
index.html.backup은 절대 수정 금지. 완료 즉시 이 목록에 [x]+한 줄 결과 기록.

- [x] 1. **모션 언어 통일** — v1~v4에 흩어진 이징·duration을 CSS 변수 토큰으로 통일.
  `:root`에 `--mk-ease`(기본 cubic-bezier(.22,.61,.36,1)), `--mk-ease-pop`(cubic-bezier(.34,1.56,.64,1)),
  `--mk-dur-1: .3s / --mk-dur-2: .6s / --mk-dur-3: 1.2s` 정의 후 mk- 계열 애니메이션/트랜지션 전부 치환.
  duration은 가장 가까운 토큰으로 스냅. 기능 변화 0 — 치환 전후 렌더 동일성 확인.
  → 완료: 토큰 5종 정의 + mk 레이어 치환(mk 외 앱 CSS 무수정), browse 실측 다크/라이트 통과, 콘솔 신규 에러 0.
- [x] 2. **글로우 보더 (시네마틱 라이팅)** — hubCardGrid 카드·folder-card·music 모듈 카드의 보더가
  커서 근처만 밝아지게. 기존 --mx/--my 재활용, ::after에 radial-gradient 보더(padding 1px + mask:
  linear-gradient XOR 방식 또는 border-image 불가 시 inset box). 기존 스포트라이트(배경)와 공존.
  라이트 모드 색 별도. will-change 추가 금지.
  → 완료: 대상 3종 ::after mask-composite:exclude 보더 글로우(다크 살몬 .5/라이트 주황 .35), 스포트라이트 ::before 공존·reduced-motion 가드 등록, browse 실측 통과, 콘솔 신규 에러 0.
- [x] 3. **페이지 전환 연출** — setPage를 2단 전환으로: 나가는 페이지 fade+살짝 축소(0.97)+어두워짐
  → 들어오는 페이지 떠오름. 기존 mkPageIn keyframe 대체. 전환 중 클릭 가드. 총 소요 0.5s 이내,
  reduced-motion 시 즉시 전환. navHistory/뒤로가기 동작 불변 확인.
  → 완료: mkPageOut(.22s opacity+scale .985+brightness .8) → mkPageIn(.28s translateY 12px+scale 1.005) 2단 전환, 연속 호출 가드(진행 중 타이머 취소·마지막 호출 우선), reduced-motion 즉시 전환+가드 등록, browse 실측(순회/연속호출/다크·라이트) 통과, 콘솔 신규 에러 0.
- [x] 4. **갤러리 컬러 브리지** — hub 스크롤이 갤러리 마퀴에 접근하면 배경 #131313이 파치먼트 톤
  (#ede6d6 방향)으로 서서히 물드는 전환. 기존 v2 스크롤 핸들러에 진행률 계산 추가, body 또는
  #page-hub 배경색 lerp. 시계 정지 지점과 동일한 앵커(galleryMarqueeWrap) 사용. 라이트 모드는
  이미 밝으므로 미묘하게만. 갤러리를 벗어나 위로 스크롤하면 원복.
  → 완료: onScroll2에 진행률(마퀴 top 기준 1뷰포트 램프)→`--mk-bg` 변수 lerp(다크 45%/라이트 80% 캡,
  두 색이 가까워 자동으로 미묘), body.bg-background가 tailwind 리터럴이라 변수 따르도록 1줄 보강.
  브라우저 실측: 진행값 0→62,60,57→117,114,107, 스크롤 업/hub 이탈 시 원복, 라이트·모바일 375px 통과, 콘솔 신규 에러 0.
- [x] 5. **⌘K 커맨드 팔레트 + 시간대 색온도** — (a) ⌘K/Ctrl+K로 오버레이 팔레트: 페이지 이동
  (hub/notepad/vault/music/settings/todo), 음악 모듈 열기(openMusicApp), 테마 토글, 메모 검색
  (cachedMemos 제목 필터→editMemo). 방향키+Enter 네비, Esc 닫기, 퍼지 매칭은 단순 includes로 충분.
  PIN 잠금 상태에서는 잠긴 기능 비노출. (b) 시간대 색온도: 6-11시 aurora 살짝 따뜻하게/18-24시 깊게
  — aurora 블롭 hue/알파 미세 조정 수준, 과하지 않게.
  → 완료: (a) #mkPalette 오버레이(다크/라이트 별도 스타일), 명령 9종+한/영 키워드 includes 필터,
  Settings는 openApp 경유로 기존 PIN 게이트 유지, 메모 검색은 isUnlocked일 때만+잠긴 폴더 제외,
  캐시 없으면 열 때 백그라운드 loadMemos. (b) mk-tone-warm/deep 클래스를 시간대별 부여(10분 재체크),
  다크 전용 aurora 오버라이드. 실측: ⌘K/Ctrl+K 토글·방향키·Enter(Todo 이동)·Esc·빈 결과·pitch 실행·
  테마 토글·warm/deep CSS 매칭·라이트 모드 스크린샷 통과, 콘솔 신규 에러 0.
- [x] 최종: 5종 통합 소크 테스트(전 페이지 순회+스크롤+팔레트 왕복, 콘솔 에러 0) 후 todo.md 갱신
  → 통과: 6페이지 순회(2단 전환 정상 복귀), 스크롤 왕복(브리지 물듦→top 원복), 팔레트 5회 왕복+
  팔레트 경유 Vault 이동, 콘솔 신규 에러 0. **11차 고급화 5종 전체 완료 (2026-07-09).**

---

## 12차 — 내부 페이지 에디토리얼화 + 전환/컬러 연속성 (2026-07-09)

참조: lusion.co(전환 연속성·베일 스윕), daylightcomputer.com(페이지 전체 웜 컬러 저니).
공통 규칙 동일(mk- 레이어, 항목당 1커밋, browse 실측, backup 무수정). 디자인 1차 안 → 사용자 검토 게이트.

- [x] 1. **내부 페이지 에디토리얼 헤더+컴포넌트 폴리시** — notepad/vault/music(+todo/settings 일관성)
  헤더에 대형 고스트 인덱스 워터마크(attr 기반)+하단 헤어라인, 타이틀 스케일 업(최대 64px),
  액션 버튼 그라데이션·검색창 필 글래스·브레드크럼 Space Grotesk·메모 리스트 인덱스 카운터·드롭존 정제
- [x] 2. **페이지별 컬러 아이덴티티 (daylight)** — 페이지 톤 맵(다크: 웜 엄버/스톤/더스크…, 라이트: 크림 변주)
  setPage 진입 시 --mk-bg lerp 전환, hub 복귀 시 갤러리 브리지에 소유권 반환 (스크롤 핸들러와 소유권 충돌 정리)
- [x] 3. **루전식 베일 전환** — setPage에 목적지 톤 색 베일이 아래→위로 덮고 커밋 후 위로 릴리즈(.55s, 곡률 라운드),
  전환 중 클릭 가드, reduced-motion 즉시 전환 유지
- [ ] 4. **갤러리 컬러 저니 (1~5picture 연속성)** — 단일 파치먼트 브리지를 다단계 스탑(마퀴→01 딥레드→02 파치먼트
  →03 니어블랙→04 페이퍼→05 base)의 구간별 lerp로 확장 + iframe 사이 gal-bridge 그라데이션 스트립으로 경계 봉합
- [ ] 검증+커밋: 단계별 browse 실측(다크/라이트/모바일 375px/콘솔 0) 후 사용자 검토 요청
