# MK.HUB — 사이트 전체 디자인·인터랙션 고도화 브리프 (Manus 용)

> 이 문서를 Manus에 그대로 붙여넣으세요.
> §6~§9 가 실제 요청이고, §1~§5 는 헛발질을 막기 위한 필수 컨텍스트입니다.
> 작성 기준일: 2026-08-12

---

## 0. 한 줄 요약

개인용 정적 웹 앱 **MK.HUB** (배포: GitHub Pages → 민권.com) 를
**사이트 전체에 걸쳐 더 고급스럽고, 인터랙션이 살아있고, 하나의 디자인 언어로 묶이게** 만든다.
허브·내부 페이지 6개·갤러리 5개·서브앱 4개가 지금은 완성도가 제각각이다.

---

## 1. 프로젝트 구조 (빌드 도구 없음)

HTML 파일을 직접 수정하면 바로 반영되는 순수 정적 사이트입니다.
번들러·프레임워크·npm 없음. **React/Vue/Next/Svelte 제안 금지.**

```
index.html            ← 메인 SPA. 386KB 단일 파일. 모든 페이지·CSS·JS가 이 안에 있음
                        (CSS는 상단 <style> 한 블록에 집중, 52~1299행)

── 갤러리 (허브에 iframe으로 삽입) ──
1picture.html   갤러리 01 EDITORIAL
2picture.html   갤러리 02 LOWTHEORY
3picture.html   갤러리 03 MOODBOARD
4picture.html   갤러리 04 ARCHIVE
5picture.html   갤러리 05 GRID

── 서브앱 ──
pitch-trainer.html      절대음감 트레이너 (music 페이지에서 전체화면 iframe)
chord-dictionary.html   코드 사전       (music 페이지에서 전체화면 iframe)
quotes.html             명언 97개 목록  (독립)
code-editor.html        코드 수정 도구  (독립)

── 공용 ──
pic-store.js   사진 저장 모듈 (IndexedDB 래퍼, 전역 `MKPics`)
firebase/      Firebase SDK 로컬 복사본 (CDN 폴백용)
```

### SPA 라우팅
모든 페이지가 `<div class="page" id="page-X">` 형태로 DOM에 **공존**하고,
`setPage(p)` 가 `.active` 클래스를 토글합니다. **URL은 변하지 않습니다.**
`navHistory` 배열이 뒤로가기 스택을 관리합니다.

페이지 ID: `hub` · `memo` · `files` · `briefing` · `music` · `settings` · `todo`

### 전체화면 오버레이 (page와 별개, body 직속)
- `#musicAppView` — 서브앱 iframe 전체화면 (pitch-trainer / chord-dictionary)
- `#picExpandModal` — 모바일 갤러리 확대 뷰
- `#pinOverlay` — PIN 잠금 화면
- `#pwChangeOverlay` — 3단계 비밀번호 변경
- `#mkPalette` — ⌘K 커맨드 팔레트
- `#mkVeil` — 페이지 전환 베일

---

## 2. 절대 깨뜨리면 안 되는 계약 (중요)

### 2-1. Firebase 비동기 로드
```js
Promise.all([import(...)])  // 로컬 파일 우선 → CDN 폴백
```
`db`, `stg`, `auth` 변수는 로드 완료 전까지 **`null`** 입니다.
모든 DB 접근 함수는 `async/await` 필수. 동기 접근 코드를 넣지 마세요.
Firestore 경로: `mk_app/data/{collection}` (memos, files, folders, todos …)

### 2-2. PIN 잠금 시스템
- `isUnlocked` 변수 + `sessionStorage('mk_unlocked')` 로 상태 관리
- `showPin(title, callback)` — 숫자 PIN / `showTextPin(callback)` — 텍스트 PIN
- 해제 후 `notifyAllFrames(true)` 가 postMessage로 갤러리 iframe들에 전파

**민감 데이터(메모·파일·할일)는 Firestore에만 저장.**
localStorage에는 비민감 설정만 (카드 순서, 폴더 순서, 마스터 라벨, PIN 해시).

