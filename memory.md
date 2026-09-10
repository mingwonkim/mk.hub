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

## 2026-09-10 — 우드 아카이브·스크롤 인트로
- 사용자 색상 정정: 기존 검정/#FF3B00 유지; 갤러리는 월넛·종이·앰버 수액으로 메인 가지 효과와 연결.
- 인트로는 자동 재생 대신 입력 기반 CSS animation currentTime 제어; 신문 배달 → MK.HUB 타이틀 → 우체통 중심 메인 공개, native dialog 최상위 레이어 사용.
- 갤러리 109개 기존 IndexedDB 키·59개 문구 보존. 1/2번 기존 텍스트 스키마 유지, 3~5번 문구 저장 추가. 삭제 표시로 legacy fallback 재등장 방지.
- 모바일도 동일 iframe 사용; 확대 dialog는 부모에 배치해 iframe 높이와 무관한 전체화면 확보.
- iframe 투명 배경은 자식 html의 color-scheme:normal 필요; dark 기본 캔버스가 부모 월넛을 가리는 문제 해결.
- 시안 검토 기록: docs/design-review-2026-09-10.md. 운영 DB 대신 격리 fixture로 검증, 디자인 브랜치에서 사용자 검토 후 배포.

- 초록 잎 그림자: 진입 8초 후, 이후 35초 주기/12초 표시. pointer-events:none·최대 opacity .14, 메인 활성/탭 표시 상태에서만 실행.

## 2026-09-10 후속 시안·보안 전환 (운영 미반영)
- 명언 좌우 메모: 기존 hub_memo/hub_memo2 문서 유지, 읽기 완료 후 편집 허용.
- 내부 앱: hub-tools.css와 화살표 커서 공유; pitchquest2/cd_us/mk_code_editor/mk_code_saves 유지.
- 그림 저장: 접기와 삭제 분리, 로드 완료 대기, 고유 파일 업로드 후 문서 성공 시 이전 자산 정리; 첨부 업로드 중 저장/이동 차단.
- 암호: IME·보기·중복 제출 수정. 서버 OTP+scrypt 인증이 실제 접근 권한이며 기존 브라우저 PIN은 보안 경계로 사용하지 않음.
- 복구 수신자 고정: kmin5940@naver.com. 설정 UI에 이메일·GitHub 토큰/레포/경로 입력 없음.
- GitHub: 브라우저 잔여 토큰 제거, 서버 Secret Manager 연결로 교체. 위의 과거 localStorage PAT 방식은 새 시안에서 폐기.
- 운영 규칙이 익명 계정에도 열려 있음 확인. 새 규칙·파일 토큰 폐기는 SMTP 설정과 소유자 실제 로그인 검증 후 전환.
- 자세한 배포 순서/제약: docs/private-vault-rollout.md. 브랜치 design/woodland-interactive, main 시안 검토 대기.

- 파일 다운로드 버튼도 getBlob 경유. 파일 삭제 문서 실패 시 원본 보존, 업로드 시작 시 대상 폴더 고정.

## 운영 전환 승인 후 진행
- 사용자 운영 전환 진행 승인. 다시 시안 승인 요청하지 않음.
- OTP Pepper 버전 1, 필수 Cloud API, 전용 런타임 SA, Storage CORS 적용 완료.
- DB 141문서와 파일 36개 전량 로컬 비공개 백업 완료. 위치와 권한은 전환 문서 참조.
- SMTP/GitHub 서버 토큰 미등록. 바탕화면 숨김 입력 .command 준비, 사용자 입력 대기. 실제 로그인 전 rules/token 변경과 main 전환 보류.

## 사용자 최종 선택: 이메일 링크
- 네이버 2단계 인증을 원치 않아 Firebase 발송 이메일 링크로 변경. SMTP/nodemailer 제거, 네이버 비밀값 불필요.
- GitHub 토큰은 추가 백업 전용 선택 기능. 기본값 VAULT_GITHUB_ENABLED=false, 인증 서버 배포/사이트 저장에 토큰 요구하지 않음.
- Firebase 이메일 링크 로그인과 실제 도메인 허용 완료. vault 서버 배포 완료, 운영 비인증 요청 401 확인.
- 링크는 서버 Firebase API에서 일회용 소비 후 owner email 확인, 서버 암호 등록/검증과 세션 버전 보호 유지.
- 기존 바탕화면 필수 비밀값 등록 도구 삭제. 사용자에게 다시 SMTP/GitHub 등록을 요구하지 않음.

- 운영 main 4dbde05 반영: 기존 Brief 자동 읽음·최신순/모바일 개선·컬러 저니 제거를 보존해 병합. 소유자 실제 인증 후 규칙/토큰 전환은 별도 남음.
- 실제 민권.com 링크 진입 화면 검증 후 고정 수신자 발송 API 200 확인. 사용자 메일 수신·서버 암호 등록 응답 대기; 아직 운영 rules와 기존 다운로드 토큰은 미전환.

## Brief 보안 운영 반영
- 다른 작업에서 Firebase 이메일 링크·소유자 등록·owner() 운영 규칙까지 완료된 상태를 API로 확인. SMTP/GitHub 필수 등록 및 소유자 미등록 기록은 과거 상태.
- Brief 클라이언트 본문·URL·생성 제한을 최신 main에 이식; 소유자 read boolean 변경·삭제와 다른 앱 쓰기 유지.
- 신규 4건·기존 규칙 5건 통과 후 firestore:rules만 운영 배포, API 원문 일치 검증 완료.
- 운영 파일 메타데이터에서는 개인 파일 33개의 다운로드 토큰 잔존 확인. 외부 링크 폐기는 별도 작업이며 이번 Brief 규칙 배포에 포함하지 않음.
- 전환 문서의 SMTP 요구를 Firebase 링크 기준으로 정정. 추가 네이버 비밀번호·GitHub 토큰 요구 없음.
