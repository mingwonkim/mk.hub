# MK.HUB Memory

프로젝트의 주요 의사결정 사항을 기록한 문서. Second brain으로 활용하여 과거 결정의 맥락과 근거를 빠르게 참조할 수 있도록 함. 목차별로 마주했던 패턴, 해결책, 의사결정 이유를 기록한다.

---

## 아키텍처 결정

### 빌드 도구 없음 (Vanilla HTML/CSS/JS)
- **결정**: 빌드 도구(Webpack, Vite 등) 미사용, 파일 직접 수정
- **이유**: 정적 GitHub Pages 배포에 최적화, 복잡도 최소화
- **배포**: GitHub Pages → 민권.com (CNAME)

### SPA 라우팅 방식
- **결정**: URL 변화 없이 `.active` 클래스 토글로 페이지 전환
- **이유**: 정적 호스팅 환경에서 서버 라우팅 불필요
- **함수**: `setPage(p)`, `navHistory` 배열로 뒤로가기 관리

### Firebase 비동기 로드
- **결정**: `Promise.all([import(...)])` 방식, 로컬 파일 우선 → CDN 폴백
- **이유**: CDN 장애 대비 오프라인 보험
- **주의**: `db`, `stg`, `auth`는 로드 전 `null` → 모든 DB 함수 `async/await` 필수

---

## 패턴 및 해결책

### PIN 잠금 & iframe 통신
- `showPin()` / `showTextPin()` 오버레이 표시
- `notifyAllFrames(true)` → `postMessage`로 갤러리 iframe에 해제 상태 전파
- 갤러리(1~5picture.html)는 `{type:'mk_unlock', value:bool}` 메시지 수신

### 갤러리 반응형
- 데스크탑: iframe 폴라로이드 레이아웃
- 모바일: `.mob-gal-item` 썸네일 → `#picExpandModal` fullscreen

### 모바일 캐러셀 스와이프 (touch-action 핵심)
- **문제**: 사진이 오른쪽으로 안 넘어가는 버그
- **원인**: `touch-action:none`은 터치가 시작되는 **해당 요소**에 지정해야 함. 부모에만 지정하면 자식 `img` 요소의 기본 `touch-action:auto`가 브라우저 스크롤 제어권을 가져가 수평 스와이프가 막힘.
- **해결**: `.pic-photo-slide`와 `.pic-photo-slide img` 모두에 `touch-action:none` 추가

### 갤러리 섹션 라벨 (Intro/Verse/Prechorus/Sabi/Hook)
- `_galSectionLabel` 함수: `{'1picture.html':'Intro', '2picture.html':'Verse', '3picture.html':'Prechorus', '4picture.html':'Sabi', '5picture.html':'Hook'}`
- 캐러셀 타이틀: "INTRO · 01/05" 형식, 하단 dot 지시자 없음
- 모바일 게시물 태그도 동일 라벨 사용

### 잠긴 폴더 정보 숨김
- `renderMemoFolders` / `renderFileFolders`에서 `f.locked && !isUnlocked` 조건 시:
  - 아이콘 → `lock`
  - 폴더명 → `· · ·`
  - 메타 → `Locked`

### Hub 버블 기본 화면
- 3페이지 구조: `hubPage0`(메모1), `hubPage1`(명언/quote), `hubPage2`(메모2)
- 기본 시작: `hubPage1`(명언)이 중앙 → 모바일/데스크탑 모두 명언이 첫 화면
- `_showPage(n)`: `hub-no-lines`는 n===1(명언)에만 적용

### 통합 메모 에디터 (Obsidian-like)
- **결정**: `#memoDrawEditor` 제거, `#memoEditor` 하나로 통합
- **구조**: 텍스트 입력 + "Drawing" 버튼으로 `#memoCanvasPanel` 접기/펼치기
- **Firestore 타입**:
  - `text`: 텍스트만 (기존)
  - `draw`: 드로잉만 (기존, 레거시)
  - `note`: 텍스트 + 드로잉 (신규) → `canvas_url`, `canvas_path` 필드 추가
- **레거시 호환**: `editMemo()`에서 타입별 분기로 기존 `draw` 타입도 정상 렌더

### GitHub / Obsidian 동기화
- **방식**: GitHub REST API (`PUT /repos/{owner}/{repo}/contents/{path}`)
- **저장 형식**: Obsidian 호환 YAML frontmatter `.md` 파일
  ```
  ---
  title: 노트 제목
  mk_id: firestoreDocId
  created: ISO8601
  updated: ISO8601
  ---
  
  본문 내용
  
  ![](canvas_url)  ← 드로잉 있을 때만
  ```