### 2-3. iframe 높이 통신 (갤러리)
각 picture 파일이 자기 높이를 부모에 보내고 부모가 iframe 높이를 조정합니다.
깨지면 갤러리가 잘리거나 빈 공간이 생깁니다.

```js
window.parent.postMessage({type:'iframe_height', id:'<프레임ID>', value:h}, location.origin);
```

| 파일 | 프레임 ID | 부모 측 함수 |
|---|---|---|
| 1picture.html | `edLayoutFrame` | `notifyEdFrame` |
| 2picture.html | `ltScaleFrame` | `notifyLtFrame` |
| 3picture.html | `mbFrame` | `notifyMbFrame` |
| 4picture.html | `p4Frame` | `notifyP4Frame` |
| 5picture.html | `p5Frame` | `notifyP5Frame` |

높이 측정 대상(예: 1picture는 `#editorialLayout`)과 `ResizeObserver` 배선 유지.

### 2-4. 잠금 해제 전파 (부모 → iframe)
```js
window.addEventListener('message', e => {
  if (e.origin !== window.location.origin) return;   // ← 절대 제거 금지 (보안 경계)
  if (e.data && e.data.type === 'mk_unlock') { /* e.data.value === true 면 편집 허용 */ }
});
```
잠금 상태가 기본값: `contenteditable="false"`, 이미지 슬롯 `onclick` 해제.

### 2-5. 사진 저장 키 (`MKPics`)
사진은 localStorage가 아니라 **IndexedDB**. 키를 바꾸면 기존 사진이 전부 사라집니다.

| 파일 | 키 패턴 |
|---|---|
| 1picture | `p1:s1` ~ `p1:s5` |
| 2picture | `p2:center-photo`, `p2:photo-1` ~ `p2:photo-5` |
| 3picture | `p3:img-1` ~ `p3:img-5` |
| 4picture | `p4:img-0` ~ `p4:img-3` |
| 5picture | `p5CellKey(cell)` 로 생성되는 셀 키 |

API: `MKPics.set(key, dataURL)` · `MKPics.get(key)` · `MKPics.getMany([keys])` ·
`MKPics.fileToDataURL(file)`

### 2-6. index.html 내부 하드코딩 참조
index.html 4520~4720행 부근에 **갤러리별 슬롯 키 목록**과
**DOM 셀렉터 기반 이미지 추출기**가 하드코딩되어 있습니다.
라이트박스와 모바일 인스타 피드가 이걸 씁니다.
picture 파일의 슬롯 구조·클래스명을 바꾸면 이 코드도 같이 고쳐야 합니다.
→ 구조 변경은 최소화하고, 바꿨다면 **어디를 같이 고쳐야 하는지 명시**해 주세요.

### 2-7. 콘텐츠 보호
모든 파일 상단에 우클릭/드래그/복사/F12 차단 스크립트가 있습니다. 유지하세요.
전역으로 `user-select:none`, `img { pointer-events:none }` 이 걸려 있고
input/textarea/contenteditable 만 예외입니다.

### 2-8. CSP (Content-Security-Policy)
index.html에 엄격한 CSP 메타 태그가 있습니다.
**외부 CDN에서 JS 라이브러리를 새로 불러오는 것은 차단됩니다.**

허용된 외부 출처:
- `cdn.tailwindcss.com` (script)
- `fonts.googleapis.com` / `fonts.gstatic.com` (style, font)
- `cdn.jsdelivr.net` (style, font — Pretendard)
- `www.youtube.com` / `www.youtube-nocookie.com` (BGM 임베드)
- Firebase / Google API 도메인 (connect, img)

→ **모션은 순수 CSS + 바닐라 JS로만.** GSAP, Lenis, Three.js, Framer Motion 전부 불가.

### 2-9. 알려진 함정
- **갤러리 iframe 및 그 조상에 `will-change: transform` 금지.**
  `position:fixed` 자식의 containing block이 오염되어 오버레이가 깨집니다.
  (상·하단 nav에는 이미 걸려 있고 정상 동작 중 — 거긴 건드리지 마세요)
