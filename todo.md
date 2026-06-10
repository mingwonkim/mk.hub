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
- [ ] 드로잉 전용(`draw` 타입) 메모도 텍스트 없이 이미지만 .md로 동기화
- [ ] GitHub push 결과를 UI에 표시 (성공/실패 토스트)

### 4. 옵시디언 볼트 세팅 (2026-05-23 완료)
- Obsidian 앱 설치 + 볼트 `C:\CodingProjects\obsidian-vault` 생성
- 플러그인 6종 사전 설치: Excalidraw/Calendar/Dataview/Obsidian Git/Book Search/Copilot
- 비공개 repo `mingwonkim/obsidian-vault` 생성 + push
- 사용자 남은 단계: 볼트 열기·코어플러그인 2개·Copilot 키·mk.hub Settings 연결 (바탕화면 가이드 참고)

### 5. (보류) 아이폰 메모앱 동기화 — 사용자가 안 하기로 함
