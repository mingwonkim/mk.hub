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

## 개인 파일 보안 전환 완료
- 사용자 암호 등록 완료 응답·서버 version=1 확인 후 Storage/Firestore 소유자 규칙 적용. Brief 후속 제한은 다른 작업의 최신 규칙 유지.
- 기존 개인 파일 33개 공유 토큰 폐기, 옛 URL 전부 차단·generation/MD5/size 유지. 신규 업로드 이벤트 자동 제거도 별도 임시 파일로 검증하고 삭제.
- 전용 이벤트 계정에 bucketViewer(해당 버킷), eventReceiver(프로젝트), run.invoker(해당 서비스) 추가. IAM 전파 후 실동작 확인. 비인증/익명 DB·파일 403 확인.
- 소유자 브라우저 그림/파일 열기 수동 확인은 응답 대기. SMTP/GitHub 토큰 요구 없음.

## 패턴 잠금 전환 (2026-10-06)
- 사용자 요청: 매번 이메일 인증 제거, 이메일은 비밀번호 찾기에만. 1·2·3차 텍스트 암호 → 3x3 패턴.
- 결과: 패턴이 단일 인증 요소. 무차별 대입 방어는 서버 전역 잠금(5회 실패마다 15분×2^n, 최대 24h). 잠금은 이메일 복구(set-pin)로 해제 가능 → 공격자의 잠금 DoS도 소유자가 우회 가능.
- access 문서 `kind:'pattern'` 없으면 미설정 취급 → 기존 텍스트 암호 자동 폐기, 최초 1회 이메일로 패턴 등록.
- 배포 순서: 서버 함수 먼저, 클라이언트(Pages) 나중. 반대면 pin-state 401.