- **2picture.html** body에 `transform:scale(0.9); width:111.11%` 가 걸려 있음(축소 배치).
  transform을 건드리면 레이아웃이 무너집니다.
- **5picture.html** 은 iframe이 직접 스크롤합니다 (iOS 네이티브 관성 스크롤 유지 목적).
  1~4picture와 스크롤 처리 방식이 다릅니다.
- `--nav-h` CSS 변수는 JS로 실측 (`nav.offsetHeight`). 폴백 `var(--nav-h, 64px)`.
- **pitch-trainer / chord-dictionary** 는 `body{height:100dvh;overflow:hidden}` +
  `.app{height:100%}` + `.sc{flex:1;overflow-y:auto}` 구조. 이 3층 구조를 깨면 스크롤이 죽습니다.

---

## 3. 현재 디자인 언어 (허브 = 기준점)

### 색상 토큰 (index.html `:root`)
```css
--mk-bg:        #131313;   /* 배경 */
--mk-surface:   #1c1b1b;   /* 카드 표면 */
--mk-border:    #252525;
--mk-border-hi: #353535;
--mk-surface-lo:#0e0e12;
--mk-on-surf:   #e5e2e1;   /* 본문 */
--mk-outline:   #a08d88;   /* 보조 텍스트 */
--mk-outline-var:#524340;
```

**라이트 모드 존재** — `html.light` 클래스로 토글:
```css
--mk-bg:#f5f2f0; --mk-surface:#ffffff; --mk-border:#e2d8d4;
--mk-on-surf:#1c1110; --mk-outline:#574741;
```

액센트 2종:
- **살몬 `#ffb4a2`** — 주 액센트 (링크·아이콘·보더 하이라이트·버튼)
- **레드 `#FF3B00`** — 강조 (배지·프로그레스 끝단·hover 전환색)

### 모션 토큰
```css
--mk-ease:     cubic-bezier(.22,.61,.36,1);   /* 기본 */
--mk-ease-pop: cubic-bezier(.34,1.56,.64,1);  /* 팝/오버슛 */
--mk-dur-1: .3s;   --mk-dur-2: .6s;   --mk-dur-3: 1.2s;
```

### 타이포
| 용도 | 폰트 |
|---|---|
| 헤드라인 / 라벨 / 숫자 | **Space Grotesk** (uppercase, tracking-tighter 또는 `.12~.28em`) |
| 영문 본문 | **Inter** |
| 한글 본문 | **Pretendard Variable** |
| 아이콘 | Material Symbols Outlined |

섹션 번호는 `01` `02` 형식 · 10px · `letter-spacing:.25em` · uppercase.
내부 페이지 헤더는 `.app-hero[data-num]` 이 거대한 아웃라인 숫자를 배경에 깝니다.

### 브랜드 문자열
상단 nav 좌측 워드마크는 `MONOLITH_OS`, 허브 히어로 타이틀은 `MK.HUB`.

---

## 4. 이미 구현되어 있는 것 — **중복 제안 금지**

허브 페이지(index.html)는 v2~v13차에 걸쳐 모션이 누적된 상태입니다.
**아래를 "새 아이디어"로 다시 제안하지 마세요.** 이미 다 있습니다.

**전역 레이어**
- 커스텀 커서 (링 `#mkCursor` + 도트 `#mkCursorDot`, hover 시 확대 `.mk-cur-hot`)
- 클릭 리플 `.mk-ripple`
- 마우스 추종 글로우 `#mkGlow` (`mix-blend-mode: screen`)
- 오로라 배경 `#mkAurora` (드리프팅 블롭 2개 + SVG 노이즈 그레인)
- 더스트 파티클 캔버스 `#mkDust`
- '기억의 이끼' 생성형 캔버스 `#mkMoss`
- 시간대별 색온도 (`.mk-tone-warm` / `.mk-tone-deep` 으로 aurora hue 조정)
- 스크롤 프로그레스 바 `#mkScrollBar`
- 백투탑 `#mkTop`
- nav 스크롤 자동 숨김 (`.mk-nav-hide`)
- ⌘K 커맨드 팔레트 `#mkPalette`
- 인트로 시퀀스 `#mkIntro` (세션당 1회, 글자 트래킹 인 + 룰 드로우)