- **동기화 범위**: `text` + `note` 타입 (텍스트 없는 순수 `draw`는 제외)
- **자동 push**: `saveMemo()` 완료 후 신규/수정 모두 자동 push
- **로컬 저장**: `mk_gh_pat`, `mk_gh_repo`, `mk_gh_path` → localStorage
- **설정 가이드**: 바탕화면 `Obsidian 연동 설정 가이드.md` 참조

---

### BGM 자동재생 (브라우저 정책 gotcha)
- 소리 있는 즉시 자동재생은 **모든 최신 브라우저에서 차단**(YouTube 임베드 특히 엄격). 재시도 금지.
- 구현: 로드 시 `mute:1`로 자동재생 → 첫 `pointerdown`에서 `unMute()` (`start(true)` / `bgmUnmute()`).
- `onReady`에서 `on`이면 명시적 `playVideo()` 호출 필수 — `loadPlaylist` 암묵 자동재생에만 의존하면 첫 클릭 무반응.
- 명시적으로 끈 적(`localStorage 'mk_bgm'==='0'`) 없으면 매 방문 자동재생.

### 브리핑 선별 실패 판정 (morning-brief gotcha)
- Tool Use 응답에서 **`{"items": []}`는 실패가 아니다** — 모델이 "고를 만한 후보가 없다"고 답한 유효한 결과.
  `stop_reason=tool_use`인데 결과가 비었으면 파싱 실패가 아니라 이 경우다. 재시도해도 결과는 같다.
- 실패(`None`)와 빈 선별(`[]`)을 구분하지 않으면 폴백이 돌면서 모델이 방금 거른 후보를
  '요약 생성에 실패…'로 덮어쓴다. 사용자에게는 버그로 보임.
- 한국어로 미국 증시를 검색하면 국내 매체 영어학습 칼럼(`[1인치 영어] …`)이 후보를 채운다. 미국 건은 영어로 검색.

### hero 타이틀 글자별 :hover 금지 (mk.hub gotcha)
- `h1.hub-hero-title`은 마우스 패럴랙스(`hStep`)로 매 프레임 translate된다.
  여기에 글자별 `:hover{transform}`를 얹으면 (1) 타이틀이 커서 밑에서 미끄러져 hover 대상이 계속 바뀌고
  (2) 리프트가 히트박스까지 옮겨 hover가 붙었다 떨어졌다 한다 → 글자가 끝없이 튄다.
  움직이는 요소의 자식에는 hover 트랜스폼을 넣지 않는다.

## 의사결정 로그

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-04-10 | memory.md 초기 생성 | 프로젝트 컨텍스트 보존 |
| 2026-04-28 | 모바일 캐러셀 스와이프 수정 | touch-action을 img 요소에도 직접 지정 필요 |
| 2026-04-28 | 갤러리 라벨 Intro/Verse/Prechorus/Sabi/Hook 적용 | 데스크탑 버전과 통일 |
| 2026-04-28 | Hub 기본 화면을 명언(hubPage1)으로 변경 | 모바일/데스크탑 모두 동일 첫 화면 |
| 2026-04-28 | 잠긴 폴더 이름/아이콘 숨김 | 개인정보 보호 |
| 2026-04-28 | 통합 메모 에디터 (Obsidian-like) | 텍스트+드로잉 하나의 노트로 관리 |
| 2026-04-28 | GitHub API로 Obsidian 동기화 | 정적 앱에서 가능한 현실적 방식 |
| 2026-07-14 | 저장소명 pitch-trainer → mk.hub | 프로젝트 실제 이름 반영 (CNAME 커스텀 도메인이라 배포 주소 무영향) |
| 2026-07-15 | BGM은 음소거 자동재생 → 첫 제스처 unMute | 브라우저 정책상 소리 있는 즉시 자동재생 불가. 소리 자동재생 재시도 금지 |
| 2026-07-15 | 메모/볼트 통합 UI 보류 | 1차 안(Obsidian 사이드바) 만들었으나 사용자가 되돌림 요청. 방향만 확정, 나중에 재작업 |
| 2026-08-04 | 브리핑 수신을 매일 → 월·목 주2회 | 매일 받으니 읽기 피로. 조회 구간은 `_lookback_days()`로 자동 확장해 빠지는 기사 없음 |
| 2026-08-04 | 브리핑 아카이브 드릴다운 폐기 → 최신순 평면 목록 | 연도→월→주차→요일 4클릭이라 최신 기사가 뭔지 안 보임. 1클릭 + 상단 '최신부터 읽기' CTA |
| 2026-08-04 | '읽음 처리' 버튼 폐기 → 열면 자동 읽음 | 읽고도 버튼을 안 눌러 안읽음이 쌓임 |