## 2026-10-15 첫 화면 "이사": looin labs 인트로 → 비행선 도시 → 서재 (scene/)
- 사용자 결정: 민권.com 첫 화면 = looinlabs 오프닝 장면(구름 위 도시). 다크 모드 looin labs 로고 인트로 → 로고가 비행선 현수막에 박힘(현수막 → looinlabs.com 회사 사이트, 회사 사이트는 수정 안 함).
- 공개 사이트지만 저장소는 "비행선에 숨김": 비행선 → MKVault 잠금(기존) → 서재. 서버 암호 따로 안 둠(데이터는 이미 Firebase·Vault가 지킴).
- 그림 속 물건 = 칸: 신디사이저=음악, 아치 조각 전광판=Vault 폴더 Art, AI 칩 전광판=Vault 폴더 IT, 모닝 브리프 드론(드론이 곧 우체통, 편지 건네고 계속 떠 있음)=브리핑. 서재: 포스트잇=할 일, 코르크판=메모, 서랍장=파일, 발코니=설정, 책상의 사람=기존 MK.HUB 홈.
- 기존 비둘기 입장 화면은 끔(새 인트로가 대신). 1~5 사진 갤러리는 홈에서 제거(사용자 "없애도 돼"), 1~5picture.html 파일은 남김.
- 구조: index.html(SPA)은 그대로, scene/scene.js가 레이어(도시·서재)를 얹고 해시 라우터(#study #hub #memo #vault/Art …)로 기존 openApp 호출. vault-client.js보다 먼저 실행(이메일 로그인 ?oobCode 감지). astra 리뷰: 단일 index.html 유지 찬성, 이메일 복귀·인증 타이밍·모바일 텍스트 메뉴·숨김 시 루프 정지 반영.
- 함정: 모바일 전역 `*{max-width:100%!important}` 때문에 21:9 무대가 화면 폭으로 줄어듦 → `.mk-layer *{max-width:none!important}`.
- 2026-10-15 후속(사용자 요청): 현수막 → 비행선과 한 몸인 흰 패러글라이딩 캐노피(배경에 그림) + 아래 면에 looin 마크 인쇄(LABS 줄 생략, 면이 얇음), 인트로 로고는 그 자리로 날아감. 배달 드론은 새 디자인·편지 없음·글자 없이 이따금 부르르(알림 느낌). 물건 hover 이름표·둘러보기 메뉴 없음(숨겨둔 저장소 느낌). 하늘 교통 13대 추가.
- 서재 입구 암호: 임시 4자리 5940(클라이언트 해시, 숨은 입구일 뿐 — 데이터는 MKVault가 지킴). 나중에 Face ID 패스키로 교체(todo).
- 저장고 인증 창·암호 키패드: 남색 유리 + 시안 HUD 스타일.
- 함정: MK.HUB에 이미 #mkIntro 스타일이 있어 장면 ID는 ls* 로. 세로·정사각 화면(≤4:3)은 무대를 화면 높이에 맞추고 좌우 스와이프. astra 리뷰 3회 후 MERGE: YES → main 병합(e5415d0).

## 2026-10-15 옛 MK.HUB 화면 폐기 → 새 UI "방"으로 내용물 이사 (scene/rooms.js)
- 사용자: "예전 mk.hub 사이트는 버리는 거야", "우리가 만든 새로운 UI의 화면으로 내용물을 다 이사시켜". 저장고 인증을 그냥 닫으면 옛 홈이 보이던 문제가 계기.
- 구조: index.html의 옛 SPA는 화면에 안 나옴(항상 도시/서재/방 레이어가 덮고 inert). Firebase 초기화·저장고 인증 배관으로만 씀. setPage는 no-op.
- 모든 칸(메모·파일·할 일·브리핑·설정·음악·예술·IT)은 rooms.js 한 틀(해치 톤: 흐린 도시 위 어두운 유리, 다이얼 링)로, 같은 Firestore 컬렉션을 그대로 읽고 씀. 로딩·오류·빈 상태 구분.
- 예술·IT 저장고는 새 컬렉션 mk_app/data/room_art|room_it(규칙상 저장고 주인만) → 처음부터 빔, 옛 메모 폴더(이름 'IT' 등)와 섞이지 않음. astra 지적 반영(이름으로 폴더 찾던 방식은 옛 내용 섞임).
- 저장고 인증 창·서재 암호도 카드 레이아웃 버리고 전체 화면 해치로 새로. 서재 암호 통과는 localStorage(기기당 한 번). 옛 전용 커서(hub-cursor) 삭제 → 기본 손가락 커서.
- 후속(같은 날, "빠진 기능도 새 틀로 다 옮겨줘"): 메모 그림판·첨부·폴더 옮기기/만들기/이름/지우기·GitHub 백업, 파일 지우기·폴더, 좋아하는 곡(YouTube 링크→내장 재생)·플레이리스트 곡 넣기/빼기, 설정(패턴 찾기·모든 기기 로그아웃·GitHub 보내기/가져오기)까지 rooms.js로 이사.
- 일부러 안 옮긴 것: 테마 전환·홈 카드 이름·모듈 순서·배경 사진(옛 홈 배치 전용), YouTube API 키(곡은 링크로).
- 절대음감·코드 사전: 기능은 그대로 두고 공용 스킨 hub-tools.css를 새로 씀(남색 유리·시안 밑줄 탭·흰 알약·재생 버튼에 도는 눈금 다이얼, Mobbin의 Once·Insight Timer·Opal 참고). 음악 방 '연습 도구' 탭에서 ?embed iframe으로 방 안에 띄움(배경 투명, 겹치는 제목 숨김).
- Storage 정리 원칙(astra 리뷰 3회): 문서 먼저 지우고 원본은 뒤에, 정리 실패는 localStorage mk_orphans에 쌓아 다음 방 열 때 재시도, 저장 안 한 업로드는 떠날 때 지움(저장 중 떠나면 끝난 뒤 실패일 때만).
- 함정: 셸에서 node -e로 '\b'를 넣다가 정규식에 실제 백스페이스(0x08) 문자가 들어가 ?embed 감지가 안 됐음 → 파일 수정은 python/heredoc 스크립트로.

## 2026-10-15 Face ID(패스키) 로그인 + YouTube 다시
- 사용자: "유튜브 탭 화면에서 그대로 재생", "유튜브 api키 다시 넣어줘", "face id 로그인 넣어줘"(전에 "맨 마지막에 넣을게"라 했던 것).
- YouTube: 음악 방 첫 탭. 키는 옛 자리 mk_app/settings.yt_api_key(설정 방에서 넣음). 검색 결과를 누르면 같은 화면 위 플레이어에서 재생(다시 그리지 않아 끊기지 않음), ♥ 담기로 좋아하는 곡에. 곡을 링크 없이 넣으면 키로 첫 결과를 찾아 줌.
- Face ID = WebAuthn 패스키. 서버 functions/passkey.js(SimpleWebAuthn 13), RP ID xn--zf0bu7y.com. 저장 mk_security/webauthn/{passkeys,challenges}(클라이언트 접근 불가). 로그인 성공 = 패턴 통과와 같은 저장고 토큰. 등록·삭제는 최근 5분 안에 패턴/Face ID로 연 경우만. 챌린지 일회용·5분, 옵션/검증 IP별 빈도 제한 따로.
- 화면: 설정 방 "Face ID 등록 (이 기기)"·"Face ID 지우기", 저장고 패턴 화면과 서재 암호 화면에 "Face ID로 열기"(등록된 게 있을 때만). 패턴·5940·이메일 복구는 예비로 남김.
- 사파리는 누른 직후에만 Face ID 창을 띄우므로 옵션을 미리 받아 둠(4분 캐시, 챌린지 5분).
- astra 리뷰: counter 경합(트랜잭션 재확인), 삭제 재인증, 챌린지 롤백(판정은 트랜잭션 밖), 옵션/검증 제한 분리, 등록 후 로그인 옵션 캐시 초기화 → DEPLOY: YES(4차).
- 배포: firebase deploy --only functions:vault:vault --project mingwon-hub. 비대화형이면 파라미터 값이 필요 → functions/.env.mingwon-hub(기본값, .gitignore 대상)로 해결. 서버 먼저, 사이트(Pages) 나중.

## 2026-10-15 복구 코드·두 번째 기기 + 음악 방 정리
- 사용자: "복구 코드랑 두 번째 기기 등록도 넣어줘", "음악방 첫 탭이 유튜브면 안 돼. 좋아하는 곡, 곡 분석 탭에서 클릭해야 유튜브가 열리게".
- 음악 방 탭: 좋아하는 곡 · 곡 분석(옛 music_notes에 가수·videoId 추가) · 플레이리스트 · 연습 도구. 곡을 누르면 그 화면에서 YouTube 재생 + 이유/분석. 넣기 화면 안에 'YouTube에서 찾기'(결과 누르면 링크·제목·가수 채움). 단독 YouTube 탭은 뺌.
- functions/codes.js: 복구 코드 8개(10자, 일회용, 한 번만 보여 줌), 기기 추가 코드(8자, 10분, 일회용). HMAC(pepper)로만 저장, 만든 때 저장고 version에 묶음 → 모든 기기 로그아웃·패턴 변경 뒤 무효. 만들기는 최근 5분 인증만. 입력은 저장고 창 '복구 코드 · 기기 추가 코드로 열기' → 열리면 바로 '이 기기에 Face ID 등록' 권함.
- astra: 전역 입력 제한은 남이 소진해 주인을 막는 DoS라 제거(IP별만, 코드 40~50비트), 토큰을 먼저 만들고 코드 소비 → DEPLOY: YES(2차).

## 2026-10-15 모바일: 인트로 안 뜨고 옛 배경음악이 재생되던 문제
- 원인: head의 Tailwind CDN(옛 화면 전용)이 파싱을 막고, scene.js가 defer라 4천 줄 옛 스크립트 뒤에 실행 → 모바일에선 인트로가 늦음. 게다가 인트로를 탭 세션당 한 번만 보여 줘서 예전 탭에선 건너뜀. 옛 BGM 스크립트(류이치 사카모토 플레이리스트)는 로드 즉시 음소거 자동재생 + 첫 터치에 소리 켜기.
- 해결: Tailwind CDN 제거, scene.js를 <body> 맨 앞에서 바로 실행(로컬 기준 인트로 0.6초에 뜸), 인트로는 해시 없는 첫 진입마다. BGM은 window.mkBgm(play/pause/toggle) — 서재와 서재에서 연 방에서만 재생, 도시로 나가면 멈춤. 서재 오른쪽 위 음표 버튼으로 켜기/끄기(설정 기억). 자동재생 정책상 서재에서 첫 터치에 소리가 켜짐.
- 함정: python으로 CRLF 파일을 고칠 땐 open(..., newline='')로 읽어야 함(텍스트 모드가 
을 
으로 바꿔 index.html 전체가 바뀐 diff가 됨).

## 2026-10-15 서재 책상: 잡생각(ADHD)·할 일 달력, 설정 버튼, 서재 음악 바로 재생
- 사용자: 포스트잇 = 생각날 때마다 적는 잡생각(ADHD에게 효과적으로, astra 활용), 메모판·세로 판 = 달력형 할 일, 서랍 = 저장소 그대로, 설정이 안 보였음 → 서재 우측 상단, 서재 들어가면 터치 없이 소리.
- astra ADHD 설계(scratchpad lab/astra_adhd_out.md)대로 scene/desk.js: 잡생각(본문 한 칸, 저장 뒤 키보드 유지, 초안 기기 보관, 최신 5개 3줄, 할 일로/간직/놓아주기+되돌리기, 하루 한 번 선택형 '3개만 살펴보기', 7일 지난 생각 하루 1개) · 할 일(7일 줄 '남음 n' + 펼치는 월간, 먼저 할 1개, 지난 일은 '다시 정할 일'로 접기, 날짜 없는 일, 해낸 일 기록=completedAt). 빨간 배지·연속 기록·'밀렸어요' 없음.
- 데이터: mk_app/data/thoughts(새), todos에 completedAt·first·let 추가, 생각→할 일은 ID 'th_'+생각ID(중복 방지). Mobbin 참고: Structured(주간 줄), Oura(월간 점), Perplexity(아래 입력창).
- 서재: 포스트잇 → #thoughts, 코르크판·세로 판 → #todo, 우측 상단 '설정' 알약 버튼 + 음표 버튼. 메모 보관함은 잡생각 방 아래 링크.
- 음악: 비행선을 누를 때 플레이어 미리 준비(mkBgm.warm), 서재 들어가면 소리 켠 채 재생(실제 탭 뒤라 허용). 브라우저가 막으면 onAutoplayBlocked → 음소거 재생 후 첫 터치에 소리.
- astra 코드 리뷰 5차 MERGE: YES(재진입·입력 유실·중복·되돌리기·별표 경합·초점).

## 2026-10-16 새 서재(유리 지붕 도서관) · 벽 달력·명언 액자
- 이미지: 레퍼런스(카도카와 책장·북 마운틴·타마미대) → GPT Image 2.5 시안 반복 → 사용자 선택 L1 → 4K, 책장 AI끼 줄이고 색 절반 복원(study_final3). 사용자: 회색은 "콘크리트 재료로 섞기"지 사진을 회색으로가 아님, 색감 죽이면 안 됨.
- 달력·액자 글자는 HTML로 덮으면 합성티 → 글자 지운 원판(study3) + astra가 딴 종이 네 모서리에 matrix3d 원근 + mix-blend-mode: multiply로 '인쇄'. 좌표는 그림 px(3840×1648) 그대로, 층을 무대 폭/3840로 scale.
- 달력 = 이번 달 + 할 일 있는 날 빨간 동그라미(todos는 비공개라 저장고 열렸을 때만), 누르면 #todo. 액자 = 날짜별 짧은 명언(quotes.html, 34자 이하), 누르면 #quotes 방. 턴테이블 = 음악 토글.