**페이지 전환**
- 2단 전환: `.mk-page-out` (.22s) → `.page.active` (.28s)
- 루전식 베일 스윕 `#mkVeil` (`cubic-bezier(.76,0,.24,1)`, 라운드 코너 모프)

**스크롤 / 등장**
- 스크롤 리빌 `.mk-reveal` → `.mk-in` (IntersectionObserver, `--rd` 딜레이)
- 페이지 진입 스태거 `.mk-stg` (`--i` 인덱스 기반)
- 리스트 항목 스태거 (`#memoList`, `#fileList`, 폴더 그리드 — nth-child 딜레이)
- 타이틀 글자별 등장 `.mk-title-in .mk-ch` (`--i` × 55ms)
- 페이지 타이틀 밑줄 드로우 `.app-page-title::after`
- 페이지 라벨 트래킹 인 `.app-page-label`
- 갤러리 구분선 스크롤 채움 `.gal-sep-rule::after` (`--fill`)

**카드 인터랙션**
- 커서 스포트라이트 (`--mx` / `--my` 라디얼 그라데이션) — 허브 카드 / 폴더 / 뮤직 모듈
- 글로우 보더 (mask-composite 링) — 같은 3종
- 3D 틸트 (`--rx` / `--ry`, `perspective(900px)`) — 데스크탑 hover 전용
- 아이콘 팝 (`scale(1.18) rotate(-8deg)`)
- 카드 넘버 트래킹 확장 (hover 시 `letter-spacing:.45em` + 레드)
- 내부 리스트 도미노 슬라이드 (nth-child 딜레이 `translateX(7px)`)
- 프레스 피드백 (`:active` 시 `scale(.98)`)

**기타**
- Weekly To-Do 셀 호버 팝
- Music 카드 이퀄라이저 바 (`--h` / `--d` 로 개별 높이·딜레이)
- BGM 토글 펄스 + 볼륨 슬라이더 펼침
- 대형 반투명 시계 `#mkBigClock` (스크롤 연동 그라데이션 스윕 `--ckP`)
- Vault 드롭존 아이콘 부유 + 드래그오버 펄스
- 메모 카드 hover 살몬 액센트 바 + `counter()` 번호
- `prefers-reduced-motion` 통합 가드 (1281~1298행)

---

## 5. 현황 진단 — 실제 격차가 있는 곳

### 5-1. 갤러리 5개 (가장 큰 격차)

각각 다른 시기에 만들어져 **자기만의 팔레트·폰트를 씁니다.**
허브에서 아래로 스크롤하면 5개가 따로 노는 인상.

| # | 파일 | 컨셉 | 배경 | 폰트 | 액센트 |
|---|---|---|---|---|---|
| 01 | 1picture.html | 3컬럼 에디토리얼 + 폴라로이드 | `#4A0E0E` 딥 마룬 | Playfair Display + Instrument Sans | `#E83A30` |
| 02 | 2picture.html | 종이/테이프 콜라주 | `#e5e1d3` 크림 (밝음) | Epilogue + Work Sans + Inter | `#930009` |
| 03 | 3picture.html | 무드보드 (테이프 부착 종이) | `#120c0c` 근사 블랙 | Space Grotesk + Inter + Caveat | 없음 |
| 04 | 4picture.html | 아카이브 도큐먼트 (스탬프) | 밝은 톤 | Epilogue + Space Grotesk + La Belle Aurore | `#b91d20` |
| 05 | 5picture.html | 랩 아카이브 그리드 | 투명/어두움 | Epilogue + Space Grotesk + Courier Prime | — |

문제:
1. **레드 계열이 5종류** (`#E83A30` `#930009` `#b91d20` + 허브 `#FF3B00`/`#ffb4a2`)
   — 미묘하게 다 달라서 정돈되지 않은 인상
2. **모션 토큰 미공유** — 갤러리는 `0.3s ease` `0.25s ease` `150ms` 제각각
3. **인터랙션 부재** — hover가 `transform:scale(1.015)` 수준. 허브와 격차가 큼
4. **스크롤 리빌 없음**
5. **라이트 모드 미대응** — iframe이라 부모의 `html.light` 를 상속받지 못함
6. **02·04는 밝은 배경** — 어두운 흐름 중간에 흰 판이 튀어나옴

### 5-2. 내부 페이지 6개

`memo` `files` `briefing` `music` `settings` `todo`.
허브 대비 완성도가 낮습니다.

- **허브만큼의 밀도가 없음** — 허브는 히어로+카드3+투두+갤러리로 층위가 풍부한데,
  내부 페이지는 헤더 + 평면 리스트 구조
- **빈 상태(empty state) 디자인 부재** — 메모/파일이 없을 때의 화면이 밋밋함
- **로딩 상태 부재** — Firebase가 비동기 로드라 초기 진입 시 빈 화면 구간이 있음.
  스켈레톤/시머가 없음
- **settings 페이지**가 가장 손이 덜 감 — 기능 나열식
- **briefing / todo** 는 최근 작업되어 상대적으로 나음

### 5-3. 서브앱 4개 — 브랜드 일관성 붕괴

| 파일 | 팔레트 | 허브와 일치? |
|---|---|---|
| chord-dictionary.html | `--bg:#131313` `--acc:#ffb4a2` `--warm:#FF3B00` | ✅ 거의 일치 |
| code-editor.html | `--bg:#0e0e0e` `--acc:#ffb4a2` | ✅ 거의 일치 |
| **pitch-trainer.html** | `--bg:#FBF7F0` 크림 / `--acc:#FF7A4D` 주황 | ❌ **완전히 다른 앱처럼 보임** |
| **quotes.html** | `#f9f6f1` 배경, 스타일링 거의 없음 | ❌ **디폴트 스타일 수준, 미완성** |

pitch-trainer는 밝은 크림 테마 + 다른 주황 액센트라,
어두운 허브에서 진입하면 시각적 단절이 큽니다.
quotes.html은 사실상 스타일링이 안 된 상태입니다.

### 5-4. 전환 (transition) 격차

- 허브 → 내부 페이지: 베일 스윕이 있음 ✅
- 허브 → 서브앱(`#musicAppView`): 그냥 나타남 ❌
- 갤러리 → 라이트박스 / 모바일 확대: 팝 애니메이션은 있으나 허브 언어와 다름 △
- PIN 오버레이 진입/이탈: 단순 △

---

## 6. 요청 — 전체 방향

### 대원칙
1. **하나의 디자인 언어** — 허브·내부 페이지·갤러리·서브앱이 "한 제품"으로 읽혀야 함
2. **개성 보존** — 갤러리 5개의 레이아웃 컨셉(에디토리얼/콜라주/무드보드/아카이브/그리드)은
   그 자체가 가치. "5개의 다른 사이트"가 아니라 **"한 매거진의 5개 섹션"** 으로
3. **허브에는 모션을 더 얹지 말 것** — 이미 과밀. 필요하면 **정리·통합**을 제안
4. **깊이 있는 정교함 > 화려한 신규 효과** — 이미 효과는 충분함.
   부족한 건 타이밍 일관성, 여백 리듬, 상태 표현(로딩/빈 상태), 전환의 연속성

---

## 7. 요청 — 영역별 상세

### 7-1. 디자인 시스템 정리 (선행 작업)

지금 토큰이 있긴 하지만 완전하지 않습니다. 다음을 정의해 주세요:

- **여백 스케일** — 현재 Tailwind 유틸리티와 인라인 값이 섞여 있음.
  `--mk-sp-1 ~ --mk-sp-8` 같은 공통 스케일 정의
- **타이포 스케일** — 헤드라인/타이틀/서브/본문/캡션/라벨 6단계, `clamp()` 기반 반응형
- **그림자 스케일** — 현재 `0 12px 28px rgba(0,0,0,.35)` 류가 산발적
- **보더 반경 스케일** — 현재 10/12/14/16/18/20/22px 이 혼재
- **상태 색** — 성공/경고/오류가 정의되지 않음 (`#2dd4a0` 이 서브앱에만 있음)
- **z-index 레이어 맵** — 현재 0/1/10/55/60/105/110/120/9999/10001/10002 가 산발적.
  명명된 층위로 정리

**출력**: 기존 `:root` 를 대체할 완성된 토큰 블록 + 라이트 모드 대응분.

### 7-2. 갤러리 5개 일체화

**공유 토큰 레이어**
5개 파일에 공통 주입할 CSS 블록 설계:
- 이징·듀레이션을 허브 토큰으로 통일
- **액센트 정규화** — 각 갤러리의 레드를 허브 액센트와 조화되게 재조정.
  고유 색조는 남기되 **같은 계열로 수렴** (예: 허브 레드의 명도/채도 변주로 재정의)
- **캡션·라벨·번호 타이포 통일** — Space Grotesk uppercase `.2em` 계열로.
  단 **컨셉 폰트(Playfair, Caveat, Courier Prime, La Belle Aurore)는 유지** — 그게 개성
- 슬롯 간 여백을 공통 스케일로

**인터랙션 (허브 수준으로)**
- 스크롤 리빌 — 사진 슬롯 순차 등장, 허브와 동일한 타이밍·이징
- 사진 슬롯 hover — 현재 `scale(1.015)` 뿐.
  허브의 스포트라이트/글로우 보더 언어를 사진에 맞게 번역
  (커서 근접 보더 하이라이트, 미세 패럴랙스, 캡션 슬라이드 인)
- 사진 로딩 전환 — 이미지 들어올 때 페이드/스케일 인
- 스크롤 위치 기반 활성 슬롯 강조
- **모바일 대체 인터랙션** — hover 없는 환경에서 스크롤 기반 활성화

주의: 갤러리는 iframe 안. **커스텀 커서·전역 오버레이는 부모 담당.**
갤러리 안에 커서를 또 만들지 마세요.

**밝은 갤러리 통합 (02·04)**
밝은 페이퍼 질감이 그 갤러리의 컨셉이므로 그냥 어둡게 칠하는 건 답이 아님.
어두운 흐름 안에서 **의도된 대비**로 읽히게 하는 처리 제안
(진입/이탈 그라데이션, 프레임, 비네트, 상하 페이드 등).

**라이트 모드 전파**
iframe은 부모 클래스를 상속받지 못함.
→ 기존 `mk_unlock` 과 같은 패턴으로 테마 전달 메시지를 설계하고,
갤러리별 라이트 모드 팔레트를 정의해 주세요.

### 7-3. 내부 페이지 6개 강화

- **빈 상태 디자인** — 메모/파일/할일이 없을 때의 화면.
  단순 "없음" 텍스트가 아니라 브랜드에 맞는 일러스트/타이포 구성
- **로딩 스켈레톤** — Firebase 비동기 로드 구간을 시머로 채움.
  허브 카드·리스트·폴더 그리드용 3종
- **settings 페이지 재구성** — 현재 기능 나열식. 그룹핑 + 시각 계층 부여
- **각 페이지의 밀도 보강** — 헤더 + 평면 리스트를 넘어서는 층위.
  단, 개인용 앱이므로 **정보 밀도를 억지로 늘리지 말고 여백과 타이포로**
- **폼/입력 요소 정교화** — `.mk-input` `.mk-textarea` `.app-search-wrap` 의
  포커스/에러/성공 상태

### 7-4. 서브앱 브랜드 통합

- **pitch-trainer.html** — 가장 시급. 크림 테마(`#FBF7F0`/`#FF7A4D`)를
  허브 다크 팔레트로 재설계. 단 이 앱은 **학습 도구**라 가독성·집중이 우선.
  다크로 옮기되 눈이 편한 대비를 유지해 주세요.
  (`body{height:100dvh;overflow:hidden}` + `.app{height:100%}` + `.sc{flex:1;overflow-y:auto}` 구조 유지)
- **quotes.html** — 사실상 미스타일 상태. 허브 언어로 전면 스타일링.
  명언 카드 97개 그리드 → 에디토리얼 타이포 중심으로
- **chord-dictionary / code-editor** — 이미 팔레트는 맞음.
  모션 토큰 통일 + 인터랙션 디테일만 보강

### 7-5. 전환 연속성

- **허브 → 서브앱(`#musicAppView`) 진입/이탈** — 현재 그냥 나타남.
  베일 스윕과 같은 언어로 통일
- **라이트박스 / 모바일 확대 모달** — 허브 전환 언어와 통일
- **PIN 오버레이** — 진입/이탈 모션
- 전환 전체를 **하나의 이징 체계**로: 무엇을 `--mk-ease` 로, 무엇을 베일 이징으로 쓸지 규칙화

### 7-6. 허브 — 추가가 아니라 정리

허브는 이미 효과가 많습니다. 다음을 검토해 주세요:
- 동시에 도는 효과 중 **서로 상쇄되거나 소음이 되는 조합**이 있는지
  (예: aurora + dust + moss 캔버스 3개가 동시 렌더)
- 모바일에서 꺼야 할 것 / 데스크탑 전용으로 남길 것의 경계
- 효과 간 **위계** — 지금은 다 같은 강도로 존재. 무엇이 주연이고 무엇이 배경인지

---

## 8. 산출물 형식

1. **전체 디자인 방향 요약** — 무엇을 통일하고 무엇을 남기는지 (1~2페이지)
2. **완성된 디자인 토큰 블록** — 기존 `:root` 대체분 + 라이트 모드
3. **영역별 패치** — 파일별로 "어떤 CSS/JS를 추가·교체" 인지 명확히.
   **전체 파일 재작성이 아니라 추가·교체 단위로.** 기존 배선을 보존해야 하므로
4. **공유 모듈 제안** — 갤러리 5개가 공유할 `gallery-motion.js` 같은 형태 (바닐라 JS)
5. **index.html 변경 지점** — 행 번호대와 함께
6. **적용 순서** — 무엇부터 하면 중간에 깨지지 않는지 (단계별)
7. **검증 방법** — 각 단계에서 눈으로 무엇을 확인해야 하는지

---

## 9. 제약 요약 / 하지 말 것

**제약**
- 빌드 도구 없음. 순수 HTML/CSS/JS
- 외부 JS 라이브러리 불가 (CSP 차단) — §2-8 참조
- Tailwind는 CDN으로 이미 로드됨 (index.html, 2picture, 4picture, 5picture에서 사용 중)
- index.html이 386KB 단일 파일. 캔버스 애니메이션 2개가 이미 상시 렌더
- **모바일(iOS Safari) 성능 중요** — transform/opacity 위주,
  레이아웃 리플로우 유발 금지, 동시 애니메이션 개수 관리
- `prefers-reduced-motion` 가드 필수
- 한국어 UI. 코드 주석도 한국어

**하지 말 것**
- 프레임워크·번들러·npm 도입 제안
- 외부 애니메이션 라이브러리 (GSAP, Lenis, Framer Motion, Three.js …)
- 허브에 새 모션 효과 추가 (§4 목록 중복 제안)
- 갤러리 레이아웃 컨셉의 전면 재설계 (개성 보존이 요구사항)
- `MKPics` 키 · 프레임 ID · postMessage 타입 변경
- `origin` 체크 제거
- 갤러리 iframe 및 조상에 `will-change: transform`
- 전체 파일 통째 재작성 (기존 기능 배선이 사라짐)
- Firestore 접근을 동기 코드로 변경
